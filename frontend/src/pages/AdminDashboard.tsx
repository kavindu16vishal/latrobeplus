import React, { useState, useEffect } from 'react';
import { Search, User, TrendingUp, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [interventionPlan, setInterventionPlan] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    // Fetch all students on mount
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (error) {
        console.error('Failed to fetch students', error);
      }
    };
    fetchStudents();
  }, [token]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = async (student: any) => {
    setSearchTerm(''); // Clear search 
    setIsDropdownOpen(false); // Hide dropdown
    
    // Fetch real performance data
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/students/${student.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedStudent(res.data);
      setInterventionPlan(null); // Reset intervention plan
    } catch (error) {
      console.error('Failed to fetch student details', error);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedStudent) return;
    setIsGeneratingPlan(true);
    try {
      const res = await axios.post('http://localhost:5000/api/chat', {
        message: `Generate a short 3-bullet-point academic intervention plan for an IT student named ${selectedStudent.name}. Their WAM is ${selectedStudent.wam} and their status is "${selectedStudent.status}". Focus on actionable steps.`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterventionPlan(res.data.reply);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setInterventionPlan("Failed to connect to AI engine. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleContactStudent = () => {
    if (selectedStudent?.email) {
      window.location.href = `mailto:${selectedStudent.email}?subject=Academic%20Progress%20Check-in`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Search */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center z-20 relative">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Progress Monitor</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Search and analyse individual student trajectories.</p>
        </div>

        <div className="relative w-full md:w-96" onMouseLeave={() => setIsDropdownOpen(false)}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search or select a student..."
              value={searchTerm}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
              >
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.id}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No students found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Student Dashboard */}
      {selectedStudent ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* Student Banner */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStudent.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{selectedStudent.id} • Computer Science</p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-4">
              <div className="text-center px-6 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Current WAM</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedStudent.wam}</p>
              </div>
              <div className={`flex items-center px-6 py-2 rounded-xl border ${
                selectedStudent.status === 'On Track' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800' :
                selectedStudent.status === 'At Risk' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800' :
                'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800'
              }`}>
                {selectedStudent.status === 'On Track' ? <CheckCircle className="mr-2 h-5 w-5" /> :
                 selectedStudent.status === 'At Risk' ? <AlertTriangle className="mr-2 h-5 w-5" /> :
                 <TrendingUp className="mr-2 h-5 w-5" />}
                <span className="font-bold">{selectedStudent.status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Subject Performance Bar Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center mb-6">
                <BookOpen className="h-5 w-5 text-indigo-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subject Performance vs Cohort Average</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedStudent.performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
                    <RechartsTooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
                    <Bar name="Student Score" dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Class Average" dataKey="average" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Competency Radar Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Competency Mastery Level</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Visual mapping of SILO achievement across all subjects.</p>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedStudent.competencies}>
                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Radar name="Mastery %" dataKey="mastery" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                    <RechartsTooltip wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Longitudinal Skill Tracking */}
            <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Longitudinal Progress Trends</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tracking academic trajectory across the semester.</p>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedStudent.progressTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
                    <RechartsTooltip wrapperClassName="dark:bg-gray-800 dark:text-white border-none rounded-xl shadow-lg" />
                    <Line type="monotone" name="Overall Score" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="col-span-1 lg:col-span-2 bg-gradient-to-r from-gray-900 to-indigo-900 dark:from-gray-800 dark:to-indigo-950 p-8 rounded-3xl text-white shadow-lg flex items-start">
               <AlertTriangle className="text-yellow-400 h-8 w-8 mr-4 flex-shrink-0" />
               <div>
                 <h3 className="text-xl font-bold mb-2">Predictive Analytics & Early Risk Detection</h3>
                 <p className="text-gray-300 leading-relaxed mb-4">
                   {selectedStudent.recommendation}
                 </p>
                 
                 <div className="flex gap-3 mt-4">
                   <button 
                     onClick={handleGeneratePlan}
                     disabled={isGeneratingPlan}
                     className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition backdrop-blur-sm"
                   >
                     {isGeneratingPlan ? 'Generating...' : 'Generate Intervention Plan'}
                   </button>
                   <button 
                     onClick={handleContactStudent}
                     className="bg-transparent hover:bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                   >
                     Contact Student
                   </button>
                 </div>

                 {/* Render Generated Plan */}
                 {interventionPlan && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }} 
                     animate={{ opacity: 1, height: 'auto' }} 
                     className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md"
                   >
                     <h4 className="font-bold text-white mb-2 flex items-center">
                       <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                       Generated Intervention Strategy
                     </h4>
                     <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                       {interventionPlan}
                     </div>
                   </motion.div>
                 )}
               </div>
            </div>

          </div>
        </motion.div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
            <Search className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Student</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Use the search bar above to look up a student by their name or university ID. Their full academic trajectory, competency analytics, and risk factors will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
