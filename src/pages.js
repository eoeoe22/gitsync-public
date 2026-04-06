export const layout = (title, body, script = '') => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | GitSync</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --bg-color: #0f172a;
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
      background: var(--bg-color);
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

    .commit-info { 
      flex: 1; 
      min-width: 0; 
      overflow-x: auto;
      scrollbar-width: none; /* Hide scrollbar for cleaner look, but still scrollable */
      -ms-overflow-style: none;
    }

    .commit-info::-webkit-scrollbar {
      display: none;
    }

    .commit-msg {
      font-size: 13px;
      color: var(--text-main);
      white-space: nowrap;
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

    .ai-summary-box {
      margin-top: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(192, 132, 252, 0.3);
      border-radius: 12px;
      display: none;
    }

    .ai-summary-header {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(192, 132, 252, 0.2);
      font-size: 14px;
      font-weight: 600;
      color: #c084fc;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-summary-content {
      padding: 12px 16px;
      font-size: 13px;
      color: var(--text-main);
      line-height: 1.7;
    }

    .ai-summary-content h1, .ai-summary-content h2, .ai-summary-content h3 {
      margin: 12px 0 6px;
      font-size: 14px;
      color: #c084fc;
    }

    .ai-summary-content p { margin-bottom: 8px; }

    .ai-summary-content ul, .ai-summary-content ol {
      margin: 4px 0 8px 18px;
    }

    .ai-summary-content code {
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
      padding: 1px 5px;
      font-family: monospace;
      font-size: 12px;
    }

    .ai-summary-content strong { color: #e2e8f0; }

    .ai-checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .ai-checkbox-row input[type="checkbox"] {
      width: auto;
      background: none;
      border: none;
      padding: 0;
      accent-color: #c084fc;
      cursor: pointer;
    }

    .ai-checkbox-row label {
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
      user-select: none;
    }

    .diff-text-box {
      margin-top: 16px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 12px;
      display: none;
    }

    .diff-text-header {
      padding: 10px 16px;
      border-bottom: 1px solid rgba(56, 189, 248, 0.2);
      font-size: 14px;
      font-weight: 600;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .diff-text-content {
      padding: 12px 16px;
      font-family: monospace;
      font-size: 11px;
      color: #a7f3d0;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 320px;
      overflow-y: auto;
    }

    .copy-btn {
      width: auto;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #38bdf8;
      cursor: pointer;
      box-shadow: none;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: rgba(56, 189, 248, 0.25);
      transform: none;
      box-shadow: none;
    }

    .copy-btn:active { transform: none; }

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
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
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
  <h1>로그인</h1>
  <p class="subtitle">GitSync</p>
  <div id="errorBox" class="error-msg"></div>
  <form id="loginForm">
    <div class="input-group">
      <label for="password">시스템 비밀번호</label>
      <input type="password" id="password" name="password" required placeholder="비밀번호를 입력하세요...">
    </div>
    <div class="turnstile-wrapper">
      <div class="cf-turnstile" data-sitekey="${siteKey}" data-theme="dark"></div>
    </div>
    <button type="submit" id="submitBtn">로그인</button>
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
      errBox.textContent = "Turnstile 인증을 완료해주세요.";
      errBox.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "인증 중...";
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
        throw new Error(data.message || '인증에 실패했습니다.');
      }
    } catch(e) {
      errBox.textContent = e.message;
      errBox.style.display = "block";
      btn.disabled = false;
      btn.textContent = "로그인";
      turnstile.reset();
    }
  });
