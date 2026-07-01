// 共享工具函数
const Utils = {
  // 获取中国时区当天日期 YYYY-MM-DD
  getToday() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 安全 HTML 转义
  esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },

  // 根据日期算阶段 (1-4)
  phaseForDate(d) {
    const dt = new Date(d);
    if (dt < new Date('2027-01-01')) return 1;
    if (dt < new Date('2027-07-01')) return 2;
    if (dt < new Date('2027-11-01')) return 3;
    return 4;
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};

const SUBJ_MAP = {
  '数学': { color: 'var(--math)', bg: 'var(--math-bg)', text: 'var(--math-text)' },
  '英语': { color: 'var(--eng)', bg: 'var(--eng-bg)', text: 'var(--eng-text)' },
  '专业课': { color: 'var(--major)', bg: 'var(--major-bg)', text: 'var(--major-text)' },
  '政治': { color: 'var(--poli)', bg: 'var(--poli-bg)', text: 'var(--poli-text)' },
  '复试': { color: 'var(--retest)', bg: 'var(--retest-bg)', text: 'var(--retest-text)' },
};
