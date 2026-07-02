const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../db/database');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${ts}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|md)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    const db = getDB();
    const date = req.body.date || new Date().toISOString().slice(0, 10);

    db.prepare(
      'INSERT INTO uploads (original_name, filename, filepath, size, mime_type, date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.file.originalname, req.file.filename, req.file.path, req.file.size, req.file.mimetype, date);

    res.json({
      success: true,
      id: db.prepare('SELECT last_insert_rowid() as id').get().id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      message: '上传成功'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list/:date', (req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare(
      'SELECT id, original_name, filename, size, mime_type, date, created_at FROM uploads WHERE date = ? ORDER BY created_at DESC'
    ).all(req.params.date);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDB();
    const row = db.prepare('SELECT * FROM uploads WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '文件不存在' });
    try { fs.unlinkSync(row.filepath); } catch (e) { /* ignore */ }
    db.prepare('DELETE FROM uploads WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
