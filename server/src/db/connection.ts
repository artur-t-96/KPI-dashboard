import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database path - use Render Disk path in production
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'kpi.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

console.log(`📦 SQLite database: ${DB_PATH}`);

export default db;
