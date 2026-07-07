const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { phaseForDate, buildPhaseTasks } = require('../data/plan-phases');

// 任务清单统一从 data/plan-phases.js 读取
const PHASE_TASKS = buildPhaseTasks();

router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const db = await getDB();
    const phase = phaseForDate(date);
    const tasks = PHASE_TASKS[phase] || [];

    const { rows: checkinRows } = await db.query('SELECT * FROM checkins WHERE date = $1', [date]);
    const row = checkinRows[0];
    let checkinId = row ? row.id : null;
    let notes = row ? row.notes : '';
    let photoUrls = row ? JSON.parse(row.photo_urls || '[]') : [];
    let taskStates = {};

    if (checkinId) {
      const { rows: savedTasks } = await db.query(
        'SELECT task_id, done FROM checkin_tasks WHERE checkin_id = $1', [checkinId]
      );
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

router.post('/:date', async (req, res) => {
  const db = await getDB();
  const client = await db.connect();
  try {
    const { date } = req.params;
    let { tasks, notes, photoUrls } = req.body;
    const phase = phaseForDate(date);
    notes = typeof notes === 'string' ? notes.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') : '';

    await client.query('BEGIN');

    const { rows: existingRows } = await client.query('SELECT id FROM checkins WHERE date = $1', [date]);
    let checkinId;
    if (existingRows.length) {
      checkinId = existingRows[0].id;
      await client.query(
        `UPDATE checkins SET notes=$1, photo_urls=$2, updated_at=NOW() WHERE id=$3`,
        [notes, JSON.stringify(photoUrls || []), checkinId]
      );
      await client.query('DELETE FROM checkin_tasks WHERE checkin_id = $1', [checkinId]);
    } else {
      const { rows } = await client.query(
        'INSERT INTO checkins (date, notes, photo_urls) VALUES ($1, $2, $3) RETURNING id',
        [date, notes, JSON.stringify(photoUrls || [])]
      );
      checkinId = rows[0].id;
    }

    const phaseTasks = PHASE_TASKS[phase] || [];
    for (const t of (tasks || [])) {
      const ft = phaseTasks.find(pt => pt.id === t.id);
      if (ft) {
        const doneVal = (t.done === true || t.done === 1) ? 1 : 0;
        await client.query(
          'INSERT INTO checkin_tasks (checkin_id, task_id, subject, label, done) VALUES ($1, $2, $3, $4, $5)',
          [checkinId, t.id, ft.subject, ft.label, doneVal]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: '保存成功 ✓' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/:date/history', async (req, res) => {
  try {
    const { date } = req.params;
    const db = await getDB();
    const dt = new Date(date);
    const start = new Date(dt);
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().slice(0, 10);

    const { rows } = await db.query(
      'SELECT date, notes FROM checkins WHERE date BETWEEN $1 AND $2 ORDER BY date',
      [startStr, date]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
