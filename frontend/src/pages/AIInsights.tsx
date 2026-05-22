import React, { useEffect, useState } from 'react';
import { Brain, FileSearch, Lightbulb, AlertTriangle, RefreshCw, Loader2, BookOpen, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Gap {
  topic: string;
  score: number;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

interface StudyPlanItem {
  day: string;
  task: string;
  time: string;
  type: 'Theory' | 'Practice' | 'Resource' | 'Revision';
}

interface InsightsData {
  gaps: Gap[];
  studyPlan: StudyPlanItem[];
  feedbackAnalysis: string;
  recommendation: string;
  cached: boolean;
}

const impactColour: Record<string, string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
};

const typeColour: Record<string, string> = {
  Theory: 'bg-blue-100 text-blue-700',
  Practice: 'bg-purple-100 text-purple-700',
  Resource: 'bg-green-100 text-green-700',
  Revision: 'bg-orange-100 text-orange-700'
};

const typeIcon: Record<string, React.ReactNode> = {
  Theory: <BookOpen size={14} />,
  Practice: <Zap size={14} />,
  Resource: <Brain size={14} />,
  Revision: <RefreshCw size={14} />
};

const AIInsights: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchInsights = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
        await axios.post('http://localhost:5000/api/insights/refresh', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      const res = await axios.get('http://localhost:5000/api/insights/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError('');
    } catch {
      setError('Could not load insights. Make sure the server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
        <p className="text-gray-500 text-sm">Analysing your performance…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl mr-4">
            <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Learning Insights</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {data?.cached ? 'Showing cached analysis (refreshes every 24h)' : 'Fresh analysis based on your latest results'}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {data?.gaps.length === 0 && data?.studyPlan.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No gaps detected</h3>
          <p className="text-gray-600 dark:text-gray-400">{data?.feedbackAnalysis || 'Your results haven\'t been loaded yet, or you\'re performing well across all subjects.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Knowledge Gaps */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileSearch className="mr-2 text-orange-500" /> Detected Knowledge Gaps
            </h3>
            {data?.gaps.length === 0 ? (
              <div className="flex items-center text-green-600 space-x-2 p-4 bg-green-50 rounded-2xl">
                <CheckCircle2 size={20} />
                <span className="text-sm font-medium">No gaps detected — all subjects above 70%!</span>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.gaps.map((gap, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{gap.topic}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${impactColour[gap.impact]}`}>
                        {gap.impact} Impact
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{gap.description}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${gap.score < 50 ? 'bg-red-500' : gap.score < 60 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                        style={{ width: `${gap.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 text-right">Mastery: {gap.score}%</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Study Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Lightbulb className="mr-2 text-yellow-500" /> Personalised Study Plan
            </h3>
            {data?.studyPlan.length === 0 ? (
              <p className="text-gray-400 text-sm">No study plan generated yet.</p>
            ) : (
              <div className="relative border-l-2 border-blue-100 dark:border-blue-900/50 ml-3 space-y-6">
                {data?.studyPlan.map((plan, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900" />
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">{plan.day}</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{plan.task}</h4>
                      <div className="flex items-center mt-2 gap-2 flex-wrap">
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs shadow-sm text-gray-600 dark:text-gray-400">{plan.time}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${typeColour[plan.type] || 'bg-gray-100 text-gray-600'}`}>
                          {typeIcon[plan.type]} {plan.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Feedback Analysis */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-1 lg:col-span-2 bg-gradient-to-r from-gray-900 to-indigo-900 dark:from-gray-800 dark:to-indigo-950 p-8 rounded-3xl text-white shadow-lg">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-400 h-10 w-10 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">AI Feedback & Performance Analysis</h3>
                <p className="text-gray-300 leading-relaxed mb-4">{data?.feedbackAnalysis}</p>
                {data?.recommendation && (
                  <div className="bg-white/10 rounded-xl p-4 mt-2">
                    <p className="text-white font-medium text-sm mb-1">Recommendation</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{data.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      )}
    </div>
  );
};

export default AIInsights;
