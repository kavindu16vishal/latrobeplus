import React, { useEffect, useState } from 'react';
import { Target, PlayCircle, Clock, Award, CheckCircle2, XCircle, Loader2, Plus, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizSummary {
  id: number;
  topic: string;
  difficulty: string;
  created_at: string;
  attempt_score: number | null;
  completed_at: string | null;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex?: number;
  isCorrect?: boolean;
}

interface QuizDetail {
  id: number;
  topic: string;
  difficulty: string;
  questions: Question[];
  attempt: { score: number; completed_at: string } | null;
}

interface RecommendedTopic {
  subject: string;
  score: number;
}

type Screen = 'list' | 'playing' | 'results';

// ─── Helper ───────────────────────────────────────────────────────────────────

const difficultyColour = (d: string) => {
  if (d === 'Adaptive') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (d === 'Advanced') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

// ─── Quiz Player ──────────────────────────────────────────────────────────────

const QuizPlayer: React.FC<{
  quiz: QuizDetail;
  onSubmit: (answers: number[]) => Promise<void>;
  submitting: boolean;
}> = ({ quiz, onSubmit, submitting }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));

  const question = quiz.questions[current];
  const answered = selected[current] !== null;
  const allAnswered = selected.every(s => s !== null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {current + 1} of {quiz.questions.length}</span>
          <span>{selected.filter(s => s !== null).length} answered</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">
            {question.question}
          </p>
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const next = [...selected];
                  next[current] = idx;
                  setSelected(next);
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition font-medium text-sm ${
                  selected[current] === idx
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <span className="inline-block w-6 h-6 rounded-full border-2 border-current mr-3 text-center text-xs leading-5 font-bold flex-shrink-0 align-middle">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          ← Previous
        </button>

        {current < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            disabled={!answered}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition flex items-center"
          >
            Next <ChevronRight size={16} className="ml-1" />
          </button>
        ) : (
          <button
            onClick={() => onSubmit(selected.map(s => s ?? -1))}
            disabled={!allAnswered || submitting}
            className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-green-700 transition flex items-center"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
            Submit Quiz
          </button>
        )}
      </div>

      {/* Question dots navigator */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quiz.questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition ${
              idx === current
                ? 'bg-blue-600 text-white'
                : selected[idx] !== null
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Results Screen ───────────────────────────────────────────────────────────

const ResultsScreen: React.FC<{
  score: number;
  correct: number;
  total: number;
  results: Question[];
  topic: string;
  onRetry: () => void;
  onBack: () => void;
}> = ({ score, correct, total, results, topic, onRetry, onBack }) => (
  <div className="max-w-2xl mx-auto space-y-6">
    {/* Score Card */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-3xl p-8 text-white text-center shadow-xl ${score >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : score >= 50 ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}
    >
      <div className="text-6xl font-bold mb-2">{score.toFixed(0)}%</div>
      <div className="text-xl font-semibold mb-1">{score >= 70 ? 'Great work!' : score >= 50 ? 'Good effort!' : 'Keep practising!'}</div>
      <div className="text-white/80">{correct} / {total} correct on {topic}</div>
    </motion.div>

    {/* Answer Review */}
    <div className="space-y-3">
      <h3 className="font-bold text-gray-900 dark:text-white text-lg">Answer Review</h3>
      {results.map((q, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`rounded-2xl p-5 border ${q.isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800'}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {q.isCorrect
                ? <CheckCircle2 className="text-green-600" size={20} />
                : <XCircle className="text-red-500" size={20} />
              }
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">{q.question}</p>
              {!q.isCorrect && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                  Your answer: <strong>{q.options[q.selectedIndex ?? 0]}</strong>
                </p>
              )}
              <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                Correct: <strong>{q.options[q.correctIndex]}</strong>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.explanation}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    <div className="flex gap-3">
      <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-blue-200 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition">
        <RotateCcw size={16} /> Try Again
      </button>
      <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition">
        Back to Quizzes
      </button>
    </div>
  </div>
);

// ─── Main Quizzes Page ────────────────────────────────────────────────────────

const Quizzes: React.FC = () => {
  const { token } = useAuth();
  const [screen, setScreen] = useState<Screen>('list');
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [recommended, setRecommended] = useState<RecommendedTopic[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [resultData, setResultData] = useState<any | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingQuizId, setLoadingQuizId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [error, setError] = useState('');

  const fetchList = async () => {
    try {
      const [quizzesRes, recRes] = await Promise.all([
        axios.get('http://localhost:5000/api/quizzes/me', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/quizzes/recommended', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setQuizzes(quizzesRes.data);
      setRecommended(recRes.data);
    } catch {
      setError('Could not load quizzes.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchList(); }, [token]);

  const startQuiz = async (id: number) => {
    setLoadingQuizId(id);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveQuiz(res.data);
      setScreen('playing');
    } catch {
      setError('Could not load quiz.');
    } finally {
      setLoadingQuizId(null);
    }
  };

  const generateQuiz = async (topic: string) => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/quizzes/generate',
        { topic: topic.trim(), difficulty: 'Adaptive' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveQuiz(res.data);
      setScreen('playing');
      fetchList();
    } catch {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const submitQuiz = async (answers: number[]) => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/quizzes/${activeQuiz.id}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResultData({ ...res.data, topic: activeQuiz.topic });
      setScreen('results');
      fetchList();
    } catch {
      setError('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Results screen ──
  if (screen === 'results' && resultData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <button onClick={() => { setScreen('list'); setResultData(null); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back to Quizzes
        </button>
        <ResultsScreen
          score={resultData.score}
          correct={resultData.correct}
          total={resultData.total}
          results={resultData.results}
          topic={resultData.topic}
          onRetry={() => activeQuiz && startQuiz(activeQuiz.id)}
          onBack={() => { setScreen('list'); setResultData(null); }}
        />
      </div>
    );
  }

  // ── Playing screen ──
  if (screen === 'playing' && activeQuiz) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen('list')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← Back to Quizzes
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${difficultyColour(activeQuiz.difficulty)}`}>
              {activeQuiz.difficulty}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{activeQuiz.topic}</span>
          </div>
        </div>
        <QuizPlayer quiz={activeQuiz} onSubmit={submitQuiz} submitting={submitting} />
      </div>
    );
  }

  // ── Main list screen ──
  const completed = quizzes.filter(q => q.attempt_score !== null);
  const pending = quizzes.filter(q => q.attempt_score === null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl mr-4">
            <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Adaptive Quizzes</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">AI-generated assessments tailored to your weakest concepts.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: available + pending quizzes */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recommended topics */}
          {recommended.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Recommended for You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommended.map((r, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => generateQuiz(r.subject)}
                    disabled={generating}
                    className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-left hover:border-blue-300 dark:hover:border-blue-700 transition group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      AI Pick
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Weak area</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{r.subject}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-red-500 font-medium">{Number(r.score).toFixed(1)}% mastery</span>
                      <span className="flex items-center text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all gap-1">
                        <PlayCircle size={16} /> Start
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Pending (not yet attempted) quizzes */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Your Quizzes</h3>
              <div className="space-y-3">
                {pending.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{q.topic}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${difficultyColour(q.difficulty)}`}>{q.difficulty}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {new Date(q.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startQuiz(q.id)}
                      disabled={loadingQuizId !== null}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loadingQuizId === q.id ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} Start
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Generate custom quiz */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} className="text-yellow-300" />
              <h3 className="text-lg font-bold">Generate Custom Quiz</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">Enter any topic and the AI will build a personalised quiz calibrated to your level.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateQuiz(customTopic)}
                placeholder="e.g. SQL Joins, Binary Trees, OOP…"
                className="flex-1 bg-white/20 placeholder-blue-200 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
              <button
                onClick={() => generateQuiz(customTopic)}
                disabled={!customTopic.trim() || generating}
                className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {generating ? 'Generating…' : 'Create'}
              </button>
            </div>
          </motion.div>

          {loadingList && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
          )}

          {!loadingList && quizzes.length === 0 && recommended.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Target size={40} className="mx-auto mb-3 opacity-40" />
              <p>No quizzes yet. Generate one above or upload results to get recommendations.</p>
            </div>
          )}
        </div>

        {/* Right: completed quizzes */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Past Results</h3>
          {completed.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 text-center text-gray-400 text-sm">
              No completed quizzes yet
            </div>
          ) : (
            completed.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{q.topic}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${(q.attempt_score ?? 0) >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                    {(q.attempt_score ?? 0) >= 70 ? <CheckCircle2 size={12} /> : <Award size={12} />}
                    {Number(q.attempt_score).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${difficultyColour(q.difficulty)}`}>{q.difficulty}</span>
                  {q.completed_at && <span>{new Date(q.completed_at).toLocaleDateString()}</span>}
                </div>
              </motion.div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Quizzes;
