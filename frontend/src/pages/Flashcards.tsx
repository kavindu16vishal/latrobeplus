import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Trash2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Card { question: string; answer: string; }
interface FlashSet { id: number; subject_code: string; topic: string; created_at: string; }

export default function Flashcards() {
  const { token } = useAuth();
  const [sets, setSets] = useState<FlashSet[]>([]);
  const [activeSet, setActiveSet] = useState<{ id: number; topic: string; cards: Card[] } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject_code: '', topic: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const loadSets = () => axios.get('http://localhost:5000/api/student-features/flashcards', { headers })
    .then(r => setSets(r.data)).catch(() => {});

  useEffect(() => { loadSets().finally(() => setLoading(false)); }, []);

  const openSet = async (id: number) => {
    const r = await axios.get(`http://localhost:5000/api/student-features/flashcards/${id}`, { headers });
    setActiveSet({ id: r.data.id, topic: r.data.topic, cards: r.data.cards });
    setCardIndex(0); setFlipped(false);
  };

  const generate = async () => {
    if (!form.subject_code) { setError('Enter a subject code'); return; }
    setGenerating(true); setError('');
    try {
      const r = await axios.post('http://localhost:5000/api/student-features/flashcards/generate', form, { headers });
      await loadSets();
      setModal(false); setForm({ subject_code: '', topic: '' });
      setActiveSet({ id: r.data.id, topic: r.data.topic, cards: r.data.cards });
      setCardIndex(0); setFlipped(false);
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to generate'); }
    finally { setGenerating(false); }
  };

  const deleteSet = async (id: number) => {
    await axios.delete(`http://localhost:5000/api/student-features/flashcards/${id}`, { headers });
    if (activeSet?.id === id) setActiveSet(null);
    loadSets();
  };

  const card = activeSet?.cards[cardIndex];
  const total = activeSet?.cards.length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Layers size={24} /> Flashcards</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-generated flashcards based on your weakest topics</p>
        </div>
        <button onClick={() => { setModal(true); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition">
          <Sparkles size={15} /> Generate Set
        </button>
      </div>

      {/* Flashcard drill */}
      {activeSet && card && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{activeSet.topic}</p>
            <span className="text-sm text-gray-400">{cardIndex + 1} / {total}</span>
          </div>

          {/* Card flip */}
          <div className="perspective-1000 cursor-pointer mb-6" onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px' }}>
            <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.4 }} style={{ transformStyle: 'preserve-3d' }}
              className="relative min-h-48 rounded-2xl">
              <div style={{ backfaceVisibility: 'hidden' }}
                className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
                <div className="text-center">
                  <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">Question</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{card.question}</p>
                  <p className="text-xs text-gray-400 mt-4">Click to reveal answer</p>
                </div>
              </div>
              <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                <div className="text-center">
                  <p className="text-xs text-green-500 font-semibold uppercase tracking-wider mb-3">Answer</p>
                  <p className="text-base text-gray-900 dark:text-white leading-relaxed">{card.answer}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={cardIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition">
              <ChevronLeft size={16} /> Previous
            </button>
            <button onClick={() => { setCardIndex(0); setFlipped(false); }}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><RotateCcw size={16} /></button>
            <button onClick={() => { setCardIndex(i => Math.min(total - 1, i + 1)); setFlipped(false); }} disabled={cardIndex === total - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition">
              Next <ChevronRight size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div className="h-1.5 bg-purple-500 rounded-full transition-all" style={{ width: `${((cardIndex + 1) / total) * 100}%` }} />
          </div>
        </motion.div>
      )}

      {/* Saved sets */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
      ) : sets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          <Layers size={40} className="mx-auto mb-3 opacity-40" />
          <p>No flashcard sets yet. Generate your first set above.</p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Saved Sets</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sets.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 cursor-pointer transition ${activeSet?.id === s.id ? 'border-purple-400 dark:border-purple-600 shadow-md' : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700'}`}
                onClick={() => openSet(s.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.topic}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.subject_code} · {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSet(s.id); }}
                    className="p-1 rounded text-gray-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sparkles size={16} className="text-purple-500" /> Generate Flashcards</h3>
                <button onClick={() => setModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Code</label>
                  <input value={form.subject_code} onChange={e => setForm(f => ({ ...f, subject_code: e.target.value }))}
                    placeholder="e.g. CSE1IFX"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Topic <span className="font-normal text-gray-400">(optional)</span></label>
                  <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Data Structures, Algorithms…"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <p className="text-xs text-gray-400">AI will generate 10 flashcards based on your performance and feedback for this subject.</p>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={generate} disabled={generating}
                  className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2">
                  {generating ? <><div className="animate-spin rounded-full h-3 w-3 border-b border-white" /> Generating…</> : <><Sparkles size={14} /> Generate</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
