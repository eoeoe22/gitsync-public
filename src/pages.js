export const layout = (title, body, script = '') => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | GitSync</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      --glass-bg: rgba(255, 255, 255, 0.05);
      --glass-border: rgba(255, 255, 255, 0.1);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #6b21a8;
      --accent-hover: #9333ea;
      --success: #10b981;
      --error: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
    }

    .blob {
      position: absolute;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.6;
      animation: float 10s infinite ease-in-out alternate;
    }
    .blob-1 { top: -10%; left: -10%; width: 40vw; height: 40vw; background: #c084fc; border-radius: 50%; }
    .blob-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: #3b82f6; border-radius: 50%; animation-delay: -5s; }

    @keyframes float {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(20px) scale(1.05); }
    }

    .glass-panel {
      position: relative;
      z-index: 10;
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
      background: linear-gradient(to right, #e879f9, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p.subtitle {
      text-align: center;
      color: var(--text-muted);
      margin-bottom: 24px;
      font-size: 14px;
    }

    .input-group {
      margin-bottom: 24px;
      position: relative;
    }

    .input-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="password"], input[type="text"] {
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px 16px;
      color: white;
      font-size: 16px;
      outline: none;
      transition: all 0.2s;
    }

    input[type="password"]:focus, input[type="text"]:focus {
      border-color: #c084fc;
      box-shadow: 0 0 0 4px rgba(192, 132, 252, 0.1);
    }

    .turnstile-wrapper {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
      min-height: 65px;
    }

    button {
      width: 100%;
      background: linear-gradient(135deg, var(--accent), var(--accent-hover));
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(107, 33, 168, 0.4);
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(107, 33, 168, 0.6);
    }

    button:active {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .error-msg {
      color: var(--error);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
      display: none;
    }

    /* Tabs */
    .tab-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 4px;
    }

    .tab-btn {
      flex: 1;
      background: transparent;
      color: var(--text-muted);
      border: none;
      border-radius: 8px;
      padding: 10px 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: none;
      transition: all 0.2s;
      width: auto;
    }

    .tab-btn:hover {
      color: var(--text-main);
      transform: none;
      box-shadow: none;
    }

    .tab-btn.active {
      background: rgba(255,255,255,0.1);
      color: var(--text-main);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .repo-info {
      text-align: center;
      margin-bottom: 16px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .repo-info span {
      color: #c084fc;
      font-weight: 500;
    }

    .sync-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;
      margin-top: 8px;
    }

    .sync-tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
    }

    .sync-tag-exclude {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      text-decoration: line-through;
    }

    .stats-card {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-val {
      font-size: 24px;
      font-weight: 700;
      color: #38bdf8;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .progress-container {
      display: none;
      margin-top: 24px;
    }

    .progress-bar-bg {
      background: rgba(255,255,255,0.1);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #c084fc);
      width: 0%;
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }

    .log-window {
      margin-top: 20px;
      background: #000;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      height: 120px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #a7f3d0;
      overflow-y: auto;
      display: none;
    }

    .log-line {
      margin-bottom: 4px;
    }

    .diff-list {
      margin-top: 24px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
    }

    .diff-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--glass-border);
      font-size: 14px;
      font-weight: 600;
      color: #38bdf8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
    }

    .diff-item {
      padding: 10px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .diff-item:last-child {
      border-bottom: none;
    }

    .diff-type {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 700;
      flex-shrink: 0;
    }

    .type-upload { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .type-delete { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .diff-path {
      word-break: break-all;
      color: var(--text-main);
    }

    .button-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 12px;
    }

    /* Rollback styles */
    .section-divider {
      border: none;
      border-top: 1px solid var(--glass-border);
      margin: 28px 0 20px;
    }

    .rollback-section {
      display: none;
    }

    .rollback-section h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #f59e0b;
    }

    .rollback-section .subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .commit-list {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .commit-item {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .commit-item:last-child { border-bottom: none; }

    .commit-item:hover { background: rgba(255, 255, 255, 0.05); }

    .commit-item.selected {
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
    }

    .commit-radio {
      margin-top: 3px;
      accent-color: #f59e0b;
      flex-shrink: 0;
    }

    .commit-info { flex: 1; min-width: 0; }

    .commit-msg {
      font-size: 13px;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .commit-meta {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .commit-sha {
      font-family: monospace;
      color: #f59e0b;
      font-size: 11px;
    }

    .load-more-btn {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--glass-border);
      box-shadow: none;
      padding: 10px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .rollback-btn {
      background: linear-gradient(135deg, #b45309, #f59e0b) !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4) !important;
    }

    .rollback-btn:hover {
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.6) !important;
    }

    .rollback-warning {
      font-size: 11px;
      color: #f59e0b;
      text-align: center;
      margin-top: 8px;
    }

    .private-badge {
      display: inline-block;
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 4px;
    }
  </style>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="glass-panel">
    ${body}
  </div>
  ${script}
</body>
</html>`;

export const loginPage = (siteKey) => layout('Login', `
  <h1>Secure Access</h1>
  <p class="subtitle">Authenticate to access GitSync</p>
  <div id="errorBox" class="error-msg"></div>
  <form id="loginForm">
    <div class="input-group">
      <label for="password">System Password</label>
      <input type="password" id="password" name="password" required placeholder="Enter password...">
    </div>
    <div class="turnstile-wrapper">
      <div class="cf-turnstile" data-sitekey="${siteKey}" data-theme="dark"></div>
    </div>
    <button type="submit" id="submitBtn">Authenticate</button>
  </form>
`, `
<script>
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const errBox = document.getElementById('errorBox');
    const password = document.getElementById('password').value;
    const turnstileElem = document.querySelector('[name="cf-turnstile-response"]');
    const turnstileResponse = turnstileElem ? turnstileElem.value : '';

    if (!turnstileResponse) {
      errBox.textContent = "Please complete the Turnstile challenge.";
      errBox.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Authenticating...";
    errBox.style.display = "none";

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, 'cf-turnstile-response': turnstileResponse })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/';
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch(e) {
      errBox.textContent = e.message;
      errBox.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Authenticate";
      turnstile.reset();
    }
  });
</script>
`);

export const dashboardPage = () => layout('Dashboard', `
  <h1>GitSync</h1>
  <p class="subtitle">Multi-Repository Synchronization Manager</p>

  <div class="tab-bar" id="tabBar"></div>

  <div class="repo-info" id="repoInfo"></div>

  <div class="stats-card">
    <div class="stat-item">
      <div class="stat-val" id="uploadStat">-</div>
      <div class="stat-label">To Upload</div>
    </div>
    <div class="stat-item">
      <div class="stat-val" id="deleteStat">-</div>
      <div class="stat-label">To Delete</div>
    </div>
    <div class="stat-item">
      <div class="stat-val" id="statusStat">Ready</div>
      <div class="stat-label">Status</div>
    </div>
  </div>

  <div class="input-group">
    <label for="commitMessage">Commit Message</label>
    <input type="text" id="commitMessage" placeholder="Custom commit message (optional)">
  </div>

  <div class="button-group">
    <button id="checkBtn" onclick="checkDiffs()" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); box-shadow: none;">Check Differences</button>
    <button id="syncBtn" onclick="startSync()">Synchronize Now</button>
  </div>

  <button id="logoutBtn" onclick="logout()" style="margin-top:12px; background: rgba(255,255,255,0.1); box-shadow:none;">Logout</button>

  <div class="diff-list" id="diffList">
    <div class="diff-header">
      <span>Changed Files</span>
      <span id="diffCount" style="font-size: 12px; color: var(--text-muted);">0 files</span>
    </div>
    <div id="diffItems"></div>
  </div>

  <div class="progress-container" id="progressContainer">
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" id="progressBar"></div>
    </div>
    <div class="progress-text" id="progressText">Analyzing changes...</div>
  </div>

  <div class="log-window" id="logWindow"></div>

  <div class="rollback-section" id="rollbackSection">
    <hr class="section-divider">
    <h2>Version Rollback <span class="private-badge">Private Only</span></h2>
    <p class="subtitle">Select a commit to rollback the private repository. Run sync afterward to apply changes to the public repository.</p>

    <div class="commit-list" id="commitList"></div>
    <button class="load-more-btn" id="loadMoreBtn" onclick="loadMoreCommits()" style="display:none;">Load more commits</button>

    <button class="rollback-btn" id="rollbackBtn" onclick="startRollback()" disabled>Rollback to Selected Version</button>
    <div class="rollback-warning">This will overwrite the private repository to match the selected version. The public repository will NOT be changed until you run sync.</div>
  </div>
`, `
<script>
  let repoConfigs = [];
  let currentRepoIndex = 0;

  async function loadConfigs() {
    const res = await fetch('/api/sync/configs');
    repoConfigs = await res.json();
    renderTabs();
    selectRepo(0);
  }

  function renderTabs() {
    const tabBar = document.getElementById('tabBar');
    tabBar.innerHTML = '';
    repoConfigs.forEach((cfg, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === currentRepoIndex ? ' active' : '');
      btn.textContent = cfg.name;
      btn.onclick = () => selectRepo(i);
      tabBar.appendChild(btn);
    });
  }

  function selectRepo(index) {
    currentRepoIndex = index;
    const cfg = repoConfigs[index];

    // Update tab active state
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    // Show repo info
    const folders = cfg.syncFolders ? cfg.syncFolders.split(',').map(s => s.trim()).filter(Boolean) : [];
    const files = cfg.syncFiles ? cfg.syncFiles.split(',').map(s => s.trim()).filter(Boolean) : [];
    const excludeFolders = cfg.excludeFolders ? cfg.excludeFolders.split(',').map(s => s.trim()).filter(Boolean) : [];

    let infoHtml = '<span>' + cfg.privateRepo + '</span> &rarr; <span>' + cfg.publicRepo + '</span>';
    infoHtml += '<div class="sync-tags">';
    folders.forEach(f => { infoHtml += '<span class="sync-tag">' + f + '/</span>'; });
    files.forEach(f => { infoHtml += '<span class="sync-tag">' + f + '</span>'; });
    excludeFolders.forEach(f => { infoHtml += '<span class="sync-tag-exclude">' + f + '/</span>'; });
    infoHtml += '</div>';
    document.getElementById('repoInfo').innerHTML = infoHtml;

    // Reset stats
    document.getElementById('uploadStat').textContent = '-';
    document.getElementById('deleteStat').textContent = '-';
    document.getElementById('statusStat').textContent = 'Ready';
    document.getElementById('diffList').style.display = 'none';
    document.getElementById('diffItems').innerHTML = '';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressBar').style.background = '';
    document.getElementById('logWindow').style.display = 'none';
    document.getElementById('logWindow').innerHTML = '';

    // Reset and load rollback commits
    resetRollbackUI();
    loadRollbackCommits(1);
  }

  function log(msg) {
    const w = document.getElementById('logWindow');
    w.style.display = 'block';
    const div = document.createElement('div');
    div.className = 'log-line';
    div.textContent = '> ' + msg;
    w.appendChild(div);
    w.scrollTop = w.scrollHeight;
  }

  async function checkDiffs() {
    const btn = document.getElementById('checkBtn');
    const diffList = document.getElementById('diffList');
    const diffItems = document.getElementById('diffItems');
    const diffCount = document.getElementById('diffCount');
    const statusStat = document.getElementById('statusStat');
    const container = document.getElementById('progressContainer');
    const pBar = document.getElementById('progressBar');
    const pText = document.getElementById('progressText');

    btn.disabled = true;
    btn.textContent = 'Checking...';
    diffList.style.display = 'none';
    diffItems.innerHTML = '';

    try {
      statusStat.textContent = 'Checking';
      pText.textContent = 'Analyzing changes...';
      pBar.style.width = '30%';
      pBar.style.background = '';
      container.style.display = 'block';

      const planRes = await fetch('/api/sync/plan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ repoIndex: currentRepoIndex })
      });
      if (!planRes.ok) throw new Error(await planRes.text());
      const plan = await planRes.json();

      const { toUpload, toDelete } = plan;

      document.getElementById('uploadStat').textContent = toUpload.length;
      document.getElementById('deleteStat').textContent = toDelete.length;

      const total = toUpload.length + toDelete.length;
      diffCount.textContent = total + ' files';

      if (total === 0) {
        pBar.style.width = '100%';
        pText.textContent = 'No changes detected.';
        statusStat.textContent = 'Synced';
      } else {
        toUpload.forEach(f => {
          const item = document.createElement('div');
          item.className = 'diff-item';
          item.innerHTML = '<span class="diff-type type-upload">Update</span><span class="diff-path">' + f.path + '</span>';
          diffItems.appendChild(item);
        });

        toDelete.forEach(f => {
          const item = document.createElement('div');
          item.className = 'diff-item';
          item.innerHTML = '<span class="diff-type type-delete">Delete</span><span class="diff-path">' + f.path + '</span>';
          diffItems.appendChild(item);
        });

        diffList.style.display = 'block';
        pBar.style.width = '100%';
        pText.textContent = 'Analysis complete.';
        statusStat.textContent = 'Ready';
      }
    } catch (e) {
      alert('Error checking differences: ' + e.message);
      statusStat.textContent = 'Error';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Check Differences';
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
  }

  async function startSync() {
    const btn = document.getElementById('syncBtn');
    const container = document.getElementById('progressContainer');
    const pBar = document.getElementById('progressBar');
    const pText = document.getElementById('progressText');
    const statusStat = document.getElementById('statusStat');

    btn.disabled = true;
    btn.textContent = 'Sync in Progress...';
    container.style.display = 'block';
    document.getElementById('logWindow').innerHTML = '';
    pBar.style.background = '';

    try {
      const cfg = repoConfigs[currentRepoIndex];
      log('Starting sync for "' + cfg.name + '" (' + cfg.privateRepo + ' -> ' + cfg.publicRepo + ')...');
      pText.textContent = 'Generating sync plan...';
      pBar.style.width = '10%';
      statusStat.textContent = 'Planning';

      const planRes = await fetch('/api/sync/plan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ repoIndex: currentRepoIndex })
      });
      if (!planRes.ok) throw new Error(await planRes.text());
      const plan = await planRes.json();

      const { toUpload, toDelete, baseTreeSha } = plan;
      log('Plan generated: ' + toUpload.length + ' files to upload, ' + toDelete.length + ' files to delete.');

      document.getElementById('uploadStat').textContent = toUpload.length;
      document.getElementById('deleteStat').textContent = toDelete.length;

      if (toUpload.length === 0 && toDelete.length === 0) {
        pBar.style.width = '100%';
        pText.textContent = 'Repositories are already completely synced!';
        statusStat.textContent = 'Synced!';
        log('No changes detected. Everything is up to date.');
        btn.textContent = 'Synchronize Now';
        btn.disabled = false;
        return;
      }

      statusStat.textContent = 'Uploading';
      const chunkSize = 10;
      let uploadedFiles = [];
      let totalToUpload = toUpload.length;

      for(let i = 0; i < totalToUpload; i += chunkSize) {
        const chunk = toUpload.slice(i, i + chunkSize);
        log('Uploading chunk ' + (Math.floor(i/chunkSize) + 1) + ' (' + chunk.length + ' files)...');

        const perc = 10 + Math.floor((i / totalToUpload) * 80);
        pBar.style.width = perc + '%';
        pText.textContent = 'Uploading files (' + i + '/' + totalToUpload + ')...';

        const upRes = await fetch('/api/sync/upload', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ repoIndex: currentRepoIndex, files: chunk })
        });
        if (!upRes.ok) throw new Error(await upRes.text());
        const upResult = await upRes.json();
        uploadedFiles.push(...upResult.uploaded);
      }

      log('All files uploaded successfully.');
      pBar.style.width = '95%';
      pText.textContent = 'Committing changes...';
      statusStat.textContent = 'Committing';

      const commitMsg = document.getElementById('commitMessage').value;
      const commitRes = await fetch('/api/sync/commit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          repoIndex: currentRepoIndex,
          uploadedFiles,
          deletedFiles: toDelete,
          baseTreeSha,
          commitMessage: commitMsg
        })
      });
      if (!commitRes.ok) throw new Error(await commitRes.text());

      pBar.style.width = '100%';
      pText.textContent = 'Sync completed successfully!';
      statusStat.textContent = 'Success!';
      log('Commit successful. Sync complete!');

    } catch (e) {
      log('ERROR: ' + e.message);
      pText.textContent = 'Sync failed. See logs.';
      pBar.style.background = 'var(--error)';
      statusStat.textContent = 'Failed';
    } finally {
      btn.textContent = 'Synchronize Now';
      btn.disabled = false;
    }
  }

  // Rollback state
  let rollbackCommits = [];
  let rollbackPage = 1;
  let selectedCommitSha = null;

  async function loadRollbackCommits(page) {
    try {
      const res = await fetch('/api/sync/rollback/commits?repoIndex=' + currentRepoIndex + '&page=' + page);
      if (res.status === 403) {
        // Not a private repo - hide rollback section
        document.getElementById('rollbackSection').style.display = 'none';
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const commits = await res.json();

      document.getElementById('rollbackSection').style.display = 'block';

      if (page === 1) {
        rollbackCommits = commits;
        document.getElementById('commitList').innerHTML = '';
      } else {
        rollbackCommits.push(...commits);
      }

      const list = document.getElementById('commitList');
      commits.forEach(cm => {
        const div = document.createElement('div');
        div.className = 'commit-item';
        div.dataset.sha = cm.sha;
        const date = new Date(cm.date).toLocaleString();
        const shortSha = cm.sha.substring(0, 7);
        const msgFirst = cm.message.split('\\n')[0];
        div.innerHTML = '<input type="radio" name="rollbackCommit" class="commit-radio" value="' + cm.sha + '">'
          + '<div class="commit-info">'
          + '<div class="commit-msg">' + msgFirst + '</div>'
          + '<div class="commit-meta"><span class="commit-sha">' + shortSha + '</span> &middot; ' + cm.author + ' &middot; ' + date + '</div>'
          + '</div>';
        div.onclick = (e) => {
          if (e.target.type !== 'radio') {
            div.querySelector('input[type=radio]').checked = true;
          }
          document.querySelectorAll('.commit-item').forEach(el => el.classList.remove('selected'));
          div.classList.add('selected');
          selectedCommitSha = cm.sha;
          document.getElementById('rollbackBtn').disabled = false;
        };
        list.appendChild(div);
      });

      document.getElementById('loadMoreBtn').style.display = commits.length >= 20 ? 'block' : 'none';
    } catch (e) {
      console.error('Failed to load commits:', e);
      document.getElementById('rollbackSection').style.display = 'none';
    }
  }

  function loadMoreCommits() {
    rollbackPage++;
    loadRollbackCommits(rollbackPage);
  }

  function resetRollbackUI() {
    rollbackCommits = [];
    rollbackPage = 1;
    selectedCommitSha = null;
    document.getElementById('commitList').innerHTML = '';
    document.getElementById('rollbackBtn').disabled = true;
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('rollbackSection').style.display = 'none';
  }

  async function startRollback() {
    if (!selectedCommitSha) return;

    const shortSha = selectedCommitSha.substring(0, 7);
    if (!confirm('Are you sure you want to rollback the private repository to commit ' + shortSha + '?\\n\\nRun sync afterward to apply changes to the public repository.')) {
      return;
    }

    const btn = document.getElementById('rollbackBtn');
    const container = document.getElementById('progressContainer');
    const pBar = document.getElementById('progressBar');
    const pText = document.getElementById('progressText');
    const statusStat = document.getElementById('statusStat');

    btn.disabled = true;
    btn.textContent = 'Rolling back...';
    container.style.display = 'block';
    document.getElementById('logWindow').innerHTML = '';
    pBar.style.background = '';

    try {
      const cfg = repoConfigs[currentRepoIndex];
      log('Starting rollback for "' + cfg.name + '" to commit ' + shortSha + '...');
      pText.textContent = 'Committing rollback to private repository...';
      pBar.style.width = '50%';
      statusStat.textContent = 'Rolling back';

      const res = await fetch('/api/sync/rollback/commit-to-private', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ repoIndex: currentRepoIndex, commitSha: selectedCommitSha })
      });
      if (!res.ok) throw new Error(await res.text());

      pBar.style.width = '100%';
      pText.textContent = 'Rollback completed! Run sync to update the public repository.';
      statusStat.textContent = 'Rolled back!';
      log('Private repository rolled back to ' + shortSha + '. Run sync to apply to public repo.');

    } catch (e) {
      log('ERROR: ' + e.message);
      pText.textContent = 'Rollback failed. See logs.';
      pBar.style.background = 'var(--error)';
      statusStat.textContent = 'Failed';
    } finally {
      btn.textContent = 'Rollback to Selected Version';
      btn.disabled = !selectedCommitSha;
    }
  }

  // Load configs on page load
  loadConfigs();
</script>
`);
