export const DIALER_HTML = `<!DOCTYPE html>
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
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .container {
      flex: 1;
      width: 100%;
      max-width: none;
      margin: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-app);
    }

    /* Header Bar — full width */
    .header-bar {
      height: 36px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      position: relative;
      background: var(--card-bg);
    }
    .header-stats-minimal {
      font-size: 0.78rem;
      font-weight: 900;
      color: var(--text-soft);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-dropdown {
      position: absolute;
      top: 34px;
      right: 4px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 2500;
      display: flex;
      flex-direction: column;
      padding: 4px 0;
      max-height: 60vh;
      overflow-y: auto;
      min-width: 140px;
    }
    .dropdown-item {
      padding: 8px 14px;
      font-size: 0.76rem;
      color: var(--text-soft);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
      font-weight: 700;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
    }
    .dropdown-item:hover {
      background: var(--btn-hover);
      color: var(--text-main);
    }
    .icon-btn {
      background: var(--btn-bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      font-size: 0.76rem;
      font-weight: 800;
      padding: 4px 10px;
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
    
    /* Dashboard Area — now a modal overlay */
    .dashboard-panel {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--modal-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 5000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .dashboard-panel.active {
      opacity: 1;
      pointer-events: auto;
    }
    .dashboard-panel .import-zone {
      background: var(--modal-card);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      box-shadow: 0 15px 45px rgba(0,0,0,0.3);
      width: 92vw;
      max-width: 520px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      transform: translateY(20px);
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 0.8);
    }
    .dashboard-panel.active .import-zone {
      transform: translateY(0);
    }
    .import-close-btn {
      position: absolute;
      top: 12px; right: 12px;
      width: 32px; height: 32px;
      border: none; background: rgba(0,0,0,0.08);
      border-radius: 50%; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-soft); z-index: 10;
      transition: all 0.2s;
    }
    .import-close-btn:hover { background: #e81123; color: #fff; }
    body.dark-mode .import-close-btn { background: rgba(255,255,255,0.1); }
    body.dark-mode .import-close-btn:hover { background: #e81123; color: #fff; }
    /* Legacy import-zone dragover state (still used inside modal) */
    .import-zone.dragover {
      border-color: var(--accent-wechat);
      background: var(--accent-wechat-bg);
    }
    .import-buttons {
      display: flex;
      gap: 10px;
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
    
    /* Stats Bar — compact horizontal */
    .stats-bar {
      margin-top: 0;
      display: flex;
      align-items: center;
      gap: 24px;
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 6px 0;
      flex-wrap: wrap;
    }
    .stat-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .stat-label {
      font-size: 0.7rem;
      color: var(--text-light);
    }
    .stat-val {
      font-size: 0.95rem;
      font-weight: 900;
      color: var(--text-main);
    }
    .progress-track {
      flex: 1;
      min-width: 120px;
      height: 6px;
      background: var(--btn-bg);
      border-radius: 3px;
      overflow: hidden;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: var(--wechat-gradient);
      width: 0%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* Control Panel — full width toolbar */
    .control-bar {
      min-height: 40px;
      padding: 6px 16px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      flex-wrap: wrap;
      background: var(--card-bg);
    }
    .search-input {
      width: 160px;
      flex-shrink: 0;
      height: 30px;
      background: var(--bg-app);
      border: 1px solid var(--card-border);
      border-radius: 4px;
      padding: 0 10px;
      font-size: 0.78rem;
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
    
    /* Cards Container — Table on desktop, cards on mobile */
    .cards-content {
      flex: 1;
      overflow: auto;
      padding: 0;
    }
    /* CRM Table */
    .crm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      min-width: 900px;
    }
    .crm-table thead th {
      position: sticky; top: 0; z-index: 2;
      background: #f0f0f0;
      padding: 6px 10px;
      text-align: left;
      font-weight: 700;
      color: #444;
      border: 1px solid #d0d0d0;
      border-top: none;
      border-bottom: 2px solid #c0c0c0;
      white-space: nowrap;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }
    .crm-table thead th:hover { background: #e4e4e4; }
    .crm-table thead th .sort-arrow { font-size: 10px; margin-left: 2px; opacity: 0.35; }
    .crm-table thead th.sorted .sort-arrow { opacity: 1; color: #4a6cf7; }
    .crm-table td {
      padding: 4px 10px;
      border: 1px solid #e0e0e0;
      color: #333;
      white-space: nowrap;
      font-size: 13px;
      vertical-align: middle;
    }
    .crm-table tbody tr:nth-child(even) td { background: #f8f9fa; }
    .crm-table tbody tr:hover td { background: rgba(74,108,247,0.05) !important; }
    .crm-table tbody tr.row-dialed td { opacity: 0.55; }
    .crm-table .col-no { width: 40px; text-align: center; color: #aaa; font-size: 11px; }
    .crm-table .col-status { width: 80px; }
    .crm-table .col-name { min-width: 70px; }
    .crm-table .col-phone { min-width: 115px; font-family: monospace; }
    .crm-table .col-company { min-width: 140px; }
    .crm-table .col-note { min-width: 80px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
    .crm-table .col-batch { min-width: 90px; }
    .crm-table .col-action { width: 60px; text-align: center; }
    body.dark-mode .crm-table thead th { background: #2a2a2a; border-color: #444; color: #ccc; border-bottom-color: #555; }
    body.dark-mode .crm-table thead th:hover { background: #333; }
    body.dark-mode .crm-table td { color: #ddd; border-color: #3a3a3a; }
    body.dark-mode .crm-table tbody tr:nth-child(even) td { background: #232323; }
    body.dark-mode .crm-table tbody tr:hover td { background: rgba(74,108,247,0.1) !important; }
    .xls-dial-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: none;
      position: relative;
      transition: all 0.15s ease;
    }
    .xls-dial-card:hover {
      border-color: rgba(74,108,247,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .xls-dial-card.dialed {
      opacity: 0.65;
      border-color: var(--border-light);
      background: rgba(0, 0, 0, 0.01);
    }
    body.dark-mode .xls-dial-card.dialed {
      background: rgba(255, 255, 255, 0.01);
    }
    .xls-dial-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
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
    .client-card-name-btn {
      font-size: 0.92rem;
      font-weight: 900;
      color: var(--text-main);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 4px;
      border-radius: var(--radius-xs);
      transition: all 0.2s;
    }
    .client-card-name-btn:hover {
      background: var(--btn-hover);
    }
    .client-card-phone-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .client-phone-btn {
      font-family: monospace;
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text-soft);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      padding: 1px 4px;
      border-radius: var(--radius-xs);
      transition: all 0.2s;
    }
    .client-phone-btn:hover {
      background: var(--btn-hover);
      color: var(--text-main);
    }
    .client-phone-btn.copied {
      color: var(--text-main) !important;
      text-shadow: 0 0 6px rgba(7, 193, 96, 0.45);
      font-weight: 900;
    }
    body.dark-mode .client-phone-btn.copied {
      text-shadow: 0 0 8px rgba(7, 193, 96, 0.6);
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
      cursor: pointer;
      transition: all 0.2s;
    }
    .client-card-tag-company:hover {
      background: var(--btn-hover);
    }
    .client-card-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
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
      padding-top: 6px;
      margin-top: 0px;
    }
    
    /* AI Importer Animations */
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.15; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }
    @keyframes laser-scan {
      0% { top: 0%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .ai-laser-line {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, rgba(7,193,96,0) 0%, rgba(7,193,96,0.8) 50%, rgba(7,193,96,0) 100%);
      box-shadow: 0 0 8px rgba(7,193,96,0.6);
      animation: laser-scan 2s infinite linear;
      pointer-events: none;
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

    /* Auth overlays — full-screen login/setup */
    .auth-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--bg-app);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.3s ease;
      padding: 16px;
    }
    .auth-overlay.auth-hidden {
      display: none;
    }
    .auth-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      box-shadow: var(--shadow-card);
      max-width: 380px;
      width: 90vw;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .auth-title {
      font-size: 1rem;
      font-weight: 900;
      color: var(--text-main);
      text-align: center;
    }
    .auth-subtitle {
      font-size: 0.72rem;
      color: var(--text-soft);
      text-align: center;
      font-weight: 700;
    }
    .auth-input {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      font-size: 0.85rem;
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-xs);
      font-weight: 700;
      outline: none;
      background: var(--card-bg);
      color: var(--text-main);
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .auth-input:focus {
      border-color: var(--accent-wechat);
    }
    .auth-pin-input {
      font-size: 1.2rem;
      letter-spacing: 6px;
      text-align: center;
      font-family: monospace;
    }
    .auth-select {
      width: 100%;
      height: 40px;
      padding: 0 10px;
      font-size: 0.82rem;
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-xs);
      font-weight: 700;
      outline: none;
      background: var(--card-bg);
      color: var(--text-main);
      cursor: pointer;
      font-family: monospace;
    }
    .auth-error {
      font-size: 0.65rem;
      color: #e74c3c;
      min-height: 18px;
      text-align: center;
      font-weight: 700;
    }
    .auth-btn {
      width: 100%;
      height: 42px;
      background: var(--accent-wechat);
      color: white;
      border: none;
      border-radius: var(--radius-xs);
      font-size: 0.9rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(7,193,96,0.2);
      transition: all 0.2s;
    }
    .auth-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(7,193,96,0.3);
    }
    .auth-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .auth-link {
      font-size: 0.7rem;
      color: var(--text-light);
      text-align: center;
      cursor: pointer;
      font-weight: 700;
      text-decoration: underline;
      transition: color 0.2s;
    }
    .auth-link:hover {
      color: var(--accent-wechat);
    }
    .auth-account-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
    }
    .auth-account-item {
      padding: 10px 12px;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xs);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-main);
      background: var(--btn-bg);
      transition: all 0.15s;
      text-align: left;
    }
    .auth-account-item:hover {
      border-color: var(--accent-wechat);
      background: var(--accent-wechat-bg);
    }
    .auth-account-item.selected {
      border-color: var(--accent-wechat);
      background: var(--accent-wechat-bg);
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


    
    /* Android APK full-screen spacing */
    body.android .app-shell { padding-top: 39px; }

    /* Mobile Adaptive Styles for iOS & Android */
    @media (max-width: 480px) {
      .container {
        border-left: none;
        border-right: none;
        border-radius: 0;
        box-shadow: none;
      }
      .control-bar {
        padding: 4px 8px;
        gap: 4px;
        min-height: 42px;
      }
      .search-input {
        width: 100px;
        padding: 0 6px;
        font-size: 0.74rem;
      }
      .filter-group {
        gap: 2px;
      }
      .filter-tab {
        padding: 0 6px;
        font-size: 0.7rem;
        height: 28px;
      }
      .header-bar {
        height: 38px;
        padding: 0 10px;
      }
      .header-stats-minimal {
        font-size: 0.72rem;
      }
      .cards-content {
        padding: 6px 8px;
        gap: 6px;
        grid-template-columns: 1fr; /* single column on mobile */
      }
      .xls-dial-card {
        padding: 8px 10px;
        gap: 5px;
        border-radius: 6px;
      }
      .card-copy-btn {
        top: 6px;
        right: 10px;
        padding: 2px 5px;
        font-size: 0.62rem;
      }
      .client-card-name-btn {
        font-size: 0.88rem;
        padding: 1px 2px;
      }
      .client-phone {
        font-size: 0.78rem;
      }
      .xls-dial-badge {
        font-size: 0.6rem;
        padding: 1px 4px;
      }
      .client-card-tag {
        font-size: 0.6rem;
        padding: 1px 4px;
      }
      .client-card-body {
        gap: 2px;
        padding-left: 6px;
      }
      .client-card-text {
        font-size: 0.72rem;
      }
      .client-card-actions {
        padding-top: 4px;
      }
      .xls-card-dial-btn {
        height: 26px;
        padding: 0 10px;
        font-size: 0.72rem;
      }
      #toggleCopyLimitBtn,
      .copy-limit-sub {
        display: none !important;
      }
    }

    /* Whitelist match badges */
    .xls-dial-badge-whitelist {
      background: rgba(7,193,96,0.1);
      color: var(--accent-wechat);
      border: 0.5px solid rgba(7,193,96,0.2);
    }
    .xls-dial-badge-not-whitelist {
      background: rgba(231,76,60,0.1);
      color: #e74c3c;
      border: 0.5px solid rgba(231,76,60,0.2);
    }

    /* Copy limit toast */
    .copy-limit-toast {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: #e74c3c;
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(231, 76, 60, 0.35);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      max-width: 90vw;
      text-align: center;
    }
    .copy-limit-toast.show {
      opacity: 1;
      pointer-events: auto;
    }
    .copy-limit-toast.warn {
      background: #f39c12;
      box-shadow: 0 4px 16px rgba(243, 156, 18, 0.35);
    }
    .copy-limit-sub {
      padding-left: 24px !important;
      font-size: 0.72rem !important;
      opacity: 0.85;
    }
    /* ====== Professional CRM Dashboard ====== */
    .db-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 99999;
      display: none; align-items: center; justify-content: center;
      -webkit-overflow-scrolling: touch;
      backdrop-filter: blur(8px);
    }
    .db-overlay.active { display: flex; }
    .db-panel {
      background: #f8fafc; border-radius: 8px; width: 96vw; max-width: 1400px;
      height: 92vh; max-height: 900px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }
    body.dark-mode .db-panel { background: #0f172a; border-color: #334155; }
    
    /* CRM Tabs bar */
    .crm-tabs {
      display: flex; background: #fff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
      align-items: center; padding: 0 16px; gap: 8px; height: 44px;
    }
    body.dark-mode .crm-tabs { background: #1e293b; border-color: #334155; }
    .crm-tab {
      display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; height: 44px;
      font-size: 0.82rem; font-weight: 700; color: #64748b; cursor: pointer; position: relative;
      user-select: none; transition: all 0.2s ease;
    }
    .crm-tab:hover { color: #ff5722; }
    .crm-tab.active { color: #ff5722; }
    .crm-tab.active::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: #ff5722; border-top-left-radius: 3px; border-top-right-radius: 3px;
    }
    .crm-tab-close {
      font-size: 10px; opacity: 0.5; margin-left: 4px; border-radius: 50%; width: 14px; height: 14px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .crm-tab-close:hover { background: rgba(0,0,0,0.1); opacity: 1; }
    body.dark-mode .crm-tab { color: #94a3b8; }
    body.dark-mode .crm-tab.active { color: #ff5722; }
    
    .db-header { display: none; }
    .crm-tabs-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .db-close {
      width: 28px; height: 28px; border: none; background: rgba(0,0,0,0.06); border-radius: 4px;
      font-size: 0.9rem; cursor: pointer; color: #666; display: flex; align-items: center; justify-content: center;
    }
    .db-close:hover { background: #e81123; color: #fff; }
    body.dark-mode .db-close { background: rgba(255,255,255,0.08); color: #cbd5e1; }
    body.dark-mode .db-close:hover { background: #e81123; color: #fff; }
    
    /* CRM Shortcut Filter bar */
    .crm-shortcut-bar {
      display: flex; gap: 8px; padding: 10px 16px 6px 16px; align-items: center; flex-shrink: 0;
      background: #fff;
    }
    body.dark-mode .crm-shortcut-bar { background: #1e293b; }
    .crm-shortcut-btn {
      padding: 5px 16px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.78rem;
      background: #f8fafc; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .crm-shortcut-btn:hover { border-color: #ff5722; color: #ff5722; }
    .crm-shortcut-btn.active { background: rgba(255,87,34,0.08); border-color: #ff5722; color: #ff5722; }
    body.dark-mode .crm-shortcut-btn { background: #0f172a; border-color: #334155; color: #94a3b8; }
    body.dark-mode .crm-shortcut-btn.active { background: rgba(255,87,34,0.15); color: #ff5722; border-color: #ff5722; }
    .crm-shortcut-add {
      font-size: 1.1rem; color: #ff5722; font-weight: 800; cursor: pointer; padding: 0 4px;
    }
    .crm-shortcut-toggle {
      margin-left: auto; font-size: 0.72rem; font-weight: 700; color: #64748b;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;
      padding: 5px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
      transition: all 0.2s; white-space: nowrap;
    }
    .crm-shortcut-toggle:hover { border-color: #ff5722; color: #ff5722; }
    body.dark-mode .crm-shortcut-toggle { background: #0f172a; border-color: #334155; color: #94a3b8; }

    /* CRM Search Area */
    .crm-search-card {
      background: #fff; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
      transition: all 0.3s ease;
    }
    .crm-search-card.collapsed {
      display: none;
    }
    }
    body.dark-mode .crm-search-card { background: #1e293b; border-color: #334155; }
    .crm-search-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;
      align-items: center;
    }
    .crm-search-item { display: flex; align-items: center; gap: 8px; }
    .crm-search-item-full { grid-column: 1 / -1; }
    .crm-search-item-full .crm-input {
      font-size: 0.82rem; height: 36px; border-color: #ff5722; border-width: 1.5px;
      background: #fffbf5; font-weight: 600;
    }
    .crm-search-item-full .crm-input:focus { border-color: #e64a19; box-shadow: 0 0 0 3px rgba(255,87,34,0.1); }
    body.dark-mode .crm-search-item-full .crm-input { background: #1a1a2e; border-color: #ff5722; }
    .crm-search-label { font-size: 0.78rem; font-weight: 700; color: #475569; white-space: nowrap; width: 64px; }
    body.dark-mode .crm-search-label { color: #94a3b8; }
    .crm-input, .crm-select {
      flex: 1; height: 32px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 4px;
      font-size: 0.78rem; outline: none; background: #fff; color: #1e293b; transition: border 0.15s;
      width: 100%;
    }
    .crm-input:focus, .crm-select:focus { border-color: #ff5722; }
    body.dark-mode .crm-input, body.dark-mode .crm-select { background: #0f172a; border-color: #334155; color: #cbd5e1; }
    
    .crm-search-actions { display: flex; gap: 8px; margin-top: 10px; justify-content: flex-start; }
    .crm-btn-search {
      height: 32px; padding: 0 20px; border-radius: 4px; background: #ff5722; color: #fff;
      font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
    }
    .crm-btn-search:hover { background: #f4511e; }
    .crm-btn-reset {
      height: 32px; padding: 0 16px; border-radius: 4px; background: #fff; color: #475569;
      font-size: 0.78rem; font-weight: 700; border: 1px solid #cbd5e1; cursor: pointer;
    }
    .crm-btn-reset:hover { border-color: #ff5722; color: #ff5722; }
    body.dark-mode .crm-btn-reset { background: #0f172a; border-color: #334155; color: #94a3b8; }

    /* Action Toolbar */
    .crm-toolbar {
      display: flex; gap: 8px; padding: 10px 16px; align-items: center; flex-shrink: 0;
      background: #fff; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap;
    }
    body.dark-mode .crm-toolbar { background: #1e293b; border-color: #334155; }
    .crm-tool-btn {
      height: 30px; padding: 0 12px; border-radius: 4px; font-size: 0.78rem; font-weight: 700;
      background: #fff; border: 1px solid #e2e8f0; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
      transition: all 0.2s;
    }
    .crm-tool-btn:hover { border-color: #ff5722; color: #ff5722; }
    .crm-tool-btn.primary { background: #ff5722; color: #fff; border: none; }
    .crm-tool-btn.primary:hover { background: #f4511e; }
    .crm-tool-btn.green { border-color: #07c160; color: #07c160; background: rgba(7,193,96,0.03); }
    .crm-tool-btn.green:hover { background: #07c160; color: #fff; }
    .crm-tool-btn.blue { border-color: #4a6cf7; color: #4a6cf7; background: rgba(74,108,247,0.03); }
    .crm-tool-btn.blue:hover { background: #4a6cf7; color: #fff; }
    .crm-tool-btn.orange { border-color: #ff9800; color: #ff9800; background: rgba(255,152,0,0.03); }
    .crm-tool-btn.orange:hover { background: #ff9800; color: #fff; }
    .crm-tool-btn.red { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.03); }
    .crm-tool-btn.red:hover { background: #ef4444; color: #fff; }
    body.dark-mode .crm-tool-btn { background: #0f172a; border-color: #334155; color: #94a3b8; }
    body.dark-mode .crm-tool-btn.green { border-color: #07c160; color: #07c160; }
    body.dark-mode .crm-tool-btn.blue { border-color: #4a6cf7; color: #4a6cf7; }
    body.dark-mode .crm-tool-btn.orange { border-color: #ff9800; color: #ff9800; }
    body.dark-mode .crm-tool-btn.red { border-color: #ef4444; color: #ef4444; }
    .crm-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

    /* CRM Status Badges Bar */
    .crm-badge-bar {
      display: flex; gap: 16px; padding: 10px 16px; align-items: center; flex-shrink: 0;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap;
    }
    body.dark-mode .crm-badge-bar { background: #0f172a; border-color: #334155; }
    .crm-badge-bar.collapsed {
      display: none;
    }
    .crm-badge-item {
      display: inline-flex; align-items: center; gap: 6px; font-size: 0.74rem; font-weight: 700;
      color: #475569;
    }
    body.dark-mode .crm-badge-item { color: #94a3b8; }
    .crm-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .crm-dot.red { background: #ff4d4f; box-shadow: 0 0 4px #ff4d4f; }
    .crm-dot.yellow { background: #ffc53d; box-shadow: 0 0 4px #ffc53d; }
    .crm-dot.blue { background: #1890ff; box-shadow: 0 0 4px #1890ff; }
    .crm-dot.cyan { background: #13c2c2; box-shadow: 0 0 4px #13c2c2; }
    
    /* CRM Table & Layout */
    .db-table-wrap { flex: 1; overflow: auto; background: #fff; position: relative; }
    body.dark-mode .db-table-wrap { background: #1e293b; }
    .crm-table { width: 100%; border-collapse: collapse; min-width: 900px; text-align: left; }
    .crm-table thead th {
      position: sticky; top: 0; z-index: 3; background: #f1f5f9; padding: 10px 14px;
      font-size: 0.76rem; font-weight: 800; color: #475569; border-bottom: 1px solid #cbd5e1;
      white-space: nowrap; user-select: none; cursor: pointer;
    }
    body.dark-mode .crm-table thead th { background: #0f172a; color: #94a3b8; border-color: #334155; }
    .crm-table thead th:hover { background: #cbd5e1; }
    body.dark-mode .crm-table thead th:hover { background: #1e293b; }
    .crm-table thead th .sort-arrow { font-size: 9px; margin-left: 2px; opacity: 0.35; }
    .crm-table thead th.sorted .sort-arrow { opacity: 1; color: #ff5722; }
    
    .crm-table td {
      padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 0.8rem; color: #334155;
      vertical-align: middle; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;
      max-width: 260px;
    }
    body.dark-mode .crm-table td { border-color: #334155; color: #cbd5e1; }
    .crm-table tbody tr { transition: background 0.15s; }
    .crm-table tbody tr:hover { background: #f8fafc; }
    body.dark-mode .crm-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    .crm-table tbody tr.selected { background: rgba(255,87,34,0.04) !important; }
    body.dark-mode .crm-table tbody tr.selected { background: rgba(255,87,34,0.08) !important; }
    .db-loading { text-align: center; padding: 60px 20px; color: #94a3b8; }
    .db-empty { text-align: center; padding: 80px 20px; color: #94a3b8; font-size: 0.9rem; }

    /* Circle Avatar */
    .crm-name-cell { display: flex; align-items: center; gap: 8px; }
    .crm-avatar {
      width: 28px; height: 28px; border-radius: 50%; background: #4a6cf7; color: #fff;
      display: inline-flex; align-items: center; justify-content: center; font-size: 0.76rem;
      font-weight: 800; text-transform: uppercase; flex-shrink: 0;
    }
    /* New / Old Badges */
    .crm-badge-new {
      background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff;
      font-size: 10px; padding: 1px 4px; border-radius: 3px; font-weight: 700; margin-right: 4px;
    }
    .crm-badge-old {
      background: #f5f5f5; color: #8c8c8c; border: 1px solid #d9d9d9;
      font-size: 10px; padding: 1px 4px; border-radius: 3px; font-weight: 700; margin-right: 4px;
    }
    body.dark-mode .crm-badge-new { background: rgba(24,144,255,0.15); border-color: rgba(24,144,255,0.3); }
    body.dark-mode .crm-badge-old { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15); }
    
    /* Phone Cell Call icon */
    .crm-phone-cell { display: flex; align-items: center; gap: 6px; font-family: monospace; font-size: 0.82rem; }
    .crm-btn-call {
      color: #ff5722; cursor: pointer; border: none; background: none; font-size: 0.8rem;
      display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;
      width: 22px; height: 22px; transition: background 0.15s;
    }
    .crm-btn-call:hover { background: rgba(255,87,34,0.1); }
    
    /* Action Link */
    .crm-action-link {
      color: #ff5722; cursor: pointer; font-weight: 700; text-decoration: none; font-size: 0.76rem;
    }
    .crm-action-link:hover { text-decoration: underline; }

    /* Footer / Pager */
    .crm-pager {
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
      padding: 10px 16px; border-top: 1px solid #e2e8f0; background: #fff; flex-wrap: wrap; gap: 8px;
    }
    body.dark-mode .crm-pager { background: #1e293b; border-color: #334155; }
    .crm-pager-left { font-size: 0.78rem; color: #64748b; }
    body.dark-mode .crm-pager-left { color: #cbd5e1; }
    .crm-pager-center { display: flex; align-items: center; gap: 8px; }
    .crm-pager-btn {
      height: 28px; padding: 0 12px; border: 1px solid #cbd5e1; background: #fff; color: #475569;
      border-radius: 4px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .crm-pager-btn:hover:not(:disabled) { border-color: #ff5722; color: #ff5722; }
    .crm-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    body.dark-mode .crm-pager-btn { background: #0f172a; border-color: #334155; color: #cbd5e1; }
    
    .crm-pager-right { display: flex; align-items: center; gap: 8px; }
    .crm-select-page {
      height: 28px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.78rem;
      padding: 0 4px; background: #fff; color: #475569; cursor: pointer;
    }
    body.dark-mode .crm-select-page { background: #0f172a; border-color: #334155; color: #cbd5e1; }
    
    /* Category tag override */
    .cust-cat-tag {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 700; cursor: pointer;
      background: #f0f0f0; color: #888; border: 1px dashed #ccc;
      max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cust-cat-tag.set { border-style: solid; }
    .cust-cat-tag:hover { filter: brightness(0.9); }
    .cust-cat-tag.cat-潜在客户 { background:#e3f2fd;color:#1565c0;border-color:#90caf9; }
    .cust-cat-tag.cat-意向客户 { background:#fff3e0;color:#e65100;border-color:#ffcc80; }
    .cust-cat-tag.cat-已成交 { background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7; }
    .cust-cat-tag.cat-无效号码 { background:#fce4ec;color:#c62828;border-color:#ef9a9a; }
    .cust-cat-tag.cat-待跟进 { background:#f3e5f5;color:#6a1b9a;border-color:#ce93d8; }
    .cust-cat-tag.cat-老客户 { background:#e0f7fa;color:#006064;border-color:#80deea; }
    .cust-cat-tag.cat-同行 { background:#fff8e1;color:#f57f17;border-color:#fff176; }
    .cust-cat-tag.cat-其他 { background:#eceff1;color:#455a64;border-color:#b0bec5; }
    .cust-cat-edit-wrap { display: inline-flex; gap: 2px; align-items: center; }
    .cust-cat-select, .cust-cat-input { font-size: 11px; padding: 1px 4px; border-radius: 3px; border: 1px solid #ff5722; outline: none; }
    .cust-cat-input { width: 60px; }
    .cust-cat-save, .cust-cat-cancel { font-size: 10px; padding: 1px 6px; border-radius: 3px; cursor: pointer; border: none; font-weight: 700; }
    .cust-cat-save { background: #07c160; color: #fff; }
    .cust-cat-cancel { background: #eee; color: #666; }
    /* Mobile responsive */
    @media (max-width: 768px) {
      .db-panel { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
      .crm-search-grid { grid-template-columns: 1fr; }
      .crm-tabs { padding: 0 8px; gap: 2px; }
      .crm-tab { padding: 0 8px; font-size: 0.76rem; }
      .crm-toolbar { padding: 6px 12px; gap: 4px; }
      .crm-tool-btn { padding: 0 8px; font-size: 0.74rem; }
      .crm-badge-bar { padding: 6px 12px; gap: 8px; }
      .crm-table td, .crm-table thead th { padding: 8px 10px; font-size: 0.76rem; }
    }
      .db-pager { padding: 4px 10px; }
      .db-cat-bar { padding: 3px 10px; }
    }
  </style>
</head>
<body>
  <div class="copy-limit-toast" id="copyLimitToast"></div>

  <!-- Auth: Login Overlay -->
  <div id="authLoginOverlay" class="auth-overlay auth-hidden">
    <div class="auth-card">
      <div class="auth-title">智能快捷拨号</div>
      <div class="auth-subtitle">输入账户名和 PIN 码登录</div>
      <input type="text" id="authLoginAccountName" class="auth-input" placeholder="账户名" autocomplete="off">
      <input type="password" id="authLoginPin" class="auth-input auth-pin-input" maxlength="6" inputmode="numeric" placeholder="PIN 码" autocomplete="off">
      <div id="authLoginError" class="auth-error"></div>
      <button id="authLoginBtn" class="auth-btn">登录</button>
      <span id="authShowSetupLink" class="auth-link">首次使用？创建新账户</span>
    </div>
  </div>

  <!-- Auth: Setup Overlay (first time) -->
  <div id="authSetupOverlay" class="auth-overlay auth-hidden">
    <div class="auth-card">
      <div class="auth-title">首次设置</div>
      <div class="auth-subtitle">创建主账户以保护您的客户数据</div>
      <input type="text" id="authSetupName" class="auth-input" maxlength="20" placeholder="账户名（登录用，如：办公室）" autocomplete="off">
      <input type="text" id="authSetupLabel" class="auth-input" maxlength="20" placeholder="显示标签（可选）" autocomplete="off">
      <input type="password" id="authSetupPin" class="auth-input auth-pin-input" maxlength="6" inputmode="numeric" placeholder="设置 4-6 位 PIN 码" autocomplete="new-password">
      <input type="password" id="authSetupPinConfirm" class="auth-input auth-pin-input" maxlength="6" inputmode="numeric" placeholder="再次输入 PIN 码" autocomplete="new-password">
      <div id="authSetupError" class="auth-error"></div>
      <button id="authSetupBtn" class="auth-btn">创建主账户</button>
      <span id="authShowLoginLink" class="auth-link">已有账户？返回登录</span>
    </div>
  </div>

  <div class="app-shell">
    <div class="container">
      <!-- Header -->
      <div class="header-bar">
        <!-- Minimal Stats on the Left -->
        <div class="header-stats-minimal" id="headerStatsMinimal" style="display: none;">
          <span>进度:</span>
          <span id="doneCount" style="color: var(--accent-wechat);">0</span>
          <span style="color: var(--text-light);">/</span>
          <span id="totalCount">0</span>
          <span id="percentText" style="font-size: 0.65rem; color: var(--text-light); margin-left: 2px;">(0%)</span>
        </div>
        
        <!-- Auto Dial Toggle -->
        <button id="autoDialBtn" title="自动拨打" style="font-size: 0.78rem; padding: 4px 10px; border: 1px solid var(--accent-wechat); background: var(--accent-wechat-bg); color: var(--accent-wechat); cursor: pointer; outline: none; font-weight: 700; border-radius: var(--radius-xs); white-space: nowrap;">自动拨打</button>
        <button id="refreshBatchBtn" title="从数据库按最新导入顺序拉取，与看板同序，拉过的自动沉底" onclick="if(window.refreshBatch)window.refreshBatch()" style="font-size: 0.78rem; padding: 4px 10px; border: 1px solid #e67e22; background: rgba(230,126,34,0.08); color: #e67e22; cursor: pointer; outline: none; font-weight: 700; border-radius: var(--radius-xs); margin-right: 8px; white-space: nowrap;">换一批</button>
        <span id="accountDisplay" onclick="if(window.showAccountSettings)window.showAccountSettings()" style="font-size:0.68rem; color:var(--text-light); font-weight:700; cursor:pointer; padding:3px 8px; border:1px dashed var(--card-border); border-radius:3px; margin-right:6px; white-space:nowrap; font-family:monospace;" title="点击设置账户"></span>
        <!-- Dropdown Menu Trigger on the Right -->
        <div style="position: relative; display: inline-block;">
          <button id="headerMenuBtn" title="更多设置" style="font-size: 0.8rem; padding: 6px 10px; border: none; background: transparent; cursor: pointer; outline: none; font-weight: 800; color: var(--text-soft); min-width: 44px; min-height: 34px; -webkit-tap-highlight-color: transparent; touch-action: manipulation;">更多</button>
          <div class="header-dropdown" id="headerDropdown" style="display: none;">
            <button class="dropdown-item" id="toggleImportBtn">导入文件</button>
            <button class="dropdown-item" id="toggleDualSimBtn">双卡轮换: 开</button>
            <button class="dropdown-item" id="toggleRotationBtn">轮换频率: 10通</button>
            <button class="dropdown-item" id="toggleCopyLimitBtn">复制限制: 开</button>
            <button class="dropdown-item copy-limit-sub" id="toggleThreshold20">  20次限制: 开</button>
            <button class="dropdown-item copy-limit-sub" id="toggleThreshold30">  30次限制: 开</button>
            <button class="dropdown-item" id="exportBtn" style="display:none;">导出记录</button>
            <button class="dropdown-item" id="clearBtn" style="display:none; color: #e74c3c;">清空数据</button>
            <button class="dropdown-item" id="darkToggleBtn">切换主题</button>
            <button class="dropdown-item" id="accountSettingsBtn">账户设置</button>
          </div>
        </div>

        <!-- Super thin absolute-positioned progress line at bottom of header -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--border-light); overflow: hidden;">
          <div class="progress-fill" id="progressFill" style="height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <!-- Dashboard -->
      <div class="dashboard-panel" id="dashboardPanel">
        <!-- AI Drag & Drop Zone -->
        <div class="import-zone" id="dropZone" style="position: relative; overflow: hidden; min-height: 200px;">
          <!-- Close Button -->
          <button class="import-close-btn" id="importCloseBtn" title="关闭导入面板">关闭</button>
          <!-- Animation Laser Line (Only visible during scanning) -->
          <div id="aiLaserLine" class="ai-laser-line" style="display: none;"></div>

          <!-- 1. INITIAL STATE -->
          <div id="aiImportInit" style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;">
            <!-- Pulsing AI Brain Core SVG -->
            <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(7, 193, 96, 0.4); animation: pulse-ring 2s infinite ease-in-out;"></div>
              <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: var(--wechat-gradient); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; box-shadow: 0 0 10px rgba(7, 193, 96, 0.4);"></div>
            </div>
            <span style="font-size: 0.88rem; color: var(--text-main); font-weight: 900; letter-spacing: 0.5px;">BH-AI 智能双引擎导入助手</span>
            <span style="font-size: 0.7rem; color: var(--text-light); max-width: 320px; line-height: 1.4; margin-top: -4px;">搭载启发式文字密度与特征识别算法，自动检测表头、过滤噪音，100% 本地隐私安全。</span>
            <button id="ocrTrainingDataBtn" style="background:transparent; border:1px solid var(--card-border); font-size:0.62rem; color:var(--text-soft); cursor:pointer; display:inline-flex; align-items:center; gap:3px; padding:2px 8px; border-radius:10px; margin-top:-2px;">训练数据 (<span id="trainingCountBadge" style="color:var(--accent-wechat);font-weight:800;">0</span>)</button>
            <a id="dialerTemplateBtn" style="font-size:0.62rem; color:var(--accent-wechat); cursor:pointer; font-weight:700; text-decoration:underline; margin-top:-2px; white-space:nowrap;" title="下载客户导入Excel模板文件">📥 下载导入模板</a>

            
            
            <div class="import-buttons" style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; width: 100%;">
              <label class="btn-primary" for="xlsFileInput" id="xlsSelectBtn" style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding: 8px 16px; font-size: 0.76rem; flex: 1; min-width: 130px; text-align: center;">导入表格 / 文档</label>
              <label class="btn-primary" for="imgFileInput" id="imgSelectBtn" style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding: 8px 16px; font-size: 0.76rem; flex: 1; min-width: 130px; text-align: center; background: var(--revisit-gradient) !important; color: white;">智能图片 OCR (可多选)</label>
              <label class="btn-secondary" for="vcfFileInput" id="vcfSelectBtn" style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding: 8px 16px; font-size: 0.76rem; flex: 1; min-width: 130px; text-align: center;">导入 VCF 通录</label>
              <button class="btn-secondary" id="textImportBtn" style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding: 8px 16px; font-size: 0.76rem; flex: 1; min-width: 130px; text-align: center; background: linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; font-weight:700;" onclick="document.getElementById('textImportPanel').style.display='flex';document.getElementById('textImportArea').value='';document.getElementById('textImportArea').focus();">粘贴文本识别</button>
            </div>
            <div id="textImportPanel" style="display:none; flex-direction:column; gap:6px; width:100%; margin-top:6px;">
              <textarea id="textImportArea" placeholder="在此粘贴文本，如：张三 13800138000 腾讯科技 备注" style="width:100%; height:120px; padding:8px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:var(--radius-xs); background:var(--card-bg); color:var(--text-main); resize:vertical; outline:none; font-family:monospace;"></textarea>
              <div style="display:flex; gap:6px;">
                <button class="btn-primary" id="textImportExtractBtn" style="flex:1; padding:6px; font-size:0.72rem; background:var(--wechat-gradient); color:white; border:none; border-radius:var(--radius-xs); font-weight:700;">智能识别提取</button>
                <button class="btn-secondary" style="padding:6px 12px; font-size:0.72rem; background:var(--btn-bg); color:var(--text-soft); border:1px solid var(--card-border); border-radius:var(--radius-xs);" onclick="document.getElementById('textImportPanel').style.display='none';">取消</button>
              </div>
            </div>
            <input type="file" id="xlsFileInput" accept=".xls,.xlsx,.xlsm,.csv,.docx,.pdf,.txt" style="display:none;">
            <input type="file" id="imgFileInput" accept="image/*" multiple style="display:none;">
            <input type="file" id="vcfFileInput" accept=".vcf,.vcard" style="display:none;">
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px; width: 100%;">
              <span style="font-size: 0.68rem; color: var(--text-soft); font-weight: 800; white-space: nowrap;">批次标签</span>
              <input type="text" id="batchLabelInput" placeholder="如: 6月展会名单" value="" style="flex:1; height:28px; padding:0 8px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:var(--radius-xs); background:var(--card-bg); color:var(--text-main); outline:none;">
            </div>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px; width: 100%;">
              <span style="font-size: 0.68rem; color: var(--text-soft); font-weight: 800; white-space: nowrap;">默认分类</span>
              <select id="importCategorySelect" style="flex:1; height:28px; padding:0 8px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:var(--radius-xs); background:var(--card-bg); color:var(--text-main); outline:none; cursor:pointer;">
                <option value="待跟进">待跟进</option>
                <option value="潜在客户">潜在客户</option>
                <option value="意向客户">意向客户</option>
                <option value="已成交">已成交</option>
                <option value="无效号码">无效号码</option>
                <option value="老客户">老客户</option>
                <option value="同行">同行</option>
                <option value="其他">其他</option>
                <option value="公海客户" selected>公海客户</option>
                <option value="未分类">未分类</option>
              </select>
            </div>
          </div>

          <!-- 2. SCANNING STATE -->
          <div id="aiImportScanning" style="display: none; flex-direction: column; align-items: center; gap: 12px; width: 100%; padding: 10px 0;">
            <div style="font-size: 1.6rem; animation: pulse-ring 1s infinite alternate; margin-bottom: 2px;"></div>
            <span style="font-size: 0.8rem; color: var(--text-main); font-weight: 800;" id="aiScanStatus">BH-AI 深度模型解析中...</span>
            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left; font-size: 0.65rem; color: var(--text-soft); font-family: monospace; width: 100%; max-width: 260px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: var(--radius-xs); border: 0.5px solid var(--card-border);">
              <div id="aiLog1" style="opacity: 0.4;">[ ] 正在读取数据流...</div>
              <div id="aiLog2" style="opacity: 0.4;">[ ] 正在评估特征维度...</div>
              <div id="aiLog3" style="opacity: 0.4;">[ ] 正在过滤杂质与噪音...</div>
              <div id="aiLog4" style="opacity: 0.4;">[ ] 正在匹配智能映射...</div>
            </div>
          </div>

          <!-- 4. LOCAL OCR SLICING CONFIG STATE -->
          <div id="localOcrConfigPanel" style="display: none; flex-direction: column; align-items: center; gap: 10px; width: 100%; padding: 10px 0;">
            <span style="font-size: 0.8rem; font-weight: 900; color: var(--text-main);">本地离线识别 - 栏目切分微调</span>
            <span style="font-size: 0.65rem; color: var(--text-light); text-align: center; max-width: 300px; margin-top: -6px;">请调整边界线，确保手机号列、姓名列被虚线分离开，以达到 100% 识别精准度。</span>
            
            <div style="position: relative; border: 1px solid var(--card-border); border-radius: var(--radius-xs); background: #eee; overflow: hidden; display: flex; justify-content: center; align-items: center; max-height: 180px; width: 100%; max-width: 360px;">
              <canvas id="ocrPreviewCanvas" style="max-height: 180px; max-width: 100%; object-fit: contain;"></canvas>
            </div>
            
            <!-- Sliders -->
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; max-width: 320px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-soft); font-weight: 800;">
                <span>左侧边界线: <strong id="valSplit1">25%</strong></span>
                <span>右侧边界线: <strong id="valSplit2">60%</strong></span>
              </div>
              <input type="range" id="sliderSplit1" min="5" max="95" value="25" style="width: 100%; cursor: pointer; height: 4px;">
              <input type="range" id="sliderSplit2" min="5" max="95" value="60" style="width: 100%; cursor: pointer; height: 4px;">
            </div>
            <label style="font-size: 0.75rem; color: var(--text-main); margin-top: 6px; display: none !important; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="chkUseSlicing" style="accent-color: var(--primary-color);" checked> 启用表格列切片模式 (适合Excel截图，普通名片/照片请取消勾选)
            </label>

            <!-- Column Order Preset -->
            <div style="display: flex; gap: 8px; align-items: center; width: 100%; max-width: 320px;">
              <span style="font-size: 0.65rem; color: var(--text-soft); font-weight: 800; white-space: nowrap;">栏目顺序:</span>
              <select id="ocrColumnOrder" style="flex: 1; height: 26px; font-size: 0.68rem; border-radius: var(--radius-xs); border: 1px solid var(--card-border); background: var(--btn-bg); color: var(--text-main); font-weight: 700; outline: none;">
                <option value="name_phone_other">左:姓名 | 中:电话 | 右:单位或备注</option>
                <option value="phone_name_other">左:电话 | 中:姓名 | 右:单位或备注</option>
                <option value="name_other_phone">左:姓名 | 中:单位或备注 | 右:电话</option>
              </select>
            </div>

            <div style="display: flex; gap: 10px; width: 100%; max-width: 320px; margin-top: 4px;">
              <button id="btnStartLocalOcr" class="btn-primary" style="flex: 1; padding: 6px; font-size: 0.75rem; background: var(--wechat-gradient) !important; color: white;">开始本地识别</button>
              <button id="btnCancelLocalOcr" class="btn-secondary" style="padding: 6px 14px; font-size: 0.75rem;">取消</button>
            </div>
          </div>

          <!-- 3. REPORT STATE -->
          <div id="aiImportReport" style="display: none; flex-direction: column; width: 100%; text-align: left; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-light); padding-bottom: 6px;">
              <span id="aiReportTitle" style="font-size: 0.8rem; font-weight: 900; color: var(--text-main);">AI 识别报告</span>
              <span id="aiConfidenceBadge" style="font-size: 0.62rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(7, 193, 96, 0.1); color: var(--accent-wechat); border: 0.5px solid rgba(7, 193, 96, 0.2);">● 置信度: 98%</span>
            </div>

            <!-- Mapped Pillars -->
            <div id="aiExcelMappingPills" style="display: flex; flex-wrap: wrap; gap: 4px; background: var(--btn-bg); padding: 6px; border-radius: var(--radius-xs);">
              <div style="font-size: 0.65rem; font-weight: 800; color: var(--text-soft); width: 100%; margin-bottom: 2px;">AI 智能列映射映射关系：</div>
              <div class="client-card-tag" id="pillName" style="background: rgba(7,193,96,0.08); color: var(--accent-wechat);">姓名 → 未识别</div>
              <div class="client-card-tag" id="pillPhone" style="background: rgba(7,193,96,0.08); color: var(--accent-wechat);">电话 → 未识别</div>
              <div class="client-card-tag" id="pillCompany" style="background: rgba(74,108,247,0.08); color: #4a6cf7;">公司 → 无</div>
              <div class="client-card-tag" id="pillNote" style="background: rgba(245,124,0,0.08); color: #f57c00;">备注 → 无</div>
            </div>

            <!-- Manual Override Button & Selectors (Collapsed by default) -->
            <div id="aiExcelMappingControls" style="width: 100%;">
              <button id="aiToggleAdjustBtn" style="background: transparent; border: none; font-size: 0.65rem; font-weight: 800; color: var(--text-soft); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 2px 0; outline: none;">手动修正 AI 映射结果 ▾</button>
              <div id="aiAdjustControls" style="display: none; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 4px; border: 1px dashed var(--card-border); padding: 8px; border-radius: var(--radius-xs); background: var(--card-bg);">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">姓名数据列</label>
                  <select id="aiSelName" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">电话数据列</label>
                  <select id="aiSelPhone" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">公司数据列 (可选)</label>
                  <select id="aiSelCompany" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">备注数据列 (可选)</label>
                  <select id="aiSelNote" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>
                </div>
              </div>
            </div>

            <!-- Live Preview Table -->
            <div id="aiExcelPreviewContainer" style="width: 100%; border: 1px solid var(--card-border); border-radius: var(--radius-xs); overflow: hidden; background: var(--card-bg);">
              <div style="font-size: 0.6rem; font-weight: 800; color: var(--text-light); background: var(--btn-bg); padding: 4px 8px; border-bottom: 1px solid var(--card-border);">AI 导入数据效果实时预览 (前3行)：</div>
              <div style="overflow-x: auto; width: 100%;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.65rem; text-align: left;" id="aiPreviewTable">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--card-border); font-weight: 800; color: var(--text-soft); background: rgba(0,0,0,0.01);">
                      <th style="padding: 4px 8px;">姓名</th>
                      <th style="padding: 4px 8px;">电话</th>
                      <th style="padding: 4px 8px;">公司</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Unstructured Preview Table Container (Only visible for TXT/DOCX/PDF/OCR) -->
            <div id="aiUnstructuredContainer" style="display: none; width: 100%; border: 1px solid var(--card-border); border-radius: var(--radius-xs); overflow: hidden; background: var(--card-bg);">
              <div style="font-size: 0.6rem; font-weight: 800; color: var(--text-light); background: var(--btn-bg); padding: 4px 8px; border-bottom: 1px solid var(--card-border);">AI 智能提取结果校验与编辑面板：</div>
              <div style="max-height: 250px; overflow-y: auto; overflow-x: auto; width: 100%;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.65rem; text-align: left;" id="aiUnstructuredTable">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--card-border); font-weight: 800; color: var(--text-soft); background: rgba(0,0,0,0.01); position: sticky; top: 0; background: var(--btn-bg); z-index: 10;">
                      <th style="padding: 6px 8px; width: 40px; text-align: center;">操作</th>
                      <th style="padding: 6px 8px; width: 70px;">姓名</th>
                      <th style="padding: 6px 8px; width: 100px;">电话</th>
                      <th style="padding: 6px 8px; width: 100px;">公司</th>
                      <th style="padding: 6px 8px;">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>


            <!-- Confirm Buttons -->
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
              <button id="aiConfirmImportBtn" class="btn-primary" style="flex: 1; padding: 8px; font-size: 0.78rem; font-weight: 800; border-radius: var(--radius-xs); box-shadow: var(--wechat-gradient); text-align: center;">AI 确认导入</button>
              <button id="aiResetImportBtn" class="btn-modal btn-neutral" style="padding: 8px 14px; font-size: 0.78rem; font-weight: 800; border-radius: var(--radius-xs); height: auto; box-shadow: none;">取消</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="control-bar" id="controlBar" style="display:none; flex-wrap: wrap; gap: 6px;">
        <input type="text" class="search-input" id="searchInput" placeholder="搜索" style="flex: 1; min-width: 60px;">
        <select id="sortSelect" style="height: 28px; font-size: 0.68rem; border: 1px solid var(--card-border); border-radius: var(--radius-xs); background: var(--btn-bg); color: var(--text-soft); font-weight: 800; outline: none; padding: 0 4px; cursor: pointer; flex-shrink: 0; width: 95px;">
          <option value="default" selected>导入顺序</option>
          <option value="name">姓名 A-Z</option>
          <option value="company">公司 A-Z</option>
          <option value="todo">待拨优先</option>
          <option value="dialed">已拨优先</option>
          <option value="shuffle">随机打乱</option>
        </select>
        <div class="filter-group" style="flex-shrink: 0;">
          <button class="filter-tab active" data-filter="all">全部</button>
          <button class="filter-tab" data-filter="todo">待拨打</button>
          <button class="filter-tab" data-filter="success">已接通</button>
          <button class="filter-tab" data-filter="failed">未接通</button>
        </div>
      </div>
      
      <!-- Contacts List -->
      <div class="cards-content" id="cardsContainer">
        <div style="text-align:center;padding:80px 20px;"></div>
      </div>
    </div>
  </div>
  
  <!-- Call Assistant Modal -->
  <div id="callAssistOverlay" class="modal-overlay" style="z-index:3000;">
    <div class="modal-card" style="text-align:center;gap:12px;">
      <div style="font-size:0.75rem;color:var(--text-soft);font-weight:800;letter-spacing:1px;text-transform:uppercase;">快捷呼叫助理</div>
      <div style="display:none;" id="callAssistName">-</div>
      <div style="display:flex;align-items:center;justify-content:center;margin-top:2px;">
        <div id="callAssistNameDisplay" class="client-card-name-btn" title="点击复制姓名" style="font-size:1.25rem;font-weight:900;color:var(--text-main);">-</div>
      </div>
      <div id="callAssistPhone" style="display:none;">-</div>
      <div style="display:flex;align-items:center;justify-content:center;margin-top:-2px;">
        <div id="callAssistPhoneDisplay" class="client-phone-btn" title="点击复制号码" style="font-size:1.15rem !important;font-weight:900;color:var(--text-main);">-</div>
      </div>
      <div id="callAssistCompanyRow" style="display:none;margin-top:2px;width:100%;">
        <span style="font-size:0.7rem;color:var(--text-light);font-weight:800;">公司：</span>
        <span id="callAssistCompany" title="点击复制单位" style="font-size:0.75rem;font-weight:800;color:var(--accent-wechat);background:rgba(7,193,96,0.08);padding:2px 8px;border-radius:var(--radius-xs);cursor:pointer;display:inline-block;"></span>
      </div>
      <div id="callAssistNoteRow" style="display:none;margin-top:4px;width:100%;text-align:left;">
        <span style="font-size:0.7rem;color:var(--text-light);font-weight:800;">备注：</span>
        <span id="callAssistNote" style="font-size:0.72rem;font-weight:700;color:var(--text-soft);line-height:1.4;word-break:break-all;white-space:pre-wrap;"></span>
      </div>
      <div style="display:flex;justify-content:center;margin-top:4px;width:100%;">
        <a id="callAssistDialLink" class="btn-modal btn-success" style="width:100%;text-decoration:none;display:flex;align-items:center;justify-content:center;font-size:0.85rem;height:38px;box-shadow:var(--wechat-gradient);border-radius:var(--radius-xs);">立即拨打</a>
      </div>
      
      <!-- Recording Player Container inside Call Assistant Modal -->
      <div id="callAssistRecContainer" style="display:none;text-align:left;flex-direction:column;gap:4px;width:100%;margin-top:4px;">
        <span class="client-card-label" style="font-size:0.65rem;color:var(--accent-wechat);font-weight:800;">通话录音</span>
        <div id="callAssistAudioWrapper"></div>
      </div>
      
      <!-- Remark Input Field (Directly Visible) -->
      <div style="text-align:left;display:flex;flex-direction:column;gap:4px;width:100%;">
        <span class="client-card-label" style="font-size:0.65rem;color:var(--text-light);font-weight:800;">通话小记 / 沟通记录</span>
        <textarea id="callLogNote" placeholder="在这里输入通话记录、客户意向等备注信息..." style="width:100%;height:100px;font-size:0.8rem;padding:8px 10px;background:var(--btn-bg);border:1px solid var(--card-border);border-radius:var(--radius-xs);color:var(--text-main);outline:none;font-weight:700;resize:none;"></textarea>
      </div>

      <!-- Direct Outcome Action Buttons -->
      <div style="display:flex;gap:10px;width:100%;margin-top:4px;">
        <button id="callOutcomeSuccessBtn" class="btn-modal btn-success" style="flex:1;font-size:0.85rem;height:42px;box-shadow:var(--wechat-gradient);">已接通</button>
        <button id="callOutcomeFailedBtn" class="btn-modal btn-danger" style="flex:1;font-size:0.85rem;height:42px;box-shadow:var(--intent-gradient);">未接通</button>
      </div>
    </div>
  </div>

  <!-- Export Dialog Modal -->
  <div id="exportModal" class="modal-overlay">
    <div class="modal-card export-modal-card">
      <div style="font-size:0.95rem;font-weight:900;color:var(--text-main);display:flex;justify-content:space-between;align-items:center;">
        <span>导出拨号记录</span>
        <button id="closeExportBtn" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-soft);">关闭</button>
      </div>
      <div style="font-size:0.7rem;color:var(--text-light);font-weight:700;">包含通话时长、拨号状态与通话小记</div>
      <textarea id="exportTextarea" class="export-textarea" readonly></textarea>
      <button id="copyExportBtn" class="btn-modal btn-success" style="width:100%;">复制记录到剪贴板</button>
    </div>
  </div>


  <!-- Note Details Modal -->
  <div id="noteModal" class="modal-overlay" style="z-index:100005;">
    <div class="modal-card" style="text-align:left; gap:12px;">
      <div style="font-size:0.95rem; font-weight:900; color:var(--text-main); display:flex; justify-content:space-between; align-items:center;">
        <span>客户资料备注</span>
        <button id="closeNoteModalBtn" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--text-soft); padding:0;">关闭</button>
      </div>
      <div style="border-top:1px dashed var(--border-light); padding-top:8px;">
        <p id="noteModalContent" style="font-size:0.8rem; color:var(--text-soft); line-height:1.5; white-space:pre-wrap; font-weight:700; word-break:break-all;"></p>
      </div>
    </div>
  </div>

  <!-- Custom Columns Management Modal -->
  <div id="customColumnsModal" class="modal-overlay" style="z-index:100005;">
    <div class="modal-card" style="max-width: 400px; gap: 12px; text-align: left;">
      <div style="font-size:0.95rem; font-weight:900; color:var(--text-main); display:flex; justify-content:space-between; align-items:center;">
        <span>自定义列管理</span>
        <button id="closeCustomColumnsBtn" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--text-soft); padding:0;">关闭</button>
      </div>
      <div style="font-size:0.7rem; color:var(--text-light); font-weight:700; margin-bottom: 4px;">
        您可以添加或删除 CRM 数据库的自定义数据列。自定义列的值可在 Excel 导入时手动映射关联，或在跟进备注时作为关联字段保存。
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto; border: 1px solid var(--card-border); padding: 8px; border-radius: var(--radius-xs); background: var(--btn-bg);" id="customColumnsList"></div>
      <div style="display:flex; gap:6px; margin-top:8px;">
        <input type="text" id="newCustomColInput" placeholder="输入新列名，如：微信号" style="flex:1; height:32px; padding:0 8px; font-size:0.75rem; border:1px solid var(--card-border); border-radius:4px; font-weight:bold; outline:none; background:var(--card-bg); color:var(--text-main);">
        <button id="addCustomColBtn" class="btn-primary" style="padding:0 14px; height:32px; font-size:0.75rem;">添加列</button>
      </div>
    </div>
  </div>

  <!-- Account Settings Modal -->
  <div id="accountSettingsModal" class="modal-overlay" style="z-index:100006;">
    <div class="modal-card" style="max-width: 420px; gap: 12px; text-align: left; max-height: 80vh; overflow-y: auto;">
      <div style="font-size:0.95rem; font-weight:900; color:var(--text-main); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; background:var(--modal-card); padding-bottom: 4px;">
        <span>账户设置</span>
        <button id="closeAccountSettingsBtn" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--text-soft); padding:0;">关闭</button>
      </div>
      <div style="font-size:0.7rem; color:var(--text-light); font-weight:700;">
        当前账户标识：
      </div>
      <div id="accountIdDisplay" style="font-size:0.8rem; font-weight:700; color:var(--accent-wechat); background:var(--btn-bg); padding:8px 12px; border-radius:4px; word-break:break-all; font-family:monospace;"></div>
      <div style="font-size:0.7rem; color:var(--text-light); font-weight:700; margin-top:4px;">
        账户标签：
      </div>
      <input type="text" id="accountLabelInput" placeholder="例如：办公室电脑" style="width:100%; height:34px; padding:0 10px; font-size:0.8rem; border:1px solid var(--card-border); border-radius:4px; font-weight:700; outline:none; background:var(--card-bg); color:var(--text-main); box-sizing:border-box;">
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:4px;">
        <button id="logoutBtn" class="btn-secondary" style="padding:8px 16px; font-size:0.72rem;">退出登录</button>
        <button id="saveAccountSettingsBtn" class="btn-primary" style="padding:8px 20px; font-size:0.8rem;">保存</button>
      </div>

      <!-- Master-only: sub-account management -->
      <div id="accountMasterSection" style="display:none; border-top:1px solid var(--card-border); padding-top:12px;">
        <div style="font-size:0.8rem; font-weight:900; color:var(--text-main); margin-bottom:8px;">子账户管理</div>
        <div id="subAccountList" style="display:flex; flex-direction:column; gap:4px; max-height:140px; overflow-y:auto; margin-bottom:8px;"></div>
        <div style="display:flex; gap:6px;">
          <input type="text" id="subAccountNameInput" maxlength="20" placeholder="账户名" style="flex:1; height:30px; padding:0 8px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:4px; font-weight:700; outline:none; background:var(--card-bg); color:var(--text-main);">
          <input type="password" id="subAccountPinInput" maxlength="6" placeholder="PIN码" style="width:70px; height:30px; padding:0 6px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:4px; font-weight:700; outline:none; background:var(--card-bg); color:var(--text-main); text-align:center; font-family:monospace;">
          <button id="createSubAccountBtn" class="btn-primary" style="padding:0 10px; height:30px; font-size:0.7rem;">创建</button>
        </div>
        <div id="subAccountError" style="font-size:0.6rem; color:#e74c3c; min-height:16px; margin-top:4px;"></div>
      </div>

      <!-- PIN change -->
      <div style="border-top:1px solid var(--card-border); padding-top:12px;">
        <div style="font-size:0.8rem; font-weight:900; color:var(--text-main); margin-bottom:8px;">修改 PIN 码</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <input type="password" id="changePinOld" maxlength="6" placeholder="当前PIN" style="flex:1; min-width:70px; height:30px; padding:0 8px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:4px; font-weight:700; outline:none; background:var(--card-bg); color:var(--text-main); text-align:center; font-family:monospace;">
          <input type="password" id="changePinNew" maxlength="6" placeholder="新PIN" style="flex:1; min-width:70px; height:30px; padding:0 8px; font-size:0.72rem; border:1px solid var(--card-border); border-radius:4px; font-weight:700; outline:none; background:var(--card-bg); color:var(--text-main); text-align:center; font-family:monospace;">
          <button id="changePinBtn" class="btn-secondary" style="padding:0 10px; height:30px; font-size:0.7rem;">修改</button>
        </div>
        <div id="changePinError" style="font-size:0.6rem; min-height:16px; margin-top:4px;"></div>
      </div>

      <!-- Reset (master only) -->
      <div id="accountResetSection" style="display:none; border-top:1px solid var(--card-border); padding-top:12px;">
        <button id="resetAccountsBtn" style="width:100%; height:34px; background:transparent; border:1px solid #e74c3c; color:#e74c3c; border-radius:var(--radius-xs); font-size:0.72rem; font-weight:700; cursor:pointer;">重置所有账户数据</button>
        <div id="resetAccountsError" style="font-size:0.6rem; min-height:16px; margin-top:4px; text-align:center;"></div>
      </div>
    </div>
  </div>

  <!-- SheetJS CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js"></script>

<!-- OCR Training Data Modal -->
<div class="modal-overlay" id="ocrCorrectionModal" style="z-index: 5000;">
  <div class="modal-card" style="max-width: 640px; gap: 10px; max-height: 80vh; overflow-y: auto; width: 94vw;">
    <div style="display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; background:var(--modal-card); padding-bottom: 6px; border-bottom:1px solid var(--card-border);">
      <span style="font-size:0.9rem; font-weight:900; color:var(--text-main);">OCR 训练数据收集</span>
      <button id="closeOcrCorrectionBtn" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--text-soft); line-height:1;">关闭</button>
    </div>
    <div id="ocrCorrectionStats" style="font-size:0.72rem; color:var(--text-soft); padding:0 2px;">
      已收集 <strong id="ocrCorrectionCount" style="color:var(--accent-wechat);">0</strong> 条修正记录
      <span id="ocrCorrectionBadge" style="display:none; margin-left:8px; padding:1px 8px; border-radius:10px; background:#07c160; color:white; font-size:0.6rem; font-weight:700;">可用于提示改进</span>
    </div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
      <button id="ocrExportJsonlBtn" class="btn-secondary" style="flex:1; min-width:90px; padding:6px 10px; font-size:0.68rem;">导出 JSONL</button>
      <button id="ocrRefreshCorrectionsBtn" class="btn-secondary" style="padding:6px 10px; font-size:0.68rem;">刷新</button>
      <label style="font-size:0.6rem; color:var(--text-light); cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap;">
        <input type="checkbox" id="ocrFilterEditsOnly" checked style="cursor:pointer;">
        仅显示有修改
      </label>
    </div>
    <div id="ocrCorrectionList" style="max-height:55vh; overflow-y:auto; border:1px solid var(--card-border); border-radius:var(--radius-xs); background:var(--bg-app);">
      <div style="text-align:center; padding:28px; font-size:0.72rem; color:var(--text-light);">点击"刷新"加载记录</div>
    </div>
    <div style="font-size:0.55rem; color:var(--text-light); text-align:center; padding:4px;">
      修正数据用于改进 AI 识别提示词 · 不会上传原始图片 · 每 24h 自动刷新示例缓存
    </div>
  </div>
</div>

<!-- Customer Database Dashboard (v2) -->
<!-- Customer Database Dashboard (v2) -->
<!-- DB Password Gate -->
<div class="modal-overlay" id="dbPwdOverlay" style="display:none; z-index:100005; align-items:center; justify-content:center;">
  <div class="modal-card" style="text-align:center; gap:16px; max-width:340px;">
    <input type="password" id="dbPwdInput" maxlength="6" autocomplete="off" style="width:100%; max-width:220px; height:42px; font-size:1.4rem; text-align:center; letter-spacing:8px; border:2px solid var(--card-border); border-radius:var(--radius-xs); background:var(--card-bg); color:var(--text-main); outline:none; font-family:monospace;">
    <span id="dbPwdError" style="font-size:0.62rem; color:#e74c3c; display:none; min-height:16px;"></span>
    <div style="display:flex; gap:8px; width:100%;">
      <button id="dbPwdCancelBtn" class="btn-modal btn-danger" style="flex:1;">取消</button>
      <button id="dbPwdConfirmBtn" class="btn-modal btn-success" style="flex:1;">确认</button>
    </div>
  </div>
</div>

<div class="db-overlay" id="dbOverlay">
  <div class="db-panel">
    <!-- CRM Top Tabs -->
    <div class="crm-tabs">
      <div class="crm-tab active" data-tab="all">首页</div>
      <div class="crm-tab" data-tab="意向客户">意向客户 <span class="crm-tab-close">关闭</span></div>
      <div class="crm-tab" data-tab="线索池">线索池 <span class="crm-tab-close">关闭</span></div>
      <div class="crm-tab" data-tab="公海客户">公海客户 <span class="crm-tab-close">关闭</span></div>
      <div class="crm-tabs-right">
        <button class="db-close" id="dbClose">关闭</button>
      </div>
    </div>

    <!-- Account Stats Bar (master only) -->
    <div id="dbAccountStats" style="display:none; padding:6px 16px; border-bottom:1px solid var(--card-border); background:var(--btn-bg); align-items:center; gap:10px; flex-wrap:wrap; font-size:0.7rem; font-weight:700; color:var(--text-soft);">
      <span style="color:var(--text-main);">各账户上传统计：</span>
      <span id="dbAccountStatsList"></span>
      <span style="margin-left:auto; display:flex; align-items:center; gap:6px;">
        <button id="dbMigrateBtn" style="display:none; height:26px; padding:0 10px; font-size:0.65rem; border:1px solid #e67e22; background:rgba(230,126,34,0.08); color:#e67e22; border-radius:3px; font-weight:700; cursor:pointer;">归属主账户</button>
        <span>查看：</span>
        <select id="dbViewAccountSel" style="height:26px; padding:0 6px; font-size:0.68rem; border:1px solid var(--card-border); border-radius:3px; font-weight:700; background:var(--card-bg); color:var(--text-main); cursor:pointer;">
          <option value="">我的数据</option>
        </select>
      </span>
    </div>

    <!-- CRM Shortcut Filters -->
    <div class="crm-shortcut-bar">
      <button class="crm-shortcut-btn active" data-shortcut="all">全部</button>
      <button class="crm-shortcut-btn" data-shortcut="today">今日新增</button>
      <button class="crm-shortcut-btn" data-shortcut="never">从未跟进</button>
      <button class="crm-shortcut-btn" data-shortcut="3days">3天以上未跟进</button>
      <span class="crm-shortcut-add" title="添加快捷过滤">(+)</span>
      <button class="crm-shortcut-toggle" id="crmToggleSearchBtn" title="展开/收起搜索区域">收起搜索</button>
    </div>

    <!-- CRM Search Area -->
    <div class="crm-search-card">
      <div class="crm-search-grid">
        <div class="crm-search-item crm-search-item-full">
          <span class="crm-search-label" style="width:72px;">🔍 模糊关联搜索</span>
          <input type="text" class="crm-input" id="dbFuzzySearch" placeholder="输入姓、电话号码或单位名称，模糊匹配相似结果...">
        </div>
        <div class="crm-search-item">
          <span class="crm-search-label">客户标签</span>
          <select class="crm-select" id="dbCatFilter"><option value="">请选择标签</option></select>
        </div>
        <div class="crm-search-item">
          <span class="crm-search-label">客户名称</span>
          <input type="text" class="crm-input" id="dbNameSearch" placeholder="请填写客户名称">
        </div>
        <div class="crm-search-item">
          <span class="crm-search-label">联系号码</span>
          <input type="text" class="crm-input" id="dbPhoneSearch" placeholder="请填写联系号码">
        </div>
        <div class="crm-search-item">
          <span class="crm-search-label">备注信息</span>
          <input type="text" class="crm-input" id="dbNoteSearch" placeholder="请填写备注">
        </div>
        <div class="crm-search-item">
          <span class="crm-search-label">导入批次</span>
          <select class="crm-select" id="dbBatchFilter"><option value="">全部批次</option></select>
        </div>
      </div>
      <div class="crm-search-actions">
        <button class="crm-btn-search" id="crmSearchBtn">搜索</button>
        <button class="crm-btn-reset" id="crmResetBtn">重置</button>
        <input type="text" id="dbSearch" style="display:none;" placeholder="隐式兼容搜索">
      </div>
    </div>

    <!-- Action Toolbar -->
    <div class="crm-toolbar">
      <button class="crm-tool-btn green" id="crmAddCustBtn">添加客户</button>
      <button class="crm-tool-btn orange" id="crmAddToDialBtn">添加到待拨打</button>
      <button class="crm-tool-btn orange" id="crmPullFilteredBtn" title="将当前分类和批次下的所有客户一键拉取到待拨打列表">按分类一键拉取</button>
      <button class="crm-tool-btn blue" id="crmMoveLeadsBtn" title="转入线索池">转入线索池</button>
      <button class="crm-tool-btn blue" id="crmMoveIntentBtn">转入意向客户</button>
      <button class="crm-tool-btn" id="crmMovePublicBtn">转入公海</button>
      <button class="crm-tool-btn red" id="crmBatchDeleteBtn" title="删除勾选的客户">批量删除</button>
      <button class="crm-tool-btn" id="crmAddHelperBtn">添加协助人</button>
      <button class="crm-tool-btn" id="crmRemoveHelperBtn">取消协助人</button>
      <button class="crm-tool-btn" id="dbBatchCatBtn" title="更多批量分类">批量分类</button>
      <button class="crm-tool-btn blue" id="dbAiCorrectFundBtn" title="AI 扫描公积金字段，自动识别并修正存错位置的数据">AI修正公积金</button>
      <button class="crm-tool-btn blue" id="crmManageColsBtn" title="管理自定义列">自定义列</button>
      <span id="crmReassignGroup" style="display:none; align-items:center; gap:4px;">
        <span style="font-size:0.7rem; font-weight:700; color:var(--text-soft);">分配给</span>
        <select id="crmReassignSel" style="height:28px; padding:0 6px; font-size:0.68rem; border:1px solid var(--card-border); border-radius:3px; font-weight:700; background:var(--card-bg); color:var(--text-main); cursor:pointer;"></select>
        <button class="crm-tool-btn" id="crmReassignBtn" style="background:#e67e22; color:#fff; border-color:#e67e22;">分配</button>
      </span>
    </div>

    <!-- Batch category mini-panel -->
    <div id="dbBatchCatPanel" style="display:none;padding:6px 16px;border-bottom:1px solid #cbd5e1;background:#f8fafc;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:12px;font-weight:700;color:#555;">批量设置分类：</span>
      <select id="dbBatchCatSel" style="height:28px;border:1px solid #ccc;border-radius:3px;font-size:12px;padding:0 6px;">
        <option value="">选择批次</option>
      </select>
      <span style="font-size:12px;color:#888;">→</span>
      <select id="dbCatTargetSel" style="height:28px;border:1px solid #ccc;border-radius:3px;font-size:12px;padding:0 6px;"></select>
      <button id="dbBatchCatApply" style="height:28px;padding:0 14px;background:#ff5722;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer;">应用</button>
      <button id="dbBatchCatCancel" style="height:28px;padding:0 10px;background:#eee;color:#666;border:none;border-radius:4px;font-size:12px;cursor:pointer;">取消</button>
      <span id="dbBatchCatStatus" style="font-size:11px;color:#07c160;display:none;"></span>
    </div>

    <!-- CRM Status Badges Bar -->
    <div class="crm-badge-bar">
      <div class="crm-badge-item"><span class="crm-dot red"></span> 广告新客户待跟进：<span id="crmRedCount">0</span></div>
      <div class="crm-badge-item"><span class="crm-dot yellow"></span> 广告再分配待跟进：<span id="crmYellowCount">0</span></div>
      <div class="crm-badge-item"><span class="crm-dot blue"></span> 导入新客户待跟进：<span id="crmBlueCount">0</span></div>
      <div class="crm-badge-item"><span class="crm-dot cyan"></span> 导入再分配待跟进：<span id="crmCyanCount">0</span></div>
    </div>

    <!-- CRM Data Table -->
    <div class="db-table-wrap">
      <table class="crm-table">
        <thead>
          <tr id="dbHeaderRow">
            <th style="width: 40px; text-align: center; cursor: default;"><input type="checkbox" id="crmSelectAll"></th>
            <th data-sort="name" style="width: 140px;">客户名称 <span class="sort-arrow"></span></th>
            <th data-sort="mobile" style="width: 160px;">联系号码 <span class="sort-arrow"></span></th>
            <th data-sort="note" style="min-width: 120px;">备注 <span class="sort-arrow"></span></th>
            <th data-sort="company_name" style="min-width: 200px;">单位 <span class="sort-arrow"></span></th>
            <th data-sort="category" style="width: 100px;">分类 <span class="sort-arrow"></span></th>
            <th style="width: 100px; cursor: default;">操作</th>
          </tr>
        </thead>
        <tbody id="dbTbody">
          <tr><td colspan="20" class="db-loading">加载中...</td></tr>
        </tbody>
      </table>
      <div class="db-empty" id="dbEmpty" style="display:none;">
        <div style="font-size:2.5rem;margin-bottom:12px;"></div>
        <div>暂无客户数据</div>
        <div style="font-size:0.72rem;color:#aaa;margin-top:4px;">导入客户或检查 Supabase 连接</div>
      </div>
    </div>

    <!-- CRM Footer Pager -->
    <div class="crm-pager">
      <div class="crm-pager-left" id="dbTotal">共 0 条</div>
      <div class="crm-pager-center">
        <button class="crm-pager-btn" id="dbPrev">‹ 上一页</button>
        <span id="dbPageInfo" style="font-size: 0.78rem; font-weight: 700; color: #475569; display: inline-flex; align-items: center; gap: 4px;">
          第 <input type="number" id="dbPageInput" min="1" style="width: 48px; text-align: center; height: 24px; border: 1px solid var(--card-border); border-radius: 4px; font-weight: bold; background: var(--card-bg); color: var(--text-main); outline: none; margin: 0 2px;" value="1"> / <span id="dbPageTotal">1</span> 页
        </span>
        <button class="crm-pager-btn" id="dbNext">下一页 ›</button>
      </div>
      <div class="crm-pager-right">
        <select class="crm-select-page" id="dbPageSize">
          <option value="30">30条/页</option>
          <option value="50" selected>50条/页</option>
          <option value="100">100条/页</option>
          <option value="300">300条/页</option>
        </select>
      </div>
    </div>
  </div>
</div>

  <script>
  (function(){
    // Android WebView detection for full-screen spacing
    if(/Android/.test(navigator.userAgent)&&!/iPhone|iPad|iPod/.test(navigator.userAgent)){
      document.body.classList.add('android');
    }

    var isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    // LocalStorage Keys
    var CLIENTS_K = 'standalone_dialer_clients';
    var DARK_K = 'standalone_dialer_dark';
    var ACCOUNT_ID_K = 'standalone_dialer_account_id';
    var ACCOUNT_LABEL_K = 'standalone_dialer_account_label';

    // Session keys (localStorage — persists across browser restarts)
    var SESS_TOKEN_K = 'dialer_sess_token';
    var SESS_AID_K = 'dialer_sess_aid';
    var SESS_MASTER_K = 'dialer_sess_master';
    var SESS_LABEL_K = 'dialer_sess_label';

    function getSessionToken() { return localStorage.getItem(SESS_TOKEN_K) || ''; }
    function getSessionAccountId() { return localStorage.getItem(SESS_AID_K) || ''; }
    function isSessionMaster() { return localStorage.getItem(SESS_MASTER_K) === '1'; }
    function getSessionLabel() { return localStorage.getItem(SESS_LABEL_K) || ''; }

    function saveSession(acct) {
      localStorage.setItem(SESS_TOKEN_K, acct.session_token || '');
      localStorage.setItem(SESS_AID_K, acct.account_id || '');
      localStorage.setItem(SESS_MASTER_K, acct.is_master ? '1' : '0');
      localStorage.setItem(SESS_LABEL_K, acct.label || '');
    }

    function clearSession() {
      localStorage.removeItem(SESS_TOKEN_K);
      localStorage.removeItem(SESS_AID_K);
      localStorage.removeItem(SESS_MASTER_K);
      localStorage.removeItem(SESS_LABEL_K);
    }

    // getOrCreateAccountId: priority: localStorage > localStorage > new
    function getOrCreateAccountId() {
      var sid = getSessionAccountId();
      if (sid) return sid;
      var id = localStorage.getItem(ACCOUNT_ID_K);
      if (!id) {
        id = 'acct_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        localStorage.setItem(ACCOUNT_ID_K, id);
      }
      return id;
    }
    function getAccountLabel() {
      var sl = getSessionLabel();
      if (sl) return sl;
      return localStorage.getItem(ACCOUNT_LABEL_K) || '';
    }
    function setAccountLabel(l) { localStorage.setItem(ACCOUNT_LABEL_K, l); }

    function updateAccountDisplay() {
      var d = document.getElementById('accountDisplay');
      if (!d) return;
      var id = getOrCreateAccountId();
      var label = getAccountLabel();
      d.textContent = label ? '[' + label + ']' : '[' + id.slice(0, 10) + ']';
      var typeTag = isSessionMaster() ? ' [主账户]' : (getSessionAccountId() ? ' [子账户]' : '');
      d.title = '账户: ' + id + (label ? ' (' + label + ')' : '') + typeTag;
    }

    // Monkey-patch fetch to inject Authorization header
    (function() {
      var _origFetch = window.fetch;
      window.fetch = function(url, opts) {
        var token = getSessionToken();
        if (token && typeof url === 'string' && url.indexOf('/api/dialer/') !== -1) {
          opts = opts || {};
          opts.headers = opts.headers || {};
          opts.headers['Authorization'] = 'Bearer ' + token;
          if (_viewAccountId && url.indexOf('/api/dialer/auth/') === -1) {
            opts.headers['X-View-Account-Id'] = _viewAccountId;
          }
        }
        return _origFetch.call(window, url, opts);
      };
    })();

    // State Variables
    var importedClients = [];
    var currentCallIdx = -1;
    var callInterval = null;
    var callSeconds = 0;
    var currentFilter = 'all';
    var currentPage = 1;
    var whitelistCompanies = [];
    var whitelistCheckResults = null;
    var whitelistLoaded = false;
    var pageSize = 100;
    var currentSort = 'default';

    // Copy Rate Limiting - configurable
    var COPY_LIMIT_K = 'standalone_dialer_copy_limit';
    var copyLimitEnabled = localStorage.getItem('dialer_copy_limit_enabled') !== '0'; // default on
    var copyLimitThresholds = {}; // { '20': true, '30': true }
    try {
      var savedThresholds = JSON.parse(localStorage.getItem('dialer_copy_limit_thresholds') || '{}');
      copyLimitThresholds['20'] = savedThresholds['20'] !== false;
      copyLimitThresholds['30'] = savedThresholds['30'] !== false;
    } catch(e) {
      copyLimitThresholds = { '20': true, '30': true };
    }
    var copyLimitState = null;

    // 待拨打添加历史记录 - 防止10天内重复添加到待拨打
    var ADD_HISTORY_K = 'standalone_dialer_add_history';
    var ADD_COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; // 10天冷却期（与服务端一致）

    function getAddHistory() {
      try {
        var raw = localStorage.getItem(ADD_HISTORY_K);
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    }

    function saveAddHistory(history) {
      // 清理超过10天的旧记录，避免存储膨胀
      var now = Date.now();
      var cleaned = {};
      var keys = Object.keys(history);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (now - new Date(history[k]).getTime() < ADD_COOLDOWN_MS) {
          cleaned[k] = history[k];
        }
      }
      localStorage.setItem(ADD_HISTORY_K, JSON.stringify(cleaned));
      return cleaned;
    }

    function canAddToDialList(mobile) {
      if (!mobile) return false;
      var history = getAddHistory();
      var ts = history[mobile];
      if (!ts) return true;
      var elapsed = Date.now() - new Date(ts).getTime();
      return elapsed >= ADD_COOLDOWN_MS;
    }

    function recordAddToDialList(mobile) {
      if (!mobile) return;
      var history = getAddHistory();
      history[mobile] = new Date().toISOString();
      saveAddHistory(history);
    }

    function getCooldownRemaining(mobile) {
      if (!mobile) return null;
      var history = getAddHistory();
      var ts = history[mobile];
      if (!ts) return null;
      var elapsed = Date.now() - new Date(ts).getTime();
      var remaining = ADD_COOLDOWN_MS - elapsed;
      if (remaining <= 0) return null;
      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor((remaining % 86400000) / 3600000);
      if (days > 0) return days + '天' + hours + '小时';
      return hours + '小时' + Math.floor((remaining % 3600000) / 60000) + '分钟';
    }
    function loadCopyLimitState() {
      if (copyLimitState) return;
      try {
        var saved = localStorage.getItem(COPY_LIMIT_K);
        if (saved) {
          copyLimitState = JSON.parse(saved);
        } else {
          copyLimitState = { count: 0, restrictedUntil: null, triggeredThresholds: [] };
        }
        // Clear expired restriction but keep count for cumulative tracking
        if (copyLimitState.restrictedUntil && Date.now() > copyLimitState.restrictedUntil) {
          copyLimitState.restrictedUntil = null;
        }
        // Initialize triggeredThresholds if missing from older state
        if (!copyLimitState.triggeredThresholds) {
          copyLimitState.triggeredThresholds = [];
        }
      } catch (e) {
        copyLimitState = { count: 0, restrictedUntil: null, triggeredThresholds: [] };
      }
    }

    function saveCopyLimitState() {
      try {
        localStorage.setItem(COPY_LIMIT_K, JSON.stringify(copyLimitState));
      } catch(e) {}
    }

    var copyLimitToastTimer = null;
    function showCopyLimitToast(msg, isWarn) {
      var toast = document.getElementById('copyLimitToast');
      if (!toast) return;
      toast.textContent = msg;
      toast.className = 'copy-limit-toast';
      if (isWarn) toast.classList.add('warn');
      // Force reflow
      void toast.offsetWidth;
      toast.classList.add('show');
      if (copyLimitToastTimer) clearTimeout(copyLimitToastTimer);
      copyLimitToastTimer = setTimeout(function() {
        toast.classList.remove('show');
      }, 4000);
    }

    // Returns {allowed: bool, message: string}
    function checkCopyLimit() {
      // If copy limit feature is disabled, always allow
      if (copyLimitEnabled === false) return { allowed: true, message: '' };

      loadCopyLimitState();
      var now = Date.now();

      // Check if currently restricted
      if (copyLimitState.restrictedUntil && now < copyLimitState.restrictedUntil) {
        var remainingMin = Math.ceil((copyLimitState.restrictedUntil - now) / 60000);
        return { allowed: false, message: '已达到复制上限，请等待 ' + remainingMin + ' 分钟后再试' };
      }

      // Clear expired restriction but keep count for cumulative tracking
      if (copyLimitState.restrictedUntil && now >= copyLimitState.restrictedUntil) {
        copyLimitState.restrictedUntil = null;
      }

      // Increment cumulative count
      copyLimitState.count++;

      // Check enabled thresholds in ascending order — each triggers only once
      var thresholdKeys = ['20', '30'];
      var hitThreshold = null;
      for (var i = 0; i < thresholdKeys.length; i++) {
        var t = parseInt(thresholdKeys[i], 10);
        if (copyLimitThresholds[thresholdKeys[i]] && copyLimitState.count >= t && copyLimitState.triggeredThresholds.indexOf(t) === -1) {
          hitThreshold = t;
          copyLimitState.triggeredThresholds.push(t);
          break;
        }
      }

      if (hitThreshold) {
        var restrictionMinutes = 20 + Math.floor(Math.random() * 11); // 20-30 min
        copyLimitState.restrictedUntil = now + restrictionMinutes * 60 * 1000;
        saveCopyLimitState();
        return { allowed: false, message: '已复制 ' + copyLimitState.count + ' 个号码（第' + hitThreshold + '个触发），限制 ' + restrictionMinutes + ' 分钟' };
      }

      saveCopyLimitState();
      return { allowed: true, message: '' };
    }

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

    // 判断是否为自动生成的时间戳批次名（如 "导入-2026-06-22 04:40:56"）
    function isAutoBatchLabel(label) {
      if (!label) return true;
      return label.indexOf('导入-') === 0;
    }

    // 返回可显示的批次名，自动生成的时间戳返回空
    function displayBatchLabel(label) {
      return isAutoBatchLabel(label) ? '' : label;
    }

    // Cross-platform WeChat jump
    var isAndroid = /Android/.test(navigator.userAgent) && !/iPhone|iPad|iPod/.test(navigator.userAgent);
    function jumpToWechat() {
      if (isAndroid) {
        // Android: use intent:// scheme for WebView/Chrome
        window.location.href = 'intent://#Intent;scheme=weixin;package=com.tencent.mm;end';
      } else {
        // iOS: use weixin:// scheme
        window.location.href = 'weixin://';
      }
    }

    function copyTextToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function() {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Copy failed:', err);
      }
      document.body.removeChild(textarea);
    }

    // 记录客户操作时间线（最新覆盖）
    function recordTimeline(mobile, type, detail) {
      if (!mobile) return;
      var payload = {
        mobile: mobile,
        entry: {
          type: type,
          ts: new Date().toISOString(),
          detail: (detail || '').slice(0, 200)
        }
      };
      // 同步更新内存中的 importedClients
      for (var i = 0; i < importedClients.length; i++) {
        var c = importedClients[i];
        if ((c.phone || c.mobile) === mobile) {
          c.last_operation = payload.entry;
          break;
        }
      }
      // 异步写入 Supabase（fire-and-forget）
      fetch('/api/dialer/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function(err) {
        console.warn('[timeline] record failed:', err);
      });
    }

    // 操作记录格式化显示
    var TimelineDisplay = {
      typeLabels: {
        'copy_phone': '已复制号码',
        'copy_name': '已复制姓名',
        'copy_company': '已复制公司',
        'dial': '已拨打电话',
        'call_success': '通话成功',
        'call_failed': '未接通'
      },
      typeIcons: {
        'copy_phone': '',
        'copy_name': '',
        'copy_company': '',
        'dial': '',
        'call_success': '',
        'call_failed': ''
      },
      formatTime: function(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        if (isNaN(d.getTime())) return ts;
        var now = new Date();
        var diffMs = now - d;
        var diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return '刚刚';
        if (diffMin < 60) return diffMin + '分钟前';
        var diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return diffHour + '小时前';
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hour = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        return month + '-' + day + ' ' + hour + ':' + min;
      },
      render: function(op) {
        if (!op || !op.type) return '';
        var icon = this.typeIcons[op.type] || '';
        var label = this.typeLabels[op.type] || op.type;
        var timeStr = this.formatTime(op.ts);
        return icon + ' ' + label + ' <span style="font-size:0.5rem;color:var(--text-light);">' + timeStr + '</span>';
      }
    };

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
      
      // Common Chinese Surnames Regex
      var surnameRegex = /^[王李张刘陈杨黄赵吴周徐孙马朱胡郭何林罗高郑梁谢宋唐董许韩邓冯曹彭曾萧田庄潘袁于叶余魏蒋田杜丁沈姜范江傅钟卢汪戴崔]/;
      
      if (/^[\\u4e00-\\u9fa5]{2,4}$/.test(s)) {
        if (surnameRegex.test(s)) {
          return 25; // Highly weigh standard Chinese names with common surnames
        }
        return 10;
      }
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

    function uploadCustomersToSupabase(customers, batchLabel) {
      if (!customers || customers.length === 0) return;
      var label = batchLabel || ("导入-" + new Date().toISOString().slice(0, 19).replace("T", " "));
      var payload = serializeCustomersForSupabase(customers);
      var accountId = getOrCreateAccountId();
      fetch("/api/dialer/upload-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: payload, batch_label: label, account_id: accountId })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.success) {
          console.error("Supabase upload failed:", data.error || "未知错误");
        } else if (data.skipped > 0) {
          console.warn("Supabase upload: " + data.count + " 条成功，" + data.skipped + " 条因归属其他账户而跳过");
        }
      })
      .catch(function(err) {
        console.error("Supabase upload error:", err);
      });
    }

        function updateDashboardVisibility(hasData) {
      var flexStyle = hasData ? 'flex' : 'none';
      var minimalStats = document.getElementById('headerStatsMinimal');
      if (minimalStats) {
        minimalStats.style.display = hasData ? 'flex' : 'none';
      }
      document.getElementById('controlBar').style.display = flexStyle;

      var expBtn = document.getElementById('exportBtn');
      var clrBtn = document.getElementById('clearBtn');
      if (expBtn) expBtn.style.display = hasData ? 'flex' : 'none';
      if (clrBtn) clrBtn.style.display = hasData ? 'flex' : 'none';

      // Import panel is now a modal overlay — always hidden from flow by CSS
      // Just ensure it's closed when data state changes
      var panel = document.getElementById('dashboardPanel');
      if (panel) {
        panel.classList.remove('active');
        document.body.style.overflow = '';
      }
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
      
      var pctText = document.getElementById('percentText');
      if (pctText) {
        pctText.textContent = '(' + Math.round(percent) + '%)';
      }
    }

    // Global State for BH-AI Importer
    var tempImportData = null;
    var tempImportHeaders = [];
    var tempImportDetected = null;
    var tempImportType = 'xlsx'; // 'xlsx', 'vcf', 'unstructured'
    var tempUnstructuredContacts = [];

    // OCR Training: save original results before user edits
    var tempOcrFileName = '';
    var tempOcrRawText = '';
    var tempOcrOriginalContacts = [];
    var tempOcrEngine = 'ai_vision'; // 'ai_vision', 'local_tesseract', 'paddleocr', 'text_fallback'

    function resetAIImporterUI() {
      multiImageAborted = true;
      var el;
      el = document.getElementById('aiImportInit'); if (el) el.style.display = 'flex';
      el = document.getElementById('aiImportScanning'); if (el) el.style.display = 'none';
      el = document.getElementById('aiImportReport'); if (el) el.style.display = 'none';
      el = document.getElementById('aiLaserLine'); if (el) el.style.display = 'none';
      el = document.getElementById('aiAdjustControls'); if (el) el.style.display = 'none';
      el = document.getElementById('localOcrConfigPanel'); if (el) el.style.display = 'none';
      el = document.getElementById('textImportPanel'); if (el) el.style.display = 'none';

      var dz = document.getElementById('dropZone');
      if (dz) {
        dz.style.minHeight = '200px';
        dz.style.padding = ''; // Reset to CSS default
      }

      el = document.getElementById('aiExcelMappingPills'); if (el) el.style.display = 'flex';
      el = document.getElementById('aiExcelMappingControls'); if (el) el.style.display = 'block';
      el = document.getElementById('aiExcelPreviewContainer'); if (el) el.style.display = 'block';
      el = document.getElementById('aiUnstructuredContainer'); if (el) el.style.display = 'none';

      el = document.getElementById('xlsFileInput'); if (el) el.value = '';
      el = document.getElementById('vcfFileInput'); if (el) el.value = '';
      el = document.getElementById('imgFileInput'); if (el) el.value = '';

      tempUnstructuredContacts = [];
      tempImportData = null;
      tempImportHeaders = [];
      tempImportDetected = null;
      // Reset batch label with fresh default
      var blInput = document.getElementById('batchLabelInput');
      if (blInput) {
        blInput.value = '导入-' + new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    function showAIScanningUI(fileName) {
      var el;
      el = document.getElementById('aiImportInit'); if (el) el.style.display = 'none';
      el = document.getElementById('aiImportReport'); if (el) el.style.display = 'none';
      el = document.getElementById('localOcrConfigPanel'); if (el) el.style.display = 'none';

      var scanning = document.getElementById('aiImportScanning');
      if (scanning) scanning.style.display = 'flex';

      var laser = document.getElementById('aiLaserLine');
      if (laser) laser.style.display = 'block';

      // Reset logs safely
      var log1 = document.getElementById('aiLog1');
      var log2 = document.getElementById('aiLog2');
      var log3 = document.getElementById('aiLog3');
      var log4 = document.getElementById('aiLog4');
      if (log1) { log1.innerHTML = '[ ] 正在读取数据流...'; log1.style.opacity = '0.5'; }
      if (log2) { log2.innerHTML = '[ ] 正在评估特征维度...'; log2.style.opacity = '0.3'; }
      if (log3) { log3.innerHTML = '[ ] 正在过滤杂质与噪音...'; log3.style.opacity = '0.3'; }
      if (log4) { log4.innerHTML = '[ ] 正在匹配智能映射...'; log4.style.opacity = '0.3'; }

      setTimeout(function() {
        if (log1) { log1.innerHTML = '数据流加载完成 (' + fileName + ')'; log1.style.opacity = '1'; }
        if (log2) log2.style.opacity = '0.5';
      }, 300);

      setTimeout(function() {
        if (log2) { log2.innerHTML = '评估行列特征成功'; log2.style.opacity = '1'; }
        if (log3) log3.style.opacity = '0.5';
      }, 600);

      setTimeout(function() {
        if (log3) { log3.innerHTML = '空列与噪音清洗完成'; log3.style.opacity = '1'; }
        if (log4) log4.style.opacity = '0.5';
      }, 900);

      setTimeout(function() {
        if (log4) { log4.innerHTML = 'AI 智能映射匹配成功'; log4.style.opacity = '1'; }
      }, 1100);
    }

    function runAIColumnMapping(json) {
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
          if (/备注|沟通|记录|跟进|说明|介绍|详情|note|remark/i.test(cellVal)) matches++;
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

      var nameIdx = -1, phoneIdx = -1, companyIdx = -1, noteIdx = -1;
      var hasHeaders = (headerRowIdx !== -1);

      if (hasHeaders) {
        var headers = json[headerRowIdx];
        for (var i = 0; i < headers.length; i++) {
          var h = String(headers[i] || '').trim();
          if (/姓名|客户|name/i.test(h)) nameIdx = i;
          else if (/电话|手机|号码|phone|tel|mobile/i.test(h)) phoneIdx = i;
          else if (/单位|公司|企业|company|firm|work/i.test(h)) companyIdx = i;
          else if (/备注|沟通|记录|跟进|说明|介绍|详情|note|remark/i.test(h)) noteIdx = i;
        }
        
        if (phoneIdx === -1) {
          for (var i = 0; i < headers.length; i++) {
            var nextRowVal = json[headerRowIdx + 1] ? json[headerRowIdx + 1][i] : undefined;
            if (isPhone(nextRowVal)) {
              phoneIdx = i;
              break;
            }
          }
        }
        if (nameIdx === -1) nameIdx = 0;
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
            var val = json[r] ? json[r][c] : undefined;
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

        if (phoneCols.length > 0) {
          phoneIdx = phoneCols[0];
          
          var assignedNameCols = new Set();
          
          var leftScore = 0;
          var rightScore = 0;
          var scanRows = Math.min(json.length, 50);

          var canUseLeft = (phoneIdx > 0 && !assignedNameCols.has(phoneIdx - 1));
          var canUseRight = (phoneIdx + 1 < maxCols && !assignedNameCols.has(phoneIdx + 1));

          for (var r = 0; r < scanRows; r++) {
            if (canUseLeft) {
              var leftVal = json[r] ? json[r][phoneIdx - 1] : undefined;
              leftScore += nameScore(leftVal);
            }
            if (canUseRight) {
              var rightVal = json[r] ? json[r][phoneIdx + 1] : undefined;
              rightScore += nameScore(rightVal);
            }
          }

          if (canUseRight && rightScore >= leftScore && rightScore > 0) {
            nameIdx = phoneIdx + 1;
          } else if (canUseLeft && leftScore > 0) {
            nameIdx = phoneIdx - 1;
          } else {
            nameIdx = 0;
          }

          // Heuristic Company & Note Extraction for Non-Header Sheets
          var assignedCols = new Set();
          assignedCols.add(phoneIdx);
          if (nameIdx !== -1) assignedCols.add(nameIdx);

          var bestCompanyCol = -1;
          var maxCompanyScore = 0;
          var bestNoteCol = -1;
          var maxNoteScore = 0;

          for (var c = 0; c < maxCols; c++) {
            if (assignedCols.has(c)) continue;

            var companyScore = 0;
            var noteScoreCount = 0;
            var totalLength = 0;
            var nonValCount = 0;

            for (var r = 0; r < scanRows; r++) {
              var val = json[r] ? json[r][c] : undefined;
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                var s = String(val).trim();
                nonValCount++;
                totalLength += s.length;

                // Priority matching for '有限公司' or corporate suffixes
                if (/有限公司|有限责任|集团|公司|企业|厂|店|中心|商行|工作室/i.test(s)) {
                  companyScore += 15;
                }
                if (/意向|跟进|记录|备注|挂断|接通|无效|微信|电话|加微信|想买|说明|介绍|详情/i.test(s)) {
                  noteScoreCount += 10;
                }
                if (s.length > 8) {
                  noteScoreCount += 2;
                }
              }
            }

            var avgLength = nonValCount > 0 ? (totalLength / nonValCount) : 0;
            noteScoreCount += avgLength;

            if (companyScore > maxCompanyScore && companyScore > 0) {
              maxCompanyScore = companyScore;
              bestCompanyCol = c;
            }
            if (noteScoreCount > maxNoteScore) {
              maxNoteScore = noteScoreCount;
              bestNoteCol = c;
            }
          }

          if (bestCompanyCol !== -1) {
            companyIdx = bestCompanyCol;
            assignedCols.add(bestCompanyCol);
          }
          if (bestNoteCol !== -1 && bestNoteCol !== bestCompanyCol) {
            noteIdx = bestNoteCol;
          }
        }
      }


      return {
        headerRowIdx: headerRowIdx,
        nameIdx: nameIdx,
        phoneIdx: phoneIdx,
        companyIdx: companyIdx,
        noteIdx: noteIdx
      };
    }

    function renderAIReportForExcel(json, detected) {
      tempImportData = json;
      tempImportType = 'xlsx';
      tempImportDetected = detected;

      var headerRowIdx = detected.headerRowIdx;
      var maxCols = 0;
      for (var i = 0; i < json.length; i++) {
        if (json[i] && json[i].length > maxCols) maxCols = json[i].length;
      }

      var headersList = [];
      for (var c = 0; c < maxCols; c++) {
        var hName = '列 ' + String.fromCharCode(65 + c);
        var headerVal = headerRowIdx !== -1 && json[headerRowIdx] ? json[headerRowIdx][c] : undefined;
        if (headerVal) {
          hName = esc(String(headerVal).trim());
        }
        headersList.push({ idx: c, label: hName });
      }
      tempImportHeaders = headersList;

      document.getElementById('pillName').className = 'client-card-tag';
      document.getElementById('pillName').style.background = detected.nameIdx !== -1 ? 'rgba(7,193,96,0.08)' : 'rgba(231,76,60,0.08)';
      document.getElementById('pillName').style.color = detected.nameIdx !== -1 ? 'var(--accent-wechat)' : '#e74c3c';
      document.getElementById('pillName').innerHTML = '姓名' + (detected.nameIdx !== -1 ? headersList[detected.nameIdx].label : '未识别');

      document.getElementById('pillPhone').className = 'client-card-tag';
      document.getElementById('pillPhone').style.background = detected.phoneIdx !== -1 ? 'rgba(7,193,96,0.08)' : 'rgba(231,76,60,0.08)';
      document.getElementById('pillPhone').style.color = detected.phoneIdx !== -1 ? 'var(--accent-wechat)' : '#e74c3c';
      document.getElementById('pillPhone').innerHTML = '电话' + (detected.phoneIdx !== -1 ? headersList[detected.phoneIdx].label : '未识别');

      document.getElementById('pillCompany').className = 'client-card-tag';
      document.getElementById('pillCompany').style.background = detected.companyIdx !== -1 ? 'rgba(74,108,247,0.08)' : 'rgba(0,0,0,0.04)';
      document.getElementById('pillCompany').style.color = detected.companyIdx !== -1 ? '#4a6cf7' : 'var(--text-light)';
      document.getElementById('pillCompany').innerHTML = '公司' + (detected.companyIdx !== -1 ? headersList[detected.companyIdx].label : '无');

      document.getElementById('pillNote').className = 'client-card-tag';
      document.getElementById('pillNote').style.background = detected.noteIdx !== -1 ? 'rgba(245,124,0,0.08)' : 'rgba(0,0,0,0.04)';
      document.getElementById('pillNote').style.color = detected.noteIdx !== -1 ? '#f57c00' : 'var(--text-light)';
      document.getElementById('pillNote').innerHTML = '备注' + (detected.noteIdx !== -1 ? headersList[detected.noteIdx].label : '无');

      renderImportMappingControls(headersList, detected);

      if (detected.nameIdx !== -1 && detected.phoneIdx !== -1) {
        executeAIImportExcel();
        alert('Excel 识别：自动对应姓名列「' + headersList[detected.nameIdx].label + '」与电话列「' + headersList[detected.phoneIdx].label + '」成功，已自动入库并同步至 Supabase！');
        return;
      }

      var conf = 90;
      if (detected.nameIdx !== -1 && detected.phoneIdx !== -1) conf = detected.headerRowIdx !== -1 ? 98.5 : 92.0;
      if (detected.companyIdx !== -1) conf += 1.0;
      if (detected.noteIdx !== -1) conf += 0.5;
      document.getElementById('aiConfidenceBadge').innerHTML = '● AI 置信度: ' + conf.toFixed(1) + '%';
      
      document.getElementById('aiReportTitle').innerHTML = 'AI 识别报告: Excel 表格数据';

      updateAIPreviewTable();

      document.getElementById('aiImportScanning').style.display = 'none';
      document.getElementById('aiLaserLine').style.display = 'none';
      document.getElementById('aiImportReport').style.display = 'flex';
      
      document.getElementById('aiToggleAdjustBtn').style.display = 'inline-flex';
    }

    function populateMappingSelect(selId, headers, selectedIdx, hasNone) {
      var select = typeof selId === 'string' ? document.getElementById(selId) : selId;
      if (!select) return;
      select.innerHTML = '';
      if (hasNone) {
        var optNone = document.createElement('option');
        optNone.value = '-1';
        optNone.textContent = '(无映射/不导入)';
        if (selectedIdx === -1) optNone.selected = true;
        select.appendChild(optNone);
      }
      headers.forEach(function(h) {
        var opt = document.createElement('option');
        opt.value = h.idx;
        opt.textContent = String(h.idx + 1) + '列 - ' + h.label;
        if (h.idx === selectedIdx) opt.selected = true;
        select.appendChild(opt);
      });
    }

    function updateAIPreviewTable() {
      var nameCol = parseInt(document.getElementById('aiSelName').value);
      var phoneCol = parseInt(document.getElementById('aiSelPhone').value);
      var compCol = parseInt(document.getElementById('aiSelCompany').value);
      var noteCol = parseInt(document.getElementById('aiSelNote').value);
      
      var customMappings = [];
      var customSelects = document.querySelectorAll('#aiAdjustControls .aiSelCustom');
      customSelects.forEach(function(sel) {
        var colName = sel.getAttribute('data-col');
        var colIdx = parseInt(sel.value);
        if (colIdx !== -1) {
          customMappings.push({ name: colName, idx: colIdx });
        }
      });

      var tableHead = document.querySelector('#aiPreviewTable thead');
      if (tableHead) {
        var headHtml = '<tr style="border-bottom: 1px solid var(--card-border); font-weight: 800; color: var(--text-soft); background: rgba(0,0,0,0.01);">' +
          '<th style="padding: 4px 8px;">姓名</th>' +
          '<th style="padding: 4px 8px;">电话</th>' +
          '<th style="padding: 4px 8px;">公司</th>';
        customMappings.forEach(function(m) {
          headHtml += '<th style="padding: 4px 8px;">' + esc(m.name) + '</th>';
        });
        headHtml += '</tr>';
        tableHead.innerHTML = headHtml;
      }

      var tableBody = document.querySelector('#aiPreviewTable tbody');
      if (!tableBody) return;
      tableBody.innerHTML = '';

      if (!tempImportData || tempImportData.length === 0) return;

      var startRow = 0;
      if (tempImportDetected && tempImportDetected.headerRowIdx !== -1) {
        startRow = tempImportDetected.headerRowIdx + 1;
      }

      var previewCount = 0;
      for (var r = startRow; r < tempImportData.length && previewCount < 3; r++) {
        var row = tempImportData[r];
        if (!row || row.length === 0) continue;
        
        var rawPhone = phoneCol !== -1 ? row[phoneCol] : '';
        var phoneVal = cleanPhone(rawPhone);
        if (!phoneVal) continue;

        var nameVal = nameCol !== -1 ? String(row[nameCol] || '').trim() : '客户';
        var compVal = compCol !== -1 ? String(row[compCol] || '').trim() : '';

        var customTds = '';
        customMappings.forEach(function(m) {
          var val = String(row[m.idx] || '').trim();
          customTds += '<td style="padding: 6px 8px; color: var(--text-soft);">' + esc(val || '(空)') + '</td>';
        });

        var tr = document.createElement('tr');
        tr.style.borderBottom = '0.5px solid var(--card-border)';
        tr.innerHTML = '<td style="padding: 6px 8px; font-weight: 800; color: var(--text-main);">' + esc(nameVal || '未知姓名') + '</td>' +
                       '<td style="padding: 6px 8px; font-family: monospace; color: var(--accent-wechat); font-weight: 800;">' + esc(phoneVal) + '</td>' +
                       '<td style="padding: 6px 8px; color: var(--text-soft);">' + esc(compVal || '(空)') + '</td>' +
                       customTds;
        tableBody.appendChild(tr);
        previewCount++;
      }

      var colspanVal = 3 + customMappings.length;
      if (previewCount === 0) {
        tableBody.innerHTML = '<tr><td colspan="' + colspanVal + '" style="padding: 12px; text-align: center; color: var(--text-light);">当前列映射无法提取有效客户电话号码，请手动调整电话数据列。</td></tr>';
      }

      var totalImportCount = calculateParsedCount(nameCol, phoneCol, compCol, noteCol);
      document.getElementById('aiConfirmImportBtn').innerHTML = 'AI 确认导入 (' + totalImportCount + ' 位联系人)';
    }

    function calculateParsedCount(nameCol, phoneCol, compCol, noteCol) {
      if (!tempImportData || phoneCol === -1) return 0;
      var count = 0;
      var phoneSet = new Set();
      var startRow = 0;
      if (tempImportDetected && tempImportDetected.headerRowIdx !== -1) {
        startRow = tempImportDetected.headerRowIdx + 1;
      }
      for (var r = startRow; r < tempImportData.length; r++) {
        var row = tempImportData[r];
        if (!row || row.length === 0) continue;
        var phoneVal = cleanPhone(row[phoneCol]);
        if (!phoneVal) continue;
        if (phoneSet.has(phoneVal)) continue;
        phoneSet.add(phoneVal);
        count++;
      }
      return count;
    }

    function executeAIImportExcel() {
      var nameCol = parseInt(document.getElementById('aiSelName').value);
      var phoneCol = parseInt(document.getElementById('aiSelPhone').value);
      var compCol = parseInt(document.getElementById('aiSelCompany').value);
      var noteCol = parseInt(document.getElementById('aiSelNote').value);
      var batchLabel = (document.getElementById('batchLabelInput').value || '').trim();
      var defaultCat = document.getElementById('importCategorySelect') ? document.getElementById('importCategorySelect').value : '公海客户';

      if (phoneCol === -1) {
        alert('请至少为电话选择一列进行导入！');
        return;
      }

      var startRow = 0;
      if (tempImportDetected && tempImportDetected.headerRowIdx !== -1) {
        startRow = tempImportDetected.headerRowIdx + 1;
      }

      var customMappings = [];
      var customSelects = document.querySelectorAll('#aiAdjustControls .aiSelCustom');
      customSelects.forEach(function(sel) {
        var colName = sel.getAttribute('data-col');
        var colIdx = parseInt(sel.value);
        if (colIdx !== -1) {
          customMappings.push({ name: colName, idx: colIdx });
        }
      });

      var parsedCustomers = [];
      var phoneSet = new Set();

      for (var r = startRow; r < tempImportData.length; r++) {
        var row = tempImportData[r];
        if (!row || row.length === 0) continue;
        var phoneVal = cleanPhone(row[phoneCol]);
        if (!phoneVal) continue;
        if (phoneSet.has(phoneVal)) continue;
        phoneSet.add(phoneVal);

        var nameVal = nameCol !== -1 ? String(row[nameCol] || '').trim() : '客户';
        var companyVal = compCol !== -1 ? String(row[compCol] || '').trim() : '';
        var noteVal = noteCol !== -1 ? String(row[noteCol] || '').trim() : '';

        var fundVal = '';
        if (/^d{4,5}$/.test(noteVal)) {
          fundVal = noteVal;
          noteVal = '';
        }

        var customObj = {};
        customMappings.forEach(function(m) {
          var val = String(row[m.idx] || '').trim();
          if (val) {
            customObj[m.name] = val;
          }
        });
        var finalNote = noteVal;
        if (Object.keys(customObj).length > 0 || fundVal) {
          var pl = { note: noteVal, custom: customObj };
          if (fundVal) pl.fund = fundVal;
          finalNote = JSON.stringify(pl);
        }

        parsedCustomers.push({
          name: nameVal || '未知姓名',
          phone: phoneVal,
          mobile: phoneVal,
          company: companyVal,
          note: finalNote,
          fund: fundVal,
          dialedStatus: 'todo',
          duration: '',
          callNote: '',
          category: defaultCat,
          batch_label: batchLabel
        });
      }

      if (parsedCustomers.length === 0) {
        alert('未找到任何有效的数据，请确认所选的数据列！');
        return;
      }

      importedClients = parsedCustomers;
      saveState();
      updateDashboardVisibility(true);
      renderDialCards();

      // Auto-upload to Supabase
      uploadCustomersToSupabase(parsedCustomers, batchLabel);

      resetAIImporterUI();
    }

    function executeAIImportVcf() {
      if (!tempImportData || tempImportData.length === 0) return;
      var batchLabel = (document.getElementById('batchLabelInput').value || '').trim();
      var defaultCat = document.getElementById('importCategorySelect') ? document.getElementById('importCategorySelect').value : '公海客户';
      // Tag each client with the batch label and category
      for (var i = 0; i < tempImportData.length; i++) {
        var c = tempImportData[i];
        c.batch_label = batchLabel;
        c.category = defaultCat;
        c.mobile = c.mobile || c.phone;
        c.phone = c.phone || c.mobile;
        if (!c.fund && /^d{4,5}$/.test((c.note || '').trim())) {
          c.fund = c.note.trim();
          c.note = '';
        }
      }
      importedClients = tempImportData;
      saveState();
      updateDashboardVisibility(true);
      renderDialCards();

      // Auto-upload to Supabase
      uploadCustomersToSupabase(tempImportData, batchLabel);

      resetAIImporterUI();
    }

    function renderAIReportForVcf(contactsList) {
      tempImportData = contactsList;
      tempImportType = 'vcf';
      
      if (contactsList && contactsList.length > 0) {
        executeAIImportVcf();
        alert('VCF 识别：成功自动识别 ' + contactsList.length + ' 个联系人，已直接自动入库并同步至 Supabase！');
        return;
      }

      document.getElementById('pillName').className = 'client-card-tag';
      document.getElementById('pillName').style.background = 'rgba(7,193,96,0.08)';
      document.getElementById('pillName').style.color = 'var(--accent-wechat)';
      document.getElementById('pillName').innerHTML = '姓名 VCF (FN)';

      document.getElementById('pillPhone').className = 'client-card-tag';
      document.getElementById('pillPhone').style.background = 'rgba(7,193,96,0.08)';
      document.getElementById('pillPhone').style.color = 'var(--accent-wechat)';
      document.getElementById('pillPhone').innerHTML = '电话 VCF (TEL)';

      document.getElementById('pillCompany').className = 'client-card-tag';
      document.getElementById('pillCompany').style.background = 'rgba(74,108,247,0.08)';
      document.getElementById('pillCompany').style.color = '#4a6cf7';
      document.getElementById('pillCompany').innerHTML = '公司 VCF (ORG)';

      document.getElementById('pillNote').className = 'client-card-tag';
      document.getElementById('pillNote').style.background = 'rgba(0,0,0,0.04)';
      document.getElementById('pillNote').style.color = 'var(--text-light)';
      document.getElementById('pillNote').innerHTML = '备注 VCF (NOTE)';

      document.getElementById('aiAdjustControls').style.display = 'none';
      document.getElementById('aiToggleAdjustBtn').style.display = 'none';

      document.getElementById('aiConfidenceBadge').innerHTML = '● AI 置信度: 100.0%';
      document.getElementById('aiReportTitle').innerHTML = 'AI 识别报告: VCF 通讯录文件';

      var tableBody = document.querySelector('#aiPreviewTable tbody');
      if (tableBody) {
        tableBody.innerHTML = '';
        var limit = Math.min(contactsList.length, 3);
        for (var i = 0; i < limit; i++) {
          var c = contactsList[i];
          var tr = document.createElement('tr');
          tr.style.borderBottom = '0.5px solid var(--card-border)';
          tr.innerHTML = '<td style="padding: 6px 8px; font-weight: 800; color: var(--text-main);">' + esc(c.name || '未知姓名') + '</td>' +
                         '<td style="padding: 6px 8px; font-family: monospace; color: var(--accent-wechat); font-weight: 800;">' + esc(c.phone) + '</td>' +
                         '<td style="padding: 6px 8px; color: var(--text-soft);">' + esc(c.company || '(空)') + '</td>';
          tableBody.appendChild(tr);
        }
      }

      document.getElementById('aiConfirmImportBtn').innerHTML = 'AI 确认导入 (' + contactsList.length + ' 位联系人)';

      document.getElementById('aiImportScanning').style.display = 'none';
      document.getElementById('aiLaserLine').style.display = 'none';
      document.getElementById('aiImportReport').style.display = 'flex';
    }

    var scriptLoadingPromises = {};
    function loadScript(url) {
      if (scriptLoadingPromises[url]) return scriptLoadingPromises[url];
      scriptLoadingPromises[url] = new Promise(function(resolve, reject) {
        if (document.querySelector('script[src="' + url + '"]')) {
          resolve();
          return;
        }
        var script = document.createElement('script');
        script.src = url;
        script.onload = function() { resolve(); };
        script.onerror = function() { reject(new Error('Failed to load script: ' + url)); };
        document.head.appendChild(script);
      });
      return scriptLoadingPromises[url];
    }

    function parsePhoneContactsFromRawText(text) {
      if (!text) return [];
      
      var lines = text.split(/\\r\\n|\\r|\\n/);
      var results = [];
      var phoneSet = new Set();
      
      // Common Chinese Surnames to validate names
      var SURNAMES = /^(张|李|王|刘|陈|杨|赵|黄|周|吴|徐|孙|马|胡|朱|郭|何|林|高|罗|郑|梁|谢|唐|韩|曹|许|邓|萧|冯|曾|程|蔡|彭|潘|袁|于|董|余|苏|叶|吕|魏|蒋|田|杜|丁|沈|姜|范|江|傅|钟|卢|汪|戴|崔|陆|廖|姚|方|金|邱|夏|谭|韦|贾|邹|石|熊|放|孟|秦|阎|薛|侯|雷|白|龙|段|郝|孔|邵|史|毛|常|万|顾|赖|武|康|贺|严|克)/;
      
      // Strict metadata, label and corporate suffix validation to filter out noise
      function isValidNameHeuristic(str) {
        if (!str) return false;
        var cleanStr = str.replace(/[\\s.,，。:：;；%&|()（）\\[\\]{}<>]/g, '');
        // Must contain ONLY Chinese characters
        if (!/^[\\u4e00-\\u9fa5]+$/.test(cleanStr)) {
          return false;
        }
        // Length check
        if (cleanStr.length < 1 || cleanStr.length > 6) {
          return false;
        }
        // Single character: accept as surname (common in phone dialers)
            if (cleanStr.length === 1) {
              if (!/^[一-龥]$/.test(cleanStr)) return false;
              return true;
            }
        if (/姓名|电话|手机|号码|公司|备注|联系人|客户|微信|意向|跟进|记录|挂断|接通|无效|加微信|想买|说明|介绍|详情|tel|phone|mobile|name/i.test(cleanStr)) {
          return false;
        }
        if (/有限公司|有限责任|集团|公司|企业|厂|店|中心|商行|工作室|股份|学校|幼儿园|小学|中学|大学|学院|研究院|研究所|实验室|医院|银行|局|委|会|处|所|站|部|厅|署|社|团|队|组/.test(cleanStr)) {
          return false;
        }
        if (/北京|上海|广州|深圳|成都|杭州|武汉|西安|重庆|南京|天津|中国|四川|湖南|湖北|广东|江苏|浙江|山东|福建|江西|河南|河北|安徽|辽宁|吉林|黑龙江|山西|陕西|甘肃|青海|云南|贵州|广西|西藏|内模|内蒙|新疆|宁夏|海南|港澳|台湾|东莞|佛山|温州|宁波|苏州|无锡|常州|扬州|徐州|南通/i.test(cleanStr)) {
          return false;
        }
        return true;
      }

      function isNoteLike(str) {
        if (!str) return false;
        if (/已|不|需|要|想|加|微|信|挂|忙|通|拒|错|空|停|回|查|跟|打|拨|过|转|去|好|中|没|死|下|上|朝|晚|息|留|考|虑|意向|跟进|记录|接听|挂断|无效|空号|停机|拒绝|联系|电话|时间|下午|上午|明天|后天/i.test(str)) {
          return true;
        }
        if (/[了吧呢吗没说谈电话办买看做去来想在要给]/g.test(str)) {
          return true;
        }
        if (str.length > 10 && !/有限|集团|公司|厂|店|中心|商行|工作室|学校|幼儿园|小学|中学|大学|学院|研究院|研究所|实验室|医院|银行|局|委|会|处|所|站/i.test(str)) {
          return true;
        }
        return false;
      }

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        
        var cleanLine = line.replace(/[-\\s]/g, '').replace(/[Il|]/g, '1').replace(/[oO]/g, '0');
        var robustPhoneRegex = /(?:1[3-9]\\d{9}|0\\d{2,3}\\d{7,8})/g;
        var match;
        var foundPhonesInLine = [];
        
        while ((match = robustPhoneRegex.exec(cleanLine)) !== null) {
          var cleanPhoneStr = match[0];
          if (!phoneSet.has(cleanPhoneStr)) {
            foundPhonesInLine.push({
              phone: cleanPhoneStr,
              raw: cleanPhoneStr,
              index: 0,
              length: match[0].length
            });
            phoneSet.add(cleanPhoneStr);
          }
        }
        
        if (foundPhonesInLine.length === 0) {
          var phoneRegex = /(?:1[3-9]\\d{9}|1[3-9]\\d{1,2}[-\\s]\\d{3,4}[-\\s]\\d{4}|0\\d{2,3}[-\\s]\\d{7,8}|0\\d{9,11})/g;
          while ((match = phoneRegex.exec(line)) !== null) {
            var cleanPhoneStr = match[0].replace(/[-\\s]/g, '');
            if (!phoneSet.has(cleanPhoneStr)) {
              foundPhonesInLine.push({
                phone: cleanPhoneStr,
                raw: match[0],
                index: match.index,
                length: match[0].length
              });
              phoneSet.add(cleanPhoneStr);
            }
          }
        }
        
        if (foundPhonesInLine.length === 0) continue;
        
        for (var pi = 0; pi < foundPhonesInLine.length; pi++) {
          var phoneInfo = foundPhonesInLine[pi];
          var phoneStr = phoneInfo.phone;
          var rawPhoneStr = phoneInfo.raw;
          
          var name = '';
          var company = '';
          var noteParts = [];
          
          // Replace current phone in line with space to separate name and company when连写
          var lineWithoutPhone = line.replace(rawPhoneStr, ' ');
          
          // Delimit segments on the line to parse columns/words
          var delimiters = /[\\s,，:：|｜;；\\t\\-\\[\\]\\(\\)]+/;
          var lineParts = lineWithoutPhone.split(delimiters).map(function(p) { return p.trim(); }).filter(Boolean);
          
          // Filter out other phone tokens if any
          var remainingParts = lineParts.filter(function(part) {
            var cleanPart = part.replace(/[-\\s]/g, '');
            for (var k = 0; k < foundPhonesInLine.length; k++) {
              var otherPhone = foundPhonesInLine[k];
              if (cleanPart.indexOf(otherPhone.phone) !== -1 || part.indexOf(otherPhone.raw) !== -1) {
                return false;
              }
            }
            return true;
          });
          
          // 1. Identify Company Candidates
          var bestCompany = '';
          for (var j = 0; j < remainingParts.length; j++) {
            var part = remainingParts[j];
            if (/联系人|负责人|姓名|电话|手机|号码|备注|意向|跟进|记录|挂断|接通|无效|加微信/i.test(part)) {
              continue;
            }
            if (/有限公司|有限责任|集团|公司|企业|厂|店|中心|商行|工作室|股份|科技|技术|网络|制造|金融|地产|开发/.test(part)) {
              bestCompany = part;
              break;
            }
          }
          
          // Fallback Company (institution suffixes)
          if (!bestCompany) {
            for (var j = 0; j < remainingParts.length; j++) {
              var part = remainingParts[j];
              if (/局|厅|科|所|校|院|部/.test(part)) {
                bestCompany = part;
                break;
              }
            }
          }
          
          // Phase C Fallback Company (any segment that is not note-like, not the name, and is a Chinese/Alphanumeric noun of length 2-12)
          if (!bestCompany) {
            for (var j = 0; j < remainingParts.length; j++) {
              var part = remainingParts[j];
              if (part === name) continue;
              var isChineseNoun = /^[\\u4e00-\\u9fa5a-zA-Z0-9\\(\\)（）]+$/.test(part) && /[\\u4e00-\\u9fa5]/.test(part);
              if (isChineseNoun && part.length >= 2 && part.length <= 12 && !isNoteLike(part)) {
                bestCompany = part;
                break;
              }
            }
          }
          
          if (bestCompany) {
            company = bestCompany;
          }
          
          // Spatial prefix/suffix extraction
          var prefix = line.substring(0, phoneInfo.index).trim();
          var prefixMatch = /(?:^|\\s)([\\u4e00-\\u9fa5]{2,4})(?=\\s|$)/.exec(prefix) || /^([\\u4e00-\\u9fa5]{2,4})/.exec(prefix) || /([\\u4e00-\\u9fa5]{1,4})\\s*$/.exec(prefix);
          var prefixName = prefixMatch ? prefixMatch[1] : '';
          
          var suffix = line.substring(phoneInfo.index + phoneInfo.length).trim();
          var suffixMatch = /^\\s*([\\u4e00-\\u9fa5]{1,4})/.exec(suffix);
          var suffixName = suffixMatch ? suffixMatch[1] : '';

          // 2. Identify Name with multi-phase priority
          // Phase A: Segment matches starting with common surnames
          for (var j = 0; j < remainingParts.length; j++) {
            var part = remainingParts[j];
            if (part === company) continue;
            if (isValidNameHeuristic(part) && SURNAMES.test(part) && part.length <= 4) {
              name = part;
              break;
            }
          }
          
          // Phase B: Adjacent prefix/suffix matches starting with common surnames
          if (!name) {
            if (prefixName && isValidNameHeuristic(prefixName) && SURNAMES.test(prefixName)) {
              name = prefixName;
            } else if (suffixName && isValidNameHeuristic(suffixName) && SURNAMES.test(suffixName)) {
              name = suffixName;
            }
          }
          
          // Phase C: Regular segments (Chinese name / titles) satisfying validity
          if (!name) {
            for (var j = 0; j < remainingParts.length; j++) {
              var part = remainingParts[j];
              if (part === company) continue;
              if (isValidNameHeuristic(part) && part.length <= 4) {
                name = part;
                break;
              }
            }
          }
          
          // Phase D: Adjacent prefix/suffix satisfying validity
          if (!name) {
            if (prefixName && isValidNameHeuristic(prefixName)) {
              name = prefixName;
            } else if (suffixName && isValidNameHeuristic(suffixName)) {
              name = suffixName;
            }
          }
          
          // Phase E: Any valid remaining segment up to 6 characters
          if (!name) {
            for (var j = 0; j < remainingParts.length; j++) {
              var part = remainingParts[j];
              if (part === company) continue;
              if (isValidNameHeuristic(part)) {
                name = part;
                break;
              }
            }
          }
          
          // Fallback
          if (!name) {
            name = '客户-' + phoneStr.substring(phoneStr.length - 4);
          }
          
          // Extract Notes from remaining parts
          for (var j = 0; j < remainingParts.length; j++) {
            var part = remainingParts[j];
            if (part !== name && part !== company) {
              // Skip UI labels/metadata in notes to keep them clean
              if (/姓名|电话|手机|号码|公司|备注|联系人|客户|微信|负责人|说明|介绍|详情/i.test(part) && part.length <= 5) {
                continue;
              }
              var cleanPart = part.replace(/[-\\s.,，。:：;；%&|()（）\\[\\]{}<>]/g, '');
              if (cleanPart.length <= 1 && !/^\\d$/.test(cleanPart)) {
                continue;
              }
              if (/^[a-zA-Z]+$/.test(cleanPart) && cleanPart.length < 3) {
                continue;
              }
              noteParts.push(part);
            }
          }
          
          var finalNote = noteParts.join(' ');
          var fund = '';
          if (/^\\d{4,5}$/.test(finalNote)) {
            fund = finalNote;
            finalNote = '';
          }
          results.push({
            name: name,
            phone: phoneStr,
            company: company,
            note: finalNote,
            fund: fund
          });
        }
      }
      
      if (results.length === 0) {
        var globalPhoneRegex = /1[3-9]\\d{9}/g;
        var globalMatch;
        while ((globalMatch = globalPhoneRegex.exec(text)) !== null) {
          var p = globalMatch[0];
          if (!phoneSet.has(p)) {
            phoneSet.add(p);
            
            // Reverse-seek in raw text for names immediately preceding global phones
            var searchStart = Math.max(0, globalMatch.index - 15);
            var searchSlice = text.substring(searchStart, globalMatch.index);
            var nameMatch = /([\\u4e00-\\u9fa5]{2,4})\\s*$/.exec(searchSlice);
            var foundName = nameMatch ? nameMatch[1] : '';
            
            results.push({
              name: foundName || ('客户-' + p.substring(p.length - 4)),
              phone: p,
              company: '',
              note: ''
            });
          }
        }
      }
      
      return results;
    }

    // Correct OCR text using text AI (not vision) — fixes Tesseract/WASM errors
    // Falls back to regex parsing if AI is unavailable
    function correctOcrTextWithAI(rawText, fileName, onDone) {
      // Safe DOM helper
      function safeLog(elId, msg) {
        var el = document.getElementById(elId);
        if (el) { el.innerHTML = msg; el.style.opacity = '1'; }
      }

      // Check if any text AI is configured
      var aiKey = (localStorage.getItem('vision_api_key') || localStorage.getItem('ai_api_key') || localStorage.getItem('deepseek_api_key') || '').trim();
      if (!aiKey) {
        // No AI key — use regex fallback directly
        var contacts = parsePhoneContactsFromRawText(rawText);
        onDone(contacts);
        return;
      }

      // If the text contains too many phone numbers, bypass AI to prevent timeouts and token limits
      var phoneCount = (rawText.match(/1[3-9]\\d{9}/g) || []).length;
      if (phoneCount > 30) {
        console.log('[OCR Correct] Large data set detected (' + phoneCount + ' phones), bypassing AI to prevent timeouts.');
        safeLog('aiLog3', '检测到数据量较大（共 ' + phoneCount + ' 个号码），已启用本地极速解析...');
        var contacts = parsePhoneContactsFromRawText(rawText);
        tempOcrEngine = 'local_tesseract_large';
        setTimeout(function() { onDone(contacts); }, 500); // 500ms delay for visual feedback
        return;
      }

      safeLog('aiLog3', '文本 AI 正在修正 OCR 识别错误...');
      safeLog('aiLog4', '检测并修正：数字混淆、形近字、断裂文本...');

      fetch('/api/ocr/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText, fileName: fileName || 'local_ocr' })
      })
      .then(function(r) { return r.json(); })
      .then(function(result) {
        if (result.contacts && result.contacts.length > 0) {
          safeLog('aiLog3', '文本 AI 修正完成 · 识别 ' + result.contacts.length + ' 个联系人');
          // Save raw OCR text for training data
          tempOcrRawText = rawText;
          tempOcrEngine = 'text_ai_correct';
          onDone(result.contacts);
        } else {
          // AI returned no contacts — fallback to regex
          safeLog('aiLog3', 'AI 未检出，使用本地正则解析...');
          var fbContacts = parsePhoneContactsFromRawText(rawText);
          tempOcrEngine = 'local_tesseract';
          onDone(fbContacts);
        }
      })
      .catch(function(err) {
        console.error('[OCR Correct] API call failed, using regex fallback:', err.message);
        safeLog('aiLog3', 'AI 不可用，使用本地正则解析...');
        var fbContacts = parsePhoneContactsFromRawText(rawText);
        tempOcrEngine = 'local_tesseract';
        onDone(fbContacts);
      });
    }

    function handleFileImportDispatch(file) {
      if (!file) return;
      var ext = file.name.split('.').pop().toLowerCase();
      var sizeMB = file.size / (1024 * 1024);
      
      if (sizeMB > 30) {
        alert('文件大小超过 30MB 限制！目前仅支持上传 30MB 以内的文件。');
        return;
      }
      
      if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm' || ext === 'csv') {
        if (sizeMB > 3) {
          handleExcelLargeFileWorker(file);
        } else {
          handleExcelImport(file);
        }
      } else if (ext === 'vcf' || ext === 'vcard') {
        handleVcfImport(file);
      } else if (ext === 'docx') {
        handleDocxImport(file);
      } else if (ext === 'pdf') {
        handlePdfImport(file);
      } else if (ext === 'txt') {
        handleTxtImport(file);
      } else if (/jpg|jpeg|png|bmp|webp/i.test(ext)) {
        handleImageOCR(file);
      } else {
        alert('不支持的文件格式！目前支持 Excel, CSV, VCF, Word(docx), PDF, 纯文本(txt) 以及常用格式图片。');
      }
    }

    function handleExcelLargeFileWorker(file) {
      showAIScanningUI(file.name);
      document.getElementById('aiScanStatus').innerHTML = '智能大文件多线程加速解析中...';
      if (document.getElementById('aiLog1')) {
        document.getElementById('aiLog1').innerHTML = '正在加载 Web Worker 解析引擎...';
        document.getElementById('aiLog1').style.opacity = '1';
      }
      
      var reader = new FileReader();
      reader.onload = function(e) {
        var arrayBuffer = e.target.result;
        
        var workerCode = [
          "self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');",
          "self.onmessage = function(e) {",
          "  try {",
          "    var data = new Uint8Array(e.data);",
          "    var workbook = XLSX.read(data, { type: 'array' });",
          "    var firstSheetName = workbook.SheetNames[0];",
          "    var worksheet = workbook.Sheets[firstSheetName];",
          "    var json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });",
          "    self.postMessage({ success: true, json: json });",
          "  } catch(err) {",
          "    self.postMessage({ success: false, error: err.message });",
          "  }",
          "};"
        ].join("\\n");
        
        var blob = new Blob([workerCode], { type: 'application/javascript' });
        var workerUrl = URL.createObjectURL(blob);
        var worker = new Worker(workerUrl);
        
        worker.onmessage = function(ev) {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          
          if (ev.data.success) {
            var json = ev.data.json;
            if (json.length === 0) {
              alert('导入失败：表格无数据');
              resetAIImporterUI();
              return;
            }
            if (document.getElementById('aiLog3')) {
              document.getElementById('aiLog3').innerHTML = '大数据读取与过滤清洗完成';
              document.getElementById('aiLog3').style.opacity = '1';
            }
            var detected = runAIColumnMapping(json);
            renderAIReportForExcel(json, detected);
          } else {
            alert('大文件解析失败：' + ev.data.error);
            resetAIImporterUI();
          }
        };
        
        worker.postMessage(arrayBuffer, [arrayBuffer]);
      };
      
      reader.readAsArrayBuffer(file);
    }

    function handleDocxImport(file) {
      tempOcrEngine = 'text_fallback';
      showAIScanningUI(file.name);
      document.getElementById('aiScanStatus').innerHTML = 'AI 正在载入 Word 解析引擎...';
      if (document.getElementById('aiLog1')) {
        document.getElementById('aiLog1').innerHTML = '正在加载 mammoth.js 脚本库...';
        document.getElementById('aiLog1').style.opacity = '1';
      }
      
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js')
        .then(function() {
          if (document.getElementById('aiLog2')) {
            document.getElementById('aiLog2').innerHTML = 'Word 解析引擎载入成功';
            document.getElementById('aiLog2').style.opacity = '1';
          }
          document.getElementById('aiScanStatus').innerHTML = '� 正在深度分析 Word 文档数据流...';
          
          var reader = new FileReader();
          reader.onload = function(e) {
            var arrayBuffer = e.target.result;
            window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
              .then(function(result) {
                if (document.getElementById('aiLog3')) {
                  document.getElementById('aiLog3').innerHTML = '提取纯文本内容完成';
                  document.getElementById('aiLog3').style.opacity = '1';
                }
                var text = result.value;
                if (document.getElementById('aiLog4')) {
                  document.getElementById('aiLog4').innerHTML = 'AI 正在运行模式启发式提取...';
                  document.getElementById('aiLog4').style.opacity = '1';
                }
                setTimeout(function() {
                  correctOcrTextWithAI(text, file.name, function(contacts) {
                    renderAIUnstructuredReport(file.name, contacts);
                  });
                }, 600);
              })
              .catch(function(err) {
                alert('Word 解析失败：' + err.message);
                resetAIImporterUI();
              });
          };
          reader.readAsArrayBuffer(file);
        })
        .catch(function(err) {
          alert('解析引擎加载失败，请检查您的网络连接：' + err.message);
          resetAIImporterUI();
        });
    }

    function handlePdfImport(file) {
      tempOcrEngine = 'text_fallback';
      showAIScanningUI(file.name);
      document.getElementById('aiScanStatus').innerHTML = 'AI 正在载入 PDF 解析引擎...';
      if (document.getElementById('aiLog1')) {
        document.getElementById('aiLog1').innerHTML = '正在加载 pdf.js 脚本库...';
        document.getElementById('aiLog1').style.opacity = '1';
      }
      
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js')
        .then(function() {
          window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          
          if (document.getElementById('aiLog2')) {
            document.getElementById('aiLog2').innerHTML = 'PDF 引擎初始化完成';
            document.getElementById('aiLog2').style.opacity = '1';
          }
          document.getElementById('aiScanStatus').innerHTML = '� 正在深度分析 PDF 文档页面...';
          
          var reader = new FileReader();
          reader.onload = function(e) {
            var arrayBuffer = e.target.result;
            var loadingTask = window['pdfjs-dist/build/pdf'].getDocument({ data: arrayBuffer });
            
            loadingTask.promise.then(function(pdf) {
              var maxPages = pdf.numPages;
              var extractedText = '';
              var loadedPages = 0;
              
              if (document.getElementById('aiLog3')) {
                document.getElementById('aiLog3').innerHTML = '正在并行扫描 ' + maxPages + ' 个页面...';
                document.getElementById('aiLog3').style.opacity = '1';
              }
              
              function loadPageText(pageNumber) {
                document.getElementById('aiScanStatus').innerHTML = '� 正在扫描 PDF 页面 (' + pageNumber + '/' + maxPages + ')...';
                
                return pdf.getPage(pageNumber).then(function(page) {
                  return page.getTextContent().then(function(textContent) {
                    var pageText = textContent.items.map(function(item) { return item.str; }).join(' ');
                    extractedText += pageText + '\\n';
                    loadedPages++;
                    
                    if (loadedPages < maxPages) {
                      return loadPageText(pageNumber + 1);
                    } else {
                      if (document.getElementById('aiLog3')) {
                        document.getElementById('aiLog3').innerHTML = 'PDF 页面文本提取完毕';
                      }
                      if (document.getElementById('aiLog4')) {
                        document.getElementById('aiLog4').innerHTML = 'AI 正在运行特征神经网络分析...';
                        document.getElementById('aiLog4').style.opacity = '1';
                      }
                      setTimeout(function() {
                        correctOcrTextWithAI(extractedText, file.name, function(contacts) {
                          if (contacts.length > 0) {
                            renderAIUnstructuredReport(file.name, contacts);
                          } else {
                            handleScannedPdfOCR(pdf, file.name);
                          }
                        });
                      }, 600);
                    }
                  });
                });
              }

              function handleScannedPdfOCR(pdf, fileName) {
                runLocalScannedPdfSlicingOCR(pdf, fileName);
              }
              
              loadPageText(1).catch(function(err) {
                alert('PDF 页面文本提取失败：' + err.message);
                resetAIImporterUI();
              });
              
            }).catch(function(err) {
              alert('PDF 文档读取失败：' + err.message);
              resetAIImporterUI();
            });
          };
          reader.readAsArrayBuffer(file);
        })
        .catch(function(err) {
          alert('PDF 解析引擎加载失败：' + err.message);
          resetAIImporterUI();
        });
    }

    // ====== Local Wasm OCR Slicing & Preprocessing Helper Methods ======
    var tempOcrFile = null;
    var tempOcrPdf = null;
    var tempOcrFileName = '';
    var tempOcrImgDataUrl = '';
    var ocrPreviewImage = new Image();

    function showOcrSlicingPreview(imgDataUrl) {
      var configPanel = document.getElementById('localOcrConfigPanel');
      var initPanel = document.getElementById('aiImportInit');
      var scanPanel = document.getElementById('aiImportScanning');
      var reportPanel = document.getElementById('aiImportReport');
      
      if (initPanel) initPanel.style.display = 'none';
      if (scanPanel) scanPanel.style.display = 'none';
      if (reportPanel) reportPanel.style.display = 'none';
      if (configPanel) configPanel.style.display = 'flex';
      
      ocrPreviewImage.src = imgDataUrl;
      ocrPreviewImage.onload = function() {
        drawOcrSlicingPreviewLines();
      };
    }

    function drawOcrSlicingPreviewLines() {
      var canvas = document.getElementById('ocrPreviewCanvas');
      if (!canvas || !ocrPreviewImage.src) return;
      var ctx = canvas.getContext('2d');
      
      var split1 = parseInt(document.getElementById('sliderSplit1').value);
      var split2 = parseInt(document.getElementById('sliderSplit2').value);
      var order = document.getElementById('ocrColumnOrder').value;
      
      // Update values text
      document.getElementById('valSplit1').textContent = split1 + '%';
      document.getElementById('valSplit2').textContent = split2 + '%';
      
      // Set canvas dimensions to match image aspect ratio
      canvas.width = ocrPreviewImage.naturalWidth;
      canvas.height = ocrPreviewImage.naturalHeight;
      
      ctx.drawImage(ocrPreviewImage, 0, 0);
      
      // Draw vertical line 1 (Dashed Red)
      var x1 = canvas.width * (split1 / 100);
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = Math.max(2, canvas.width / 150);
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, canvas.height);
      ctx.stroke();
      
      // Draw vertical line 2 (Dashed Green)
      var x2 = canvas.width * (split2 / 100);
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = Math.max(2, canvas.width / 150);
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, canvas.height);
      ctx.stroke();
      
      // Draw labels between columns
      ctx.font = 'bold ' + Math.max(12, canvas.height / 20) + 'px sans-serif';
      ctx.textAlign = 'center';
      
      var col1Text = '姓名', col2Text = '电话', col3Text = '单位/备注';
      if (order === 'phone_name_other') {
        col1Text = '电话'; col2Text = '姓名'; col3Text = '单位/备注';
      } else if (order === 'name_other_phone') {
        col1Text = '姓名'; col2Text = '单位/备注'; col3Text = '电话';
      }
      
      ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
      ctx.fillText(col1Text, x1 / 2, canvas.height / 2);
      
      ctx.fillStyle = 'rgba(46, 204, 113, 0.7)';
      ctx.fillText(col2Text, x1 + (x2 - x1) / 2, canvas.height / 2);
      
      ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
      ctx.fillText(col3Text, x2 + (canvas.width - x2) / 2, canvas.height / 2);
    }

    function startLocalOcrProcessing() {
      var configPanel = document.getElementById('localOcrConfigPanel');
      if (configPanel) configPanel.style.display = 'none';
      
      showAIScanningUI(tempOcrFileName);
      document.getElementById('aiScanStatus').innerHTML = '正在加载本地 Wasm 神经网络...';
      if (document.getElementById('aiLog1')) {
        document.getElementById('aiLog1').innerHTML = '正在拉取 tesseract.js 识别引擎...';
        document.getElementById('aiLog1').style.opacity = '1';
      }
      
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js')
        .then(function() {
          if (document.getElementById('aiLog1')) document.getElementById('aiLog1').innerHTML = 'Wasm 视觉解析库就绪';
          
          if (tempOcrPdf) {
            processLocalPdfOCR(tempOcrPdf);
          } else {
            processLocalImageOCR();
          }
        })
        .catch(function(err) {
          alert('OCR 引擎加载失败: ' + err.message);
          resetAIImporterUI();
        });
    }

    function processLocalImageOCR() {
      var useSlicing = document.getElementById('chkUseSlicing') ? document.getElementById('chkUseSlicing').checked : true;
      
      if (!useSlicing) {
        if (document.getElementById('aiLog2')) {
          document.getElementById('aiLog2').innerHTML = '正在进行全图 AI 识别，取消切片优化...';
          document.getElementById('aiLog2').style.opacity = '1';
        }
        if (document.getElementById('aiLog3')) {
          document.getElementById('aiLog3').innerHTML = '正在加载语言模型包...';
          document.getElementById('aiLog3').style.opacity = '1';
        }
        
        doTesseractLocal(tempOcrImgDataUrl, function(err, contacts) {
          if (err || !contacts || contacts.length === 0) {
            console.error('Local Full-Image Tesseract failed:', err);
            alert('本地 OCR 识别失败或未检出任何联系人！');
            resetAIImporterUI();
          } else {
            if (document.getElementById('aiLog4')) {
              document.getElementById('aiLog4').innerHTML = '� 本地识别成功，共' + contacts.length + ' 人';
              document.getElementById('aiLog4').style.opacity = '1';
            }
            setTimeout(function() {
              renderAIUnstructuredReport(tempOcrFileName, contacts);
            }, 800);
          }
        });
        return;
      }

      var img = new Image();
      img.src = tempOcrImgDataUrl;
      img.onload = function() {
        if (document.getElementById('aiLog2')) {
          document.getElementById('aiLog2').innerHTML = '正在进行列拆片预处理...';
          document.getElementById('aiLog2').style.opacity = '1';
        }
        
        var split1 = parseInt(document.getElementById('sliderSplit1').value) / 100;
        var split2 = parseInt(document.getElementById('sliderSplit2').value) / 100;
        var order = document.getElementById('ocrColumnOrder').value;
        
        var slices = sliceAndPreprocess(img, split1, split2, order);
        
        if (document.getElementById('aiLog2')) document.getElementById('aiLog2').innerHTML = '图像二值化与 2x 缩放完成';
        if (document.getElementById('aiLog3')) {
          document.getElementById('aiLog3').innerHTML = '正在初始化中英文语言模型包...';
          document.getElementById('aiLog3').style.opacity = '1';
        }
        
        if (document.getElementById('aiLog2')) {
          document.getElementById('aiLog2').innerHTML = '正在并行运行本地 OCR 与云端视觉识别...';
          document.getElementById('aiLog2').style.opacity = '1';
        }
        
        var localOcrPromise = runTesseractOnSlices(slices, img);
        
        var cloudVisionPromise = fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: tempOcrImgDataUrl })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) { return data.text || ''; })
        .catch(function(err) {
          console.warn('Cloud Vision AI failed:', err);
          return '';
        });
        
        Promise.all([localOcrPromise, cloudVisionPromise])
          .then(function(results) {
            var localContacts = results[0];
            var visionText = results[1];
            
            if (!visionText) {
              if (document.getElementById('aiLog3')) {
                document.getElementById('aiLog3').innerHTML = '云端视觉识别不可用，仅使用本地识别结果';
              }
              if (localContacts && localContacts.length > 0) {
                setTimeout(function() {
                  renderAIUnstructuredReport(tempOcrFileName, localContacts);
                }, 800);
              } else {
                alert('本地识别未检出联系人。');
                resetAIImporterUI();
              }
              return;
            }
            
            if (document.getElementById('aiLog3')) {
              document.getElementById('aiLog3').innerHTML = '正在使用大模型对双通道数据进行对齐与纠错...';
            }
            
            return fetch('/api/ocr/correct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                localContacts: localContacts,
                visionText: visionText,
                fileName: tempOcrFileName || 'local_ocr_hybrid'
              })
            })
            .then(function(r) { return r.json(); })
            .then(function(mergeResult) {
              var mergedContacts = mergeResult.contacts || localContacts;
              if (document.getElementById('aiLog4')) {
                document.getElementById('aiLog4').innerHTML = '� 双通道融合纠错完成，共' + mergedContacts.length + ' 人';
                document.getElementById('aiLog4').style.opacity = '1';
              }
              setTimeout(function() {
                renderAIUnstructuredReport(tempOcrFileName, mergedContacts);
              }, 800);
            });
          })
          .catch(function(err) {
            console.error('Hybrid OCR pipeline failed:', err);
            alert('识别处理失败: ' + err.message);
            resetAIImporterUI();
          });
      };
    }

    function processLocalPdfOCR(pdf) {
      var maxPages = pdf.numPages;
      var allContacts = [];
      
      var split1 = parseInt(document.getElementById('sliderSplit1').value) / 100;
      var split2 = parseInt(document.getElementById('sliderSplit2').value) / 100;
      var order = document.getElementById('ocrColumnOrder').value;
      
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      
      function processPage(pageNumber) {
        if (pageNumber > maxPages) {
          if (allContacts.length > 0) {
            if (document.getElementById('aiScanStatus')) {
              document.getElementById('aiScanStatus').innerHTML = '本地 PDF 识别完成';
            }
            if (document.getElementById('aiLog4')) {
              document.getElementById('aiLog4').innerHTML = '� 共识别到' + allContacts.length + ' 个联系人';
            }
            setTimeout(function() {
              renderAIUnstructuredReport(tempOcrFileName, allContacts);
            }, 800);
          } else {
            alert('本地 PDF 识别未检出联系人。请尝试在上方调整分割线滑块并重新识别。');
            resetAIImporterUI();
          }
          return;
        }
        
        document.getElementById('aiScanStatus').innerHTML = '� 本地 Wasm 识别第' + pageNumber + '/' + maxPages + ' 页...';
        if (document.getElementById('aiLog4')) {
          document.getElementById('aiLog4').innerHTML = '正在识别第 ' + pageNumber + ' 页...';
          document.getElementById('aiLog4').style.opacity = '1';
        }
        
        pdf.getPage(pageNumber).then(function(page) {
          var viewport = page.getViewport({ scale: 1.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise.then(function() {
            var img = new Image();
            var imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            img.src = imgDataUrl;
            img.onload = function() {
              var slices = sliceAndPreprocess(img, split1, split2, order);
              
              var localOcrPromise = runTesseractOnSlices(slices, img);
              
              var cloudVisionPromise = fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imgDataUrl })
              })
              .then(function(r) { return r.json(); })
              .then(function(data) { return data.text || ''; })
              .catch(function(err) {
                console.warn('PDF page cloud vision failed:', err);
                return '';
              });
              
              Promise.all([localOcrPromise, cloudVisionPromise])
                .then(function(results) {
                  var localContacts = results[0];
                  var visionText = results[1];
                  
                  if (!visionText) {
                    allContacts = allContacts.concat(localContacts);
                    processPage(pageNumber + 1);
                    return;
                  }
                  
                  return fetch('/api/ocr/correct', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      localContacts: localContacts,
                      visionText: visionText,
                      fileName: tempOcrFileName || 'local_pdf_hybrid'
                    })
                  })
                  .then(function(r) { return r.json(); })
                  .then(function(mergeResult) {
                    var mergedContacts = mergeResult.contacts || localContacts;
                    allContacts = allContacts.concat(mergedContacts);
                    processPage(pageNumber + 1);
                  });
                })
                .catch(function(err) {
                  console.error('Page ' + pageNumber + ' hybrid OCR failed:', err);
                  processPage(pageNumber + 1);
                });
            };
          });
        });
      }
      
      if (document.getElementById('aiLog3')) {
        document.getElementById('aiLog3').innerHTML = '初始化本地识别队列成功';
        document.getElementById('aiLog3').style.opacity = '1';
      }
      
      processPage(1);
    }

    function runCloudImageOCR(file) {
      console.warn('runCloudImageOCR is deprecated');
      alert('云端视觉 OCR 识别已弃用，请配置本地 OCR (Tesseract) 或文本 AI 纠错管线。');
      resetAIImporterUI();
    }

    function runCloudPdfOCR(pdf, fileName) {
      // Workers AI runs on the server side and does not require a client API key.
      var aiKey = true;
      
      var maxPages = pdf.numPages;
      var allContacts = [];
      
      showAIScanningUI(fileName);
      if (document.getElementById('aiScanStatus')) {
        document.getElementById('aiScanStatus').innerHTML = '本地未检出，正切换为云端 AI 视觉识别...';
      }
      if (document.getElementById('aiLog3')) {
        document.getElementById('aiLog3').innerHTML = '正在通过 Canvas 渲染多模态图像...';
      }
      if (document.getElementById('aiLog4')) {
        document.getElementById('aiLog4').innerHTML = '准备识别第 1/' + maxPages + ' 页...';
        document.getElementById('aiLog4').style.opacity = '1';
      }

      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      function processPageOCR(pageNumber) {
        if (pageNumber > maxPages) {
          if (document.getElementById('aiScanStatus')) {
            document.getElementById('aiScanStatus').innerHTML = '扫描版 PDF 识别完成';
          }
          if (document.getElementById('aiLog4')) {
            document.getElementById('aiLog4').innerHTML = '� 共识别到' + allContacts.length + ' 个联系人';
          }
          setTimeout(function() {
            renderAIUnstructuredReport(fileName, allContacts);
          }, 800);
          return;
        }

        if (document.getElementById('aiLog4')) {
          document.getElementById('aiLog4').innerHTML = '正在通过 AI 识别第 ' + pageNumber + '/' + maxPages + ' 页...';
        }

        pdf.getPage(pageNumber).then(function(page) {
          var viewport = page.getViewport({ scale: 1.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          var renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };

          page.render(renderContext).promise.then(function() {
            var imgData = canvas.toDataURL('image/jpeg', 0.75);

            fetch('/api/ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: imgData, mode: 'bulk' })
            })
            .then(function(r) {
              return r.text().then(function(t) {
                try {
                  var d = JSON.parse(t);
                  return d;
                } catch(e) {
                  throw new Error('服务器异常 (' + r.status + '): ' + t.substring(0, 100));
                }
              });
            })
            .then(function(result) {
              var pageContacts = [];
              if (result.contacts && result.contacts.length > 0) {
                result.contacts.forEach(function(c) {
                  if (c.phone) {
                    pageContacts.push({
                      name: c.name || '',
                      phone: c.phone,
                      company: c.company || '',
                      note: c.note || ''
                    });
                  }
                });
              } else if (result.name || result.phone) {
                pageContacts.push({
                  name: result.name || '',
                  phone: result.phone || '',
                  company: result.company || '',
                  note: result.note || result.fund || ''
                });
              }
              if (result.rawText || result.note) {
                var extra = parsePhoneContactsFromRawText(result.rawText || result.note || '');
                extra.forEach(function(ec) {
                  if (!pageContacts.find(function(c) { return c.phone === ec.phone; })) {
                    pageContacts.push(ec);
                  }
                });
              }

              allContacts = allContacts.concat(pageContacts);
              processPageOCR(pageNumber + 1);
            })
            .catch(function(err) {
              console.error('Page ' + pageNumber + ' OCR failed:', err.message);
              if (document.getElementById('aiLog3')) {
                document.getElementById('aiLog3').innerHTML = '第 ' + pageNumber + ' 页识别失败: ' + err.message + '，尝试下一页...';
              }
              processPageOCR(pageNumber + 1);
            });
          });
        }).catch(function(err) {
          console.error('Page ' + pageNumber + ' render failed:', err.message);
          processPageOCR(pageNumber + 1);
        });
      }

      processPageOCR(1);
    }





    function sliceAndPreprocess(img, split1, split2, order) {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      
      var x1 = w * split1;
      var x2 = w * split2;
      
      var col1 = { startX: 0, width: x1 };
      var col2 = { startX: x1, width: x2 - x1 };
      var col3 = { startX: x2, width: w - x2 };
      
      var sliceTypes = ['name', 'phone', 'other'];
      if (order === 'phone_name_other') {
        sliceTypes = ['phone', 'name', 'other'];
      } else if (order === 'name_other_phone') {
        sliceTypes = ['name', 'other', 'phone'];
      }
      
      var results = [];
      [col1, col2, col3].forEach(function(col, idx) {
        var type = sliceTypes[idx];
        
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        
        var sX = col.startX;
        var cW = col.width;
        if (type === 'name') {
          // Removed physical crop to avoid cutting into surnames that are close to the edge
          // We will use color filtering below to wash away the blue icon
        }
        
        canvas.width = cW * 2;
        canvas.height = h * 2;
        
        ctx.drawImage(img, sX, 0, cW, h, 0, 0, canvas.width, canvas.height);
        
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgData.data;
        
        var histogram = new Array(256).fill(0);
        var totalPixels = data.length / 4;
        
        for (var i = 0; i < data.length; i += 4) {
          var r = data[i];
          var g = data[i+1];
          var b = data[i+2];
          
          if (type === 'name') {
            var val = Math.min(r, g, b);
            if (b > r + 30 && b > g + 10 && r < 180) {
              // Wash away blue corner mark by making it white
              val = 255;
            } else if (r > g + 10 && r > b + 10) {
              var redness = r - Math.max(g, b);
              val = Math.max(0, val - redness * 2);
            }
            data[i] = val;
            data[i+1] = val;
            data[i+2] = val;
            histogram[val]++;
          } else {
            var val = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            data[i] = val;
            data[i+1] = val;
            data[i+2] = val;
            histogram[val]++;
          }
        }
        
        var sum = 0;
        for (var i = 0; i < 256; i++) sum += i * histogram[i];
        var sumB = 0;
        var wB = 0;
        var wF = 0;
        var varMax = 0;
        var threshold = 140;
        for (var t = 0; t < 256; t++) {
          wB += histogram[t];
          if (wB === 0) continue;
          wF = totalPixels - wB;
          if (wF === 0) break;
          sumB += t * histogram[t];
          var mB = sumB / wB;
          var mF = (sum - sumB) / wF;
          var varBetween = wB * wF * (mB - mF) * (mB - mF);
          if (varBetween > varMax) {
            varMax = varBetween;
            threshold = t;
          }
        }
        
        for (var i = 0; i < data.length; i += 4) {
          var finalVal = data[i] < threshold ? 0 : 255;
          data[i] = finalVal;
          data[i+1] = finalVal;
          data[i+2] = finalVal;
        }
        
        ctx.putImageData(imgData, 0, 0);
        
        results.push({
          type: type,
          startX: col.startX,
          width: col.width,
          dataUrl: canvas.toDataURL('image/png')
        });
      });
      
      return results;
    }

    function runTesseractOnSlices(slices, img) {
      function cropCellInBrowser(sourceImg, yCenter, col, keepColor) {
        var cellCanvas = document.createElement('canvas');
        var cellCtx = cellCanvas.getContext('2d');
        
        var w = col ? col.width : 77;
        var startX = col ? col.startX : 0;
        
        // Removed physical crop to prevent cutting surnames
        
        cellCanvas.width = w * 2;
        cellCanvas.height = 48 * 2;
        
        var imgH = sourceImg.naturalHeight || sourceImg.height;
        var yStart = Math.max(0, Math.min(Math.round(yCenter - 24), imgH - 48));
        cellCtx.drawImage(sourceImg, startX, yStart, w, 48, 0, 0, cellCanvas.width, cellCanvas.height);
        
        if (keepColor) {
          return cellCanvas.toDataURL('image/png');
        }
        
        var imgData = cellCtx.getImageData(0, 0, cellCanvas.width, cellCanvas.height);
        var data = imgData.data;
        
        var histogram = new Array(256).fill(0);
        for (var i = 0; i < data.length; i += 4) {
          var r = data[i];
          var g = data[i+1];
          var b = data[i+2];
          
          var val = Math.min(r, g, b);
          if (b > r + 30 && b > g + 10 && r < 180) {
            // Wash away blue corner mark by making it white
            val = 255;
          } else if (r > g + 10 && r > b + 10) {
            var redness = r - Math.max(g, b);
            val = Math.max(0, val - redness * 2);
          }
          data[i] = val;
          data[i+1] = val;
          data[i+2] = val;
          histogram[val]++;
        }
        
        var sum = 0;
        for (var i = 0; i < 256; i++) sum += i * histogram[i];
        var sumB = 0, wB = 0, wF = 0, varMax = 0, threshold = 140;
        var totalPixels = data.length / 4;
        for (var t = 0; t < 256; t++) {
          wB += histogram[t];
          if (wB === 0) continue;
          wF = totalPixels - wB;
          if (wF === 0) break;
          sumB += t * histogram[t];
          var mB = sumB / wB;
          var mF = (sum - sumB) / wF;
          var varBetween = wB * wF * (mB - mF) * (mB - mF);
          if (varBetween > varMax) {
            varMax = varBetween;
            threshold = t;
          }
        }
        
        for (var i = 0; i < data.length; i += 4) {
          var finalVal = data[i] < threshold ? 0 : 255;
          data[i] = finalVal;
          data[i+1] = finalVal;
          data[i+2] = finalVal;
        }
        
        cellCtx.putImageData(imgData, 0, 0);
        return cellCanvas.toDataURL('image/png');
      }

      return Tesseract.createWorker({
        workerPath: window.location.origin + '/tessdata/worker.min.js',
        corePath: window.location.origin + '/tessdata/core',
        langPath: window.location.origin + '/tessdata',
        logger: function(m) {
          if (m.status === 'recognizing text') {
            var pct = Math.round(m.progress * 100);
            document.getElementById('aiScanStatus').innerHTML = '本地 OCR 进行中: ' + pct + '%';
          } else if (m.status === 'loading chi_sim.traineddata' || m.status === 'loading eng.traineddata') {
            var loadPct = m.progress ? ' (' + Math.round(m.progress * 100) + '%)' : '';
            document.getElementById('aiScanStatus').innerHTML = '正在载入语言模型包' + loadPct + '...';
          }
        }
      }).then(function(worker) {
        var workerObj = worker;
        
        return Promise.resolve(worker.load())
          .then(function() { return Promise.resolve(worker.loadLanguage('chi_sim')); })
          .then(function() { return Promise.resolve(worker.initialize('chi_sim')); })
          .then(function() {
            var results = {};
            
            function recognizeNext(idx) {
              if (idx >= slices.length) {
                return Promise.resolve(results);
              }
              var slice = slices[idx];
              
              var params = {
                tessedit_pageseg_mode: '6',
                tessedit_char_whitelist: ''
              };
              if (slice.type === 'phone') {
                params.tessedit_char_whitelist = '0123456789- ';
              }
              
              document.getElementById('aiScanStatus').innerHTML = '正在识别列: ' + (slice.type === 'name' ? '姓名' : (slice.type === 'phone' ? '电话' : '单位/备注')) + '...';
              
              return Promise.resolve(workerObj.setParameters(params))
                .then(function() { return Promise.resolve(workerObj.recognize(slice.dataUrl)); })
                .then(function(ocrRes) {
                  results[slice.type] = ocrRes.data.lines.map(function(line) {
                    return {
                      text: line.text,
                      yCenter: (line.bbox.y0 + line.bbox.y1) / 4
                    };
                  });
                  return recognizeNext(idx + 1);
                });
            }
            
            return recognizeNext(0);
          })
          .then(function(ocrData) {
            var names = ocrData.name || [];
            var phones = ocrData.phone || [];
            var companies = ocrData.other || [];
            
            var contacts = [];
            phones.forEach(function(pItem) {
              var phoneText = pItem.text.replace(/s+/g, '').trim();
              phoneText = phoneText.replace(/[OoQD]/g, '0').replace(/[lIi|!]/g, '1').replace(/[Z]/g, '2').replace(/[B]/g, '8').replace(/[S]/g, '5').replace(/[G]/g, '6').replace(/[A]/g, '4').replace(/[T]/g, '7').replace(/[g]/g, '9');
              var phoneMatch = phoneText.match(/1[3-9]d{9}/);
              if (!phoneMatch) return;
              var cleanPhone = phoneMatch[0];
              
              var bestName = '';
              var minNameDist = 99999;
              names.forEach(function(nItem) {
                var dist = Math.abs(nItem.yCenter - pItem.yCenter);
                if (dist < minNameDist && dist < 30) {
                  minNameDist = dist;
                  bestName = nItem.text.trim();
                }
              });
              
              var bestCompany = '';
              var minCompanyDist = 99999;
              companies.forEach(function(cItem) {
                var dist = Math.abs(cItem.yCenter - pItem.yCenter);
                if (dist < minCompanyDist && dist < 30) {
                  minCompanyDist = dist;
                  bestCompany = cItem.text.trim();
                }
              });
              
              bestName = bestName.replace(/^[新旧听一]s*/, '').replace(/[^一-龥a-zA-Z]/g, '').trim();
              bestCompany = bestCompany.replace(/^[|丨s:]+/, '').replace(/[|丨s:]+$/, '').trim();
              
              contacts.push({
                name: bestName,
                phone: cleanPhone,
                company: bestCompany,
                note: '',
                yCenter: pItem.yCenter,
                minNameDist: minNameDist
              });
            });
            
            // Return local contacts directly, as we will use a hybrid full-image merge later
            try { workerObj.terminate(); } catch(e) {}
            return Promise.resolve(contacts.map(function(c) {
              return {
                name: c.name || '',
                phone: c.phone,
                company: c.company,
                note: '',
                yCenter: c.yCenter
              };
            }));
          })
          .catch(function(err) {
            try { workerObj.terminate(); } catch(e) {}
            throw err;
          });
      });
    }

    function runLocalScannedPdfSlicingOCR(pdf, fileName) {
      tempOcrFile = null;
      tempOcrPdf = pdf;
      tempOcrFileName = fileName;
      
      pdf.getPage(1).then(function(page) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise.then(function() {
          tempOcrImgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          showOcrSlicingPreview(tempOcrImgDataUrl);
        });
      });
    }

    // ====== Multi-Image Queue OCR ======
    var multiImageQueue = [];
    var multiImageResults = [];
    var multiImageAborted = false;

    function handleMultiImageOCR(files) {
      multiImageQueue = files;
      multiImageResults = [];
      multiImageAborted = false;
      var total = files.length;

      var ocrEngine = 'local';
      tempOcrEngine = 'local_tesseract';

      // Set up scanning UI directly (skip showAIScanningUI timeouts to avoid progress overwrite)
      document.getElementById('aiImportInit').style.display = 'none';
      document.getElementById('aiImportReport').style.display = 'none';
      document.getElementById('aiImportScanning').style.display = 'flex';
      document.getElementById('aiLaserLine').style.display = 'block';
      document.getElementById('aiScanStatus').innerHTML = '多图排队识别 · 共 ' + total + ' 张';
      document.getElementById('aiLog1').innerHTML = '队列就绪，准备逐张识别...'; document.getElementById('aiLog1').style.opacity = '1';
      document.getElementById('aiLog2').innerHTML = '等待处理第 1/' + total + ' 张...'; document.getElementById('aiLog2').style.opacity = '1';
      document.getElementById('aiLog3').innerHTML = '引擎: 本地离线 (Wasm)'; document.getElementById('aiLog3').style.opacity = '0.8';
      document.getElementById('aiLog4').innerHTML = '进度: 0/' + total; document.getElementById('aiLog4').style.opacity = '0.8';

      processNextInQueue(0);
    }

    function processNextInQueue(index) {
      if (multiImageAborted) return;
      if (index >= multiImageQueue.length) {
        finishMultiImageOCR();
        return;
      }

      var file = multiImageQueue[index];
      var total = multiImageQueue.length;
      var current = index + 1;

      if (document.getElementById('aiScanStatus')) {
        document.getElementById('aiScanStatus').innerHTML = '正在识别 第 ' + current + '/' + total + ' 张: ' + esc(file.name);
      }
      if (document.getElementById('aiLog2')) {
        document.getElementById('aiLog2').innerHTML = '处理中: ' + esc(file.name) + ' (' + current + '/' + total + ')';
        document.getElementById('aiLog2').style.opacity = '1';
      }
      if (document.getElementById('aiLog4')) {
        document.getElementById('aiLog4').innerHTML = '进度: ' + current + '/' + total;
        document.getElementById('aiLog4').style.opacity = '1';
      }

      processSingleImageLocal(file, function(err, contacts) {
        if (err) {
          if (document.getElementById('aiLog3')) {
            document.getElementById('aiLog3').innerHTML = '' + esc(file.name) + ' 本地识别失败: ' + err.message + '，继续下一张...';
            document.getElementById('aiLog3').style.opacity = '1';
          }
        } else {
          if (document.getElementById('aiLog3')) {
            document.getElementById('aiLog3').innerHTML = '' + esc(file.name) + ' 本地识别完成 (' + contacts.length + ' 个联系人)';
            document.getElementById('aiLog3').style.opacity = '1';
          }
          multiImageResults = multiImageResults.concat(contacts);
        }
        
        if (index + 1 < multiImageQueue.length) {
          if (document.getElementById('aiLog3')) {
            document.getElementById('aiLog3').innerHTML = '触发防并发排队保护，等待1秒后处理下一张...';
          }
          setTimeout(function() {
            processNextInQueue(index + 1);
          }, 1000);
        } else {
          processNextInQueue(index + 1);
        }
      });
    }

    var _tesseractWorker = null;
    var _tesseractReady = false;

    function getTesseractWorker(callback) {
      if (_tesseractWorker && _tesseractReady) {
        callback(null, _tesseractWorker);
        return;
      }
      if (_tesseractWorker && !_tesseractReady) {
        // Worker is being initialized, poll
        var start = Date.now();
        var check = setInterval(function() {
          if (_tesseractReady) {
            clearInterval(check);
            callback(null, _tesseractWorker);
          } else if (Date.now() - start > 30000) {
            clearInterval(check);
            callback(new Error('Tesseract worker init timeout'), null);
          }
        }, 200);
        return;
      }

      if (typeof Tesseract === 'undefined') {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js')
          .then(function() { createAndInitWorker(callback); })
          .catch(function(err) { callback(err, null); });
      } else {
        createAndInitWorker(callback);
      }
    }

    function createAndInitWorker(callback) {
      Tesseract.createWorker({
        workerPath: window.location.origin + '/tessdata/worker.min.js',
        corePath: window.location.origin + '/tessdata/core',
        langPath: window.location.origin + '/tessdata'
      }).then(function(worker) {
        _tesseractWorker = worker;
        return Promise.resolve(worker.load())
          .then(function() { return Promise.resolve(worker.loadLanguage('chi_sim+eng')); })
          .then(function() { return Promise.resolve(worker.initialize('chi_sim+eng')); })
          .then(function() {
            return Promise.resolve(worker.setParameters({
              tessedit_pageseg_mode: '6'
            }));
          })
          .then(function() {
            _tesseractReady = true;
            callback(null, worker);
          });
      }).catch(function(err) {
        _tesseractWorker = null;
        callback(err, null);
      });
    }

    function processSingleImageLocal(file, callback) {
      // Create a fresh worker for each image to avoid stale worker state issues
      function createFreshWorker(imageSource) {
        if (typeof Tesseract === 'undefined') {
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js')
            .then(function() { doCreate(imageSource); })
            .catch(function(err) { callback(err, []); });
        } else {
          doCreate(imageSource);
        }
      }

      function doCreate(imageSource) {
        Tesseract.createWorker({
          workerPath: window.location.origin + '/tessdata/worker.min.js',
          corePath: window.location.origin + '/tessdata/core',
          langPath: window.location.origin + '/tessdata'
        }).then(function(worker) {
          return Promise.resolve(worker.load())
            .then(function() { return Promise.resolve(worker.loadLanguage('chi_sim+eng')); })
            .then(function() { return Promise.resolve(worker.initialize('chi_sim+eng')); })
            .then(function() { return Promise.resolve(worker.setParameters({ tessedit_pageseg_mode: '6' })); })
            .then(function() { return Promise.resolve(worker.recognize(imageSource)); })
            .then(function(result) {
              try { worker.terminate(); } catch(e) {}
              return result;
            })
            .catch(function(err) {
              try { worker.terminate(); } catch(e) {}
              throw err;
            });
        }).then(function(result) {
          var text = result.data.text;
          correctOcrTextWithAI(text, typeof file === 'string' ? 'image_data' : (file.name || 'image_ocr'), function(contacts) {
            callback(null, contacts);
          });
        }).catch(function(err) {
          console.error('[MultiImg] OCR worker failed:', err.message);
          callback(err, []);
        });
      }

      function runOcr(imageSource) {
        createFreshWorker(imageSource);
      }

      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        ctx.drawImage(img, 0, 0);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
          var r = data[i], g = data[i+1], b = data[i+2];
          if (b > r + 30 && b > g + 10 && r < 180) {
            data[i] = 255; data[i+1] = 255; data[i+2] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        runOcr(canvas.toDataURL('image/png'));
      };
      img.onerror = function() { runOcr(file); };

      if (typeof file === 'string') {
        img.src = file;
      } else {
        var reader = new FileReader();
        reader.onload = function(e) { img.src = e.target.result; };
        reader.onerror = function() { runOcr(file); };
        reader.readAsDataURL(file);
      }
    }

    function doTesseractLocal(file, callback) {
      processSingleImageLocal(file, callback);
    }

    function finishMultiImageOCR() {
      var total = multiImageQueue.length;
      if (document.getElementById('aiScanStatus')) {
        document.getElementById('aiScanStatus').innerHTML = '多图排队识别完成 · 共 ' + total + ' 张图片';
      }
      if (document.getElementById('aiLog2')) {
        document.getElementById('aiLog2').innerHTML = '� 全部处理完毕';
        document.getElementById('aiLog2').style.opacity = '1';
      }
      if (document.getElementById('aiLog4')) {
        document.getElementById('aiLog4').innerHTML = '合计识别: ' + multiImageResults.length + ' 个联系人';
        document.getElementById('aiLog4').style.opacity = '1';
      }

      // Deduplicate by phone
      var seenPhones = {};
      var deduped = [];
      multiImageResults.forEach(function(c) {
        if (!seenPhones[c.phone]) {
          seenPhones[c.phone] = true;
          deduped.push(c);
        }
      });

      setTimeout(function() {
        renderAIUnstructuredReport(multiImageQueue.length + ' 张图片', deduped);
      }, 600);
    }

    function handleImageOCR(file) {
      tempOcrEngine = 'local_tesseract';
      runLocalTableSlicingOCR(file);
    }

    function runLocalTableSlicingOCR(file) {
      tempOcrFile = file;
      tempOcrPdf = null;
      tempOcrFileName = file.name;
      tempOcrEngine = 'local_tesseract';
      
      var reader = new FileReader();
      reader.onload = function(e) {
        tempOcrImgDataUrl = e.target.result;
        showOcrSlicingPreview(tempOcrImgDataUrl);
      };
      reader.readAsDataURL(file);
    }



    function runTesseractOCR(file) {
      document.getElementById('aiScanStatus').innerHTML = 'AI 正在载入视觉 OCR 引擎...';
      if (document.getElementById('aiLog1')) {
        document.getElementById('aiLog1').innerHTML = '正在加载 tesseract.js 视觉分析库...';
        document.getElementById('aiLog1').style.opacity = '1';
      }

      loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js')
        .then(function() {
          if (document.getElementById('aiLog2')) {
            document.getElementById('aiLog2').innerHTML = '视觉神经网络就绪';
            document.getElementById('aiLog2').style.opacity = '1';
          }
          document.getElementById('aiScanStatus').innerHTML = '正在下载中英文语言模型包...';

          if (document.getElementById('aiLog3')) {
            document.getElementById('aiLog3').innerHTML = '正在从 CDN 获取高精 chi_sim+eng 模型...';
            document.getElementById('aiLog3').style.opacity = '1';
          }

          Tesseract.createWorker({
            workerPath: window.location.origin + '/tessdata/worker.min.js',
            corePath: window.location.origin + '/tessdata/core',
            langPath: window.location.origin + '/tessdata',
            logger: function(m) {
              if (m.status === 'recognizing text') {
                var pct = Math.round(m.progress * 100);
                document.getElementById('aiScanStatus').innerHTML = '图像文字 AI 深度识别中：' + pct + '%';
                if (document.getElementById('aiLog3')) {
                  document.getElementById('aiLog3').innerHTML = '模型载入成功，识别进行中...';
                }
                if (document.getElementById('aiLog4')) {
                  document.getElementById('aiLog4').innerHTML = 'OCR 进度:' + pct + '%';
                  document.getElementById('aiLog4').style.opacity = '1';
                }
              } else if (m.status === 'loading chi_sim.traineddata' || m.status === 'loading eng.traineddata') {
                var loadPct = m.progress ? ' (' + Math.round(m.progress * 100) + '%)' : '';
                document.getElementById('aiScanStatus').innerHTML = '正在载入语言模型包' + loadPct + '...';
              }
            }
          }).then(function(worker) {
            return Promise.resolve(worker.load())
              .then(function() { return Promise.resolve(worker.loadLanguage('chi_sim+eng')); })
              .then(function() { return Promise.resolve(worker.initialize('chi_sim+eng')); })
              .then(function() {
                return Promise.resolve(worker.setParameters({
                  tessedit_pageseg_mode: '6'
                }));
              })
              .then(function() { return Promise.resolve(worker.recognize(file)); })
              .then(function(result) {
                try { worker.terminate(); } catch(e) {}
                return result;
              })
              .catch(function(err) {
                try { worker.terminate(); } catch(e) {}
                throw err;
              });
          }).then(function(result) {
            if (document.getElementById('aiLog4')) {
              document.getElementById('aiLog4').innerHTML = '图像文字识别与神经特征映射完毕';
            }
            var text = result.data.text;
            correctOcrTextWithAI(text, file.name, function(contacts) {
              renderAIUnstructuredReport(file.name, contacts);
            });
          }).catch(function(err) {
            alert('本地 OCR 识别失败：' + (err.message || err));
            resetAIImporterUI();
          });
        })
        .catch(function(err) {
          alert('OCR 引擎加载失败：' + err.message);
          resetAIImporterUI();
        });
    }

    function handleTxtImport(file) {
      tempOcrEngine = 'text_fallback';
      showAIScanningUI(file.name);
      document.getElementById('aiScanStatus').innerHTML = '� 正在读取文本文档...';
      if (document.getElementById('aiLog1')) {
        document.getElementById('aiLog1').innerHTML = '文件读取通道建立';
        document.getElementById('aiLog1').style.opacity = '1';
      }
      
      var reader = new FileReader();
      reader.onload = function(e) {
        if (document.getElementById('aiLog2')) {
          document.getElementById('aiLog2').innerHTML = '文档原始二进制流读取成功';
          document.getElementById('aiLog2').style.opacity = '1';
        }
        var text = e.target.result;
        if (document.getElementById('aiLog3')) {
          document.getElementById('aiLog3').innerHTML = 'UTF-8 编码文本清洗完毕';
          document.getElementById('aiLog3').style.opacity = '1';
        }
        if (document.getElementById('aiLog4')) {
          document.getElementById('aiLog4').innerHTML = 'AI 正在运行特征分析提取模型...';
          document.getElementById('aiLog4').style.opacity = '1';
        }
        setTimeout(function() {
          correctOcrTextWithAI(text, file.name, function(contacts) {
            renderAIUnstructuredReport(file.name, contacts);
          });
        }, 600);
      };
      reader.readAsText(file, 'utf-8');
    }

    function renderAIUnstructuredReport(fileName, contacts) {
      // Snapshot original contacts BEFORE user edits (for training feedback)
      tempOcrOriginalContacts = JSON.parse(JSON.stringify(contacts));
      tempOcrFileName = fileName;
      if (!tempOcrEngine) tempOcrEngine = 'text_fallback'; // Default if not set by caller
      tempUnstructuredContacts = contacts;
      tempImportType = 'unstructured';
      tempImportData = contacts;
      
      if (!contacts || contacts.length === 0) {
        if (typeof showCopyLimitToast === 'function') {
          showCopyLimitToast('识别完成，但未提取到有效联系人', true);
        }
        resetAIImporterUI();
        updateDashboardVisibility(true);
        return;
      }

      var el;
      el = document.getElementById('aiImportInit'); if (el) el.style.display = 'none';
      el = document.getElementById('localOcrConfigPanel'); if (el) el.style.display = 'none';
      el = document.getElementById('aiImportScanning'); if (el) el.style.display = 'none';
      el = document.getElementById('aiLaserLine'); if (el) el.style.display = 'none';

      el = document.getElementById('aiExcelMappingPills'); if (el) el.style.display = 'none';
      el = document.getElementById('aiExcelMappingControls'); if (el) el.style.display = 'none';
      el = document.getElementById('aiExcelPreviewContainer'); if (el) el.style.display = 'none';

      var unstContainer = document.getElementById('aiUnstructuredContainer');
      if (unstContainer) unstContainer.style.display = 'block';

      var dz = document.getElementById('dropZone');
      if (dz) {
        dz.style.minHeight = 'auto';
        dz.style.padding = '8px';
      }

      el = document.getElementById('aiReportTitle');
      if (el) el.innerHTML = 'AI 提取报告: ' + esc(fileName);

      var conf = contacts.length > 0 ? 98.0 : 0.0;
      el = document.getElementById('aiConfidenceBadge');
      if (el) el.innerHTML = '● AI 识别率: ' + conf.toFixed(1) + '%';

      renderUnstructuredTableRows();

      el = document.getElementById('aiImportReport');
      if (el) el.style.display = 'flex';
    }

    function renderUnstructuredTableRows() {
      var tbody = document.querySelector('#aiUnstructuredTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      
      if (tempUnstructuredContacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-light);">未识别到任何带号码的联系人数据</td></tr>';
        document.getElementById('aiConfirmImportBtn').innerHTML = '无数据可导入';
        document.getElementById('aiConfirmImportBtn').disabled = true;
        return;
      }
      
      document.getElementById('aiConfirmImportBtn').disabled = false;
      document.getElementById('aiConfirmImportBtn').innerHTML = '确认导入 (' + tempUnstructuredContacts.length + ' 位联系人)';
      
      tempUnstructuredContacts.forEach(function(c, index) {
        var tr = document.createElement('tr');
        tr.style.borderBottom = '0.5px solid var(--card-border)';
        
        var tdDel = document.createElement('td');
        tdDel.style.padding = '4px 6px';
        tdDel.style.textAlign = 'center';
        var delBtn = document.createElement('button');
        delBtn.innerHTML = '删除';
        delBtn.style.background = 'transparent';
        delBtn.style.border = 'none';
        delBtn.style.cursor = 'pointer';
        delBtn.style.fontSize = '0.75rem';
        delBtn.addEventListener('click', function() {
          tempUnstructuredContacts.splice(index, 1);
          renderUnstructuredTableRows();
        });
        tdDel.appendChild(delBtn);
        
        var tdName = document.createElement('td');
        tdName.style.padding = '4px 6px';
        tdName.style.fontWeight = '800';
        tdName.style.color = 'var(--text-main)';
        tdName.contentEditable = 'true';
        tdName.textContent = c.name;
        tdName.addEventListener('blur', function() {
          tempUnstructuredContacts[index].name = this.textContent.trim();
        });
        
        var tdPhone = document.createElement('td');
        tdPhone.style.padding = '4px 6px';
        tdPhone.style.fontFamily = 'monospace';
        tdPhone.style.color = 'var(--accent-wechat)';
        tdPhone.style.fontWeight = '800';
        tdPhone.contentEditable = 'true';
        tdPhone.textContent = c.phone;
        tdPhone.addEventListener('blur', function() {
          var val = this.textContent.trim().replace(/[-\\s]/g, '');
          tempUnstructuredContacts[index].phone = val;
        });
        
        var tdComp = document.createElement('td');
        tdComp.style.padding = '4px 6px';
        tdComp.style.color = '#4a6cf7';
        tdComp.contentEditable = 'true';
        tdComp.textContent = c.company;
        tdComp.addEventListener('blur', function() {
          tempUnstructuredContacts[index].company = this.textContent.trim();
        });
        
        var tdNote = document.createElement('td');
        tdNote.style.padding = '4px 6px';
        tdNote.style.color = 'var(--text-soft)';
        tdNote.contentEditable = 'true';
        tdNote.textContent = c.note;
        tdNote.addEventListener('blur', function() {
          tempUnstructuredContacts[index].note = this.textContent.trim();
        });
        
        tr.appendChild(tdDel);
        tr.appendChild(tdName);
        tr.appendChild(tdPhone);
        tr.appendChild(tdComp);
        tr.appendChild(tdNote);
        tbody.appendChild(tr);
      });
    }

    function saveOcrCorrection() {
      // Save OCR correction as training data (non-blocking)
      var corrected = tempUnstructuredContacts;
      if (!tempOcrOriginalContacts || tempOcrOriginalContacts.length === 0) return;
      if (!corrected || corrected.length === 0) return;

      // Check if anything actually changed
      var hasChanges = JSON.stringify(tempOcrOriginalContacts) !== JSON.stringify(corrected);
      if (!hasChanges) return;

      fetch('/api/ocr/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: tempOcrRawText || '',
          originalContacts: tempOcrOriginalContacts,
          correctedContacts: corrected,
          sourceFile: tempOcrFileName || '',
          ocrPipeline: tempOcrEngine || 'ai_vision',
          ocrMode: 'bulk',
          metadata: {
            batchLabel: (document.getElementById('batchLabelInput') || {}).value || ''
          }
        })
      }).then(function() {
        // Refresh count badge if visible
        fetchTrainingDataCount();
      }).catch(function(err) {
        console.error('Failed to save OCR correction:', err);
        // Non-blocking — don't interrupt import flow
      });
    }

    function executeAIImportUnstructured() {
      if (!tempUnstructuredContacts || tempUnstructuredContacts.length === 0) return;
      var batchLabel = (document.getElementById('batchLabelInput').value || '').trim();
      var defaultCat = document.getElementById('importCategorySelect') ? document.getElementById('importCategorySelect').value : '公海客户';
      // Tag each client with the batch label and category
      for (var i = 0; i < tempUnstructuredContacts.length; i++) {
        var c = tempUnstructuredContacts[i];
        c.batch_label = batchLabel;
        c.category = defaultCat;
        c.mobile = c.mobile || c.phone;
        c.phone = c.phone || c.mobile;
        if (!c.fund && /^d{4,5}$/.test((c.note || '').trim())) {
          c.fund = c.note.trim();
          c.note = '';
        }
      }
      // Append new contacts to existing ones instead of overwriting
      if (importedClients && importedClients.length >0) {
 importedClients = importedClients.concat(tempUnstructuredContacts);
 } else {
 importedClients = tempUnstructuredContacts;
 }
 saveState();
 updateDashboardVisibility(true);
 renderDialCards();

 // Auto-upload to Supabase
 uploadCustomersToSupabase(tempUnstructuredContacts, batchLabel);

 // Save OCR correction for training feedback loop (before reset clears state)
 saveOcrCorrection();

 resetAIImporterUI();
 }

 function initAIImporter() {
 var el;
 el = document.getElementById('aiToggleAdjustBtn');
 if (el) {
 el.addEventListener('click', function(e) {
 e.preventDefault();
 var ctrl = document.getElementById('aiAdjustControls');
 if (ctrl) {
 if (ctrl.style.display === 'none') {
 ctrl.style.display = 'grid';
 this.textContent = '收起手动修正配置 ▴';
 } else {
 ctrl.style.display = 'none';
 this.textContent = '手动修正 AI 映射结果 ▾';
 }
 }
 });
 }

 el = document.getElementById('aiSelName'); if (el) el.addEventListener('change', updateAIPreviewTable);
 el = document.getElementById('aiSelPhone'); if (el) el.addEventListener('change', updateAIPreviewTable);
 el = document.getElementById('aiSelCompany'); if (el) el.addEventListener('change', updateAIPreviewTable);
 el = document.getElementById('aiSelNote'); if (el) el.addEventListener('change', updateAIPreviewTable);

 el = document.getElementById('aiResetImportBtn');
 if (el) {
 el.addEventListener('click', function(e) {
 e.preventDefault();
 resetAIImporterUI();
 });
 }

 el = document.getElementById('aiConfirmImportBtn');
 if (el) {
 el.addEventListener('click', function(e) {
 e.preventDefault();
 if (tempImportType === 'xlsx') {
 executeAIImportExcel();
 } else if (tempImportType === 'vcf') {
 executeAIImportVcf();
 } else if (tempImportType === 'unstructured') {
 executeAIImportUnstructured();
 }
 });
 }

 // Text paste button: use AI correction
 var textExtractBtn = document.getElementById('textImportExtractBtn');
 if (textExtractBtn) {
 textExtractBtn.addEventListener('click', function() {
 var t = document.getElementById('textImportArea').value.trim();
 if (!t) { alert('请先粘贴文本'); return; }
 var btn = this;
 btn.disabled = true;
 btn.textContent = 'AI 修正中...';
 // Show scanning UI for visual feedback
 showAIScanningUI('文本粘贴识别');
 document.getElementById('aiScanStatus').innerHTML = '正在智能解析粘贴的文本...';
 document.getElementById('aiLog1').innerHTML = ' 正在分析文本格式与内容...';
 document.getElementById('aiLog1').style.opacity = '1';
 document.getElementById('textImportPanel').style.display = 'none';
 correctOcrTextWithAI(t, '文本粘贴', function(contacts) {
 btn.textContent = '智能识别提取';
 btn.disabled = false;
 if (contacts && contacts.length > 0) {
 window.renderAIUnstructuredReport('文本粘贴', contacts);
 } else {
 // Fallback to server-side extraction
 btn.textContent = '本地未检出，切换云端 AI...';
 document.getElementById('aiLog2').innerHTML = '本地引擎未检出，尝试云端 AI 识别...';
 document.getElementById('aiLog2').style.opacity = '1';
 fetch('/api/ocr/text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawText: t }) })
 .then(function(r) { return r.json(); })
 .then(function(d) {
 btn.textContent = '智能识别提取';
 btn.disabled = false;
 if (d.contacts && d.contacts.length > 0) {
 window.renderAIUnstructuredReport('云端文本解析', d.contacts);
 } else {
 resetAIImporterUI();
 document.getElementById('textImportPanel').style.display = 'flex';
 document.getElementById('textImportArea').value = t;
 alert('本地与云端 AI 均未识别到联系人，请确认文本包含有效手机号');
 }
 }).catch(function(e) {
 btn.textContent = '智能识别提取';
 btn.disabled = false;
 resetAIImporterUI();
 document.getElementById('textImportPanel').style.display = 'flex';
 document.getElementById('textImportArea').value = t;
 alert('识别失败: ' + e.message);
 });
 }
 });
 });
 }

 // Init OCR training data UI
 initOcrCorrectionUI();
 }

 // ====== OCR Training Data Review UI ======

 function initOcrCorrectionUI() {
 var btn = document.getElementById('ocrTrainingDataBtn');
 var modal = document.getElementById('ocrCorrectionModal');
 var closeBtn = document.getElementById('closeOcrCorrectionBtn');
 var exportBtn = document.getElementById('ocrExportJsonlBtn');
 var refreshBtn = document.getElementById('ocrRefreshCorrectionsBtn');
 var filterCheckbox = document.getElementById('ocrFilterEditsOnly');

 // Open modal
 if (btn && modal) {
 btn.addEventListener('click', function() {
 modal.classList.add('active');
 loadOcrCorrections();
 });
 }

 // Close modal
 if (closeBtn && modal) {
 closeBtn.addEventListener('click', function() { modal.classList.remove('active'); });
 modal.addEventListener('click', function(e) {
 if (e.target === modal) modal.classList.remove('active');
 });
 }

 // Export JSONL
 if (exportBtn) {
 exportBtn.addEventListener('click', function() {
 window.open('/api/ocr/corrections/export?limit=500', '_blank');
 });
 }

 // Refresh
 if (refreshBtn) {
 refreshBtn.addEventListener('click', loadOcrCorrections);
 }

 // Filter toggle
 if (filterCheckbox) {
 filterCheckbox.addEventListener('change', loadOcrCorrections);
 }

 // Initial count fetch
 fetchTrainingDataCount();
 }

 function loadOcrCorrections() {
 var container = document.getElementById('ocrCorrectionList');
 if (!container) return;
 container.innerHTML = '<div style="text-align:center;padding:24px;font-size:0.7rem;color:var(--text-light);">加载中...</div>';

      var minEdits = 0;
      var filterEl = document.getElementById('ocrFilterEditsOnly');
      if (filterEl && filterEl.checked) minEdits = 1;

      fetch('/api/ocr/corrections?page=1&pageSize=50&minEdits=' + minEdits + '&sort=newest')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.data || data.data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:28px;font-size:0.72rem;color:var(--text-light);"> 暂无记录<br><span style="font-size:0.58rem;">导入并修正联系人后，修正记录会自动收集</span></div>';
            return;
          }
          var countEl = document.getElementById('ocrCorrectionCount');
          if (countEl) countEl.textContent = data.total || 0;

          var html = '';
          data.data.forEach(function(c) {
            var origStr = JSON.stringify(c.original_json).substring(0, 120);
            var corrStr = JSON.stringify(c.corrected_json).substring(0, 120);
            var hasEdits = c.edit_count > 0;
            var borderColor = hasEdits ? 'var(--accent-wechat)' : 'var(--card-border)';
            var badgeColor = hasEdits ? '#07c160' : '#999';
            html += '<div style="border-left:3px solid ' + borderColor + '; border-bottom:0.5px solid var(--card-border); padding:6px 8px; background:var(--card-bg);">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.58rem;color:var(--text-light);">' +
                '<span style="font-weight:700;">' + esc(c.source_file || '未知文件') + '</span>' +
                '<span style="display:flex;align-items:center;gap:4px;">' +
                  '<span style="background:' + badgeColor + ';color:white;padding:0px 5px;border-radius:6px;font-size:0.52rem;font-weight:700;">' + c.edit_count + '处修改</span>' +
                  '<span>' + (c.created_at || '').slice(0,19).replace('T',' ') + '</span>' +
                '</span>' +
              '</div>' +
              '<div style="font-size:0.6rem; margin-top:3px; word-break:break-all; line-height:1.3;">' +
                '<span style="color:var(--text-soft);">原始: </span><span style="color:#999;">' + esc(origStr) + '</span><br>' +
                '<span style="color:var(--text-soft);">修正: </span><span style="color:' + (hasEdits ? 'var(--accent-wechat)' : 'var(--text-main)') + ';">' + esc(corrStr) + '</span>' +
              '</div>' +
              '<div style="font-size:0.55rem; color:var(--text-light); margin-top:2px;">' + esc(c.ocr_pipeline || 'unknown') + ' · ' + esc(c.ocr_mode || 'bulk') + '</div>' +
            '</div>';
          });
          container.innerHTML = html;
        })
        .catch(function(err) {
          container.innerHTML = '<div style="text-align:center;padding:24px;font-size:0.7rem;color:#e74c3c;">加载失败: ' + esc(err.message) + '</div>';
        });
    }

    function fetchTrainingDataCount() {
      fetch('/api/ocr/corrections/stats')
        .then(function(r) { return r.json(); })
        .then(function(stats) {
          var badge = document.getElementById('trainingCountBadge');
          var countEl = document.getElementById('ocrCorrectionCount');
          var countBadge = document.getElementById('ocrCorrectionBadge');
          if (badge) badge.textContent = stats.count || 0;
          if (countEl) countEl.textContent = stats.count || 0;
          if (countBadge) {
            countBadge.style.display = (stats.count > 0) ? 'inline' : 'none';
          }
        })
        .catch(function() {});
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
            alert('导入失败：表格无数据');
            return;
          }

          showAIScanningUI(file.name);

          // Deep AI Scanning trigger
          setTimeout(function() {
            var detected = runAIColumnMapping(json);
            renderAIReportForExcel(json, detected);
          }, 1200);

        } catch(err) {
          alert('解析失败：' + err.message);
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
            alert('未找到联系人，请确认是有效的 .vcf 文件');
            return;
          }
          
          showAIScanningUI(file.name);

          var list = [];
          var phoneSet = new Set();
          for (var bi = 0; bi < blocks.length; bi++) {
            var blk = blocks[bi];
            var name = '';
            var mQP = blk.match(/FN[^:]*QUOTED-PRINTABLE[^:]*:([^\\r\\n]+)/i);
            var mU8 = blk.match(/FN;CHARSET=UTF-8:([^\\r\\n]+)/i);
            var mFN = blk.match(/FN:([^\\r\\n]+)/i);
            if (mQP) { name = decodeQPUtf8(mQP[1]).trim(); }
            else if (mU8) { name = mU8[1].trim(); }
            else if (mFN) { name = mFN[1].trim(); }
            
            var company = '';
            var mOQ = blk.match(/ORG[^:]*QUOTED-PRINTABLE[^:]*:([^\\r\\n]+)/i);
            var mOP = blk.match(/ORG[^:;]*:([^\\r\\n]+)/i);
            if (mOQ) { company = decodeQPUtf8(mOQ[1]).trim(); }
            else if (mOP) { company = mOP[1].trim(); }

            var note = '';
            var mNQ = blk.match(/NOTE[^:]*QUOTED-PRINTABLE[^:]*:([^\\r\\n]+)/i);
            var mNU = blk.match(/NOTE;CHARSET=UTF-8:([^\\r\\n]+)/i);
            var mNP = blk.match(/NOTE[^:;]*:([^\\r\\n]+)/i);
            if (mNQ) { note = decodeQPUtf8(mNQ[1]).trim(); }
            else if (mNU) { note = mNU[1].trim(); }
            else if (mNP) { note = mNP[1].trim(); }

            var telLines = blk.match(/TEL[^:]*:([^\\r\\n]+)/gi) || [];
            for (var ti = 0; ti < telLines.length; ti++) {
              var ci = telLines[ti].indexOf(':');
              if (ci < 0) continue;
              var phone = telLines[ti].slice(ci+1).trim().replace(/[^\\d+]/g, '');
              if (!phone) continue;
              if (phoneSet.has(phone)) break;
              phoneSet.add(phone);
              var fundVal = '';
              if (/^d{4,5}$/.test(note)) {
                fundVal = note;
                note = '';
              }
              list.push({ name: name || '未知姓名', phone: phone, company: company, note: note, fund: fundVal, dialedStatus: 'todo', duration: '', callNote: '' });
              break;
            }
          }
          
          if (!list.length) {
            alert('未找到含电话的联系人');
            resetAIImporterUI();
            return;
          }

          // Deep AI Scanning trigger
          setTimeout(function() {
            renderAIReportForVcf(list);
          }, 1200);

        } catch(err) {
          alert('VCF 解析失败：' + err.message);
          resetAIImporterUI();
        }
      };
      reader.readAsText(file, 'utf-8');
    }

    // Fuzzy/partial match whitelist company
    function matchWhitelistCompany(company) {
      if (!company) return null;
      var key = String(company).trim().toLowerCase();
      if (!key) return null;
      if (!whitelistCompanies || whitelistCompanies.length === 0) return null;
      
      // 1. Try exact match first
      for (var i = 0; i < whitelistCompanies.length; i++) {
        var w = whitelistCompanies[i];
        if (w.status === '已失效' || w.status === '已删除') continue;
        var name = (w.company_name || '').trim().toLowerCase();
        var alias = (w.alias || '').trim().toLowerCase();
        if (name === key || (alias && alias === key)) {
          return w;
        }
      }
      
      // 2. Try partial/fuzzy match (excluding common prefixes/suffixes)
      var cleanCard = key.replace(/(有限公司|有限责任公司|公司|集团|深圳市|广州市|北京市|上海市|深圳|广州|北京|上海)/g, '').trim();
      if (cleanCard.length >= 2) {
        for (var i = 0; i < whitelistCompanies.length; i++) {
          var w = whitelistCompanies[i];
          if (w.status === '已失效' || w.status === '已删除') continue;
          var name = (w.company_name || '').trim().toLowerCase();
          var alias = (w.alias || '').trim().toLowerCase();
          
          var cleanName = name.replace(/(有限公司|有限责任公司|公司|集团|深圳市|广州市|北京市|上海市|深圳|广州|北京|上海)/g, '').trim();
          if (cleanName.length >= 2 && (cleanCard.indexOf(cleanName) !== -1 || cleanName.indexOf(cleanCard) !== -1)) {
            return w;
          }
          if (alias) {
            var cleanAlias = alias.replace(/(有限公司|有限责任公司|公司|集团|深圳市|广州市|北京市|上海市|深圳|广州|北京|上海)/g, '').trim();
            if (cleanAlias.length >= 2 && (cleanCard.indexOf(cleanAlias) !== -1 || cleanAlias.indexOf(cleanCard) !== -1)) {
              return w;
            }
          }
        }
      }
      return null;
    }

    // Render client list
    function renderDialCards() {
      var container = document.getElementById('cardsContainer');
      if (!container) return;
      
      updateStats();

      if (importedClients.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:80px 20px;"></div>';
        return;
      }

      var query = document.getElementById('searchInput').value.toLowerCase().trim();
      var wlFilter = document.getElementById('whitelistFilterSelect') ? document.getElementById('whitelistFilterSelect').value : 'all';

      var filtered = importedClients.filter(function(c) {
        var matchFilter = (currentFilter === 'all') || (c.dialedStatus === currentFilter);
        
        var matchedWl = matchWhitelistCompany(c.company);
        var isCompanyInWhitelist = matchedWl ? (matchedWl.status !== '已失效' && matchedWl.status !== '已删除') : false;

        // Whitelist dropdown filter
        var matchWlFilter = true;
        if (wlFilter === 'yes') {
          matchWlFilter = isCompanyInWhitelist;
        } else if (wlFilter === 'no') {
          matchWlFilter = !isCompanyInWhitelist;
        }

        var matchQuery = true;
        if (query) {
          var isWlSearch = (query === '白名单' || query === '是白名单' || query === 'is:whitelist');
          var isNotWlSearch = (query === '非白名单' || query === '否白名单' || query === 'is:not-whitelist');
          
          if (isWlSearch) {
            matchQuery = isCompanyInWhitelist;
          } else if (isNotWlSearch) {
            matchQuery = !isCompanyInWhitelist;
          } else {
            matchQuery = c.name.toLowerCase().includes(query) || 
                         (c.phone || c.mobile || '').toLowerCase().includes(query) || 
                         c.company.toLowerCase().includes(query);
          }
        }
        return matchFilter && matchWlFilter && matchQuery;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.8rem;">无匹配此筛选条件的联系人</div>';
        return;
      }

      // Apply Sorting
      var sorted = filtered.slice();
      if (currentSort === 'name') {
        sorted.sort(function(a, b) {
          return String(a.name || '').localeCompare(String(b.name || ''), 'zh');
        });
      } else if (currentSort === 'company') {
        sorted.sort(function(a, b) {
          return String(a.company || '').localeCompare(String(b.company || ''), 'zh');
        });
      } else if (currentSort === 'todo') {
        sorted.sort(function(a, b) {
          var aTodo = (!a.dialedStatus || a.dialedStatus === 'todo') ? 0 : 1;
          var bTodo = (!b.dialedStatus || b.dialedStatus === 'todo') ? 0 : 1;
          return aTodo - bTodo;
        });
      } else if (currentSort === 'dialed') {
        sorted.sort(function(a, b) {
          var aDialed = (a.dialedStatus === 'success' || a.dialedStatus === 'failed') ? 0 : 1;
          var bDialed = (b.dialedStatus === 'success' || b.dialedStatus === 'failed') ? 0 : 1;
          return aDialed - bDialed;
        });
      } else if (currentSort === 'shuffle') {
        // Fisher-Yates shuffle for true random order
        for (var si = sorted.length - 1; si > 0; si--) {
          var sj = Math.floor(Math.random() * (si + 1));
          var tmp = sorted[si];
          sorted[si] = sorted[sj];
          sorted[sj] = tmp;
        }
      }

      // 无分页 — 直接展示全部客户
      var total = sorted.length;

      if (isMobileDevice) {
        // Mobile View: Render Cards (resembling older versions)
        var cardsHtml = sorted.map(function(c) {
          var i = importedClients.indexOf(c);

          var badgeHtml = '<span class="xls-dial-badge xls-dial-badge-todo">待拨打</span>';
          var cardClass = 'xls-dial-card';
          var phoneVal = c.phone || c.mobile || '';
          if (c.dialedStatus === 'success') {
            badgeHtml = '<span class="xls-dial-badge xls-dial-badge-success">已接通 (' + (c.duration || '00:00') + ')</span>';
            cardClass += ' dialed';
            if (phoneVal) {
              badgeHtml += ' <button class="rec-play-btn" data-phone="' + esc(phoneVal) + '" title="播放通话录音" style="font-size:0.6rem;padding:1px 6px;border:1px solid #07c160;background:rgba(7,193,96,0.08);color:#07c160;border-radius:3px;cursor:pointer;font-weight:700;margin-left:4px;" onclick="event.stopPropagation();var p=this.dataset.phone;var a=document.createElement(\\x27audio\\x27);a.controls=true;a.style.width=\\x27100%\\x27;a.style.height=\\x2728px\\x27;a.style.marginTop=\\x274px\\x27;var w=this.nextElementSibling;if(w&&w.classList.contains(\\x27rec-audio-wrap\\x27)){w.remove();return;}var d=document.createElement(\\x27div\\x27);d.className=\\x27rec-audio-wrap\\x27;d.style.width=\\x27100%\\x27;d.appendChild(a);this.parentElement.appendChild(d);a.src=\\x27/api/local-recording?phone=\\x27+encodeURIComponent(p);a.play().catch(function(){});">录音</button>';
            }
          } else if (c.dialedStatus === 'failed') {
            badgeHtml = '<span class="xls-dial-badge xls-dial-badge-failed">未接通</span>';
            cardClass += ' dialed';
            if (phoneVal) {
              badgeHtml += ' <button class="rec-play-btn" data-phone="' + esc(phoneVal) + '" title="播放通话录音" style="font-size:0.6rem;padding:1px 6px;border:1px solid #e67e22;background:rgba(245,124,0,0.08);color:#e67e22;border-radius:3px;cursor:pointer;font-weight:700;margin-left:4px;" onclick="event.stopPropagation();var p=this.dataset.phone;var a=document.createElement(\\x27audio\\x27);a.controls=true;a.style.width=\\x27100%\\x27;a.style.height=\\x2728px\\x27;a.style.marginTop=\\x274px\\x27;var w=this.nextElementSibling;if(w&&w.classList.contains(\\x27rec-audio-wrap\\x27)){w.remove();return;}var d=document.createElement(\\x27div\\x27);d.className=\\x27rec-audio-wrap\\x27;d.style.width=\\x27100%\\x27;d.appendChild(a);this.parentElement.appendChild(d);a.src=\\x27/api/local-recording?phone=\\x27+encodeURIComponent(p);a.play().catch(function(){});">录音</button>';
            }
          }

          var phoneClass = c.copied ? 'client-phone-btn copied' : 'client-phone-btn';

          return '<div class="' + cardClass + '" id="xdc_' + i + '">' +
            '<div class="client-card-top">' +
              '<div class="client-card-primary" style="display: flex; align-items: center; width: 100%; gap: 6px;">' +
                '<span class="client-card-name-btn" data-name="' + esc(c.name) + '" data-idx="' + i + '" title="点击复制姓名" style="flex: 0 0 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block;">' + esc(c.name) + '</span>' +
                '<span class="client-card-phone-wrap" style="flex: 0 0 110px; display: inline-flex; align-items: center;">' +
                  '<span class="' + phoneClass + '" data-phone="' + esc(phoneVal) + '" data-idx="' + i + '" title="点击复制号码" style="font-size: 0.82rem;">' + esc(c.copied ? maskPhone(phoneVal) : phoneVal) + '</span>' +
                '</span>' +
                '<div style="margin-left: auto; display: inline-flex; align-items: center; justify-content: flex-end; flex-shrink: 0;">' +
                  badgeHtml +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="client-card-tags" style="margin-top: 2px;">' +
              (c.company ? '<span class="client-card-tag client-card-tag-company" data-company="' + esc(c.company) + '" data-idx="' + i + '" title="点击复制单位名称">' + esc(c.company) + '</span>' : '') +
              (displayBatchLabel(c.batch_label) ? '<span class="client-card-tag" style="background:rgba(74,108,247,0.08);color:#4a6cf7;font-weight:700;" title="导入批次">' + esc(c.batch_label) + '</span>' : '') +
              (c.fund ? '<span class="client-card-tag crm-fund-tag" style="background:rgba(255,152,0,0.08);color:#f57c00;font-weight:700;" title="公积金">公积金: ' + esc(c.fund) + '</span>' : '') +
              (function() {
                var customHtml = '';
                if (c.custom && typeof c.custom === 'object') {
                  for (var key in c.custom) {
                    if (c.custom.hasOwnProperty(key) && c.custom[key]) {
                      customHtml += '<span class="client-card-tag" style="background:rgba(0,188,212,0.08);color:#0097a7;font-weight:700;" title="' + esc(key) + '">' + esc(key) + ': ' + esc(c.custom[key]) + '</span>';
                    }
                  }
                }
                return customHtml;
              })() +
              (function() {
                if (!c.company) return '';
                var matchedWl = matchWhitelistCompany(c.company);
                if (matchedWl) {
                  var bank = matchedWl.bank_name || '建行建易贷';
                  return '<span class="client-card-tag xls-dial-badge-whitelist">' + esc(bank) + '</span>';
                }
                return '';
              })() +
            '</div>' +
            (c.note ? 
              '<div class="client-card-body" style="margin-top: 4px;">' +
                '<div class="client-card-content-block follow-up" style="background:rgba(74,108,247,0.03); border-left:3px solid #4a6cf7; padding: 6px 8px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">' +
                  '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">' +
                    '<span class="client-card-label" style="color:#4a6cf7; font-weight:800; font-size:0.65rem;">资料备注</span>' +
                    '<span class="client-card-tag-note" data-note="' + esc(c.note) + '" style="font-size:0.6rem; color:#4a6cf7; cursor:pointer; text-decoration:underline;">[放大查看]</span>' +
                  '</div>' +
                  '<span class="client-card-text" style="color:var(--text-soft); white-space:pre-wrap; display:block; margin-top:2px;">' + esc(c.note) + '</span>' +
                '</div>' +
              '</div>' : '') +
            (c.callNote ? 
              '<div class="client-card-body" style="margin-top: 4px;">' +
                '<div class="client-card-content-block follow-up">' +
                  '<span class="client-card-label">通话小记</span>' +
                  '<span class="client-card-text" style="color:var(--accent-wechat);">' + esc(c.callNote) + '</span>' +
                '</div>' +
              '</div>' : '') +
            (c.last_operation ?
              '<div class="client-card-body" style="margin-top: 4px;">' +
                '<div class="client-card-content-block" style="background:rgba(255,193,7,0.05); border-left:3px solid #ffc107; padding: 6px 8px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">' +
                  '<span class="client-card-label" style="color:#f57c00; font-weight:800; font-size:0.52rem;">最近操作</span>' +
                  '<span class="client-card-text" style="color:var(--text-soft); display:block; margin-top:2px; font-size:0.5rem;">' +
                    TimelineDisplay.render(c.last_operation) +
                  '</span>' +
                '</div>' +
              '</div>' : '') +
            (typeof AndroidDialer !== 'undefined' && AndroidDialer.hasRecording(phoneVal) ?
              '<div class="client-card-body" style="margin-top: 4px;">' +
                '<div class="client-card-content-block" style="background:rgba(9,187,7,0.03); border-left:3px solid var(--accent-wechat); padding: 6px 8px; border-radius: 0 var(--radius-xs) var(--radius-xs) 0;">' +
                  '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">' +
                    '<span class="client-card-label" style="color:var(--accent-wechat); font-weight:800; font-size:0.65rem;">通话录音</span>' +
                    '<span style="font-size:0.6rem; color:var(--accent-wechat); font-weight:bold;">[本地录音就绪]</span>' +
                  '</div>' +
                  '<audio src="/api/local-recording?phone=' + encodeURIComponent(phoneVal) + '" controls style="width: 100%; height: 32px; outline: none; margin-top: 4px; display: block;"></audio>' +
                '</div>' +
              '</div>' : '') +
            '<div class="client-card-actions">' +
              '<a href="tel:' + esc(phoneVal) + '" class="btn-primary xls-card-dial-btn" data-idx="' + i + '" style="font-size:0.75rem;padding:2px 12px;height:28px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">拨打</a>' +
            '</div>' +
          '</div>';
        }).join('');

        container.innerHTML = cardsHtml;

        // Wire up card phone click copy + WeChat jump
        container.querySelectorAll('.client-phone-btn').forEach(function(b) {
          b.addEventListener('click', function(e) {
            e.stopPropagation();
            var phone = b.dataset.phone;
            var idx = parseInt(b.dataset.idx);

            var limit = checkCopyLimit();
            if (!limit.allowed) {
              showCopyLimitToast(limit.message, false);
              return;
            }
            copyTextToClipboard(phone);
            recordTimeline(phone, 'copy_phone');
            var oldText = b.textContent;
            if (oldText === '已复制，正在打开微信...') return;
            b.textContent = '已复制，正在打开微信...';
            var oldColor = b.style.color;
            b.style.color = 'var(--accent-wechat)';
            var client = importedClients[idx];
            if (client) {
              client.copied = true;
              saveState();
            }
            b.classList.add('copied');

            setTimeout(function() {
              jumpToWechat();
            }, 100);

            setTimeout(function() {
              b.textContent = maskPhone(phone);
              b.style.color = oldColor;
            }, 1500);
          });
        });

        // Wire up name click copy
        container.querySelectorAll('.client-card-name-btn').forEach(function(b) {
          b.addEventListener('click', function(e) {
            e.stopPropagation();
            var name = b.dataset.name;
            var idx = parseInt(b.dataset.idx);

            var nameLimit = checkCopyLimit();
            if (!nameLimit.allowed) {
              showCopyLimitToast(nameLimit.message, false);
              return;
            }
            copyTextToClipboard(' ' + name + ' ');

            var client = importedClients[idx];
            if (client) recordTimeline(client.phone || client.mobile, 'copy_name');

            var oldText = b.textContent;
            if (oldText === '已复制') return;
            b.textContent = '已复制';
            var oldColor = b.style.color;
            b.style.color = 'var(--accent-wechat)';
            if (client) {
              client.copied = true;
              saveState();
            }

            var card = document.getElementById('xdc_' + idx);
            if (card) {
              var phoneBtn = card.querySelector('.client-phone-btn');
              if (phoneBtn) {
                phoneBtn.classList.add('copied');
              }
            }

            setTimeout(function() {
              b.textContent = name;
              b.style.color = oldColor;
            }, 1000);
          });
        });

        // Wire up company click copy
        container.querySelectorAll('.client-card-tag-company').forEach(function(b) {
          b.addEventListener('click', function(e) {
            e.stopPropagation();
            var company = b.dataset.company;

            var compLimit = checkCopyLimit();
            if (!compLimit.allowed) {
              showCopyLimitToast(compLimit.message, false);
              return;
            }
            var idx = parseInt(b.dataset.idx);
            var client = importedClients[idx];
            var name = (client && client.name && client.name !== '-') ? client.name : '';
            var copyText = name ? name + ' ' + company : company;
            copyTextToClipboard(copyText);

            var cardEl = b.closest('.xls-dial-card');
            var cardIdx = cardEl ? parseInt(cardEl.id.replace('xdc_', '')) : -1;
            var clientComp = importedClients[cardIdx];
            if (clientComp) recordTimeline(clientComp.phone || clientComp.mobile, 'copy_company');

            var oldText = b.textContent;
            if (oldText === '已复制') return;
            b.textContent = '已复制';
            var oldColor = b.style.color;
            b.style.color = 'var(--accent-wechat)';
            
            setTimeout(function() {
              b.textContent = company;
              b.style.color = oldColor;
            }, 1000);
          });
        });

        // Wire up card tag note click modal
        container.querySelectorAll('.client-card-tag-note').forEach(function(b) {
          b.addEventListener('click', function(e) {
            e.stopPropagation();
            var note = b.dataset.note || '(空)';
            var content = document.getElementById('noteModalContent');
            if (content) {
              content.textContent = note;
            }
            var modal = document.getElementById('noteModal');
            if (modal) {
              modal.classList.add('active');
            }
          });
        });

        // Wire up call button
        container.querySelectorAll('.xls-card-dial-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            var idx = parseInt(this.dataset.idx);
            // Delay opening the modal by 200ms to allow Safari to natively trigger the tel: anchor navigation first
            setTimeout(function() {
              var client = importedClients[idx];
              if (client) recordTimeline(client.phone || client.mobile, 'dial');
              startCallAssistant(idx);
            }, 200);
          });
        });
      } else {
        // Desktop View: Render CRM Table
        var tableHtml = '<table class="crm-table"><thead><tr>' +
          '<th class="col-no">#</th>' +
          '<th class="col-status">状态</th>' +
          '<th class="col-name">姓名</th>' +
          '<th class="col-phone">电话</th>' +
          '<th class="col-company">公司</th>' +
          '<th class="col-note">备注/金额</th>' +
          '<th class="col-batch">批次</th>' +
          '<th class="col-lastop">最后操作</th>' +
          '<th class="col-action">操作</th>' +
        '</tr></thead><tbody>';

        tableHtml += sorted.map(function(c, idx) {
          var rowNo = (currentPage - 1) * pageSize + idx + 1;

          var badgeHtml = '<span style="font-size:11px;padding:1px 6px;border-radius:3px;background:#f0f0f0;color:#888;">待拨</span>';
          var rowClass = '';
          if (c.dialedStatus === 'success') {
            badgeHtml = '<span style="font-size:11px;padding:1px 6px;border-radius:3px;background:rgba(7,193,96,0.12);color:#07c160;">已拨</span>';
            rowClass = ' row-dialed';
          } else if (c.dialedStatus === 'failed') {
            badgeHtml = '<span style="font-size:11px;padding:1px 6px;border-radius:3px;background:rgba(231,76,60,0.1);color:#e74c3c;">未通</span>';
            rowClass = ' row-dialed';
          }

          var wlBadge = '';
          if (c.company) {
            var matchedWl = matchWhitelistCompany(c.company);
            if (matchedWl) {
              wlBadge = ' <span style="font-size:10px;background:rgba(7,193,96,0.1);color:#07c160;padding:0 4px;border-radius:2px;">' + esc(matchedWl.bank_name || '白名单') + '</span>';
            }
          }

          var phoneVal = c.phone || c.mobile || '';
          return '<tr class="' + rowClass + '" data-idx="' + idx + '">' +
            '<td class="col-no">' + rowNo + '</td>' +
            '<td class="col-status">' + badgeHtml + '</td>' +
            '<td class="col-name"><span class="crm-copy-btn" data-copy="' + esc(c.name||'') + '" title="点击复制">' + esc(c.name||'-') + '</span></td>' +
            '<td class="col-phone"><span class="crm-copy-btn" data-copy="' + esc(phoneVal) + '" title="点击复制">' + esc(phoneVal || '-') + '</span></td>' +
            '<td class="col-company"><span class="crm-copy-btn" data-copy="' + esc((c.name && c.name !== '-' ? c.name + ' ' : '') + (c.company||'')) + '">' + esc(c.company||'-') + '</span>' + wlBadge + '</td>' +
            '<td class="col-note">' + esc(c.note||'-') + '</td>' +
            '<td class="col-batch">' + '<span style="font-size:11px;background:rgba(74,108,247,0.08);color:#4a6cf7;padding:1px 6px;border-radius:3px;">' + (displayBatchLabel(c.batch_label) || '-') + '</span>' + '</td>' +
            '<td class="col-lastop" style="font-size:0.52rem;">' + (c.last_operation ? TimelineDisplay.render(c.last_operation) : '-') + '</td>' +
            '<td class="col-action"><a href="tel:' + esc(phoneVal) + '" style="display:inline-block;padding:3px 10px;background:linear-gradient(135deg,#07c160,#06ad56);color:#fff;border-radius:4px;text-decoration:none;font-size:12px;font-weight:700;">拨打</a></td>' +
          '</tr>';
        }).join('');

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

        // Wire up CRM table copy buttons
        container.querySelectorAll('.crm-copy-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var text = this.dataset.copy;
            if (!text) return;
            // Apply copy limit for phone numbers
            if (/[\\d\\-\\.\\s\\+\\(\\)]{7,}/.test(text)) {
              var limit = checkCopyLimit();
              if (!limit.allowed) {
                showCopyLimitToast(limit.message, false);
                return;
              }
            }
            var parentTd = btn.closest('td');
            var copyType = 'copy_phone';
            if (parentTd && parentTd.classList.contains('col-name')) copyType = 'copy_name';
            else if (parentTd && parentTd.classList.contains('col-company')) copyType = 'copy_company';
            var copyText = (copyType === 'copy_name') ? ' ' + text + ' ' : text;
            navigator.clipboard.writeText(copyText).then(function() {
              // Record timeline based on column
              var tr = btn.closest('tr');
              var trIdx = tr ? parseInt(tr.getAttribute('data-idx')) : -1;
              if (trIdx !== -1 && importedClients[trIdx]) {
                recordTimeline(importedClients[trIdx].phone || importedClients[trIdx].mobile, copyType);
              }
              // Brief flash
              var orig = btn.style.color;
              btn.style.color = '#07c160';
              setTimeout(function() { btn.style.color = orig; }, 600);
            }).catch(function() {});
          });
        });

        // Wire up table dial buttons with call assistant
        container.querySelectorAll('.col-action a').forEach(function(btn, idx) {
          btn.addEventListener('click', function(e) {
            // Let the tel: link work natively
            var client = sorted[idx];
            if (client) {
              recordTimeline(client.phone || client.mobile, 'dial');
              setTimeout(function() {
                startCallAssistant(importedClients.indexOf(client));
              }, 300);
            }
          });
        });
      }
    }

    // Call Assistant Controls
    var selectedCallStatus = 'success';

    function getNextClientIndex(currentIdx) {
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

      if (currentIdx < 0 && filtered.length > 0) {
        return importedClients.indexOf(filtered[0]);
      }
      var currentClient = importedClients[currentIdx];
      var filteredPos = filtered.indexOf(currentClient);
      if (filteredPos !== -1 && filteredPos + 1 < filtered.length) {
        return importedClients.indexOf(filtered[filteredPos + 1]);
      }
      return -1;
    }

    function startCallAssistant(idx) {
      var c = importedClients[idx];
      if (!c) return;

      currentCallIdx = idx;

      var phoneVal = c.phone || c.mobile || '';
      document.getElementById('callAssistName').innerText = c.name;
      document.getElementById('callAssistNameDisplay').innerText = c.name;
      document.getElementById('callAssistPhone').innerText = phoneVal;
      document.getElementById('callAssistPhoneDisplay').innerText = phoneVal;
      document.getElementById('callLogNote').value = c.callNote || '';

      // Show company info if available
      var companyRow = document.getElementById('callAssistCompanyRow');
      var companyEl = document.getElementById('callAssistCompany');
      if (c.company && String(c.company).trim()) {
        companyEl.textContent = c.company;
        companyEl.dataset.company = c.company;
        companyRow.style.display = 'flex';
        companyRow.style.alignItems = 'center';
        companyRow.style.gap = '4px';
      } else {
        companyRow.style.display = 'none';
      }

      // Show note/remark info if available
      var noteRow = document.getElementById('callAssistNoteRow');
      var noteEl = document.getElementById('callAssistNote');
      if (c.note && c.note.trim()) {
        noteEl.textContent = c.note;
        noteRow.style.display = 'flex';
        noteRow.style.alignItems = 'baseline';
        noteRow.style.gap = '4px';
      } else {
        noteRow.style.display = 'none';
      }

      var nameDisp = document.getElementById('callAssistNameDisplay');
      if (nameDisp) {
        nameDisp.dataset.name = c.name;
      }
      var phoneDisp = document.getElementById('callAssistPhoneDisplay');
      var phoneVal = c.phone || c.mobile || '';
      if (phoneDisp) {
        phoneDisp.dataset.phone = phoneVal;
        if (c.copied) {
          phoneDisp.classList.add('copied');
        } else {
          phoneDisp.classList.remove('copied');
        }
      }

      var dialLink = document.getElementById('callAssistDialLink');
      if (dialLink) {
        dialLink.href = 'tel:' + phoneVal;
      }

      // Check and render local recording file if available
      var recContainer = document.getElementById('callAssistRecContainer');
      var audioWrapper = document.getElementById('callAssistAudioWrapper');
      if (recContainer && audioWrapper) {
        var hasRec = (typeof AndroidDialer !== 'undefined' && AndroidDialer.hasRecording(phoneVal));
        if (hasRec) {
          audioWrapper.innerHTML = '<audio src="/api/local-recording?phone=' + encodeURIComponent(phoneVal) + '" controls style="width: 100%; height: 32px; outline: none; margin-top: 4px; display: block;"></audio>';
          recContainer.style.display = 'flex';
        } else {
          audioWrapper.innerHTML = '';
          recContainer.style.display = 'none';
        }
      }

      document.getElementById('callAssistOverlay').classList.add('active');
    }

    function initCallControls() {
      var successBtn = document.getElementById('callOutcomeSuccessBtn');
      var failedBtn = document.getElementById('callOutcomeFailedBtn');
      var overlay = document.getElementById('callAssistOverlay');
      var phoneDisp = document.getElementById('callAssistPhoneDisplay');
      var nameDisp = document.getElementById('callAssistNameDisplay');

      window.onAndroidCallResult = function(duration) {
        if (duration >= 0) {
          var min = Math.floor(duration / 60);
          var sec = duration % 60;
          var formatted = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
          
          var c = importedClients[currentCallIdx];
          if (c) {
            c.duration = formatted;
            var currentNote = document.getElementById('callLogNote').value.trim();
            if (!currentNote) {
              if (duration > 0) {
                document.getElementById('callLogNote').value = '已接通，通话时长 ' + duration + ' 秒。';
              } else {
                document.getElementById('callLogNote').value = '已拨打未接通。';
              }
            }

            // Immediately check and display the new local recording file if available!
            var recContainer = document.getElementById('callAssistRecContainer');
            var audioWrapper = document.getElementById('callAssistAudioWrapper');
            if (recContainer && audioWrapper) {
              var phoneVal = c.phone || c.mobile || '';
              var hasRec = (typeof AndroidDialer !== 'undefined' && AndroidDialer.hasRecording(phoneVal));
              if (hasRec) {
                audioWrapper.innerHTML = '<audio src="/api/local-recording?phone=' + encodeURIComponent(phoneVal) + '" controls style="width: 100%; height: 32px; outline: none; margin-top: 4px; display: block;"></audio>';
 recContainer.style.display = 'flex';
 }
 }
 }
 }
 };

 function saveProgress(status) {
 var c = importedClients[currentCallIdx];
 if (!c) return false;

 c.callNote = document.getElementById('callLogNote').value.trim();
 c.dialedStatus = status;
 c.duration = '-';
 return true;
 }

 var autoDialActive = false;
 function handleOutcome(status) {
 if (!saveProgress(status)) return;
 var c = importedClients[currentCallIdx];
 if (c) {
 var note = document.getElementById('callLogNote').value.trim();
 recordTimeline(c.phone || c.mobile, 'call_' + status, note);
 }
 saveState();
 renderDialCards();

 var nextIdx = getNextClientIndex(currentCallIdx);
 if (nextIdx !== -1) {
 startCallAssistant(nextIdx);
 if (autoDialActive) {
 setTimeout(function() {
 var link = document.getElementById('callAssistDialLink');
 if (link && link.href) window.location.href = link.href;
 }, 800);
 }
 } else {
 if (autoDialActive) {
 autoDialActive = false;
 updateAutoDialBtn();
 }
 alert('已经是当前筛选列表的最后一位客户了！');
 overlay.classList.remove('active');
 }
 }

 function updateAutoDialBtn() {
 var btn = document.getElementById('autoDialBtn');
 if (autoDialActive) {
 btn.textContent = '暂停拨打';
 btn.style.background = '#e74c3c';
 btn.style.color = '#fff';
 btn.style.borderColor = '#e74c3c';
 } else {
 btn.textContent = '自动拨打';
 btn.style.background = '';
 btn.style.color = '';
 btn.style.borderColor = '';
 }
 }

 document.getElementById('autoDialBtn').addEventListener('click', function() {
 autoDialActive = !autoDialActive;
 updateAutoDialBtn();
 if (autoDialActive) {
 if (currentCallIdx === -1) {
 var firstIdx = getNextClientIndex(-1);
 if (firstIdx !== -1) {
 startCallAssistant(firstIdx);
 setTimeout(function() {
 var link = document.getElementById('callAssistDialLink');
 if (link && link.href) window.location.href = link.href;
 }, 800);
 }
 } else {
 var link = document.getElementById('callAssistDialLink');
 if (link && link.href) window.location.href = link.href;
 }
 }
 });

 successBtn.addEventListener('click', function() {
 handleOutcome('success');
 });

 failedBtn.addEventListener('click', function() {
 handleOutcome('failed');
 });

 // Record dial action when clicking the dial link
 var dialLink = document.getElementById('callAssistDialLink');
 if (dialLink) {
 dialLink.addEventListener('click', function() {
 var client = importedClients[currentCallIdx];
 if (client) recordTimeline(client.phone || client.mobile, 'dial');
 });
 }

 if (phoneDisp) {
 phoneDisp.addEventListener('click', function(e) {
 e.stopPropagation();
 var phone = phoneDisp.dataset.phone;

 // Rate limit check
 var limit = checkCopyLimit();
 if (!limit.allowed) {
 showCopyLimitToast(limit.message, false);
 return;
 }

 copyTextToClipboard(phone);

 var client = importedClients[currentCallIdx];
 if (client) recordTimeline(client.phone || client.mobile, 'copy_phone');

 var oldText = phoneDisp.textContent;
 if (oldText === '已复制，正在打开微信...') return;
 phoneDisp.textContent = '已复制，正在打开微信...';

 if (client) {
 client.copied = true;
 saveState();
 }

 phoneDisp.classList.add('copied');

 var card = document.getElementById('xdc_' + currentCallIdx);
 if (card) {
 var cardPhoneBtn = card.querySelector('.client-phone-btn');
 if (cardPhoneBtn) {
 cardPhoneBtn.classList.add('copied');
 }
 }

 setTimeout(function() {
 jumpToWechat();
 }, 100);

 setTimeout(function() {
 phoneDisp.textContent = maskPhone(phone);
 }, 1500);
 });
 }

 if (nameDisp) {
 nameDisp.addEventListener('click', function(e) {
 e.stopPropagation();
 var name = nameDisp.dataset.name;

 var nameLimit2 = checkCopyLimit();
 if (!nameLimit2.allowed) {
 showCopyLimitToast(nameLimit2.message, false);
 return;
 }
 copyTextToClipboard(name);

 var client = importedClients[currentCallIdx];
 if (client) recordTimeline(client.phone || client.mobile, 'copy_name');

 var oldText = nameDisp.textContent;
 if (oldText === '已复制') return;
 nameDisp.textContent = '已复制';

 if (client) {
 client.copied = true;
 saveState();
 }

 if (phoneDisp) {
 phoneDisp.classList.add('copied');
 }

 var card = document.getElementById('xdc_' + currentCallIdx);
 if (card) {
 var cardPhoneBtn = card.querySelector('.client-phone-btn');
 if (cardPhoneBtn) {
 cardPhoneBtn.classList.add('copied');
 }
 }

 setTimeout(function() {
 nameDisp.textContent = name;
 }, 1000);
 });
 }

 var companyDisp = document.getElementById('callAssistCompany');
 if (companyDisp) {
 companyDisp.addEventListener('click', function(e) {
 e.stopPropagation();
 var company = companyDisp.dataset.company || companyDisp.textContent;
 if (!company || company === '-') return;
 var nameEl = document.getElementById('callAssistNameDisplay');
 var name = (nameEl && nameEl.dataset.name && nameEl.dataset.name !== '-') ? nameEl.dataset.name : '';
 var copyText = name ? name + ' ' + company : company;
 copyTextToClipboard(copyText);

 var client = importedClients[currentCallIdx];
 if (client) recordTimeline(client.phone || client.mobile, 'copy_company');

 var oldText = companyDisp.textContent;
 if (oldText === '已复制') return;
 companyDisp.textContent = '已复制';
 
 setTimeout(function() {
 companyDisp.textContent = company;
 }, 1000);
 });
 }

 // Close modal when clicking blank area outside
 overlay.addEventListener('click', function(e) {
 if (e.target === this) {
 overlay.classList.remove('active');
 }
 });
 }

 function initFilters() {
 document.querySelectorAll('.filter-tab').forEach(function(tab) {
 tab.addEventListener('click', function() {
 document.querySelectorAll('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
 tab.classList.add('active');
 currentFilter = tab.dataset.filter;
 currentPage = 1; // Reset to page 1
 renderDialCards();
 });
 });

 document.getElementById('searchInput').addEventListener('input', function() {
 currentPage = 1; // Reset to page 1
 renderDialCards();
 });

 var sortSel = document.getElementById('sortSelect');
 if (sortSel) {
 sortSel.addEventListener('change', function() {
 currentSort = this.value;
 currentPage = 1; // Reset to page 1
 renderDialCards();
 });
 }

 }

 function initFileInputs() {
 var xlsSelect = document.getElementById('xlsSelectBtn');
 var xlsFile = document.getElementById('xlsFileInput');
 var vcfSelect = document.getElementById('vcfSelectBtn');
 var vcfFile = document.getElementById('vcfFileInput');
 var dropZone = document.getElementById('dropZone');
 var toggleBtn = document.getElementById('toggleImportBtn');

 if (toggleBtn) {
 toggleBtn.addEventListener('click', function() {
 var panel = document.getElementById('dashboardPanel');
 if (panel) {
 var willOpen = !panel.classList.contains('active');
 panel.classList.toggle('active');
 if (willOpen) {
 document.body.style.overflow = 'hidden';
 resetAIImporterUI();
 // Reset batch label with fresh timestamp
 var blInput = document.getElementById('batchLabelInput');
 if (blInput) {
 blInput.value = '导入-' + new Date().toISOString().slice(0, 19).replace('T', ' ');
 }
 } else {
 document.body.style.overflow = '';
 }
 }
 });
 }

 // Close button inside the import panel
 var importCloseBtn = document.getElementById('importCloseBtn');
 if (importCloseBtn) {
 importCloseBtn.addEventListener('click', closeImportModal);
 // Also close when clicking the backdrop (outside import-zone)
 var dp = document.getElementById('dashboardPanel');
 if (dp) {
 dp.addEventListener('click', function(e) {
 if (e.target === dp) closeImportModal();
 });
 }
 }
 function closeImportModal() {
 var panel = document.getElementById('dashboardPanel');
 if (panel) panel.classList.remove('active');
 document.body.style.overflow = '';
 }

 // Dual-SIM rotation toggle
 var dualSimBtn = document.getElementById('toggleDualSimBtn');
 var dualSimOn = true;
 var rotationCount = 10;
 if (dualSimBtn) {
 dualSimBtn.addEventListener('click', function() {
 dualSimOn = !dualSimOn;
 dualSimBtn.textContent = '双卡轮换: ' + (dualSimOn ? '开' : '关');
 localStorage.setItem('dialer_dual_sim', dualSimOn ? '1' : '0');
 });
 }
 var rotationBtn = document.getElementById('toggleRotationBtn');
 if (rotationBtn) {
 rotationBtn.addEventListener('click', function() {
 rotationCount = rotationCount === 10 ? 5 : 10;
 rotationBtn.textContent = '轮换频率: ' + rotationCount + '通';
 localStorage.setItem('dialer_rotation', String(rotationCount));
 });
 }

 // Copy limit toggle and threshold sub-buttons
 var copyLimitBtn = document.getElementById('toggleCopyLimitBtn');
 function updateCopyLimitUI() {
 if (!copyLimitBtn) return;
 copyLimitBtn.textContent = '复制限制: ' + (copyLimitEnabled ? '开' : '关');
 var subs = document.querySelectorAll('.copy-limit-sub');
 subs.forEach(function(sub) {
 sub.style.display = copyLimitEnabled ? '' : 'none';
 });
 // Update checkmarks
 ['20','30'].forEach(function(k) {
 var b = document.getElementById('toggleThreshold' + k);
 if (b) {
 b.textContent = ' ' + k + '次限制: ' + (copyLimitThresholds[k] ? '' : '');
 }
 });
 localStorage.setItem('dialer_copy_limit_enabled', copyLimitEnabled ? '1' : '0');
 localStorage.setItem('dialer_copy_limit_thresholds', JSON.stringify(copyLimitThresholds));
 }
 if (copyLimitBtn) {
 copyLimitBtn.addEventListener('click', function() {
 copyLimitEnabled = !copyLimitEnabled;
 updateCopyLimitUI();
 });
 // Initialize UI
 updateCopyLimitUI();
 }
 // Threshold sub-buttons
 ['20','30'].forEach(function(k) {
 var b = document.getElementById('toggleThreshold' + k);
 if (b) {
 b.addEventListener('click', function() {
 copyLimitThresholds[k] = !copyLimitThresholds[k];
 updateCopyLimitUI();
 });
 }
 });

 if (xlsFile) {
 xlsFile.addEventListener('change', function(e) {
 var file = e.target.files[0];
 if (file) handleFileImportDispatch(file);
 e.target.value = '';
 });
 }

 if (vcfFile) {
 vcfFile.addEventListener('change', function(e) {
 var file = e.target.files[0];
 if (file) handleFileImportDispatch(file);
 e.target.value = '';
 });
 }

 var imgFile = document.getElementById('imgFileInput');
 if (imgFile) {
 imgFile.addEventListener('change', function(e) {
 var files = Array.from(e.target.files || []);
 if (files.length === 0) { e.target.value = ''; return; }
 if (files.length === 1) {
 handleFileImportDispatch(files[0]);
 } else {
 handleMultiImageOCR(files);
 }
 e.target.value = '';
 });
 }

 // Drag & Drop
 if (dropZone) {
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
 var files = Array.from(e.dataTransfer.files || []);
 if (files.length === 0) return;
 // If multiple image files dropped, queue them all
 var imgFiles = files.filter(function(f) { return /.(jpg|jpeg|png|bmp|webp)$/i.test(f.name); });
 if (imgFiles.length > 1) {
 handleMultiImageOCR(imgFiles);
 } else if (files.length === 1) {
 handleFileImportDispatch(files[0]);
 } else {
 // Mixed files - only one non-image file - dispatch it
 handleFileImportDispatch(files[0]);
 }
 });

 // Direct paste (Ctrl+V) handler for text recognition
 dropZone.addEventListener('paste', function(e) {
 var clipboardData = e.clipboardData;
 if (!clipboardData) return;
 // Check for pasted text
 var pastedText = clipboardData.getData('text/plain');
 if (pastedText && pastedText.trim()) {
 // Check if the pasted text contains phone numbers
 var hasPhone = /1[3-9]\\d{9}/.test(pastedText.replace(/[-\\s]/g, ''));
 if (hasPhone) {
 e.preventDefault();
 e.stopPropagation();
 showAIScanningUI('剪贴板文本识别');
 document.getElementById('aiScanStatus').innerHTML = '正在识别粘贴的文本...';
 document.getElementById('aiLog1').innerHTML = '分析剪贴板文本内容...';
 document.getElementById('aiLog1').style.opacity = '1';
 correctOcrTextWithAI(pastedText.trim(), '剪贴板文本', function(contacts) {
 if (contacts && contacts.length > 0) {
 window.renderAIUnstructuredReport('剪贴板文本', contacts);
 } else {
 // Reset UI first, then show text panel for manual retry
 resetAIImporterUI();
 document.getElementById('textImportPanel').style.display = 'flex';
 document.getElementById('textImportArea').value = pastedText.trim();
 document.getElementById('textImportArea').focus();
 if (typeof showCopyLimitToast === 'function') {
 showCopyLimitToast('直接识别未检出，已填入文本框，可点击"智能识别提取"重试', true);
 }
 }
 });
 }
 }
 });

 // Listen for paste events on the whole document to catch pastes anywhere
 document.addEventListener('paste', function(e) {
 // Only handle if dashboardPanel modal is active and we're not in an input/textarea
 var dp = document.getElementById('dashboardPanel');
 if (!dp || !dp.classList.contains('active')) return;
 var activeEl = document.activeElement;
 if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;

 var clipboardData = e.clipboardData;
 if (!clipboardData) return;
 var pastedText = clipboardData.getData('text/plain');
 if (pastedText && pastedText.trim()) {
 var hasPhone = /1[3-9]\\d{9}/.test(pastedText.replace(/[-\\s]/g, ''));
 if (hasPhone) {
 e.preventDefault();
 e.stopPropagation();
 showAIScanningUI('剪贴板文本识别');
 document.getElementById('aiScanStatus').innerHTML = '正在识别粘贴的文本...';
 document.getElementById('aiLog1').innerHTML = '分析剪贴板文本内容...';
 document.getElementById('aiLog1').style.opacity = '1';
 correctOcrTextWithAI(pastedText.trim(), '剪贴板文本', function(contacts) {
 if (contacts && contacts.length > 0) {
 window.renderAIUnstructuredReport('剪贴板文本', contacts);
 } else {
 // Reset UI first, then show text panel for manual retry
 resetAIImporterUI();
 document.getElementById('textImportPanel').style.display = 'flex';
 document.getElementById('textImportArea').value = pastedText.trim();
 document.getElementById('textImportArea').focus();
 if (typeof showCopyLimitToast === 'function') {
 showCopyLimitToast('直接识别未检出，已填入文本框，可点击"智能识别提取"重试', true);
 }
 }
 });
 }
 }
 });
 }

 // Local OCR Slicing Config Bindings
 var slider1 = document.getElementById('sliderSplit1');
 var slider2 = document.getElementById('sliderSplit2');
 var orderSelect = document.getElementById('ocrColumnOrder');
 if (slider1 && slider2) {
 slider1.oninput = function() {
 var s1 = parseInt(slider1.value);
 var s2 = parseInt(slider2.value);
 if (s1 >= s2) {
 slider1.value = s2 - 2;
 }
 drawOcrSlicingPreviewLines();
 };
 slider2.oninput = function() {
 var s1 = parseInt(slider1.value);
 var s2 = parseInt(slider2.value);
 if (s2<= s1) {
            slider2.value = s1 + 2;
          }
          drawOcrSlicingPreviewLines();
        };
      }
      if (orderSelect) {
        orderSelect.onchange = drawOcrSlicingPreviewLines;
      }
      
      var btnStart = document.getElementById('btnStartLocalOcr');
      if (btnStart) btnStart.onclick = startLocalOcrProcessing;
      
      var btnCancel = document.getElementById('btnCancelLocalOcr');
      if (btnCancel) btnCancel.onclick = resetAIImporterUI;
    }

    // Clear and Export Data
    function initDataActions() {
      var clearBtn = document.getElementById('clearBtn');
      var exportBtn = document.getElementById('exportBtn');
      var closeExport = document.getElementById('closeExportBtn');
      var copyExport = document.getElementById('copyExportBtn');
      var exportModal = document.getElementById('exportModal');
      var exportArea = document.getElementById('exportTextarea');

      if (clearBtn) {
        clearBtn.addEventListener('click', function() {
          if (confirm('确认清空当前导入的客户和所有的拨号记录吗？')) {
            importedClients = [];
            saveState();
            updateDashboardVisibility(false);
            var statusEl = document.getElementById('importStatus');
            if (statusEl) statusEl.innerText = '';
            renderDialCards();
          }
        });
      }

      if (exportBtn) {
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

          if (exportArea) exportArea.value = lines.join('\\n');
          if (exportModal) exportModal.classList.add('active');
        });
      }

      if (closeExport && exportModal) {
        closeExport.addEventListener('click', function() {
          exportModal.classList.remove('active');
        });
      }

      if (copyExport && exportArea) {
        copyExport.addEventListener('click', function() {
          exportArea.select();
          document.execCommand('copy');
          copyExport.textContent = '已成功复制！';
          setTimeout(function() {
            copyExport.textContent = '复制记录到剪贴板';
          }, 1500);
        });
      }
    }

    // ====== Customer Data Viewer (Supabase CRM) ======
    var DB = {
      page: 1,
      total: 0,
      pageSize: 300, // 默认 300 条/页
      timer: null,
      sortBy: '',
      sortDir: 'asc',
      activeTab: 'all', // all, 意向客户, 线索池, 公海客户
      activeShortcut: 'all', // all, today, never, 3days
      selectedIds: {}, // 选中的 ID 字典
      allData: [], // 缓存在前端的数据，方便高精度过滤与本地计算
      customColumns: (function() {
        try {
          var saved = localStorage.getItem('crm_custom_columns');
          var parsed = saved ? JSON.parse(saved) : [];
          return Array.isArray(parsed) ? parsed : [];
        } catch(e) { return []; }
      })()
    };
    var CATS = ['潜在客户','意向客户','已成交','无效号码','待跟进','老客户','同行','其他','公海客户'];

    function parseCustomerNote(c) {
      var noteStr = (c.note || '').trim();
      var parsed = { note: noteStr, custom: {} };
      if (!noteStr) return parsed;
      if (noteStr.indexOf('{') === 0) {
        var braceCount = 0;
        var jsonEndIdx = -1;
        for (var i = 0; i < noteStr.length; i++) {
          if (noteStr[i] === '{') braceCount++;
          else if (noteStr[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEndIdx = i;
              break;
            }
          }
        }
        if (jsonEndIdx !== -1) {
          var jsonPart = noteStr.slice(0, jsonEndIdx + 1);
          var textPart = noteStr.slice(jsonEndIdx + 1).trim();
          try {
            var obj = JSON.parse(jsonPart);
            if (obj && typeof obj === 'object') {
              var baseNote = obj.note !== undefined ? obj.note : '';
              parsed.custom = obj.custom || {};
              if (obj.fund) {
                c.fund = obj.fund; // Restore fund to customer object
              }
              if (textPart) {
                parsed.note = baseNote ? baseNote + '\\n' + textPart : textPart;
              } else {
                parsed.note = baseNote;
              }
              return parsed;
            }
          } catch (e) {}
        }
      }
      return parsed;
    }

    function serializeCustomersForSupabase(customers) {
      return customers.map(function(c) {
        var copy = Object.assign({}, c);
        var parsed = { note: copy.note || '', custom: copy.custom || {} };
        
        var fundVal = (copy.fund || '').trim();
        var rawNote = (copy.note || '').trim();
        if (rawNote.indexOf('{') === 0) {
          try {
            var braceCount = 0;
            var jsonEndIdx = -1;
            for (var i = 0; i < rawNote.length; i++) {
              if (rawNote[i] === '{') braceCount++;
              else if (rawNote[i] === '}') {
                braceCount--;
                if (braceCount === 0) { jsonEndIdx = i; break; }
              }
            }
            if (jsonEndIdx !== -1) {
              var jsonPart = rawNote.slice(0, jsonEndIdx + 1);
              var textPart = rawNote.slice(jsonEndIdx + 1).trim();
              var obj = JSON.parse(jsonPart);
              if (obj && typeof obj === 'object') {
                parsed.note = obj.note !== undefined ? obj.note : '';
                parsed.custom = Object.assign({}, obj.custom || {}, parsed.custom);
                if (obj.fund && !fundVal) fundVal = obj.fund;
                if (textPart) {
                  parsed.note = parsed.note ? parsed.note + '\\n' + textPart : textPart;
                }
              }
            }
          } catch(e) {}
        }

        var jsonPayload = { note: parsed.note, custom: parsed.custom };
        if (fundVal) {
          jsonPayload.fund = fundVal;
        }

        if (Object.keys(parsed.custom).length > 0 || fundVal) {
          copy.note = JSON.stringify(jsonPayload);
        } else {
          copy.note = parsed.note;
        }
        copy.mobile = copy.mobile || copy.phone;
        delete copy.last_operation; // 不通过 upsert 覆盖操作记录
        return copy;
      });
    }

    function renderCRMHeaders() {
      var headerRow = document.getElementById('dbHeaderRow');
      if (!headerRow) return;
      var html = '<th style="width: 40px; text-align: center; cursor: default;"><input type="checkbox" id="crmSelectAll"></th>' +
        '<th data-sort="name" style="width: 140px; cursor: pointer;">客户名称 <span class="sort-arrow"></span></th>' +
        '<th data-sort="mobile" style="width: 160px; cursor: pointer;">联系号码 <span class="sort-arrow"></span></th>' +
        '<th data-sort="note" style="min-width: 120px; cursor: pointer;">备注 <span class="sort-arrow"></span></th>';
      var customCols = DB.customColumns || [];
      customCols.forEach(function(col) {
        html += '<th data-sort="custom_' + esc(col) + '" style="min-width: 100px; cursor: pointer;">' + esc(col) + '<span class="sort-arrow"></span></th>';
      });
      html += '<th data-sort="company_name" style="min-width: 200px; cursor: pointer;">单位 <span class="sort-arrow"></span></th>' +
        '<th data-sort="category" style="width: 100px; cursor: pointer;">分类 <span class="sort-arrow"></span></th>' +
        '<th style="width: 100px; cursor: default;">操作</th>';
      headerRow.innerHTML = html;
      dbWireSortHeaders();
      var selectAllCb = document.getElementById('crmSelectAll');
      if (selectAllCb) {
        selectAllCb.onchange = function() {
          var cbs = document.querySelectorAll('#dbTbody .crm-row-select');
          var checked = selectAllCb.checked;
          cbs.forEach(function(cb) {
            cb.checked = checked;
            var m = cb.getAttribute('data-mobile');
            var tr = cb.closest('tr');
            if (checked) {
              DB.selectedIds[m] = true;
              if (tr) tr.classList.add('selected');
            } else {
              delete DB.selectedIds[m];
              if (tr) tr.classList.remove('selected');
            }
          });
        };
      }
    }

    function renderCustomColumnsList() {
      var container = document.getElementById('customColumnsList');
      if (!container) return;
      var cols = DB.customColumns || [];
      if (cols.length === 0) {
        container.innerHTML = '<div style="font-size:0.72rem; color:var(--text-light); text-align:center; padding:10px;">暂无自定义列，可在下方输入添加。</div>';
        return;
      }
      var html = '';
      cols.forEach(function(col, idx) {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:6px 8px; border-radius:4px; border:1px solid var(--card-border); font-size:0.75rem; font-weight:bold;">' +
          '<span>' + esc(col) + '</span>' +
          '<button class="delete-custom-col-btn" data-idx="' + idx + '" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-weight:bold; font-size:0.9rem; padding:0 4px;"></button>' +
          '</div>';
      });
      container.innerHTML = html;
      container.querySelectorAll('.delete-custom-col-btn').forEach(function(btn) {
        btn.onclick = function() {
          var idx = parseInt(btn.getAttribute('data-idx'));
          var colName = DB.customColumns[idx];
          if (confirm('确认删除自定义列「' + colName + '」吗？(注意：删除列仅隐藏前端显示，已存入备注中的数据不会丢失)')) {
            DB.customColumns.splice(idx, 1);
            localStorage.setItem('crm_custom_columns', JSON.stringify(DB.customColumns));
            renderCustomColumnsList();
            renderCRMHeaders();
            dbTable(crmFilterData(DB.allData));
          }
        };
      });
    }

    function initCustomColumnsHandlers() {
      var manageBtn = document.getElementById('crmManageColsBtn');
      var modal = document.getElementById('customColumnsModal');
      var closeBtn = document.getElementById('closeCustomColumnsBtn');
      var addBtn = document.getElementById('addCustomColBtn');
      var input = document.getElementById('newCustomColInput');
      if (manageBtn && modal) {
        manageBtn.onclick = function() {
          renderCustomColumnsList();
          modal.classList.add('active');
        };
      }
      if (closeBtn && modal) {
        closeBtn.onclick = function() {
          modal.classList.remove('active');
        };
      }
      if (addBtn && input) {
        addBtn.onclick = function() {
          var val = input.value.trim();
          if (!val) return;
          if (val.length > 20) { alert('列名过长，请保持在20字以内'); return; }
          if (['name', 'mobile', 'phone', 'company', 'company_name', 'note', 'fund', 'category', 'batch_label', 'created_at', 'id'].indexOf(val.toLowerCase()) !== -1) {
            alert('该列名是系统保留字段，不能作为自定义列名');
            return;
          }
          if (DB.customColumns.indexOf(val) !== -1) {
            alert('该列名已存在');
            return;
          }
          DB.customColumns.push(val);
          localStorage.setItem('crm_custom_columns', JSON.stringify(DB.customColumns));
          input.value = '';
          renderCustomColumnsList();
          renderCRMHeaders();
          dbTable(crmFilterData(DB.allData));
        };
        input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') addBtn.click();
        });
      }
    }

    function renderImportMappingControls(headersList, detected) {
      var container = document.getElementById('aiAdjustControls');
      if (!container) return;
      var html = '<div style="display: flex; flex-direction: column; gap: 2px;">' +
        '<label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">姓名数据列</label>' +
        '<select id="aiSelName" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 2px;">' +
        '<label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">电话数据列</label>' +
        '<select id="aiSelPhone" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 2px;">' +
        '<label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">公司数据列 (可选)</label>' +
        '<select id="aiSelCompany" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 2px;">' +
        '<label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">备注数据列 (可选)</label>' +
        '<select id="aiSelNote" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>' +
        '</div>';
      var customCols = DB.customColumns || [];
      customCols.forEach(function(col) {
        html += '<div style="display: flex; flex-direction: column; gap: 2px;">' +
          '<label style="font-size: 0.6rem; color: var(--text-light); font-weight: 800;">' + esc(col) + ' 数据列 (可选)</label>' +
          '<select class="aiSelCustom" data-col="' + esc(col) + '" style="height: 24px; font-size: 0.65rem; outline: none; border: 1px solid var(--card-border); border-radius: 4px; font-weight: 800; color: var(--text-soft); background: var(--btn-bg);"></select>' +
          '</div>';
      });
      container.innerHTML = html;
      populateMappingSelect('aiSelName', headersList, detected.nameIdx);
      populateMappingSelect('aiSelPhone', headersList, detected.phoneIdx);
      populateMappingSelect('aiSelCompany', headersList, detected.companyIdx, true);
      populateMappingSelect('aiSelNote', headersList, detected.noteIdx, true);
      var customSelects = container.querySelectorAll('.aiSelCustom');
      customSelects.forEach(function(sel) {
        var colName = sel.getAttribute('data-col');
        var matchedIdx = -1;
        for (var h = 0; h < headersList.length; h++) {
          if (headersList[h] && headersList[h].label.toLowerCase() === colName.toLowerCase()) {
            matchedIdx = headersList[h].idx;
            break;
          }
        }
        populateMappingSelect(sel, headersList, matchedIdx, true);
        sel.addEventListener('change', updateAIPreviewTable);
      });
      document.getElementById('aiSelName').addEventListener('change', updateAIPreviewTable);
      document.getElementById('aiSelPhone').addEventListener('change', updateAIPreviewTable);
      document.getElementById('aiSelCompany').addEventListener('change', updateAIPreviewTable);
      document.getElementById('aiSelNote').addEventListener('change', updateAIPreviewTable);
    }

    // CRM 数据复合过滤器 (AND 关系)
    function crmFilterData(data) {
      var filtered = (data || []).slice();
      
      // 1. 快捷按钮筛选 (activeShortcut)
      if (DB.activeShortcut && DB.activeShortcut !== 'all') {
        if (DB.activeShortcut === 'today') {
          var todayStr = new Date().toISOString().slice(0, 10);
          filtered = filtered.filter(function(c) {
            return c.created_at && c.created_at.slice(0, 10) === todayStr;
          });
        } else if (DB.activeShortcut === 'never') {
          filtered = filtered.filter(function(c) {
            return (!c.note || c.note.trim() === '') && (!c.fund || c.fund.trim() === '');
          });
        } else if (DB.activeShortcut === '3days') {
          var threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
          filtered = filtered.filter(function(c) {
            return c.created_at && new Date(c.created_at).getTime() < threeDaysAgo;
          });
        }
      }

      // 2. 多维度搜索表单筛选 (AND 关系)
      var nameF = document.getElementById('dbNameSearch') ? document.getElementById('dbNameSearch').value.trim().toLowerCase() : '';
      var phoneF = document.getElementById('dbPhoneSearch') ? document.getElementById('dbPhoneSearch').value.trim().toLowerCase() : '';
      var noteF = document.getElementById('dbNoteSearch') ? document.getElementById('dbNoteSearch').value.trim().toLowerCase() : '';

      if (nameF) {
        filtered = filtered.filter(function(c) { return (c.name || '').toLowerCase().includes(nameF); });
      }
      if (phoneF) {
        filtered = filtered.filter(function(c) { return (c.mobile || '').toLowerCase().includes(phoneF); });
      }
      if (noteF) {
        filtered = filtered.filter(function(c) {
          var noteVal = (c.note || '').toLowerCase();
          var fundVal = (c.fund || '').toLowerCase();
          var customVal = '';
          var parsed = parseCustomerNote(c);
          for (var key in parsed.custom) {
            if (parsed.custom.hasOwnProperty(key)) {
              customVal += ' ' + String(parsed.custom[key]).toLowerCase();
            }
          }
          return noteVal.includes(noteF) || fundVal.includes(noteF) || customVal.includes(noteF);
        });
      }

      // 3. 排序 (Sort)
      if (DB.sortBy) {
        var isDesc = DB.sortDir === 'desc';
        filtered.sort(function(a, b) {
          var valA = '';
          var valB = '';
          if (DB.sortBy.indexOf('custom_') === 0) {
            var col = DB.sortBy.slice(7);
            var parsedA = parseCustomerNote(a);
            var parsedB = parseCustomerNote(b);
            valA = parsedA.custom[col] || '';
            valB = parsedB.custom[col] || '';
          } else if (DB.sortBy === 'created_at') {
            valA = a.created_at || '';
            valB = b.created_at || '';
          } else if (DB.sortBy === 'category') {
            valA = a.category || '';
            valB = b.category || '';
          } else {
            valA = a[DB.sortBy] || '';
            valB = b[DB.sortBy] || '';
          }
          var strA = String(valA).trim();
          var strB = String(valB).trim();
          var numA = parseFloat(strA);
          var numB = parseFloat(strB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return isDesc ? numB - numA : numA - numB;
          }
          var cmp = strA.localeCompare(strB, 'zh-CN', { numeric: true, sensitivity: 'base' });
          return isDesc ? -cmp : cmp;
        });
      }

      // 4. 冷却期客户自动排到最后（避免添加到待拨打时误勾选）
      filtered.sort(function(a, b) {
        var aCool = !canAddToDialList(a.mobile);
        var bCool = !canAddToDialList(b.mobile);
        if (aCool && !bCool) return 1;
        if (!aCool && bCool) return -1;
        return 0;
      });

      return filtered;
    }

    function dbFetch() {
      var searchInput = document.getElementById('dbSearch');
      var q = searchInput ? searchInput.value.trim() : '';

      var activeTab = DB.activeTab || 'all';
      var catFilter = document.getElementById('dbCatFilter') ? document.getElementById('dbCatFilter').value : '';
      var batchFilter = document.getElementById('dbBatchFilter') ? document.getElementById('dbBatchFilter').value : '';

      var category = '';
      if (activeTab && activeTab !== 'all') {
        category = activeTab;
      } else if (catFilter) {
        category = catFilter;
      }

      // 拉取大量数据到本地缓存，再客户端分页（保证冷却期排序跨全部数据生效）
      // 排除冷却期客户以减少 Supabase 数据传输量
      var cooldownMobiles = Object.keys(getAddHistory());
      var url = '/api/dialer/customers?page=1&pageSize=5000&account_id=' + encodeURIComponent(getOrCreateAccountId());
      if (q) url += '&search=' + encodeURIComponent(q);
      if (category) url += '&category=' + encodeURIComponent(category);
      if (batchFilter) url += '&batch_label=' + encodeURIComponent(batchFilter);
      if (DB.sortBy) url += '&sortBy=' + encodeURIComponent(DB.sortBy) + '&sortDir=' + DB.sortDir;
      if (cooldownMobiles.length > 0) url += '&exclude=' + encodeURIComponent(cooldownMobiles.join(','));

      var colCount = 8 + (DB.customColumns || []).length;
      var tbody = document.getElementById('dbTbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="' + colCount + '" class="db-loading">数据加载中...</td></tr>';

      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (res.error) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="' + colCount + '" style="text-align:center;padding:40px;color:#e74c3c;">Supabase 查询出错: ' + esc(res.error) + '</td></tr>';
            return;
          }
          var rawData = res.data || [];
          DB.allData = rawData; // 存入全部缓存

          // 客户端过滤+排序（冷却期客户排到最后）
          var filtered = crmFilterData(rawData);
          DB.total = filtered.length;

          dbTable(filtered);
          dbPager();
          crmUpdateBadgeCounts(rawData);
          dbFilters(rawData);

          var totalEl = document.getElementById('dbTotal');
          if (totalEl) totalEl.textContent = '共 ' + DB.total + ' 条';
        })
        .catch(function(err) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="' + colCount + '" style="text-align:center;padding:40px;color:#e74c3c;">数据加载失败: ' + esc(err.message) + '</td></tr>';
        });
    }

    // 客户端分页：从缓存中翻页，保证冷却期排序生效
    function dbRenderCached() {
      var filtered = crmFilterData(DB.allData);
      DB.total = filtered.length;
      dbTable(filtered);
      dbPager();
      var totalEl = document.getElementById('dbTotal');
      if (totalEl) totalEl.textContent = '共 ' + DB.total + ' 条';
    }

    // 统计状态栏更新
    function crmUpdateBadgeCounts(data) {
      var red = 0, yellow = 0, blue = 0, cyan = 0;
      var d = data || [];
      var todayStr = new Date().toISOString().slice(0, 10);
      
      for (var i = 0; i < d.length; i++) {
        var c = d[i];
        var cat = c.category || '';
        if (c.batch_label && c.batch_label.includes('广告') && c.created_at && c.created_at.slice(0, 10) === todayStr) {
          red++;
        }
        if (c.batch_label && c.batch_label.includes('广告') && cat === '待跟进') {
          yellow++;
        }
        if (cat === '' || cat === '未分类' || !c.note) {
          blue++;
        }
        if (c.batch_label && !c.batch_label.includes('广告') && cat === '待跟进') {
          cyan++;
        }
      }

      if (document.getElementById('crmRedCount')) document.getElementById('crmRedCount').textContent = red;
      if (document.getElementById('crmYellowCount')) document.getElementById('crmYellowCount').textContent = yellow;
      if (document.getElementById('crmBlueCount')) document.getElementById('crmBlueCount').textContent = DB.total; 
      if (document.getElementById('crmCyanCount')) document.getElementById('crmCyanCount').textContent = cyan;
    }

    // 表格行渲染
    function dbTable(data) {
      var tb = document.getElementById('dbTbody');
      var em = document.getElementById('dbEmpty');
      if (!tb) return;

      // 客户端分页：仅渲染当前页数据
      if (data && data.length > 0) {
        var sliceStart = (DB.page - 1) * DB.pageSize;
        var sliceEnd = Math.min(sliceStart + DB.pageSize, data.length);
        data = data.slice(sliceStart, sliceEnd);
      }

      if (!data || data.length === 0) {
        tb.innerHTML = '';
        if (em) em.style.display = 'block';
        return;
      }
      if (em) em.style.display = 'none';
      
      var h = '';
      var avatarColors = ['#ff5722', '#4a6cf7', '#07c160', '#ff9800', '#9c27b0', '#00bcd4', '#3f51b5', '#e91e63'];
      
      for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var cat = c.category || '';
        
        var isChecked = DB.selectedIds[c.mobile] ? ' checked' : '';
        var isTrSelected = DB.selectedIds[c.mobile] ? ' class="selected"' : '';
        
        var isNew = c.created_at && (Date.now() - new Date(c.created_at).getTime() < 24 * 60 * 60 * 1000);
        var badgeHtml = isNew ? '<span class="crm-badge-new">新</span>' : '<span class="crm-badge-old">旧</span>';
        
        var firstChar = (c.name || '').trim().charAt(0) || '匿';
        var colorIdx = Math.abs(firstChar.charCodeAt(0)) % avatarColors.length;
        var avatarBg = avatarColors[colorIdx];
        var avatarHtml = '<span class="crm-avatar" style="background:' + avatarBg + ';">' + esc(firstChar) + '</span>';
        
        var parsed = parseCustomerNote(c);
        var realNote = parsed.note;
        var noteDisplay = '';
        if (c.fund) {
          noteDisplay = '<div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">' +
            '<span class="crm-fund-tag" style="background:rgba(255,152,0,0.12); color:#e65100; font-weight:900; font-size:11px; padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; border: 1px solid rgba(255,152,0,0.25);">公积金: ' + esc(c.fund) + '</span>' +
            (realNote ? '<span style="color:var(--text-soft); font-weight:normal;">' + esc(realNote) + '</span>' : '') +
            '</div>';
        } else {
          noteDisplay = realNote ? esc(realNote) : '-';
        }
        
        var customTds = '';
        var customCols = DB.customColumns || [];
        customCols.forEach(function(col) {
          var val = parsed.custom[col] || '-';
          customTds += '<td style="white-space: normal; min-width: 100px; word-break: break-all;">' + esc(val) + '</td>';
        });

        h += '<tr' + isTrSelected + ' data-mobile="' + esc(c.mobile || '') + '">' +
          '<td style="text-align: center; cursor: default;"><input type="checkbox" class="crm-row-select" data-mobile="' + esc(c.mobile) + '" data-name="' + esc(c.name || '') + '"' + isChecked + '></td>' +
          '<td>' +
            '<div class="crm-name-cell">' +
              avatarHtml +
              '<div>' +
                '<div style="font-weight: 700; display: flex; align-items: center;">' + badgeHtml + esc(c.name || '-') + '</div>' +
                '<span class="cust-cat-tag set cat-' + esc(cat) + '" data-m="' + esc(c.mobile) + '" data-c="' + esc(cat) + '" style="margin-top: 3px; font-size:10px; padding: 0 6px;">' + esc(cat || '未分类') + '</span>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<div class="crm-phone-cell">' +
              esc(c.mobile || '-') +
              '<button class="crm-btn-call" title="点击呼叫 / 复制" onclick="copyTextToClipboard(\\'' + esc(c.mobile) + '\\');showCopyLimitToast(\\'已复制: ' + esc(c.mobile) + '\\');recordTimeline(\\'' + esc(c.mobile) + '\\',\\'copy_phone\\');"></button>' +
            '</div>' +
          '</td>' +
          '<td style="white-space: normal; max-width: 300px; word-break: break-all;">' + noteDisplay + '</td>' +
          customTds +
          '<td style="white-space: normal;">' + esc(c.company_name || '-') + '</td>' +
          '<td style="white-space: nowrap;">' + esc(cat || '未分类') + '</td>' +
          '<td style="cursor: default;">' +
            '<a class="crm-action-link crm-btn-followup" data-mobile="' + esc(c.mobile) + '" data-note="' + esc(realNote || '') + '">新增跟进</a>' +
          '</td>' +
        '</tr>';
      }
      tb.innerHTML = h;
      
      // Wire individual row checkboxes
      var rowCbs = tb.querySelectorAll('.crm-row-select');
      rowCbs.forEach(function(cb) {
        cb.onchange = function() {
          var m = cb.getAttribute('data-mobile');
          var tr = cb.closest('tr');
          if (cb.checked) {
            DB.selectedIds[m] = true;
            if (tr) tr.classList.add('selected');
          } else {
            delete DB.selectedIds[m];
            if (tr) tr.classList.remove('selected');
          }
          // Update crmSelectAll status
          var allSelected = true;
          for (var j = 0; j < rowCbs.length; j++) {
            if (!rowCbs[j].checked) { allSelected = false; break; }
          }
          var selectAllCb = document.getElementById('crmSelectAll');
          if (selectAllCb) selectAllCb.checked = (rowCbs.length > 0 && allSelected);
        };
      });

      // Wire row click (except when clicking on checkboxes/links/buttons)
      tb.querySelectorAll('tr').forEach(function(row) {
        row.onclick = function(e) {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.crm-btn-call')) {
            return;
          }
          var cb = row.querySelector('.crm-row-select');
          if (cb) {
            cb.checked = !cb.checked;
            cb.onchange();
          }
        };
      });

      // Wire row follow-up click
      tb.querySelectorAll('.crm-btn-followup').forEach(function(btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          var mobile = btn.getAttribute('data-mobile');
          var oldNote = btn.getAttribute('data-note') || '';
          
          var newNote = prompt('请输入新增的跟进备注记录：', oldNote);
          if (newNote === null) return; // cancelled
          newNote = newNote.trim();
          if (newNote === oldNote) return; // no change
          
          btn.textContent = '...';
          
          var clientObj = DB.allData.find(function(c) { return c.mobile === mobile; });
          var rawNoteStr = clientObj ? (clientObj.note || '') : '';
          var parsed = { note: oldNote, custom: {}, fund: '' };
          if (rawNoteStr.trim().indexOf('{') === 0) {
            try {
              var braceCount = 0;
              var jsonEndIdx = -1;
              for (var i = 0; i < rawNoteStr.length; i++) {
                if (rawNoteStr[i] === '{') braceCount++;
                else if (rawNoteStr[i] === '}') {
                  braceCount--;
                  if (braceCount === 0) { jsonEndIdx = i; break; }
                }
              }
              if (jsonEndIdx !== -1) {
                var jsonPart = rawNoteStr.slice(0, jsonEndIdx + 1);
                var obj = JSON.parse(jsonPart);
                if (obj && typeof obj === 'object') {
                  parsed.custom = obj.custom || {};
                  parsed.fund = obj.fund || '';
                }
              }
            } catch (err) {}
          }
          
          var notePayload = newNote;
          if (Object.keys(parsed.custom).length > 0 || parsed.fund) {
            var pl = { note: newNote, custom: parsed.custom };
            if (parsed.fund) pl.fund = parsed.fund;
            notePayload = JSON.stringify(pl);
          }
          
          fetch('/api/dialer/customers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              account_id: getOrCreateAccountId(),
              mobile: mobile,
              fields: { note: notePayload }
            })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              dbFetch();
            } else {
              alert('更新跟进记录失败: ' + (res.error || '未知错误'));
              btn.textContent = '新增跟进';
            }
          })
          .catch(function(err) {
            alert('网络错误，更新失败: ' + err.message);
            btn.textContent = '新增跟进';
          });
        };
      });

      // Wire select all checkbox status
      var selectAllCb = document.getElementById('crmSelectAll');
      if (selectAllCb) {
        var allSelected = true;
        for (var j = 0; j < rowCbs.length; j++) {
          if (!rowCbs[j].checked) { allSelected = false; break; }
        }
        selectAllCb.checked = (rowCbs.length > 0 && allSelected);
      }
    }

    function dbPager() {
      var tp = Math.max(1, Math.ceil(DB.total / DB.pageSize));
      var pageInput = document.getElementById('dbPageInput');
      var pageTotal = document.getElementById('dbPageTotal');
      if (pageInput) {
        pageInput.value = DB.page;
        pageInput.max = tp;
      }
      if (pageTotal) pageTotal.textContent = tp;
      var p = document.getElementById('dbPrev');
      var n = document.getElementById('dbNext');
      if (p) p.disabled = (DB.page <= 1);
      if (n) n.disabled = (DB.page >= tp);
    }

    function dbFilters(data) {
      var catS = document.getElementById('dbCatFilter');
      var batchS = document.getElementById('dbBatchFilter');
      if (!catS && !batchS) return;
      
      var cs = {};
      CATS.forEach(function(cat) { cs[cat] = true; });
      var bs = {};
      
      (data || []).forEach(function(c) {
        if (c.category) cs[c.category] = true;
        if (c.batch_label) bs[c.batch_label] = true;
      });
      
      if (catS) {
        var curCat = catS.value;
        var ch = '<option value="">请选择标签</option>';
        Object.keys(cs).sort().forEach(function(k) {
          ch += '<option value="' + esc(k) + '"' + (k === curCat ? ' selected' : '') + '>' + esc(k) + '</option>';
        });
        catS.innerHTML = ch;
      }
      
      if (batchS) {
        var curBatch = batchS.value;
        var bh = '<option value="">全部批次</option>';
        Object.keys(bs).sort().forEach(function(k) {
          if (isAutoBatchLabel(k)) return;
          bh += '<option value="' + esc(k) + '"' + (k === curBatch ? ' selected' : '') + '>' + esc(k) + '</option>';
        });
        batchS.innerHTML = bh;
      }
    }

    function dbSort(col){
      if (DB.sortBy === col) {
        DB.sortDir = DB.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        DB.sortBy = col; DB.sortDir = 'asc';
      }
      DB.page = 1; dbRenderCached();
    }

    function dbWireSortHeaders(){
      var ths = document.querySelectorAll('#dbOverlay .crm-table thead th[data-sort]');
      for (var i = 0; i < ths.length; i++) {
        (function(th){
          var col = th.getAttribute('data-sort');
          if (!col) return;
          th.onclick = function(){ dbSort(col); };
          var arrow = th.querySelector('.sort-arrow');
          if (arrow) {
            if (DB.sortBy === col) {
              arrow.textContent = DB.sortDir === 'asc' ? '' : '';
              th.classList.add('sorted');
            } else {
              arrow.textContent = '';
              th.classList.remove('sorted');
            }
          }
        })(ths[i]);
      }
    }

    // ====== Database Password Gate ======
    var DB_PWD_K = 'db_access_pwd_hash';
    var dbPwdCallback = null;
    var dbPwdSessionAuthed = false; // Once authenticated this session, don't ask again

    function hashPwd(pwd) {
      // Simple salted hash for localStorage (not cryptographically secure, but beats plaintext)
      var salt = 'megz_db_salt_2024';
      var combined = salt + ':' + pwd;
      var hash = 0;
      for (var i = 0; i < combined.length; i++) {
        var char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'mz_' + Math.abs(hash).toString(36);
    }

    function getDbPassword() {
      return localStorage.getItem(DB_PWD_K) || '';
    }

    function showDbPasswordGate(callback) {
      dbPwdCallback = callback;
      var overlay = document.getElementById('dbPwdOverlay');
      var input = document.getElementById('dbPwdInput');
      var error = document.getElementById('dbPwdError');
      var cancelBtn = document.getElementById('dbPwdCancelBtn');
      var confirmBtn = document.getElementById('dbPwdConfirmBtn');

      if (!overlay) { callback(); return; }

      var savedHash = getDbPassword();
      var isFirstTime = !savedHash;

      input.value = '';
      if (isFirstTime) {
        input.placeholder = '';
      } else {
        input.placeholder = '';
      }
      error.style.display = 'none';
      overlay.style.display = 'flex';
      setTimeout(function() { overlay.classList.add('active'); input.focus(); }, 10);

      function doConfirm() {
        var pwd = input.value.trim();
        if (pwd.length !== 6) {
          input.value = '';
          input.focus();
          return;
        }
        if (!/^[a-zA-Z0-9]+$/.test(pwd)) {
          input.value = '';
          input.focus();
          return;
        }

        if (isFirstTime) {
          // Set password
          localStorage.setItem(DB_PWD_K, hashPwd(pwd));
          closeDbPasswordGate();
          dbPwdCallback && dbPwdCallback();
          dbPwdCallback = null;
        } else {
          // Verify password
          if (hashPwd(pwd) === savedHash) {
            closeDbPasswordGate();
            dbPwdCallback && dbPwdCallback();
            dbPwdCallback = null;
          } else {
            input.value = '';
            input.focus();
          }
        }
      }

      confirmBtn.onclick = doConfirm;
      input.onkeydown = function(e) {
        if (e.key === 'Enter') doConfirm();
      };

      cancelBtn.onclick = function() {
        closeDbPasswordGate();
        dbPwdCallback = null;
      };
    }

    function closeDbPasswordGate() {
      var overlay = document.getElementById('dbPwdOverlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(function() { overlay.style.display = 'none'; }, 250);
      }
    }

    // 批量删除 — 无需密码验证
    function verifyDeletePassword(callback) {
      callback();
    }

    function openDBDashboard(){
      var ov=document.getElementById('dbOverlay'); if(!ov)return;
      if (dbPwdSessionAuthed) {
        _openDBDashboardInner();
        return;
      }
      var savedHash = getDbPassword();
      if (!savedHash) {
        // First time: must set password
        showDbPasswordGate(function() {
          dbPwdSessionAuthed = true;
          _openDBDashboardInner();
        });
        return;
      }
      showDbPasswordGate(function() {
        dbPwdSessionAuthed = true;
        _openDBDashboardInner();
      });
    }

    var _viewAccountId = '';

    function loadAccountStats() {
      var bar = document.getElementById('dbAccountStats');
      if (!bar) return;
      if (!isSessionMaster()) { bar.style.display = 'none'; return; }
      bar.style.display = 'flex';
      var list = document.getElementById('dbAccountStatsList');
      var sel = document.getElementById('dbViewAccountSel');
      if (!list) return;
      list.textContent = '加载中...';
      fetch('/api/dialer/stats/accounts')
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (!res.stats || res.stats.length === 0) {
            list.textContent = '暂无数据';
            return;
          }
          list.innerHTML = res.stats.map(function(s) {
            var name = s.account_name || s.label || s.account_id.slice(0, 10);
            var badge = s.is_master ? ' [主]' : '';
            var inactive = !s.active ? ' [禁用]' : '';
            return '<span style="background:var(--card-bg); padding:2px 8px; border-radius:3px; white-space:nowrap;">'
              + name + badge + inactive
              + ' <strong style="color:var(--accent-wechat);">' + s.upload_count + '</strong>'
              + '</span>';
          }).join(' ');
          // Show migrate button if orphan records exist
          var migrateBtn = document.getElementById('dbMigrateBtn');
          if (migrateBtn) {
            if (res.unknown_count > 0) {
              migrateBtn.style.display = 'inline-block';
              migrateBtn.textContent = '归属主账户 (' + res.unknown_count + ')';
              migrateBtn.onclick = function() {
                if (!confirm('将 ' + res.unknown_count + ' 条无归属客户数据归属到主账户？')) return;
                migrateBtn.disabled = true;
                migrateBtn.textContent = '迁移中...';
                fetch('/api/dialer/stats/migrate', { method: 'POST' })
                  .then(function(r) { return r.json(); })
                  .then(function(r2) {
                    if (r2.success) {
                      migrateBtn.style.display = 'none';
                      loadAccountStats();
                      dbFetch();
                    } else {
                      alert('迁移失败: ' + (r2.error || '未知错误'));
                    }
                  })
                  .catch(function() { alert('网络错误'); })
                  .finally(function() { migrateBtn.disabled = false; });
              };
            } else {
              migrateBtn.style.display = 'none';
            }
          }
          // Populate view selector
          if (sel) {
            sel.value = '';
            sel.innerHTML = '<option value="">我的数据</option>';
            res.stats.forEach(function(s) {
              if (!s.is_master) {
                var name = s.account_name || s.label || s.account_id.slice(0, 10);
                sel.innerHTML += '<option value="' + s.account_id + '">' + name + '</option>';
              }
            });
            // Wire change handler (only once)
            if (!sel._wired) {
              sel._wired = true;
              sel.addEventListener('change', function() {
                _viewAccountId = this.value;
                DB.page = 1;
                DB.selectedIds = {};
                dbFetch();
                // Show reassign only when viewing own data
                var reassignGroup = document.getElementById('crmReassignGroup');
                if (reassignGroup) reassignGroup.style.display = _viewAccountId ? 'none' : 'flex';
              });
            }
          }
          // Populate reassign dropdown
          var reassignSel = document.getElementById('crmReassignSel');
          var reassignGroup = document.getElementById('crmReassignGroup');
          if (reassignSel && reassignGroup) {
            reassignSel.innerHTML = '<option value="">选择子账户</option>';
            res.stats.forEach(function(s) {
              if (!s.is_master && s.active) {
                var name = s.account_name || s.label || s.account_id.slice(0, 10);
                reassignSel.innerHTML += '<option value="' + s.account_id + '">' + name + '</option>';
              }
            });
            reassignGroup.style.display = _viewAccountId ? 'none' : 'flex';
          }
        })
        .catch(function() {
          list.textContent = '加载失败';
        });
    }

    function _openDBDashboardInner() {
      var ov=document.getElementById('dbOverlay'); if(!ov)return;
      ov.classList.add('active'); DB.page=1;
      // Reset view account and load stats for master
      _viewAccountId = '';
      loadAccountStats();
      var si=document.getElementById('dbSearch'); if(si)si.value='';
      var cf=document.getElementById('dbCatFilter'); if(cf)cf.value='';
      var bf=document.getElementById('dbBatchFilter'); if(bf)bf.value='';
      renderCRMHeaders();
      
      var nameInp = document.getElementById('dbNameSearch');
      var phoneInp = document.getElementById('dbPhoneSearch');
      var noteInp = document.getElementById('dbNoteSearch');
      var fuzzyInp = document.getElementById('dbFuzzySearch');
      if (nameInp) nameInp.value = '';
      if (phoneInp) phoneInp.value = '';
      if (noteInp) noteInp.value = '';
      if (fuzzyInp) fuzzyInp.value = '';
      
      DB.pageSize=parseInt((document.getElementById('dbPageSize')||{}).value||'50');
      DB.selectedIds = {}; // Reset selections
      var selectAllCb = document.getElementById('crmSelectAll');
      if (selectAllCb) selectAllCb.checked = false;
      
      dbFetch();
    }
    window.openDBDashboard = openDBDashboard;
    window.parsePhoneContactsFromRawText = parsePhoneContactsFromRawText;
    window.renderAIUnstructuredReport = renderAIUnstructuredReport;
    window.correctOcrTextWithAI = correctOcrTextWithAI;

    // 换一批：按 created_at.desc 依次拉取（与数据库看板首页同序），KV游标自动推进实现沉底
    window.refreshBatch = function() {
      var btn = document.getElementById('refreshBatchBtn');
      if (!btn || btn.disabled) return;

      if (!confirm('确认从数据库加载 50 个客户到待拨打列表吗？\\n\\n按最新导入顺序拉取，与数据库看板同序。\\n每次换一批自动推进，拉过的沉底不重复。\\n当前列表中的跟进记录不会被上传，请确认已保存重要信息。')) return;

      btn.disabled = true;
      btn.textContent = '加载中...';

	      // Collect current phone numbers to exclude from server pull (prevents duplicate across devices)
	      var excludeMobiles = [];
	      if (importedClients && importedClients.length > 0) {
	        for (var ei = 0; ei < importedClients.length; ei++) {
	          var m = (importedClients[ei].mobile || '').trim();
	          if (m) excludeMobiles.push(m);
	        }
	      }

	      fetch('/api/dialer/customers/random', {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({ limit: 50, exclude: excludeMobiles, account_id: getOrCreateAccountId() })
      })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          btn.disabled = false;
          btn.textContent = '换一批';

          if (res.error) { alert('加载失败: ' + res.error); return; }

          var customers = res.data || [];
          if (customers.length === 0) {
            if (res.total > 0) {
              alert('当前范围内客户都已在待拨列表中。\\n请清空当前列表或等待其他设备释放后重试。');
            } else {
              alert('数据库中没有客户记录！\\n请先在 CRM 中导入客户数据。');
            }
            return;
          }

          importedClients = customers.map(function(c) {
            var noteObj = {};
            var noteRaw = (c.note || '').trim();
            if (noteRaw.indexOf('{') === 0) {
              try { noteObj = JSON.parse(noteRaw); } catch(e) { noteObj = { note: noteRaw }; }
            } else {
              noteObj = { note: noteRaw };
            }
            return {
              name: c.name || '未知',
              phone: c.mobile || '',
              mobile: c.mobile || '',
              company: c.company_name || '',
              note: noteObj.note || '',
              custom: noteObj.custom || '',
              fund: c.fund || noteObj.fund || '',
              category: c.category || '',
              batch_label: c.batch_label || '',
              dialedStatus: 'todo',
              dialedAt: null
            };
          });

          localStorage.setItem(CLIENTS_K, JSON.stringify(importedClients));
          renderDialCards();
          updateStats();
          alert('已加载 ' + customers.length + ' 个客户到待拨打列表');
        })
        .catch(function(err) {
          btn.disabled = false;
          btn.textContent = '换一批';
          alert('网络错误: ' + err.message);
        });
    };

    function initCustViewer(){
      var ov=document.getElementById('dbOverlay'); if(!ov)return;
      var cls=document.getElementById('dbClose'); if(cls)cls.addEventListener('click',function(){ov.classList.remove('active');});
      ov.addEventListener('click',function(e){if(e.target===ov)ov.classList.remove('active');});
      
      var si=document.getElementById('dbSearch'); if(si)si.addEventListener('input',function(){clearTimeout(DB.timer);DB.timer=setTimeout(function(){DB.page=1;dbFetch();},400);});
      // 模糊关联搜索: 同步到 dbSearch 并触发服务端模糊搜索
      var fuzzySearch = document.getElementById('dbFuzzySearch');
      if (fuzzySearch) {
        fuzzySearch.addEventListener('input', function() {
          var q = fuzzySearch.value.trim();
          if (si) si.value = q;
          clearTimeout(DB.fuzzyTimer);
          DB.fuzzyTimer = setTimeout(function() {
            DB.page = 1;
            dbFetch();
          }, 350);
        });
      }
      var cf=document.getElementById('dbCatFilter'); if(cf)cf.addEventListener('change',function(){DB.page=1;dbFetch();});
      var bf=document.getElementById('dbBatchFilter'); if(bf)bf.addEventListener('change',function(){DB.page=1;dbFetch();});
      var ps=document.getElementById('dbPageSize'); if(ps)ps.addEventListener('change',function(){DB.pageSize=parseInt(ps.value);DB.page=1;dbRenderCached();});
      var pr=document.getElementById('dbPrev'); if(pr)pr.addEventListener('click',function(){if(DB.page>1){DB.page--;dbRenderCached();}});
      var nx=document.getElementById('dbNext'); if(nx)nx.addEventListener('click',function(){var tp=Math.max(1,Math.ceil(DB.total/DB.pageSize));if(DB.page<tp){DB.page++;dbRenderCached();}});
      
      var pageInput = document.getElementById('dbPageInput');
      if (pageInput) {
        var triggerPageChange = function() {
          var tp = Math.max(1, Math.ceil(DB.total / DB.pageSize));
          var val = parseInt(pageInput.value);
          if (isNaN(val) || val < 1) {
            val = 1;
          } else if (val > tp) {
            val = tp;
          }
          if (val !== DB.page) {
            DB.page = val;
            dbRenderCached();
          } else {
            pageInput.value = DB.page;
          }
        };
        pageInput.addEventListener('change', triggerPageChange);
        pageInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            triggerPageChange();
            pageInput.blur();
          }
        });
      }
      
      // Select all checkbox wiring
      var selectAllCb = document.getElementById('crmSelectAll');
      if (selectAllCb) {
        selectAllCb.onchange = function() {
          var checked = selectAllCb.checked;
          var tb = document.getElementById('dbTbody');
          if (!tb) return;
          var rowCbs = tb.querySelectorAll('.crm-row-select');
          rowCbs.forEach(function(cb) {
            cb.checked = checked;
            var m = cb.getAttribute('data-mobile');
            var tr = cb.closest('tr');
            if (checked) {
              DB.selectedIds[m] = true;
              if (tr) tr.classList.add('selected');
            } else {
              delete DB.selectedIds[m];
              if (tr) tr.classList.remove('selected');
            }
          });
        };
      }

      // Tabs wiring
      var tabs = document.querySelectorAll('#dbOverlay .crm-tab');
      tabs.forEach(function(tab) {
        tab.onclick = function() {
          tabs.forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          DB.activeTab = tab.getAttribute('data-tab') || 'all';
          DB.page = 1;
          dbFetch();
        };
      });

      // Shortcuts wiring
      var shortcuts = document.querySelectorAll('#dbOverlay .crm-shortcut-btn');
      shortcuts.forEach(function(btn) {
        btn.onclick = function() {
          shortcuts.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          DB.activeShortcut = btn.getAttribute('data-shortcut') || 'all';
          DB.page = 1;
          dbFetch();
        };
      });

      // Toggle search area collapse
      var toggleSearchBtn = document.getElementById('crmToggleSearchBtn');
      var searchCard = document.querySelector('#dbOverlay .crm-search-card');
      var badgeBar = document.querySelector('#dbOverlay .crm-badge-bar');
      var dbSearchCollapsed = localStorage.getItem('db_search_collapsed') === '1';
      if (dbSearchCollapsed && toggleSearchBtn && searchCard && badgeBar) {
        searchCard.classList.add('collapsed');
        badgeBar.classList.add('collapsed');
        toggleSearchBtn.innerHTML = '展开搜索';
      }
      if (toggleSearchBtn) {
        toggleSearchBtn.addEventListener('click', function() {
          var isCollapsed = searchCard && searchCard.classList.contains('collapsed');
          if (searchCard) searchCard.classList.toggle('collapsed');
          if (badgeBar) badgeBar.classList.toggle('collapsed');
          toggleSearchBtn.innerHTML = isCollapsed ? '收起搜索' : '展开搜索';
          localStorage.setItem('db_search_collapsed', isCollapsed ? '0' : '1');
        });
      }

      // Search & Reset buttons wiring
      var searchBtn = document.getElementById('crmSearchBtn');
      if (searchBtn) {
        searchBtn.onclick = function() {
          DB.page = 1;
          dbFetch();
        };
      }
      var resetBtn = document.getElementById('crmResetBtn');
      if (resetBtn) {
        resetBtn.onclick = function() {
          var nameInp = document.getElementById('dbNameSearch');
          var phoneInp = document.getElementById('dbPhoneSearch');
          var noteInp = document.getElementById('dbNoteSearch');
          var fuzzyInp = document.getElementById('dbFuzzySearch');
          var catSel = document.getElementById('dbCatFilter');
          var batchSel = document.getElementById('dbBatchFilter');

          if (nameInp) nameInp.value = '';
          if (phoneInp) phoneInp.value = '';
          if (noteInp) noteInp.value = '';
          if (fuzzyInp) fuzzyInp.value = '';
          if (catSel) catSel.value = '';
          if (batchSel) batchSel.value = '';
          var dbSearchEl = document.getElementById('dbSearch');
          if (dbSearchEl) dbSearchEl.value = '';

          DB.page = 1;
          dbFetch();
        };
      }

      var searchInputs = [
        document.getElementById('dbNameSearch'),
        document.getElementById('dbPhoneSearch'),
        document.getElementById('dbNoteSearch')
      ];
      searchInputs.forEach(function(inp) {
        if (inp) {
          inp.onkeydown = function(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              DB.page = 1;
              dbFetch();
            }
          };
        }
      });

      // Toolbar action: 添加客户
      var addCustBtn = document.getElementById('crmAddCustBtn');
      if (addCustBtn) {
        addCustBtn.onclick = function() {
          var name = prompt('请输入客户姓名：');
          if (name === null) return;
          name = name.trim();
          if (!name) { alert('姓名不能为空'); return; }
          
          var mobile = prompt('请输入客户手机号：');
          if (mobile === null) return;
          mobile = mobile.trim();
          if (!mobile) { alert('手机号不能为空'); return; }
          
          var company = prompt('请输入客户单位/公司名称（可选）：') || '';
          company = company.trim();
          
          var note = prompt('请输入备注信息（可选）：') || '';
          note = note.trim();
          
          var catOpts = CATS.join(' / ');
          var cat = prompt('请输入客户分类（可选，例如: 意向客户。候选值: ' + catOpts + '）：') || '';
          cat = cat.trim();
          
          addCustBtn.disabled = true;
          addCustBtn.textContent = '添加中...';
          
          fetch('/api/dialer/upload-customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customers: [{
                name: name,
                mobile: mobile,
                company: company,
                note: note
              }],
              batch_label: '手动录入',
              account_id: getOrCreateAccountId()
            })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              if (cat) {
                return fetch('/api/dialer/customers', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    account_id: getOrCreateAccountId(),
                    mobile: mobile,
                    fields: { category: cat }
                  })
                }).then(function(r) { return r.json(); });
              }
              return { success: true };
            } else {
              throw new Error(res.error || '添加失败');
            }
          })
          .then(function(res) {
            if (res.success) {
              alert('添加客户成功！');
              dbFetch();
            } else {
              alert('更新分类失败: ' + (res.error || '未知'));
            }
          })
          .catch(function(err) {
            alert('添加客户出错: ' + err.message);
          })
          .then(function() {
            addCustBtn.disabled = false;
            addCustBtn.textContent = '添加客户';
          });
        };
      }

      // Toolbar action: 添加到待拨打
      var addToDialBtn = document.getElementById('crmAddToDialBtn');
      if (addToDialBtn) {
        addToDialBtn.onclick = function() {
          var selectedMobiles = Object.keys(DB.selectedIds);
          if (selectedMobiles.length === 0) { alert('请先勾选需要添加到待拨打的客户'); return; }

          var addedCount = 0;
          var skippedCooldown = 0;
          var skippedExists = 0;
          var addedMobiles = [];
          selectedMobiles.forEach(function(m) {
            var clientData = DB.allData.find(function(c) { return c.mobile === m; });
            if (clientData) {
              var exists = importedClients.some(function(ic) { return (ic.mobile || ic.phone) === m; });
              if (exists) {
                skippedExists++;
                return;
              }
              if (!canAddToDialList(m)) {
                skippedCooldown++;
                return;
              }
              var parsed = parseCustomerNote(clientData);
              importedClients.push({
                name: clientData.name || '未知',
                phone: clientData.mobile,
                mobile: clientData.mobile,
                company: clientData.company_name || '',
                note: parsed.note,
                custom: parsed.custom,
                fund: clientData.fund || '',
                category: clientData.category || '',
                batch_label: clientData.batch_label || ''
              });
              recordAddToDialList(m);
              addedMobiles.push(m);
              addedCount++;
            }
          });

          if (addedCount > 0) {
            localStorage.setItem(CLIENTS_K, JSON.stringify(importedClients));
            renderDialCards();
            var msg = '成功添加 ' + addedCount + ' 个客户到待拨打列表';
            if (skippedCooldown > 0) msg += '，' + skippedCooldown + ' 个因10天内已添加被跳过';
            if (skippedExists > 0) msg += '，' + skippedExists + ' 个已在列表中';
            alert(msg);
            DB.selectedIds = {};
            var selectAllCb = document.getElementById('crmSelectAll');
            if (selectAllCb) selectAllCb.checked = false;
            dbTable(crmFilterData(DB.allData));
          } else {
            var msg2 = '没有客户被添加';
            if (skippedCooldown > 0) msg2 += '（' + skippedCooldown + ' 个在10天冷却期内）';
            if (skippedExists > 0) msg2 += '（' + skippedExists + ' 个已在列表中）';
            if (skippedCooldown === 0 && skippedExists === 0) msg2 = '选中的客户已在待拨打列表中';
            alert(msg2);
          }
        };
      }

      // Toolbar action: 按分类一键拉取
      var pullFilteredBtn = document.getElementById('crmPullFilteredBtn');
      if (pullFilteredBtn) {
        pullFilteredBtn.onclick = function() {
          var activeTab = DB.activeTab || 'all';
          var catFilter = document.getElementById('dbCatFilter') ? document.getElementById('dbCatFilter').value : '';
          var batchFilter = document.getElementById('dbBatchFilter') ? document.getElementById('dbBatchFilter').value : '';
          
          var category = '';
          if (activeTab && activeTab !== 'all') {
            category = activeTab;
          } else if (catFilter) {
            category = catFilter;
          }
          
          var confirmMsg = '确认从数据库拉取';
          if (category) confirmMsg += '「' + category + '」分类';
          if (batchFilter) confirmMsg += '「' + batchFilter + '」批次';
          if (!category && !batchFilter) confirmMsg += '所有';
          confirmMsg += '的客户到拨号盘吗？(已存在或10天内已添加的将自动跳过，最大拉取5000条)';
          
          if (!confirm(confirmMsg)) return;
          
          pullFilteredBtn.disabled = true;
          pullFilteredBtn.textContent = '拉取中...';
          
          var pullUrl = '/api/dialer/customers?page=1&pageSize=5000&account_id=' + encodeURIComponent(getOrCreateAccountId());
          if (category) pullUrl += '&category=' + encodeURIComponent(category);
          if (batchFilter) pullUrl += '&batch_label=' + encodeURIComponent(batchFilter);
          
          fetch(pullUrl)
            .then(function(r) { return r.json(); })
            .then(function(res) {
              pullFilteredBtn.disabled = false;
              pullFilteredBtn.textContent = '按分类一键拉取';
              if (res.error) {
                alert('拉取失败: ' + res.error);
                return;
              }
              var dbClients = res.data || [];
              if (dbClients.length === 0) {
                alert('数据库中没有找到符合当前分类/筛选的客户记录！');
                return;
              }
              
              var addedCount = 0;
              var skippedCooldown = 0;
              var addedMobiles = [];
              dbClients.forEach(function(c) {
                var m = c.mobile;
                if (!m) return;
                var exists = importedClients.some(function(ic) { return (ic.mobile || ic.phone) === m; });
                if (exists) return;
                if (!canAddToDialList(m)) {
                  skippedCooldown++;
                  return;
                }
                var parsed = parseCustomerNote(c);
                importedClients.push({
                  name: c.name || '未知',
                  phone: c.mobile,
                  mobile: c.mobile,
                  company: c.company_name || '',
                  note: parsed.note,
                  custom: parsed.custom,
                  fund: c.fund || '',
                  category: c.category || '',
                  batch_label: c.batch_label || '',
                  last_operation: c.last_operation || null
                });
                recordAddToDialList(m);
                addedMobiles.push(m);
                addedCount++;
              });

              if (addedCount > 0) {
                localStorage.setItem(CLIENTS_K, JSON.stringify(importedClients));
                renderDialCards();
                updateDashboardVisibility(true);
                var msg = '成功从数据库拉取了 ' + addedCount + ' 个客户到拨号盘列表！';
                if (skippedCooldown > 0) msg += '（' + skippedCooldown + ' 个在10天冷却期内已跳过）';
                alert(msg);
                document.getElementById('dbOverlay').classList.remove('active');
              } else {
                var msg2 = '拉取了 ' + dbClients.length + ' 个客户';
                if (skippedCooldown > 0) msg2 += '，其中 ' + skippedCooldown + ' 个在10天冷却期内';
                msg2 += '已全部存在在拨号盘列表中！';
                alert(msg2);
              }
            })
            .catch(function(err) {
              pullFilteredBtn.disabled = false;
              pullFilteredBtn.textContent = '按分类一键拉取';
              alert('拉取失败: ' + err.message);
            });
        };
      }

      // Toolbar action: 转入意向客户
      var moveIntentBtn = document.getElementById('crmMoveIntentBtn');
      if (moveIntentBtn) {
        moveIntentBtn.onclick = function() {
          var mobiles = Object.keys(DB.selectedIds);
          if (mobiles.length === 0) { alert('请先勾选要转入意向客户的数据'); return; }
          
          if (!confirm('确认将选中的 ' + mobiles.length + ' 个客户转入「意向客户」吗？')) return;
          
          moveIntentBtn.disabled = true;
          moveIntentBtn.textContent = '处理中...';
          
          var promises = mobiles.map(function(m) {
            return fetch('/api/dialer/customers', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                account_id: getOrCreateAccountId(),
                mobile: m,
                fields: { category: '意向客户' }
              })
            }).then(function(r) { return r.json(); });
          });
          
          Promise.all(promises)
          .then(function(results) {
            var successCount = results.filter(function(r) { return r && r.success; }).length;
            alert('操作完成，成功转入意向客户 ' + successCount + ' / ' + mobiles.length + ' 条');
            DB.selectedIds = {};
            var selectAllCb = document.getElementById('crmSelectAll');
            if (selectAllCb) selectAllCb.checked = false;
            dbFetch();
          })
          .catch(function(err) {
            alert('批量转入意向客户出错: ' + err.message);
          })
          .then(function() {
            moveIntentBtn.disabled = false;
            moveIntentBtn.textContent = '转入意向客户';
          });
        };
      }

      // Toolbar action: 转入线索池
      var moveLeadsBtn = document.getElementById('crmMoveLeadsBtn');
      if (moveLeadsBtn) {
        moveLeadsBtn.onclick = function() {
          var mobiles = Object.keys(DB.selectedIds);
          if (mobiles.length === 0) { alert('请先勾选要转入线索池的数据'); return; }
          
          if (!confirm('确认将选中的 ' + mobiles.length + ' 个客户转入「线索池」吗？')) return;
          
          moveLeadsBtn.disabled = true;
          moveLeadsBtn.textContent = '处理中...';
          
          var promises = mobiles.map(function(m) {
            return fetch('/api/dialer/customers', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                account_id: getOrCreateAccountId(),
                mobile: m,
                fields: { category: '潜在客户' }
              })
            }).then(function(r) { return r.json(); });
          });
          
          Promise.all(promises)
          .then(function(results) {
            var successCount = results.filter(function(r) { return r && r.success; }).length;
            alert('操作完成，成功转入线索池 ' + successCount + ' / ' + mobiles.length + ' 条');
            DB.selectedIds = {};
            var selectAllCb = document.getElementById('crmSelectAll');
            if (selectAllCb) selectAllCb.checked = false;
            dbFetch();
          })
          .catch(function(err) {
            alert('批量转入线索池出错: ' + err.message);
          })
          .then(function() {
            moveLeadsBtn.disabled = false;
            moveLeadsBtn.textContent = '转入线索池';
          });
        };
      }

      // Toolbar action: 批量删除
      var batchDeleteBtn = document.getElementById('crmBatchDeleteBtn');
      if (batchDeleteBtn) {
        batchDeleteBtn.onclick = function() {
          var mobiles = Object.keys(DB.selectedIds);
          if (mobiles.length === 0) { alert('请先勾选需要删除的客户'); return; }

          if (!confirm('警告：确认删除选中的 ' + mobiles.length + ' 个客户吗？该操作不可逆，将从数据库彻底移除！')) return;

          // 删除密码验证
          verifyDeletePassword(function() {
            doBatchDelete(mobiles);
          });
        };
      }

      function doBatchDelete(mobiles) {
        var batchDeleteBtn = document.getElementById('crmBatchDeleteBtn');
        batchDeleteBtn.disabled = true;
        batchDeleteBtn.textContent = '删除中...';
          
          fetch('/api/dialer/customers', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobiles: mobiles, account_id: getOrCreateAccountId() })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              alert('成功删除 ' + (res.count || mobiles.length) + ' 个客户！');
              DB.selectedIds = {};
              var selectAllCb = document.getElementById('crmSelectAll');
              if (selectAllCb) selectAllCb.checked = false;
              dbFetch();
            } else {
              alert('删除失败: ' + (res.error || '未知错误'));
            }
          })
          .catch(function(err) {
            alert('删除出错: ' + err.message);
          })
          .then(function() {
            if (batchDeleteBtn) {
              batchDeleteBtn.disabled = false;
              batchDeleteBtn.textContent = '批量删除';
            }
          });
      }

      // Toolbar action: 转入公海
      var movePublicBtn = document.getElementById('crmMovePublicBtn');
      if (movePublicBtn) {
        movePublicBtn.onclick = function() {
          var mobiles = Object.keys(DB.selectedIds);
          if (mobiles.length === 0) { alert('请先勾选要转入公海的数据'); return; }
          
          if (!confirm('确认将选中的 ' + mobiles.length + ' 个客户转入「公海客户」吗？')) return;
          
          movePublicBtn.disabled = true;
          movePublicBtn.textContent = '处理中...';
          
          var promises = mobiles.map(function(m) {
            return fetch('/api/dialer/customers', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                account_id: getOrCreateAccountId(),
                mobile: m,
                fields: { category: '公海客户' }
              })
            }).then(function(r) { return r.json(); });
          });
          
          Promise.all(promises)
          .then(function(results) {
            var successCount = results.filter(function(r) { return r && r.success; }).length;
            alert('操作完成，成功转入公海客户 ' + successCount + ' / ' + mobiles.length + ' 条');
            DB.selectedIds = {};
            var selectAllCb = document.getElementById('crmSelectAll');
            if (selectAllCb) selectAllCb.checked = false;
            dbFetch();
          })
          .catch(function(err) {
            alert('批量转入公海出错: ' + err.message);
          })
          .then(function() {
            movePublicBtn.disabled = false;
            movePublicBtn.textContent = '转入公海';
          });
        };
      }

      // Toolbar action: 添加协助人
      var addHelperBtn = document.getElementById('crmAddHelperBtn');
      if (addHelperBtn) {
        addHelperBtn.onclick = function() {
          var mobiles = Object.keys(DB.selectedIds);
          if (mobiles.length === 0) { alert('请先勾选需要添加协助人的客户'); return; }
          var helper = prompt('请输入协助人姓名：');
          if (helper === null) return;
          helper = helper.trim();
          if (!helper) return;
          
          addHelperBtn.disabled = true;
          
          var promises = mobiles.map(function(m) {
            var clientData = DB.allData.find(function(c) { return c.mobile === m; });
            var oldNote = clientData ? (clientData.note || '') : '';
            var newNote = oldNote + (oldNote ? ' ' : '') + '[协助人: ' + helper + ']';
            return fetch('/api/dialer/customers', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                account_id: getOrCreateAccountId(),
                mobile: m,
                fields: { note: newNote }
              })
            }).then(function(r) { return r.json(); });
          });
          
          Promise.all(promises)
          .then(function() {
            alert('添加协助人成功');
            DB.selectedIds = {};
            var selectAllCb = document.getElementById('crmSelectAll');
            if (selectAllCb) selectAllCb.checked = false;
            dbFetch();
          })
          .catch(function(err) {
            alert('添加协助人失败: ' + err.message);
          })
          .then(function() {
            addHelperBtn.disabled = false;
          });
        };
      }

      // Toolbar action: 取消协助人
      var removeHelperBtn = document.getElementById('crmRemoveHelperBtn');
      if (removeHelperBtn) {
        removeHelperBtn.onclick = function() {
          var mobiles = Object.keys(DB.selectedIds);
          if (mobiles.length === 0) { alert('请先勾选需要取消协助人的客户'); return; }
          
          removeHelperBtn.disabled = true;
          
          var promises = mobiles.map(function(m) {
            var clientData = DB.allData.find(function(c) { return c.mobile === m; });
            var note = clientData ? (clientData.note || '') : '';
            var newNote = note.replace(/\\[协助人:\\s*[^\\]]+\\]/g, '').trim();
            return fetch('/api/dialer/customers', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                account_id: getOrCreateAccountId(),
                mobile: m,
                fields: { note: newNote }
              })
            }).then(function(r) { return r.json(); });
          });
          
          Promise.all(promises)
          .then(function() {
            alert('取消协助人成功');
            DB.selectedIds = {};
            var selectAllCb = document.getElementById('crmSelectAll');
            if (selectAllCb) selectAllCb.checked = false;
            dbFetch();
          })
          .catch(function(err) {
            alert('取消协助人失败: ' + err.message);
          })
          .then(function() {
            removeHelperBtn.disabled = false;
          });
        };
      }

      // Hash trigger: /dialer#db auto-opens
      if(window.location.hash==='#db'){setTimeout(openDBDashboard,300);}
      window.addEventListener('hashchange',function(){if(window.location.hash==='#db'){openDBDashboard();}});

      // Batch category wiring
      var bcpBtn = document.getElementById('dbBatchCatBtn');
      var bcpPanel = document.getElementById('dbBatchCatPanel');
      var bcpSel = document.getElementById('dbBatchCatSel');
      var bcpTarget = document.getElementById('dbCatTargetSel');
      var bcpApply = document.getElementById('dbBatchCatApply');
      var bcpCancel = document.getElementById('dbBatchCatCancel');
      var bcpStatus = document.getElementById('dbBatchCatStatus');

      if (bcpBtn) bcpBtn.addEventListener('click', function() {
        if (bcpPanel.style.display === 'none' || !bcpPanel.style.display) {
          bcpPanel.style.display = 'flex';
          var catOpts = '<option value="">选择分类</option>';
          CATS.forEach(function(c2) { catOpts += '<option value="' + esc(c2) + '">' + esc(c2) + '</option>'; });
          if (bcpTarget) bcpTarget.innerHTML = catOpts;
          if (bcpSel) {
            var bf2 = document.getElementById('dbBatchFilter');
            var opts = '<option value="">选择批次</option>';
            if (bf2) {
              var bfOpts = bf2.querySelectorAll('option');
              bfOpts.forEach(function(o) { if (o.value) opts += '<option value="' + esc(o.value) + '">' + esc(o.textContent) + '</option>'; });
 }
 bcpSel.innerHTML = opts;
 }
 if (bcpStatus) bcpStatus.style.display = 'none';
 } else {
 bcpPanel.style.display = 'none';
 }
 });

 if (bcpCancel) bcpCancel.addEventListener('click', function() { bcpPanel.style.display = 'none'; });

 if (bcpApply) bcpApply.addEventListener('click', function() {
 var batch = bcpSel ? bcpSel.value : '';
 var cat = bcpTarget ? bcpTarget.value : '';
 if (!batch || !cat) { alert('请选择批次和目标分类'); return; }
 if (bcpStatus) { bcpStatus.style.display = 'inline'; bcpStatus.textContent = '更新中...'; bcpStatus.style.color = '#f57c00'; }
 fetch('/api/dialer/customers/batch-category', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ batch_label: batch, category: cat, account_id: getOrCreateAccountId() })
 })
 .then(function(r) { return r.json(); })
 .then(function(d) {
 if (d.success) {
 if (bcpStatus) { bcpStatus.textContent = '已更新 ' + d.updated + ' 条'; bcpStatus.style.color = '#07c160'; }
 bcpPanel.style.display = 'none';
 dbFetch();
 } else {
 if (bcpStatus) { bcpStatus.textContent = '失败: ' + (d.error || '未知'); bcpStatus.style.color = '#e74c3c'; }
 }
 })
 .catch(function(err) {
 if (bcpStatus) { bcpStatus.textContent = '网络错误'; bcpStatus.style.color = '#e74c3c'; }
 });
 });

 // AI 公积金修正
 var aiFundBtn = document.getElementById('dbAiCorrectFundBtn');
 if (aiFundBtn) {
 aiFundBtn.addEventListener('click', function() {
 if (!confirm('即将使用 AI 扫描所有客户记录，检查公积金、单位、备注字段是否存错了位置。\\n\\n' +
 'AI 将逐条判断：\\n' +
 '1. fund 存了公司名称 → 自动移到「单位」字段\\n' +
 '2. company_name 存了纯数字公积金 → 自动移到 fund\\n' +
 '3. fund 和 company_name 存反了 → 互换\\n' +
 '4. note 备注里误存了公司名称 → 自动移到「单位」\\n' +
 '5. fund 是乱码/无意义文字 → 清空\\n' +
 '6. note 备注里含阿拉伯数字（1~49999）→ 自动提取到公积金\\n' +
 '7. 不确定的条目将跳过，不做修改\\n\\n' +
 '仅修改「公积金」「单位」「备注」字段，不影响其他数据。\\n' +
 ' 所有修改按行进行，不会交叉合并数据。\\n\\n' +
 '确认开始 AI 扫描修正？')) {
 return;
 }

 var btn = aiFundBtn;
 var originalText = btn.textContent;
 btn.textContent = 'AI 扫描修正中...';
 btn.disabled = true;

 fetch('/api/admin/ai-correct-fund')
 .then(function(r) { return r.json(); })
 .then(function(res) {
 btn.textContent = originalText;
 btn.disabled = false;

 if (res.success) {
 var msg = 'AI 公积金修正完成\\n\\n';
 msg += '扫描总条数: ' + res.total_scanned + '\\n';
 msg += '发现可疑: ' + res.suspicious_found + ' 条\\n';
 msg += '已修正: ' + res.ai_corrected + ' 条\\n\\n';

 if (res.corrections && res.corrections.length > 0) {
 msg += '修正详情（最多显示 20 条）：\\n';
 var maxShow = Math.min(res.corrections.length, 20);
 for (var i = 0; i< maxShow; i++) {
                    var c = res.corrections[i];
                    if (c.action === 'move_fund_to_company') {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': fund「' + c.old_fund + '」→ 单位「' + c.new_company_name + '」\\n';
                    } else if (c.action === 'move_company_to_fund') {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': 单位「' + c.old_company_name + '」→ fund「' + c.new_fund + '」\\n';
                    } else if (c.action === 'swap') {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': fund「' + c.old_fund + '」⇄ 单位「' + c.old_company_name + '」互换\\n';
                    } else if (c.action === 'move_note_to_company') {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': note「' + c.old_note + '」→ 单位「' + c.new_company_name + '」\\n';
                    } else if (c.action === 'clear_fund') {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': fund「' + c.old_fund + '」→ 已清空\\n';
                    } else if (c.action === 'move_note_number_to_fund') {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': note 数字「' + c.fund_value + '」→ fund\\n';
                    } else {
                      msg += '  ' + (i+1) + '. ' + c.mobile + ': ' + c.action + '\\n';
                    }
                  }
                  if (res.corrections.length > 20) {
                    msg += '  ... 还有 ' + (res.corrections.length - 20) + ' 条（共 ' + res.corrections.length + ' 条）\\n';
                  }
                }

                if (res.errors && res.errors.length > 0) {
                  msg += '\\n错误（' + res.errors.length + ' 条）：\\n';
                  var maxErr = Math.min(res.errors.length, 5);
                  for (var e = 0; e < maxErr; e++) {
                    msg += '  ' + res.errors[e] + '\\n';
                  }
                }

                alert(msg);
                dbFetch(); // 刷新数据
              } else {
                alert('AI 修正失败: ' + (res.error || '未知错误'));
              }
            })
            .catch(function(err) {
              btn.textContent = originalText;
              btn.disabled = false;
              alert('网络错误: ' + err.message);
            });
        });
      }

      // Reassign selected customers to sub-account (master only)
      var reassignBtn = document.getElementById('crmReassignBtn');
      if (reassignBtn) {
        reassignBtn.addEventListener('click', function() {
          var selectedMobiles = Object.keys(DB.selectedIds);
          if (selectedMobiles.length === 0) { alert('请先勾选要分配的客户'); return; }
          var targetSel = document.getElementById('crmReassignSel');
          var targetId = targetSel ? targetSel.value : '';
          if (!targetId) { alert('请选择目标子账户'); return; }
          var targetName = targetSel.options[targetSel.selectedIndex].text;
          if (!confirm('将 ' + selectedMobiles.length + ' 条客户分配给「' + targetName + '」？')) return;

          reassignBtn.disabled = true;
          reassignBtn.textContent = '分配中...';
          fetch('/api/dialer/customers/reassign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobiles: selectedMobiles, target_account_id: targetId })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              var msg = '已分配 ' + res.updated + ' 条客户';
              if (res.selected !== undefined && res.found !== undefined) {
                msg = '勾选 ' + res.selected + ' 条，找到 ' + res.found + ' 条，成功分配 ' + res.updated + ' 条';
              }
              alert(msg);
              DB.selectedIds = {};
              dbFetch();
              loadAccountStats();
            } else {
              alert('分配失败: ' + (res.error || '未知错误'));
            }
          })
          .catch(function(err) { alert('网络错误: ' + err.message); })
          .finally(function() { reassignBtn.disabled = false; reassignBtn.textContent = '分配'; });
        });
      }
    }

  function initHeaderMenu() {
      var menuBtn = document.getElementById('headerMenuBtn');
      var dropdown = document.getElementById('headerDropdown');
      
      if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'flex';
          } else {
            dropdown.style.display = 'none';
          }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
          if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        });

        // Also close dropdown when selecting any option inside it
        dropdown.querySelectorAll('.dropdown-item').forEach(function(item) {
          item.addEventListener('click', function() {
            dropdown.style.display = 'none';
          });
        });
      }
    }

    function initNoteModal() {
      var modal = document.getElementById('noteModal');
      var closeBtn = document.getElementById('closeNoteModalBtn');
      if (modal && closeBtn) {
        closeBtn.addEventListener('click', function() {
          modal.classList.remove('active');
        });
        modal.addEventListener('click', function(e) {
          if (e.target === this) {
            modal.classList.remove('active');
          }
        });
      }
    }

    function initAccountSettings() {
      updateAccountDisplay();
      var accBtn = document.getElementById('accountSettingsBtn');
      if (accBtn) {
        accBtn.addEventListener('click', function() {
          if (window.showAccountSettings) window.showAccountSettings();
        });
      }
      var modal = document.getElementById('accountSettingsModal');
      if (!modal) return;
      var closeBtn = document.getElementById('closeAccountSettingsBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() { modal.classList.remove('active'); });
      }
      modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.classList.remove('active');
      });

      // Save label
      var saveBtn = document.getElementById('saveAccountSettingsBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var labelInput = document.getElementById('accountLabelInput');
          if (labelInput) {
            var label = labelInput.value.trim();
            setAccountLabel(label);
            localStorage.setItem(SESS_LABEL_K, label);
          }
          updateAccountDisplay();
          modal.classList.remove('active');
        });
      }

      // Logout
      var logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
          clearSession();
          modal.classList.remove('active');
          location.reload();
        });
      }

      // Create sub-account
      var createSubBtn = document.getElementById('createSubAccountBtn');
      if (createSubBtn) {
        createSubBtn.addEventListener('click', function() {
          var accountName = document.getElementById('subAccountNameInput').value.trim();
          var pin = document.getElementById('subAccountPinInput').value.trim();
          var error = document.getElementById('subAccountError');
          if (!accountName) { error.textContent = '请输入账户名'; return; }
          if (pin.length < 4) { error.textContent = 'PIN 至少 4 位'; return; }

          createSubBtn.disabled = true;
          createSubBtn.textContent = '创建中...';
          fetch('/api/dialer/auth/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_name: accountName, pin: pin, label: accountName })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              document.getElementById('subAccountNameInput').value = '';
              document.getElementById('subAccountPinInput').value = '';
              error.textContent = '';
              loadSubAccounts();
            } else {
              error.textContent = res.error || '创建失败';
            }
          })
          .catch(function() { error.textContent = '网络错误'; })
          .finally(function() { createSubBtn.disabled = false; createSubBtn.textContent = '创建'; });
        });
      }

      // Change PIN
      var changePinBtn = document.getElementById('changePinBtn');
      if (changePinBtn) {
        changePinBtn.addEventListener('click', function() {
          var oldPin = document.getElementById('changePinOld').value.trim();
          var newPin = document.getElementById('changePinNew').value.trim();
          var error = document.getElementById('changePinError');
          error.style.color = '#e74c3c';
          if (!oldPin) { error.textContent = '请输入当前 PIN'; return; }
          if (newPin.length < 4) { error.textContent = '新 PIN 至少 4 位'; return; }

          changePinBtn.disabled = true;
          changePinBtn.textContent = '修改中...';

          fetch('/api/dialer/auth/change-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_pin: oldPin, new_pin: newPin })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              error.style.color = '#07c160';
              error.textContent = 'PIN 修改成功';
              document.getElementById('changePinOld').value = '';
              document.getElementById('changePinNew').value = '';
              setTimeout(function() { error.textContent = ''; error.style.color = '#e74c3c'; }, 3000);
            } else {
              error.textContent = res.error || '修改失败';
            }
          })
          .catch(function() { error.textContent = '网络错误'; })
          .finally(function() { changePinBtn.disabled = false; changePinBtn.textContent = '修改'; });
        });
      }

      // Reset all accounts
      var resetBtn = document.getElementById('resetAccountsBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          if (!confirm('确定要删除所有账户数据吗？此操作不可撤销，所有账户、PIN 码和子账户将被清除。')) return;
          resetBtn.disabled = true;
          resetBtn.textContent = '重置中...';
          fetch('/api/dialer/auth/reset', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function() {
              clearSession();
              modal.classList.remove('active');
              location.reload();
            })
            .catch(function() {
              document.getElementById('resetAccountsError').textContent = '重置失败，请重试';
            })
            .finally(function() {
              resetBtn.disabled = false;
              resetBtn.textContent = '重置所有账户数据';
            });
        });
      }
    }

    function loadSubAccounts() {
      var list = document.getElementById('subAccountList');
      if (!list) return;
      fetch('/api/dialer/auth/accounts')
        .then(function(r) { return r.json(); })
        .then(function(res) {
          var myId = getSessionAccountId();
          var subs = (res.accounts || []).filter(function(a) { return !a.is_master; });
          if (subs.length === 0) {
            list.innerHTML = '<div style="font-size:0.68rem; color:var(--text-light); text-align:center; padding:8px;">暂无子账户</div>';
          } else {
            list.innerHTML = subs.map(function(s) {
              var activeTag = s.active ? '' : ' [已禁用]';
              return '<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:var(--btn-bg); border-radius:4px;' + (s.active ? '' : 'opacity:0.5;') + '">'
                + '<span style="font-size:0.72rem; font-weight:700; color:var(--text-main);">' + (s.account_name || s.label || s.account_id.slice(0,12)) + activeTag + '</span>'
                + '<div style="display:flex; gap:3px;">'
                + '<button class="sub-toggle-btn" data-id="' + s.account_id + '" data-active="' + (s.active ? '1' : '0') + '" style="font-size:0.58rem; padding:2px 6px; border:1px solid var(--card-border); border-radius:3px; background:var(--card-bg); color:' + (s.active ? '#e74c3c' : '#07c160') + '; cursor:pointer; font-weight:700;">' + (s.active ? '禁用' : '启用') + '</button>'
                + '<button class="sub-delete-btn" data-id="' + s.account_id + '" style="font-size:0.58rem; padding:2px 6px; border:1px solid var(--card-border); border-radius:3px; background:var(--card-bg); color:#e74c3c; cursor:pointer; font-weight:700;">删除</button>'
                + '</div>'
                + '</div>';
            }).join('');

            // Wire up toggle buttons
            list.querySelectorAll('.sub-toggle-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var id = btn.dataset.id;
                var active = btn.dataset.active === '1';
                btn.disabled = true;
                btn.textContent = '...';
                fetch('/api/dialer/auth/accounts', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ target_account_id: id, active: !active })
                })
                .then(function(r) { return r.json(); })
                .then(function() { loadSubAccounts(); })
                .catch(function() { btn.disabled = false; btn.textContent = active ? '禁用' : '启用'; });
              });
            });

            // Wire up delete buttons
            list.querySelectorAll('.sub-delete-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var id = btn.dataset.id;
                if (!confirm('确定删除子账户 ' + id.slice(0, 12) + ' 吗？该操作不可撤销。')) return;
                btn.disabled = true;
                btn.textContent = '...';
                fetch('/api/dialer/auth/accounts', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ target_account_id: id })
                })
                .then(function(r) { return r.json(); })
                .then(function() { loadSubAccounts(); })
                .catch(function() { btn.disabled = false; btn.textContent = '删除'; });
              });
            });
          }
        });
    }

    window.showAccountSettings = function() {
      var modal = document.getElementById('accountSettingsModal');
      if (!modal) return;
      document.getElementById('accountIdDisplay').textContent = getOrCreateAccountId();
      document.getElementById('accountLabelInput').value = getAccountLabel();

      // Show/hide master section
      var masterSection = document.getElementById('accountMasterSection');
      if (masterSection) {
        if (isSessionMaster()) {
          masterSection.style.display = 'block';
          loadSubAccounts();
        } else {
          masterSection.style.display = 'none';
        }
      }
      var resetSection = document.getElementById('accountResetSection');
      if (resetSection) {
        resetSection.style.display = isSessionMaster() ? 'block' : 'none';
      }

      modal.classList.add('active');
    };

    // ========== Auth Flow ==========

    function initAuth() {
      var token = getSessionToken();
      var aid = getSessionAccountId();
      if (token && aid) {
        // Have session — silently verify, proceed either way
        fetch('/api/dialer/auth/accounts')
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.accounts) {
              // Valid — proceed
              showAppShell();
              updateAccountDisplay();
            } else {
              // Invalid — clear and show login
              clearSession();
              showAuthScreen();
            }
          })
          .catch(function() {
            // Network error — proceed with cached session
            showAppShell();
            updateAccountDisplay();
          });
      } else {
        showAuthScreen();
      }
    }

    function showAppShell() {
      var appShell = document.querySelector('.app-shell');
      if (appShell) appShell.style.display = '';
      document.getElementById('authLoginOverlay').classList.add('auth-hidden');
      document.getElementById('authSetupOverlay').classList.add('auth-hidden');
    }

    function showAuthScreen() {
      document.querySelector('.app-shell').style.display = 'none';
      fetch('/api/dialer/auth/status', { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (res.has_accounts) {
            showLoginOverlay();
          } else {
            showSetupOverlay();
          }
        })
        .catch(function() {
          showLoginOverlay();
        });
    }

    function showLoginOverlay() {
      document.getElementById('authSetupOverlay').classList.add('auth-hidden');
      var overlay = document.getElementById('authLoginOverlay');
      overlay.classList.remove('auth-hidden');

      var accountInput = document.getElementById('authLoginAccountName');
      var pinInput = document.getElementById('authLoginPin');
      var error = document.getElementById('authLoginError');
      var loginBtn = document.getElementById('authLoginBtn');

      accountInput.value = '';
      pinInput.value = '';
      error.textContent = '';
      loginBtn.disabled = false;

      loginBtn.onclick = doLogin;
      pinInput.onkeypress = function(e) { if (e.key === 'Enter') doLogin(); };
      accountInput.onkeypress = function(e) { if (e.key === 'Enter') { pinInput.focus(); } };

      document.getElementById('authShowSetupLink').onclick = function() {
        overlay.classList.add('auth-hidden');
        showSetupOverlay();
      };
    }

    function doLogin() {
      var accountInput = document.getElementById('authLoginAccountName');
      var pinInput = document.getElementById('authLoginPin');
      var error = document.getElementById('authLoginError');
      var loginBtn = document.getElementById('authLoginBtn');
      var accountName = accountInput.value.trim();
      var pin = pinInput.value.trim();

      if (!accountName) { error.textContent = '请输入账户名'; return; }
      if (pin.length < 4) { error.textContent = '请输入完整 PIN 码'; return; }

      loginBtn.disabled = true;
      loginBtn.textContent = '登录中...';

      fetch('/api/dialer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: accountName, pin: pin })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success) {
          saveSession(res);
          showAppShell();
          updateAccountDisplay();
        } else {
          error.textContent = res.error || '登录失败';
          pinInput.value = '';
          pinInput.focus();
        }
      })
      .catch(function() {
        error.textContent = '网络错误，请重试';
      })
      .finally(function() {
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
      });
    }

    function showSetupOverlay() {
      document.getElementById('authLoginOverlay').classList.add('auth-hidden');
      var overlay = document.getElementById('authSetupOverlay');
      overlay.classList.remove('auth-hidden');

      document.getElementById('authSetupName').value = '';
      document.getElementById('authSetupLabel').value = '';
      document.getElementById('authSetupPin').value = '';
      document.getElementById('authSetupPinConfirm').value = '';
      document.getElementById('authSetupError').textContent = '';

      document.getElementById('authSetupBtn').onclick = doSetup;
      document.getElementById('authSetupPinConfirm').onkeypress = function(e) {
        if (e.key === 'Enter') doSetup();
      };

      document.getElementById('authShowLoginLink').onclick = function() {
        overlay.classList.add('auth-hidden');
        showAuthScreen();
      };
    }

    function doSetup() {
      var accountName = document.getElementById('authSetupName').value.trim();
      var label = document.getElementById('authSetupLabel').value.trim();
      var pin = document.getElementById('authSetupPin').value.trim();
      var pinConfirm = document.getElementById('authSetupPinConfirm').value.trim();
      var error = document.getElementById('authSetupError');
      var btn = document.getElementById('authSetupBtn');

      if (!accountName) { error.textContent = '请输入账户名'; return; }
      if (pin.length < 4) { error.textContent = 'PIN 码至少需要 4 位'; return; }
      if (pin !== pinConfirm) { error.textContent = '两次输入不一致'; return; }

      btn.disabled = true;
      btn.textContent = '创建中...';

      fetch('/api/dialer/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: accountName, pin: pin, label: label })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success) {
          saveSession(res);
          showAppShell();
          updateAccountDisplay();
        } else {
          error.textContent = res.error || '创建失败';
        }
      })
      .catch(function() {
        error.textContent = '网络错误，请重试';
      })
      .finally(function() {
        btn.disabled = false;
        btn.textContent = '创建主账户';
      });
    }

    // Hide app shell on load (auth will show it after login)
    (function() {
      var appShell = document.querySelector('.app-shell');
      if (appShell) appShell.style.display = 'none';
    })();

    function safeInit(name, fn) {
      try { fn(); } catch (e) { console.error('Init error: ' + name, e); }
    }
    safeInit('initAuth', initAuth);
    safeInit('initDark', initDark);
    safeInit('initFileInputs', initFileInputs);
    safeInit('initCallControls', initCallControls);
    safeInit('initFilters', initFilters);
    safeInit('initDataActions', initDataActions);

    safeInit('initHeaderMenu', initHeaderMenu);
    safeInit('initNoteModal', initNoteModal);
    safeInit('initCustomColumnsHandlers', initCustomColumnsHandlers);
    safeInit('initAIImporter', initAIImporter);
    safeInit('loadPersistedState', loadPersistedState);
    safeInit('initCustViewer', initCustViewer);
    safeInit('initAccountSettings', initAccountSettings);

    safeInit('initDialerTemplateBtn', function() {
      var btn = document.getElementById('dialerTemplateBtn');
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var wb = XLSX.utils.book_new();
          var data = [
            ['姓名', '电话', '单位', '公积金', '备注', '跟进情况'],
            ['示例：张三', '13800138000', '示例科技有限公司', '月缴2000', '意向客户，需跟进', '已电话沟通'],
            ['示例：李四', '13900139000', '测试企业集团', '月缴3000', '对公积金贷款感兴趣', '待回访'],
          ];
          var ws = XLSX.utils.aoa_to_sheet(data);
          ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 25 }, { wch: 20 }];
          XLSX.utils.book_append_sheet(wb, ws, '客户导入模板');
          XLSX.writeFile(wb, '客户导入模板.xlsx');
        });
      }
    });

  })();
  </script>

</body>
</html>`;
