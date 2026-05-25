import express from 'express';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const getOpenAI = () =>
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function generateFallbackReport(name: string, wam: number, status: string, weakSubject: string): string {
  if (status === 'At Risk') {
    return `Hi ${name}, your current WAM is ${wam}%. We are concerned about your progress, especially in ${weakSubject}. Please book a consultation as soon as possible — we are here to help you succeed.`;
  } else if (status === 'Attention Needed') {
    return `Hi ${name}, your current WAM is ${wam}%. You are making progress, but ${weakSubject} needs extra attention. Consider increasing your study time in this subject and reach out if you need support.`;
  } else {
    return `Hi ${name}, great work — your WAM is ${wam}% and you are on track. Keep maintaining your study habits. Well done!`;
  }
}

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

// ── Helper: get subjects this lecturer is assigned to (falls back to all subjects if none assigned) ──
async function getLecturerSubjectIds(lecturerId: number): Promise<number[]> {
  const assigned = await query(
    `SELECT subject_id FROM lecturer_subjects WHERE lecturer_id = ?`, [lecturerId]
  );
  if (assigned.rows.length > 0) return assigned.rows.map((r: any) => r.subject_id);
  // Fallback: return all subjects so demo accounts still work
  const all = await query(`SELECT id FROM subjects`);
  return all.rows.map((r: any) => r.id);
}

// ── GET /my-subjects ─────────────────────────────────────────────────────────
router.get('/my-subjects', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const subjectIds = await getLecturerSubjectIds(req.user!.id);
    if (subjectIds.length === 0) return res.json([]);
    const placeholders = subjectIds.map(() => '?').join(',');
    const subjects = await query(
      `SELECT s.id, s.subject_code, s.subject_name,
              COUNT(DISTINCT sr.student_id) as enrolled_count,
              ROUND(AVG(sr.score), 1) as avg_score
       FROM subjects s
       LEFT JOIN assessments a ON a.subject_id = s.id
       LEFT JOIN student_results sr ON sr.assessment_id = a.id
       WHERE s.id IN (${placeholders})
       GROUP BY s.id ORDER BY s.subject_code`,
      subjectIds
    );
    res.json(subjects.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});

// ── GET /subjects/:subjectId/assessments ─────────────────────────────────────
router.get('/subjects/:subjectId/assessments', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const assessments = await query(
      `SELECT id, assessment_name, assessment_type, weight, due_date FROM assessments WHERE subject_id = ? ORDER BY assessment_name`,
      [req.params.subjectId]
    );
    res.json(assessments.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load assessments' });
  }
});

// ── GET /subjects/:subjectId/results ─────────────────────────────────────────
router.get('/subjects/:subjectId/results', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { assessment_id } = req.query;
    let sql = `
      SELECT sr.id as result_id, u.id as student_db_id, u.student_id, u.full_name, u.email,
             a.id as assessment_id, a.assessment_name, a.weight,
             sr.score, sr.feedback_comment, sr.id
      FROM users u
      CROSS JOIN assessments a
      LEFT JOIN student_results sr ON sr.student_id = u.id AND sr.assessment_id = a.id
      WHERE u.role = 'student' AND a.subject_id = ?
    `;
    const params: any[] = [req.params.subjectId];
    if (assessment_id) { sql += ` AND a.id = ?`; params.push(assessment_id); }
    sql += ` ORDER BY u.full_name, a.assessment_name`;
    const results = await query(sql, params);
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load results' });
  }
});

// ── POST /results — enter a new result ───────────────────────────────────────
router.post('/results', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { student_id, assessment_id, score, feedback_comment } = req.body;
    if (student_id == null || assessment_id == null || score == null)
      return res.status(400).json({ error: 'student_id, assessment_id and score are required' });
    if (Number(score) < 0 || Number(score) > 100)
      return res.status(400).json({ error: 'Score must be between 0 and 100' });

    // Check for existing result
    const existing = await query(
      `SELECT id FROM student_results WHERE student_id = ? AND assessment_id = ?`,
      [student_id, assessment_id]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Result already exists — use PUT to update it', existing_id: existing.rows[0].id });

    const r = await query(
      `INSERT INTO student_results (student_id, assessment_id, score, feedback_comment) VALUES (?, ?, ?, ?)`,
      [student_id, assessment_id, score, feedback_comment || null]
    );
    res.status(201).json({ id: r.lastID, message: 'Result created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create result' });
  }
});

// ── PUT /results/:id — edit score or feedback ─────────────────────────────────
router.put('/results/:id', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { score, feedback_comment } = req.body;
    if (score != null && (Number(score) < 0 || Number(score) > 100))
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    await query(
      `UPDATE student_results SET score = COALESCE(?, score), feedback_comment = COALESCE(?, feedback_comment) WHERE id = ?`,
      [score ?? null, feedback_comment ?? null, req.params.id]
    );
    res.json({ message: 'Result updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update result' });
  }
});

