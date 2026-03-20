import { Hono } from 'hono';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { loginPage, dashboardPage } from './pages.js';
import { Github } from './github.js';

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
                toUpload.push(f);
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

export default app;
