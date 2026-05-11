import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, LogOut, LayoutDashboard, BrainCircuit, Target, UserCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import AIChatbot from '../AIChatbot';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRolePrefix = () => {
    if (user?.role === 'lecturer') return '/lecturer';
    if (user?.role === 'admin') return '/admin';
    return '/student';
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
      isActive 
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-500 mr-2" />
          <span className="font-bold text-lg text-gray-900 dark:text-white">LTU Assistant</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to={`${getRolePrefix()}/dashboard`} end className={navLinkClass}>
            <LayoutDashboard className="h-5 w-5 mr-3" />
            {user?.role === 'admin' ? 'Student Monitor' : 'Overview'}
          </NavLink>
          {user?.role === 'student' && (
            <>
              <NavLink to="/student/insights" className={navLinkClass}>
                <BrainCircuit className="h-5 w-5 mr-3" />
                AI Insights
              </NavLink>
              <NavLink to="/student/quizzes" className={navLinkClass}>
                <Target className="h-5 w-5 mr-3" />
                Quizzes
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center mb-4 px-2">
            <UserCircle className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
            {user?.role} Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Beta v1.0
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-950 relative">
          {children}
          {user?.role === 'student' && <AIChatbot />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
