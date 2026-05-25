import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

// ─── Audit helper ────────────────────────────────────────────────────────────
async function auditLog(
  adminId: number,
  adminName: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: string
) {
  await query(
    `INSERT INTO audit_logs (admin_id, admin_name, action, target_type, target_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, adminName, action, targetType, targetId ?? null, details ?? null]
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// List all users (filterable by role, searchable by name/email)
router.get('/users', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { role, search } = req.query;
    let sql = `SELECT id, full_name, email, role, student_id, created_at FROM users WHERE 1=1`;
    const params: any[] = [];
    if (role && role !== 'all') { sql += ` AND role = ?`; params.push(role); }
    if (search) { sql += ` AND (full_name LIKE ? OR email LIKE ? OR student_id LIKE ?)`; const s = `%${search}%`; params.push(s, s, s); }
    sql += ` ORDER BY created_at DESC`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/users', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { full_name, email, password, role, student_id } = req.body;
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: 'full_name, email, password, and role are required' });
    }
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already exists' });
    if (student_id) {
      const sid = await query('SELECT id FROM users WHERE student_id = ?', [student_id]);
      if (sid.rows.length > 0) return res.status(409).json({ error: 'Student ID already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, student_id) VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, hash, role, student_id || null]
    );
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'CREATE_USER', 'user', String(result.lastID), `Created ${role}: ${email}`);
    res.status(201).json({ id: result.lastID, full_name, email, role, student_id: student_id || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update a user
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, student_id } = req.body;
    const existing = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (email) {
      const dup = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (dup.rows.length > 0) return res.status(409).json({ error: 'Email already in use by another account' });
    }
    if (student_id) {
      const dup = await query('SELECT id FROM users WHERE student_id = ? AND id != ?', [student_id, id]);
      if (dup.rows.length > 0) return res.status(409).json({ error: 'Student ID already in use' });
    }
    await query(
      `UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email),
       role = COALESCE(?, role), student_id = COALESCE(?, student_id) WHERE id = ?`,
      [full_name || null, email || null, role || null, student_id || null, id]
    );
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'UPDATE_USER', 'user', String(id), `Updated user id=${id}`);
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user!.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const existing = await query('SELECT full_name, email FROM users WHERE id = ?', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    await query('DELETE FROM users WHERE id = ?', [id]);
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'DELETE_USER', 'user', String(id), `Deleted user: ${existing.rows[0].email}`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Reset a user's password
router.post('/users/:id/reset-password', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = await query('SELECT email FROM users WHERE id = ?', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const hash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'RESET_PASSWORD', 'user', String(id), `Password reset for ${existing.rows[0].email}`);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LECTURER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Get all lecturers with their assigned subjects
router.get('/lecturers', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const lecturers = await query(
      `SELECT id, full_name, email, created_at FROM users WHERE role = 'lecturer' ORDER BY full_name ASC`
    );
    const result = await Promise.all(lecturers.rows.map(async (lec: any) => {
      const subjects = await query(
        `SELECT s.id, s.subject_code, s.subject_name, ls.id as assignment_id
         FROM lecturer_subjects ls JOIN subjects s ON ls.subject_id = s.id
         WHERE ls.lecturer_id = ?`,
        [lec.id]
      );
      const classAvg = await query(
        `SELECT ROUND(AVG(sr.score), 1) as avg_score, COUNT(DISTINCT sr.student_id) as student_count
         FROM student_results sr
         JOIN assessments a ON sr.assessment_id = a.id
         WHERE a.subject_id IN (SELECT subject_id FROM lecturer_subjects WHERE lecturer_id = ?)`,
        [lec.id]
      );
      return {
        ...lec,
        subjects: subjects.rows,
        avg_score: classAvg.rows[0]?.avg_score ?? null,
        student_count: classAvg.rows[0]?.student_count ?? 0,
      };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lecturers' });
  }
});

// Assign lecturer to a subject
router.post('/lecturer-subjects', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { lecturer_id, subject_id } = req.body;
    if (!lecturer_id || !subject_id) return res.status(400).json({ error: 'lecturer_id and subject_id required' });
    await query(
      `INSERT OR IGNORE INTO lecturer_subjects (lecturer_id, subject_id) VALUES (?, ?)`,
      [lecturer_id, subject_id]
    );
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'ASSIGN_SUBJECT', 'lecturer_subject', `${lecturer_id}-${subject_id}`, `Lecturer ${lecturer_id} → Subject ${subject_id}`);
    res.status(201).json({ message: 'Subject assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign subject' });
  }
});

// Remove lecturer–subject assignment
router.delete('/lecturer-subjects/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM lecturer_subjects WHERE id = ?', [id]);
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'UNASSIGN_SUBJECT', 'lecturer_subject', String(id), `Removed assignment id=${id}`);
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECT & ASSESSMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Get all subjects with assessments and silo counts
router.get('/subjects', authenticateToken, requireRole(['admin', 'lecturer']), async (req: AuthRequest, res) => {
  try {
    const subjects = await query(`SELECT * FROM subjects ORDER BY subject_code ASC`);
    const result = await Promise.all(subjects.rows.map(async (subj: any) => {
      const assessments = await query(
        `SELECT id, assessment_name, assessment_type, weight FROM assessments WHERE subject_id = ? ORDER BY assessment_name`,
        [subj.id]
      );
      const silos = await query(
        `SELECT id, silo_code, silo_description FROM silos WHERE subject_id = ? ORDER BY silo_code`,
        [subj.id]
      );
      const totalWeight = assessments.rows.reduce((sum: number, a: any) => sum + Number(a.weight), 0);
      return { ...subj, assessments: assessments.rows, silos: silos.rows, totalWeight: Math.round(totalWeight) };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Create subject
router.post('/subjects', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { subject_code, subject_name, description } = req.body;
    if (!subject_code || !subject_name) return res.status(400).json({ error: 'subject_code and subject_name required' });
    const dup = await query('SELECT id FROM subjects WHERE subject_code = ?', [subject_code]);
    if (dup.rows.length > 0) return res.status(409).json({ error: 'Subject code already exists' });
    const result = await query(
      `INSERT INTO subjects (subject_code, subject_name, description) VALUES (?, ?, ?)`,
      [subject_code, subject_name, description || null]
    );
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'CREATE_SUBJECT', 'subject', String(result.lastID), `Created ${subject_code}`);
    res.status(201).json({ id: result.lastID, subject_code, subject_name, description: description || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject
router.put('/subjects/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_name, description } = req.body;
    await query(
      `UPDATE subjects SET subject_code = COALESCE(?, subject_code), subject_name = COALESCE(?, subject_name), description = COALESCE(?, description) WHERE id = ?`,
      [subject_code || null, subject_name || null, description || null, id]
    );
    res.json({ message: 'Subject updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject
router.delete('/subjects/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const subj = await query('SELECT subject_code FROM subjects WHERE id = ?', [id]);
    if (subj.rows.length === 0) return res.status(404).json({ error: 'Subject not found' });
    await query('DELETE FROM subjects WHERE id = ?', [id]);
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'DELETE_SUBJECT', 'subject', String(id), `Deleted ${subj.rows[0].subject_code}`);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Create assessment for a subject
router.post('/subjects/:subjectId/assessments', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { subjectId } = req.params;
    const { assessment_name, assessment_type, weight } = req.body;
    if (!assessment_name || weight === undefined) return res.status(400).json({ error: 'assessment_name and weight required' });
    const result = await query(
      `INSERT INTO assessments (subject_id, assessment_name, assessment_type, weight) VALUES (?, ?, ?, ?)`,
      [subjectId, assessment_name, assessment_type || 'Assignment', Number(weight)]
    );
    res.status(201).json({ id: result.lastID, assessment_name, assessment_type, weight: Number(weight) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Update assessment
router.put('/assessments/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { assessment_name, assessment_type, weight } = req.body;
    await query(
      `UPDATE assessments SET assessment_name = COALESCE(?, assessment_name), assessment_type = COALESCE(?, assessment_type), weight = COALESCE(?, weight) WHERE id = ?`,
      [assessment_name || null, assessment_type || null, weight !== undefined ? Number(weight) : null, id]
    );
    res.json({ message: 'Assessment updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// Delete assessment
router.delete('/assessments/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM assessments WHERE id = ?', [id]);
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Get all results with student/subject info (filterable)
router.get('/results', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { student_id, subject_id, limit = 100, offset = 0 } = req.query;
    let sql = `
      SELECT sr.id, sr.score, sr.feedback_comment, sr.created_at,
             u.full_name as student_name, u.student_id as student_code,
             a.assessment_name, a.assessment_type, a.weight,
             s.subject_code, s.subject_name
      FROM student_results sr
      JOIN users u ON sr.student_id = u.id
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE 1=1`;
    const params: any[] = [];
    if (student_id) { sql += ` AND u.student_id = ?`; params.push(student_id); }
    if (subject_id) { sql += ` AND s.id = ?`; params.push(subject_id); }
    sql += ` ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Add a manual result
router.post('/results', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { student_user_id, assessment_id, score, feedback_comment } = req.body;
    if (!student_user_id || !assessment_id || score === undefined) {
      return res.status(400).json({ error: 'student_user_id, assessment_id, and score required' });
    }
    if (score < 0 || score > 100) return res.status(400).json({ error: 'Score must be 0–100' });
    const assessmentRow = await query('SELECT weight FROM assessments WHERE id = ?', [assessment_id]);
    if (assessmentRow.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    const weighted_score = (Number(score) * assessmentRow.rows[0].weight) / 100;
    const result = await query(
      `INSERT INTO student_results (student_id, assessment_id, score, weighted_score, feedback_comment, mastery_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_user_id, assessment_id, Number(score), weighted_score, feedback_comment || null,
       score >= 80 ? 'Advanced' : score >= 65 ? 'Proficient' : score >= 50 ? 'Developing' : 'Beginning']
    );
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'ADD_RESULT', 'student_result', String(result.lastID), `Score ${score} for student ${student_user_id}, assessment ${assessment_id}`);
    res.status(201).json({ id: result.lastID, score: Number(score), weighted_score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add result' });
  }
});

// Edit a result
router.put('/results/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { score, feedback_comment } = req.body;
    const existing = await query(
      'SELECT sr.assessment_id, a.weight FROM student_results sr JOIN assessments a ON sr.assessment_id = a.id WHERE sr.id = ?',
      [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Result not found' });
    const weighted_score = (Number(score) * existing.rows[0].weight) / 100;
    const mastery_level = score >= 80 ? 'Advanced' : score >= 65 ? 'Proficient' : score >= 50 ? 'Developing' : 'Beginning';
    await query(
      `UPDATE student_results SET score = ?, weighted_score = ?, feedback_comment = COALESCE(?, feedback_comment), mastery_level = ? WHERE id = ?`,
      [Number(score), weighted_score, feedback_comment ?? null, mastery_level, id]
    );
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'EDIT_RESULT', 'student_result', String(id), `Updated score to ${score}`);
    res.json({ message: 'Result updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update result' });
  }
});

// Delete a result
router.delete('/results/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM student_results WHERE id = ?', [id]);
    const adminResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const adminName = adminResult.rows[0]?.full_name ?? 'Admin';
    await auditLog(req.user!.id, adminName, 'DELETE_RESULT', 'student_result', String(id), `Deleted result id=${id}`);
    res.json({ message: 'Result deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM DASHBOARD & STATS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/system-stats', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const [students, lecturers, admins, subjects, results, atRisk, recentUsers] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`),
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'lecturer'`),
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`),
      query(`SELECT COUNT(*) as count FROM subjects`),
      query(`SELECT COUNT(*) as count FROM student_results`),
      query(`SELECT COUNT(DISTINCT student_id) as count FROM student_results GROUP BY student_id HAVING AVG(score) < 50`),
      query(`SELECT full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`),
    ]);
    res.json({
      students: students.rows[0]?.count ?? 0,
      lecturers: lecturers.rows[0]?.count ?? 0,
      admins: admins.rows[0]?.count ?? 0,
      subjects: subjects.rows[0]?.count ?? 0,
      total_results: results.rows[0]?.count ?? 0,
      at_risk_count: atRisk.rows.length,
      recent_users: recentUsers.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Audit log
router.get('/audit-logs', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING STUDENT ANALYTICS (kept as-is)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/students', authenticateToken, requireRole(['admin', 'lecturer']), async (req, res) => {
  try {
    const students = await query(`
      SELECT u.id as db_id, u.student_id as id, u.full_name as name, u.email,
             ROUND(COALESCE(AVG(sr.score), 0), 1) as wam
      FROM users u
      LEFT JOIN student_results sr ON sr.student_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.student_id, u.full_name, u.email
      ORDER BY u.student_id ASC
    `);
    const rows = students.rows.map((s: any) => {
      const wam = Number(s.wam);
      const status = wam < 50 ? 'At Risk' : wam < 65 ? 'Attention Needed' : 'On Track';
      return { db_id: s.db_id, id: s.id, name: s.name, email: s.email, wam, status };
    });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/students/:studentId', authenticateToken, requireRole(['admin', 'lecturer']), async (req, res) => {
  const { studentId } = req.params;
  try {
    const userResult = await query(`SELECT * FROM users WHERE student_id = ?`, [studentId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const user = userResult.rows[0];
    const performanceResult = await query(`
      SELECT s.subject_code as subject, AVG(sr.score) as score,
             (SELECT AVG(sr2.score) FROM student_results sr2 JOIN assessments a2 ON sr2.assessment_id = a2.id WHERE a2.subject_id = s.id) as average
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
      GROUP BY s.subject_code, s.id
    `, [user.id]);
    const competencyResult = await query(`
      SELECT s.subject_code as topic, AVG(sr.score) as mastery
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
      GROUP BY s.subject_code
    `, [user.id]);
    const wamResult = await query(`SELECT AVG(score) as wam FROM student_results WHERE student_id = ?`, [user.id]);
    const wam = wamResult.rows[0].wam || 0;
    let status = 'On Track';
    if (wam < 50) status = 'At Risk';
    else if (wam < 65) status = 'Attention Needed';
    const recResult = await query(`SELECT recommendation_text FROM recommendations WHERE student_id = ?`, [user.id]);
    const trendResult = await query(`
      SELECT strftime('%W', sr.created_at) as week_num, strftime('%Y', sr.created_at) as year, AVG(sr.score) as avg_score
      FROM student_results sr WHERE sr.student_id = ?
      GROUP BY year, week_num ORDER BY year ASC, week_num ASC LIMIT 10
    `, [user.id]);
    let progressTrends = trendResult.rows.map((row: any, index: number) => ({
      week: `Week ${index + 1}`,
      score: Number(Number(row.avg_score).toFixed(1))
    }));
    if (progressTrends.length <= 1) {
      const baseScore = Math.max(40, wam - 15);
      progressTrends = [
        { week: 'Week 2',  score: Number((baseScore).toFixed(1)) },
        { week: 'Week 4',  score: Number((baseScore + 3).toFixed(1)) },
        { week: 'Week 6',  score: Number((baseScore + 7).toFixed(1)) },
        { week: 'Week 8',  score: Number((wam - 3).toFixed(1)) },
        { week: 'Week 10', score: Number(wam.toFixed(1)) },
      ];
    }
    res.json({
      db_id: user.id, id: user.student_id, name: user.full_name, email: user.email,
      wam: Number(wam).toFixed(1), status,
      performance: performanceResult.rows,
      competencies: competencyResult.rows.map((c: any) => ({ topic: c.topic, mastery: Number(c.mastery).toFixed(1), fullMark: 100 })),
      progressTrends,
      recommendation: recResult.rows.length > 0 ? recResult.rows[0].recommendation_text : 'Predictive Analytics indicate this student is tracking normally. No immediate intervention required.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// GET /api/admin/profile
router.get('/profile', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, full_name, email, avatar, bio, title, notify_email, notify_inapp FROM users WHERE id = ?`,
      [req.user?.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/admin/profile
router.put('/profile', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { full_name, avatar, bio, title, notify_email, notify_inapp } = req.body;
    if (!full_name?.trim()) { res.status(400).json({ error: 'Name is required' }); return; }
    await query(
      `UPDATE users SET full_name = ?, avatar = ?, bio = ?, title = ?, notify_email = ?, notify_inapp = ? WHERE id = ?`,
      [full_name.trim(), avatar ?? null, bio ?? null, title ?? null, notify_email ? 1 : 0, notify_inapp ? 1 : 0, req.user?.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/admin/change-password
router.post('/change-password', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res): Promise<void> => {
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
