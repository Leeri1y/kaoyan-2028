// 加载本地 .env 文件（如果存在）。Render 部署时不受影响：它是直接把
// 环境变量注入到进程里的，没有 .env 文件，这里 require 不会报错，
// 只是找不到文件就什么都不做。
require('dotenv').config();

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
app.use(express.static(path.join(__dirname, 'public')));
// 注意：不再有 /uploads 静态目录 —— 照片已经改成存进 Postgres，
// 通过 /api/upload/file/:id 动态读取返回，见 routes/upload.js。

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
  // <img src> 这类标签浏览器不会带自定义请求头，所以图片接口额外允许把
  // token 放在查询参数 ?t= 里传递（前端 tracker.js 会自动拼接）。
  const provided = req.get('X-App-Token') || req.query.t;
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

process.on('SIGINT', () => { closeDB().finally(() => process.exit(0)); });
process.on('SIGTERM', () => { closeDB().finally(() => process.exit(0)); });

// 初始化数据库（建表）之后再监听端口；如果连不上 Postgres（比如忘了配置
// DATABASE_URL），直接把错误打出来退出，而不是"看起来启动成功了但其实
// 每个接口都会 500"。
getDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`考研备考系统已启动 -> http://localhost:${PORT}`);
      console.log(`目标院校: 广州大学 085406 控制工程`);
      if (process.env.API_PUBLIC_URL) {
        console.log(`公网地址: ${process.env.API_PUBLIC_URL}`);
      }
    });
  })
  .catch(err => {
    console.error('数据库初始化失败，服务未启动:', err.message);
    process.exit(1);
  });

// 放在其他路由和静态文件中间件之前，确保优先匹配
app.get('/12b01c2fcfad015a5a626ea1530cbdfd.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  // 引号内严格复制内容，末尾不要加回车、空格
  res.status(200).send('550998a891f0c14cfe23f498137477c46858b3b2');
});
