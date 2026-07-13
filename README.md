# 2028 考研备考系统 — 广州大学 085406 控制工程

> 一个轻量、全天候在线的考研每日打卡与进度追踪系统。  
> 前端托管于 Vercel，后端 API 部署于 Render，数据库使用 Render 免费 PostgreSQL。

---

## 目录

- [项目概览](#项目概览)
- [功能矩阵](#功能矩阵)
- [技术架构](#技术架构)
- [数据流与路由设计](#数据流与路由设计)
- [部署拓扑](#部署拓扑)
- [本地开发](#本地开发)
- [API 文档](#api-文档)
- [数据库设计](#数据库设计)
- [设计决策记录](#设计决策记录)
- [路线图](#路线图)

---

## 项目概览

### 目标用户

本人（Leeri1y），目标为 **广州大学 085406 控制工程** 专业的 2028 届硕士研究生考生。

### 核心诉求

| 诉求 | 解决方案 |
|------|----------|
| 每天知道该学什么 | 分阶段自动切换的任务清单 |
| 坚持每天打卡 | 每日打卡 + 近 30 天历史回顾 |
| 背单词不重复 | 基于日期种子的确定性随机取词 |
| 看一眼激励自己 | 每日一句考研/诗词金句 |
| 上传学习资料 | 文件上传 + PostgreSQL bytea 持久化 |
| 手机/电脑都能用 | 响应式 SPA，Vercel 全球 CDN |
| 数据不丢 | 独立 PostgreSQL，不依赖实例本地盘 |
| 轻量够用就行 | 零框架前端、无 OAuth、单页应用 |

---

## 功能矩阵

### 备考概览（overview）

- 当前所处备考阶段（地基期 → 强化期 → 冲刺期 → 收尾期）
- 每日一句激励金句（数据源：`data/quotes.json`，日期种子伪随机）
- 每日 20 个考研核心词（数据源：`data/words.json`，日期种子伪随机）
- 近 3 天单词复习
- 单词掌握状态追踪（new / learning / known / mastered）

### 每日学习（daily）

- 按日期查阅学习笔记
- 按科目筛选笔记
- 新建/编辑笔记

### 每日打卡（tracker）

- 根据当前阶段展示对应任务清单
- 勾选完成任务
- 填写学习备注
- 上传学习照片/文件（直接存入 PostgreSQL）
- 查看近 30 天打卡历史

### 专业课大纲（syllabus）

- 6 章《自动控制原理》大纲总览
- 每章知识点细化
- 考试科目信息（初试 4 门 + 复试 2 门）
- 参考书目清单
- 章节完成进度标记与云端同步

### 备考资源（resources）

- 各阶段推荐教材与视频
- 推荐 App 清单（墨墨背单词、苍盾考研 等）
- 一键直达链接

---

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ index.html│  │  api.js  │  │tracker.js│  │daily.js │ │
│  │  (SPA)   │  │ (fetch)  │  │  (打卡)   │  │  (笔记)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │overview.js│  │syllabus.js│ │resources.js│ │utils.js │ │
│  │  (概览)   │  │  (大纲)   │  │  (资源)   │  │ (工具)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐                               │
│  │ config.js│  │  app.js  │                               │
│  │ (API地址) │  │ (路由)   │                               │
│  └──────────┘  └──────────┘                               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / CORS + X-App-Token
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Backend API (Render Web Service)           │
│  ┌────────────────────────────────────────────────────┐  │
│  │                   Express.js                       │  │
│  │   /api/checkin/*   /api/words/*   /api/quotes/*    │  │
│  │   /api/upload/*    /api/plan/*    /api/sync/*      │  │
│  │   /api/health                                      │  │
│  │   Auth: X-App-Token middleware                     │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │ pg (node-postgres)              │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Render DB)                │  │
│  │  checkins  |  checkin_tasks  |  uploads            │  │
│  │  word_mastery  |  syllabus_progress                │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │      Static Data (JSON files, loaded at boot)      │  │
│  │  data/quotes.json  |  data/words.json              │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 核心依赖

| 包 | 用途 |
|-----|------|
| `express` | HTTP 服务框架 |
| `pg` | PostgreSQL 驱动（node-postgres） |
| `multer` | 文件上传中间件（内存存储） |
| `cors` | 跨域支持（允许 Vercel 前端调用） |
| `dotenv` | 本地环境变量加载 |

---

## 数据流与路由设计

### 阶段性任务的自适应切换

```
data/plan-phases.js（唯一数据源）
        │
        ├──> routes/checkin.js  →  GET /:date  →  返回当日任务 + 已勾选状态
        │                          POST /:date  →  保存勾选 + 备注 + 照片
        │
        └──> routes/plan.js     →  GET /phases  →  返回全部阶段定义
                                  GET /current →  返回当前所处阶段
```

### 每日单词与金句的确定性伪随机

```
dateSeed(dateStr) 将 "2026-07-13" → 数字 20260713
        │
        ├──> routes/quotes.js  →  seed % quotes.length   →  每日固定同一句
        └──> routes/words.js   →  LCG伪随机 + Set去重   →  每日固定20词
```

### 文件上传与持久化

```
multer (memoryStorage) → 接收文件 buffer
        │
        ▼
INSERT INTO uploads (file_data BYTEA) → 文件以二进制存入 PostgreSQL
        │
        ▼
GET /upload/file/:id → 从数据库读取 → 设置 Content-Type → 返回二进制 → <img src> 直接渲染
```

### 多端数据同步

```
frontend (浏览器 A)           frontend (浏览器 B)
        │                            │
        └── POST /sync/mastery ──────┘  (合并上传)
             POST /sync/syllabus
             
        ┌── GET /sync/mastery ──────┐  (拉取云端最新)
            GET /sync/syllabus
```

---

## 部署拓扑

```mermaid
graph LR
    User[用户浏览器] --> Vercel[Vercel CDN]
    Vercel --> Render[Render Web Service<br/>kaoyan-2028]
    Render --> PG[(Render PostgreSQL<br/>kaoyan-2028-db)]
    
    style Vercel fill:#000,color:#fff
    style Render fill:#4A90D9,color:#fff
    style PG fill:#336791,color:#fff
```

| 组件 | 平台 | 方案 | 成本 |
|------|------|------|------|
| 前端静态文件 | Vercel | `vercel.json` → SPA fallback | 免费 |
| 后端 API | Render | Node + Express，自动 HTTPS | 免费 |
| 数据库 | Render PostgreSQL | 独立托管，不随实例重启 | 免费（1GB） |
| 自定义域名 | Cloudflare | `leerily.site` → Vercel | 免费 |

---

## 本地开发

### 前置条件

- Node.js >= 18
- 一个 PostgreSQL 实例（本地或远程）

### 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入：
#   DATABASE_URL=postgres://user:pass@host:5432/kaoyan2028
#   APP_TOKEN=your_secret_token（可选）

# 3. 启动
npm start
# → http://localhost:3000
```

### 构建说明

无构建步骤。前端为原生 HTML/CSS/JS，直接由 Express 的 `express.static` 托管 `public/` 目录。

---

## API 文档

所有 `/api/*` 接口都需要携带 `X-App-Token` 请求头（若 `APP_TOKEN` 环境变量已配置）。  
图片文件接口额外支持 `?t=token` 查询参数（兼容 `<img src>` 标签）。

### 打卡系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/checkin/:date` | 获取指定日期的任务、备注、照片 |
| POST | `/api/checkin/:date` | 保存指定日期的任务勾选、备注、照片 |
| GET | `/api/checkin/:date/history` | 获取前 30 天打卡历史 |

### 单词系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/words/today?date=` | 获取当日 20 词 |
| GET | `/api/words/review?date=` | 获取最近 3 天的单词 |
| GET | `/api/words/bank` | 获取词库统计信息 |

### 金句系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/quotes/today?date=` | 获取当日金句 |

### 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件（multipart/form-data） |
| GET | `/api/upload/list/:date` | 获取某日上传文件列表 |
| GET | `/api/upload/file/:id` | 获取文件二进制内容 |
| DELETE | `/api/upload/:id` | 删除文件 |

### 备考计划

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plan/phases` | 获取所有备考阶段定义 |
| GET | `/api/plan/current` | 获取当前所处阶段 |
| GET | `/api/plan/apps` | 获取推荐 App 清单 |
| GET | `/api/plan/syllabus` | 获取专业课大纲与考试信息 |

### 数据同步

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sync/mastery` | 拉取单词掌握状态 |
| POST | `/api/sync/mastery` | 批量保存单词掌握状态 |
| GET | `/api/sync/syllabus` | 拉取大纲进度 |
| POST | `/api/sync/syllabus` | 批量保存大纲进度 |

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 服务健康检查（Render 专用，不校验 Token） |

---

## 数据库设计

```sql
-- 打卡记录
checkins (id SERIAL PK, date TEXT UNIQUE, notes TEXT, photo_urls TEXT DEFAULT '[]',
          created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)

-- 打卡任务明细
checkin_tasks (id SERIAL PK, checkin_id FK→checkins, task_id TEXT, subject TEXT,
               label TEXT, done INTEGER)

-- 学习笔记
study_notes (id SERIAL PK, date TEXT, subject TEXT, content TEXT, created_at TIMESTAMPTZ)

-- 每日进度（预留，当前未被前端使用）
daily_progress (id SERIAL PK, date TEXT UNIQUE, quote_id INTEGER, word_ids TEXT,
                completed INTEGER, created_at TIMESTAMPTZ)

-- 文件上传（二进制存储）
uploads (id SERIAL PK, original_name TEXT, mime_type TEXT, size INTEGER,
         date TEXT, file_data BYTEA, created_at TIMESTAMPTZ)

-- 单词掌握状态
word_mastery (id SERIAL PK, word_key TEXT UNIQUE, status TEXT DEFAULT 'new',
              updated_at TIMESTAMPTZ)

-- 大纲章节进度
syllabus_progress (id SERIAL PK, chapter INTEGER UNIQUE, done INTEGER,
                   updated_at TIMESTAMPTZ)
```

### 存储策略

- **用户产生数据** → PostgreSQL（7 张表，持久化、跨部署周期保留）
- **静态配置数据** → JSON 文件（`quotes.json`、`words.json`、`plan-phases.js`，启动时加载到内存，更新需重新部署）
- **上传文件** → PostgreSQL `bytea` 字段（避免 Render 临时文件系统导致文件丢失）

---

## 设计决策记录

### 为什么用 PostgreSQL 而非 SQLite？

**问题**：项目最初使用 `better-sqlite3` + 本地文件存储。部署到 Render 免费实例后，服务重启/重新部署/闲置休眠都会清空文件系统，打卡数据反复丢失。

**方案**：迁移到 Render 免费 PostgreSQL：
- 数据独立于 Web 实例生命周期，重启不丢
- 1GB 免费额度对个人使用绰绰有余
- 同步 API → 变成 `await` 异步，路由层统一适配

**代价**：本地开发需要跑一个 PostgreSQL 实例，不如 SQLite 零配置方便。通过 `DATABASE_URL` 环境变量切换，本地可用 Docker Postgres 或远程测试库。

### 为什么用日期种子而非真随机？

每天固定同一组单词和同一句金句，好处：
- 多设备访问体验一致（手机 + PC 看到同样的内容）
- 若有朋友一起备考，讨论"今天的单词"时在同一起跑线
- 避免真随机导致的"今天太难/今天太简单"的偶然偏差

### 为什么没用前端框架？

- 单用户应用，页面结构简单（4-5 个 Tab）
- 无需状态管理、路由库、虚拟 DOM
- 零构建步骤，改完 HTML/JS 直接刷新即可验证
- 减少依赖体积，Vercel 部署即 CDN

**权衡**：功能增多后维护成本会上升。如果后续要加多人协作/实时功能，值得迁移到 Vue/React。

### 为什么不上 OAuth / 登录系统？

- 个人使用，不需要多用户隔离
- 一个 `APP_TOKEN` 环境变量即可挡住随手扫描
- 前端源码会暴露 Token（`public/js/config.js`），但拦住了 99% 的自动化攻击
- 如果需要共享给他人使用，应添加 JWT 登录

---

## 路线图

- [x] 每日打卡 + 分阶段任务清单
- [x] 每日单词（伪随机 20 词 + 3 天复习）
- [x] 每日金句
- [x] 文件上传（PostgreSQL 二进制存储）
- [x] SQLite → PostgreSQL 迁移
- [x] 专业课大纲进度追踪
- [x] 单词掌握状态同步
- [ ] 学习时长计时器
- [ ] 周报/月报数据统计
- [ ] 成绩预测模型（基于刷题进度）
- [ ] 番茄钟集成
- [ ] 错题本功能

---

## License

MIT
