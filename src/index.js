export default {
  async fetch(request, env, ctx) {
    const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover, shrink-to-fit=no">
  <title>智能快捷拨号助手</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-app: #ededed;
      --card-bg: #ffffff;
      --card-border: #e0e0e0;
      --text-main: #191919;
      --text-soft: #5e5e5e;
      --text-light: #8e8e8e;
      --accent-wechat: #07c160;
      --accent-intent: #07c160;
      --accent-wechat-bg: #f0fdf5;
      --accent-intent-bg: #f0fdf5;
      --btn-bg: #f5f5f5;
      --btn-hover: #e5e5e5;
      --shadow-card: 0 1px 3px rgba(0,0,0,0.06);
      --border-light: #e5e5e5;
      --modal-bg: rgba(0,0,0,0.45);
      --modal-card: #ffffff;
      --radius-sm: 8px;
      --radius-xs: 6px;
      --wechat-gradient: linear-gradient(135deg, #b7f0ce 0%, #6be89d 50%, #1aad5a 100%);
      --intent-gradient: linear-gradient(135deg, #ffe0b2 0%, #ffb74d 50%, #f57c00 100%);
      --revisit-gradient: linear-gradient(135deg, #d1e0ff 0%, #7b9ff5 50%, #4a6cf7 100%);
    }
    body.dark-mode {
      --bg-app: rgba(17,17,17,0.92);
      --card-bg: rgba(26,26,26,0.9);
      --card-border: #2c2c2c;
      --text-main: #e5e5e5;
      --text-soft: #a0a0a0;
      --text-light: #6b6b6b;
      --accent-wechat: #07c160;
      --accent-intent: #07c160;
      --accent-wechat-bg: #17241c;
      --accent-intent-bg: #17241c;
      --btn-bg: rgba(38,38,38,0.85);
      --btn-hover: #2c2c2c;
      --border-light: #262626;
      --modal-bg: rgba(0,0,0,0.88);
      --modal-card: #1a1a1a;
      --wechat-gradient: linear-gradient(135deg, #0d3320 0%, #144d2e 50%, #1a6b3a 100%);
      --intent-gradient: linear-gradient(135deg, #332010 0%, #4d2e14 50%, #6b3a1a 100%);
      --revisit-gradient: linear-gradient(135deg, #1a2233 0%, #2a354d 50%, #3a4d6b 100%);
    }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: var(--bg-app);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif;
      font-weight: 700;
      transition: background 0.3s;
    }
    .app-shell {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
    }
    .container {
      flex: 1;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--card-bg);
      border-left: 1px solid var(--border-light);
      border-right: 1px solid var(--border-light);
      box-shadow: 0 4px 30px rgba(0,0,0,0.03);
    }
    
    /* Header Bar */
    .header-bar {
      height: 56px;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .title-section h3 {
      font-size: 1.15rem;
      font-weight: 900;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .icon-btn {
      background: var(--btn-bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      font-size: 0.8rem;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: var(--radius-xs);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .icon-btn:hover {
      background: var(--btn-hover);
    }
    
    /* Dashboard Area */
    .dashboard-panel {
      padding: 16px 20px;
      background: var(--bg-app);
      border-bottom: 1px solid var(--border-light);
      flex-shrink: 0;
    }
    .import-zone {
      background: var(--card-bg);
      border: 2px dashed var(--card-border);
      border-radius: var(--radius-sm);
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    }
    .import-zone.dragover {
      border-color: var(--accent-wechat);
      background: var(--accent-wechat-bg);
    }
    .import-buttons {
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }
    .btn-primary {
      background: var(--wechat-gradient);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: var(--radius-xs);
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(7,193,96,0.2);
      transition: all 0.2s;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(7,193,96,0.3);
    }
    .btn-secondary {
      background: var(--revisit-gradient);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: var(--radius-xs);
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(74,108,247,0.2);
      transition: all 0.2s;
    }
    .btn-secondary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(74,108,247,0.3);
    }
    
    /* Stats Bar */
    .stats-bar {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xs);
      padding: 12px 18px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 0.68rem;
      color: var(--text-light);
      text-transform: uppercase;
    }
    .stat-val {
      font-size: 1.1rem;
      font-weight: 900;
      color: var(--text-main);
    }
    .progress-track {
      flex: 1;
      height: 8px;
      background: var(--btn-bg);
      border-radius: 4px;
      margin: 0 24px;
      overflow: hidden;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: var(--wechat-gradient);
      width: 0%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    /* Control Panel */
    .control-bar {
      height: 48px;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    .search-input {
      flex: 1;
      height: 32px;
      background: var(--btn-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xs);
      padding: 0 12px;
      font-size: 0.8rem;
      color: var(--text-main);
      outline: none;
      font-weight: 700;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--accent-wechat);
      background: var(--card-bg);
    }
    .filter-group {
      display: flex;
      gap: 4px;
    }
    .filter-tab {
      height: 30px;
      padding: 0 12px;
      background: transparent;
      border: none;
      color: var(--text-soft);
      font-size: 0.76rem;
      font-weight: 800;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s;
    }
    .filter-tab.active {
      background: var(--accent-wechat-bg);
      color: var(--accent-wechat);
    }
    
    /* Cards Container */
    .cards-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    /* Contact Card */
    .xls-dial-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xs);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-card);
      position: relative;
      transition: all 0.2s ease;
    }
    .xls-dial-card:hover {
      border-color: rgba(7, 193, 96, 0.4);
      transform: translateY(-1px);
    }
    .xls-dial-card.dialed {
      opacity: 0.75;
      border-color: var(--border-light);
      background: rgba(0, 0, 0, 0.005);
    }
    body.dark-mode .xls-dial-card.dialed {
      background: rgba(255, 255, 255, 0.003);
    }
    .xls-dial-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      position: absolute;
      top: 14px;
      right: 16px;
    }
    .xls-dial-badge-todo {
      background: var(--btn-bg);
      color: var(--text-soft);
    }
    .xls-dial-badge-success {
      background: rgba(7, 193, 96, 0.1);
      color: var(--accent-intent);
      border: 0.5px solid rgba(7, 193, 96, 0.2);
    }
    .xls-dial-badge-failed {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      border: 0.5px solid rgba(231, 76, 60, 0.2);
    }
    
    .client-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .client-card-primary {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .client-card-name {
      font-size: 0.95rem;
      font-weight: 900;
      color: var(--text-main);
    }
    .client-card-phone-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .client-phone {
      font-family: monospace;
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text-soft);
      text-decoration: none;
    }
    .phone-toggle {
      background: transparent;
      border: none;
      color: var(--accent-wechat);
      font-size: 0.68rem;
      font-weight: 800;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      border: 0.5px solid rgba(7,193,96,0.2);
      transition: all 0.1s;
    }
    .phone-toggle:hover {
      background: var(--accent-wechat-bg);
    }
    .client-card-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .client-card-tag {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .client-card-tag-company {
      background: rgba(7,193,96,0.08);
      color: var(--accent-wechat);
    }
    .client-card-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-left: 2px solid var(--border-light);
      padding-left: 8px;
    }
    .client-card-content-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .client-card-label {
      font-size: 0.62rem;
      color: var(--text-light);
      text-transform: uppercase;
    }
    .client-card-text {
      font-size: 0.74rem;
      color: var(--text-soft);
      line-height: 1.4;
    }
    .client-card-actions {
      display: flex;
      justify-content: flex-end;
      border-top: 1px dashed var(--border-light);
      padding-top: 8px;
      margin-top: 2px;
    }
    
    /* Overlay and Modals */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--modal-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 2000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-card {
      background: var(--modal-card);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      box-shadow: 0 15px 45px rgba(0,0,0,0.3);
      width: 90vw;
      max-width: 400px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transform: translateY(20px);
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .modal-overlay.active .modal-card {
      transform: translateY(0);
    }
    
    /* Dialer Assist */
    .call-pulse {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--accent-wechat-bg);
      color: var(--accent-wechat);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      margin: 0 auto 6px;
      position: relative;
    }
    .call-pulse::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      border: 2px solid var(--accent-wechat);
      animation: ripple 1.6s infinite ease-out;
      opacity: 0;
    }
    @keyframes ripple {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    
    .btn-modal {
      height: 42px;
      border: none;
      border-radius: var(--radius-xs);
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-success {
      background: #07c160;
      color: white;
      box-shadow: 0 4px 12px rgba(7,193,96,0.25);
    }
    .btn-danger {
      background: #e74c3c;
      color: white;
      box-shadow: 0 4px 12px rgba(231,76,60,0.25);
    }
    .btn-neutral {
      background: #7f8c8d;
      color: white;
      box-shadow: 0 4px 12px rgba(127,140,141,0.25);
    }
    
    /* Export Panel */
    .export-modal-card {
      max-width: 500px;
    }
    .export-textarea {
      width: 100%;
      height: 200px;
      background: var(--btn-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xs);
      padding: 10px 12px;
      font-size: 0.76rem;
      color: var(--text-main);
      outline: none;
      font-weight: 600;
      resize: none;
      line-height: 1.5;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <div class="container">
      <!-- Header -->
      <div class="header-bar">
        <div class="title-section">
          <h3>📞 智能快捷拨号助手</h3>
        </div>
        <div class="action-group">
          <button class="icon-btn" id="exportBtn" title="导出拨号记录" style="display:none;">📤 导出</button>
          <button class="icon-btn" id="clearBtn" title="清空联系人" style="display:none;background:rgba(231,76,60,0.1);color:#e74c3c;border-color:rgba(231,76,60,0.2);">🗑️ 清空</button>
          <button class="icon-btn" id="darkToggleBtn">深色模式</button>
        </div>
      </div>
      
      <!-- Dashboard -->
      <div class="dashboard-panel">
        <div class="import-zone" id="dropZone">
          <span style="font-size: 1.5rem;">📂</span>
          <span style="font-size: 0.85rem; color: var(--text-soft); font-weight: 800;">拖拽 Excel, CSV 或 VCF 通讯录文件到此处</span>
          <span style="font-size: 0.72rem; color: var(--text-light);">支持智能识别无表头、多列并排交替的 Excel</span>
          <div class="import-buttons">
            <button class="btn-primary" id="xlsSelectBtn">导入 Excel / CSV</button>
            <button class="btn-secondary" id="vcfSelectBtn">导入 VCF 通讯录</button>
          </div>
          <input type="file" id="xlsFileInput" accept=".xls,.xlsx,.csv" style="display:none;">
          <input type="file" id="vcfFileInput" accept=".vcf,.vcard" style="display:none;">
          <div id="importStatus" style="font-size:0.75rem;color:var(--accent-wechat);font-weight:800;margin-top:6px;min-height:18px;"></div>
        </div>
        
        <!-- Stats Dashboard -->
        <div class="stats-bar" id="statsBar" style="display:none;">
          <div class="stat-item">
            <span class="stat-label">全部客户</span>
            <span class="stat-val" id="totalCount">0</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="stat-item" style="text-align: right;">
            <span class="stat-label">已拨打</span>
            <span class="stat-val" id="doneCount">0</span>
          </div>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="control-bar" id="controlBar" style="display:none;">
        <input type="text" class="search-input" id="searchInput" placeholder="🔍 搜索姓名、手机或公司...">
        <div class="filter-group">
          <button class="filter-tab active" data-filter="all">全部</button>
          <button class="filter-tab" data-filter="todo">待拨打</button>
          <button class="filter-tab" data-filter="success">已接通</button>
          <button class="filter-tab" data-filter="failed">未接通</button>
        </div>
      </div>
      
      <!-- Contacts List -->
      <div class="cards-content" id="cardsContainer">
        <div style="text-align:center;padding:80px 20px;color:var(--text-light);font-size:0.82rem;display:flex;flex-direction:column;gap:12px;">
          <span style="font-size: 2.2rem;opacity:0.6;">📇</span>
          <span>暂无联系人数据，请在上方导入表格或通讯录文件</span>
          <span style="font-size:0.7rem;color:var(--text-light);max-width:320px;margin:0 auto;line-height:1.5;">数据仅保存在您的浏览器本地，不经过任何后台服务器，完全保护您的客户隐私。</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Call Assistant Modal -->
  <div id="callAssistOverlay" class="modal-overlay" style="z-index:3000;">
    <div class="modal-card" style="text-align:center;">
      <div class="call-pulse">📞</div>
      <div style="font-size:0.7rem;color:var(--text-light);font-weight:800;letter-spacing:1px;text-transform:uppercase;">正在呼叫</div>
      <div id="callAssistName" style="font-size:1.3rem;font-weight:900;color:var(--text-main);margin-top:2px;">-</div>
      <div id="callAssistPhone" style="font-size:0.95rem;font-weight:800;color:var(--accent-wechat);margin-top:2px;font-family:monospace;">-</div>
      
      <div style="background:var(--btn-bg);padding:14px;border-radius:12px;margin:8px 0;border:1px solid var(--border-light);">
        <div id="callAssistTimer" style="font-size:2.4rem;font-weight:900;font-family:monospace;color:var(--text-main);letter-spacing:1px;">00:00</div>
        <div id="callAssistStatus" style="font-size:0.72rem;color:var(--text-soft);font-weight:700;margin-top:4px;">呼叫发起中...</div>
      </div>

      <div id="callAssistControls" style="display:flex;gap:10px;justify-content:center;width:100%;">
        <button id="callConnectedBtn" class="btn-modal btn-success" style="flex:1;">已接通</button>
        <button id="callFailedBtn" class="btn-modal btn-danger" style="flex:1;">未接通 / 忙</button>
        <button id="callHangupBtn" class="btn-modal btn-neutral" style="flex:1;display:none;">挂断并记录</button>
      </div>

      <div id="callLogForm" style="display:none;text-align:left;flex-direction:column;gap:10px;width:100%;">
        <div class="client-card-content-block" style="margin:0;padding-left:0;border-left:none;">
          <span class="client-card-label" style="font-size:0.65rem;color:var(--text-light);">通话小记 / 沟通记录</span>
          <textarea id="callLogNote" placeholder="输入通话跟进记录..." style="width:100%;height:68px;margin-top:4px;font-size:0.78rem;padding:8px 10px;background:var(--btn-bg);border:0.5px solid var(--card-border);border-radius:var(--radius-xs);color:var(--text-main);outline:none;font-weight:700;resize:vertical;"></textarea>
        </div>
        <button id="callLogSaveBtn" class="btn-modal btn-success" style="width:100%;box-shadow:var(--wechat-gradient);">保存通话结果</button>
      </div>
    </div>
  </div>

  <!-- Export Dialog Modal -->
  <div id="exportModal" class="modal-overlay">
    <div class="modal-card export-modal-card">
      <div style="font-size:0.95rem;font-weight:900;color:var(--text-main);display:flex;justify-content:space-between;align-items:center;">
        <span>📤 导出拨号记录</span>
        <button id="closeExportBtn" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-soft);">✕</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-light);font-weight:700;">包含通话时长、拨号状态与通话小记</div>
      <textarea id="exportTextarea" class="export-textarea" readonly></textarea>
      <button id="copyExportBtn" class="btn-modal btn-success" style="width:100%;">复制记录到剪贴板</button>
    </div>
  </div>

  <!-- SheetJS CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

  <script>
  (function(){
    // LocalStorage Keys
    var CLIENTS_K = 'standalone_dialer_clients';
    var DARK_K = 'standalone_dialer_dark';

    // State Variables
    var importedClients = [];
    var currentCallIdx = -1;
    var callInterval = null;
    var callSeconds = 0;
    var currentFilter = 'all';

    // Dark Mode Control
    function initDark() {
      var btn = document.getElementById('darkToggleBtn');
      var updateDarkTitle = function() {
        var isDark = document.body.classList.contains('dark-mode');
        btn.textContent = (isDark ? '浅色' : '深色') + '模式';
      };
      if (localStorage.getItem(DARK_K) === 'true') {
        document.body.classList.add('dark-mode');
      }
      updateDarkTitle();
      btn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem(DARK_K, document.body.classList.contains('dark-mode'));
        updateDarkTitle();
      });
    }

    // Helper functions
    function esc(s) {
      if (!s) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function maskPhone(p) {
      if (!p) return '';
      var s = String(p).trim();
      if (s.length >= 11) {
        return s.slice(0, 3) + '****' + s.slice(7);
      }
      return s;
    }

    function cleanPhone(val) {
      if (!val) return '';
      var s = String(val).trim().replace(/[^\\d+]/g, '');
      if (s.indexOf('+86') === 0) return s.slice(3);
      if (s.indexOf('86') === 0 && s.length === 13) return s.slice(2);
      return s;
    }

    function isPhone(val) {
      var clean = cleanPhone(val);
      return /^1[3-9]\\d{9}$/.test(clean);
    }

    function nameScore(val) {
      if (!val) return 0;
      var s = String(val).trim();
      if (isPhone(s)) return 0;
      if (/^\\d+$/.test(s)) return 0;
      if (/^[\\u4e00-\\u9fa5]{2,4}$/.test(s)) return 10;
      if (/^[\\u4e00-\\u9fa5]{2,6}$/.test(s)) return 5;
      if (/^[A-Za-z\\s]{2,15}$/.test(s)) return 3;
      if (s.length >= 2 && s.length <= 15) return 1;
      return 0;
    }

    function decodeQPUtf8(s) {
      var t = s.replace(/=\\r?\\n/g, '');
      var b = [];
      var i = 0;
      while (i < t.length) {
        if (t[i] === '=' && i + 2 < t.length && /[0-9A-Fa-f]{2}/.test(t.slice(i+1,i+3))) {
          b.push(parseInt(t.slice(i+1,i+3), 16));
          i += 3;
        } else {
          b.push(t.charCodeAt(i));
          i++;
        }
      }
      try { return new TextDecoder('utf-8').decode(new Uint8Array(b)); } catch(e) { return s; }
    }

    // Persist and load state
    function loadPersistedState() {
      try {
        var saved = localStorage.getItem(CLIENTS_K);
        if (saved) {
          importedClients = JSON.parse(saved);
          if (importedClients.length > 0) {
            updateDashboardVisibility(true);
            renderDialCards();
          }
        }
      } catch (err) {
        console.error('Failed to load state:', err);
      }
    }

    function saveState() {
      try {
        localStorage.setItem(CLIENTS_K, JSON.stringify(importedClients));
      } catch (err) {
        console.error('Failed to save state:', err);
      }
    }

    function updateDashboardVisibility(hasData) {
      var displayStyle = hasData ? 'block' : 'none';
      var flexStyle = hasData ? 'flex' : 'none';
      document.getElementById('statsBar').style.display = displayStyle;
      document.getElementById('controlBar').style.display = flexStyle;
      document.getElementById('exportBtn').style.display = hasData ? 'inline-flex' : 'none';
      document.getElementById('clearBtn').style.display = hasData ? 'inline-flex' : 'none';
    }

    // Dynamic UI Statistics
    function updateStats() {
      var total = importedClients.length;
      var done = 0;
      importedClients.forEach(function(c) {
        if (c.dialedStatus === 'success' || c.dialedStatus === 'failed') {
          done++;
        }
      });
      document.getElementById('totalCount').textContent = total;
      document.getElementById('doneCount').textContent = done;

      var percent = total > 0 ? (done / total) * 100 : 0;
      document.getElementById('progressFill').style.width = percent + '%';
    }

    // Parse Excel/CSV
    function handleExcelImport(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: 'array' });
          var firstSheetName = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[firstSheetName];
          var json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (json.length === 0) {
            document.getElementById('importStatus').innerText = '❌ 导入失败：表格无数据';
            return;
          }

          var headerRowIdx = -1;
          var maxHeaderMatches = 0;

          for (var i = 0; i < Math.min(json.length, 10); i++) {
            var row = json[i];
            if (!row) continue;
            var matches = 0;
            for (var j = 0; j < row.length; j++) {
              var cellVal = String(row[j] || '').trim();
              if (/姓名|客户|联系人|name|contact/i.test(cellVal)) matches++;
              if (/电话|手机|号码|phone|tel|mobile/i.test(cellVal)) matches++;
              if (/单位|公司|企业|company|firm|work/i.test(cellVal)) matches++;
              if (/备注|沟通|记录|跟进|note|remark/i.test(cellVal)) matches++;
            }
            var hasPhoneData = false;
            for (var j = 0; j < row.length; j++) {
              if (isPhone(row[j])) {
                hasPhoneData = true;
                break;
              }
            }
            if (matches > maxHeaderMatches && !hasPhoneData) {
              maxHeaderMatches = matches;
              headerRowIdx = i;
            }
          }

          var parsedCustomers = [];
          var phoneSet = new Set();

          if (headerRowIdx !== -1) {
            var headers = json[headerRowIdx];
            var nameIdx = -1, phoneIdx = -1, companyIdx = -1, noteIdx = -1;
            for (var i = 0; i < headers.length; i++) {
              var h = String(headers[i] || '').trim();
              if (/姓名|客户|name/i.test(h)) nameIdx = i;
              else if (/电话|手机|号码|phone|tel|mobile/i.test(h)) phoneIdx = i;
              else if (/单位|公司|企业|company|firm|work/i.test(h)) companyIdx = i;
              else if (/备注|沟通|记录|跟进|note|remark/i.test(h)) noteIdx = i;
            }

            if (phoneIdx === -1) {
              for (var i = 0; i < headers.length; i++) {
                if (isPhone(json[headerRowIdx + 1]?.[i])) {
                  phoneIdx = i;
                  break;
                }
              }
            }
            if (nameIdx === -1) nameIdx = 0;

            if (phoneIdx === -1) {
              document.getElementById('importStatus').innerText = '❌ 导入失败：无法识别“电话”字段，请确保包含电话列';
              return;
            }

            for (var r = headerRowIdx + 1; r < json.length; r++) {
              var row = json[r];
              if (!row || row.length === 0) continue;
              var phoneVal = cleanPhone(row[phoneIdx]);
              if (!phoneVal) continue;
              if (phoneSet.has(phoneVal)) continue;
              phoneSet.add(phoneVal);

              var nameVal = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '客户';
              var companyVal = companyIdx !== -1 ? String(row[companyIdx] || '').trim() : '';
              var noteVal = noteIdx !== -1 ? String(row[noteIdx] || '').trim() : '';

              parsedCustomers.push({
                name: nameVal || '未知姓名',
                phone: phoneVal,
                company: companyVal,
                note: noteVal,
                dialedStatus: 'todo',
                duration: '',
                callNote: ''
              });
            }

            if (parsedCustomers.length === 0) {
              document.getElementById('importStatus').innerText = '❌ 导入失败：无有效客户数据';
              return;
            }

            document.getElementById('importStatus').innerHTML = '✅ 成功导入 <strong style="color:var(--accent-intent);">' + parsedCustomers.length + '</strong> 位客户';

          } else {
            var maxCols = 0;
            for (var i = 0; i < json.length; i++) {
              if (json[i] && json[i].length > maxCols) maxCols = json[i].length;
            }
            var phoneCols = [];

            for (var c = 0; c < maxCols; c++) {
              var phoneCount = 0;
              var totalNonEmpty = 0;
              var scanRows = Math.min(json.length, 50);
              for (var r = 0; r < scanRows; r++) {
                var val = json[r]?.[c];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                  totalNonEmpty++;
                  if (isPhone(val)) {
                    phoneCount++;
                  }
                }
              }
              if (phoneCount > 0 && (phoneCount / totalNonEmpty >= 0.3 || phoneCount >= 3)) {
                phoneCols.push(c);
              }
            }

            if (phoneCols.length === 0) {
              document.getElementById('importStatus').innerText = '❌ 导入失败：无法识别任何有效电话';
              return;
            }

            var phoneToNameMap = {};
            var assignedNameCols = new Set();

            phoneCols.forEach(function(pCol) {
              var leftScore = 0;
              var rightScore = 0;
              var scanRows = Math.min(json.length, 50);

              var canUseLeft = (pCol > 0 && phoneCols.indexOf(pCol - 1) === -1 && !assignedNameCols.has(pCol - 1));
              var canUseRight = (pCol + 1 < maxCols && phoneCols.indexOf(pCol + 1) === -1 && !assignedNameCols.has(pCol + 1));

              for (var r = 0; r < scanRows; r++) {
                if (canUseLeft) leftScore += nameScore(json[r]?.[pCol - 1]);
                if (canUseRight) rightScore += nameScore(json[r]?.[pCol + 1]);
              }

              if (canUseRight && rightScore >= leftScore && rightScore > 0) {
                phoneToNameMap[pCol] = pCol + 1;
                assignedNameCols.add(pCol + 1);
              } else if (canUseLeft && leftScore > 0) {
                phoneToNameMap[pCol] = pCol - 1;
                assignedNameCols.add(pCol - 1);
              } else {
                phoneToNameMap[pCol] = -1;
              }
            });

            for (var r = 0; r < json.length; r++) {
              var row = json[r];
              if (!row) continue;

              phoneCols.forEach(function(pCol) {
                var phoneVal = cleanPhone(row[pCol]);
                if (!phoneVal) return;
                if (phoneSet.has(phoneVal)) return;
                phoneSet.add(phoneVal);

                var nameVal = '客户';
                var nameCol = phoneToNameMap[pCol];
                if (nameCol !== undefined && nameCol !== -1) {
                  nameVal = String(row[nameCol] || '').trim();
                }

                parsedCustomers.push({
                  name: nameVal || '未知姓名',
                  phone: phoneVal,
                  company: '',
                  note: '',
                  dialedStatus: 'todo',
                  duration: '',
                  callNote: ''
                });
              });
            }

            if (parsedCustomers.length === 0) {
              document.getElementById('importStatus').innerText = '❌ 导入失败：无有效数据';
              return;
            }

            document.getElementById('importStatus').innerHTML = '✅ 智能匹配成功，共导入 <strong style="color:var(--accent-intent);">' + parsedCustomers.length + '</strong> 位客户';
          }

          importedClients = parsedCustomers;
          saveState();
          updateDashboardVisibility(true);
          renderDialCards();

        } catch(err) {
          document.getElementById('importStatus').innerText = '❌ 解析失败：' + err.message;
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Parse VCF
    function handleVcfImport(file) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var text = ev.target.result;
          var blocks = text.split(/BEGIN:VCARD/i);
          blocks = blocks.slice(1);
          if (!blocks.length) {
            document.getElementById('importStatus').innerText = '❌ 未找到联系人，请确认是有效的 .vcf 文件';
            return;
          }
          var list = [];
          var phoneSet = new Set();
          for (var bi = 0; bi < blocks.length; bi++) {
            var blk = blocks[bi];
            var name = '';
            var mQP = blk.match(/FN[^:]*QUOTED-PRINTABLE[^:]*:([^\r\n]+)/i);
            var mU8 = blk.match(/FN;CHARSET=UTF-8:([^\r\n]+)/i);
            var mFN = blk.match(/FN:([^\r\n]+)/i);
            if (mQP) { name = decodeQPUtf8(mQP[1]).trim(); }
            else if (mU8) { name = mU8[1].trim(); }
            else if (mFN) { name = mFN[1].trim(); }
            
            var company = '';
            var mOQ = blk.match(/ORG[^:]*QUOTED-PRINTABLE[^:]*:([^\r\n]+)/i);
            var mOP = blk.match(/ORG[^:;]*:([^\r\n]+)/i);
            if (mOQ) { company = decodeQPUtf8(mOQ[1]).trim(); }
            else if (mOP) { company = mOP[1].trim(); }

            var telLines = blk.match(/TEL[^:]*:([^\r\n]+)/gi) || [];
            for (var ti = 0; ti < telLines.length; ti++) {
              var ci = telLines[ti].indexOf(':');
              if (ci < 0) continue;
              var phone = telLines[ti].slice(ci+1).trim().replace(/[^\\d+]/g, '');
              if (!phone) continue;
              if (phoneSet.has(phone)) break;
              phoneSet.add(phone);
              list.push({ name: name || '未知姓名', phone: phone, company: company, note: '', dialedStatus: 'todo', duration: '', callNote: '' });
              break;
            }
          }
          if (!list.length) {
            document.getElementById('importStatus').innerText = '❌ 未找到含电话的联系人';
            return;
          }
          document.getElementById('importStatus').innerHTML = '✅ VCF 导入成功：共 <strong style="color:var(--accent-intent);">' + list.length + '</strong> 位联系人';
          
          importedClients = list;
          saveState();
          updateDashboardVisibility(true);
          renderDialCards();

        } catch(err) {
          document.getElementById('importStatus').innerText = '❌ VCF 解析失败：' + err.message;
        }
      };
      reader.readAsText(file, 'utf-8');
    }

    // Render client list
    function renderDialCards() {
      var container = document.getElementById('cardsContainer');
      if (!container) return;
      
      updateStats();

      if (importedClients.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-light);font-size:0.82rem;display:flex;flex-direction:column;gap:12px;"><span style="font-size: 2.2rem;opacity:0.6;">📇</span><span>暂无联系人数据，请在上方导入表格或通讯录文件</span></div>';
        return;
      }

      var query = document.getElementById('searchInput').value.toLowerCase().trim();

      var filtered = importedClients.filter(function(c) {
        var matchFilter = (currentFilter === 'all') || (c.dialedStatus === currentFilter);
        var matchQuery = true;
        if (query) {
          matchQuery = c.name.toLowerCase().includes(query) || 
                       c.phone.toLowerCase().includes(query) || 
                       c.company.toLowerCase().includes(query);
        }
        return matchFilter && matchQuery;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.8rem;">无匹配此筛选条件的联系人</div>';
        return;
      }

      container.innerHTML = filtered.map(function(c) {
        // Find real index in original list
        var i = importedClients.indexOf(c);

        var badgeHtml = '<span class="xls-dial-badge xls-dial-badge-todo">待拨打</span>';
        var cardClass = 'xls-dial-card';
        if (c.dialedStatus === 'success') {
          badgeHtml = '<span class="xls-dial-badge xls-dial-badge-success">已接通 (' + (c.duration || '00:00') + ')</span>';
          cardClass += ' dialed';
        } else if (c.dialedStatus === 'failed') {
          badgeHtml = '<span class="xls-dial-badge xls-dial-badge-failed">未接通</span>';
          cardClass += ' dialed';
        }

        return '<div class="' + cardClass + '" id="xdc_' + i + '">' +
          badgeHtml +
          '<div class="client-card-top">' +
            '<div class="client-card-primary">' +
              '<span class="client-card-name">' + esc(c.name) + '</span>' +
              '<span class="client-card-phone-wrap">' +
                '<a class="client-phone" href="tel:' + esc(c.phone) + '" data-full="' + esc(c.phone) + '">' + esc(maskPhone(c.phone)) + '</a>' +
                '<button class="phone-toggle" title="显示号码">看</button>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<div class="client-card-tags">' +
            (c.company ? '<span class="client-card-tag client-card-tag-company">' + esc(c.company) + '</span>' : '') +
          '</div>' +
          '<div class="client-card-body">' +
            '<div class="client-card-content-block">' +
              '<span class="client-card-label">资料备注</span>' +
              '<span class="client-card-text">' + esc(c.note || '(空)') + '</span>' +
            '</div>' +
            (c.callNote ? 
              '<div class="client-card-content-block follow-up">' +
                '<span class="client-card-label">通话小记</span>' +
                '<span class="client-card-text" style="color:var(--accent-wechat);">' + esc(c.callNote) + '</span>' +
              '</div>' : '') +
          '</div>' +
          '<div class="client-card-actions">' +
            '<button class="btn-primary xls-card-dial-btn" data-idx="' + i + '" style="font-size:0.75rem;padding:4px 14px;height:30px;">拨打</button>' +
          '</div>' +
        '</div>';
      }).join('');

      // Wire up toggle phone
      container.querySelectorAll('.phone-toggle').forEach(function(b) {
        b.addEventListener('click', function(e) {
          e.stopPropagation();
          var phoneSpan = b.previousElementSibling;
          var full = phoneSpan.dataset.full;
          if (phoneSpan.textContent === full) {
            phoneSpan.textContent = maskPhone(full);
            b.textContent = '看';
          } else {
            phoneSpan.textContent = full;
            b.textContent = '隐';
          }
        });
      });

      // Wire up call button
      container.querySelectorAll('.xls-card-dial-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.dataset.idx);
          startCallAssistant(idx);
        });
      });
    }

    // Call Assistant Controls
    function startCallAssistant(idx) {
      var c = importedClients[idx];
      if (!c) return;

      currentCallIdx = idx;
      callSeconds = 0;

      document.getElementById('callAssistName').innerText = c.name;
      document.getElementById('callAssistPhone').innerText = maskPhone(c.phone);
      document.getElementById('callAssistTimer').innerText = '00:00';
      document.getElementById('callAssistStatus').innerText = '拨号已唤起，请在系统电话拨打...';
      
      document.getElementById('callConnectedBtn').style.display = 'block';
      document.getElementById('callFailedBtn').style.display = 'block';
      document.getElementById('callHangupBtn').style.display = 'none';
      document.getElementById('callLogForm').style.display = 'none';
      document.getElementById('callLogNote').value = '';

      document.getElementById('callAssistOverlay').classList.add('active');

      location.href = 'tel:' + c.phone;

      if (callInterval) clearInterval(callInterval);
      callInterval = setInterval(function() {
        callSeconds++;
        var min = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        var sec = String(callSeconds % 60).padStart(2, '0');
        document.getElementById('callAssistTimer').innerText = min + ':' + sec;
      }, 1000);
    }

    function initCallControls() {
      document.getElementById('callConnectedBtn').addEventListener('click', function() {
        document.getElementById('callAssistStatus').innerText = '已接通，通话时长累计中...';
        document.getElementById('callConnectedBtn').style.display = 'none';
        document.getElementById('callFailedBtn').style.display = 'none';
        document.getElementById('callHangupBtn').style.display = 'block';
      });

      document.getElementById('callFailedBtn').addEventListener('click', function() {
        if (callInterval) clearInterval(callInterval);
        document.getElementById('callAssistStatus').innerText = '通话未接通 / 忙';
        document.getElementById('callConnectedBtn').style.display = 'none';
        document.getElementById('callFailedBtn').style.display = 'none';
        document.getElementById('callLogForm').style.display = 'flex';
        
        var c = importedClients[currentCallIdx];
        if (c) {
          c.dialedStatus = 'failed';
          c.duration = '00:00';
        }
      });

      document.getElementById('callHangupBtn').addEventListener('click', function() {
        if (callInterval) clearInterval(callInterval);
        var min = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        var sec = String(callSeconds % 60).padStart(2, '0');
        var finalDuration = min + ':' + sec;

        document.getElementById('callAssistStatus').innerText = '通话已结束 (累计时长: ' + finalDuration + ')';
        document.getElementById('callHangupBtn').style.display = 'none';
        document.getElementById('callLogForm').style.display = 'flex';

        var c = importedClients[currentCallIdx];
        if (c) {
          c.dialedStatus = 'success';
          c.duration = finalDuration;
        }
      });

      document.getElementById('callLogSaveBtn').addEventListener('click', function() {
        var c = importedClients[currentCallIdx];
        if (!c) return;

        var noteVal = document.getElementById('callLogNote').value.trim();
        c.callNote = noteVal;

        saveState();
        document.getElementById('callAssistOverlay').classList.remove('active');
        renderDialCards();
      });
    }

    // Filter controls
    function initFilters() {
      document.querySelectorAll('.filter-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          currentFilter = tab.dataset.filter;
          renderDialCards();
        });
      });

      document.getElementById('searchInput').addEventListener('input', function() {
        renderDialCards();
      });
    }

    // File buttons and Drag and drop
    function initFileInputs() {
      var xlsSelect = document.getElementById('xlsSelectBtn');
      var xlsFile = document.getElementById('xlsFileInput');
      var vcfSelect = document.getElementById('vcfSelectBtn');
      var vcfFile = document.getElementById('vcfFileInput');
      var dropZone = document.getElementById('dropZone');

      xlsSelect.addEventListener('click', function() { xlsFile.click(); });
      vcfSelect.addEventListener('click', function() { vcfFile.click(); });

      xlsFile.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) handleExcelImport(file);
        e.target.value = '';
      });

      vcfFile.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) handleVcfImport(file);
        e.target.value = '';
      });

      // Drag & Drop
      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        var file = e.dataTransfer.files[0];
        if (!file) return;
        var ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          handleExcelImport(file);
        } else if (ext === 'vcf' || ext === 'vcard') {
          handleVcfImport(file);
        } else {
          document.getElementById('importStatus').innerText = '❌ 不支持的文件格式，仅支持 Excel, CSV 或 VCF';
        }
      });
    }

    // Clear and Export Data
    function initDataActions() {
      var clearBtn = document.getElementById('clearBtn');
      var exportBtn = document.getElementById('exportBtn');
      var closeExport = document.getElementById('closeExportBtn');
      var copyExport = document.getElementById('copyExportBtn');
      var exportModal = document.getElementById('exportModal');
      var exportArea = document.getElementById('exportTextarea');

      clearBtn.addEventListener('click', function() {
        if (confirm('确认清空当前导入的客户和所有的拨号记录吗？')) {
          importedClients = [];
          saveState();
          updateDashboardVisibility(false);
          document.getElementById('importStatus').innerText = '';
          renderDialCards();
        }
      });

      exportBtn.addEventListener('click', function() {
        if (importedClients.length === 0) return;
        
        var lines = ['姓名,电话,单位,状态,时长,沟通小记'];
        importedClients.forEach(function(c) {
          var statusStr = '待拨打';
          if (c.dialedStatus === 'success') statusStr = '已接通';
          else if (c.dialedStatus === 'failed') statusStr = '未接通';

          lines.push(
            '"' + c.name + '",' +
            '"' + c.phone + '",' +
            '"' + (c.company || '') + '",' +
            '"' + statusStr + '",' +
            '"' + (c.duration || '') + '",' +
            '"' + (c.callNote || '') + '"'
          );
        });

        exportArea.value = lines.join('\\n');
        exportModal.classList.add('active');
      });

      closeExport.addEventListener('click', function() {
        exportModal.classList.remove('active');
      });

      copyExport.addEventListener('click', function() {
        exportArea.select();
        document.execCommand('copy');
        copyExport.textContent = '✅ 已成功复制！';
        setTimeout(function() {
          copyExport.textContent = '复制记录到剪贴板';
        }, 1500);
      });
    }

    // Main Init
    initDark();
    initFileInputs();
    initCallControls();
    initFilters();
    initDataActions();
    loadPersistedState();

  })();
  </script>
</body>
</html>`;

    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  }
};
