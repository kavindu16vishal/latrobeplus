import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StickyNote, Plus, Trash2, Sparkles, Edit2, X, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: number; title: string; content: string; ai_summary: string | null;
  subject_code: string | null; created_at: string; updated_at: string;
}
interface Subject { id: number; subject_code: string; subject_name: string; }

export default function StudentNotes() {
  const { token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', content: '', subject_id: '' });
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [summarising, setSummarising] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState('all');
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const loadNotes = () =>
    axios.get('http://localhost:5000/api/student-features/notes', { headers })
      .then(r => setNotes(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/student-features/notes', { headers }),
      axios.get('http://localhost:5000/api/student-features/grade-calculator', { headers }),
    ]).then(([nr, sr]) => {
      setNotes(nr.data);
      setSubjects(sr.data.subjects ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditId(null); setForm({ title: '', content: '', subject_id: '' }); setModal(true); setError(''); };
  const openEdit = (n: Note) => {
    setEditId(n.id);
    const subj = subjects.find(s => s.subject_code === n.subject_code);
    setForm({ title: n.title, content: n.content, subject_id: subj ? String(subj.id) : '' });
    setModal(true); setError('');
  };

  const save = async () => {
    if (!form.title.trim()) { setError('Enter a title'); return; }
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/student-features/notes/${editId}`, form, { headers });
      } else {
        await axios.post('http://localhost:5000/api/student-features/notes', form, { headers });
      }
      await loadNotes();
      setModal(false);
      if (activeNote?.id === editId) setActiveNote(null);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to save');
    }
  };

  const deleteNote = async (id: number) => {
    await axios.delete(`http://localhost:5000/api/student-features/notes/${id}`, { headers });
    if (activeNote?.id === id) setActiveNote(null);
    loadNotes();
  };

  const summarise = async (id: number) => {
    setSummarising(id);
    try {
      const r = await axios.post(`http://localhost:5000/api/student-features/notes/${id}/summarize`, {}, { headers });
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ai_summary: r.data.summary } : n));
      if (activeNote?.id === id) setActiveNote(prev => prev ? { ...prev, ai_summary: r.data.summary } : prev);
    } catch {}
    setSummarising(null);
  };

  const filtered = notes.filter(n => filterSubject === 'all' || n.subject_code === filterSubject);
  const uniqueSubjects = [...new Set(notes.map(n => n.subject_code).filter(Boolean))] as string[];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <StickyNote size={24} /> Student Notes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personal notes with AI-powered summarisation</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition">
          <Plus size={15} /> New Note
        </button>
      </div>

      {/* Subject filter */}
      {uniqueSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['all', ...uniqueSubjects]).map(s => (
            <button key={s} onClick={() => setFilterSubject(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${filterSubject === s ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {s === 'all' ? 'All Subjects' : s}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          <StickyNote size={40} className="mx-auto mb-3 opacity-40" />
          <p>No notes yet. Create your first note to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Note list */}
          <div className="lg:col-span-1 space-y-2">
            {filtered.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setActiveNote(n)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${activeNote?.id === n.id ? 'border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{n.title}</p>
                    {n.subject_code && <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">{n.subject_code}</p>}
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.ai_summary || n.content}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNote(n.id); }}
                    className="p-1 rounded text-gray-400 hover:text-red-500 transition flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">{new Date(n.updated_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>

          {/* Note viewer */}
          <div className="lg:col-span-2">
            {activeNote ? (
              <motion.div key={activeNote.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{activeNote.title}</h3>
                    {activeNote.subject_code && <p className="text-xs text-teal-600 dark:text-teal-400">{activeNote.subject_code}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(activeNote)}
                      className="p-2 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition">
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => summarise(activeNote.id)}
                      disabled={summarising === activeNote.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-medium hover:bg-purple-200 transition disabled:opacity-50">
                      {summarising === activeNote.id
                        ? <><div className="animate-spin rounded-full h-3 w-3 border-b border-purple-600" /> Summarising…</>
                        : <><Sparkles size={12} /> AI Summary</>
                      }
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {activeNote.ai_summary && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Sparkles size={11} /> AI Summary
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{activeNote.ai_summary}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <BookOpen size={11} /> Full Notes
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{activeNote.content}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-48 flex items-center justify-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
                <div className="text-center">
                  <StickyNote size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a note to view it</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">{editId ? 'Edit Note' : 'New Note'}</h3>
                <button onClick={() => setModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Note title"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject <span className="font-normal text-gray-400">(optional)</span></label>
                  <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">No subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={8} placeholder="Write your notes here…"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={save}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition">
                  <Check size={14} /> {editId ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
