const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/playground.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    ticket_no TEXT UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    amount REAL NOT NULL,
    card_type_id INTEGER,
    contact_phone TEXT,
    status TEXT DEFAULT 'valid',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    refunded_at TEXT,
    FOREIGN KEY (session_id) REFERENCES play_sessions(id),
    FOREIGN KEY (card_type_id) REFERENCES card_types(id)
  );
`);

module.exports = db;
