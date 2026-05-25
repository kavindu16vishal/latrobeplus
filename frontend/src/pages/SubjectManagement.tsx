import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Assessment { id: number; assessment_name: string; assessment_type: string; weight: number; }
interface Subject {
  id: number; subject_code: string; subject_name: string; description: string;
  assessments: Assessment[]; silos: any[]; totalWeight: number;
}

const ASSESSMENT_TYPES = ['Assignment', 'Exam', 'Quiz', 'Project', 'Practical', 'Other'];
const EMPTY_SUBJ = { subject_code: '', subject_name: '', description: '' };
const EMPTY_ASSESS = { assessment_name: '', assessment_type: 'Assignment', weight: '' };

export default function SubjectManagement() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modal, setModal] = useState<'create-subject' | 'edit-subject' | 'add-assessment' | 'edit-assessment' | null>(null);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null);
  const [targetSubjectId, setTargetSubjectId] = useState<number | null>(null);
  const [subjForm, setSubjForm] = useState({ ...EMPTY_SUBJ });
  const [assessForm, setAssessForm] = useState({ ...EMPTY_ASSESS });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteSubj, setDeleteSubj] = useState<Subject | null>(null);
  const [deleteAssess, setDeleteAssess] = useState<{ id: number; name: string } | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/subjects', { headers });
      setSubjects(res.data);
    } catch { setError('Failed to load subjects'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  const close = () => { setModal(null); setEditSubject(null); setEditAssessment(null); setError(''); };

  const openCreateSubject = () => { setSubjForm({ ...EMPTY_SUBJ }); setError(''); setModal('create-subject'); };
  const openEditSubject = (s: Subject) => {
    setEditSubject(s);
    setSubjForm({ subject_code: s.subject_code, subject_name: s.subject_name, description: s.description ?? '' });
    setError(''); setModal('edit-subject');
  };
  const openAddAssessment = (subjectId: number) => {
    setTargetSubjectId(subjectId); setAssessForm({ ...EMPTY_ASSESS }); setError(''); setModal('add-assessment');
  };
  const openEditAssessment = (a: Assessment, subjectId: number) => {
    setEditAssessment(a); setTargetSubjectId(subjectId);
    setAssessForm({ assessment_name: a.assessment_name, assessment_type: a.assessment_type, weight: String(a.weight) });
    setError(''); setModal('edit-assessment');
  };

  const handleSaveSubject = async () => {
    if (!subjForm.subject_code || !subjForm.subject_name) { setError('Code and name are required'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'create-subject') {
        await axios.post('http://localhost:5000/api/admin/subjects', subjForm, { headers });
        setSuccess('Subject created');
      } else if (editSubject) {
        await axios.put(`http://localhost:5000/api/admin/subjects/${editSubject.id}`, subjForm, { headers });
        setSuccess('Subject updated');
      }
      close(); load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to save subject'); }
    finally { setSaving(false); }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubj) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/subjects/${deleteSubj.id}`, { headers });
      setSuccess('Subject deleted'); setDeleteSubj(null); load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to delete'); setDeleteSubj(null); }
  };

  const handleSaveAssessment = async () => {
    if (!assessForm.assessment_name || !assessForm.weight) { setError('Name and weight are required'); return; }
    const w = Number(assessForm.weight);
    if (isNaN(w) || w <= 0 || w > 100) { setError('Weight must be between 1 and 100'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'add-assessment') {
        await axios.post(`http://localhost:5000/api/admin/subjects/${targetSubjectId}/assessments`,
          { ...assessForm, weight: w }, { headers });
        setSuccess('Assessment added');
      } else if (editAssessment) {
        await axios.put(`http://localhost:5000/api/admin/assessments/${editAssessment.id}`,
          { ...assessForm, weight: w }, { headers });
        setSuccess('Assessment updated');
      }
      close(); load();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to save assessment'); }
    finally { setSaving(false); }
  };

  const handleDeleteAssessment = async () => {
    if (!deleteAssess) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/assessments/${deleteAssess.id}`, { headers });
      setSuccess('Assessment deleted'); setDeleteAssess(null); load();
    } catch { setDeleteAssess(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subjects and their assessments</p>
        </div>
        <button onClick={openCreateSubject}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition">
          <Plus size={16} /> Add Subject
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

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400">No subjects found. Add your first subject above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subj => (
            <div key={subj.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Subject row */}
              <div className="flex items-center justify-between px-5 py-4">
                <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setExpanded(expanded === subj.id ? null : subj.id)}>
                  {expanded === subj.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{subj.subject_code}</span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">{subj.subject_name}</span>
                  </div>
                  <div className="ml-auto mr-4 flex items-center gap-2">
                    <span className="text-xs text-gray-400">{subj.assessments.length} assessments</span>
                    {subj.totalWeight !== 100 && subj.assessments.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle size={12} /> {subj.totalWeight}% total
                      </span>
                    )}
                    {subj.totalWeight === 100 && (
                      <span className="text-xs text-green-600 dark:text-green-400">100%</span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditSubject(subj)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteSubj(subj)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Expanded assessments */}
              <AnimatePresence>
                {expanded === subj.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 dark:border-gray-800">
                    <div className="px-5 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessments</p>
                        <button onClick={() => openAddAssessment(subj.id)}
                          className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                          <Plus size={12} /> Add Assessment
                        </button>
                      </div>
                      {subj.assessments.length === 0 ? (
                        <p className="text-xs text-gray-400 italic pb-2">No assessments yet</p>
                      ) : (
                        <div className="space-y-1">
                          {subj.assessments.map(a => (
                            <div key={a.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-900 dark:text-white">{a.assessment_name}</span>
                                <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{a.assessment_type}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{a.weight}%</span>
                                <button onClick={() => openEditAssessment(a, subj.id)} className="p-1 rounded text-gray-400 hover:text-teal-600 transition">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => setDeleteAssess({ id: a.id, name: a.assessment_name })} className="p-1 rounded text-gray-400 hover:text-red-600 transition">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Subject Modal */}
      <AnimatePresence>
        {(modal === 'create-subject' || modal === 'edit-subject') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">{modal === 'create-subject' ? 'Add Subject' : 'Edit Subject'}</h3>
                <button onClick={close} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Code</label>
                  <input value={subjForm.subject_code} onChange={e => setSubjForm(f => ({ ...f, subject_code: e.target.value }))}
                    placeholder="e.g. CSE1IFX"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Name</label>
                  <input value={subjForm.subject_name} onChange={e => setSubjForm(f => ({ ...f, subject_name: e.target.value }))}
                    placeholder="e.g. Introduction to Programming"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea value={subjForm.description} onChange={e => setSubjForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={close} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleSaveSubject} disabled={saving}
                  className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Saving…' : modal === 'create-subject' ? 'Create Subject' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assessment Modal */}
      <AnimatePresence>
        {(modal === 'add-assessment' || modal === 'edit-assessment') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">{modal === 'add-assessment' ? 'Add Assessment' : 'Edit Assessment'}</h3>
                <button onClick={close} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assessment Name</label>
                  <input value={assessForm.assessment_name} onChange={e => setAssessForm(f => ({ ...f, assessment_name: e.target.value }))}
                    placeholder="e.g. Assignment 1"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</label>
                  <select value={assessForm.assessment_type} onChange={e => setAssessForm(f => ({ ...f, assessment_type: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {ASSESSMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight (%)</label>
                  <input type="number" min="1" max="100" value={assessForm.weight} onChange={e => setAssessForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="e.g. 30"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={close} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleSaveAssessment} disabled={saving}
                  className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Saving…' : modal === 'add-assessment' ? 'Add' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Subject Confirm */}
      <AnimatePresence>
        {deleteSubj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete Subject?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Deleting <strong className="text-gray-900 dark:text-white">{deleteSubj.subject_code}</strong> will also delete all its assessments and student results. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteSubj(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleDeleteSubject} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Assessment Confirm */}
      <AnimatePresence>
        {deleteAssess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete Assessment?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will delete <strong>{deleteAssess.name}</strong> and all student results for it.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteAssess(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleDeleteAssessment} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
