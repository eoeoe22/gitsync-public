import { Hono } from 'hono';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { loginPage, dashboardPage } from './pages.js';
import { Github } from './github.js';
import { GoogleGenAI } from '@google/genai';
import { createTwoFilesPatch } from 'diff';

const app = new Hono();

// IP 화이트리스트(시크릿 환경변수 IP_WHITELIST, 콤마로 구분)에 포함된 클라이언트인지 확인.
// 화이트리스트에 등록된 IP는 비밀번호 인증을 우회한다.
function isWhitelistedIp(c) {
    const raw = c.env.IP_WHITELIST;
    if (!raw) return false;

    const clientIp = c.req.header('CF-Connecting-IP');
    if (!clientIp) return false;

    const allowed = raw
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);

    return allowed.includes(clientIp);
}

// 유효한 세션 쿠키가 있거나, 화이트리스트 IP인 경우 인증된 것으로 간주.
async function isAuthenticated(c) {
    if (isWhitelistedIp(c)) return true;

    const secret = c.env.SESSION_SECRET || 'default-secret-fallback-key-for-dev';
    const session = await getSignedCookie(c, secret, 'auth_session');
    return Boolean(session);
}

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

function parseCsv(value) {
    return (value || '').split(',').map(s => s.trim()).filter(Boolean);
}

function createSyncPathFilter(config) {
    const allowedFolders = parseCsv(config.syncFolders);
    const allowedFiles = parseCsv(config.syncFiles);
    const excludedFolders = parseCsv(config.excludeFolders);

    return (item) => {
        const topLevel = item.path.split('/')[0];
        if (!allowedFolders.includes(topLevel) && !allowedFiles.includes(item.path)) return false;
        if (excludedFolders.some(ex => item.path === ex || item.path.startsWith(ex + '/'))) return false;
        return true;
    };
}

async function buildSyncPlan(gh, config) {
    const priCommit = await gh.getLatestCommitSha(config.privateRepo, 'main');
    const pubCommit = await gh.getLatestCommitSha(config.publicRepo, 'main');

    const priTreeSha = await gh.getCommitTreeSha(config.privateRepo, priCommit);
    const pubTreeSha = await gh.getCommitTreeSha(config.publicRepo, pubCommit);

    const priTree = await gh.getTreeRecursive(config.privateRepo, priTreeSha);
    const pubTree = await gh.getTreeRecursive(config.publicRepo, pubTreeSha);
    const filterPaths = createSyncPathFilter(config);

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

    return {
        toUpload,
        toDelete,
        baseTreeSha: pubTreeSha
    };
}

function countPlanChanges(plan) {
    return plan.toUpload.length + plan.toDelete.length;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
}

function formatChangedPath(path, prefix) {
    return `${prefix} ${truncateText(path, 110)}`;
}

function buildDiscordPayload(changedResults, errors, checkedAt) {
    const totalChanges = changedResults.reduce((sum, result) => sum + result.total, 0);
    const omittedRepos = Math.max(0, changedResults.length - 10);
    const contentParts = [
        `GitSync daily diff check found ${changedResults.length} out-of-sync repo(s), ${totalChanges} file change(s).`,
        `Checked at ${checkedAt} UTC.`
    ];

    if (omittedRepos > 0) {
        contentParts.push(`${omittedRepos} additional repo(s) omitted from this Discord message.`);
    }

    if (errors.length > 0) {
        contentParts.push(`${errors.length} repo check(s) failed; see Worker logs.`);
    }

    const embeds = changedResults.slice(0, 10).map(({ config, plan, total }) => {
        const changedFiles = [
            ...plan.toUpload.slice(0, 8).map(f => formatChangedPath(f.path, '+')),
            ...plan.toDelete.slice(0, 8).map(f => formatChangedPath(f.path, '-'))
        ];
        const omittedFiles = total - changedFiles.length;

        if (omittedFiles > 0) {
            changedFiles.push(`... ${omittedFiles} more`);
        }

        return {
            title: `${config.name || config.publicRepo} (${total} file change(s))`,
            description: [
                `Source: \`${config.privateRepo}\``,
                `Target: \`${config.publicRepo}\``,
                `Upload/update: **${plan.toUpload.length}**, delete: **${plan.toDelete.length}**`,
                changedFiles.length > 0 ? `\`\`\`diff\n${changedFiles.join('\n')}\n\`\`\`` : ''
            ].filter(Boolean).join('\n'),
            color: 0xf59e0b
        };
    });

    return {
        username: 'GitSync',
        content: truncateText(contentParts.join(' '), 2000),
        embeds
    };
}

