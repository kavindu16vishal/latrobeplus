import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Pencil, Trash2, X, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Result {
  id: number;
  student_name: string;
  student_code: string;
  subject_code: string;
  subject_name: string;
  assessment_name: string;
  assessment_type: string;
  weight: number;
  score: number;
  feedback_comment: string;
  created_at: string;
}
interface Student { id: number; full_name: string; student_id: string | null; }
interface Subject { id: number; subject_code: string; subject_name: string; }
interface Assessment { id: number; assessment_name: string; assessment_type: string; weight: number; }
interface SubjectFull extends Subject { assessments: Assessment[]; }

export default function ResultsManagement() {
  const { token } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<SubjectFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Result | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Result | null>(null);
  const [form, setForm] = useState({ student_user_id: '', assessment_id: '', score: '', feedback_comment: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const assessmentsForAdd = (subjectId: string): Assessment[] =>
    subjects.find(s => String(s.id) === subjectId)?.assessments ?? [];

  const [addSubjectId, setAddSubjectId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (subjectFilter) params.subject_id = subjectFilter;
      const [rRes, sRes, subRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/results', { headers, params }),
        axios.get('http://localhost:5000/api/admin/users?role=student', { headers }),
        axios.get('http://localhost:5000/api/admin/subjects', { headers }),
      ]);
      setResults(rRes.data);
      setStudents(sRes.data);
      setSubjects(subRes.data);
    } catch { setError('Failed to load results'); }
    finally { setLoading(false); }
  }, [token, subjectFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const close = () => { setModal(null); setEditTarget(null); setError(''); setAddSubjectId(''); setForm({ student_user_id: '', assessment_id: '', score: '', feedback_comment: '' }); };
  const openAdd = () => { close(); setModal('add'); };
  const openEdit = (r: Result) => {
    setEditTarget(r);
    setForm({ student_user_id: '', assessment_id: '', score: String(r.score), feedback_comment: r.feedback_comment ?? '' });
    setError(''); setModal('edit');
  };

  const handleAdd = async () => {
    if (!form.student_user_id || !form.assessment_id || !form.score) { setError('All fields are required'); return; }
    setSaving(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/admin/results', {
        student_user_id: Number(form.student_user_id),
        assessment_id: Number(form.assessment_id),
        score: Number(form.score),
        feedback_comment: form.feedback_comment || undefined,
      }, { headers });
      setSuccess('Result added'); close(); load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to add result'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editTarget || !form.score) { setError('Score is required'); return; }
    setSaving(true); setError('');
    try {
      await axios.put(`http://localhost:5000/api/admin/results/${editTarget.id}`, {
        score: Number(form.score),
        feedback_comment: form.feedback_comment || undefined,
      }, { headers });
      setSuccess('Result updated'); close(); load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/results/${deleteTarget.id}`, { headers });
      setSuccess('Result deleted'); setDeleteTarget(null); load();
    } catch { setDeleteTarget(null); }
  };

  const filtered = results.filter(r =>
    !search || r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.student_code?.toLowerCase().includes(search.toLowerCase()) ||
    r.subject_code.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColour = (score: number) =>
    score >= 80 ? 'text-green-600 dark:text-green-400' :
    score >= 65 ? 'text-blue-600 dark:text-blue-400' :
    score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Results Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manually enter, edit, or delete student results</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition">
          <Plus size={16} /> Add Result
        </button>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or subject…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="relative">
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>No results found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Student', 'Subject', 'Assessment', 'Score', 'Weight', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{r.student_name}</p>
                      <p className="text-xs text-gray-400">{r.student_code}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.subject_code}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-white">{r.assessment_name}</p>
                      <p className="text-xs text-gray-400">{r.assessment_type}</p>
                    </td>
                    <td className={`px-4 py-3 font-bold ${scoreColour(r.score)}`}>{r.score}%</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.weight}%</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {modal === 'add' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Add Manual Result</h3>
                <button onClick={close} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</label>
                  <select value={form.student_user_id} onChange={e => setForm(f => ({ ...f, student_user_id: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select student…</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_id ? `(${s.student_id})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</label>
                  <select value={addSubjectId} onChange={e => { setAddSubjectId(e.target.value); setForm(f => ({ ...f, assessment_id: '' })); }}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assessment</label>
                  <select value={form.assessment_id} onChange={e => setForm(f => ({ ...f, assessment_id: e.target.value }))} disabled={!addSubjectId}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50">
                    <option value="">Select assessment…</option>
                    {assessmentsForAdd(addSubjectId).map(a => <option key={a.id} value={a.id}>{a.assessment_name} ({a.weight}%)</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score (0–100)</label>
                  <input type="number" min="0" max="100" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feedback <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea value={form.feedback_comment} onChange={e => setForm(f => ({ ...f, feedback_comment: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={close} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleAdd} disabled={saving}
                  className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Result'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {modal === 'edit' && editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Edit Result</h3>
                <button onClick={close} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-white">{editTarget.student_name}</strong> — {editTarget.assessment_name}
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score (0–100)</label>
                  <input type="number" min="0" max="100" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feedback</label>
                  <textarea value={form.feedback_comment} onChange={e => setForm(f => ({ ...f, feedback_comment: e.target.value }))} rows={3}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={close} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleEdit} disabled={saving}
                  className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete Result?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Delete the {deleteTarget.assessment_name} result ({deleteTarget.score}%) for <strong>{deleteTarget.student_name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
