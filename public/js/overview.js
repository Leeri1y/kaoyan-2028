const Overview = (() => {
  const COLORS = ['#3d5a80', '#6b5b7e', '#a17f4a', '#a15353', '#564865'];
  const BGS = ['#eef1f5', '#f0edf2', '#f8f5ee', '#f5eeee', '#f4ede1'];
  const TEXTS = ['#2f4763', '#564865', '#6b552f', '#7d3f3f', '#7a6039'];

  let _phases = [];
  let _expandedPhase = 1;
  let _loadError = false;

  async function loadPhases() {
    try { _phases = await API.getPhases(); _loadError = false; } catch (e) { _phases = []; _loadError = true; }
  }

  function renderBar(pid) {
    let h = '<div class="phase-bar">';
    _phases.forEach((p, i) => {
      const ac = p.id === pid;
      const pa = p.id < pid;
      const bg = ac ? COLORS[i % COLORS.length] : pa ? COLORS[i % COLORS.length] + 'cc' : '#d1d5db';
      const ct = (ac || pa) ? 'white' : '#6b7280';
      h += `<div class="phase-seg" style="flex:${p.months};background:${bg};color:${ct}" onclick="Overview.togglePhase(${p.id})">
        <div style="font-size:11px;font-weight:600">${p.name}</div>
        <div style="font-size:9px;opacity:0.75;margin-top:1px">${p.months}个月</div>
      </div>`;
    });
    h += '</div>';
    return h;
  }

  function renderRing(pct, color) {
    const r = 22, circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return `<div class="progress-ring">
      <svg viewBox="0 0 60 60">
        <circle class="ring-bg" cx="30" cy="30" r="${r}"/>
        <circle class="ring-fg" cx="30" cy="30" r="${r}" stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
      </svg>
      <span class="ring-label" style="color:${color}">${pct}%</span>
    </div>`;
  }

  function renderPhase(p, i, cur) {
    const exp = _expandedPhase === p.id;
    const c = COLORS[i % COLORS.length], bg = BGS[i % BGS.length];
    let h = `<div class="card" style="${cur ? 'border-color:' + c + '66' : ''}">
      <div class="card-header" onclick="Overview.togglePhase(${p.id})" style="${exp ? 'background:' + bg : ''}">
        <div class="phase-num" style="background:${c}">${p.id}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:var(--text)">第${p.id}阶段：${p.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px">${p.period} · ${p.goal}</div>
        </div>`;
    if (cur) h += `<span class="cur-badge" style="background:${c}">当前阶段</span>`;
    h += `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);flex-shrink:0;transition:transform 0.2s;${exp?'transform:rotate(180deg)':''}"><polyline points="6 9 12 15 18 9"/></svg>
      </div>`;
    if (exp) {
      h += `<div class="card-body">
        <div class="section-label">每日任务建议</div>`;
      (p.tasks || []).forEach(t => {
        const sc = SUBJ_MAP[t.s] || { color: 'var(--text-muted)', bg: 'var(--bg)', text: 'var(--text-secondary)' };
        h += `<div class="task-row" style="border-left-color:${sc.color}">
          <span class="task-badge" style="background:${sc.bg};color:${sc.text}">${t.s}</span>
          <span class="task-text">${Utils.esc(t.l)}</span>
        </div>`;
      });
      if (p.tip) {
        h += `<div class="info-box"><strong style="color:var(--text)">时间建议：</strong>${p.tip}</div>`;
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  function renderStats(pid) {
    const totalTasks = _phases.reduce((sum, p) => sum + (p.tasks ? p.tasks.length : 0), 0);
    const p = _phases.find(x => x.id === pid) || _phases[0];
    const pct = p ? Math.round((p.id / _phases.length) * 100) : 0;
    const c = COLORS[(pid - 1) % COLORS.length];
    return `<div class="stats-row">
      <div class="stat-card">
        <div class="stat-number" style="color:${c}">${_phases.length}</div>
        <div class="stat-label">复习阶段</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:${c}">${pid}</div>
        <div class="stat-label">当前阶段</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="font-size:14px;color:${c}">${p ? p.period : '–'}</div>
        <div class="stat-label">阶段时间</div>
      </div>
      <div class="stat-card" style="display:flex;align-items:center;gap:12px;justify-content:center">
        ${renderRing(pct, c)}
        <div style="text-align:left">
          <div class="stat-number" style="font-size:15px;color:${c}">${p ? p.goal : '–'}</div>
          <div class="stat-label">阶段目标</div>
        </div>
      </div>
    </div>`;
  }

  function render() {
    if (_loadError) {
      return `<div class="info-box">暂时无法连接服务器，阶段计划加载失败。<br>
        <span style="cursor:pointer;color:var(--primary);text-decoration:underline" onclick="Overview.init()">点击重试</span></div>`;
    }
    if (!_phases.length) return '<div class="info-box">正在加载阶段计划…</div>';
    const pid = Utils.phaseForDate(Utils.getToday());
    let h = renderStats(pid);
    h += renderBar(pid);
    _phases.forEach((p, i) => {
      h += renderPhase(p, i, p.id === pid);
    });
    return h;
  }

  function togglePhase(id) {
    _expandedPhase = _expandedPhase === id ? 0 : id;
    const el = document.getElementById('panel-overview');
    if (el) el.innerHTML = render();
  }

  async function init() {
    const el = document.getElementById('panel-overview');
    if (el) el.innerHTML = '<div class="loading-placeholder" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">加载阶段计划…</div>';
    await loadPhases();
    if (el) el.innerHTML = render();
  }

  return { init, render, togglePhase };
})();