async function sendDiscordWebhook(env, payload) {
    const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn('DISCORD_WEBHOOK_URL is not configured; skipping Discord notification.');
        return { sent: false, reason: 'missing_webhook_url' };
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Discord webhook failed: ${res.status} ${body}`);
    }

    return { sent: true };
}

async function runScheduledDiffCheck(env) {
    const configs = getRepoConfigs(env);
    const gh = new Github(env);
    const results = [];
    const errors = [];

    for (const [index, config] of configs.entries()) {
        try {
            const plan = await buildSyncPlan(gh, config);
            const total = countPlanChanges(plan);
            results.push({ index, config, plan, total });
        } catch (err) {
            console.error(`Scheduled diff check failed for repo index ${index}:`, err);
            errors.push({ index, config, error: err.message });
        }
    }

    const changedResults = results.filter(result => result.total > 0);
    if (changedResults.length === 0) {
        console.log('Scheduled diff check completed: all configured repos are in sync.');
        return { notified: false, changedRepos: 0, errors };
    }

    const checkedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const payload = buildDiscordPayload(changedResults, errors, checkedAt);
    const notification = await sendDiscordWebhook(env, payload);

    return {
        notified: notification.sent,
        changedRepos: changedResults.length,
        errors
    };
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
    if (!(await isAuthenticated(c))) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

app.get('/', async (c) => {
    if (await isAuthenticated(c)) {
        return c.html(dashboardPage());
    }
    return c.html(loginPage(c.env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA'));
});

app.post('/api/login', async (c) => {
    // 화이트리스트 IP는 비밀번호/Turnstile 검증을 건너뛰고 바로 세션을 발급한다.
    const whitelisted = isWhitelistedIp(c);

    const body = await c.req.json();
    const { password, 'cf-turnstile-response': turnstileToken } = body;

    if (!whitelisted) {
        const validPassword = c.env.PASSWORD || 'admin';
        if (password !== validPassword) {
            return c.json({ success: false, message: 'Invalid credentials' }, 401);
        }
    }

    // Verify Turnstile
    if (!whitelisted && c.env.TURNSTILE_SECRET_KEY && c.env.TURNSTILE_SECRET_KEY !== '1x0000000000000000000000000000000AA') {
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
        return c.json(await buildSyncPlan(gh, config));
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
        if (bytes.includes(0)) return null;
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        return null;
    }
}

function extractPatchBody(patch) {
    if (patch.startsWith('@@')) return patch;
    const idx = patch.indexOf('\n@@');
    if (idx === -1) return '';
    return patch.substring(idx + 1);
}

function truncatePatchBody(body, maxLines) {
    const lines = body.split('\n');
    if (lines.length <= maxLines) return body;
    const omitted = lines.length - maxLines;
    return `${lines.slice(0, maxLines).join('\n')}\n... (이하 ${omitted}줄 생략)`;
}

async function buildFileDiff(gh, config, f, maxLines, maxInputChars) {
    const [newBase64, oldBase64] = await Promise.all([
        gh.getBlobBuffer(config.privateRepo, f.sha),
        f.pubSha ? gh.getBlobBuffer(config.publicRepo, f.pubSha) : Promise.resolve(null)
    ]);

    const newText = decodeBase64Text(newBase64);
    if (newText === null) {
        return `=== ${f.path} (바이너리 파일, 내용 생략) ===`;
    }

    if (f.pubSha) {
        const oldText = decodeBase64Text(oldBase64);
        const oldStr = oldText === null ? '' : oldText;

        if (oldStr.length > maxInputChars || newText.length > maxInputChars) {
            return `=== ${f.path} (수정됨, 파일이 너무 커서 diff 생략) ===`;
        }

        const patch = createTwoFilesPatch(f.path, f.path, oldStr, newText, '', '', { context: 3 });
        const body = extractPatchBody(patch);
        if (body.trim() === '') {
            return `=== ${f.path} (수정됨) ===\n(변경 없음)`;
        }
        return `=== ${f.path} (수정됨) ===\n${truncatePatchBody(body, maxLines)}`;
    }

    if (newText.length > maxInputChars) {
        return `=== ${f.path} (새로 추가됨, 파일이 너무 커서 내용 생략) ===`;
    }

    const patch = createTwoFilesPatch('/dev/null', f.path, '', newText, '', '', { context: 0 });
    const body = extractPatchBody(patch);
    return `=== ${f.path} (새로 추가됨) ===\n${truncatePatchBody(body, maxLines)}`;
}

async function buildDiffContent(gh, config, toUpload, maxFiles = 10, maxLines = 300, maxInputChars = 200 * 1024) {
    const targets = toUpload.slice(0, maxFiles);

    const sections = await Promise.all(
        targets.map(f =>
            buildFileDiff(gh, config, f, maxLines, maxInputChars)
                .catch(err => `=== ${f.path} (diff 생성 실패: ${err.message}) ===`)
        )
    );

    if (toUpload.length > maxFiles) {
        sections.push(`... 그 외 ${toUpload.length - maxFiles}개 파일은 내용 생략`);
    }

    return sections.join('\n\n');
}

// Consolidated Diff & Summary Endpoint //

const AI_FALLBACK_CHAIN = [
    { provider: 'gemini', model: 'gemini-3.5-flash' },
    { provider: 'gemini', model: 'gemini-3.1-flash-lite-preview' },
    { provider: 'workers-ai', model: '@cf/google/gemma-4-26b-a4b-it' }
];

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
        let summaryFallbacks = [];
        let diffText = null;
        let commitMessage = null;
        let commitMessageError = null;
        let commitMsgFallbacks = [];

        if (wantAI || wantDiff || wantCommitMsg) {
            diffContent = await buildDiffContent(gh, config, toUpload);
        }

        const diffLines = [
            ...toUpload.map(f => `[추가/수정] ${f.path}`),
            ...toDelete.map(f => `[삭제] ${f.path}`)
        ].join('\n');

        const apiKey = c.env.GEMINI_API_KEY;
        const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;

        const callOne = async (modelInfo, prompt, budget) => {
            if (modelInfo.provider === 'workers-ai') {
                if (!c.env.AI) throw new Error('Workers AI 바인딩이 설정되지 않았습니다.');
                const response = await c.env.AI.run(modelInfo.model, {
                    messages: [{ role: 'user', content: prompt }]
                });
                const text = response.response
                    ?? response.result?.response
                    ?? response.choices?.[0]?.message?.content
                    ?? response.result?.choices?.[0]?.message?.content
                    ?? '';
                return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
            if (!gemini) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
            const response = await gemini.models.generateContent({
                model: modelInfo.model,
                contents: prompt,
                config: { thinkingConfig: { thinkingBudget: budget } }
            });
            return response.text;
        };

        const callAI = async (prompt, budget = 1024) => {
            const errors = [];
            const fallbacks = [];
            for (let i = 0; i < AI_FALLBACK_CHAIN.length; i++) {
                const modelInfo = AI_FALLBACK_CHAIN[i];
                console.log(`[AI] 시도 ${i + 1}/${AI_FALLBACK_CHAIN.length}: ${modelInfo.model}`);
                const hasNext = i + 1 < AI_FALLBACK_CHAIN.length;
                try {
                    const text = await callOne(modelInfo, prompt, budget);
                    if (text && text.trim()) {
                        console.log(`[AI] 성공: ${modelInfo.model}`);
                        return { text, fallbacks };
                    }
                    const reason = '빈 응답';
                    console.warn(`[AI] 빈 응답: ${modelInfo.model}${hasNext ? ' → 다음 모델로 전환' : ''}`);
                    errors.push(`${modelInfo.model}: ${reason}`);
                    if (hasNext) fallbacks.push({ model: modelInfo.model, reason, next: AI_FALLBACK_CHAIN[i + 1].model });
                } catch (err) {
                    const reason = err.message;
                    console.warn(`[AI] 실패: ${modelInfo.model} — ${reason}${hasNext ? ' → 다음 모델로 전환' : ''}`);
                    errors.push(`${modelInfo.model}: ${reason}`);
                    if (hasNext) fallbacks.push({ model: modelInfo.model, reason, next: AI_FALLBACK_CHAIN[i + 1].model });
                }
            }
            console.error(`[AI] 모든 모델 실패 — ${errors.join(' | ')}`);
            throw new Error(`모든 모델 실패 — ${errors.join(' | ')}`);
        };

        const tasks = [];

        if (wantAI) {
            const prompt = `다음은 Git 저장소 동기화에서 발생한 변경사항입니다.\n\n[변경 파일 목록]\n${diffLines}\n\n[파일 내용 diff]\n${diffContent || '(변경사항 없음)'}\n\n위 변경사항을 한국어로 간결하게 요약해주세요. 어떤 파일들이 추가/수정/삭제되었는지, 그리고 전체적인 변경의 의미와 주요 내용 변화를 설명해주세요.`;
            tasks.push(
                callAI(prompt, 1024)
                    .then(({ text, fallbacks }) => { summary = text; summaryFallbacks = fallbacks; })
                    .catch(err => { summaryError = err.message; })
            );
        }

        if (wantCommitMsg) {
            const prompt = `다음은 Git 저장소 동기화에서 발생한 변경사항입니다.\n\n[변경 파일 목록]\n${diffLines}\n\n[파일 내용 diff]\n${diffContent || '(변경사항 없음)'}\n\n위 변경사항을 한 줄짜리 간결한 Git 커밋 메시지로 한국어로 작성해주세요. 요구사항:\n- 한 줄로만 작성 (50자 이내 권장)\n- 마침표, 따옴표, 설명, 머릿말 없이 커밋 메시지 본문만 출력\n- 동사형 서술(예: "로그인 폼 검증 로직 추가", "라우터 초기화 버그 수정")`;
            tasks.push(
                callAI(prompt, 512)
                    .then(({ text, fallbacks }) => {
                        commitMessage = (text || '').trim().split('\n')[0].trim().replace(/^["'`]+|["'`]+$/g, '');
                        commitMsgFallbacks = fallbacks;
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

        return c.json({ summary, summaryError, summaryFallbacks, diff: diffText, commitMessage, commitMessageError, commitMsgFallbacks });
    } catch (err) {
        return c.text(err.message, 500);
    }
});

