import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, BookOpen, Brain, Target, AlertTriangle, CheckCircle, Loader2, ChevronRight, Flame, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StreakData { streak: number; longest: number; last: string | null; }
interface BenchmarkSubject { subject: string; my_score: number; cohort_avg: number; percentile: number; }


interface DashboardData {
  wam: string | null;
  status: string;
  mastery: string;
  gaps: number;
  quizzesCompleted: number;
  quizAvgScore: string | null;
  performance: { subject: string; score: number; average: number | null; fullMark: number }[];
  progressTrends: { week: string; score: number }[];
  recommendation: string | null;
}

const statusColour: Record<string, string> = {
  'On Track': 'text-green-600',
  'Attention Needed': 'text-orange-500',
  'At Risk': 'text-red-600',
  'No Data': 'text-gray-400',
};

const StudentDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const fetchAll = async () => {
      try {
        const [dashRes] = await Promise.all([
          axios.get('http://localhost:5000/api/student/dashboard', { headers }),
          axios.post('http://localhost:5000/api/student-features/streak/ping', {}, { headers }).catch(() => {}),
        ]);
        setData(dashRes.data);
        const [streakRes, benchRes] = await Promise.all([
          axios.get('http://localhost:5000/api/student-features/streak', { headers }).catch(() => null),
          axios.get('http://localhost:5000/api/student-features/benchmarks', { headers }).catch(() => null),
        ]);
        if (streakRes) setStreak(streakRes.data);
        if (benchRes) setBenchmarks(benchRes.data);
      } catch {
        setError('Could not load your dashboard. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-400">
        {error || 'No data available.'}
      </div>
    );
  }

  const hasData = data.performance.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!
        </h2>
        <p className="text-blue-100 mb-6 max-w-2xl text-lg">
          {data.status === 'No Data' || !hasData
            ? 'Your results haven\'t been uploaded yet. Check back after your assessments are graded.'
            : data.status === 'At Risk'
            ? `Your current WAM is ${data.wam}%. Let's focus on improving your weakest areas together.`
            : data.status === 'Attention Needed'
            ? `Your WAM is ${data.wam}% — you're making progress. A few targeted improvements will get you on track.`
            : `Your WAM is ${data.wam}% — great work! Keep up the momentum.`
          }
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/student/quizzes')}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-50 transition flex items-center"
          >
            <Target className="w-5 h-5 mr-2" />
            Take Adaptive Quiz
          </button>
          <button
            onClick={() => navigate('/student/insights')}
            className="bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-900 transition flex items-center"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            View Study Plan
          </button>
        </div>
      </motion.div>

      {/* KPI Cards — all clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/student/insights')}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all"
        >
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl mr-4">
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current WAM</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.wam != null ? `${data.wam}%` : '—'}</p>
            <p className={`text-xs mt-1 font-semibold ${statusColour[data.status] || 'text-gray-500'}`}>{data.status}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 ml-2" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/student/insights')}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
        >
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl mr-4">
            <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Overall Mastery</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.mastery}</p>
            <p className="text-xs text-blue-600 mt-1">{data.performance.length} subjects tracked</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 ml-2" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate(data.gaps > 0 ? '/student/quizzes' : '/student/insights')}
          className={`bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border cursor-pointer hover:shadow-md transition-all flex items-center ${
            data.gaps > 0
              ? 'border-orange-100 dark:border-orange-900/30 hover:border-orange-300 dark:hover:border-orange-700'
              : 'border-gray-100 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700'
          }`}
        >
          <div className={`p-4 rounded-2xl mr-4 ${data.gaps > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
            {data.gaps > 0
              ? <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              : <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Knowledge Gaps</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.gaps}</p>
            <p className={`text-xs mt-1 ${data.gaps > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {data.gaps > 0 ? 'Click to practice' : 'All subjects passing'}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 ml-2" />
        </motion.div>
      </div>

      {/* Streak + Benchmark row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Study Streak */}
        {streak && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            onClick={() => navigate('/student/study-planner')}
            className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-5 text-white cursor-pointer hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Study Streak</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-5xl font-bold">{streak.streak}</p>
                  <p className="text-orange-200 mb-1 text-lg">days</p>
                </div>
                <p className="text-orange-100 text-xs mt-1">Longest: {streak.longest} days</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-4">
                <Flame size={32} className="text-white" />
              </div>
            </div>
            <p className="text-orange-100 text-xs mt-3">Visit the app daily to maintain your streak →</p>
          </motion.div>
        )}

        {/* Peer Benchmark */}
        {benchmarks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-indigo-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Peer Benchmarking</h3>
            </div>
            <div className="space-y-3">
              {benchmarks.slice(0, 3).map((b) => (
                <div key={b.subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{b.subject}</span>
                    <span className={`text-xs font-bold ${b.my_score >= b.cohort_avg ? 'text-green-600' : 'text-red-500'}`}>
                      {b.my_score >= b.cohort_avg ? `+${(b.my_score - b.cohort_avg).toFixed(1)}%` : `${(b.my_score - b.cohort_avg).toFixed(1)}%`} vs avg
                    </span>
                  </div>
                  <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="h-2 bg-indigo-200 dark:bg-indigo-900 rounded-full" style={{ width: `${b.cohort_avg}%` }} />
                    <div className={`absolute top-0 h-2 rounded-full ${b.my_score >= b.cohort_avg ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(b.my_score, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>You: {b.my_score.toFixed(1)}%</span>
                    <span>Top {100 - b.percentile}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Competency Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Competency Radar</h3>
          {hasData ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.performance}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Radar name="Your Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
              No assessment data yet
            </div>
          )}
        </motion.div>

        {/* AI Recommendation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="flex items-center mb-6">
            <Brain className="h-6 w-6 text-indigo-500 mr-2" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Recommendation</h3>
          </div>
          {data.recommendation ? (
            <div className="flex-1 space-y-3">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{data.recommendation}</p>
              </div>
              {/* Subject score list with practice button on weak subjects */}
              <div className="space-y-2 mt-4">
                {data.performance.map((p) => (
                  <div key={p.subject} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 font-medium flex-shrink-0">{p.subject}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${p.score >= 70 ? 'bg-blue-500' : p.score >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-8 text-right flex-shrink-0">{p.score}%</span>
                    {p.score < 70 && (
                      <button
                        onClick={() => navigate('/student/quizzes')}
                        className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-lg font-medium hover:bg-orange-200 transition flex-shrink-0"
                      >
                        Practice
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm text-center">
                {hasData
                  ? 'Visit AI Insights to generate your personalised recommendations.'
                  : 'Recommendations will appear once your results are loaded.'
                }
              </p>
            </div>
          )}
          <button
            onClick={() => navigate('/student/insights')}
            className="mt-4 w-full text-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            View Full AI Analysis →
          </button>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Learning Growth Timeline</h3>
          {data.progressTrends.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.progressTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} domain={[0, 100]} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              No trend data available yet
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default StudentDashboard;
