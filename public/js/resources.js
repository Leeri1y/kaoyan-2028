const Resources = (() => {
  const COLORS = ['#2563eb', '#7c3aed', '#d69e2e', '#dc2626'];
  const BGS = ['#eff6ff', '#f5f3ff', '#fffbeb', '#fef2f2'];

  let _phases = [];
  let _apps = [];
  let _expanded = 1;

  const FALLBACK_PHASES = [
    { id: 1, name: '地基期 (7-12月)', period: '打基础阶段', res: {
      '数学': { b: ['高等数学（同济版）', '汤家凤1800题基础篇', '武忠祥基础篇讲义'], v: ['武忠祥高数基础班', '汤家凤零基础班'] },
      '英语': { b: ['考研英语词汇（红宝书/恋练有词）', '田静长难句解密', '张剑黄皮书基础版'], v: ['田静语法课', '唐迟阅读方法论'] },
      '专业课': { b: ['目标院校推荐参考书', '自动控制原理（胡寿松）'], v: ['B站/慕课搜院校名称+专业'] }
    }},
    { id: 2, name: '强化期 (1-6月)', period: '系统强化阶段', res: {
      '数学': { b: ['李永乐复习全书', '李永乐660题', '张宇高数18讲'], v: ['张宇高数强化班', '李永乐线代强化班', '余炳森概率论'] },
      '英语': { b: ['张剑黄皮书（阅读部分）', '王江涛高分写作'], v: ['唐迟阅读真题班', '石雷鹏写作课'] },
      '专业课': { b: ['自动控制原理同步辅导', '目标院校期末试题集'], v: ['卢京潮自动控制原理（B站）'] },
      '政治': { b: ['肖秀荣精讲精练', '徐涛核心考案'], v: ['徐涛强化班（马原+毛中特）'] }
    }},
    { id: 3, name: '冲刺期 (7-10月)', period: '真题冲刺阶段', res: {
      '数学': { b: ['历年真题（近15年）', '李林6套卷', '合工大超越5套卷'], v: ['李林冲刺班', 'B站真题逐题讲解'] },
      '英语': { b: ['张剑黄皮书（真题全套）', '王江涛考前预测20篇'], v: ['唐迟真题逐篇精讲', '刘琦新题型'] },
      '专业课': { b: ['目标院校近10年真题', '自动控制原理考研指导'], v: ['目标院校考研经验贴/真题讲解'] },
      '政治': { b: ['肖秀荣1000题', '腿姐冲刺背诵手册'], v: ['腿姐技巧班', '肖秀荣时政'] }
    }},
    { id: 4, name: '收尾期 (11-考前)', period: '查漏补缺阶段', res: {
      '数学': { b: ['李林4套卷', '张宇8+4', '公式速记本'], v: ['B站UP主考前押题总结'] },
      '英语': { b: ['作文模板默写本', '真题单词速刷'], v: ['刘晓燕保命班', '何凯文作文押题'] },
      '专业课': { b: ['错题本', '公式默写册', '目标院校真题二刷'], v: ['目标院校考前划重点'] },
      '政治': { b: ['肖秀荣4套卷（必背）', '腿姐冲刺讲义', '徐涛小黄书'], v: ['肖秀荣考前点题班', '腿姐冲刺班'] }
    }}
  ];

  const FALLBACK_APPS = [
    { name: '墨墨背单词', category: '英语单词', platform: 'iOS/Android', desc: '基于遗忘曲线科学安排复习' },
    { name: '不背单词', category: '英语单词', platform: 'iOS/Android', desc: '语境中记单词，影视原声例句' },
    { name: '欧陆词典', category: '英语单词', platform: 'iOS/Android', desc: '强大词典工具，可导入考研词汇' },
    { name: '百词斩', category: '英语单词', platform: 'iOS/Android', desc: '图形记忆法，适合视觉型学习者' },
    { name: 'China Daily', category: '英语阅读', platform: 'iOS/Android/Web', desc: '每日英文新闻，提升阅读速度' },
    { name: '扇贝阅读', category: '英语阅读', platform: 'iOS/Android', desc: '英语外刊精读，考研题源文章' },
    { name: '考研英语作文', category: '英语作文', platform: 'iOS/Android', desc: '作文模板+批改，覆盖大小作文' },
    { name: 'Get写作', category: '英语作文', platform: 'iOS', desc: 'AI批改英语作文，语法纠错' },
    { name: '番茄ToDo', category: '学习工具', platform: 'iOS/Android', desc: '番茄工作法计时，学霸模式防沉迷' },
    { name: 'Forest', category: '学习工具', platform: 'iOS/Android', desc: '专注种树，戒掉手机依赖' },
    { name: 'XMind', category: '学习工具', platform: 'iOS/Android/桌面', desc: '思维导图神器，整理知识框架' },
    { name: 'Notion', category: '学习工具', platform: 'iOS/Android/Web', desc: '全能笔记+数据库+看板' },
    { name: 'GoodNotes', category: '学习工具', platform: 'iOS', desc: '手写笔记首选，iPad刷题做笔记' },
    { name: 'MarginNote', category: '学习工具', platform: 'iOS/Mac', desc: 'PDF阅读+笔记+脑图三合一' },
    { name: 'Anki', category: '学习工具', platform: 'iOS/Android/桌面', desc: '间隔重复记忆，自制知识卡牌' },
    { name: 'Obsidian', category: '学习工具', platform: 'iOS/Android/桌面', desc: '双向链接笔记，构建知识网络' },
    { name: '百度网盘', category: '学习工具', platform: 'iOS/Android/Web', desc: '存储考研资料视频，倍速播放' },
    { name: 'Bilibili', category: '视频课程', platform: 'iOS/Android/Web', desc: '海量考研课程免费看' },
    { name: '中国大学MOOC', category: '视频课程', platform: 'iOS/Android/Web', desc: '名校公开课，补充专业课' },
    { name: '考研帮', category: '考研资讯', platform: 'iOS/Android', desc: '院校资讯+经验贴+真题库' },
    { name: '小红书', category: '考研资讯', platform: 'iOS/Android', desc: '考研经验帖、避坑指南' },
    { name: '知乎', category: '考研资讯', platform: 'iOS/Android/Web', desc: '高分学长学姐经验分享' },
    { name: '知网/万方', category: '考研资讯', platform: 'Web', desc: '查目标院校导师论文，了解方向' },
    { name: '苍盾考研', category: '政治刷题', platform: 'iOS/Android', desc: '政治选择题刷题利器' },
    { name: '小白考研', category: '政治刷题', platform: 'iOS/Android', desc: '政治刷题+时政汇总' },
    { name: '滑记', category: '政治刷题', platform: 'iOS/Android', desc: '政治知识点卡片式记忆' },
    { name: '数学公式', category: '数学工具', platform: 'iOS', desc: '高数公式手册，快速查阅' },
    { name: 'Wolfram Alpha', category: '数学工具', platform: 'iOS/Android/Web', desc: '数学计算引擎，解微积分' },
    { name: 'Desmos', category: '数学工具', platform: 'Web/iOS', desc: '函数图像绘制，理解概念' },
    { name: 'AutoCAD Mobile', category: '专业课', platform: 'iOS/Android', desc: '查看工程图纸' },
    { name: 'Multisim Live', category: '专业课', platform: 'Web', desc: '电路仿真工具' },
  ];

  async function init() {
    try {
      const [phases, apps] = await Promise.all([API.getPhases(), API.getApps()]);
      _phases = phases;
      _apps = apps;
    } catch (e) {
      _phases = FALLBACK_PHASES;
      _apps = FALLBACK_APPS;
    }
    const el = document.getElementById('panel-resources');
    if (el) { el.innerHTML = render(); bindEvents(); }
  }

  function render() {
    let h = `<div class="card">
      <div class="card-body" style="font-size:13px;color:var(--text-muted);padding:12px 16px">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        点击各阶段展开查看推荐书籍与视频课程
      </div>
    </div>`;

    _phases.forEach((p, i) => {
      const exp = _expanded === p.id;
      const c = COLORS[i];
      const bg = BGS[i];
      const subs = Object.keys(p.res || {});
      h += `<div class="card">
        <div class="card-header" onclick="Resources.toggle(${p.id})" style="${exp ? 'background:' + bg : ''}">
          <div class="phase-num" style="background:${c};width:26px;height:26px;font-size:12px">${p.id}</div>
          <div style="flex:1">
            <span style="font-size:14px;font-weight:600;color:var(--text)">${p.name}</span>
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px">${p.period}</span>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">`;
      subs.forEach(s => {
        const sm = SUBJ_MAP[s] || { color: 'var(--text-muted)', bg: 'var(--bg)', text: 'var(--text-secondary)' };
        h += `<span class="task-badge" style="background:${sm.bg};color:${sm.text}">${s}</span>`;
      });
      h += `</div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);transition:transform 0.2s;${exp?'transform:rotate(180deg)':''}"><polyline points="6 9 12 15 18 9"/></svg>
        </div>`;
      if (exp) {
        h += '<div class="card-body">';
        subs.forEach(sub => {
          const r = p.res[sub];
          if (!r) return;
          const sm = SUBJ_MAP[sub] || { color: 'var(--text-muted)', bg: 'var(--bg)', text: 'var(--text-secondary)' };
          h += `<div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
              <span style="width:8px;height:8px;border-radius:50%;background:${sm.color};flex-shrink:0"></span>
              <span style="font-size:14px;font-weight:600;color:${sm.text}">${sub}</span>
            </div>
            <div class="res-grid">
              <div class="res-box">
                <div class="res-label">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                  书籍 / 资料
                </div>
                ${(r.b || []).map(b => `<div class="res-item">${Utils.esc(b)}</div>`).join('')}
              </div>
              <div class="res-box">
                <div class="res-label">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  视频课程
                </div>
                ${(r.v || []).map(v => `<div class="res-item">${Utils.esc(v)}</div>`).join('')}
              </div>
            </div>
          </div>`;
        });
        h += '</div>';
      }
      h += '</div>';
    });

    h += `<div class="card" style="margin-top:18px">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">App / 工具推荐</span>
      </div>
      <div class="card-body">
        <div class="app-grid">`;
    const catColors = {
      '政治刷题': { bg: '#fef2f2', text: '#b91c1c' },
      '英语单词': { bg: '#ecfdf5', text: '#047857' },
      '英语阅读': { bg: '#ecfdf5', text: '#047857' },
      '英语作文': { bg: '#ecfdf5', text: '#047857' },
      '数学工具': { bg: '#eff6ff', text: '#1d4ed8' },
      '专业课': { bg: '#f5f3ff', text: '#6d28d9' },
      '学习工具': { bg: '#fffbeb', text: '#92400e' },
      '视频课程': { bg: '#fef2f2', text: '#b91c1c' },
      '考研资讯': { bg: '#f5f3ff', text: '#6d28d9' },
    };
    _apps.forEach(a => {
      const cc = catColors[a.category] || { bg: 'var(--bg)', text: 'var(--text-muted)' };
      h += `<div class="app-card">
        <span class="app-cat" style="background:${cc.bg};color:${cc.text}">${a.category}</span>
        <div><span class="app-name">${Utils.esc(a.name)}</span><span class="app-platform">${a.platform}</span></div>
        <div class="app-desc">${Utils.esc(a.desc)}</div>
      </div>`;
    });
    h += `</div></div></div>`;

    return h;
  }

  function toggle(id) {
    _expanded = _expanded === id ? 0 : id;
    const el = document.getElementById('panel-resources');
    if (el) { el.innerHTML = render(); bindEvents(); }
  }

  function bindEvents() {}

  return { init, toggle, render };
})();
