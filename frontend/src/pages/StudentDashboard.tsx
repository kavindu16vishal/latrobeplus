import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, BookOpen, Brain, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data
const masteryData = [
  { subject: 'Programming', A: 85, fullMark: 100 },
  { subject: 'Databases', A: 65, fullMark: 100 },
  { subject: 'Web Dev', A: 90, fullMark: 100 },
  { subject: 'Algorithms', A: 45, fullMark: 100 },
  { subject: 'Networks', A: 70, fullMark: 100 },
  { subject: 'Security', A: 60, fullMark: 100 },
];

const progressData = [
  { week: 'Week 1', score: 65 },
  { week: 'Week 2', score: 68 },
  { week: 'Week 3', score: 64 },
  { week: 'Week 4', score: 75 },
  { week: 'Week 5', score: 82 },
];

const aiRecommendations = [
  { id: 1, text: 'Review Binary Search Trees before your next Algorithms quiz.', type: 'revision' },
  { id: 2, text: 'Your SQL join concepts are weak. Try the "Advanced Joins" adaptive quiz.', type: 'quiz' },
  { id: 3, text: 'Great progress in Web Dev! You are performing in the top 15% of your cohort.', type: 'praise' }
];

const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-2">Welcome back to your Learning Journey!</h2>
        <p className="text-blue-100 mb-6 max-w-2xl text-lg">
          Your AI Assistant has analysed your recent assessments. You are making great progress, but there are a few key areas in Algorithms we should focus on.
        </p>
        <div className="flex space-x-4">
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-50 transition flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Take Adaptive Quiz
          </button>
          <button className="bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-900 transition flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            View Study Plan
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl mr-4">
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current WAM</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">76.5</p>
            <p className="text-xs text-green-600 mt-1">+2.1 from last semester</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl mr-4">
            <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Overall Mastery</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">Proficient</p>
            <p className="text-xs text-blue-600 mt-1">72% Syllabus coverage</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-2xl mr-4">
            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Identified Gaps</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">3</p>
            <p className="text-xs text-orange-600 mt-1">Requires attention</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Competency Radar</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Radar name="Mastery Level" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Tooltip wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center mb-6">
            <Brain className="h-6 w-6 text-indigo-500 mr-2" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Recommendations</h3>
          </div>
          <div className="space-y-4">
            {aiRecommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-start">
                <div className={`p-2 rounded-xl mr-4 flex-shrink-0 ${
                  rec.type === 'revision' ? 'bg-orange-100 text-orange-600' :
                  rec.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {rec.type === 'revision' ? <BookOpen size={20} /> :
                   rec.type === 'quiz' ? <Target size={20} /> :
                   <TrendingUp size={20} />}
                </div>
                <div>
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Learning Growth Timeline</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} domain={[0, 100]} />
                <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default StudentDashboard;
