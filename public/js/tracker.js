// ★ 每日打卡模块 — 自动保存版
// 核心特性：自动保存、进度环、实时保存状态指示、笔记防抖保存
const Tracker = (() => {
  let _selDate = Utils.getToday();
  let _taskState = {};
  let _notes = '';
  let _photoUrls = [];
  let _saveStatus = '';      // '' | 'saving' | 'saved' | 'error'
  let _phaseTasks = [];
  let _phaseId = 1;
  let _history = [];
  let _noteDebounceTimer = null;
  let _isSaving = false;

  const PHASE_NAMES = ['','地基期','强化期','冲刺期','收尾期'];
  const PHASE_COLORS = ['','#2563eb','#7c3aed','#d69e2e','#dc2626'];
  const PHASE_BGS = ['','#eff6ff','#f5f3ff','#fffbeb','#fef2f2'];

  // ============ 数据加载 ============
  async function loadData() {
    try {
      const data = await API.getCheckin(_selDate);
      _phaseId = data.phase || Utils.phaseForDate(_selDate);
      _phaseTasks = data.tasks || [];
      _taskState = {};
      _phaseTasks.forEach(t => { _taskState[t.id] = t.done; });
      _notes = data.notes || '';
    } catch (e) {
      _phaseId = Utils.phaseForDate(_selDate);
      _phaseTasks = [];
      _taskState = {};
      _notes = '';
    }
    try {
      _history = await API.getCheckinHistory(_selDate);
    } catch (e) { _history = []; }
  }

  async function loadUploads() {
    try {
      const base = window.API_BASE || '';
      const uploads = await API.getUploads(_selDate);
      _photoUrls = uploads.map(u => ({
        id: u.id,
        url: `${base}/uploads/${u.filename}`,
        name: u.original_name
      }));
    } catch (e) { _photoUrls = []; }
  }

  // ============ ★ 自动保存核心 ============

  /** 同步笔记 textarea → _notes（渲染前必须调用） */
  function syncNotes() {
    const na = document.getElementById('tracker-notes');
    if (na) _notes = na.value;
  }

  /** 更新保存指示器（只操作 #save-indicator DOM，不触发全量渲染） */
  function updateSaveUI() {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    if (_saveStatus === 'saving') {
      el.className = 'save-indicator saving';
      el.innerHTML = '<span class="spinner"></span>保存中…';
    } else if (_saveStatus === 'saved') {
      el.className = 'save-indicator saved';
      el.innerHTML = '✓ 已自动保存';
    } else if (_saveStatus === 'error') {
      el.className = 'save-indicator error';
      el.innerHTML = '✕ 保存失败';
    } else {
      el.className = 'save-indicator idle';
      el.textContent = '';
    }
  }

  /** 真正的保存（防重入） */
  async function doSave() {
    if (_isSaving) return;
    _isSaving = true;
    _saveStatus = 'saving';
    updateSaveUI();
    syncNotes();
    const tasks = Object.entries(_taskState).map(([id, done]) => ({ id, done }));
    try {
      await API.saveCheckin(_selDate, {
        tasks,
        notes: _notes,
        photoUrls: _photoUrls.map(p => p.id ? `upload:${p.id}` : p.url)
      });
      _saveStatus = 'saved';
    } catch (err) {
      _saveStatus = 'error';
    }
    _isSaving = false;
    updateSaveUI();
    if (_saveStatus === 'saved') {
      setTimeout(() => { _saveStatus = ''; updateSaveUI(); }, 2500);
    }
  }

  /** 自动保存（对外接口） */
  function autoSave() {
    _saveStatus = 'saving';
    updateSaveUI();
    doSave();
  }

  /** 笔记输入：600ms 防抖自动保存 */
  function onNotesInput() {
    clearTimeout(_noteDebounceTimer);
    if (_saveStatus !== 'saving') {
      _saveStatus = 'saving';
      updateSaveUI();
    }
    _noteDebounceTimer = setTimeout(() => { autoSave(); }, 600);
  }

  // ============ 交互函数 ============

  function toggleTask(id) {
    _taskState[id] = !_taskState[id];
    syncNotes();
    const el = document.getElementById('panel-tracker');
    if (el) { el.innerHTML = render(); bindEvents(); }
    autoSave();
  }

  async function save() {
    await doSave();
    const el = document.getElementById('panel-tracker');
    if (el) { el.innerHTML = render(); bindEvents(); }
  }

  async function handleUpload(files) {
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('date', _selDate);
      try { await API.uploadFile(fd); } catch (err) { /* ignore */ }
    }
    await loadUploads();
    const el = document.getElementById('panel-tracker');
    if (el) { el.innerHTML = render(); bindEvents(); }
    autoSave();
  }

  async function delPhoto(id) {
    try { await API.deleteUpload(id); } catch (e) { /* ignore */ }
    await loadUploads();
    const el = document.getElementById('panel-tracker');
    if (el) { el.innerHTML = render(); bindEvents(); }
    autoSave();
  }

  async function onDateChange(v) {
    // 1) 先保存当前日期的数据
    syncNotes();
    if (Object.keys(_taskState).length > 0 || _notes) {
      await doSave();
    }
    // 2) 再加载新日期
    _selDate = v;
    await loadData();
    await loadUploads();
    const el = document.getElementById('panel-tracker');
    if (el) { el.innerHTML = render(); bindEvents(); }
    _saveStatus = '';
    updateSaveUI();
  }

  function openLightbox(url, name) {
    const overlay = document.getElementById('lightbox-overlay');
    const img = document.getElementById('lightbox-img');
    if (overlay && img) {
      img.src = url;
      img.alt = name || '';
      overlay.style.display = 'flex';
    }
  }

  function closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 70) + 'px';
  }

  function ensureLightbox() {
    if (document.getElementById('lightbox-overlay')) return;
    const div = document.createElement('div');
    div.id = 'lightbox-overlay';
    div.innerHTML = '<span class="lightbox-close" onclick="Tracker.closeLightbox()">✕</span><img id="lightbox-img" src="" alt="">';
    document.body.appendChild(div);
  }

  // ============ ★ 渲染（简约高级版） ============

  function render() {
    const pid = _phaseId || Utils.phaseForDate(_selDate);
    const total = _phaseTasks.length;
    const done = Object.values(_taskState).filter(Boolean).length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    const c = PHASE_COLORS[pid];
    const cb = PHASE_BGS[pid];
    const pn = PHASE_NAMES[pid];
    const allDone = done === total && total > 0;
    const r = 24, circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);

    let h = '<div class="tracker-view">';

    // ── 顶部：日期 + 阶段 + 保存 ──
    h += `<div class="tk-head">
      <div class="tk-head-row">
        <div class="tk-date-group">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" id="tracker-date" value="${_selDate}">
        </div>
        <span id="save-indicator" class="save-indicator idle"></span>
      </div>
      <div class="tk-meta">
        <span class="tk-phase-tag" style="color:${c}">
          <span class="tk-dot" style="background:${c}"></span>
          第${pid}阶段 · ${pn}
        </span>
        <span class="tk-count">${done}/${total}</span>
      </div>
    </div>`;

    // ── 进度卡片 ──
    h += `<div class="tk-progress">
      <div class="tk-ring-wrap">
        <div class="progress-ring">
          <svg viewBox="0 0 60 60">
            <circle class="ring-bg" cx="30" cy="30" r="${r}"/>
            <circle class="ring-fg" cx="30" cy="30" r="${r}"
              stroke="${c}" stroke-dasharray="${circ}"
              stroke-dashoffset="${offset}"/>
          </svg>
          <span class="ring-label" style="color:${c}">${pct}%</span>
        </div>
      </div>
      <div class="tk-progress-body">
        <div class="tk-progress-title">今日进度</div>
        <div class="tk-progress-desc">${allDone ? '全部完成 ✦' : `${done}/${total} 项任务`}</div>
        <div class="tk-bar"><div class="tk-bar-fill" style="width:${pct}%;background:${c}"></div></div>
      </div>
    </div>`;

    // ── 任务列表 ──
    const subjects = [...new Set(_phaseTasks.map(t => t.subject))];
    subjects.forEach(sub => {
      const tasks = _phaseTasks.filter(t => t.subject === sub);
      const sd = tasks.filter(t => _taskState[t.id]).length;
      const sm = SUBJ_MAP[sub] || { color: 'var(--text-muted)', bg: 'var(--bg)', text: 'var(--text-secondary)' };
      h += `<div class="tk-section">
        <div class="tk-section-hd" style="border-left-color:${sm.color}">
          <span style="color:${sm.text};font-weight:600;font-size:13px">${sub}</span>
          <span style="color:${sm.color};font-size:12px;font-weight:600;margin-left:auto">${sd}/${tasks.length}</span>
        </div>`;
      tasks.forEach(t => {
        const d = !!_taskState[t.id];
        h += `<div class="tk-row ${d?'done':''}" onclick="Tracker.toggleTask('${t.id}')">
          <input type="checkbox" ${d?'checked':''} style="accent-color:${sm.color}" onclick="event.stopPropagation();Tracker.toggleTask('${t.id}')">
          <span class="tk-row-label">${Utils.esc(t.label)}</span>
          ${d ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="${sm.color}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </div>`;
      });
      h += '</div>';
    });

    // ── 照片上传 ──
    h += `<div class="tk-section">
      <div class="tk-section-hd" style="border-left-color:transparent">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span style="color:var(--text-secondary);font-size:13px;font-weight:500">学习记录</span>
      </div>
      <div class="tk-photo">
        <button class="btn-ghost" onclick="document.getElementById('fileInput').click()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          上传
        </button>
        <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.txt" style="display:none" multiple>
        <div class="photo-grid">`;
    _photoUrls.forEach(p => {
      const nameEsc = Utils.esc(p.name);
      h += `<div class="photo-item">
        <img src="${p.url}" alt="${nameEsc}" loading="lazy" onerror="this.parentElement.classList.add('photo-broken')" style="cursor:pointer" onclick="Tracker.openLightbox('${Utils.esc(p.url)}','${nameEsc}')">
        <button class="photo-del" onclick="event.stopPropagation();Tracker.delPhoto(${p.id})">✕</button>
      </div>`;
    });
    h += `</div></div></div>`;

    // ── 备注 ──
    h += `<div class="tk-section">
      <div class="tk-section-hd" style="border-left-color:transparent">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span style="color:var(--text-secondary);font-size:13px;font-weight:500">备注</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto">自动保存</span>
      </div>
      <div class="tk-note-wrap">
        <textarea class="tk-note" id="tracker-notes" placeholder="记录今天的学习心得、遇到的问题…" oninput="Tracker.onNotesInput()">${Utils.esc(_notes)}</textarea>
      </div>
    </div>`;

    // ── 底部操作 ──
    h += `<div class="tk-actions">
      <button class="btn btn-primary" onclick="Tracker.save()">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        保存
      </button>
      ${allDone ? `<span class="tk-badge">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        今日完成
      </span>` : ''}
    </div>`;

    // ── 打卡记录 ──
    if (_history && _history.length > 0) {
      h += `<div class="tk-section">
        <div class="tk-section-hd" style="border-left-color:transparent">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style="color:var(--text-secondary);font-size:13px;font-weight:500">近30天打卡记录</span>
        </div>
        <div class="tk-history">`;
      _history.forEach(hh => {
        h += `<div class="tk-h-item">
          <span class="tk-h-dot" style="background:${hh.notes ? '#059669' : '#d1d5db'}"></span>
          <span class="tk-h-date">${hh.date}</span>
          <span class="tk-h-note">${hh.notes ? Utils.esc(hh.notes) : '已打卡'}</span>
        </div>`;
      });
      h += `</div></div>`;
    }

    h += '</div>';
    return h;
  }

  // ============ 事件绑定 ============

  function bindEvents() {
    // 日期变更
    const dp = document.getElementById('tracker-date');
    if (dp) {
      dp.onchange = null;
      dp.addEventListener('change', async (e) => {
        await onDateChange(e.target.value);
      });
    }

    // 文件上传
    const fi = document.getElementById('fileInput');
    if (fi) {
      fi.onchange = null;
      fi.addEventListener('change', (e) => {
        if (e.target.files.length) { handleUpload(e.target.files); e.target.value = ''; }
      });
    }

    // 笔记自动 resize + auto-save（oninput 已在 HTML 中绑定 onNotesInput）
    const na = document.getElementById('tracker-notes');
    if (na) {
      // 移除可能的旧监听，因为 HTML 中已用 oninput 绑定
      // 但仍需要 auto-resize
      if (!na._autoResizeBound) {
        na._autoResizeBound = true;
        na.addEventListener('input', function() { autoResize(this); });
      }
      autoResize(na);
    }

    // 点击 lightbox 遮罩关闭
    const lb = document.getElementById('lightbox-overlay');
    if (lb) {
      lb.onclick = null;
      lb.addEventListener('click', function(e) { if (e.target === this) closeLightbox(); });
    }
  }

  // ============ 初始化 ============

  function init() {
    _selDate = Utils.getToday();
    ensureLightbox();
    // ★ 先用空数据立即渲染，用户看到界面
    _phaseId = Utils.phaseForDate(_selDate);
    _phaseTasks = [];
    _taskState = {};
    _notes = '';
    _photoUrls = [];
    const el = document.getElementById('panel-tracker');
    if (el) { el.innerHTML = render(); bindEvents(); }
    // ★ 然后异步加载数据（6s超时），成功后刷新（不await，不阻塞switchTab）
    Promise.all([loadData(), loadUploads()]).then(() => {
      if (el) { el.innerHTML = render(); bindEvents(); }
    });
  }

  return {
    init,
    toggleTask,
    save,
    delPhoto,
    render,
    openLightbox,
    closeLightbox,
    onNotesInput  // 暴露给 HTML oninput
  };
})();