// Directory Tree Extraction //

// Files essential for understanding the overall project structure (cloudwiki).
const ESSENTIAL_FILES = [
    'COMMON.md',
    'astro.config.mjs',
    'vite.config.ts',
    'wrangler example.toml',
    'migrations/schema.sql',
    'package.json',
];

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function buildTreeText(items, fileDetails) {
    const root = Object.create(null);
    for (const item of items) {
        const parts = item.path.split('/');
        let node = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            if (!node[part]) {
                node[part] = { type: isLast ? item.type : 'tree', path: item.path, children: Object.create(null) };
            } else if (isLast) {
                node[part].type = item.type;
                node[part].path = item.path;
            }
            node = node[part].children;
        }
    }

    const lines = [];
    const walk = (node, prefix) => {
        const keys = Object.keys(node).sort((a, b) => {
            const aIsDir = node[a].type === 'tree';
            const bIsDir = node[b].type === 'tree';
            if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
            return a.localeCompare(b);
        });
        keys.forEach((key, idx) => {
            const isLast = idx === keys.length - 1;
            const branch = isLast ? '└── ' : '├── ';
            const isDir = node[key].type === 'tree';
            let label = key + (isDir ? '/' : '');
            if (!isDir && fileDetails) {
                const detail = fileDetails.get(node[key].path);
                if (detail) {
                    label += ` (${detail.size})`;
                }
            }
            lines.push(prefix + branch + label);
            walk(node[key].children, prefix + (isLast ? '    ' : '│   '));
        });
    };
    walk(root, '');
    return lines.join('\n');
}

