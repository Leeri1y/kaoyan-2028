// ============================================================
// 数据库层 —— 已从 better-sqlite3 迁移到 PostgreSQL
//
// 之前用 SQLite 本地文件存储，部署在 Render 免费实例上时，文件系统是
// 临时的：服务重启/重新部署/闲置休眠后再唤醒，都会导致本地文件被清空，
// 这就是"打卡数据过一阵子就丢了"的根本原因。
//
// 迁移到 Postgres 后，数据存储在独立的数据库服务里，不再随 Web 服务的
// 生命周期重置，服务重启也不会丢数据。
//
// 注意：这里所有操作都从 better-sqlite3 的"同步调用"变成了 pg 的
// "Promise 异步调用"，调用方（各 routes/*.js）都需要用 await。
// ============================================================

const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('缺少环境变量 DATABASE_URL，请在 Render 后台绑定 Postgres 数据库，或在本地 .env 里配置');
    }
    pool = new Pool({
      connectionString,
      // Render 的 Postgres 外部连接需要 SSL；本地开发一般不需要，
      // 用 PGSSLMODE=disable 或者不设置 sslmode 参数即可跳过。
      // 云端托管的 Postgres（Neon、Render 等）基本都要求 SSL，即使连接串里
      // 没写 sslmode 参数。之前只认 'sslmode=require' 字样，结果用 Render
      // 的 External URL 做数据迁移时就因为漏判导致连接失败。这里改成
      // "默认开，只有连本机 localhost 才关"，更不容易漏。
      ssl: /localhost|127\.0\.0\.1/.test(connectionString) || process.env.PGSSL === 'false'
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

let schemaReady = null;

// 确保表结构存在；用 Promise 缓存，避免每个请求都重复执行一遍 CREATE TABLE
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        notes TEXT DEFAULT '',
        photo_urls TEXT DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checkin_tasks (
        id SERIAL PRIMARY KEY,
        checkin_id INTEGER NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        label TEXT NOT NULL,
        done INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS study_notes (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daily_progress (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        quote_id INTEGER DEFAULT 0,
        word_ids TEXT DEFAULT '[]',
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 上传的照片改为直接把文件内容存进数据库（bytea），不再写本地磁盘。
      -- 个人用量下 Render 免费 Postgres（1GB）完全够用，且彻底避免了
      -- "文件系统临时、照片会丢"的同一类问题。
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        original_name TEXT NOT NULL,
        mime_type TEXT DEFAULT '',
        size INTEGER DEFAULT 0,
        date TEXT NOT NULL,
        file_data BYTEA NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS word_mastery (
        id SERIAL PRIMARY KEY,
        word_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'new',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS syllabus_progress (
        id SERIAL PRIMARY KEY,
        chapter INTEGER NOT NULL UNIQUE,
        done INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `).then(() => {
      console.log('数据库表初始化完成 (Postgres)');
    }).catch(err => {
      schemaReady = null; // 失败了下次请求再重试一次，而不是永久卡死
      throw err;
    });
  }
  return schemaReady;
}

// 统一的查询入口：await getDB() 之后拿到的是一个可以直接 .query() 的对象
async function getDB() {
  await ensureSchema();
  return getPool();
}

async function closeDB() {
  if (pool) { await pool.end(); pool = null; schemaReady = null; }
}

module.exports = { getDB, closeDB };
