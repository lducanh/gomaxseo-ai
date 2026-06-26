// lib/server/db.ts — SQLite connection + schema (server-side ONLY).
//
// Uses better-sqlite3 (synchronous, perfect for Route Handlers). The single
// connection is cached on globalThis so Next.js hot-reload doesn't open a new
// handle on every change. NEVER import this file from a client component —
// it must stay out of the browser bundle (see next.config.mjs externals).
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH =
  process.env.SQLITE_PATH || path.join(process.cwd(), '.data', 'studio.db');

function openDatabase(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // better concurrency for reads/writes
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id        INTEGER PRIMARY KEY CHECK (id = 1),
      language  TEXT NOT NULL DEFAULT 'vi',
      wp        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      brand_voice_id TEXT,
      language       TEXT NOT NULL,
      created_at     TEXT NOT NULL,
      data           TEXT NOT NULL              -- full Campaign JSON
    );

    CREATE TABLE IF NOT EXISTS articles (
      id          TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      status      TEXT NOT NULL,
      title       TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      data        TEXT NOT NULL,                -- full Article JSON
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_articles_campaign ON articles(campaign_id);

    CREATE TABLE IF NOT EXISTS brand_voices (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data       TEXT NOT NULL                  -- full BrandVoiceProfile JSON
    );
  `);

  // Seed the single settings row once.
  const defaultWp = JSON.stringify({
    siteUrl: '',
    username: '',
    appPassword: '',
    verified: false,
    sandbox: true,
  });
  db.prepare(
    `INSERT OR IGNORE INTO settings (id, language, wp) VALUES (1, 'vi', ?)`,
  ).run(defaultWp);
}

// Cache the connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __gomaxDb?: Database.Database };
export const db: Database.Database = globalForDb.__gomaxDb ?? openDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.__gomaxDb = db;
