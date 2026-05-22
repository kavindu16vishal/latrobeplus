import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Users, AlertCircle, TrendingUp, ShieldAlert, CheckCircle2,
  Loader2, BookOpen, Award, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentSlideOver from '../components/StudentSlideOver';

interface OverviewData {
  classAvg: string;
  totalStudents: number;
  atRiskCount: number;
  attentionCount: number;
  onTrackCount: number;
  gradeDistribution: { grade: string; students: number }[];
  riskBreakdown: { name: string; value: number; color: string }[];
  subjectAverages: { subject: string; avg: number; enrolled: number }[];
  atRiskStudents: {
    student_id: string;
    full_name: string;
    email: string;
    wam: number;
    status: string;
    weakestSubject: string | null;
    weakestScore: number | null;
  }[];
}

const GRADE_COLOURS: Record<string, string> = {
  'Fail':        '#ef4444',
  'Pass':        '#f59e0b',
  'Credit':      '#3b82f6',
  'Distinction': '#8b5cf6',
  'High Dist':   '#22c55e',
};

const CustomBar = (props: any) => {
  const { x, y, width, height, grade } = props;
  return <rect x={x} y={y} width={width} height={height} fill={GRADE_COLOURS[grade] || '#3b82f6'} rx={4} />;
};

// ── Main dashboard ─────────────────────────────────────────────────────────────
const LecturerDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/lecturer/overview', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => setData(r.data))
      .catch(() => setError('Could not load overview data. Make sure the server is running.'))
      .finally(() => setLoading(false));
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

  const passRate = data.totalStudents > 0
    ? (((data.totalStudents - (data.gradeDistribution.find(g => g.grade === 'Fail')?.students || 0)) / data.totalStudents) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Student detail slide-over */}
      <AnimatePresence>
        {selectedStudentId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedStudentId(null)}
            />
            <StudentSlideOver
              studentId={selectedStudentId}
              token={token!}
              onClose={() => setSelectedStudentId(null)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {data.subjectAverages.map(s => s.subject).join(', ')} • {data.totalStudents} Students Enrolled
          </p>
        </div>
        <button
          onClick={() => navigate('/lecturer/students')}
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
        >
          View All Students
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Class Average</p>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.classAvg}%</p>
          <p className="text-xs text-gray-400 mt-1">{data.totalStudents} students</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">At-Risk Students</p>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.atRiskCount}</p>
          <p className="text-xs text-orange-500 mt-1">{data.attentionCount} need attention</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">On Track</p>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.onTrackCount}</p>
          <p className="text-xs text-gray-400 mt-1">{((data.onTrackCount / data.totalStudents) * 100).toFixed(0)}% of cohort</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pass Rate</p>
            <Award className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{passRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Scored ≥ 50%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Grade Distribution */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center mb-6">
            <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grade Distribution</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gradeDistribution} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                  formatter={(v: any) => [`${v} students`, 'Count']}
                />
                <Bar dataKey="students" radius={[6, 6, 0, 0]} shape={(props: any) => <CustomBar {...props} grade={props.grade} />}>
                  {data.gradeDistribution.map((entry) => (
                    <Cell key={entry.grade} fill={GRADE_COLOURS[entry.grade] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {data.gradeDistribution.map(g => (
              <div key={g.grade} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRADE_COLOURS[g.grade] }} />
                {g.grade}: <strong>{g.students}</strong>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Breakdown Donut */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Student Risk Profile</h3>
          <p className="text-xs text-gray-400 mb-4">Based on WAM across all subjects</p>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.riskBreakdown} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {data.riskBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [`${v} students`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3">
            {data.riskBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* At-Risk Students Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <ShieldAlert className="text-red-500 mr-2 h-5 w-5" /> Intervention Required
            </h3>
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full font-semibold">
              {data.atRiskCount + data.attentionCount} students
            </span>
          </div>
          <div className="space-y-3">
            {data.atRiskStudents.slice(0, 10).map((s, i) => (
              <motion.button
                key={s.student_id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedStudentId(s.student_id)}
                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-shadow hover:shadow-md ${
                  s.status === 'At Risk'
                    ? 'border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.full_name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">({s.student_id})</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${s.status === 'At Risk' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    WAM: {s.wam}% — Weakest: {s.weakestSubject} ({s.weakestScore}%)
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    s.status === 'At Risk'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {s.status}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </motion.button>
            ))}
            </div>

          {(data.atRiskCount + data.attentionCount) > 10 && (
            <button
              onClick={() => navigate('/lecturer/students?status=At+Risk')}
              className="mt-3 w-full text-sm text-blue-600 dark:text-blue-400 hover:underline text-center py-2"
            >
              Showing top 10 — View all {data.atRiskCount + data.attentionCount} at-risk students →
            </button>
          )}
        </motion.div>

        {/* Subject Averages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center mb-5">
            <Users className="text-indigo-500 mr-2 h-5 w-5" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subject Performance</h3>
          </div>
          <div className="space-y-5">
            {data.subjectAverages.map((s, i) => {
              const pct = s.avg;
              const colour = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <motion.div key={s.subject} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.subject}</span>
                      <span className="text-xs text-gray-400 ml-2">{s.enrolled} students</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: colour }}>{s.avg}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.1 }}
                      className="h-3 rounded-full"
                      style={{ backgroundColor: colour }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span className={pct >= 70 ? 'text-green-500' : pct >= 50 ? 'text-orange-500' : 'text-red-500'}>
                      {pct >= 70 ? 'Strong' : pct >= 50 ? 'Average' : 'Needs Attention'}
                    </span>
                    <span>100%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Cohort summary */}
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Cohort Summary</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
              Class average is <strong>{data.classAvg}%</strong> across {data.totalStudents} students.
              {' '}<strong>{data.atRiskCount}</strong> students are failing (WAM &lt; 50%) and require urgent intervention.
              {' '}<strong>{data.attentionCount}</strong> students need monitoring (WAM 50–65%).
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default LecturerDashboard;