async function buildTreeResult(gh, repo, showDetails, includeEssential) {
    const repoInfo = await gh.getRepoInfo(repo);
    const branch = repoInfo.default_branch || 'main';

    const commitSha = await gh.getLatestCommitSha(repo, branch);
    const treeSha = await gh.getCommitTreeSha(repo, commitSha);
    const tree = await gh.getTreeRecursive(repo, treeSha);

    const blobs = tree.filter(t => t.type === 'blob');
    const fileCount = blobs.length;
    const dirCount = tree.filter(t => t.type === 'tree').length;

    let fileDetails = null;
    let totalSize = null;

    if (showDetails) {
        fileDetails = new Map(blobs.map(f => [f.path, { size: formatBytes(f.size ?? 0) }]));
        totalSize = formatBytes(blobs.reduce((sum, f) => sum + (f.size ?? 0), 0));
    }

    const firstLine = showDetails && totalSize
        ? `${repo} (${totalSize})`
        : `${repo}/`;

    let essentialText = '';
    let essentialCount = 0;
    if (includeEssential) {
        const found = ESSENTIAL_FILES
            .map(p => blobs.find(b => b.path === p))
            .filter(Boolean);
        const sections = await Promise.all(found.map(async (f) => {
            const text = decodeBase64Text(await gh.getBlobBuffer(repo, f.sha));
            return `===== ${f.path} =====\n${text ?? '(바이너리 또는 디코딩 실패)'}`;
        }));
        essentialCount = found.length;
        if (sections.length) essentialText = '\n\n' + sections.join('\n\n');
    }

    const treeText = `${firstLine}\n${buildTreeText(tree, fileDetails)}${essentialText}`;

    return { repo, branch, fileCount, dirCount, tree: treeText, totalSize, essentialCount };
}

// List all repositories owned by the configured GitHub account
app.get('/api/sync/repos-list', async (c) => {
    try {
        const gh = new Github(c.env);
        const repos = await gh.listAllRepos();
        return c.json(repos.map(r => ({
            name: r.name,
            private: r.private,
            defaultBranch: r.default_branch,
            updatedAt: r.updated_at
        })));
    } catch (err) {
        return c.text(err.message, 500);
    }
});

// Extract directory tree for an arbitrary repository by name
app.post('/api/sync/extract-tree', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const repo = body.repo;
        const showDetails = body.showDetails ?? false;
        const includeEssential = (body.includeEssential ?? false) && showDetails;
        if (!repo) return c.text('repo is required', 400);
        const gh = new Github(c.env);
        return c.json(await buildTreeResult(gh, repo, showDetails, includeEssential));
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

export default {
    fetch(request, env, ctx) {
        return app.fetch(request, env, ctx);
    },

    scheduled(controller, env, ctx) {
        ctx.waitUntil(runScheduledDiffCheck(env));
    }
};
