import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, Send, CheckCheck, ChevronDown, X, Users, GraduationCap, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: number;
  sender_name: string;
  title: string;
  body: string;
  is_read: number;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'Everyone', icon: <Users size={14} /> },
  { value: 'student', label: 'All Students', icon: <GraduationCap size={14} /> },
  { value: 'lecturer', label: 'All Lecturers', icon: <Users size={14} /> },
  { value: 'admin', label: 'All Admins', icon: <Shield size={14} /> },
];

export default function Notifications() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'all' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [composingAtRisk, setComposingAtRisk] = useState(false);
  const [atRiskForm, setAtRiskForm] = useState({ title: '', body: '' });
  const [atRiskSending, setAtRiskSending] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', { headers });
      setNotifications(res.data);
    } catch { setError('Failed to load notifications'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); } }, [success]);

  const markAllRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {}
  };

  const markRead = async (id: number) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, { headers });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  const handleSendAtRisk = async () => {
    if (!atRiskForm.title || !atRiskForm.body) { setError('Title and message are required'); return; }
    setAtRiskSending(true); setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/lecturer/notify-at-risk',
        { title: atRiskForm.title, body: atRiskForm.body }, { headers });
      setSuccess(`Notification sent to ${res.data.sent} at-risk student(s)`);
      setComposingAtRisk(false);
      setAtRiskForm({ title: '', body: '' });
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to send'); }
    finally { setAtRiskSending(false); }
  };

  const handleSend = async () => {
    if (!form.title || !form.body) { setError('Title and message are required'); return; }
    setSending(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/notifications/send-bulk', {
        role: form.targetRole, title: form.title, body: form.body
      }, { headers });
      setSuccess('Notification sent successfully');
      setComposing(false);
      setForm({ title: '', body: '', targetRole: 'all' });
      load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to send'); }
    finally { setSending(false); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={22} />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>
            )}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.role === 'admin' ? 'Send messages and view your notifications' : 'Your notifications from admin'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={() => setComposing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium text-sm transition">
              <Send size={15} /> Send Notification
            </button>
          )}
          {user?.role === 'lecturer' && (
            <button onClick={() => { setComposingAtRisk(true); setError(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition">
              <Send size={15} /> Notify At-Risk Students
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`px-5 py-4 transition cursor-pointer ${!n.is_read ? 'bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-yellow-500' : 'bg-transparent'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{n.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">From {n.sender_name} · {new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {!n.is_read && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold flex-shrink-0">New</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Notify At-Risk Modal (lecturer) */}
      <AnimatePresence>
        {composingAtRisk && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Send size={16} className="text-red-500" /> Notify At-Risk Students
                </h3>
                <button onClick={() => { setComposingAtRisk(false); setError(''); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">This message will be sent to all students with a WAM below 65% in your assigned subjects.</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
                  <input value={atRiskForm.title} onChange={e => setAtRiskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Academic Support Available"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</label>
                  <textarea value={atRiskForm.body} onChange={e => setAtRiskForm(f => ({ ...f, body: e.target.value }))} rows={4}
                    placeholder="Write your message here…"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => { setComposingAtRisk(false); setError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleSendAtRisk} disabled={atRiskSending}
                  className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2">
                  {atRiskSending ? 'Sending…' : <><Send size={14} /> Send to At-Risk</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compose Modal (admin only) */}
      <AnimatePresence>
        {composing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Send size={16} className="text-yellow-500" /> Send Notification
                </h3>
                <button onClick={() => { setComposing(false); setError(''); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Send To</label>
                  <div className="mt-1 relative">
                    <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
                      className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
                      {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Notification title"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</label>
                  <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4}
                    placeholder="Write your message here…"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => { setComposing(false); setError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleSend} disabled={sending}
                  className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2">
                  {sending ? 'Sending…' : <><Send size={14} /> Send</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
