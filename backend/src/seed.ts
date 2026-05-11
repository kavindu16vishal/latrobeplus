import bcrypt from 'bcryptjs';
import { getDb, query } from './db';
import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

const seedDatabase = async () => {
  try {
    console.log('Initializing SQLite database...');
    const db = await getDb();
    
    // Execute schema
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schemaSql);
    console.log('Database schema created.');

    console.log('Seeding demo accounts...');

    const studentPassword = await bcrypt.hash('Student123', 10);
    const lecturerPassword = await bcrypt.hash('Lecturer123', 10);
    const adminPassword = await bcrypt.hash('Admin123', 10);

    // Insert Student
    await query(`
      INSERT INTO users (full_name, email, password_hash, role, student_id)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (email) DO NOTHING
    `, ['Demo Student', 'student@latrobe.edu', studentPassword, 'student', 'STU001']);

    // Insert Lecturer
    await query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (email) DO NOTHING
    `, ['Demo Lecturer', 'lecturer@latrobe.edu', lecturerPassword, 'lecturer']);

    // Insert Admin
    await query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (email) DO NOTHING
    `, ['Demo Admin', 'admin@latrobe.edu', adminPassword, 'admin']);

    console.log('Demo accounts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
