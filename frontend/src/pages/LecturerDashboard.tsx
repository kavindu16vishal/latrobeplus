import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, AlertCircle, FileText, BrainCircuit, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const gradeDistribution = [
  { grade: 'Fail', students: 5 },
  { grade: 'Pass', students: 15 },
  { grade: 'Credit', students: 30 },
  { grade: 'Distinction', students: 25 },
  { grade: 'High Dist', students: 12 },
];

const riskData = [
  { name: 'Low Risk', value: 65, color: '#22c55e' },
  { name: 'Medium Risk', value: 25, color: '#f59e0b' },
  { name: 'High Risk', value: 10, color: '#ef4444' },
];

const engagementData = [
  { week: 'W1', engagement: 95 },
  { week: 'W2', engagement: 92 },
  { week: 'W3', engagement: 88 },
  { week: 'W4', engagement: 85 },
  { week: 'W5', engagement: 76 },
  { week: 'W6', engagement: 82 },
];

const atRiskStudents = [
  { id: 'STU1042', name: 'James Wilson', riskScore: 88, issue: 'Failed last 2 quizzes, low engagement' },
  { id: 'STU0891', name: 'Sarah Chen', riskScore: 75, issue: 'Missed Assignment 1 submission' },
  { id: 'STU1105', name: 'Michael Brown', riskScore: 72, issue: 'Consistently poor performance in Database topics' },
];

const aiInsights = [
  { id: 1, text: '35% of the cohort struggled with "Normalisation (3NF)". Consider a brief recap lecture.', type: 'warning' },
  { id: 2, text: 'Students who completed the optional adaptive quiz scored 15% higher on the Midterm.', type: 'success' },
];

const LecturerDashboard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Overview: CSE301 Databases</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Semester 1, 2026 • 87 Students Enrolled</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm">
            <option>All Assessments</option>
            <option>Assignment 1</option>
            <option>Midterm Quiz</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Class Average</h3>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">68.4%</p>
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <TrendingUp size={14} className="mr-1" /> +2.4% vs last year
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">At-Risk Students</h3>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
          <p className="text-xs text-red-600 mt-1 flex items-center">
            <TrendingUp size={14} className="mr-1" /> +3 this week
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Submissions</h3>
            <FileText className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">82/87</p>
          <p className="text-xs text-gray-500 mt-1">Assignment 1</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-100">AI Engagement</h3>
            <BrainCircuit className="h-5 w-5 text-purple-100" />
          </div>
          <p className="text-2xl font-bold">78%</p>
          <p className="text-xs text-purple-100 mt-1">Students using recommendations</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Grade Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
                <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Breakdown Pie Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Student Risk Profile</h3>
          <div className="h-[200px] w-full flex justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {riskData.map(item => (
              <div key={item.name} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* At-Risk Students List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <ShieldAlert className="text-red-500 mr-2 h-5 w-5" /> Intervention Required
            </h3>
            <a href="#" className="text-sm text-blue-600 hover:underline">View All</a>
          </div>
          <div className="space-y-4">
            {atRiskStudents.map((student) => (
              <div key={student.id} className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{student.name} <span className="text-xs text-gray-500 ml-1">({student.id})</span></h4>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{student.issue}</p>
                </div>
                <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Contact
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Cohort Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center mb-6">
            <BrainCircuit className="text-indigo-500 mr-2 h-5 w-5" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Cohort Insights</h3>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-start">
                {insight.type === 'warning' ? (
                  <AlertCircle className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

// Re-export Lucide icon for KPI Card usage above
const TrendingUp = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
);

export default LecturerDashboard;
