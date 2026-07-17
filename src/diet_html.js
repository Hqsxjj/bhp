// 减肥打卡 - HTML 页面（无需认证，直接进入）
export const DIET_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover">
  <title>减肥打卡</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #f0f4f0;
      --card: #ffffff;
      --card-border: rgba(0,0,0,0.06);
      --text: #1a1a1a;
      --text2: #555;
      --text3: #888;
      --green: #10b981;
      --green-bg: #ecfdf5;
      --blue: #3b82f6;
      --blue-bg: #eff6ff;
      --orange: #f59e0b;
      --orange-bg: #fffbeb;
      --purple: #8b5cf6;
      --purple-bg: #f5f3ff;
      --red: #ef4444;
      --radius: 14px;
      --radius-sm: 10px;
    }
    body.dark {
      --bg: #111;
      --card: #1c1c1c;
      --card-border: rgba(255,255,255,0.08);
      --text: #e5e5e5;
      --text2: #999;
      --text3: #666;
      --green-bg: #064e3b;
      --blue-bg: #1e3a5f;
      --orange-bg: #3d2e0a;
      --purple-bg: #2d1f4e;
    }
    html, body { height: 100%; width: 100%; background: var(--bg); font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei UI", sans-serif; font-weight: 600; color: var(--text); }
    body { padding: 16px; max-width: 720px; margin: 0 auto; }

    /* Header */
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 1.3rem; font-weight: 900; flex: 1; }
    .header .date { font-size: 0.78rem; color: var(--text2); font-weight: 700; }
    .header .day-badge { background: var(--green-bg); color: var(--green); font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; }
    .header .settings-btn { width: 32px; height: 32px; border: none; background: var(--card); border-radius: 50%; font-size: 1rem; cursor: pointer; color: var(--text2); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

    /* Cards */
    .card { background: var(--card); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .card-label { font-size: 0.72rem; color: var(--text3); font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-value { font-size: 1.6rem; font-weight: 900; }
    .card-sub { font-size: 0.72rem; color: var(--text2); margin-top: 4px; }
    .card-change { font-size: 0.8rem; font-weight: 800; }
    .card-change.down { color: var(--green); }
    .card-change.up { color: var(--red); }

    /* Row layouts */
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .row4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }

    /* Weight input */
    .weight-input-row { display: flex; gap: 8px; margin-top: 10px; }
    .weight-input-row input { flex: 1; height: 38px; padding: 0 12px; font-size: 0.9rem; font-weight: 700; border: 1.5px solid #d0d0d0; border-radius: 8px; background: #fff; color: #111; outline: none; }
    .weight-input-row input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    body.dark .weight-input-row input { background: #2a2a2a; border-color: #444; color: #ddd; }
    .weight-input-row button { padding: 0 16px; height: 38px; background: var(--green); color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.82rem; cursor: pointer; }

    /* Progress bar */
    .progress-wrap { margin-bottom: 10px; }
    .progress-bar { height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; margin-top: 6px; }
    body.dark .progress-bar { background: rgba(255,255,255,0.08); }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 4px; transition: width 0.5s; }
    .progress-text { font-size: 0.75rem; color: var(--text2); font-weight: 700; }

    /* Metric cards */
    .metric-card { background: var(--card); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 14px; text-align: center; cursor: pointer; transition: 0.15s; }
    .metric-card:hover { border-color: rgba(0,0,0,0.15); }
    .metric-icon { font-size: 1.2rem; margin-bottom: 4px; }
    .metric-title { font-size: 0.7rem; color: var(--text3); font-weight: 700; margin-bottom: 6px; }
    .metric-val { font-size: 0.85rem; font-weight: 900; color: var(--text); }
    .metric-sub { font-size: 0.65rem; color: var(--text3); margin-top: 2px; font-weight: 600; }

    /* Tasks */
    .task-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
    body.dark .task-item { border-color: rgba(255,255,255,0.04); }
    .task-item:last-child { border-bottom: none; }
    .task-item input[type=checkbox] { width: 20px; height: 20px; accent-color: var(--green); cursor: pointer; flex-shrink: 0; }
    .task-item label { flex: 1; font-size: 0.85rem; cursor: pointer; color: var(--text); }
    .task-item input:checked + label { text-decoration: line-through; color: var(--text3); }

    /* Notes */
    .notes-area { width: 100%; min-height: 60px; padding: 12px; font-size: 0.85rem; font-weight: 600; border: 1.5px solid #d0d0d0; border-radius: 8px; background: #fff; color: #111; resize: vertical; outline: none; line-height: 1.6; font-family: inherit; }
    body.dark .notes-area { background: #2a2a2a; border-color: #444; color: #ddd; }
    .notes-area:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

    /* Check-in button */
    .checkin-btn { width: 100%; height: 48px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 12px; font-size: 1rem; font-weight: 900; cursor: pointer; transition: 0.2s; letter-spacing: 1px; margin-top: 8px; }
    .checkin-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(16,185,129,0.3); }
    .checkin-btn:active { transform: translateY(0); }
    .checkin-btn.done { background: #d0d0d0; cursor: default; }
    .checkin-btn.done:hover { transform: none; box-shadow: none; }

    /* Settings modal */
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 100; display: flex; align-items: center; justify-content: center; visibility: hidden; opacity: 0; transition: 0.2s; }
    .modal.show { visibility: visible; opacity: 1; }
    .modal-card { background: #fff; border-radius: var(--radius); padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 16px 48px rgba(0,0,0,0.2); }
    body.dark .modal-card { background: #1c1c1c; }
    .modal-card h2 { font-size: 1.1rem; margin-bottom: 16px; }
    .modal-card label { display: block; font-size: 0.78rem; color: var(--text2); font-weight: 700; margin-bottom: 4px; margin-top: 10px; }
    .modal-card input { width: 100%; height: 40px; padding: 0 12px; font-size: 0.9rem; font-weight: 700; border: 1.5px solid #d0d0d0; border-radius: 8px; background: #fff; color: #111; outline: none; margin-bottom: 6px; }
    body.dark .modal-card input { background: #2a2a2a; border-color: #444; color: #ddd; }
    .modal-card input:focus { border-color: var(--green); }
    .modal-card button { width: 100%; height: 42px; background: var(--green); color: #fff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 800; cursor: pointer; margin-top: 8px; }

    .empty-state { text-align: center; padding: 40px 20px; color: var(--text3); }
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #fff; padding: 10px 24px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; z-index: 200; opacity: 0; transition: 0.3s; pointer-events: none; }
    body.dark .toast { background: #eee; color: #111; }
    .toast.show { opacity: 1; }

    @media (max-width: 500px) {
      .row2, .row4 { grid-template-columns: 1fr 1fr; }
      body { padding: 10px; }
      .card { padding: 12px; }
      .card-value { font-size: 1.3rem; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>减肥打卡</h1>
    <span class="date" id="headerDate"></span>
    <span class="day-badge" id="headerDay"></span>
    <button class="settings-btn" id="settingsBtn" title="设置">⚙</button>
  </div>

  <div id="mainContent"></div>

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

    function todayKey() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    function fetchData() {
      fetch('/api/diet/data?date=' + todayKey())
        .then(function(r) { return r.json(); })
        .then(function(j) {
          todayData = j.data || {};
          config = j.config || {};
          render();
        });
    }

    function saveData(data) {
      return fetch('/api/diet/data', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({date: todayKey(), data: data})
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
      var tk = todayKey();
      var day = dayNumber(startDate, tk);
      var startWt = parseFloat(cfg.startWeight) || 90;
      var targetWt = parseFloat(cfg.targetWeight) || 72;
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
      document.getElementById('headerDay').textContent = 'Day ' + day;

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
      html += '<div class="card progress-wrap">';
      html += '<div style="display:flex;justify-content:space-between;"><span class="progress-text">今日完成进度</span><span class="progress-text" style="font-weight:900;">' + progressPct + '%</span></div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progressPct + '%;"></div></div></div>';

      // Metrics
      html += '<div class="row4">';
      html += metricCard('💧', '饮水', (waterMl || '--') + '/' + waterGoal + 'ml', (waterMl >= waterGoal ? '达标' : ''), 'waterCard');
      html += metricCard('🍽', '饮食', calories ? calories + ' kcal' : '--', '[记录]', 'dietCard');
      html += metricCard('🏃', '运动', exerciseMin ? exerciseMin + ' 分钟' : '--', '[记录]', 'exerciseCard');
      html += metricCard('😴', '睡眠', sleepHr ? sleepHr + ' 小时' : '--', '[记录]', 'sleepCard');
      html += '</div>';

      // Tasks
      html += '<div class="card" style="margin-bottom:10px;">';
      html += '<div class="card-label" style="margin-bottom:10px;">今日任务</div>';
      for (var i = 0; i < tasks.length; i++) {
        html += '<div class="task-item">';
        html += '<input type="checkbox" id="task' + i + '" ' + (tasks[i].done ? 'checked' : '') + ' onchange="toggleTask(' + i + ')">';
        html += '<label for="task' + i + '">' + escHtml(tasks[i].name) + '</label>';
        html += '</div>';
      }
      html += '</div>';

      // Notes
      html += '<div class="card" style="margin-bottom:10px;">';
      html += '<div class="card-label">今日备注</div>';
      html += '<textarea class="notes-area" id="notesArea" placeholder="记录今天的感受...">' + escHtml(notes) + '</textarea>';
      html += '</div>';

      // Check-in
      html += '<button class="checkin-btn' + (completed ? ' done' : '') + '" id="checkinBtn">' + (completed ? ('今日已打卡 — ' + completedAt) : '完成今日打卡') + '</button>';

      document.getElementById('mainContent').innerHTML = html;

      // Bind events
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

    function metricCard(icon, title, val, sub, id) {
      return '<div class="metric-card" id="' + id + '"><div class="metric-icon">' + icon + '</div><div class="metric-title">' + title + '</div><div class="metric-val">' + val + '</div><div class="metric-sub">' + sub + '</div></div>';
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

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', function() {
      var cfg = config || {};
      document.getElementById('cfgStartWeight').value = cfg.startWeight || '';
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
        startWeight: parseFloat(document.getElementById('cfgStartWeight').value) || 90,
        targetWeight: parseFloat(document.getElementById('cfgTargetWeight').value) || 72,
        startDate: document.getElementById('cfgStartDate').value || '2026-01-01',
        waterGoal: parseInt(document.getElementById('cfgWaterGoal').value) || 3000
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

    // Init
    fetchData();
  </script>
</body>
</html>`;
