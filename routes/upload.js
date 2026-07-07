const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getDB } = require('../db/database');

// 改用内存存储：文件内容直接写进 Postgres 的 bytea 字段，不再落地到
// Render 实例的本地磁盘（本地磁盘同样是临时的，之前照片也会跟着丢）。
// 个人使用量级下，Render 免费 Postgres 的存储额度完全够用。
const upload = multer({
  storage: multer.memoryStorage(),
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

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择文件' });
    const db = await getDB();
    const date = req.body.date || new Date().toISOString().slice(0, 10);

    const { rows } = await db.query(
      `INSERT INTO uploads (original_name, mime_type, size, date, file_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.file.originalname, req.file.mimetype, req.file.size, date, req.file.buffer]
    );

    res.json({
      success: true,
      id: rows[0].id,
      originalName: req.file.originalname,
      url: `/api/upload/file/${rows[0].id}`,
      message: '上传成功'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list/:date', async (req, res) => {
  try {
    const db = await getDB();
    const { rows } = await db.query(
      'SELECT id, original_name, size, mime_type, date, created_at FROM uploads WHERE date = $1 ORDER BY created_at DESC',
      [req.params.date]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 实际返回图片/文件二进制内容，供 <img src> 直接使用
router.get('/file/:id', async (req, res) => {
  try {
    const db = await getDB();
    const { rows } = await db.query(
      'SELECT original_name, mime_type, file_data FROM uploads WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: '文件不存在' });
    const row = rows[0];
    res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(row.file_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDB();
    const { rowCount } = await db.query('DELETE FROM uploads WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: '文件不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