</script>
`);

export const dashboardPage = () => layout('Dashboard', `
  <h1>GitSync</h1>
  <p class="subtitle">멀티 저장소 동기화 관리자</p>

  <div class="tab-bar" id="tabBar"></div>

  <div class="repo-info" id="repoInfo"></div>

  <div class="stats-card">
    <div class="stat-item">
      <div class="stat-val" id="uploadStat">-</div>
      <div class="stat-label">업로드</div>
    </div>
    <div class="stat-item">
      <div class="stat-val" id="deleteStat">-</div>
      <div class="stat-label">삭제</div>
    </div>
    <div class="stat-item">
      <div class="stat-val" id="statusStat">준비</div>
      <div class="stat-label">상태</div>
    </div>
  </div>

  <div class="input-group">
    <label for="commitMessage">커밋 메시지</label>
    <input type="text" id="commitMessage" placeholder="커밋 메시지 작성 (선택사항)">
  </div>

  <div class="ai-checkbox-row">
    <input type="checkbox" id="aiSummaryCheck" checked>
    <label for="aiSummaryCheck">Gemini AI 요약</label>
  </div>
  <div class="ai-checkbox-row">
    <input type="checkbox" id="diffTextCheck">
    <label for="diffTextCheck">Diff 텍스트 표시</label>
  </div>

  <div class="button-group">
    <button id="checkBtn" onclick="checkDiffs()" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); box-shadow: none;">변경사항 확인</button>
    <button id="syncBtn" onclick="startSync()">동기화</button>
  </div>

  <button id="logoutBtn" onclick="logout()" style="margin-top:12px; background: rgba(255,255,255,0.1); box-shadow:none;">로그아웃</button>

  <div class="diff-list" id="diffList">
    <div class="diff-header">
      <span>변경된 파일</span>
      <span id="diffCount" style="font-size: 12px; color: var(--text-muted);">0개 파일</span>
    </div>
    <div id="diffItems"></div>
  </div>

  <div class="ai-summary-box" id="aiSummaryBox">
    <div class="ai-summary-header">✦ AI 변경사항 요약</div>
    <div class="ai-summary-content" id="aiSummaryContent"></div>
  </div>

  <div class="diff-text-box" id="diffTextBox">
    <div class="diff-text-header">
      <span>⟩_ Diff 텍스트</span>
      <button class="copy-btn" onclick="copyDiffText()">클립보드 복사</button>
    </div>
    <div class="diff-text-content" id="diffTextContent"></div>
  </div>

  <div class="progress-container" id="progressContainer">
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" id="progressBar"></div>
    </div>
    <div class="progress-text" id="progressText">변경사항 분석 중...</div>
  </div>

  <div class="log-window" id="logWindow"></div>

  <div class="rollback-section" id="rollbackSection">
    <hr class="section-divider">
    <h2>버전 롤백 <span class="private-badge">비공개 전용</span></h2>
    <p class="subtitle">롤백할 커밋을 선택하세요. 비공개 저장소에 적용 후 동기화를 실행하면 공개 저장소에도 반영됩니다.</p>

    <div class="commit-list" id="commitList"></div>
    <button class="load-more-btn" id="loadMoreBtn" onclick="loadMoreCommits()" style="display:none;">더 보기</button>

    <button class="rollback-btn" id="rollbackBtn" onclick="startRollback()" disabled>선택한 버전으로 롤백</button>
    <div class="rollback-warning">비공개 저장소가 선택한 버전으로 덮어씌워집니다. 공개 저장소는 동기화를 실행하기 전까지 변경되지 않습니다.</div>
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
    document.getElementById('statusStat').textContent = '준비';
    document.getElementById('diffList').style.display = 'none';
    document.getElementById('diffItems').innerHTML = '';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressBar').style.background = '';
    document.getElementById('logWindow').style.display = 'none';
    document.getElementById('logWindow').innerHTML = '';
    document.getElementById('aiSummaryBox').style.display = 'none';
    document.getElementById('aiSummaryContent').textContent = '';
    document.getElementById('diffTextBox').style.display = 'none';
    document.getElementById('diffTextContent').textContent = '';

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
    btn.textContent = '확인 중...';
    diffList.style.display = 'none';
    diffItems.innerHTML = '';
    document.getElementById('aiSummaryBox').style.display = 'none';
    document.getElementById('aiSummaryContent').textContent = '';
    document.getElementById('diffTextBox').style.display = 'none';
    document.getElementById('diffTextContent').textContent = '';

    try {
      statusStat.textContent = '확인 중';
      pText.textContent = '변경사항 분석 중...';
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
      diffCount.textContent = total + '개 파일';

      if (total === 0) {
        pBar.style.width = '100%';
        pText.textContent = '변경사항이 없습니다.';
        statusStat.textContent = '동기화됨';
      } else {
        toUpload.forEach(f => {
          const item = document.createElement('div');
          item.className = 'diff-item';
          item.innerHTML = '<span class="diff-type type-upload">수정</span><span class="diff-path">' + f.path + '</span>';
          diffItems.appendChild(item);
        });

        toDelete.forEach(f => {
          const item = document.createElement('div');
          item.className = 'diff-item';
          item.innerHTML = '<span class="diff-type type-delete">삭제</span><span class="diff-path">' + f.path + '</span>';
          diffItems.appendChild(item);
        });

        diffList.style.display = 'block';
        pBar.style.width = '100%';
        pText.textContent = '분석 완료.';
        statusStat.textContent = '준비';

        const wantAI = document.getElementById('aiSummaryCheck').checked;
        const wantDiff = document.getElementById('diffTextCheck').checked;

        if (wantAI) {
          const summaryBox = document.getElementById('aiSummaryBox');
          const summaryContent = document.getElementById('aiSummaryContent');
          summaryContent.textContent = 'AI 요약 생성 중...';
          summaryBox.style.display = 'block';
          try {
            const summaryRes = await fetch('/api/sync/ai-summary', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ toUpload, toDelete, repoIndex: currentRepoIndex })
            });
            if (!summaryRes.ok) throw new Error(await summaryRes.text());
            const { summary } = await summaryRes.json();
            summaryContent.innerHTML = marked.parse(summary);
          } catch (aiErr) {
            summaryContent.textContent = 'AI 요약 실패: ' + aiErr.message;
          }
        }

        if (wantDiff) {
          const diffTextBox = document.getElementById('diffTextBox');
          const diffTextContent = document.getElementById('diffTextContent');
          diffTextContent.textContent = 'Diff 텍스트 생성 중...';
          diffTextBox.style.display = 'block';
          try {
            const diffRes = await fetch('/api/sync/diff-raw', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ toUpload, toDelete, repoIndex: currentRepoIndex })
            });
            if (!diffRes.ok) throw new Error(await diffRes.text());
            const { diff } = await diffRes.json();
            diffTextContent.textContent = diff;
          } catch (diffErr) {
            diffTextContent.textContent = 'Diff 생성 실패: ' + diffErr.message;
          }
        }
      }
    } catch (e) {
      alert('변경사항 확인 오류: ' + e.message);
      statusStat.textContent = '오류';
    } finally {
      btn.disabled = false;
      btn.textContent = '변경사항 확인';
    }
  }

  async function copyDiffText() {
    const text = document.getElementById('diffTextContent').textContent;
    const btn = document.querySelector('.copy-btn');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '복사됨!';
      setTimeout(() => { btn.textContent = '클립보드 복사'; }, 2000);
    } catch {
      btn.textContent = '복사 실패';
      setTimeout(() => { btn.textContent = '클립보드 복사'; }, 2000);
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
    btn.textContent = '동기화 중...';
    container.style.display = 'block';
    document.getElementById('logWindow').innerHTML = '';
    pBar.style.background = '';

    try {
      const cfg = repoConfigs[currentRepoIndex];
      log('"' + cfg.name + '" 동기화 시작 (' + cfg.privateRepo + ' -> ' + cfg.publicRepo + ')...');
      pText.textContent = '동기화 계획 생성 중...';
      pBar.style.width = '10%';
      statusStat.textContent = '계획 중';

      const planRes = await fetch('/api/sync/plan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ repoIndex: currentRepoIndex })
      });
      if (!planRes.ok) throw new Error(await planRes.text());
      const plan = await planRes.json();

      const { toUpload, toDelete, baseTreeSha } = plan;
      log('계획 생성 완료: ' + toUpload.length + '개 파일 업로드, ' + toDelete.length + '개 파일 삭제 예정.');

      document.getElementById('uploadStat').textContent = toUpload.length;
      document.getElementById('deleteStat').textContent = toDelete.length;

      if (toUpload.length === 0 && toDelete.length === 0) {
        pBar.style.width = '100%';
        pText.textContent = '저장소가 이미 동기화되어 있습니다!';
        statusStat.textContent = '동기화됨!';
        log('변경사항이 없습니다. 이미 최신 상태입니다.');
        btn.textContent = '동기화';
        btn.disabled = false;
        return;
      }

      statusStat.textContent = '업로드 중';
      const chunkSize = 10;
      let uploadedFiles = [];
      let totalToUpload = toUpload.length;

      for(let i = 0; i < totalToUpload; i += chunkSize) {
        const chunk = toUpload.slice(i, i + chunkSize);
        log('청크 ' + (Math.floor(i/chunkSize) + 1) + ' 업로드 중 (' + chunk.length + '개 파일)...');

        const perc = 10 + Math.floor((i / totalToUpload) * 80);
        pBar.style.width = perc + '%';
        pText.textContent = '파일 업로드 중 (' + i + '/' + totalToUpload + ')...';

        const upRes = await fetch('/api/sync/upload', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ repoIndex: currentRepoIndex, files: chunk })
        });
        if (!upRes.ok) throw new Error(await upRes.text());
        const upResult = await upRes.json();
        uploadedFiles.push(...upResult.uploaded);
      }

      log('모든 파일 업로드 완료.');
      pBar.style.width = '95%';
      pText.textContent = '변경사항 커밋 중...';
      statusStat.textContent = '커밋 중';

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
      pText.textContent = '동기화 완료!';
      statusStat.textContent = '성공!';
      log('커밋 성공. 동기화 완료!');

    } catch (e) {
      log('오류: ' + e.message);
      pText.textContent = '동기화 실패. 로그를 확인하세요.';
      pBar.style.background = 'var(--error)';
      statusStat.textContent = '실패';
    } finally {
      btn.textContent = '동기화';
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
    if (!confirm('비공개 저장소를 커밋 ' + shortSha + '으로 롤백하시겠습니까?\\n\\n동기화를 실행하면 공개 저장소에도 변경사항이 반영됩니다.')) {
      return;
    }

    const btn = document.getElementById('rollbackBtn');
    const container = document.getElementById('progressContainer');
    const pBar = document.getElementById('progressBar');
    const pText = document.getElementById('progressText');
    const statusStat = document.getElementById('statusStat');

    btn.disabled = true;
    btn.textContent = '롤백 중...';
    container.style.display = 'block';
    document.getElementById('logWindow').innerHTML = '';
    pBar.style.background = '';

    try {
      const cfg = repoConfigs[currentRepoIndex];
      log('"' + cfg.name + '" 롤백 시작 - 커밋 ' + shortSha + '으로 복원 중...');
      pText.textContent = '비공개 저장소에 롤백 커밋 중...';
      pBar.style.width = '50%';
      statusStat.textContent = '롤백 중';

      const res = await fetch('/api/sync/rollback/commit-to-private', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ repoIndex: currentRepoIndex, commitSha: selectedCommitSha })
      });
      if (!res.ok) throw new Error(await res.text());

      pBar.style.width = '100%';
      pText.textContent = '롤백 완료! 공개 저장소에 적용하려면 동기화를 실행하세요.';
      statusStat.textContent = '롤백됨!';
      log('비공개 저장소가 ' + shortSha + '으로 롤백되었습니다. 동기화를 실행하여 공개 저장소에 적용하세요.');

    } catch (e) {
      log('오류: ' + e.message);
      pText.textContent = '롤백 실패. 로그를 확인하세요.';
      pBar.style.background = 'var(--error)';
      statusStat.textContent = '실패';
    } finally {
      btn.textContent = '선택한 버전으로 롤백';
      btn.disabled = !selectedCommitSha;
    }
  }

  // Load configs on page load
  loadConfigs();
</script>
`);
