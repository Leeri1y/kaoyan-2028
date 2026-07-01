const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

const PHASE_TASKS = {
  1: [
    { id:'p1m1', subject:'数学', label:'听课/复习 1小时（武忠祥/汤家凤）' },
    { id:'p1m2', subject:'数学', label:'课后习题练习' },
    { id:'p1e1', subject:'英语', label:'背单词 50个（墨墨背单词）' },
    { id:'p1e2', subject:'英语', label:'阅读真题 2篇（张剑黄皮书）' },
  ],
  2: [
    { id:'p2m1', subject:'数学', label:'专题强化 1.5小时（计时完成）' },
    { id:'p2m2', subject:'数学', label:'周模块练习题（每周至少1次）' },
    { id:'p2e1', subject:'英语', label:'背单词 30个' },
    { id:'p2e2', subject:'英语', label:'写作/翻译练习（2周1篇大作文）' },
    { id:'p2z1', subject:'专业课', label:'教材精读 1章节' },
    { id:'p2z2', subject:'专业课', label:'课后题 + 对应真题章节' },
  ],
  3: [
    { id:'p3m1', subject:'数学', label:'历年真题 1套（计时 2.5h）' },
    { id:'p3m2', subject:'数学', label:'错题复盘（3天后重做）' },
    { id:'p3e1', subject:'英语', label:'全题型模拟（计时 140分钟）' },
    { id:'p3z1', subject:'专业课', label:'目标校真题训练' },
    { id:'p3z2', subject:'专业课', label:'弱点章节补漏' },
    { id:'p3p1', subject:'政治', label:'肖秀荣精讲精练 45分钟' },
  ],
  4: [
    { id:'p4m1', subject:'数学', label:'模拟卷保手感（李永乐6套/张宇4套）' },
    { id:'p4e1', subject:'英语', label:'大作文范文背诵（每天1篇）' },
    { id:'p4z1', subject:'专业课', label:'真题 + 模拟卷冲刺' },
    { id:'p4p1', subject:'政治', label:'肖四大题答题框架背诵' },
    { id:'p4p2', subject:'政治', label:'1000题二刷（选择题部分）' },
  ],
};

function phaseForDate(d) {
  const dt = new Date(d);
  if (dt < new Date('2027-01-01')) return 1;
  if (dt < new Date('2027-07-01')) return 2;
  if (dt < new Date('2027-11-01')) return 3;
  return 4;
}

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
      savedTasks.forEach(t => { taskStates[t.task_id] = !!t.done; });
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
    const { tasks, notes, photoUrls } = req.body;
    const db = getDB();
    const phase = phaseForDate(date);

    let existing = db.prepare('SELECT id FROM checkins WHERE date = ?').get(date);
    let checkinId;
    if (existing) {
      checkinId = existing.id;
      db.prepare('UPDATE checkins SET notes=?, photo_urls=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?')
        .run(notes || '', JSON.stringify(photoUrls || []), checkinId);
      db.prepare('DELETE FROM checkin_tasks WHERE checkin_id = ?').run(checkinId);
    } else {
      const result = db.prepare('INSERT INTO checkins (date, notes, photo_urls) VALUES (?, ?, ?)')
        .run(date, notes || '', JSON.stringify(photoUrls || []));
      checkinId = result.lastInsertRowid;
    }

    const phaseTasks = PHASE_TASKS[phase] || [];
    const insertTask = db.prepare('INSERT INTO checkin_tasks (checkin_id, task_id, subject, label, done) VALUES (?, ?, ?, ?, ?)');
    const insertMany = db.transaction((taskList) => {
      for (const t of taskList) {
        const ft = phaseTasks.find(pt => pt.id === t.id);
        if (ft) {
          insertTask.run(checkinId, t.id, ft.subject, ft.label, t.done ? 1 : 0);
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
