const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'kaoyan.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      notes TEXT DEFAULT '',
      photo_urls TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS checkin_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkin_id INTEGER NOT NULL,
      task_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      label TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS daily_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      quote_id INTEGER DEFAULT 0,
      word_ids TEXT DEFAULT '[]',
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('数据库表初始化完成');
}

function closeDB() {
  if (db) { db.close(); db = null; }
}

module.exports = { getDB, closeDB };
