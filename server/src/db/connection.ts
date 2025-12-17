import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database path - use Render Disk path in production
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'kpi.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Migration: Add upload_type column to upload_logs if it doesn't exist
try {
  const columns = db.prepare("PRAGMA table_info(upload_logs)").all() as { name: string }[];
  const hasUploadType = columns.some(col => col.name === 'upload_type');
  if (!hasUploadType) {
    db.exec("ALTER TABLE upload_logs ADD COLUMN upload_type TEXT DEFAULT 'body-leasing'");
    console.log('✅ Added upload_type column to upload_logs');
  }
} catch (e) {
  // Table might not exist yet, will be created by init.ts
}

console.log(`📦 SQLite database: ${DB_PATH}`);

export default db;
