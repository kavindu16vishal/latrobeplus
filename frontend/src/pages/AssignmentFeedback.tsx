import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquareDiff, Sparkles, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Improvement { section: string; issue: string; suggestion: string; }
interface FeedbackResult {
  overall_rating: string;
  estimated_grade: string;
  strengths: string[];
  improvements: Improvement[];
  structure_feedback: string;
  content_feedback: string;
  next_steps: string[];
}

const ratingScore: Record<string, number> = {
  Excellent: 92, Good: 78, Adequate: 63, 'Needs Work': 48, Poor: 32,
};

const gradeColour = (g: string) => {
  if (g === 'HD') return 'text-green-600 dark:text-green-400';
  if (g === 'D')  return 'text-blue-600 dark:text-blue-400';
  if (g === 'C')  return 'text-yellow-600 dark:text-yellow-400';
  if (g === 'P')  return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const scoreBar = (s: number) => s >= 80 ? 'bg-green-500' : s >= 70 ? 'bg-blue-500' : s >= 60 ? 'bg-yellow-500' : s >= 50 ? 'bg-orange-500' : 'bg-red-500';

export default function AssignmentFeedback() {
  const { token } = useAuth();
  const [form, setForm] = useState({ subject_code: '', assignment_text: '', criteria: '' });
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.subject_code || !form.assignment_text.trim()) {
      setError('Enter a subject code and paste your assignment text'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await axios.post('http://localhost:5000/api/student-features/assignment-feedback', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(r.data);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to get feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquareDiff size={24} /> AI Assignment Feedback
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Paste your draft and get instant AI-powered feedback</p>
      </div>

      {/* Input form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Code</label>
            <input
              value={form.subject_code}
              onChange={e => setForm(f => ({ ...f, subject_code: e.target.value }))}
              placeholder="e.g. CSE1IFX"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marking Criteria <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              value={form.criteria}
              onChange={e => setForm(f => ({ ...f, criteria: e.target.value }))}
              placeholder="e.g. clarity, structure, citations…"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Assignment Text</label>
          <textarea
            value={form.assignment_text}
            onChange={e => setForm(f => ({ ...f, assignment_text: e.target.value }))}
            rows={10}
            placeholder="Paste your assignment draft here…"
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1">{form.assignment_text.trim().split(/\s+/).filter(Boolean).length} words</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium text-sm transition disabled:opacity-50"
        >
          {loading
            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Analysing…</>
            : <><Sparkles size={15} /> Get AI Feedback</>
          }
        </button>
      </div>

      {/* Feedback result */}
      <AnimatePresence>
        {result && (() => {
          const score = ratingScore[result.overall_rating] ?? 60;
          return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Score header */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${gradeColour(result.estimated_grade)}`}>{result.estimated_grade}</p>
                    <p className="text-xs text-gray-400 mt-1">Estimated Grade</p>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">{result.overall_rating}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Rating</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{score}%</p>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-3 rounded-full ${scoreBar(score)}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Structure + Content feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Structure & Flow</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.structure_feedback}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Content & Depth</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.content_feedback}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Strengths */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-5">
                  <h3 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2 mb-3">
                    <CheckCircle size={16} /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {(result.strengths ?? []).map((s, i) => (
                      <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                        <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                  <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                    <TrendingUp size={16} /> Areas to Improve
                  </h3>
                  <ul className="space-y-3">
                    {(result.improvements ?? []).map((imp, i) => (
                      <li key={i} className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-semibold">{imp.section}</p>
                        <p className="text-xs opacity-80 mt-0.5">{imp.issue} — {imp.suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                  <ArrowRight size={16} /> Recommended Next Steps
                </h3>
                <ol className="space-y-2">
                  {(result.next_steps ?? []).map((s, i) => (
                    <li key={i} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <span className="font-bold flex-shrink-0 mt-0.5">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
