import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Login Route
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const userResult = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (userResult.rows.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const user = userResult.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        student_id: user.student_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Current User (Me)
router.get('/me', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userResult = await query(
      'SELECT id, full_name, email, role, student_id, avatar, bio, target_wam, study_goal_hours, preferred_study_time, notify_email, notify_inapp FROM users WHERE id = ?',
      [req.user?.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
