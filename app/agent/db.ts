import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.cwd(), 'chat_history.db');
const db = new Database(dbPath);

// 初始化 sessions 表
export function initSessionTable() {
    db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

// 自动初始化数据库表
initSessionTable();

export function createSession(id: string, name: string) {
    db.prepare('INSERT INTO sessions (id, name) VALUES (?, ?)').run(id, name);
}

export function getAllSessions() {
    return db.prepare('SELECT id, name, created_at FROM sessions ORDER BY created_at DESC').all();
}

export function updateSessionName(id: string, name: string) {
    db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(name, id);
}

export function deleteSession(id: string) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export default db; 