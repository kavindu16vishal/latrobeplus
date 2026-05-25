import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

// Get notifications for the current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, sender_name, title, body, is_read, created_at
       FROM notifications WHERE recipient_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count for the current user
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0`,
      [req.user!.id]
    );
    res.json({ count: result.rows[0]?.count ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark a notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?`,
      [req.params.id, req.user!.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE recipient_id = ?`,
      [req.user!.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Send a notification (admin only)
router.post('/send', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { recipient_ids, title, body } = req.body;
    if (!title || !body || !recipient_ids?.length) {
      return res.status(400).json({ error: 'title, body, and recipient_ids[] required' });
    }
    const senderResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const senderName = senderResult.rows[0]?.full_name ?? 'Admin';
    const ids: number[] = Array.isArray(recipient_ids) ? recipient_ids : [recipient_ids];
    for (const rid of ids) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, sender_name, title, body) VALUES (?, ?, ?, ?, ?)`,
        [rid, req.user!.id, senderName, title, body]
      );
    }
    res.status(201).json({ message: `Notification sent to ${ids.length} user(s)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send to all users matching a role (admin only)
router.post('/send-bulk', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { role, title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    const senderResult = await query('SELECT full_name FROM users WHERE id = ?', [req.user!.id]);
    const senderName = senderResult.rows[0]?.full_name ?? 'Admin';
    let recipients;
    if (role && role !== 'all') {
      recipients = await query('SELECT id FROM users WHERE role = ?', [role]);
    } else {
      recipients = await query('SELECT id FROM users WHERE id != ?', [req.user!.id]);
    }
    for (const r of recipients.rows) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, sender_name, title, body) VALUES (?, ?, ?, ?, ?)`,
        [r.id, req.user!.id, senderName, title, body]
      );
    }
    res.status(201).json({ message: `Notification sent to ${recipients.rows.length} user(s)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send bulk notification' });
  }
});

export default router;
