const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { phaseForDate, buildPhaseTasks } = require('../data/plan-phases');

// 任务清单现在统一从 data/plan-phases.js 读取，不再在这里单独维护一份
const PHASE_TASKS = buildPhaseTasks();

router.get('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const db = getDB();
    const phase = phaseForDate(date);
    const tasks = PHASE_TASKS[phase] || [];

    const row = db.prepare('SELECT * FROM checkins WHERE date = ?').get(date);
    let checkinId = row ? row.id : null;
    let notes = row ? row.notes : '';
    let photoUrls = row ? JSON.parse(row.photo_urls || '[]') : [];
    let taskStates = {};

    if (checkinId) {
      const savedTasks = db.prepare('SELECT task_id, done FROM checkin_tasks WHERE checkin_id = ?').all(checkinId);
      savedTasks.forEach(t => {
        taskStates[t.task_id] = t.done === 1 || t.done === true;
      });
    }

    res.json({
      date, phase,
      tasks: tasks.map(t => ({ ...t, done: taskStates[t.id] || false })),
      notes, photoUrls
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:date', (req, res) => {
  try {
    const { date } = req.params;
    let { tasks, notes, photoUrls } = req.body;
    const db = getDB();
    const phase = phaseForDate(date);

    let existing = db.prepare('SELECT id FROM checkins WHERE date = ?').get(date);
    let checkinId;
    if (existing) {
      checkinId = existing.id;
      notes = typeof notes === 'string' ? notes.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') : '';
      db.prepare('UPDATE checkins SET notes=?, photo_urls=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?')
        .run(notes, JSON.stringify(photoUrls || []), checkinId);
      db.prepare('DELETE FROM checkin_tasks WHERE checkin_id = ?').run(checkinId);
    } else {
      notes = typeof notes === 'string' ? notes.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') : '';
      const result = db.prepare('INSERT INTO checkins (date, notes, photo_urls) VALUES (?, ?, ?)')
        .run(date, notes, JSON.stringify(photoUrls || []));
      checkinId = result.lastInsertRowid;
    }

    const phaseTasks = PHASE_TASKS[phase] || [];
    const insertTask = db.prepare('INSERT INTO checkin_tasks (checkin_id, task_id, subject, label, done) VALUES (?, ?, ?, ?, ?)');
    const insertMany = db.transaction((taskList) => {
      for (const t of taskList) {
        const ft = phaseTasks.find(pt => pt.id === t.id);
        if (ft) {
          const doneVal = t.done === true || t.done === 1 ? 1 : 0;
          insertTask.run(checkinId, t.id, ft.subject, ft.label, doneVal);
        }
      }
    });
    insertMany(tasks || []);

    res.json({ success: true, message: '保存成功 ✓' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:date/history', (req, res) => {
  try {
    const { date } = req.params;
    // 修复：这里之前漏了 const db = getDB()，直接引用了一个不存在的全局
    // 变量 db，导致该接口每次都会抛 ReferenceError（500），"近30天打卡记录"
    // 板块实际上一直是空的。
    const db = getDB();
    const dt = new Date(date);
    const start = new Date(dt);
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().slice(0, 10);

    const rows = db.prepare(
      'SELECT date, notes FROM checkins WHERE date BETWEEN ? AND ? ORDER BY date'
    ).all(startStr, date);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
