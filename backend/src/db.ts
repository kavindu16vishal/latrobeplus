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
