import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Plus, X, ChevronDown, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject { id: number; subject_code: string; subject_name: string; }
interface Assignment { id: number; subject_code: string; subject_name: string; assignment_id: number; }
interface Lecturer {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  subjects: Assignment[];
  avg_score: number | null;
  student_count: number;
}

export default function LecturerManagement() {
  const { token } = useAuth();
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<Lecturer | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lecRes, subRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/lecturers', { headers }),
        axios.get('http://localhost:5000/api/admin/subjects', { headers }),
      ]);
      setLecturers(lecRes.data);
      setSubjects(subRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);

  const handleCreateLecturer = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.password) {
      setError('All fields are required'); return;
    }
    setSaving(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/admin/users', {
        full_name: createForm.full_name,
        email: createForm.email,
        password: createForm.password,
        role: 'lecturer',
      }, { headers });
      setSuccess('Lecturer created successfully');
      setCreateModal(false);
      setCreateForm({ full_name: '', email: '', password: '' });
      load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to create lecturer'); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedSubject) { setError('Select a subject'); return; }
    setSaving(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/admin/lecturer-subjects', {
        lecturer_id: assignModal.id, subject_id: Number(selectedSubject)
      }, { headers });
      setSuccess('Subject assigned'); setAssignModal(null); load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to assign'); }
    finally { setSaving(false); }
  };

  const handleUnassign = async (assignmentId: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/lecturer-subjects/${assignmentId}`, { headers });
      setSuccess('Assignment removed'); load();
    } catch { setError('Failed to remove assignment'); }
  };

  const unassignedSubjects = (lecturer: Lecturer) =>
    subjects.filter(s => !lecturer.subjects.some(ls => ls.subject_code === s.subject_code));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lecturer Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create lecturers, assign subjects, and view performance</p>
        </div>
        <button
          onClick={() => { setCreateForm({ full_name: '', email: '', password: '' }); setError(''); setCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition"
        >
          <UserPlus size={16} /> Add Lecturer
        </button>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm">
            {success}
          </motion.div>
        )}
        {error && !createModal && !assignModal && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lecturer Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : lecturers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No lecturers yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {lecturers.map((lec, i) => (
            <motion.div key={lec.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{lec.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lec.email}</p>
                </div>
                <div className="text-right">
                  {lec.avg_score != null ? (
                    <div className={`text-lg font-bold ${lec.avg_score < 50 ? 'text-red-600' : lec.avg_score < 65 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Number(lec.avg_score).toFixed(1)}%
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-gray-300 dark:text-gray-700">—</div>
                  )}
                  <p className="text-xs text-gray-400">{lec.student_count} students</p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assigned Subjects</p>
                {lec.subjects.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No subjects assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {lec.subjects.map(s => (
                      <span key={s.assignment_id}
                        className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg">
                        <BookOpen size={11} /> {s.subject_code}
                        <button onClick={() => handleUnassign(s.assignment_id)}
                          className="ml-0.5 text-indigo-400 hover:text-red-500 transition">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setAssignModal(lec); setSelectedSubject(''); setError(''); }}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
              >
                <Plus size={15} /> Assign Subject
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Lecturer Modal */}
      <AnimatePresence>
        {createModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus size={16} className="text-indigo-500" /> Add New Lecturer
                </h3>
                <button onClick={() => { setCreateModal(false); setError(''); }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    value={createForm.full_name}
                    onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g. Dr. Jane Smith"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. j.smith@latrobe.edu.au"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  The lecturer can log in immediately with these credentials. You can assign subjects to them after creation.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => { setCreateModal(false); setError(''); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                  Cancel
                </button>
                <button onClick={handleCreateLecturer} disabled={saving}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create Lecturer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Subject Modal */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Assign Subject</h3>
                <button onClick={() => setAssignModal(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assign a subject to <strong className="text-gray-900 dark:text-white">{assignModal.full_name}</strong>
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="relative">
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select a subject…</option>
                    {unassignedSubjects(assignModal).map(s => (
                      <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {unassignedSubjects(assignModal).length === 0 && (
                  <p className="text-xs text-gray-400">All available subjects are already assigned</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setAssignModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                  Cancel
                </button>
                <button onClick={handleAssign} disabled={saving || !selectedSubject}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
