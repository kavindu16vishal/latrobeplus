import React from 'react';
import { Brain, FileSearch, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const weaknesses = [
  { topic: 'Binary Search Trees', score: 45, impact: 'High', description: 'Struggling with tree traversal algorithms (Inorder, Preorder, Postorder).' },
  { topic: 'Dynamic Programming', score: 52, impact: 'Medium', description: 'Difficulty identifying overlapping subproblems.' },
];

const studyPlan = [
  { day: 'Monday', task: 'Review BST Traversal Lecture Notes', time: '45 mins', type: 'Theory' },
  { day: 'Wednesday', task: 'Complete Adaptive Quiz on Trees', time: '30 mins', type: 'Practice' },
  { day: 'Friday', task: 'Watch recommended video: DP Memoization', time: '1 hour', type: 'Resource' },
];

const AIInsights: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl mr-4">
          <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Learning Insights</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Deep analysis of your performance and personalised recommendations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weakness Detection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileSearch className="mr-2 text-orange-500" /> Detected Knowledge Gaps
          </h3>
          <div className="space-y-4">
            {weaknesses.map((item, index) => (
              <div key={index} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{item.topic}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.impact === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                    {item.impact} Impact
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{item.description}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${item.score}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Mastery: {item.score}%</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Study Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Lightbulb className="mr-2 text-yellow-500" /> Personalised Study Plan
          </h3>
          <div className="relative border-l-2 border-blue-100 dark:border-blue-900/50 ml-3 space-y-6">
            {studyPlan.map((plan, index) => (
              <div key={index} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900"></div>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">{plan.day}</p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{plan.task}</h4>
                  <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm mr-2">{plan.time}</span>
                    <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">{plan.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NLP Feedback Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-1 lg:col-span-2 bg-gradient-to-r from-gray-900 to-indigo-900 dark:from-gray-800 dark:to-indigo-950 p-8 rounded-3xl text-white shadow-lg">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-400 h-10 w-10 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Feedback Sentiment Analysis</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                The AI has scanned your latest assignment feedback. Your lecturer frequently commended your <strong>code structure</strong> but consistently noted issues with <strong>time complexity optimization</strong>. We recommend focusing heavily on Big-O notation before the final exam.
              </p>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition backdrop-blur-sm">
                View Feedback Details
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AIInsights;
