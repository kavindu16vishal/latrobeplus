import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calculator, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface Assessment { id: number; assessment_name: string; assessment_type: string; weight: number; current_score: number | null; }
interface Subject { id: number; subject_code: string; subject_name: string; assessments: Assessment[]; }

export default function GradeCalculator() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentWam, setCurrentWam] = useState('0');
  const [hypothetical, setHypothetical] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/student-features/grade-calculator', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      setSubjects(r.data.subjects);
      setCurrentWam(r.data.current_wam);
      const init: Record<number, string> = {};
      r.data.subjects.forEach((s: Subject) =>
        s.assessments.forEach(a => { init[a.id] = a.current_score != null ? String(a.current_score) : ''; })
      );
      setHypothetical(init);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const simulatedWam = useCallback(() => {
    let totalScore = 0, totalWeight = 0;
    subjects.forEach(s =>
      s.assessments.forEach(a => {
        const val = hypothetical[a.id];
        if (val !== '' && val !== undefined && !isNaN(Number(val))) {
          totalScore += Number(val) * (a.weight / 100);
          totalWeight += a.weight / 100;
        }
      })
    );
    if (totalWeight === 0) return parseFloat(currentWam);
    return parseFloat((totalScore / totalWeight).toFixed(1));
  }, [hypothetical, subjects, currentWam]);

  const simWam = simulatedWam();
  const delta = parseFloat((simWam - parseFloat(currentWam)).toFixed(1));
  const gradeLabel = (w: number) => w >= 80 ? 'HD' : w >= 70 ? 'D' : w >= 60 ? 'C' : w >= 50 ? 'P' : 'N';
  const gradeColour = (w: number) => w >= 70 ? 'text-green-600' : w >= 50 ? 'text-yellow-600' : 'text-red-600';
  const scoreColour = (s: number) => s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Calculator size={24} /> Grade Calculator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Edit any score to see how it changes your predicted WAM</p>
      </div>

      {/* WAM summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Current WAM', value: parseFloat(currentWam), note: 'Based on submitted results' },
          { label: 'Predicted WAM', value: simWam, note: 'With your hypothetical scores' },
          { label: 'Predicted Grade', value: gradeLabel(simWam), note: `${delta >= 0 ? '+' : ''}${delta} from current`, isGrade: true },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{card.label}</p>
            <p className={`text-4xl font-bold mt-1 ${card.isGrade ? gradeColour(simWam) : gradeColour(card.value as number)}`}>
              {card.isGrade ? card.value : `${card.value}%`}
            </p>
            <p className="text-xs text-gray-400 mt-1">{card.note}</p>
          </motion.div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
        <Info size={15} className="flex-shrink-0 mt-0.5" />
        <p>Change any score below to simulate your final WAM. Scores shown are your current submitted results — only edit the assessments you haven't sat yet.</p>
      </div>

      {/* Subject sections */}
      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          No results available yet. Your assessments will appear here once graded.
        </div>
      ) : subjects.map((subj, si) => (
        <motion.div key={subj.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{subj.subject_code}</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{subj.subject_name}</span>
            </div>
            {(() => {
              const scores = subj.assessments.map(a => hypothetical[a.id]).filter(v => v !== '' && !isNaN(Number(v)));
              const avg = scores.length ? (scores.reduce((s, v) => s + Number(v), 0) / scores.length).toFixed(1) : null;
              return avg ? <span className={`text-sm font-bold ${gradeColour(Number(avg))}`}>{avg}% avg</span> : null;
            })()}
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {subj.assessments.map(a => {
              const val = hypothetical[a.id] ?? '';
              const numVal = val !== '' ? Number(val) : null;
              return (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.assessment_name}</p>
                    <p className="text-xs text-gray-400">{a.assessment_type} · {a.weight}% weight</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {numVal !== null && (
                      <div className="w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${scoreColour(numVal)}`} style={{ width: `${Math.min(numVal, 100)}%` }} />
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="number" min="0" max="100"
                        value={val}
                        onChange={e => setHypothetical(h => ({ ...h, [a.id]: e.target.value }))}
                        placeholder="—"
                        className="w-20 text-right px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
