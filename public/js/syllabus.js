const Syllabus = (() => {
  const FALLBACK_SYLLABUS = [
    { ch: 1, title: '自动控制系统的基本概念', pts: ['自动控制系统的基本原理', '开环/闭环控制系统', '闭环系统的组成与基本环节', '系统类型', '基本性能要求'] },
    { ch: 2, title: '自动控制系统的数学模型', pts: ['傅里叶变换与拉普拉斯变换', '时域数学模型', '频域数学模型', '结构图与信号流图'] },
    { ch: 3, title: '线性系统的时域分析法', pts: ['时域性能指标', '一阶/二阶系统分析', '高阶系统分析', '稳定性分析', '稳态误差计算'] },
    { ch: 4, title: '线性系统的根轨迹法', pts: ['根轨迹基本概念', '根轨迹绘制方法', '广义根轨迹', '基于根轨迹的性能分析'] },
    { ch: 5, title: '线性系统的频域分析法', pts: ['频率特性及表示法', '典型环节与开环频率特性', '频域稳定判据', '频域稳定裕度', '闭环频域性能指标'] },
    { ch: 6, title: '控制系统的校正与综合', pts: ['校正的一般概念', '常用校正装置及特性', '串联校正'] },
  ];

  const FALLBACK_EXAM = {
    initial: ['101思想政治理论', '204英语（二）', '302数学（二）', '864自动控制原理（自命题，含微机原理及单片机技术和控制工程）'],
    major: ['《自动控制原理基础教程》第四版，胡寿松，科学出版社，2017（大纲主用）', '《自动控制原理》第七版，胡寿松，科学出版社，2019（补充）', '《自动控制原理》第二版，吴麒等，清华大学出版社，2016（补充视角）'],
    retest: ['《C程序设计》第五版，谭浩强，清华大学出版社，2017', '《计算机控制系统》第二版，李华，机械工业出版社，2017'],
  };

  let _syllabus = [];
  let _exam = {};
  let _progress = {};

  // 同样修复：等服务器数据真正回来后再渲染，而不是先用本地缓存渲染、
  // 服务器数据到了也不刷新页面
  async function loadProgress() {
    try {
      _progress = JSON.parse(localStorage.getItem('kaoyan-syllabus-progress') || '{}');
    } catch (e) { _progress = {}; }
    try {
      const data = await API.getSyllabusProgress();
      if (data && typeof data === 'object') {
        Object.assign(_progress, data);
        localStorage.setItem('kaoyan-syllabus-progress', JSON.stringify(_progress));
      }
    } catch (e) { /* 拉取失败就先用本地缓存 */ }
  }

  function saveProgress() {
    localStorage.setItem('kaoyan-syllabus-progress', JSON.stringify(_progress));
    API.saveSyllabusProgress(_progress).catch(() => {});
  }

  function toggleChap(ch) {
    _progress[ch] = !_progress[ch];
    saveProgress();
    const el = document.getElementById('panel-syllabus');
    if (el) el.innerHTML = render();
  }

  async function init() {
    await loadProgress();
    try {
      const data = await API.getSyllabus();
      _syllabus = data.syllabus || FALLBACK_SYLLABUS;
      _exam = data.exam || FALLBACK_EXAM;
    } catch (e) {
      _syllabus = FALLBACK_SYLLABUS;
      _exam = FALLBACK_EXAM;
    }
    const el = document.getElementById('panel-syllabus');
    if (el) { el.innerHTML = render(); }
  }

  function render() {
    const done = _syllabus.filter(c => _progress[c.ch]).length;
    const pct = _syllabus.length > 0 ? Math.round(done / _syllabus.length * 100) : 0;
    const c = 'var(--major)';
    const sm = SUBJ_MAP['专业课'] || { color: 'var(--text-muted)', bg: 'var(--bg)', text: 'var(--text-secondary)' };
    const re = SUBJ_MAP['复试'] || { color: 'var(--text-muted)', bg: 'var(--bg)', text: 'var(--text-secondary)' };

    let h = `<div class="card">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${sm.color}" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">广州大学 085406 控制工程 · 初试科目</span>
      </div>
      <div class="card-body" style="font-size:13px;color:var(--text-secondary);line-height:2">`;
    _exam.initial.forEach(sub => { h += `<div>${sub}</div>`; });
    h += `</div></div>`;

    h += `<div class="card">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${sm.color}" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">864 自动控制原理 · 章节进度</span>
        <span style="font-size:12px;color:var(--text-muted)">${done}/${_syllabus.length}</span>
      </div>
      <div style="padding:0 16px 12px">
        <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%;background:${sm.color}"></div></div>
      </div>
      <div style="padding:0 16px 16px">`;
    _syllabus.forEach(c => {
      const d = !!_progress[c.ch];
      h += `<div class="chap-row" onclick="Syllabus.toggleChap(${c.ch})" style="cursor:pointer;${d ? 'opacity:0.55' : ''}">
        <input type="checkbox" ${d ? 'checked' : ''} onclick="event.stopPropagation();Syllabus.toggleChap(${c.ch})" style="accent-color:${sm.color}">
        <div>
          <div class="chap-title" style="${d ? 'text-decoration:line-through' : ''}">第${c.ch}章　${c.title}</div>
          <div class="chap-sub">${c.pts.join(' · ')}</div>
        </div>
      </div>`;
    });
    h += `</div></div>`;

    h += `<div class="card">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${sm.color}" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">指定教材</span>
      </div>
      <div class="card-body" style="font-size:13px;color:var(--text-secondary)">`;
    _exam.major.forEach(b => { h += `<div class="res-item">${Utils.esc(b)}</div>`; });
    h += `</div></div>`;

    h += `<div class="card">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${re.color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:${re.text}">复试科目参考书</span>
      </div>
      <div class="card-body" style="font-size:13px;color:var(--text-secondary)">`;
    _exam.retest.forEach(b => { h += `<div class="res-item">${Utils.esc(b)}</div>`; });
    h += `</div></div>`;

    return h;
  }

  return { init, render, toggleChap };
})();