const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDB, closeDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — 允许 Vercel 前端跨域调用
app.use(cors({
  origin: [
    'https://leerily.site',
    'https://www.leerily.site',
    /\.vercel\.app$/,
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ---- 简单的共享密钥校验 ----
// 说明：这只是"挡住随手访问/自动化扫描"级别的门槛，不是真正的身份认证——
// 因为 Token 最终会出现在前端源码（public/js/config.js）里，任何打开浏览器
// 开发者工具的人都能看到它。但相比之前完全不设防、任何人拿到 URL 就能读写
// 删除数据，这一步能显著降低被随意访问/被脚本扫到乱写数据的风险。
// 如果之后要更严格，需要做真正的登录鉴权（用户名密码/JWT）。
function requireToken(req, res, next) {
  if (req.path === '/health') return next(); // Render 健康检查不会带自定义头，必须放行
  const token = process.env.APP_TOKEN;
  if (!token) return next(); // 没配置 APP_TOKEN 时不限制，方便本地开发
  const provided = req.get('X-App-Token');
  if (provided !== token) {
    return res.status(401).json({ error: '未授权：缺少或错误的访问令牌' });
  }
  next();
}
app.use('/api', requireToken);

// Routes
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/words', require('./routes/words'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/plan', require('./routes/plan'));
app.use('/api/sync', require('./routes/sync'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toLocaleString('zh-CN') });
});

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) res.status(404).json({ error: 'API not found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

process.on('SIGINT', () => { closeDB(); process.exit(0); });
process.on('SIGTERM', () => { closeDB(); process.exit(0); });

// 初始化数据库并启动
getDB();
app.listen(PORT, () => {
  console.log(`考研备考系统已启动 -> http://localhost:${PORT}`);
  console.log(`目标院校: 广州大学 085406 控制工程`);
  if (process.env.API_PUBLIC_URL) {
    console.log(`公网地址: ${process.env.API_PUBLIC_URL}`);
  }
});
