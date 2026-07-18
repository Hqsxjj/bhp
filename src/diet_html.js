// 减肥打卡 - HTML 页面（无需认证，直接进入）
export const DIET_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover">
  <title>减肥打卡</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icon.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --card: linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,240,245,0.4) 40%, rgba(245,225,255,0.35) 100%);
      --card-border: rgba(255,140,180,0.35);
      --text: #3d2d3d;
      --text2: #6b5a6b;
      --text3: #9b8a9b;
      --accent: #f0a0c0;
      --accent2: #c888e0;
      --accent-gradient: linear-gradient(135deg, #f8a0c8 0%, #d08ae8 50%, #a8a0f0 100%);
      --red: #e05060;
      --radius: 14px;
      --radius-sm: 10px;
      --wallpaper-url: '';
    }
    body.dark {
      --card: linear-gradient(160deg, rgba(35,25,35,0.55) 0%, rgba(30,20,30,0.45) 40%, rgba(25,20,30,0.4) 100%);
      --card-border: rgba(200,120,180,0.25);
      --text: #e0d0e0;
      --text2: #b0a0b0;
      --text3: #807080;
    }
    html, body { height: 100%; width: 100%; font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei UI", sans-serif; font-weight: 600; color: var(--text); }

    /* Wallpaper */
    .wallpaper-bg {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;
      background-image: var(--wallpaper-url);
      background-size: cover; background-position: center;
      opacity: 0.5; transition: opacity 0.8s;
    }
    body.dark .wallpaper-bg { opacity: 0.25; }

    /* Main container */
    .main-container {
      position: relative; z-index: 1;
      padding: 16px; max-width: 720px; margin: 0 auto;
      min-height: 100%;
    }

    /* Header */
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 1.3rem; font-weight: 900; flex: 1; color: var(--text); }
    .header .date { font-size: 0.78rem; color: var(--text2); font-weight: 700; }
    .header .day-badge {
      background: rgba(255,255,255,0.5); backdrop-filter: blur(8px);
      color: #d08ae8; font-size: 0.75rem; font-weight: 800;
      padding: 4px 10px; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.3);
    }
    body.dark .header .day-badge { background: rgba(255,255,255,0.1); }
    .header .lock-btn, .header .settings-btn {
      height: 30px; border: none; padding: 0 12px;
      background: var(--card); backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 15px; font-size: 0.72rem; cursor: pointer; font-weight: 700;
      color: var(--text2); box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid var(--card-border);
      text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
    }

    /* Frosted glass cards */
    .card {
      background: var(--card); backdrop-filter: blur(16px) saturate(160%);
      -webkit-backdrop-filter: blur(16px) saturate(160%);
      border: 1px solid var(--card-border);
      border-radius: var(--radius); padding: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      margin-bottom: 14px;
    }
    .card-label { font-size: 0.72rem; color: var(--text2); font-weight: 700; margin-bottom: 6px; letter-spacing: 0.5px; }
    .card-value { font-size: 1.6rem; font-weight: 900; }
    .card-sub { font-size: 0.72rem; color: var(--text2); margin-top: 4px; }
    .card-change { font-size: 0.8rem; font-weight: 800; }
    .card-change.down { color: #d08ae8; }
    .card-change.up { color: var(--red); }

    /* Row layouts */
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 0; }
    .row4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 0; }

    /* Weight input */
    .weight-input-row { display: flex; gap: 8px; margin-top: 10px; }
    .weight-input-row input {
      flex: 1; height: 38px; padding: 0 12px; font-size: 0.9rem; font-weight: 700;
      border: 2px solid rgba(255,180,210,0.5); border-radius: 18px;
      background: rgba(255,255,255,0.55); backdrop-filter: blur(8px);
      color: #5c3d5c; outline: none;
    }
    .weight-input-row input:focus { border-color: rgba(255,130,180,0.8); box-shadow: 0 0 20px rgba(255,150,200,0.2), 0 0 0 4px rgba(255,180,210,0.08); }
    body.dark .weight-input-row input { background: rgba(40,25,40,0.5); border-color: rgba(180,100,160,0.4); color: #e0d0e0; }
    .weight-input-row button {
      padding: 0 16px; height: 38px; background: var(--accent-gradient); color: #fff;
      border: none; border-radius: 22px; font-weight: 800; font-size: 0.82rem; cursor: pointer;
      box-shadow: 0 4px 16px rgba(210,130,200,0.3);
    }

    /* Progress bar */
    .progress-bar { height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; margin-top: 6px; }
    body.dark .progress-bar { background: rgba(255,255,255,0.08); }
    .progress-fill { height: 100%; background: var(--accent-gradient); border-radius: 4px; transition: width 0.5s; }
    .progress-text { font-size: 0.75rem; color: var(--text2); font-weight: 700; }

    /* Metric cards */
    .metric-card {
      background: var(--card); backdrop-filter: blur(14px) saturate(150%);
      -webkit-backdrop-filter: blur(14px) saturate(150%);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm); padding: 14px; text-align: center;
      cursor: pointer; transition: 0.15s;
      box-shadow: 0 1px 6px rgba(0,0,0,0.03);
    }
    .metric-card:hover { border-color: rgba(0,0,0,0.15); transform: translateY(-1px); }
    .metric-title { font-size: 0.7rem; color: var(--text2); font-weight: 700; margin-bottom: 8px; }
    .metric-val { font-size: 0.85rem; font-weight: 900; color: var(--text); }
    .metric-sub { font-size: 0.65rem; color: var(--text3); margin-top: 2px; font-weight: 600; }

    /* Tasks */
    .task-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
    body.dark .task-item { border-color: rgba(255,255,255,0.04); }
    .task-item:last-child { border-bottom: none; }
    .task-item input[type=checkbox] { width: 20px; height: 20px; accent-color: #d08ae8; cursor: pointer; flex-shrink: 0; }
    .task-item label { flex: 1; font-size: 0.85rem; cursor: pointer; color: var(--text); }
    .task-item input:checked + label { text-decoration: line-through; color: var(--text3); }

    /* Notes */
    .notes-area {
      width: 100%; min-height: 60px; padding: 12px; font-size: 0.85rem; font-weight: 600;
      border: 2px solid rgba(255,180,210,0.5); border-radius: 18px;
      background: rgba(255,255,255,0.55); backdrop-filter: blur(8px);
      color: #5c3d5c; resize: vertical; outline: none; line-height: 1.6; font-family: inherit;
    }
    body.dark .notes-area { background: rgba(40,25,40,0.5); border-color: rgba(180,100,160,0.4); color: #e0d0e0; }
    .notes-area:focus { border-color: rgba(255,130,180,0.8); box-shadow: 0 0 20px rgba(255,150,200,0.15); }

    /* Check-in button */
    .checkin-btn { width: 100%; height: 48px; background: var(--accent-gradient); color: #fff; border: none; border-radius: 22px; font-size: 1rem; font-weight: 800; cursor: pointer; transition: all 0.3s; letter-spacing: 4px; margin-top: 8px; box-shadow: 0 6px 24px rgba(210,130,200,0.35), 0 0 40px rgba(200,150,220,0.1); }
    .checkin-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(210,130,200,0.45), 0 0 50px rgba(200,150,220,0.18); }
    .checkin-btn:active { transform: scale(0.97); box-shadow: 0 4px 16px rgba(210,130,200,0.3); }
    .checkin-btn.done { background: #c0c0c0; cursor: default; box-shadow: none; }
    .checkin-btn.done:hover { transform: none; box-shadow: none; }

    /* Modal */
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; visibility: hidden; opacity: 0; transition: 0.2s; }
    .modal.show { visibility: visible; opacity: 1; }
    .modal-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: var(--radius); padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 16px 48px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.3); }
    body.dark .modal-card { background: rgba(30,30,30,0.9); border-color: rgba(255,255,255,0.08); }
    .modal-card h2 { font-size: 1.1rem; margin-bottom: 16px; }
    .modal-card label { display: block; font-size: 0.78rem; color: var(--text2); font-weight: 700; margin-bottom: 4px; margin-top: 10px; }
    .modal-card input { width: 100%; height: 40px; padding: 0 12px; font-size: 0.9rem; font-weight: 700; border: 2px solid rgba(255,180,210,0.5); border-radius: 18px; background: rgba(255,255,255,0.6); color: #5c3d5c; outline: none; margin-bottom: 6px; }
    body.dark .modal-card input { background: rgba(40,25,40,0.5); border-color: rgba(180,100,160,0.4); color: #e0d0e0; }
    .modal-card input:focus { border-color: rgba(255,130,180,0.8); box-shadow: 0 0 20px rgba(255,150,200,0.15); }
    .modal-card button { width: 100%; height: 42px; background: var(--accent-gradient); color: #fff; border: none; border-radius: 22px; font-size: 0.9rem; font-weight: 800; cursor: pointer; margin-top: 8px; letter-spacing: 2px; box-shadow: 0 4px 16px rgba(210,130,200,0.3); }

    /* Calendar */
    .cal-card { margin-bottom: 14px; }
    .cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .cal-head button { width: 28px; height: 28px; border: none; background: rgba(255,255,255,0.5); backdrop-filter: blur(8px); border-radius: 50%; font-size: 0.9rem; cursor: pointer; color: var(--text2); font-weight: 700; border: 1px solid var(--card-border); }
    .cal-head .cal-title { font-size: 0.9rem; font-weight: 900; color: var(--text); }
    .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.65rem; font-weight: 800; color: var(--text3); margin-bottom: 4px; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .cal-day { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; border-radius: 8px; cursor: pointer; color: var(--text); transition: 0.15s; position: relative; }
    .cal-day:hover { background: rgba(255,255,255,0.3); }
    .cal-day.other-month { color: var(--text3); opacity: 0.4; }
    .cal-day.today { background: var(--accent-gradient); color: #fff; font-weight: 900; }
    .cal-day.checked { background: rgba(200,130,220,0.2); }
    .cal-day.today.checked { background: var(--accent-gradient); }
    .cal-dot { width: 5px; height: 5px; border-radius: 50%; background: #d08ae8; margin-top: 1px; }
    .cal-day.today .cal-dot { background: rgba(255,255,255,0.7); }

    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(30,30,30,0.85); backdrop-filter: blur(10px); color: #fff; padding: 10px 24px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; z-index: 200; opacity: 0; transition: 0.3s; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); }
    body.dark .toast { background: rgba(255,255,255,0.85); color: #111; }
    .toast.show { opacity: 1; }

    @media (max-width: 500px) {
      .row2, .row4 { grid-template-columns: 1fr 1fr; }
      body { padding: 0; }
      .main-container { padding: 10px; }
      .card { padding: 12px; }
      .card-value { font-size: 1.3rem; }
    }

    /* ===== Desktop landscape fullscreen ===== */
    @media (min-width: 900px) {
      html, body { overflow: hidden; }
      .main-container {
        max-width: none;
        padding: 16px 24px;
        height: 100vh;
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 16px;
      }
      .header { grid-column: 1 / -1; margin-bottom: 0; }
      .cal-card { margin-bottom: 0; }
      #mainContent {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      #mainContent::-webkit-scrollbar { width: 4px; }
      #mainContent::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
      body.dark #mainContent::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
      .card-value { font-size: 1.8rem; }
      .row2 { gap: 18px; }
      .row4 { gap: 14px; }
      /* Prevent the last element's margin from creating extra scroll */
      #mainContent > :last-child { margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="wallpaper-bg" id="wallpaperBg"></div>

  <div class="main-container">
    <div class="header">
      <h1>减肥打卡</h1>
      <span class="date" id="headerDate"></span>
      <span class="day-badge" id="headerDay"></span>
      <a href="/" class="lock-btn" title="锁屏返回">锁屏</a>
      <button class="settings-btn" id="settingsBtn" title="设置">设置</button>
    </div>

    <!-- Monthly Calendar -->
    <div class="card cal-card">
      <div class="cal-head">
        <button id="calPrevBtn">◀</button>
        <span class="cal-title" id="calTitle"></span>
        <button id="calNextBtn">▶</button>
      </div>
      <div class="cal-weekdays">
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>
      <div class="cal-grid" id="calGrid"></div>
    </div>

    <div id="mainContent"></div>
  </div>

  <!-- Settings Modal -->
  <div class="modal" id="settingsModal">
    <div class="modal-card">
      <h2>打卡设置</h2>
      <label>起始体重 (kg)</label>
      <input type="number" id="cfgStartWeight" placeholder="90.0" step="0.1" min="30" max="300">
      <label>目标体重 (kg)</label>
      <input type="number" id="cfgTargetWeight" placeholder="72.0" step="0.1" min="30" max="300">
      <label>开始日期</label>
      <input type="date" id="cfgStartDate">
      <label>每日饮水目标 (ml)</label>
      <input type="number" id="cfgWaterGoal" placeholder="3000" step="100" min="500" max="10000">
      <button id="saveSettingsBtn">保存设置</button>
      <button style="background:#e5e5e5;color:#555;margin-top:4px;" id="closeSettingsBtn">取消</button>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    var todayData = null;
    var config = null;

    // Load wallpaper from same source as main app
    (function loadWallpaper() {
      var bg = document.getElementById('wallpaperBg');
      var cached = localStorage.getItem('diet_wp_url');
      var cachedTs = parseInt(localStorage.getItem('diet_wp_ts') || '0');
      if (cached && (Date.now() - cachedTs < 3600000)) {
        document.body.style.setProperty('--wallpaper-url', 'url(' + cached + ')');
        bg.style.backgroundImage = 'url(' + cached + ')';
      }
      // Try multiple anime wallpaper APIs
      var apis = [
        'https://api.waifu.pics/sfw/waifu',
        'https://api.loliapi.com/acg/pe?type=json',
        'https://www.dmoe.cc/random.php?ret=json'
      ];
      function tryApi(i) {
        if (i >= apis.length) return;
        fetch(apis[i]).then(function(r) { return r.json(); })
          .then(function(j) {
            var url = j.url || j.img || j.pic;
            if (url) {
              document.body.style.setProperty('--wallpaper-url', 'url(' + url + ')');
              bg.style.backgroundImage = 'url(' + url + ')';
              localStorage.setItem('diet_wp_url', url);
              localStorage.setItem('diet_wp_ts', Date.now());
            }
          }).catch(function() { tryApi(i + 1); });
      }
      tryApi(0);
    })();

    function todayKey() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    var calYear, calMonth, monthlyData = {};
    var viewDate = null; // non-null when viewing a past day

    function fetchData() {
      var dateKey = viewDate || todayKey();
      fetch('/api/diet/data?date=' + dateKey)
        .then(function(r) { return r.json(); })
        .then(function(j) {
          todayData = j.data || {};
          config = j.config || {};
          render();
        });
      var d = new Date();
      if (!calYear) { calYear = d.getFullYear(); calMonth = d.getMonth() + 1; }
      loadMonthData();
    }

    function loadMonthData() {
      var m = String(calMonth).padStart(2, '0');
      fetch('/api/diet/monthly?month=' + calYear + '-' + m)
        .then(function(r) { return r.json(); })
        .then(function(j) {
          monthlyData = j.days || {};
          renderCalendar();
        });
    }

    function renderCalendar() {
      document.getElementById('calTitle').textContent = calYear + '年' + calMonth + '月';
      var grid = document.getElementById('calGrid');
      var today = new Date();
      var firstDay = new Date(calYear, calMonth - 1, 1).getDay();
      var daysInMonth = new Date(calYear, calMonth, 0).getDate();
      var daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();
      var html = '';

      for (var i = firstDay - 1; i >= 0; i--) {
        var pd = daysInPrevMonth - i;
        html += '<div class="cal-day other-month"><span>' + pd + '</span></div>';
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var key = calYear + '-' + String(calMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isToday = (d === today.getDate() && calMonth === today.getMonth() + 1 && calYear === today.getFullYear());
        var cls = 'cal-day';
        if (isToday) cls += ' today';
        if (monthlyData[key]) cls += ' checked';
        html += '<div class="' + cls + '" data-date="' + key + '">';
        html += '<span>' + d + '</span>';
        if (monthlyData[key]) html += '<div class="cal-dot"></div>';
        html += '</div>';
      }

      var remaining = 7 - ((firstDay + daysInMonth) % 7);
      if (remaining < 7) {
        for (var d = 1; d <= remaining; d++) {
          html += '<div class="cal-day other-month"><span>' + d + '</span></div>';
        }
      }

      grid.innerHTML = html;

      var days = grid.querySelectorAll('.cal-day:not(.other-month)');
      for (var i = 0; i < days.length; i++) {
        days[i].addEventListener('click', function() {
          var dateKey = this.getAttribute('data-date');
          viewDate = dateKey;
          fetchData();
        });
      }
    }

    function saveData(data) {
      var dateKey = viewDate || todayKey();
      return fetch('/api/diet/data', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({date: dateKey, data: data})
      });
    }

    function saveConfig(cfg) {
      return fetch('/api/diet/config', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(cfg)
      });
    }

    function toast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function(){ t.classList.remove('show'); }, 2000);
    }

    function render() {
      var d = todayData || {};
      var cfg = config || {};
      var startDate = cfg.startDate || '2026-01-01';
      var tk = viewDate || todayKey();
      var day = dayNumber(startDate, tk);
      var startWt = parseFloat(cfg.startWeight) || 48;
      var targetWt = parseFloat(cfg.targetWeight) || 45;
      var todayWt = parseFloat(d.weight) || 0;
      var yesterdayWt = parseFloat(d.yesterdayWeight) || 0;
      var lostWt = startWt - todayWt;
      var totalToLose = startWt - targetWt;
      var progressPct = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((lostWt / totalToLose) * 100))) : 0;
      var waterGoal = parseInt(cfg.waterGoal) || 3000;
      var waterMl = parseInt(d.waterMl) || 0;
      var calories = parseInt(d.calories) || 0;
      var exerciseMin = parseInt(d.exerciseMin) || 0;
      var sleepHr = parseFloat(d.sleepHr) || 0;
      var notes = d.notes || '';
      var tasks = d.tasks || defaultTasks();
      var completed = d.completed || false;
      var completedAt = d.completedAt || '';
      var weightChange = todayWt && yesterdayWt ? (todayWt - yesterdayWt).toFixed(1) : null;
      var isDown = weightChange !== null && parseFloat(weightChange) < 0;
      var isUp = weightChange !== null && parseFloat(weightChange) > 0;

      document.getElementById('headerDate').textContent = tk;
      document.getElementById('headerDay').textContent = '第' + day + '天';
      if (viewDate && viewDate !== todayKey()) {
        document.getElementById('headerDate').style.color = 'var(--accent)';
        document.getElementById('headerDate').style.cursor = 'pointer';
        document.getElementById('headerDate').title = '点击返回今天';
        document.getElementById('headerDate').onclick = function() { viewDate = null; fetchData(); };
      } else {
        document.getElementById('headerDate').style.color = '';
        document.getElementById('headerDate').style.cursor = '';
        document.getElementById('headerDate').title = '';
        document.getElementById('headerDate').onclick = null;
      }

      var html = '';

      html += '<div class="row2">';
      html += '<div class="card"><div class="card-label">今日目标</div>';
      html += '<div class="card-value">' + (todayWt || '--') + '<span style="font-size:0.7rem;font-weight:600;color:var(--text3);"> kg</span></div>';
      html += '<div class="card-sub">目标：' + targetWt + ' kg | 已减：' + (lostWt > 0 ? lostWt.toFixed(1) : '0.0') + ' kg</div>';
      html += '</div>';

      html += '<div class="card"><div class="card-label">今日体重</div>';
      if (todayWt) {
        html += '<div class="card-value">' + todayWt + '<span style="font-size:0.7rem;font-weight:600;color:var(--text3);"> kg</span></div>';
        html += '<div class="card-sub">昨日：' + (yesterdayWt || '--') + ' kg';
        if (weightChange !== null) {
          html += ' | <span class="card-change ' + (isDown ? 'down' : (isUp ? 'up' : '')) + '">' + (parseFloat(weightChange) >= 0 ? '+' : '') + weightChange + ' kg</span>';
        }
        html += '</div>';
      } else {
        html += '<div class="card-value" style="color:var(--text3);">-- kg</div>';
        html += '<div class="card-sub">还没有记录</div>';
      }
      html += '<div class="weight-input-row">';
      html += '<input type="number" id="weightInput" placeholder="输入今日体重" step="0.1" min="30" max="300">';
      html += '<button id="saveWeightBtn">记录</button>';
      html += '</div></div></div>';

      // Progress
      html += '<div class="card">';
      html += '<div style="display:flex;justify-content:space-between;"><span class="progress-text">完成进度</span><span class="progress-text" style="font-weight:900;">' + progressPct + '%</span></div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progressPct + '%;"></div></div></div>';

      // Metrics
      html += '<div class="row4">';
      html += metricCard('饮水', (waterMl || '--') + '/' + waterGoal + 'ml', (waterMl >= waterGoal ? '达标' : ''), 'waterCard');
      html += metricCard('饮食', calories ? calories + ' kcal' : '--', '[记录]', 'dietCard');
      html += metricCard('运动', exerciseMin ? exerciseMin + ' 分钟' : '--', '[记录]', 'exerciseCard');
      html += metricCard('睡眠', sleepHr ? sleepHr + ' 小时' : '--', '[记录]', 'sleepCard');
      html += '</div>';

      // Tasks
      html += '<div class="card">';
      html += '<div class="card-label" style="margin-bottom:10px;">今日任务</div>';
      for (var i = 0; i < tasks.length; i++) {
        html += '<div class="task-item">';
        html += '<input type="checkbox" id="task' + i + '" ' + (tasks[i].done ? 'checked' : '') + ' onchange="toggleTask(' + i + ')">';
        html += '<label for="task' + i + '">' + escHtml(tasks[i].name) + '</label>';
        html += '</div>';
      }
      html += '</div>';

      // Notes
      html += '<div class="card">';
      html += '<div class="card-label">今日备注</div>';
      html += '<textarea class="notes-area" id="notesArea" placeholder="记录今天的感受...">' + escHtml(notes) + '</textarea>';
      html += '</div>';

      // Check-in
      html += '<button class="checkin-btn' + (completed ? ' done' : '') + '" id="checkinBtn">' + (completed ? ('今日已打卡 — ' + completedAt) : '完成今日打卡') + '</button>';

      document.getElementById('mainContent').innerHTML = html;

      var saveWtBtn = document.getElementById('saveWeightBtn');
      if (saveWtBtn) {
        saveWtBtn.addEventListener('click', function() {
          var wt = parseFloat(document.getElementById('weightInput').value);
          if (!wt || wt < 30 || wt > 300) { toast('请输入有效体重 (30-300 kg)'); return; }
          todayData = todayData || {};
          todayData.weight = wt;
          saveData(todayData).then(function() { toast('体重已记录'); fetchData(); });
        });
      }
      var notesArea = document.getElementById('notesArea');
      if (notesArea) {
        var notesTimer = null;
        notesArea.addEventListener('input', function() {
          clearTimeout(notesTimer);
          notesTimer = setTimeout(function() {
            todayData = todayData || {};
            todayData.notes = notesArea.value;
            saveData(todayData);
          }, 500);
        });
      }
      var checkinBtn = document.getElementById('checkinBtn');
      if (checkinBtn && !completed) {
        checkinBtn.addEventListener('click', function() {
          todayData = todayData || {};
          todayData.completed = true;
          todayData.completedAt = new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
          saveData(todayData).then(function() { toast('今日打卡完成！'); fetchData(); });
        });
      }
      bindMetricClick('waterCard', 'waterMl', '饮水 (ml)');
      bindMetricClick('dietCard', 'calories', '饮食热量 (kcal)');
      bindMetricClick('exerciseCard', 'exerciseMin', '运动时长 (分钟)');
      bindMetricClick('sleepCard', 'sleepHr', '睡眠时长 (小时)');
    }

    function metricCard(title, val, sub, id) {
      return '<div class="metric-card" id="' + id + '"><div class="metric-title">' + title + '</div><div class="metric-val">' + val + '</div><div class="metric-sub">' + sub + '</div></div>';
    }

    function bindMetricClick(id, field, label) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function() {
        var current = (todayData && todayData[field]) ? todayData[field] : '';
        var val = prompt(label, current);
        if (val === null) return;
        val = parseFloat(val);
        if (isNaN(val) || val < 0) { toast('请输入有效数值'); return; }
        todayData = todayData || {};
        todayData[field] = val;
        saveData(todayData).then(function() { toast('已保存'); fetchData(); });
      });
    }

    window.toggleTask = function(i) {
      todayData = todayData || {};
      var tasks = todayData.tasks || defaultTasks();
      tasks[i].done = !tasks[i].done;
      todayData.tasks = tasks;
      saveData(todayData).then(function() { fetchData(); });
    };

    function defaultTasks() {
      return [
        {name: '晨起称重', done: false},
        {name: '饮水达到目标', done: false},
        {name: '完成运动', done: false},
        {name: '控制饮食', done: false},
        {name: '23:00前睡觉', done: false}
      ];
    }

    function dayNumber(startDate, dateKey) {
      var s = new Date(startDate + 'T00:00:00');
      var d = new Date(dateKey + 'T00:00:00');
      return Math.floor((d - s) / 86400000) + 1;
    }

    function escHtml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Calendar navigation
    document.getElementById('calPrevBtn').addEventListener('click', function() {
      calMonth--; if (calMonth < 1) { calMonth = 12; calYear--; }
      loadMonthData();
    });
    document.getElementById('calNextBtn').addEventListener('click', function() {
      calMonth++; if (calMonth > 12) { calMonth = 1; calYear++; }
      loadMonthData();
    });

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', function() {
      var cfg = config || {};
      document.getElementById('cfgStartWeight').value = cfg.startWeight || '';
      document.getElementById('cfgTargetWeight').value = cfg.targetWeight || '';
      document.getElementById('cfgTargetWeight').value = cfg.targetWeight || '';
      document.getElementById('cfgStartDate').value = cfg.startDate || '';
      document.getElementById('cfgWaterGoal').value = cfg.waterGoal || '3000';
      document.getElementById('settingsModal').classList.add('show');
    });
    document.getElementById('closeSettingsBtn').addEventListener('click', function() {
      document.getElementById('settingsModal').classList.remove('show');
    });
    document.getElementById('saveSettingsBtn').addEventListener('click', function() {
      var cfg = {
        startWeight: parseFloat(document.getElementById('cfgStartWeight').value) || 48,
        targetWeight: parseFloat(document.getElementById('cfgTargetWeight').value) || 45,
        startDate: document.getElementById('cfgStartDate').value || '2026-01-01',
        waterGoal: parseInt(document.getElementById('cfgWaterGoal').value) || 2000
      };
      saveConfig(cfg).then(function() {
        document.getElementById('settingsModal').classList.remove('show');
        toast('设置已保存');
        fetchData();
      });
    });

    // Dark mode
    var dm = localStorage.getItem('diet_dark');
    if (dm === '1') document.body.classList.add('dark');

    fetchData();
  </script>
</body>
</html>`;
