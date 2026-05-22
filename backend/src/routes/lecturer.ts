import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

router.get('/overview', authenticateToken, requireRole(['lecturer', 'admin']), async (req, res) => {
  try {
    // Class average WAM across students who have results
    const avgResult = await query(`
      SELECT AVG(wam) as class_avg
      FROM (
        SELECT u.id, AVG(sr.score) as wam
        FROM users u
        JOIN student_results sr ON sr.student_id = u.id
        WHERE u.role = 'student'
        GROUP BY u.id
      )
    `);

    // Total enrolled students (all accounts, including those with no results yet)
    const countResult = await query(`
      SELECT COUNT(*) as total_students FROM users WHERE role = 'student'
    `);

    const classAvg = avgResult.rows[0]?.class_avg || 0;
    const totalStudents = countResult.rows[0]?.total_students || 0;

    // Grade distribution (Australian grading scale)
    const gradeResult = await query(`
      SELECT
        CASE
          WHEN wam >= 80 THEN 'High Dist'
          WHEN wam >= 70 THEN 'Distinction'
          WHEN wam >= 60 THEN 'Credit'
          WHEN wam >= 50 THEN 'Pass'
          ELSE 'Fail'
        END as grade,
        COUNT(*) as students
      FROM (
        SELECT u.id, AVG(sr.score) as wam
        FROM users u
        JOIN student_results sr ON sr.student_id = u.id
        WHERE u.role = 'student'
        GROUP BY u.id
      )
      GROUP BY grade
      ORDER BY
        CASE grade
          WHEN 'Fail' THEN 1
          WHEN 'Pass' THEN 2
          WHEN 'Credit' THEN 3
          WHEN 'Distinction' THEN 4
          WHEN 'High Dist' THEN 5
        END
    `);

    // Risk breakdown counts
    const riskResult = await query(`
      SELECT
        SUM(CASE WHEN wam < 50 THEN 1 ELSE 0 END) as at_risk,
        SUM(CASE WHEN wam >= 50 AND wam < 65 THEN 1 ELSE 0 END) as attention,
        SUM(CASE WHEN wam >= 65 THEN 1 ELSE 0 END) as on_track
      FROM (
        SELECT u.id, AVG(sr.score) as wam
        FROM users u
        JOIN student_results sr ON sr.student_id = u.id
        WHERE u.role = 'student'
        GROUP BY u.id
      )
    `);

    // Per-subject averages
    const subjectResult = await query(`
      SELECT
        s.subject_code,
        AVG(sr.score) as avg_score,
        COUNT(DISTINCT sr.student_id) as enrolled
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      GROUP BY s.id, s.subject_code
      ORDER BY avg_score ASC
    `);

    // Bottom 10 at-risk students (WAM < 65, ordered by WAM asc)
    const atRiskStudents = await query(`
      SELECT
        u.student_id,
        u.full_name,
        u.email,
        ROUND(AVG(sr.score), 1) as wam,
        CASE
          WHEN AVG(sr.score) < 50 THEN 'At Risk'
          ELSE 'Attention Needed'
        END as status
      FROM users u
      JOIN student_results sr ON sr.student_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id
      HAVING AVG(sr.score) < 65
      ORDER BY wam ASC
      LIMIT 10
    `);

    // Weakest subject per at-risk student
    const atRiskWithSubject = await Promise.all(
      atRiskStudents.rows.map(async (s: any) => {
        const weakSubject = await query(`
          SELECT s.subject_code, ROUND(AVG(sr.score), 1) as score
          FROM student_results sr
          JOIN assessments a ON sr.assessment_id = a.id
          JOIN subjects s ON a.subject_id = s.id
          JOIN users u ON sr.student_id = u.id
          WHERE u.student_id = ?
          GROUP BY s.subject_code
          ORDER BY score ASC
          LIMIT 1
        `, [s.student_id]);

        return {
          ...s,
          weakestSubject: weakSubject.rows[0]?.subject_code || null,
          weakestScore: weakSubject.rows[0]?.score || null
        };
      })
    );

    const risk = riskResult.rows[0] || {};

    res.json({
      classAvg: Number(classAvg).toFixed(1),
      totalStudents,
      atRiskCount: risk.at_risk || 0,
      attentionCount: risk.attention || 0,
      onTrackCount: risk.on_track || 0,
      gradeDistribution: gradeResult.rows,
      riskBreakdown: [
        { name: 'On Track',         value: risk.on_track  || 0, color: '#22c55e' },
        { name: 'Attention Needed', value: risk.attention || 0, color: '#f59e0b' },
        { name: 'At Risk',          value: risk.at_risk   || 0, color: '#ef4444' },
      ],
      subjectAverages: subjectResult.rows.map((s: any) => ({
        subject: s.subject_code,
        avg: Number(Number(s.avg_score).toFixed(1)),
        enrolled: s.enrolled
      })),
      atRiskStudents: atRiskWithSubject
    });

  } catch (error) {
    console.error('Lecturer overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

export default router;
