import xlsx from 'xlsx';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getDb, query } from './db';

const filePath = path.resolve(__dirname, '../../database/CSE_results_150_students_3_Subject_SIM.xlsx');

export const processExcel = async (customFilePath: string = filePath) => {
  try {
    console.log(`Processing Excel file: ${customFilePath}`);
    const workbook = xlsx.readFile(customFilePath);
    const db = await getDb();

    // Start transaction
    await db.exec('BEGIN TRANSACTION');

    // Parse Assessment Map to create Subjects and Assessments
    const mapSheet = workbook.Sheets['Assessment Map'];
    const mapData: any[] = xlsx.utils.sheet_to_json(mapSheet);

    console.log('Inserting Subjects and Assessments...');
    const subjectCodeToId: Record<string, number> = {};
    const assessmentTypeToId: Record<string, number> = {};

    for (const row of mapData) {
      const subjectCode = row['Subject Code'];
      if (!subjectCode) continue;

      // Insert Subject if not exists
      let subjId = subjectCodeToId[subjectCode];
      if (!subjId) {
        const subjQuery = await query(
          'INSERT INTO subjects (subject_code, subject_name) VALUES (?, ?) ON CONFLICT(subject_code) DO UPDATE SET subject_code=subject_code',
          [subjectCode, `${subjectCode} Subject`]
        );
        const subjLookup = await query('SELECT id FROM subjects WHERE subject_code = ?', [subjectCode]);
        subjId = subjLookup.rows[0].id;
        subjectCodeToId[subjectCode] = subjId;
      }

      // Insert Assessment
      const assessmentName = row['Assessment Type'];
      const weight = row['Weight'] || 0;
      
      const assQuery = await query(
        'INSERT INTO assessments (subject_id, assessment_name, assessment_type, weight) VALUES (?, ?, ?, ?)',
        [subjId, assessmentName, assessmentName, weight]
      );
      assessmentTypeToId[assessmentName] = assQuery.lastID as number;

      // Optional: Parse SILOs from 'SILO Theme Summary' and insert into silos table
    }

    // Parse Results Sheet to create Users and Results
    const resultsSheet = workbook.Sheets['Results'];
    const resultsData: any[] = xlsx.utils.sheet_to_json(resultsSheet);

    console.log('Inserting Students and Results...');
    const studentIdToDbId: Record<string, number> = {};
    const defaultPassword = await bcrypt.hash('Student123', 10);

    for (const row of resultsData) {
      const studentId = row['Student ID'];
      if (!studentId) continue;

      // Create User if not exists
      let userId = studentIdToDbId[studentId];
      if (!userId) {
        const email = `${studentId.toLowerCase()}@latrobe.edu`;
        await query(
          'INSERT INTO users (full_name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING',
          [`Student ${studentId}`, email, defaultPassword, 'student', studentId]
        );
        const userLookup = await query('SELECT id FROM users WHERE student_id = ?', [studentId]);
        userId = userLookup.rows[0].id;
        studentIdToDbId[studentId] = userId;
      }

      const assessmentType = row['Assessment Type'];
      const score = row['Score (1-100)'];
      const weightedScore = row['Weighted Score'];
      const feedback = row['Feedback Comment'];
      
      const assessmentId = assessmentTypeToId[assessmentType];

      // Insert Result
      if (assessmentId) {
        let masteryLevel = 'Beginner';
        if (score >= 81) masteryLevel = 'Advanced';
        else if (score >= 61) masteryLevel = 'Proficient';
        else if (score >= 41) masteryLevel = 'Developing';

        await query(
          'INSERT INTO student_results (student_id, assessment_id, score, weighted_score, feedback_comment, mastery_level) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, assessmentId, score, weightedScore, feedback, masteryLevel]
        );
      }
    }

    // Parse Student Summary to calculate competency profiles (mocked logic)
    const summarySheet = workbook.Sheets['Student Summary'];
    const summaryData: any[] = xlsx.utils.sheet_to_json(summarySheet);

    console.log('Generating Competency Profiles and Recommendations...');
    for (const row of summaryData) {
      const studentId = row['Student ID'];
      const performanceBand = row['Performance Band'];
      const userId = studentIdToDbId[studentId];

      if (userId) {
        // Insert Recommendation if At Risk
        if (performanceBand === 'At risk') {
          await query(
            'INSERT INTO recommendations (student_id, recommendation_text, recommendation_type) VALUES (?, ?, ?)',
            [userId, 'Your performance is currently categorized as "At risk". We strongly recommend booking a session with your lecturer and reviewing foundational topics.', 'warning']
          );
        }
      }
    }

    await db.exec('COMMIT');
    console.log('Excel Processing Complete!');
    return true;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    const db = await getDb();
    await db.exec('ROLLBACK');
    throw error;
  }
};

// If run directly
if (require.main === module) {
  processExcel().then(() => process.exit(0)).catch(() => process.exit(1));
}
