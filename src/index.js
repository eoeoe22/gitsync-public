import { Hono } from 'hono';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { loginPage, dashboardPage } from './pages.js';
import { Github } from './github.js';
import { GoogleGenAI } from '@google/genai';
import { createTwoFilesPatch } from 'diff';

const app = new Hono();

function getRepoConfigs(env) {
    try {
        return JSON.parse(env.REPO_CONFIGS || '[]');
    } catch {
        return [];
    }
}

function getRepoConfig(env, index) {
    const configs = getRepoConfigs(env);
    if (index < 0 || index >= configs.length) {
        throw new Error(`Invalid repo index: ${index}`);
    }
    return configs[index];
}

app.get('/api/repos', async (c) => {
    const configs = getRepoConfigs(c.env);
    return c.json(configs.map((conf, index) => ({
        index,
        name: conf.name,
        privateRepo: conf.privateRepo,
        publicRepo: conf.publicRepo,
        syncFolders: conf.syncFolders,
        syncFiles: conf.syncFiles,
        excludeFolders: conf.excludeFolders
    })));
});

// Middleware to check authentication on /api/sync/*
app.use('/api/sync/*', async (c, next) => {
    const secret = c.env.SESSION_SECRET || 'default-secret-fallback-key-for-dev';
    const session = await getSignedCookie(c, secret, 'auth_session');
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

app.get('/', async (c) => {
    const secret = c.env.SESSION_SECRET || 'default-secret-fallback-key-for-dev';
    const session = await getSignedCookie(c, secret, 'auth_session');

    if (session) {
        return c.html(dashboardPage());
    }
    return c.html(loginPage(c.env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA'));
});

app.post('/api/login', async (c) => {
    const body = await c.req.json();
    const { password, 'cf-turnstile-response': turnstileToken } = body;

    const validPassword = c.env.PASSWORD || 'admin';
    if (password !== validPassword) {
        return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    // Verify Turnstile
    if (c.env.TURNSTILE_SECRET_KEY && c.env.TURNSTILE_SECRET_KEY !== '1x0000000000000000000000000000000AA') {
        const formData = new FormData();
        formData.append('secret', c.env.TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);
        formData.append('remoteip', c.req.header('CF-Connecting-IP') || '');

        const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });
        const result = await check.json();
        if (!result.success) {
            const errors = result['error-codes'] ? result['error-codes'].join(', ') : 'Unknown';
            return c.json({ success: false, message: `Turnstile verification failed (${errors})` }, 400);
        }
    }

    // Set signed cookie
    const secret = c.env.SESSION_SECRET || 'default-secret-fallback-key-for-dev';
    await setSignedCookie(c, 'auth_session', 'authenticated', secret, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
    });

    return c.json({ success: true });
});

app.post('/api/logout', (c) => {
    deleteCookie(c, 'auth_session', { path: '/' });
    return c.json({ success: true });
});

// Repo configs endpoint (protected by auth middleware pattern)
app.get('/api/sync/configs', async (c) => {
    const configs = getRepoConfigs(c.env);
    // Return config names and indices only (no secrets)
    return c.json(configs.map((cfg, i) => ({
        index: i,
        name: cfg.name,
        privateRepo: cfg.privateRepo,
        publicRepo: cfg.publicRepo,
        syncFolders: cfg.syncFolders,
        syncFiles: cfg.syncFiles,
        excludeFolders: cfg.excludeFolders
    })));
});

// Github Sync Endpoints //

app.post('/api/sync/plan', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const repoIndex = body.repoIndex ?? 0;
        const config = getRepoConfig(c.env, repoIndex);
        const gh = new Github(c.env);

        const priCommit = await gh.getLatestCommitSha(config.privateRepo, 'main');
        const pubCommit = await gh.getLatestCommitSha(config.publicRepo, 'main');

        const priTreeSha = await gh.getCommitTreeSha(config.privateRepo, priCommit);
        const pubTreeSha = await gh.getCommitTreeSha(config.publicRepo, pubCommit);

        const priTree = await gh.getTreeRecursive(config.privateRepo, priTreeSha);
        const pubTree = await gh.getTreeRecursive(config.publicRepo, pubTreeSha);

        // Use per-repo sync folders/files config
        const allowedFolders = (config.syncFolders || '').split(',').map(s => s.trim()).filter(Boolean);
        const allowedFiles = (config.syncFiles || '').split(',').map(s => s.trim()).filter(Boolean);
        const excludedFolders = (config.excludeFolders || '').split(',').map(s => s.trim()).filter(Boolean);
        const filterPaths = (item) => {
            const topLevel = item.path.split('/')[0];
            if (!allowedFolders.includes(topLevel) && !allowedFiles.includes(item.path)) return false;
            if (excludedFolders.some(ex => item.path === ex || item.path.startsWith(ex + '/'))) return false;
            return true;
        };

        const priFiles = priTree.filter(item => filterPaths(item) && item.type === 'blob');
        const pubFiles = pubTree.filter(item => filterPaths(item) && item.type === 'blob');

        const pubMap = new Map(pubFiles.map(f => [f.path, f.sha]));

        const toUpload = [];
        const keepPaths = new Set();

        priFiles.forEach(f => {
            keepPaths.add(f.path);
            if (pubMap.get(f.path) !== f.sha) {
                toUpload.push({ ...f, pubSha: pubMap.get(f.path) || null });
            }
        });

        const toDelete = pubFiles.filter(f => !keepPaths.has(f.path));

        return c.json({
            toUpload,
            toDelete,
            baseTreeSha: pubTreeSha
        });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

app.post('/api/sync/upload', async (c) => {
    try {
        const gh = new Github(c.env);
        const { repoIndex, files } = await c.req.json();
        const config = getRepoConfig(c.env, repoIndex ?? 0);

        const uploaded = [];

        for (const file of files) {
            const base64Content = await gh.getBlobBuffer(config.privateRepo, file.sha);
            const newSha = await gh.uploadBlob(config.publicRepo, base64Content);

            uploaded.push({
                path: file.path,
                mode: file.mode,
                type: file.type,
                sha: newSha
            });
        }

        return c.json({ uploaded });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

app.post('/api/sync/commit', async (c) => {
    try {
        const gh = new Github(c.env);
        const { repoIndex, uploadedFiles, deletedFiles, baseTreeSha, commitMessage } = await c.req.json();
        const config = getRepoConfig(c.env, repoIndex ?? 0);

        const treeUpdates = [];

        for (const f of uploadedFiles) {
            treeUpdates.push({
                path: f.path,
                mode: f.mode,
                type: f.type,
                sha: f.sha
            });
        }

        for (const f of deletedFiles) {
            treeUpdates.push({
                path: f.path,
                mode: f.mode,
                type: f.type,
                sha: null
            });
        }

        if (treeUpdates.length === 0) {
            return c.json({ success: true, message: 'No changes needed' });
        }

        const targetCommit = await gh.getLatestCommitSha(config.publicRepo, 'main');
        const newTreeSha = await gh.createTree(config.publicRepo, targetCommit, treeUpdates);

        const messageToUse = commitMessage && commitMessage.trim() !== ''
            ? commitMessage
            : 'Synced files from private repository\n\nAutomated via Cloudflare Workers Sync';

        const newCommitSha = await gh.createCommit(
            config.publicRepo,
            messageToUse,
            newTreeSha,
            targetCommit
        );

        await gh.updateRef(config.publicRepo, 'main', newCommitSha);

        return c.json({ success: true, commitSha: newCommitSha });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

// Shared diff-building helper //

function decodeBase64Text(b64) {
    try {
        const clean = b64.replace(/\s/g, '');
        const binaryStr = atob(clean);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        if (bytes.includes(0)) return null; // binary file
        return new TextDecoder('utf-8').decode(bytes);
    } catch {
        return null;
    }
}

async function buildDiffContent(gh, config, toUpload, maxFiles = 10, maxLines = 300) {
    const diffSections = [];

    for (const f of toUpload.slice(0, maxFiles)) {
        try {
            const newBase64 = await gh.getBlobBuffer(config.privateRepo, f.sha);
            const newText = decodeBase64Text(newBase64);

            if (newText === null) {
                diffSections.push(`=== ${f.path} (바이너리 파일, 내용 생략) ===`);
                continue;
            }

            if (f.pubSha) {
                const oldBase64 = await gh.getBlobBuffer(config.publicRepo, f.pubSha);
                const oldText = decodeBase64Text(oldBase64);
                
                const oldLines = oldText === null ? [] : oldText.split('\n');
                const newLines = newText.split('\n');

                const patch = createTwoFilesPatch(
                    f.path, f.path, 
                    oldLines.slice(0, maxLines).join('\n'), 
                    newLines.slice(0, maxLines).join('\n'),
                    '', '', { context: 3 }
                );
                
                // Remove the first 4 lines of the patch (header) and use our custom format
                const patchContent = patch.split('\n').slice(4).join('\n');
                if (patchContent.trim() === '') {
                    diffSections.push(`=== ${f.path} (수정됨) ===\n(변경 없음)`);
                } else {
                    diffSections.push(`=== ${f.path} (수정됨) ===\n${patchContent}`);
                }
            } else {
                const newLines = newText.split('\n');
                const shown = newLines.slice(0, maxLines);
                const tail = newLines.length > maxLines ? `\n... (이하 ${newLines.length - maxLines}줄 생략)` : '';
                
                const patch = createTwoFilesPatch(
                    '/dev/null', f.path,
                    '',
                    shown.join('\n'),
                    '', '', { context: 0 }
                );
                const patchContent = patch.split('\n').slice(4).join('\n');
                diffSections.push(`=== ${f.path} (새로 추가됨) ===\n${patchContent}${tail}`);
            }
        } catch (err) {
            diffSections.push(`=== ${f.path} (diff 생성 실패: ${err.message}) ===`);
        }
    }

    if (toUpload.length > maxFiles) {
        diffSections.push(`... 그 외 ${toUpload.length - maxFiles}개 파일은 내용 생략`);
    }

    return diffSections.join('\n\n');
}

// Consolidated Diff & Summary Endpoint //

app.post('/api/sync/diff-info', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const toUpload = body.toUpload ?? [];
        const toDelete = body.toDelete ?? [];
        const { repoIndex, wantAI, wantDiff, wantCommitMsg } = body;
        const config = getRepoConfig(c.env, repoIndex ?? 0);
        const gh = new Github(c.env);

        let diffContent = null;
        let summary = null;
        let summaryError = null;
        let diffText = null;
        let commitMessage = null;
        let commitMessageError = null;

        if (wantAI || wantDiff || wantCommitMsg) {
            diffContent = await buildDiffContent(gh, config, toUpload);
        }

        const diffLines = [
            ...toUpload.map(f => `[추가/수정] ${f.path}`),
            ...toDelete.map(f => `[삭제] ${f.path}`)
        ].join('\n');

        const apiKey = c.env.GEMINI_API_KEY;
        const model = c.env.GEMINI_MODEL || 'gemini-3-flash-preview';
        const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

        const callGemini = async (prompt, budget = 1024) => {
            if (!ai) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { thinkingConfig: { thinkingBudget: budget } }
            });
            return response.text;
        };

        const tasks = [];

        if (wantAI) {
            const prompt = `다음은 Git 저장소 동기화에서 발생한 변경사항입니다.\n\n[변경 파일 목록]\n${diffLines}\n\n[파일 내용 diff]\n${diffContent || '(변경사항 없음)'}\n\n위 변경사항을 한국어로 간결하게 요약해주세요. 어떤 파일들이 추가/수정/삭제되었는지, 그리고 전체적인 변경의 의미와 주요 내용 변화를 설명해주세요.`;
            tasks.push(
                callGemini(prompt, 1024)
                    .then(text => { summary = text; })
                    .catch(err => { summaryError = err.message; })
            );
        }

        if (wantCommitMsg) {
            const prompt = `다음은 Git 저장소 동기화에서 발생한 변경사항입니다.\n\n[변경 파일 목록]\n${diffLines}\n\n[파일 내용 diff]\n${diffContent || '(변경사항 없음)'}\n\n위 변경사항을 한 줄짜리 간결한 Git 커밋 메시지로 한국어로 작성해주세요. 요구사항:\n- 한 줄로만 작성 (50자 이내 권장)\n- 마침표, 따옴표, 설명, 머릿말 없이 커밋 메시지 본문만 출력\n- 동사형 서술(예: "로그인 폼 검증 로직 추가", "라우터 초기화 버그 수정")`;
            tasks.push(
                callGemini(prompt, 512)
                    .then(text => {
                        commitMessage = (text || '').trim().split('\n')[0].trim().replace(/^["'`]+|["'`]+$/g, '');
                    })
                    .catch(err => { commitMessageError = err.message; })
            );
        }

        await Promise.all(tasks);

        if (wantDiff) {
            const header = diffLines;
            const deletedSection = toDelete.length > 0
                ? `\n\n[삭제된 파일]\n${toDelete.map(f => `=== ${f.path} (삭제됨) ===`).join('\n')}`
                : '';

            diffText = `[변경 파일 목록]\n${header}${deletedSection}\n\n[파일 내용]\n${diffContent || '(변경사항 없음)'}`;
        }

        return c.json({ summary, summaryError, diff: diffText, commitMessage, commitMessageError });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

// Rollback Endpoints //

// Commit rolled-back state to private repository
app.post('/api/sync/rollback/commit-to-private', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const repoIndex = body.repoIndex ?? 0;
        const commitSha = body.commitSha;

        if (!commitSha) {
            return c.json({ error: 'commitSha is required' }, 400);
        }

        const config = getRepoConfig(c.env, repoIndex);
        const gh = new Github(c.env);

        // Only allow rollback for private repositories
        const repoInfo = await gh.getRepoInfo(config.privateRepo);
        if (!repoInfo.private) {
            return c.json({ error: 'Rollback is only available for private repositories' }, 403);
        }

        // Reuse the existing tree from the target commit (no re-upload needed)
        const treeSha = await gh.getCommitTreeSha(config.privateRepo, commitSha);
        const latestSha = await gh.getLatestCommitSha(config.privateRepo, 'main');

        const shortSha = commitSha.substring(0, 7);
        const newCommitSha = await gh.createCommit(
            config.privateRepo,
            `Rollback to version ${shortSha}\n\nRolled back via GitSync`,
            treeSha,
            latestSha
        );

        await gh.updateRef(config.privateRepo, 'main', newCommitSha);

        return c.json({ success: true, commitSha: newCommitSha });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

// List commits from private repo (for version selection)
app.get('/api/sync/rollback/commits', async (c) => {
    try {
        const repoIndex = parseInt(c.req.query('repoIndex') ?? '0');
        const page = parseInt(c.req.query('page') ?? '1');
        const config = getRepoConfig(c.env, repoIndex);
        const gh = new Github(c.env);

        // Only allow rollback for private repositories
        const repoInfo = await gh.getRepoInfo(config.privateRepo);
        if (!repoInfo.private) {
            return c.json({ error: 'Rollback is only available for private repositories' }, 403);
        }

        const commits = await gh.listCommits(config.privateRepo, 'main', page, 20);
        return c.json(commits.map(cm => ({
            sha: cm.sha,
            message: cm.commit.message,
            date: cm.commit.committer.date,
            author: cm.commit.author?.login || cm.commit.committer.name
        })));
    } catch (err) {
        return c.text(err.message, 500);
    }
});

export default app;
