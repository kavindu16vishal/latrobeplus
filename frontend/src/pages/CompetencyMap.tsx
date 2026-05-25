import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Map, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Silo { id: number; code: string; description: string; mastery: number; level: string; }
interface SubjectData { subject_code: string; subject_name: string; avg_score: number; silos: Silo[]; }

const LEVEL_COLOUR: Record<string, string> = {
  Advanced:   'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300  border-green-200  dark:border-green-800',
  Proficient: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300   border-blue-200   dark:border-blue-800',
  Developing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  Beginning:  'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300    border-red-200    dark:border-red-800',
};

const LEVEL_BAR: Record<string, string> = {
  Advanced: 'bg-green-500', Proficient: 'bg-blue-500', Developing: 'bg-yellow-500', Beginning: 'bg-red-500',
};

export default function CompetencyMap() {
  const { token } = useAuth();
  const [data, setData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/student-features/silos', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => { setData(r.data); if (r.data.length > 0) setSelected(r.data[0].subject_code); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" /></div>;

  const selectedSubject = data.find(d => d.subject_code === selected);
  const radarData = selectedSubject?.silos.length
    ? selectedSubject.silos.map(s => ({ subject: s.code, mastery: s.mastery, fullMark: 100 }))
    : data.map(d => ({ subject: d.subject_code, mastery: d.avg_score, fullMark: 100 }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Map size={24} /> Competency Map</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your mastery across all learning objectives</p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p>No results yet — your competency map will appear once assessments are graded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject selector + radar */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {data.map(d => (
                <button key={d.subject_code} onClick={() => setSelected(d.subject_code)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${selected === d.subject_code ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {d.subject_code}
                </button>
              ))}
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Radar name="Mastery" dataKey="mastery" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Mastery']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {selectedSubject && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                {selectedSubject.subject_code} — {selectedSubject.subject_name} · Average: <strong className={selectedSubject.avg_score >= 65 ? 'text-green-600' : selectedSubject.avg_score >= 50 ? 'text-yellow-600' : 'text-red-600'}>{selectedSubject.avg_score.toFixed(1)}%</strong>
              </p>
            )}
          </div>

          {/* Silo breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Learning Objectives</h3>
            {selectedSubject?.silos.length ? (
              <div className="space-y-4">
                {selectedSubject.silos.map((silo, i) => (
                  <motion.div key={silo.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{silo.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${LEVEL_COLOUR[silo.level] ?? ''}`}>{silo.level}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-1">
                      <div className={`h-2 rounded-full ${LEVEL_BAR[silo.level] ?? 'bg-gray-400'}`} style={{ width: `${Math.min(silo.mastery, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">{silo.description}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((d, i) => (
                  <motion.div key={d.subject_code} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{d.subject_code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${d.avg_score >= 80 ? LEVEL_COLOUR.Advanced : d.avg_score >= 65 ? LEVEL_COLOUR.Proficient : d.avg_score >= 50 ? LEVEL_COLOUR.Developing : LEVEL_COLOUR.Beginning}`}>
                        {d.avg_score >= 80 ? 'Advanced' : d.avg_score >= 65 ? 'Proficient' : d.avg_score >= 50 ? 'Developing' : 'Beginning'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${d.avg_score >= 80 ? 'bg-green-500' : d.avg_score >= 65 ? 'bg-blue-500' : d.avg_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(d.avg_score, 100)}%` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* All subjects grid */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.map((d, i) => {
              const level = d.avg_score >= 80 ? 'Advanced' : d.avg_score >= 65 ? 'Proficient' : d.avg_score >= 50 ? 'Developing' : 'Beginning';
              return (
                <motion.div key={d.subject_code} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{d.subject_code}</p>
                  <p className={`text-3xl font-bold mt-2 ${d.avg_score >= 65 ? 'text-green-600' : d.avg_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{d.avg_score.toFixed(0)}%</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border font-semibold ${LEVEL_COLOUR[level] ?? ''}`}>{level}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
