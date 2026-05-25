import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Clock, BookOpen, RefreshCw, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface Session { subject: string; task: string; duration: string; type: string; }
interface DayPlan { day: string; date_offset: number; sessions: Session[]; }
interface PlanResponse { plan: DayPlan[]; message?: string; }

const typeStyle: Record<string, string> = {
  Revision:   'bg-blue-100   dark:bg-blue-900/20   border-blue-200   dark:border-blue-800   text-blue-700   dark:text-blue-300',
  Practice:   'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
  Assignment: 'bg-red-100    dark:bg-red-900/20    border-red-200    dark:border-red-800    text-red-700    dark:text-red-300',
  Reading:    'bg-green-100  dark:bg-green-900/20  border-green-200  dark:border-green-800  text-green-700  dark:text-green-300',
};

const typeDot: Record<string, string> = {
  Revision: 'bg-blue-500', Practice: 'bg-orange-500', Assignment: 'bg-red-500', Reading: 'bg-green-500',
};

function getDayDate(offset: number) {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  monday.setDate(monday.getDate() + offset);
  return monday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function StudyPlanner() {
  const { token } = useAuth();
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPlan = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const r = await axios.get<PlanResponse>('http://localhost:5000/api/student-features/study-planner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlan(r.data.plan ?? []);
      setMessage(r.data.message ?? '');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to load study plan');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { loadPlan(); }, []);

  const totalSessions = plan.reduce((acc, d) => acc + d.sessions.length, 0);
  const subjects = [...new Set(plan.flatMap(d => d.sessions.map(s => s.subject)))];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>;

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-400">
      {error}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarCheck size={24} /> Smart Study Planner
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-generated 7-day schedule based on your weakest subjects and upcoming deadlines</p>
        </div>
        <button onClick={() => loadPlan(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Regenerate
        </button>
      </div>

      {message ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p>{message}</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl"><CalendarCheck size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Study Sessions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalSessions} this week</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl"><BookOpen size={20} className="text-blue-600 dark:text-blue-400" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Subjects Covered</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{subjects.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl"><Clock size={20} className="text-purple-600 dark:text-purple-400" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Focus Areas</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{subjects.slice(0, 2).join(', ') || '—'}</p>
              </div>
            </div>
          </div>

          {/* Type legend */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeDot).map(([type, dot]) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className={`w-2 h-2 rounded-full ${dot}`} />{type}
              </span>
            ))}
          </div>

          {/* Day cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plan.map((dayPlan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{dayPlan.day}</p>
                    <p className="text-xs text-gray-400">{getDayDate(dayPlan.date_offset)}</p>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    {dayPlan.sessions.length} session{dayPlan.sessions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {dayPlan.sessions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Rest day</p>
                  ) : dayPlan.sessions.map((s, j) => (
                    <div key={j} className={`p-2.5 rounded-xl border text-xs ${typeStyle[s.type] ?? typeStyle.Revision}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDot[s.type] ?? typeDot.Revision}`} />
                        <span className="font-bold">{s.subject}</span>
                        <span className="ml-auto font-medium opacity-70 flex-shrink-0">{s.duration}</span>
                      </div>
                      <p className="leading-tight opacity-80">{s.task}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        <Tag size={9} className="opacity-50" />
                        <span className="opacity-60">{s.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center">Plan generated from your performance data · {new Date().toLocaleDateString()}</p>
        </>
      )}
    </div>
  );
}
