const Daily = (() => {
  let _quote = { text: '', source: '' };
  let _words = [];
  let _reviews = [];
  let _wordBank = {};
  let _apps = [];
  let _selDate = '';
  let _wordRevealed = {};
  let _wordMastery = {};

  function loadMastery() {
    try { _wordMastery = JSON.parse(localStorage.getItem('kaoyan-word-master') || '{}'); } catch (e) { _wordMastery = {}; }
    API.getMastery().then(data => {
      if (data && typeof data === 'object') {
        Object.assign(_wordMastery, data);
        localStorage.setItem('kaoyan-word-master', JSON.stringify(_wordMastery));
      }
    }).catch(() => {});
  }
  function saveMastery() {
    localStorage.setItem('kaoyan-word-master', JSON.stringify(_wordMastery));
    API.saveMastery(_wordMastery).catch(() => {});
  }
  function getMasteryKey(word) { return word.word + '_' + (word.meaning || ''); }

  function markWord(word, status) {
    const key = getMasteryKey(word);
    _wordMastery[key] = status;
    saveMastery();
  }

  // 掌握单词在复习中出现概率降低: mastered 10%, learning 50%, new 100%
  function shouldShowWord(word) {
    const key = getMasteryKey(word);
    const status = _wordMastery[key] || 'new';
    if (status === 'mastered') return Math.random() < 0.1;
    if (status === 'learning') return Math.random() < 0.5;
    return true;
  }

  function init() {
    _selDate = Utils.getToday();
    _wordRevealed = {};
    loadMastery();
    const el = document.getElementById('panel-daily');
    if (el) { el.innerHTML = '<div class="loading-placeholder" style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px">加载每日学习…</div>'; }
    Promise.allSettled([
      API.getTodayQuote(_selDate),
      API.getTodayWords(_selDate),
      API.getReviewWords(_selDate),
      API.getWordBank(),
      API.getApps()
    ]).then(([quoteRes, wordsRes, reviewsRes, bankRes, appsRes]) => {
      _quote = quoteRes.status === 'fulfilled' ? quoteRes.value.quote : { text: '日拱一卒，功不唐捐。', source: '考研语录' };
      _words = wordsRes.status === 'fulfilled' ? wordsRes.value.words : [];
      _reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value : [];
      _wordBank = bankRes.status === 'fulfilled' ? bankRes.value : {};
      _apps = appsRes.status === 'fulfilled' ? appsRes.value : [];
      if (el) { el.innerHTML = render(); bindEvents(); }
    });
  }

  function render() {
    const today = Utils.getToday();
    let h = '';

    h += `<div class="quote-card">
      <div class="quote-text">${Utils.esc(_quote.text)}</div>
      <div class="quote-source">${Utils.esc(_quote.source)}</div>
    </div>`;

    const masteredCount = Object.values(_wordMastery).filter(v => v === 'mastered').length;
    const learningCount = Object.values(_wordMastery).filter(v => v === 'learning').length;
    const totalMastery = masteredCount + learningCount;

    h += `<div class="stats-row">
      <div class="stat-card">
        <div class="stat-number">${_words.length}</div>
        <div class="stat-label">今日新词</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${_wordBank.total || _words.length}</div>
        <div class="stat-label">词库总量</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:#059669">${masteredCount}</div>
        <div class="stat-label">已掌握 ★</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:#d69e2e">${learningCount}</div>
        <div class="stat-label">需复习 ⊙</div>
      </div>
    </div>`;

    h += `<div class="card">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">今日考研词汇</span>
        <span style="font-size:11px;color:var(--text-muted);font-weight:400">点击单词切换释义 / ⭐标记掌握程度</span>
      </div>
      <div class="card-body">
        <div class="word-list">`;
    _words.forEach((w, i) => {
      const revealed = _wordRevealed[i];
      const key = getMasteryKey(w);
      const status = _wordMastery[key] || 'new';
      const statusIcon = status === 'mastered' ? '★' : (status === 'learning' ? '⊙' : '☆');
      const statusColor = status === 'mastered' ? '#059669' : (status === 'learning' ? '#d69e2e' : '#d1d5db');
      h += `<div class="word-item ${revealed ? 'flipped' : ''}" onclick="Daily.toggleWord(${i})">
        <div class="word-flip">
          <div class="word-face word-face-front">
            <span class="word-en" title="${Utils.esc(w.phonetic || '')}">${Utils.esc(w.word)}</span>
            <span class="word-subject">${Utils.esc(w.subject)}</span>
          </div>
          <div class="word-face word-face-back">${Utils.esc(w.meaning)}</div>
        </div>
        <span class="word-star" onclick="event.stopPropagation();Daily.cycleMastery(${i})" style="color:${statusColor}" title="${status === 'mastered' ? '已掌握' : status === 'learning' ? '需复习' : '未标记'}">${statusIcon}</span>
      </div>`;
    });
    h += `</div></div></div>`;

    // 掌握程度说明 + 概率提示
    h += `<div class="card" style="margin-top:-8px">
      <div class="card-body" style="padding:10px 14px;font-size:12px;color:var(--text-muted);display:flex;gap:16px;flex-wrap:wrap">
        <span>☆ 未标记 — 正常出现</span>
        <span>⊙ 需复习 — 出现概率50%</span>
        <span>★ 已掌握 — 出现概率10%</span>
      </div>
    </div>`;

    if (_reviews && _reviews.length > 0) {
      h += `<div class="card">
        <div class="card-header" style="cursor:default">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">复习回顾</span>
          <span style="font-size:12px;color:var(--text-muted)">移入单词查看释义</span>
        </div>
        <div class="card-body">`;
      _reviews.forEach(r => {
        h += `<div style="margin-bottom:14px">
          <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-bottom:8px;letter-spacing:0.03em">${r.date} · ${r.words.length} 词</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">`;
        r.words.forEach(w => {
          h += `<span class="review-word">
            ${Utils.esc(w.word)}
            <span class="review-tip">${Utils.esc(w.meaning)}${w.phonetic ? ' ' + w.phonetic : ''}</span>
          </span>`;
        });
        h += `</div></div>`;
      });
      h += `</div></div>`;
    }

    const needReview = Object.entries(_wordMastery).filter(([k, v]) => v === 'learning');
    if (needReview.length > 0) {
      h += `<div class="card">
        <div class="card-header" style="cursor:default">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d69e2e" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">我的待复习单词</span>
          <span style="font-size:12px;color:var(--text-muted)">${needReview.length} 个词需要巩固</span>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-wrap:wrap;gap:4px">`;
      needReview.forEach(([key]) => {
        const [word] = key.split('_');
        h += `<span style="font-size:12px;padding:4px 10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;color:#92400e">${Utils.esc(word)}</span>`;
      });
      h += `</div></div></div>`;
    }

    const tips = [
      { phase: '地基期', period: '7-12月', color: '#2563eb', bg: '#eff6ff', content: '数学打基础（武忠祥/汤家凤基础课 + 课后习题），英语积累词汇（墨墨背单词 50个/天 + 阅读真题2篇/周）。政治暂不启动，专业课先下载广州大学085406大纲了解考试范围。' },
      { phase: '强化期', period: '1-6月', color: '#7c3aed', bg: '#f5f3ff', content: '数学专题强化（张宇/李永乐强化班 + 李永乐复习全书），专业课系统启动（自动控制原理教材精读 + 课后题）。英语每日30词 + 写作/翻译练习。' },
      { phase: '冲刺期', period: '7-10月', color: '#d69e2e', bg: '#fffbeb', content: '全科真题精刷（数学计时2.5h，英语全题型140min），政治启动（肖秀荣精讲精练 + 1000题每天45min），专业课目标院校真题反复做。' },
      { phase: '收尾期', period: '11-1月', color: '#dc2626', bg: '#fef2f2', content: '政治大题背诵（肖四必背 + 腿姐背诵手册），数学模拟卷保手感，英语作文模板背诵，专业课回归真题。' }
    ];
    h += `<div class="card" style="margin-top:4px">
      <div class="card-header" style="cursor:default">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style="flex:1;font-size:14px;font-weight:600;color:var(--text)">各阶段复习重点</span>
        <span style="font-size:11px;color:var(--text-muted)">阶段复习策略</span>
      </div>
      <div class="card-body tips-section">`;
    tips.forEach(t => {
      h += `<div class="tips-item">
        <div class="tips-phase" style="background:${t.bg};color:${t.color}">${t.phase}<br><span style="font-weight:400;font-size:11px;opacity:0.7">${t.period}</span></div>
        <div class="tips-content">${t.content}</div>
      </div>`;
    });
    h += `</div></div>`;

    return h;
  }

  function toggleWord(i) {
    _wordRevealed[i] = !_wordRevealed[i];
    const el = document.getElementById('panel-daily');
    if (el) el.innerHTML = render();
  }

  function cycleMastery(i) {
    const w = _words[i];
    const key = getMasteryKey(w);
    const current = _wordMastery[key] || 'new';
    const next = current === 'new' ? 'learning' : current === 'learning' ? 'mastered' : 'new';
    _wordMastery[key] = next;
    saveMastery();
    const el = document.getElementById('panel-daily');
    if (el) el.innerHTML = render();
  }

  function bindEvents() {}

  return { init, toggleWord, cycleMastery };
})();
