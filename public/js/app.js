// 主应用入口
(function() {
  'use strict';

  const TABS = ['overview', 'daily', 'tracker', 'syllabus', 'resources'];
  let _currentTab = 'overview';
  let _loaded = {};

  function showToast(msg, type) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = type === 'error' ? '#dc2626' : '#1a202c';
    t.classList.add('show');
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function updateHeader() {
    const today = Utils.getToday();
    const dt = new Date(today + 'T00:00:00+08:00');
    const ds = dt.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const dd = document.getElementById('dateDisplay');
    if (dd) dd.textContent = ds;

    const exam = new Date('2027-12-23');
    const diff = Math.ceil((exam - dt) / (1000 * 60 * 60 * 24));
    const pi = document.getElementById('phaseIndicator');
    if (pi) {
      const pid = Utils.phaseForDate(today);
      const names = ['', '地基期', '强化期', '冲刺期', '收尾期'];
      const colors = ['', '#2563eb', '#7c3aed', '#d69e2e', '#dc2626'];
      pi.textContent = `⏳ ${diff}天 · ${names[pid]}`;
      pi.style.borderLeft = `3px solid ${colors[pid]}`;
      pi.style.padding = '3px 10px 3px 8px';
    }
  }

  async function switchTab(tab) {
    if (!TABS.includes(tab)) return;
    _currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Show/hide panels
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'panel-' + tab);
    });

    // Always reload tracker/daily; cache overview/resources
    const alwaysReload = ['tracker', 'daily'];
    if (!_loaded[tab] || alwaysReload.includes(tab)) {
      _loaded[tab] = true;
      try {
        switch (tab) {
          case 'overview':
            await Overview.init();
            break;
          case 'daily':
            await Daily.init();
            break;
          case 'tracker':
            await Tracker.init();
            break;
          case 'syllabus':
            await Syllabus.init();
            break;
          case 'resources':
            await Resources.init();
            break;
        }
      } catch (err) {
        showToast('加载失败：' + err.message, 'error');
        console.error('Tab load error:', err);
      }
    }
  }

  function init() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Update header time every minute
    updateHeader();
    setInterval(updateHeader, 60000);

    // Load initial tab
    switchTab('overview');

    // Expose to window for debugging
    window.App = { switchTab, showToast };
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
