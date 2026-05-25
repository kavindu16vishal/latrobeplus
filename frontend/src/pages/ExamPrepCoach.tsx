import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Sparkles, ChevronDown, ChevronUp, Lightbulb, BookMarked, HelpCircle, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudySession { day: number | string; focus: string; tasks: string[]; duration: string; }
interface PracticeQ { question: string; model_answer: string; marks?: number; }
interface PrepPlan {
  study_sessions: StudySession[];
  key_topics: string[];
  practice_questions: PracticeQ[];
  exam_tips: string[];
}

export default function ExamPrepCoach() {
  const { token } = useAuth();
  const [form, setForm] = useState({ subject_code: '', exam_date: '' });
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const generate = async () => {
    if (!form.subject_code) { setError('Enter a subject code'); return; }
    setLoading(true); setError(''); setPlan(null);
    try {
      const r = await axios.post('http://localhost:5000/api/student-features/exam-prep', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlan(r.data);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardList size={24} /> Exam Prep Coach
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered study plan tailored to your performance</p>
      </div>

      {/* Input form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Code</label>
            <input
              value={form.subject_code}
              onChange={e => setForm(f => ({ ...f, subject_code: e.target.value }))}
              placeholder="e.g. CSE1IFX"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam Date <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              type="date"
              value={form.exam_date}
              onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm transition disabled:opacity-50"
        >
          {loading
            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Generating plan…</>
            : <><Sparkles size={15} /> Generate Prep Plan</>
          }
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Study schedule */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <CalendarDays size={18} className="text-orange-500" /> Study Schedule
              </h3>
              <div className="space-y-3">
                {plan.study_sessions.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
                    <div className="text-center min-w-[72px]">
                      <p className="text-xs font-bold text-orange-600 dark:text-orange-400">Day {s.day}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.duration}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.focus}</p>
                      <ul className="mt-1 space-y-0.5">
                        {(s.tasks ?? []).map((a, j) => (
                          <li key={j} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                            <span className="text-orange-400 mt-0.5">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Key topics */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <BookMarked size={18} className="text-purple-500" /> Key Topics to Review
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.key_topics.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm rounded-full border border-purple-200 dark:border-purple-800 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Practice questions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <HelpCircle size={18} className="text-blue-500" /> Practice Questions
              </h3>
              <div className="space-y-2">
                {plan.practice_questions.map((q, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white pr-4">{q.question}</p>
                      {expandedQ === i ? <ChevronUp size={16} className="flex-shrink-0 text-gray-400" /> : <ChevronDown size={16} className="flex-shrink-0 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedQ === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Model Answer{q.marks ? ` (${q.marks} marks)` : ''}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.model_answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam tips */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-yellow-500" /> Exam Day Tips
              </h3>
              <ul className="space-y-2">
                {plan.exam_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