// ── DELETE /results/:id ───────────────────────────────────────────────────────
router.delete('/results/:id', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM student_results WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Result deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

// ── POST /notify — send notification to one or more students ──────────────────
router.post('/notify', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { student_ids, title, body } = req.body;
    if (!student_ids?.length || !title || !body)
      return res.status(400).json({ error: 'student_ids, title and body are required' });

    const sender = await query(`SELECT full_name FROM users WHERE id = ?`, [req.user!.id]);
    const senderName = sender.rows[0]?.full_name ?? 'Lecturer';

    for (const sid of student_ids) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, sender_name, title, body) VALUES (?, ?, ?, ?, ?)`,
        [sid, req.user!.id, senderName, title, body]
      );
    }
    res.json({ message: `Notification sent to ${student_ids.length} student(s)` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ── POST /notify-at-risk — notify all at-risk students in lecturer's subjects ──
router.post('/notify-at-risk', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

    const subjectIds = await getLecturerSubjectIds(req.user!.id);
    if (subjectIds.length === 0) return res.json({ message: 'No subjects assigned', sent: 0 });

    const placeholders = subjectIds.map(() => '?').join(',');
    const atRisk = await query(`
      SELECT DISTINCT u.id FROM users u
      JOIN student_results sr ON sr.student_id = u.id
      JOIN assessments a ON sr.assessment_id = a.id
      WHERE u.role = 'student' AND a.subject_id IN (${placeholders})
      GROUP BY u.id HAVING AVG(sr.score) < 65
    `, subjectIds);

    const sender = await query(`SELECT full_name FROM users WHERE id = ?`, [req.user!.id]);
    const senderName = sender.rows[0]?.full_name ?? 'Lecturer';

    for (const s of atRisk.rows) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, sender_name, title, body) VALUES (?, ?, ?, ?, ?)`,
        [s.id, req.user!.id, senderName, title, body]
      );
    }
    res.json({ message: `Notification sent to ${atRisk.rows.length} at-risk student(s)`, sent: atRisk.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send bulk notification' });
  }
});

// ══════════════════════════════════════════════════════════
// STUDENT GROUPS
// ══════════════════════════════════════════════════════════

