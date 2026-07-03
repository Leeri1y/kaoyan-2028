const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/sync/mastery — 获取所有单词掌握记录
router.get('/mastery', (req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare('SELECT word_key, status FROM word_mastery').all();
    const result = {};
    rows.forEach(r => { result[r.word_key] = r.status; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync/mastery — 批量保存单词掌握记录
router.post('/mastery', (req, res) => {
  try {
    const db = getDB();
    const data = req.body;
    const upsert = db.prepare(
      `INSERT INTO word_mastery (word_key, status, updated_at) 
       VALUES (@key, @status, datetime('now','localtime'))
       ON CONFLICT(word_key) DO UPDATE SET status=@status, updated_at=datetime('now','localtime')`
    );
    const tx = db.transaction((entries) => {
      for (const [key, status] of Object.entries(entries)) {
        upsert.run({ key, status });
      }
    });
    tx(data);
    res.json({ ok: true, count: Object.keys(data).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sync/syllabus — 获取大纲进度
router.get('/syllabus', (req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare('SELECT chapter, done FROM syllabus_progress').all();
    const result = {};
    rows.forEach(r => { result[String(r.chapter)] = !!r.done; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync/syllabus — 保存大纲进度
router.post('/syllabus', (req, res) => {
  try {
    const db = getDB();
    const data = req.body;
    const upsert = db.prepare(
      `INSERT INTO syllabus_progress (chapter, done, updated_at)
       VALUES (@chapter, @done, datetime('now','localtime'))
       ON CONFLICT(chapter) DO UPDATE SET done=@done, updated_at=datetime('now','localtime')`
    );
    const tx = db.transaction((entries) => {
      for (const [ch, done] of Object.entries(entries)) {
        upsert.run({ chapter: parseInt(ch), done: done ? 1 : 0 });
      }
    });
    tx(data);
    res.json({ ok: true, count: Object.keys(data).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
