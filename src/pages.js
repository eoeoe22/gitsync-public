export const layout = (title, body, script = '') => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | GitSync</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-2: #273449;
      --border: #334155;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #7c3aed;
      --accent-hover: #6d28d9;
      --info: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .blob { display: none; }

    .glass-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 32px;
      width: 100%;
      max-width: 850px;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 8px;
      color: var(--text-main);
    }

    p.subtitle {
      text-align: center;
      color: var(--text-muted);
      margin-bottom: 24px;
      font-size: 14px;
    }

    .input-group {
      margin-bottom: 20px;
      position: relative;
    }

    .input-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="password"], input[type="text"] {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px 14px;
      color: var(--text-main);
      font-size: 15px;
      outline: none;
      transition: border-color 0.15s;
    }

    input[type="password"]:focus, input[type="text"]:focus {
      border-color: var(--accent);
    }

    .turnstile-wrapper {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
      min-height: 65px;
    }

    button {
      width: 100%;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 12px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    button:hover {
      background: var(--accent-hover);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-msg {
      color: var(--error);
      background: var(--surface-2);
      border: 1px solid var(--error);
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 13px;
      text-align: center;
      display: none;
    }

    /* Repository Selection */
    .repo-select-group {
      margin-bottom: 20px;
    }

    .repo-select-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    select {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px 14px;
      color: var(--text-main);
      font-size: 15px;
      font-weight: 500;
      outline: none;
      appearance: none;
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 16px;
      transition: border-color 0.15s;
    }

    select:hover, select:focus {
      border-color: var(--accent);
    }

    select option {
      background-color: var(--surface);
      color: var(--text-main);
      padding: 10px;
    }

    .repo-info {
      text-align: center;
      margin-bottom: 16px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .repo-info span {
      color: var(--text-main);
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
      border-radius: 3px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }

    .sync-tag-exclude {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 3px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--error);
      text-decoration: line-through;
    }

    .stats-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-val {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-main);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .progress-container {
      display: none;
      margin-top: 20px;
    }

    .progress-bar-bg {
      background: var(--surface-2);
      border: 1px solid var(--border);
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent);
      width: 0%;
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }

    .log-window {
      margin-top: 16px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      height: 120px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      color: var(--text-main);
      overflow-y: auto;
      display: none;
    }

    .log-line {
      margin-bottom: 4px;
    }

    .diff-list {
      margin-top: 20px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
    }

    .diff-header {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: var(--surface-2);
    }

    .diff-item {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
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
      border-radius: 3px;
      text-transform: uppercase;
      font-weight: 600;
      flex-shrink: 0;
    }

    .type-upload { background: var(--surface); border: 1px solid var(--success); color: var(--success); }
    .type-delete { background: var(--surface); border: 1px solid var(--error); color: var(--error); }

    .diff-path {
      word-break: break-all;
      color: var(--text-main);
    }

    .button-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 12px;
    }

    /* Rollback styles */
    .section-divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 24px 0 16px;
    }

    .rollback-section {
      display: none;
    }

    .rollback-section h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--warning);
    }

    .rollback-section .subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .commit-list {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 12px;
    }

    .commit-item {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background-color 0.15s;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .commit-item:last-child { border-bottom: none; }

    .commit-item:hover { background: var(--surface); }

    .commit-item.selected {
      background: var(--surface);
      border-left: 3px solid var(--warning);
    }

    .commit-radio {
      margin-top: 3px;
      accent-color: var(--warning);
      flex-shrink: 0;
    }

    .commit-info {
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
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
      color: var(--warning);
      font-size: 11px;
    }

    .load-more-btn {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 10px;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .load-more-btn:hover {
      background: var(--surface);
    }

    .rollback-btn {
      background: var(--warning) !important;
      color: #0f172a !important;
    }

    .rollback-btn:hover {
      background: #d97706 !important;
    }

    .rollback-warning {
      font-size: 11px;
      color: var(--warning);
      text-align: center;
      margin-top: 8px;
    }

    .ai-summary-box {
      margin-top: 16px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      display: none;
    }

    .ai-summary-header {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-summary-content {
      padding: 12px 14px;
      font-size: 13px;
      color: var(--text-main);
      line-height: 1.7;
    }

    .ai-summary-content h1, .ai-summary-content h2, .ai-summary-content h3 {
      margin: 12px 0 6px;
      font-size: 14px;
      color: var(--text-main);
    }

    .ai-summary-content p { margin-bottom: 8px; }

    .ai-summary-content ul, .ai-summary-content ol {
      margin: 4px 0 8px 18px;
    }

    .ai-summary-content code {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 5px;
      font-family: monospace;
      font-size: 12px;
    }

    .ai-summary-content strong { color: var(--text-main); }

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
      accent-color: var(--accent);
      cursor: pointer;
    }

    .ai-checkbox-row label {
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
      user-select: none;
    }

    .ai-checkbox-sub {
      margin-left: 24px;
    }

    .ai-checkbox-row input[type="checkbox"]:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .ai-checkbox-row input[type="checkbox"]:disabled + label {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .diff-text-box {
      margin-top: 16px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 4px;
      display: none;
    }

    .diff-text-header {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .diff-text-content {
      padding: 12px 14px;
      font-family: monospace;
      font-size: 11px;
      color: var(--text-main);
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 320px;
      overflow-y: auto;
    }

    .copy-btn {
      width: auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-main);
      cursor: pointer;
    }

    .copy-btn:hover {
      background: var(--bg);
    }

    .btn-secondary {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-main);
    }

    .btn-secondary:hover {
      background: var(--surface);
    }

    .btn-info {
      background: var(--surface-2);
      border: 1px solid var(--info);
      color: var(--info);
    }

    .btn-info:hover {
      background: var(--surface);
    }

    .mt-12 { margin-top: 12px; }

    .private-badge {
      display: inline-block;
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 3px;
      background: var(--surface);
      border: 1px solid var(--warning);
      color: var(--warning);
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 4px;
    }

    .tab-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }

    .tab-btn {
      width: auto;
      flex: 1;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
    }

    .tab-btn:hover {
      background: none;
      color: var(--text-main);
    }

    .tab-btn.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
  </style>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
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

  <div class="tab-bar">
    <button type="button" class="tab-btn active" id="tabBtn-sync" onclick="switchTab('sync')">동기화</button>
    <button type="button" class="tab-btn" id="tabBtn-extract" onclick="switchTab('extract')">디렉토리 추출</button>
    <button type="button" class="tab-btn" id="tabBtn-release" onclick="switchTab('release')">릴리즈 노트</button>
  </div>

  <div class="tab-panel active" id="tabPanel-sync">
    <div class="repo-select-group">
      <label for="repoSelect">작업 저장소 선택</label>
      <select id="repoSelect" onchange="selectRepo(this.value)"></select>
    </div>

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
      <input type="checkbox" id="aiSummaryCheck">
      <label for="aiSummaryCheck">AI 요약</label>
    </div>
    <div class="ai-checkbox-row">
      <input type="checkbox" id="aiCommitMsgCheck" checked>
      <label for="aiCommitMsgCheck">AI 커밋 메시지 자동 생성</label>
    </div>
    <div class="ai-checkbox-row">
      <input type="checkbox" id="diffTextCheck" checked>
      <label for="diffTextCheck">Diff 텍스트 표시</label>
    </div>

    <div class="button-group">
      <button id="checkBtn" class="btn-secondary" onclick="checkDiffs()">변경사항 확인</button>
      <button id="syncBtn" onclick="startSync()">동기화</button>
    </div>

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
      <p class="subtitle">롤백할 커밋을 선택하세요.</p>

      <div class="commit-list" id="commitList"></div>
      <button class="load-more-btn" id="loadMoreBtn" onclick="loadMoreCommits()" style="display:none;">더 보기</button>

      <button class="rollback-btn" id="rollbackBtn" onclick="startRollback()" disabled>선택한 버전으로 롤백</button>
      <div class="rollback-warning">비공개 저장소가 선택한 버전으로 덮어씌워집니다. 공개 저장소는 동기화를 실행하기 전까지 변경되지 않습니다.</div>
    </div>
  </div>

  <div class="tab-panel" id="tabPanel-extract">
    <div class="repo-select-group">
      <label for="extractRepoSelect">레포지토리 선택</label>
      <select id="extractRepoSelect"></select>
    </div>

    <p class="repo-info">기존 동기화 설정과 무관하게 계정이 소유한 모든 레포지토리의 디렉토리 구조를 추출합니다.</p>

    <div class="ai-checkbox-row">
      <input type="checkbox" id="detailCheck" onchange="onDetailCheckChange()">
      <label for="detailCheck">세부정보 표시</label>
    </div>
    <div class="ai-checkbox-row ai-checkbox-sub">
      <input type="checkbox" id="essentialFilesCheck" disabled>
      <label for="essentialFilesCheck">프로젝트 구조 파악 필수 파일 내용 포함</label>
    </div>

    <button id="treeBtn" class="btn-info" onclick="extractTree()">디렉토리 추출</button>

    <div class="diff-text-box" id="treeBox">
      <div class="diff-text-header">
        <span id="treeBoxTitle">⟩_ 디렉토리 구조</span>
        <button class="copy-btn" onclick="copyTreeText()">클립보드 복사</button>
      </div>
      <div class="diff-text-content" id="treeContent"></div>
    </div>
  </div>

  <div class="tab-panel" id="tabPanel-release">
    <div class="repo-select-group">
      <label for="releaseRepoSelect">저장소 선택</label>
      <select id="releaseRepoSelect" onchange="selectReleaseRepo(this.value)"></select>
    </div>

    <div class="repo-info" id="releaseRepoInfo"></div>

    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-val" id="releaseAddedStat">-</div>
        <div class="stat-label">추가</div>
      </div>
      <div class="stat-item">
        <div class="stat-val" id="releaseModifiedStat">-</div>
        <div class="stat-label">수정</div>
      </div>
      <div class="stat-item">
        <div class="stat-val" id="releaseDeletedStat">-</div>
        <div class="stat-label">삭제</div>
      </div>
    </div>

    <div class="ai-checkbox-row">
      <input type="checkbox" id="releaseAiSummaryCheck" checked>
      <label for="releaseAiSummaryCheck">AI 릴리즈 노트 요약</label>
    </div>
    <div class="ai-checkbox-row">
      <input type="checkbox" id="releaseDiffTextCheck" checked>
      <label for="releaseDiffTextCheck">Diff 텍스트 표시</label>
    </div>

    <button id="releaseCheckBtn" class="btn-secondary" onclick="checkReleaseDiff()">최신 릴리즈 대비 변경사항 확인</button>

    <div class="ai-summary-box" id="releaseSummaryBox">
      <div class="ai-summary-header">✦ AI 릴리즈 노트 요약</div>
      <div class="ai-summary-content" id="releaseSummaryContent"></div>
    </div>

    <div class="diff-text-box" id="releaseDiffTextBox">
      <div class="diff-text-header">
        <span>⟩_ Diff 텍스트</span>
        <button class="copy-btn" onclick="copyReleaseDiffText()">클립보드 복사</button>
      </div>
      <div class="diff-text-content" id="releaseDiffTextContent"></div>
    </div>
  </div>

  <button id="logoutBtn" class="btn-secondary mt-12" onclick="logout()">로그아웃</button>
`, `
<script>
  let repoConfigs = [];
  let currentRepoIndex = 0;
  let releaseRepoIndex = 0;
  let rollbackPage = 1;
  let selectedCommitSha = null;
  let lastAutoCommitMsg = '';
  let extractReposLoaded = false;

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tabBtn-' + tab).classList.add('active');
    document.getElementById('tabPanel-' + tab).classList.add('active');
    if (tab === 'extract' && !extractReposLoaded) {
      loadExtractRepos();
    }
  }

  async function loadExtractRepos() {
    const select = document.getElementById('extractRepoSelect');
    select.innerHTML = '<option value="">불러오는 중...</option>';
    try {
      const res = await fetch('/api/sync/repos-list');
      if (!res.ok) throw new Error(await res.text());
      const repos = await res.json();
      extractReposLoaded = true;
      select.innerHTML = '';
      if (repos.length === 0) {
        select.innerHTML = '<option value="">레포지토리가 없습니다</option>';
        return;
      }
      repos.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.name;
        opt.textContent = r.name + (r.private ? ' (비공개)' : '');
        select.appendChild(opt);
      });
    } catch (e) {
      select.innerHTML = '<option value="">불러오기 실패</option>';
      alert('레포지토리 목록을 불러오지 못했습니다: ' + e.message);
    }
  }

  async function loadConfigs() {
    try {
      const res = await fetch('/api/repos');
      if (!res.ok) throw new Error('저장소 설정을 불러오지 못했습니다.');
      repoConfigs = await res.json();
      renderRepoSelect();
      renderReleaseRepoSelect();
      if (repoConfigs.length > 0) {
        selectRepo(0);
        selectReleaseRepo(0);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  function renderRepoSelect() {
    const select = document.getElementById('repoSelect');
    select.innerHTML = '';
    repoConfigs.forEach((cfg, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = cfg.name;
      select.appendChild(opt);
    });
  }

  function selectRepo(index) {
    currentRepoIndex = parseInt(index);
    const cfg = repoConfigs[currentRepoIndex];
    if (!cfg) return;

    document.getElementById('repoSelect').value = currentRepoIndex;

    const folders = cfg.syncFolders ? cfg.syncFolders.split(',').map(s => s.trim()).filter(Boolean) : [];
    const files = cfg.syncFiles ? cfg.syncFiles.split(',').map(s => s.trim()).filter(Boolean) : [];
    const excludeFolders = cfg.excludeFolders ? cfg.excludeFolders.split(',').map(s => s.trim()).filter(Boolean) : [];

    let infoHtml = '<div><span>' + cfg.privateRepo + '</span> &rarr; <span>' + cfg.publicRepo + '</span></div>';
    infoHtml += '<div class="sync-tags">';
    folders.forEach(f => { infoHtml += '<span class="sync-tag">' + f + '/</span>'; });
    files.forEach(f => { infoHtml += '<span class="sync-tag">' + f + '</span>'; });
    excludeFolders.forEach(f => { infoHtml += '<span class="sync-tag-exclude">' + f + '/</span>'; });
    infoHtml += '</div>';
    document.getElementById('repoInfo').innerHTML = infoHtml;

    resetUI();
    resetRollbackUI();
    loadRollbackCommits(1);
  }

  function renderReleaseRepoSelect() {
    const select = document.getElementById('releaseRepoSelect');
    select.innerHTML = '';
    repoConfigs.forEach((cfg, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = cfg.name;
      select.appendChild(opt);
    });
  }

  function selectReleaseRepo(index) {
    releaseRepoIndex = parseInt(index);
    const cfg = repoConfigs[releaseRepoIndex];
    if (!cfg) return;

    document.getElementById('releaseRepoSelect').value = releaseRepoIndex;
    document.getElementById('releaseRepoInfo').innerHTML = '<div><span>' + cfg.publicRepo + '</span> (공개 저장소)</div>';

    resetReleaseUI();
  }

  function resetReleaseUI() {
    document.getElementById('releaseAddedStat').textContent = '-';
    document.getElementById('releaseModifiedStat').textContent = '-';
    document.getElementById('releaseDeletedStat').textContent = '-';
    document.getElementById('releaseSummaryBox').style.display = 'none';
    document.getElementById('releaseSummaryContent').textContent = '';
    document.getElementById('releaseDiffTextBox').style.display = 'none';
    document.getElementById('releaseDiffTextContent').textContent = '';
  }

  async function checkReleaseDiff() {
    const btn = document.getElementById('releaseCheckBtn');
    const summaryBox = document.getElementById('releaseSummaryBox');
    const summaryContent = document.getElementById('releaseSummaryContent');
    const diffTextBox = document.getElementById('releaseDiffTextBox');
    const diffTextContent = document.getElementById('releaseDiffTextContent');

    const wantAI = document.getElementById('releaseAiSummaryCheck').checked;
    const wantDiff = document.getElementById('releaseDiffTextCheck').checked;

    btn.disabled = true;
    btn.textContent = '확인 중...';
    resetReleaseUI();

    if (wantAI) {
      summaryContent.textContent = 'AI 릴리즈 노트 생성 중...';
      summaryBox.style.display = 'block';
    }
    if (wantDiff) {
      diffTextContent.textContent = 'Diff 텍스트 생성 중...';
      diffTextBox.style.display = 'block';
    }

    try {
      const res = await fetch('/api/sync/release-diff-info', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ repoIndex: releaseRepoIndex, wantAI, wantDiff })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (!data.release) {
        if (wantAI) summaryContent.textContent = data.message || '릴리즈가 없습니다.';
        if (wantDiff) diffTextBox.style.display = 'none';
        return;
      }

      document.getElementById('releaseAddedStat').textContent = data.added;
      document.getElementById('releaseModifiedStat').textContent = data.modified;
      document.getElementById('releaseDeletedStat').textContent = data.deleted;

      if (wantAI) {
        if (data.summaryError) {
          summaryContent.textContent = 'AI 요약 실패: ' + data.summaryError;
        } else {
          summaryContent.innerHTML = data.summary ? marked.parse(data.summary) : '요약 생성 실패';
        }
        (data.summaryFallbacks || []).forEach((fb, idx) => {
          setTimeout(() => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'warning',
              title: fb.model + ' 실패 → ' + fb.next + ' 로 전환',
              showConfirmButton: false,
              timer: 4000,
              timerProgressBar: true
            });
          }, idx * 600);
        });
      }

      if (wantDiff) {
        diffTextContent.textContent = data.diff || 'Diff 생성 실패';
      }
    } catch (e) {
      if (wantAI) summaryContent.textContent = 'AI 요약 실패: ' + e.message;
      if (wantDiff) diffTextContent.textContent = 'Diff 생성 실패: ' + e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = '최신 릴리즈 대비 변경사항 확인';
    }
  }

  async function copyReleaseDiffText() {
    const text = document.getElementById('releaseDiffTextContent').textContent;
    const btn = document.querySelector('#releaseDiffTextBox .copy-btn');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '복사됨!';
      setTimeout(() => { btn.textContent = '클립보드 복사'; }, 2000);
    } catch {
      btn.textContent = '복사 실패';
      setTimeout(() => { btn.textContent = '클립보드 복사'; }, 2000);
    }
  }

  function resetUI() {
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
        const wantCommitMsg = document.getElementById('aiCommitMsgCheck').checked;
        const commitMsgInput = document.getElementById('commitMessage');

        if (wantAI || wantDiff || wantCommitMsg) {
          const summaryBox = document.getElementById('aiSummaryBox');
          const summaryContent = document.getElementById('aiSummaryContent');
          const diffTextBox = document.getElementById('diffTextBox');
          const diffTextContent = document.getElementById('diffTextContent');

          if (wantAI) {
            summaryContent.textContent = 'AI 요약 생성 중...';
            summaryBox.style.display = 'block';
          }
          if (wantDiff) {
            diffTextContent.textContent = 'Diff 텍스트 생성 중...';
            diffTextBox.style.display = 'block';
          }
          let prevCommitMsgValue = '';
          let userEditedCommitMsg = false;
          if (wantCommitMsg) {
            prevCommitMsgValue = commitMsgInput.value;
            userEditedCommitMsg = prevCommitMsgValue !== '' && prevCommitMsgValue !== lastAutoCommitMsg;
            commitMsgInput.placeholder = 'AI 커밋 메시지 생성 중...';
            if (!userEditedCommitMsg) commitMsgInput.value = '';
          }

          const postDiffInfo = (flags) => fetch('/api/sync/diff-info', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ toUpload, toDelete, repoIndex: currentRepoIndex, ...flags })
          }).then(async r => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          });

          const tasks = [];

          if (wantDiff) {
            tasks.push(
              postDiffInfo({ wantDiff: true })
                .then(({ diff }) => {
                  diffTextContent.textContent = diff || 'Diff 생성 실패';
                })
                .catch(err => {
                  diffTextContent.textContent = 'Diff 생성 실패: ' + err.message;
                })
            );
          }

          if (wantAI || wantCommitMsg) {
            tasks.push(
              postDiffInfo({ wantAI, wantCommitMsg })
                .then(({ summary, summaryError, summaryFallbacks, commitMessage, commitMessageError, commitMsgFallbacks }) => {
                  if (wantAI) {
                    if (summaryError) {
                      summaryContent.textContent = 'AI 요약 실패: ' + summaryError;
                    } else {
                      summaryContent.innerHTML = summary ? marked.parse(summary) : '요약 생성 실패';
                    }
                  }
                  if (wantCommitMsg) {
                    if (commitMessageError) {
                      commitMsgInput.placeholder = '커밋 메시지 자동 생성 실패: ' + commitMessageError;
                      commitMsgInput.value = userEditedCommitMsg ? prevCommitMsgValue : '';
                    } else {
                      commitMsgInput.placeholder = '커밋 메시지 작성 (선택사항)';
                      if (commitMessage && !userEditedCommitMsg) {
                        commitMsgInput.value = commitMessage;
                        lastAutoCommitMsg = commitMessage;
                      }
                    }
                  }
                  const allFallbacks = [...(summaryFallbacks || []), ...(commitMsgFallbacks || [])];
                  const seen = new Set();
                  const uniqueFallbacks = allFallbacks.filter(fb => {
                    const key = fb.model + '→' + fb.next;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  uniqueFallbacks.forEach((fb, idx) => {
                    setTimeout(() => {
                      Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'warning',
                        title: fb.model + ' 실패 → ' + fb.next + ' 로 전환',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                      });
                    }, idx * 600);
                  });
                })
                .catch(err => {
                  if (wantAI) summaryContent.textContent = 'AI 요약 실패: ' + err.message;
                  if (wantCommitMsg) {
                    commitMsgInput.placeholder = '커밋 메시지 자동 생성 실패: ' + err.message;
                    commitMsgInput.value = userEditedCommitMsg ? prevCommitMsgValue : '';
                  }
                })
            );
          }

          await Promise.all(tasks);
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

  function onDetailCheckChange() {
    const parent = document.getElementById('detailCheck');
    const child = document.getElementById('essentialFilesCheck');
    child.disabled = !parent.checked;
    if (!parent.checked) child.checked = false;
  }

  async function extractTree() {
    const btn = document.getElementById('treeBtn');
    const box = document.getElementById('treeBox');
    const content = document.getElementById('treeContent');
    const title = document.getElementById('treeBoxTitle');
    const showDetails = document.getElementById('detailCheck').checked;
    const includeEssential = showDetails && document.getElementById('essentialFilesCheck').checked;
    const repo = document.getElementById('extractRepoSelect').value;

    if (!repo) {
      alert('레포지토리를 선택하세요.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '추출 중...';
    box.style.display = 'block';
    content.textContent = '디렉토리 구조 추출 중...';
    title.textContent = '⟩_ 디렉토리 구조';

    try {
      const res = await fetch('/api/sync/extract-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, showDetails, includeEssential })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      content.textContent = data.tree || '(비어있음)';
      let meta = data.fileCount + '개 파일, ' + data.dirCount + '개 디렉토리, ' + data.branch;
      if (showDetails && data.totalSize != null) {
        meta += ', ' + data.totalSize;
      }
      if (includeEssential && data.essentialCount) {
        meta += ', 필수파일 ' + data.essentialCount + '개';
      }
      title.textContent = '⟩_ ' + data.repo + ' (' + meta + ')';
    } catch (e) {
      content.textContent = '디렉토리 구조 추출 실패: ' + e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = '디렉토리 추출';
    }
  }

  async function copyTreeText() {
    const text = document.getElementById('treeContent').textContent;
    const btn = document.querySelector('#treeBox .copy-btn');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '복사됨!';
      setTimeout(() => { btn.textContent = '클립보드 복사'; }, 2000);
    } catch {
      btn.textContent = '복사 실패';
      setTimeout(() => { btn.textContent = '클립보드 복사'; }, 2000);
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

  async function loadRollbackCommits(page) {
    try {
      const res = await fetch('/api/sync/rollback/commits?repoIndex=' + currentRepoIndex + '&page=' + page);
      if (res.status === 403) {
        document.getElementById('rollbackSection').style.display = 'none';
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const commits = await res.json();

      document.getElementById('rollbackSection').style.display = 'block';

      if (page === 1) {
        document.getElementById('commitList').innerHTML = '';
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
    rollbackPage = 1;
    selectedCommitSha = null;
    document.getElementById('commitList').innerHTML = '';
    document.getElementById('rollbackBtn').disabled = true;
    document.getElementById('loadMoreBtn').style.display = 'none';
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

  loadConfigs();
</script>
`);


