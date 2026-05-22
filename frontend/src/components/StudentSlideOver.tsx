import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, User, Mail, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Props {
  studentId: string;
  token: string;
  onClose: () => void;
}

const STATUS_COLOUR: Record<string, string> = {
  'On Track':         'bg-green-100 text-green-700 border-green-200',
  'Attention Needed': 'bg-orange-100 text-orange-700 border-orange-200',
  'At Risk':          'bg-red-100 text-red-700 border-red-200',
};

const StudentSlideOver: React.FC<Props> = ({ studentId, token, onClose }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    axios
      .get(`http://localhost:5000/api/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(r => setDetail(r.data))
      .finally(() => setLoading(false));
  }, [studentId, token]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Student Profile</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading ? (
          <div className="flex justify-center pt-20">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : !detail ? (
          <p className="text-red-500 text-sm">Could not load student data.</p>
        ) : (
          <>
            {/* Banner */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{detail.name}</p>
                <p className="text-sm text-gray-500">{detail.id}</p>
                <p className="text-xs text-gray-400 truncate">{detail.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{detail.wam}</p>
                <p className="text-xs text-gray-400">WAM</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold mt-1 inline-block ${STATUS_COLOUR[detail.status] || ''}`}>
                  {detail.status}
                </span>
              </div>
            </div>

            {/* Subject performance bars */}
            {detail.performance?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Subject Performance</p>
                <div className="space-y-3">
                  {detail.performance.map((p: any) => (
                    <div key={p.subject}>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">{p.subject}</span>
                        <span className="font-bold" style={{ color: p.score >= 70 ? '#22c55e' : p.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {p.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${p.score}%`, backgroundColor: p.score >= 70 ? '#22c55e' : p.score >= 50 ? '#f59e0b' : '#ef4444' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competency radar */}
            {detail.competencies?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Competency Radar</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={detail.competencies}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="topic" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <Radar dataKey="mastery" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.45} />
                      <Tooltip formatter={(v: any) => [`${v}%`, 'Mastery']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Progress trend */}
            {detail.progressTrends?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Progress Trend</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.progressTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {detail.recommendation && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1 uppercase tracking-wider">AI Recommendation</p>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{detail.recommendation}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {detail && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href={`mailto:${detail.email}?subject=Academic%20Progress%20Check-in`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Mail size={15} /> Contact Student
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default StudentSlideOver;
