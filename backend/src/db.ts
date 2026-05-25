import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../../database/database.sqlite');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export const getDb = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Auto-apply schema on first connection (CREATE TABLE IF NOT EXISTS is safe)
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await dbInstance.exec(schemaSql);
    }

    // Column migrations — safe to re-run, errors are silently swallowed
    const migrations = [
      `ALTER TABLE assessments ADD COLUMN due_date TEXT`,
      `ALTER TABLE users ADD COLUMN avatar TEXT`,
      `ALTER TABLE users ADD COLUMN bio TEXT`,
      `ALTER TABLE users ADD COLUMN target_wam REAL DEFAULT 70`,
      `ALTER TABLE users ADD COLUMN study_goal_hours INTEGER DEFAULT 20`,
      `ALTER TABLE users ADD COLUMN preferred_study_time TEXT DEFAULT 'morning'`,
      `ALTER TABLE users ADD COLUMN notify_email INTEGER DEFAULT 1`,
      `ALTER TABLE users ADD COLUMN notify_inapp INTEGER DEFAULT 1`,
      `ALTER TABLE users ADD COLUMN title TEXT`,
      `ALTER TABLE users ADD COLUMN office_hours TEXT`,
    ];
    for (const m of migrations) {
      try { await dbInstance.exec(m); } catch {}
    }
  }
  return dbInstance;
};

// Polyfill query method to be somewhat compatible with pg driver
export const query = async (text: string, params: any[] = []) => {
  const db = await getDb();
  // If it's a SELECT query, use .all()
  if (text.trim().toUpperCase().startsWith('SELECT')) {
    const rows = await db.all(text, params);
    return { rows };
  } else {
    // If it's an INSERT/UPDATE/DELETE, use .run()
    const result = await db.run(text, params);
    return { rows: [], lastID: result.lastID, changes: result.changes };
  }
};
