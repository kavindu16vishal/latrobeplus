import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, Save, Trash2, Plus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject { id: number; subject_code: string; subject_name: string; enrolled_count: number; avg_score: number | null; }
interface Assessment { id: number; assessment_name: string; assessment_type: string; weight: number; }
interface ResultRow {
  result_id: number | null; student_db_id: number; student_id: string;
  full_name: string; email: string; assessment_id: number; assessment_name: string;
  weight: number; score: number | null; feedback_comment: string | null;
}

export default function LecturerResults() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    axios.get('http://localhost:5000/api/lecturer/my-subjects', { headers })
      .then(r => setSubjects(r.data))
      .catch(() => {})
      .finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    setAssessments([]); setSelectedAssessment(null); setRows([]); setEdits({});
    axios.get(`http://localhost:5000/api/lecturer/subjects/${selectedSubject.id}/assessments`, { headers })
      .then(r => setAssessments(r.data)).catch(() => {});
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject || !selectedAssessment) return;
    setLoading(true); setRows([]); setEdits({});
    axios.get(`http://localhost:5000/api/lecturer/subjects/${selectedSubject.id}/results?assessment_id=${selectedAssessment.id}`, { headers })
      .then(r => {
        setRows(r.data);
        const init: Record<string, { score: string; feedback: string }> = {};
        r.data.forEach((row: ResultRow) => {
          init[row.student_db_id] = {
            score: row.score != null ? String(row.score) : '',
            feedback: row.feedback_comment ?? '',
          };
        });
        setEdits(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSubject, selectedAssessment]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => r.full_name.toLowerCase().includes(q) || r.student_id.toLowerCase().includes(q));
  }, [rows, search]);

  const saveResult = async (row: ResultRow) => {
    const edit = edits[row.student_db_id];
    if (!edit || edit.score === '') { showToast('Enter a score first'); return; }
    const score = Number(edit.score);
    if (isNaN(score) || score < 0 || score > 100) { showToast('Score must be 0–100'); return; }

    setSaving(String(row.student_db_id));
    try {
      if (row.result_id) {
        await axios.put(`http://localhost:5000/api/lecturer/results/${row.result_id}`,
          { score, feedback_comment: edit.feedback || null }, { headers });
      } else {
        const r = await axios.post('http://localhost:5000/api/lecturer/results',
          { student_id: row.student_db_id, assessment_id: row.assessment_id, score, feedback_comment: edit.feedback || null },
          { headers });
        setRows(prev => prev.map(p => p.student_db_id === row.student_db_id ? { ...p, result_id: r.data.id, score, feedback_comment: edit.feedback } : p));
      }
      setRows(prev => prev.map(p => p.student_db_id === row.student_db_id ? { ...p, score, feedback_comment: edit.feedback } : p));
      showToast(`✅ Saved for ${row.full_name}`);
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const deleteResult = async (row: ResultRow) => {
    if (!row.result_id) return;
    if (!confirm(`Delete result for ${row.full_name}?`)) return;
    await axios.delete(`http://localhost:5000/api/lecturer/results/${row.result_id}`, { headers });
    setRows(prev => prev.map(p => p.student_db_id === row.student_db_id ? { ...p, result_id: null, score: null, feedback_comment: null } : p));
    setEdits(prev => ({ ...prev, [row.student_db_id]: { score: '', feedback: '' } }));
    showToast(`Deleted result for ${row.full_name}`);
  };

  const gradeLabel = (s: number) => s >= 80 ? 'HD' : s >= 70 ? 'D' : s >= 60 ? 'C' : s >= 50 ? 'P' : 'N';
  const gradeColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-600';

  const enteredCount = rows.filter(r => r.score != null).length;
  const totalCount = rows.length;

  if (loadingSubjects) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
            <CheckCircle size={15} className="text-green-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={24} /> Results Management
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter and manage student results for your subjects</p>
      </div>

      {/* Subject + Assessment pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Subject</label>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
            {subjects.length === 0
              ? <p className="text-sm text-gray-400">No subjects assigned</p>
              : subjects.map(s => (
                <button key={s.id} onClick={() => setSelectedSubject(s)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition ${selectedSubject?.id === s.id ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 text-gray-700 dark:text-gray-300'}`}>
                  <span className="font-bold">{s.subject_code}</span>
                  <span className="text-gray-400 ml-2 text-xs">{s.subject_name}</span>
                  <span className="float-right text-xs text-gray-400">{s.enrolled_count} students · {s.avg_score != null ? `${Number(s.avg_score).toFixed(1)}% avg` : 'No results'}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Assessment */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Assessment</label>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
            {!selectedSubject
              ? <p className="text-sm text-gray-400">Select a subject first</p>
              : assessments.length === 0
                ? <p className="text-sm text-gray-400">No assessments found</p>
                : assessments.map(a => (
                  <button key={a.id} onClick={() => setSelectedAssessment(a)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition ${selectedAssessment?.id === a.id ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 text-gray-700 dark:text-gray-300'}`}>
                    <span className="font-bold">{a.assessment_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{a.assessment_type} · {a.weight}%</span>
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* Results table */}
      {selectedSubject && selectedAssessment && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {selectedSubject.subject_code} — {selectedAssessment.assessment_name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {enteredCount} / {totalCount} results entered · {selectedAssessment.weight}% weight
              </p>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800">
            <div className="h-1 bg-indigo-500 transition-all" style={{ width: totalCount > 0 ? `${(enteredCount / totalCount) * 100}%` : '0%' }} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <div className="col-span-3">Student</div>
                <div className="col-span-2">Student ID</div>
                <div className="col-span-2">Score (0–100)</div>
                <div className="col-span-1">Grade</div>
                <div className="col-span-3">Feedback</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filtered.map((row, i) => {
                  const edit = edits[row.student_db_id] ?? { score: '', feedback: '' };
                  const numScore = edit.score !== '' && !isNaN(Number(edit.score)) ? Number(edit.score) : null;
                  const isSaving = saving === String(row.student_db_id);
                  const hasResult = row.result_id != null;
                  const isDirty = edit.score !== (row.score != null ? String(row.score) : '') || edit.feedback !== (row.feedback_comment ?? '');
                  return (
                    <motion.div key={row.student_db_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-12 gap-2 px-5 py-3 items-center">
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{row.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{row.email}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{row.student_id}</span>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={edit.score}
                          onChange={e => setEdits(prev => ({ ...prev, [row.student_db_id]: { ...prev[row.student_db_id] ?? { score: '', feedback: '' }, score: e.target.value } }))}
                          placeholder="—"
                          className={`w-full px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDirty ? 'border-indigo-400' : 'border-gray-200 dark:border-gray-700'}`}
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {numScore != null
                          ? <span className={`text-xs font-bold ${gradeColor(numScore)}`}>{gradeLabel(numScore)}</span>
                          : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        }
                      </div>
                      <div className="col-span-3">
                        <input
                          value={edit.feedback}
                          onChange={e => setEdits(prev => ({ ...prev, [row.student_db_id]: { ...prev[row.student_db_id] ?? { score: '', feedback: '' }, feedback: e.target.value } }))}
                          placeholder="Add feedback…"
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveResult(row)}
                          disabled={isSaving || !isDirty}
                          title="Save result"
                          className={`p-1.5 rounded-lg transition ${isDirty ? 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'text-gray-300 dark:text-gray-700'} disabled:opacity-40`}>
                          {isSaving
                            ? <div className="animate-spin rounded-full h-4 w-4 border-b border-indigo-600" />
                            : hasResult ? <Save size={14} /> : <Plus size={14} />
                          }
                        </button>
                        {hasResult && (
                          <button onClick={() => deleteResult(row)} title="Delete result"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400">
                  Showing {filtered.length} of {rows.length} students · Click <Save size={10} className="inline" /> to save each row · Changes are highlighted in blue
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {!selectedSubject && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select a subject and assessment above to manage results</p>
        </div>
      )}
    </div>
  );
}
