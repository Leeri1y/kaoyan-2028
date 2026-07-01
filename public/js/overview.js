const Overview = (() => {
  const COLORS = ['#2563eb', '#7c3aed', '#d69e2e', '#dc2626', '#6d28d9'];
  const BGS = ['#eff6ff', '#f5f3ff', '#fffbeb', '#fef2f2', '#faeeda'];
  const TEXTS = ['#1d4ed8', '#6d28d9', '#92400e', '#b91c1c', '#a5720a'];

  let _phases = [];
  let _expandedPhase = 1;

  const FALLBACK_PHASES = [
    { id: 1, name: '地基期', period: '2027.7-12', months: 6, goal: '打牢基础', tip: '每天保证6-8小时学习，数学和英语是重点，专业课至少确定参考书目。政治暂不启动。', tasks: [
      { s: '数学', l: '武忠祥基础课 + 高数上下册一轮课后习题，建立完整知识框架' },
      { s: '英语', l: '墨墨背单词50个/天 + 田静长难句 + 阅读真题2篇/周' },
      { s: '专业课', l: '下载广州大学085406考试大纲，确定参考书，精读教材第一章' }
    ] },
    { id: 2, name: '强化期', period: '2028.1-6', months: 6, goal: '全面强化', tip: '每天8-10小时，数学进入强化阶段，专业课系统学习，政治开始入门。', tasks: [
      { s: '数学', l: '张宇强化班 + 李永乐复习全书 + 660题' },
      { s: '英语', l: '每日30词 + 阅读真题精做4篇/周 + 翻译练习' },
      { s: '专业课', l: '自动控制原理教材精读 + 课后习题全部做完' },
      { s: '政治', l: '徐涛强化班 + 肖秀荣精讲精练通读一遍' }
    ] },
    { id: 3, name: '冲刺期', period: '2028.7-10', months: 4, goal: '真题冲刺', tip: '每天10-12小时，全科真题是核心，政治要开始背诵，专业课回归真题。', tasks: [
      { s: '数学', l: '真题计时2.5h/套 + 李林6套卷 + 错题本反复看' },
      { s: '英语', l: '全题型计时140min + 大小作文模板各5篇' },
      { s: '专业课', l: '目标院校真题反复做3遍以上 + 公式默写' },
      { s: '政治', l: '肖秀荣1000题每天45min + 腿姐背诵手册' }
    ] },
    { id: 4, name: '收尾期', period: '2028.11-考前', months: 2, goal: '查漏补缺', tip: '回归基础，调整作息，政治大题全力背诵，数学保持手感。', tasks: [
      { s: '数学', l: '模拟卷隔天一套保手感 + 公式速记本' },
      { s: '英语', l: '作文模板默写 + 真题单词快速回顾' },
      { s: '专业课', l: '真题错题回顾 + 公式/概念默写' },
      { s: '政治', l: '肖四必背 + 腿姐冲刺班 + 时政热点' }
    ] },
    { id: 5, name: '复试备考', period: '2029.1-3', months: 3, goal: '复试冲刺', tip: '初试后立即启动复试准备，C语言编程+计算机控制是重点，联系导师、准备面试。', tasks: [
      { s: '专业课', l: 'C程序设计（谭浩强）教材+课后题全部过一遍' },
      { s: '专业课', l: '计算机控制系统教材精读，重点：采样控制、数字PID' },
      { s: '复试', l: '准备中英文自我介绍、研究计划、常见面试问题' },
      { s: '复试', l: '联系导师、阅读导师论文、了解研究方向' }
    ] }
  ];

  async function loadPhases() {
    try { _phases = await API.getPhases(); } catch (e) { _phases = FALLBACK_PHASES; }
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
    try {
      _phases = await API.getPhases();
    } catch (e) {
      _phases = FALLBACK_PHASES;
    }
    if (el) el.innerHTML = render();
  }

  return { init, render, togglePhase };
})();
