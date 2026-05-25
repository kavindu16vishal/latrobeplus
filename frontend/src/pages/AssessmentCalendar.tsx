import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Clock, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface Assessment {
  id: number; assessment_name: string; assessment_type: string;
  weight: number; due_date: string | null; subject_code: string;
  subject_name: string; submitted_score: number | null;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function urgencyColour(days: number) {
  if (days < 0) return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';
  if (days <= 3) return 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
  if (days <= 7) return 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
  return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10';
}

function urgencyBadge(days: number) {
  if (days < 0) return { label: 'Past', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
  if (days === 0) return { label: 'Due today!', cls: 'bg-red-600 text-white' };
  if (days <= 3) return { label: `${days}d left`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
  return { label: `${days}d left`, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
}

export default function AssessmentCalendar() {
  const { token } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'submitted'>('upcoming');

  useEffect(() => {
    axios.get('http://localhost:5000/api/student-features/calendar', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setAssessments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const filtered = assessments.filter(a => {
    if (filter === 'submitted') return a.submitted_score != null;
    if (filter === 'upcoming') return a.submitted_score == null;
    return true;
  });

  const withDates = filtered.filter(a => a.due_date);
  const noDates = filtered.filter(a => !a.due_date);

  const upcoming7 = withDates.filter(a => { const d = daysUntil(a.due_date!); return d >= 0 && d <= 7; });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><CalendarDays size={24} /> Assessment Calendar</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upcoming deadlines and submission status</p>
        </div>
        <div className="flex gap-2">
          {(['upcoming', 'submitted', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 7-day alert strip */}
      {upcoming7.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300 text-sm">Deadlines within 7 days</p>
            <p className="text-red-600 dark:text-red-400 text-sm">{upcoming7.map(a => `${a.subject_code} — ${a.assessment_name}`).join(' · ')}</p>
          </div>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
          <p>{filter === 'upcoming' ? 'No upcoming assessments — great job!' : 'No assessments found.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withDates.map((a, i) => {
            const days = daysUntil(a.due_date!);
            const badge = urgencyBadge(days);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-4 ${urgencyColour(days)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {a.submitted_score != null
                        ? <CheckCircle size={18} className="text-green-500" />
                        : <Clock size={18} className={days <= 3 ? 'text-red-500' : 'text-indigo-500'} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.assessment_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{a.subject_code} · {a.assessment_type} · {a.weight}% of grade</p>
                      <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(a.due_date!).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {a.submitted_score != null
                      ? <span className="text-sm font-bold text-green-600 dark:text-green-400">{a.submitted_score}%</span>
                      : <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
                    }
                  </div>
                </div>
              </motion.div>
            );
          })}

          {noDates.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">No due date set</p>
              {noDates.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{a.assessment_name}</p>
                    <p className="text-xs text-gray-400">{a.subject_code} · {a.assessment_type} · {a.weight}%</p>
                  </div>
                  {a.submitted_score != null
                    ? <span className="text-sm font-bold text-green-600">{a.submitted_score}%</span>
                    : <BookOpen size={16} className="text-gray-300 dark:text-gray-600" />
                  }
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
