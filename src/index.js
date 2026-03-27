import { Hono } from 'hono';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { loginPage, dashboardPage } from './pages.js';
import { Github } from './github.js';
import { GoogleGenAI } from '@google/genai';

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

// LCS 기반 unified diff 생성 //

function computeLCS(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
            ops.unshift({ t: ' ', l: a[i - 1] }); i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            ops.unshift({ t: '+', l: b[j - 1] }); j--;
        } else {
            ops.unshift({ t: '-', l: a[i - 1] }); i--;
        }
    }
    return ops;
}

function formatUnifiedDiff(path, oldLines, newLines, ctx = 3) {
    const ops = computeLCS(oldLines, newLines);
    const changed = ops.reduce((acc, op, i) => { if (op.t !== ' ') acc.push(i); return acc; }, []);
    if (changed.length === 0) return null;

    const groups = [];
    let gs = -1, ge = -1;
    for (const idx of changed) {
        const from = Math.max(0, idx - ctx);
        const to = Math.min(ops.length - 1, idx + ctx);
        if (gs === -1) { gs = from; ge = to; }
        else if (from <= ge + 1) { ge = Math.max(ge, to); }
        else { groups.push([gs, ge]); gs = from; ge = to; }
    }
    groups.push([gs, ge]);

    const lines = [`--- ${path}`, `+++ ${path}`];
    for (const [s, e] of groups) {
        let oldLine = 1, newLine = 1;
        for (let i = 0; i < s; i++) {
            if (ops[i].t !== '+') oldLine++;
            if (ops[i].t !== '-') newLine++;
        }
        const slice = ops.slice(s, e + 1);
        const oldCount = slice.filter(o => o.t !== '+').length;
        const newCount = slice.filter(o => o.t !== '-').length;
        lines.push(`@@ -${oldLine},${oldCount} +${newLine},${newCount} @@`);
        slice.forEach(o => lines.push(o.t + o.l));
    }
    return lines.join('\n');
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
                if (oldText === null) {
                    const newLines = newText.split('\n').slice(0, maxLines);
                    diffSections.push(`=== ${f.path} (수정됨) ===\n${newLines.map(l => '+' + l).join('\n')}`);
                } else {
                    const unified = formatUnifiedDiff(
                        f.path,
                        oldText.split('\n').slice(0, maxLines),
                        newText.split('\n').slice(0, maxLines)
                    );
                    diffSections.push(`=== ${f.path} (수정됨) ===\n${unified ?? '(변경 없음)'}`);
                }
            } else {
                const newLines = newText.split('\n');
                const shown = newLines.slice(0, maxLines);
                const tail = newLines.length > maxLines ? `\n... (이하 ${newLines.length - maxLines}줄 생략)` : '';
                diffSections.push(`=== ${f.path} (새로 추가됨) ===\n--- /dev/null\n+++ ${f.path}\n@@ -0,0 +1,${shown.length} @@\n${shown.map(l => '+' + l).join('\n')}${tail}`);
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

// AI Summary Endpoint //

app.post('/api/sync/ai-summary', async (c) => {
    try {
        const { toUpload, toDelete, repoIndex } = await c.req.json();
        const apiKey = c.env.GEMINI_API_KEY;
        const model = c.env.GEMINI_MODEL || 'gemini-3-flash-preview';
        const config = getRepoConfig(c.env, repoIndex ?? 0);
        const gh = new Github(c.env);

        if (!apiKey) {
            return c.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, 500);
        }

        const ai = new GoogleGenAI({ apiKey });

        const diffLines = [
            ...toUpload.map(f => `[추가/수정] ${f.path}`),
            ...toDelete.map(f => `[삭제] ${f.path}`)
        ].join('\n');

        const diffContent = await buildDiffContent(gh, config, toUpload);

        const prompt = `다음은 Git 저장소 동기화에서 발생한 변경사항입니다.\n\n[변경 파일 목록]\n${diffLines}\n\n[파일 내용 diff]\n${diffContent}\n\n위 변경사항을 한국어로 간결하게 요약해주세요. 어떤 파일들이 추가/수정/삭제되었는지, 그리고 전체적인 변경의 의미와 주요 내용 변화를 설명해주세요.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });

        return c.json({ summary: response.text });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

// Raw Diff Text Endpoint //

app.post('/api/sync/diff-raw', async (c) => {
    try {
        const { toUpload, toDelete, repoIndex } = await c.req.json();
        const config = getRepoConfig(c.env, repoIndex ?? 0);
        const gh = new Github(c.env);

        const header = [
            ...toUpload.map(f => `[추가/수정] ${f.path}`),
            ...toDelete.map(f => `[삭제] ${f.path}`)
        ].join('\n');

        const diffContent = await buildDiffContent(gh, config, toUpload);

        const deletedSection = toDelete.length > 0
            ? `\n\n[삭제된 파일]\n${toDelete.map(f => `=== ${f.path} (삭제됨) ===`).join('\n')}`
            : '';

        return c.json({ diff: `[변경 파일 목록]\n${header}${deletedSection}\n\n[파일 내용]\n${diffContent}` });
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
