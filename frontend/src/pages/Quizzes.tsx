import React from 'react';
import { Target, PlayCircle, Clock, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const activeQuizzes = [
  { id: 1, title: 'Trees & Graphs Refresher', topic: 'Algorithms', questions: 10, time: '15 mins', difficulty: 'Adaptive', recommended: true },
  { id: 2, title: 'SQL Joins Practice', topic: 'Databases', questions: 15, time: '20 mins', difficulty: 'Intermediate', recommended: false },
];

const completedQuizzes = [
  { id: 3, title: 'Basic Sorting Algorithms', topic: 'Algorithms', score: 85, date: '2 days ago' },
  { id: 4, title: 'HTML/CSS Layouts', topic: 'Web Dev', score: 100, date: '1 week ago' },
];

const Quizzes: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl mr-4">
          <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Adaptive Quizzes</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">AI-generated assessments tailored to your weakest concepts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Available Quizzes */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recommended for You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuizzes.map((quiz, index) => (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                {quiz.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    AI Pick
                  </div>
                )}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{quiz.topic}</span>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{quiz.title}</h4>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-6 space-x-4">
                  <div className="flex items-center"><Award className="w-4 h-4 mr-1" /> {quiz.difficulty}</div>
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {quiz.time}</div>
                </div>

                <button className="w-full flex items-center justify-center bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold py-3 rounded-xl transition border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800">
                  <PlayCircle className="w-5 h-5 mr-2" /> Start Quiz
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Generate Custom Quiz</h3>
              <p className="text-blue-100 text-sm">Want to practice a specific topic? Let the AI build a quiz for you.</p>
            </div>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition whitespace-nowrap">
              Create New
            </button>
          </motion.div>
        </div>

        {/* Completed Quizzes */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Past Results</h3>
          <div className="space-y-4">
            {completedQuizzes.map((quiz, index) => (
              <motion.div key={quiz.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center ${quiz.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                    {quiz.score}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{quiz.topic}</span>
                  <span>{quiz.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Quizzes;
