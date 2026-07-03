// API 后端地址配置
// ===================================================
// 本地开发时留空即可（访问同源 http://localhost:3000）
// 部署到 Vercel 时改为后端的真实地址，例如:
//   window.API_BASE = 'https://kaoyan-api.up.railway.app';
// ===================================================
window.API_BASE = 'https://kaoyan-2028.onrender.com';

// 与后端 Render 环境变量 APP_TOKEN 保持一致（简单的门槛，不是完整鉴权，
// 详见 server.js 里的说明）。留空则不发送该头，等价于不校验。
window.APP_TOKEN = '';
