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
    { cat: '英语', color: '#059669', bg: '#ecfdf5', icon: '📖', items: [
      ['墨墨背单词', 'iOS/Android · 基于遗忘曲线科学安排复习，支持自定义词书'],
      ['不背单词', 'iOS/Android · 语境中记单词，影视原声例句辅助记忆'],
      ['欧陆词典', 'iOS/Android · 强大词典工具，可导入考研词汇库'],
      ['百词斩', 'iOS/Android · 图形记忆法，适合视觉型学习者'],
      ['China Daily', 'iOS/Android/Web · 每日英文新闻，提升阅读速度'],
      ['扇贝阅读', 'iOS/Android · 英语外刊精读，覆盖考研题源文章'],
      ['考研英语作文', 'iOS/Android · 作文模板+批改，覆盖大小作文题型'],
    ]},
    { cat: '数学', color: '#2563eb', bg: '#eff6ff', icon: '📐', items: [
      ['帮帮考研/考研数学题库', 'iOS/Android · 章节练习+错题本，专项突破薄弱环节'],
      ['Wolfram Alpha', 'iOS/Android/Web · 数学计算引擎，解微积分、线性代数'],
      ['Desmos', 'Web/iOS · 函数图像绘制，直观理解数学概念'],
      ['数学公式', 'iOS · 高数公式手册，快速查阅定理公式'],
    ]},
    { cat: '专业课', color: '#7c3aed', bg: '#f5f3ff', icon: '⚙️', items: [
      ['Anki', 'iOS/Android/桌面 · 把自控原理公式、稳定判据做成卡片间隔复习'],
      ['随身记/滑记', 'iOS/Android · 知识点卡片式记忆，专业课必备'],
      ['B站搜"自动控制原理"', 'iOS/Android/Web · 卢京潮、西交大等名师公开课'],
      ['小红书/知乎', 'iOS/Android/Web · 搜"864自动控制原理"找学长学姐经验'],
    ]},
    { cat: '政治', color: '#dc2626', bg: '#fef2f2', icon: '🏛️', items: [
      ['苍盾考研', 'iOS/Android · 政治选择题刷题利器，碎片时间刷1000题'],
      ['小白考研', 'iOS/Android · 政治刷题+时政汇总，冲刺期必备'],
      ['肖秀荣密训App', 'iOS/Android · 跟随肖秀荣课程节奏刷题'],
    ]},
    { cat: '学习工具', color: '#d97706', bg: '#fffbeb', icon: '🛠️', items: [
      ['番茄ToDo', 'iOS/Android · 番茄工作法计时，学霸模式锁机防沉迷'],
      ['Forest', 'iOS/Android · 专注种树，长时间刷数学题时保持专注'],
      ['XMind', 'iOS/Android/桌面 · 思维导图，整理知识框架和错题体系'],
      ['Notion', 'iOS/Android/Web · 全能笔记+数据库+看板，管理考研全流程'],
      ['GoodNotes', 'iOS · 手写笔记首选，iPad刷真题做笔记'],
      ['MarginNote', 'iOS/Mac · PDF阅读+笔记+脑图三合一，精读教材'],
      ['Obsidian', 'iOS/Android/桌面 · 双向链接笔记，构建专业知识网络'],
      ['百度网盘', 'iOS/Android/Web · 存储考研资料视频，倍速播放'],
    ]},
    { cat: '视频课程', color: '#b91c1c', bg: '#fef2f2', icon: '🎬', items: [
      ['Bilibili', 'iOS/Android/Web · 海量考研课程免费看，数学/政治/专业课全覆盖'],
      ['中国大学MOOC', 'iOS/Android/Web · 名校公开课，补充专业课知识'],
    ]},
    { cat: '考研资讯', color: '#7c3aed', bg: '#f5f3ff', icon: '📬', items: [
      ['考研帮', 'iOS/Android · 院校资讯+经验贴+真题库'],
      ['知网/万方', 'Web · 查目标院校导师论文，了解研究方向'],
    ]},
  ];

  async function init() {
    try {
      const [phases, apps] = await Promise.all([API.getPhases(), API.getApps()]);
      _phases = phases;
      _apps = (apps && apps.length > 0 && Array.isArray(apps[0].items)) ? apps : FALLBACK_APPS;
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
      <div class="card-body" style="padding:4px 16px 16px">
        <div class="app-groups">`;
    _apps.forEach(g => {
      h += `<div class="app-group" style="border-left:3px solid ${g.color};background:${g.bg}">
        <div class="app-group-hd">
          <span>${g.icon}</span>
          <span style="flex:1;font-size:13px;font-weight:600;color:${g.color}">${g.cat}</span>
          <span style="font-size:11px;color:${g.color}99">${g.items.length}个</span>
        </div>`;
      g.items.forEach(it => {
        const [name, desc] = it;
        h += `<div class="app-g-item">
          <span class="app-g-name">${Utils.esc(name)}</span>
          <span class="app-g-desc">${Utils.esc(desc)}</span>
        </div>`;
      });
      h += '</div>';
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