// GET /groups — list all groups for this lecturer
router.get('/groups', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT sg.id, sg.name, sg.description, sg.color, sg.created_at,
        COUNT(DISTINCT gm.student_id) as member_count,
        ROUND(AVG(sub.wam), 1) as avg_wam
      FROM student_groups sg
      LEFT JOIN group_members gm ON gm.group_id = sg.id
      LEFT JOIN (
        SELECT student_id, AVG(score) as wam FROM student_results GROUP BY student_id
      ) sub ON sub.student_id = gm.student_id
      WHERE sg.lecturer_id = ?
      GROUP BY sg.id
      ORDER BY sg.created_at DESC
    `, [req.user!.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load groups' });
  }
});

// POST /groups — create a group
router.post('/groups', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });
    const r = await query(
      `INSERT INTO student_groups (name, description, color, lecturer_id) VALUES (?, ?, ?, ?)`,
      [name, description || null, color || '#6366f1', req.user!.id]
    );
    res.status(201).json({ id: r.lastID, message: 'Group created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// PUT /groups/:id — update group name/description/color
router.put('/groups/:id', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { name, description, color } = req.body;
    await query(
      `UPDATE student_groups SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color) WHERE id = ? AND lecturer_id = ?`,
      [name ?? null, description ?? null, color ?? null, req.params.id, req.user!.id]
    );
    res.json({ message: 'Group updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// DELETE /groups/:id — delete a group
router.delete('/groups/:id', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM student_groups WHERE id = ? AND lecturer_id = ?`, [req.params.id, req.user!.id]);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// GET /groups/:id/members — members with WAM and risk info
router.get('/groups/:id/members', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const members = await query(`
      SELECT
        u.id as student_db_id,
        u.student_id,
        u.full_name,
        u.email,
        gm.notes,
        gm.added_at,
        ROUND(AVG(sr.score), 1) as wam,
        CASE
          WHEN AVG(sr.score) IS NULL THEN 'No Results'
          WHEN AVG(sr.score) < 50 THEN 'At Risk'
          WHEN AVG(sr.score) < 65 THEN 'Attention Needed'
          ELSE 'On Track'
        END as status
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      LEFT JOIN student_results sr ON sr.student_id = u.id
      WHERE gm.group_id = ?
      GROUP BY u.id, u.student_id, u.full_name, u.email, gm.notes, gm.added_at
      ORDER BY CASE WHEN AVG(sr.score) IS NULL THEN 1 ELSE 0 END, AVG(sr.score) ASC
    `, [req.params.id]);

    const withWeakest = await Promise.all(
      members.rows.map(async (m: any) => {
        const ws = await query(`
          SELECT s.subject_code, ROUND(AVG(sr.score), 1) as score
          FROM student_results sr
          JOIN assessments a ON sr.assessment_id = a.id
          JOIN subjects s ON a.subject_id = s.id
          WHERE sr.student_id = ?
          GROUP BY s.subject_code
          ORDER BY score ASC
          LIMIT 1
        `, [m.student_db_id]);
        return {
          ...m,
          weakest_subject: ws.rows[0]?.subject_code || null,
          weakest_score: ws.rows[0]?.score || null,
        };
      })
    );
    res.json(withWeakest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// POST /groups/:id/members — add students
router.post('/groups/:id/members', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { student_db_ids, added_reason } = req.body;
    if (!student_db_ids?.length) return res.status(400).json({ error: 'student_db_ids is required' });
    let added = 0;
    for (const sid of student_db_ids) {
      try {
        await query(
          `INSERT OR IGNORE INTO group_members (group_id, student_id, added_reason) VALUES (?, ?, ?)`,
          [req.params.id, sid, added_reason || 'manual']
        );
        added++;
      } catch { /* duplicate — skip */ }
    }
    res.json({ message: `${added} student(s) added`, added });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// DELETE /groups/:id/members/:studentId — remove a member
router.delete('/groups/:id/members/:studentId', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    await query(
      `DELETE FROM group_members WHERE group_id = ? AND student_id = ?`,
      [req.params.id, req.params.studentId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// GET /groups/:id/analytics — risk counts and grade distribution
router.get('/groups/:id/analytics', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const risk = await query(`
      SELECT
        COUNT(DISTINCT gm.student_id) as member_count,
        ROUND(AVG(sub.wam), 1) as avg_wam,
        SUM(CASE WHEN sub.wam < 50 THEN 1 ELSE 0 END) as at_risk,
        SUM(CASE WHEN sub.wam >= 50 AND sub.wam < 65 THEN 1 ELSE 0 END) as attention,
        SUM(CASE WHEN sub.wam >= 65 THEN 1 ELSE 0 END) as on_track
      FROM group_members gm
      LEFT JOIN (
        SELECT student_id, AVG(score) as wam FROM student_results GROUP BY student_id
      ) sub ON sub.student_id = gm.student_id
      WHERE gm.group_id = ?
    `, [req.params.id]);

    const grades = await query(`
      SELECT
        CASE
          WHEN sub.wam >= 80 THEN 'HD'
          WHEN sub.wam >= 70 THEN 'D'
          WHEN sub.wam >= 60 THEN 'C'
          WHEN sub.wam >= 50 THEN 'P'
          ELSE 'Fail'
        END as grade,
        COUNT(*) as count
      FROM group_members gm
      JOIN (
        SELECT student_id, AVG(score) as wam FROM student_results GROUP BY student_id
      ) sub ON sub.student_id = gm.student_id
      WHERE gm.group_id = ?
      GROUP BY grade
      ORDER BY CASE grade WHEN 'Fail' THEN 1 WHEN 'P' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 WHEN 'HD' THEN 5 END
    `, [req.params.id]);

    res.json({ ...risk.rows[0], grade_distribution: grades.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// POST /groups/:id/notify — broadcast notification to all members
router.post('/groups/:id/notify', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

    const members = await query(`SELECT student_id FROM group_members WHERE group_id = ?`, [req.params.id]);
    const sender = await query(`SELECT full_name FROM users WHERE id = ?`, [req.user!.id]);
    const senderName = sender.rows[0]?.full_name ?? 'Lecturer';

    for (const m of members.rows) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, sender_name, title, body) VALUES (?, ?, ?, ?, ?)`,
        [m.student_id, req.user!.id, senderName, title, body]
      );
    }
    res.json({ message: `Notification sent to ${members.rows.length} member(s)`, sent: members.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// POST /groups/:id/progress-report — AI-generated individual reports sent to each member
router.post('/groups/:id/progress-report', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const group = await query(`SELECT * FROM student_groups WHERE id = ?`, [req.params.id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    const groupName = group.rows[0].name;

    const members = await query(`
      SELECT u.id, u.full_name,
        ROUND(AVG(sr.score), 1) as wam,
        CASE
          WHEN AVG(sr.score) IS NULL THEN 'No Results'
          WHEN AVG(sr.score) < 50 THEN 'At Risk'
          WHEN AVG(sr.score) < 65 THEN 'Attention Needed'
          ELSE 'On Track'
        END as status
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      LEFT JOIN student_results sr ON sr.student_id = u.id
      WHERE gm.group_id = ?
      GROUP BY u.id, u.full_name
    `, [req.params.id]);

    const sender = await query(`SELECT full_name FROM users WHERE id = ?`, [req.user!.id]);
    const senderName = sender.rows[0]?.full_name ?? 'Lecturer';
    const openai = getOpenAI();
    let sent = 0;

    for (const student of members.rows) {
      const ws = await query(`
        SELECT s.subject_code, ROUND(AVG(sr.score), 1) as score
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        JOIN subjects s ON a.subject_id = s.id
        WHERE sr.student_id = ?
        GROUP BY s.subject_code ORDER BY score ASC LIMIT 1
      `, [student.id]);

      const weakSubject = ws.rows[0]?.subject_code || 'General Studies';
      const wam = Number(student.wam || 0);
      let reportBody: string;

      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an academic support lecturer writing a brief, warm, personalised progress update to a student. Be encouraging but honest. Maximum 80 words. Do not use markdown formatting.' },
              { role: 'user', content: `Student: ${student.full_name}. WAM: ${wam}% (${student.status}). Subject needing most attention: ${weakSubject}. Write their progress update.` }
            ],
            max_tokens: 120,
          });
          reportBody = completion.choices[0].message.content || generateFallbackReport(student.full_name, wam, student.status, weakSubject);
        } catch {
          reportBody = generateFallbackReport(student.full_name, wam, student.status, weakSubject);
        }
      } else {
        reportBody = generateFallbackReport(student.full_name, wam, student.status, weakSubject);
      }

      await query(
        `INSERT INTO notifications (recipient_id, sender_id, sender_name, title, body) VALUES (?, ?, ?, ?, ?)`,
        [student.id, req.user!.id, senderName, `📊 Progress Update — ${groupName}`, reportBody]
      );
      sent++;
    }
    res.json({ message: `Progress reports sent to ${sent} student(s)`, sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send progress reports' });
  }
});

// POST /groups/:id/auto-fill — add all at-risk students (WAM < threshold) to group
router.post('/groups/:id/auto-fill', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res) => {
  try {
    const threshold = Number(req.body.threshold ?? 65);
    const subjectIds = await getLecturerSubjectIds(req.user!.id);
    if (subjectIds.length === 0) return res.json({ message: 'No subjects assigned', added: 0 });

    const placeholders = subjectIds.map(() => '?').join(',');
    const atRisk = await query(`
      SELECT DISTINCT u.id
      FROM users u
      JOIN student_results sr ON sr.student_id = u.id
      JOIN assessments a ON sr.assessment_id = a.id
      WHERE u.role = 'student' AND a.subject_id IN (${placeholders})
      GROUP BY u.id
      HAVING AVG(sr.score) < ?
    `, [...subjectIds, threshold]);

    let added = 0;
    for (const s of atRisk.rows) {
      try {
        await query(
          `INSERT OR IGNORE INTO group_members (group_id, student_id, added_reason) VALUES (?, ?, ?)`,
          [req.params.id, s.id, 'auto']
        );
        added++;
      } catch { /* duplicate — skip */ }
    }
    res.json({ message: `${added} at-risk student(s) added to group`, added });
  } catch (err) {
    res.status(500).json({ error: 'Failed to auto-fill group' });
  }
});

// GET /api/lecturer/profile
router.get('/profile', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, full_name, email, avatar, bio, title, office_hours, notify_email, notify_inapp FROM users WHERE id = ?`,
      [req.user?.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/lecturer/profile
router.put('/profile', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { full_name, avatar, bio, title, office_hours, notify_email, notify_inapp } = req.body;
    if (!full_name?.trim()) { res.status(400).json({ error: 'Name is required' }); return; }
    await query(
      `UPDATE users SET full_name = ?, avatar = ?, bio = ?, title = ?, office_hours = ?, notify_email = ?, notify_inapp = ? WHERE id = ?`,
      [full_name.trim(), avatar ?? null, bio ?? null, title ?? null, office_hours ?? null, notify_email ? 1 : 0, notify_inapp ? 1 : 0, req.user?.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/lecturer/change-password
router.post('/change-password', authenticateToken, requireRole(['lecturer', 'admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 8) { res.status(400).json({ error: 'New password must be at least 8 characters' }); return; }
    const userResult = await query(`SELECT password_hash FROM users WHERE id = ?`, [req.user?.id]);
    const valid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }
    const hash = await bcrypt.hash(new_password, 12);
    await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, req.user?.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
