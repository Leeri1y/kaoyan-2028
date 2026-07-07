const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/sync/mastery — 获取所有单词掌握记录
router.get('/mastery', async (req, res) => {
  try {
    const db = await getDB();
    const { rows } = await db.query('SELECT word_key, status FROM word_mastery');
    const result = {};
    rows.forEach(r => { result[r.word_key] = r.status; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync/mastery — 批量保存单词掌握记录
router.post('/mastery', async (req, res) => {
  const db = await getDB();
  const client = await db.connect();
  try {
    const data = req.body;
    await client.query('BEGIN');
    for (const [key, status] of Object.entries(data)) {
      await client.query(
        `INSERT INTO word_mastery (word_key, status, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (word_key) DO UPDATE SET status=$2, updated_at=NOW()`,
        [key, status]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: Object.keys(data).length });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/sync/syllabus — 获取大纲进度
router.get('/syllabus', async (req, res) => {
  try {
    const db = await getDB();
    const { rows } = await db.query('SELECT chapter, done FROM syllabus_progress');
    const result = {};
    rows.forEach(r => { result[String(r.chapter)] = !!r.done; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sync/syllabus — 保存大纲进度
router.post('/syllabus', async (req, res) => {
  const db = await getDB();
  const client = await db.connect();
  try {
    const data = req.body;
    await client.query('BEGIN');
    for (const [ch, done] of Object.entries(data)) {
      await client.query(
        `INSERT INTO syllabus_progress (chapter, done, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (chapter) DO UPDATE SET done=$2, updated_at=NOW()`,
        [parseInt(ch), done ? 1 : 0]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: Object.keys(data).length });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
