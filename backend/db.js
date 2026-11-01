// Persistent storage on SQLite (built into Node >= 22.5, no native build needed).
// Every entity is stored as a JSON document in one table, so the generic
// entity API keeps working while all data survives server restarts.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'epicurean.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS records (
    entity TEXT NOT NULL,
    id     TEXT NOT NULL,
    data   TEXT NOT NULL,
    PRIMARY KEY (entity, id)
  );

  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

const stmt = {
  list:   sqlite.prepare('SELECT data FROM records WHERE entity = ? ORDER BY rowid'),
  get:    sqlite.prepare('SELECT data FROM records WHERE entity = ? AND id = ?'),
  upsert: sqlite.prepare('INSERT INTO records (entity, id, data) VALUES (?, ?, ?) ON CONFLICT(entity, id) DO UPDATE SET data = excluded.data'),
  remove: sqlite.prepare('DELETE FROM records WHERE entity = ? AND id = ?'),
  count:  sqlite.prepare('SELECT COUNT(*) AS n FROM records WHERE entity = ?'),
  findBy: sqlite.prepare("SELECT data FROM records WHERE entity = ? AND json_extract(data, '$.' || ?) = ? LIMIT 1"),

  metaGet: sqlite.prepare('SELECT value FROM meta WHERE key = ?'),
  metaSet: sqlite.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
  wipe:    sqlite.prepare('DELETE FROM records WHERE entity = ?'),

  sessionInsert: sqlite.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
  sessionGet:    sqlite.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?'),
  sessionDelete: sqlite.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  sessionDeleteForUser: sqlite.prepare('DELETE FROM sessions WHERE user_id = ?'),
  sessionPurge:  sqlite.prepare('DELETE FROM sessions WHERE expires_at < ?'),
};

const parse = (row) => (row ? JSON.parse(row.data) : null);

const store = {
  list: (entity) => stmt.list.all(entity).map(parse),
  get: (entity, id) => parse(stmt.get.get(entity, String(id))),
  findBy: (entity, field, value) => parse(stmt.findBy.get(entity, field, value)),
  count: (entity) => stmt.count.get(entity).n,
  save: (entity, item) => { stmt.upsert.run(entity, String(item.id), JSON.stringify(item)); return item; },
  remove: (entity, id) => stmt.remove.run(entity, String(id)).changes > 0,
  wipe: (entity) => stmt.wipe.run(entity),
  getMeta: (key) => stmt.metaGet.get(key)?.value ?? null,
  setMeta: (key, value) => stmt.metaSet.run(key, String(value)),

  // Runs fn atomically; rolls back on any thrown error
  transaction: (fn) => {
    sqlite.exec('BEGIN');
    try {
      const result = fn();
      sqlite.exec('COMMIT');
      return result;
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }
  },
};

// Session tokens are stored only as SHA-256 hashes: a leaked DB file does not leak live sessions
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const sessions = {
  create: (userId, ttlMs) => {
    const token = crypto.randomBytes(32).toString('hex');
    stmt.sessionInsert.run(hashToken(token), userId, Date.now() + ttlMs);
    return token;
  },
  resolve: (token) => {
    if (!token) return null;
    const row = stmt.sessionGet.get(hashToken(token));
    if (!row) return null;
    if (row.expires_at < Date.now()) { stmt.sessionDelete.run(hashToken(token)); return null; }
    return row.user_id;
  },
  destroy: (token) => { if (token) stmt.sessionDelete.run(hashToken(token)); },
  destroyAllForUser: (userId) => stmt.sessionDeleteForUser.run(userId),
  purgeExpired: () => stmt.sessionPurge.run(Date.now()),
};

module.exports = { store, sessions, DB_PATH };
