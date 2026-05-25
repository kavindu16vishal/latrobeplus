import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut, LayoutDashboard, BrainCircuit, Target,
  UserCircle, Moon, Sun, Bell, ChevronRight, ShieldAlert, Upload,
  Users, GraduationCap, BookOpen, FileText, Send, Activity, Shield,
  Layers, Calculator, CalendarDays, Map, ClipboardList, MessageSquareDiff,
  StickyNote, CalendarCheck, Clock, CheckCircle, Settings
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatbot from '../AIChatbot';
import axios from 'axios';

const PAGE_TITLES: Record<string, string> = {
  '/student/dashboard':           'My Dashboard',
  '/student/insights':            'AI Insights',
  '/student/quizzes':             'Adaptive Quizzes',
  '/student/tutor':               'AI Learning Tutor',
  '/student/grade-calculator':    'Grade Calculator',
  '/student/competency-map':      'Competency Map',
  '/student/calendar':            'Assessment Calendar',
  '/student/flashcards':          'Flashcards',
  '/student/exam-prep':           'Exam Prep Coach',
  '/student/assignment-feedback': 'Assignment Feedback',
  '/student/notes':               'My Notes',
  '/student/study-planner':       'Study Planner',
  '/student/settings':            'Settings',
  '/lecturer/dashboard':   'Subject Overview',
  '/lecturer/students':    'All Students',
  '/lecturer/results':     'Results Management',
  '/lecturer/groups':      'Student Groups',
  '/lecturer/settings':   'Settings',
  '/admin/system':         'System Overview',
  '/admin/users':          'User Management',
  '/admin/lecturers':      'Lecturer Management',
  '/admin/subjects':       'Subject Management',
  '/admin/results':        'Results Management',
  '/admin/dashboard':      'Student Monitor',
  '/admin/data':           'Data Upload',
  '/admin/notifications':  'Notifications',
  '/admin/settings':       'Settings',
  '/notifications':        'Notifications',
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark'));
  const [atRiskCount, setAtRiskCount]     = useState<number | null>(null);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [showNotif, setShowNotif]         = useState(false);
  const [showUnread, setShowUnread]       = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    if (user?.role === 'lecturer' || user?.role === 'admin') {
      axios.get('http://localhost:5000/api/lecturer/overview', { headers })
        .then(r => setAtRiskCount(r.data.atRiskCount)).catch(() => {});
    }
    axios.get('http://localhost:5000/api/notifications/unread-count', { headers })
      .then(r => setUnreadCount(r.data.count)).catch(() => {});
    const interval = setInterval(() => {
      axios.get('http://localhost:5000/api/notifications/unread-count', { headers })
        .then(r => setUnreadCount(r.data.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
    }`;

  const studentNav = [
    { section: 'Home', items: [
      { to: '/student/dashboard', icon: <LayoutDashboard size={18} />, label: 'My Dashboard' },
    ]},
    { section: 'AI Features', items: [
      { to: '/student/insights',            icon: <BrainCircuit size={18} />,      label: 'AI Insights' },
      { to: '/student/tutor',               icon: <GraduationCap size={18} />,     label: 'AI Tutor' },
      { to: '/student/exam-prep',           icon: <ClipboardList size={18} />,     label: 'Exam Prep Coach' },
      { to: '/student/assignment-feedback', icon: <MessageSquareDiff size={18} />, label: 'Assignment Feedback' },
    ]},
    { section: 'Study Tools', items: [
      { to: '/student/quizzes',      icon: <Target size={18} />,       label: 'Adaptive Quizzes' },
      { to: '/student/flashcards',   icon: <Layers size={18} />,       label: 'Flashcards' },
      { to: '/student/study-planner',icon: <CalendarCheck size={18} />,label: 'Study Planner' },
      { to: '/student/notes',        icon: <StickyNote size={18} />,   label: 'My Notes' },
    ]},
    { section: 'Progress', items: [
      { to: '/student/grade-calculator', icon: <Calculator size={18} />,   label: 'Grade Calculator' },
      { to: '/student/calendar',         icon: <CalendarDays size={18} />, label: 'Assessment Calendar' },
      { to: '/student/competency-map',   icon: <Map size={18} />,          label: 'Competency Map' },
    ]},
    { section: 'Account', items: [
      { to: '/student/settings', icon: <Settings size={18} />, label: 'Settings' },
    ]},
  ];

  const lecturerNav = [
    { section: 'Overview', items: [
      { to: '/lecturer/dashboard', icon: <LayoutDashboard size={18} />, label: 'Subject Overview' },
      { to: '/lecturer/students',  icon: <Users size={18} />,           label: 'All Students' },
    ]},
    { section: 'Management', items: [
      { to: '/lecturer/results', icon: <FileText size={18} />,    label: 'Results Management' },
      { to: '/lecturer/groups',  icon: <GraduationCap size={18} />, label: 'Student Groups' },
    ]},
    { section: 'Quick Filters', items: [
      { to: '/lecturer/students?status=At Risk',          icon: <ShieldAlert size={18} />, label: 'At-Risk Students' },
      { to: '/lecturer/students?status=Attention Needed', icon: <Clock size={18} />,       label: 'Needs Attention' },
      { to: '/lecturer/students?status=On Track',         icon: <CheckCircle size={18} />, label: 'On Track' },
    ]},
    { section: 'Communication', items: [
      { to: '/notifications', icon: <Bell size={18} />, label: 'Notifications', badge: unreadCount > 0 ? unreadCount : undefined },
    ]},
    { section: 'Account', items: [
      { to: '/lecturer/settings', icon: <Settings size={18} />, label: 'Settings' },
    ]},
  ];

  const adminNav = [
    { section: 'Overview', items: [
      { to: '/admin/system',    icon: <Activity size={18} />,       label: 'System Overview' },
    ]},
    { section: 'Management', items: [
      { to: '/admin/users',     icon: <Users size={18} />,          label: 'User Management' },
      { to: '/admin/lecturers', icon: <Shield size={18} />,         label: 'Lecturer Management' },
      { to: '/admin/subjects',  icon: <BookOpen size={18} />,       label: 'Subject Management' },
      { to: '/admin/results',   icon: <FileText size={18} />,       label: 'Results Management' },
    ]},
    { section: 'Analytics', items: [
      { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Student Monitor' },
    ]},
    { section: 'Tools', items: [
      { to: '/admin/data',          icon: <Upload size={18} />,   label: 'Data Upload' },
      { to: '/admin/notifications', icon: <Send size={18} />,     label: 'Notifications' },
    ]},
    { section: 'Account', items: [
      { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
    ]},
  ];

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  const roleColour: Record<string, string> = {
    student:  'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
    lecturer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    admin:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const notifPath = user?.role === 'admin' ? '/admin/notifications' : '/notifications';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex relative">

      {/* Ambient glare — top-right */}
      <div aria-hidden="true" className="pointer-events-none fixed top-0 right-0 z-0"
        style={{ width: '60vw', height: '60vw', transform: 'translate(20%, -25%)',
          background: 'radial-gradient(circle at center, rgba(220,38,38,0.13) 0%, rgba(239,68,68,0.06) 45%, transparent 70%)',
          filter: 'blur(48px)', borderRadius: '50%' }} />
      {/* Ambient glare — bottom-left */}
      <div aria-hidden="true" className="pointer-events-none fixed bottom-0 left-0 z-0"
        style={{ width: '45vw', height: '45vw', transform: 'translate(-20%, 25%)',
          background: 'radial-gradient(circle at center, rgba(185,28,28,0.11) 0%, rgba(220,38,38,0.05) 50%, transparent 70%)',
          filter: 'blur(56px)', borderRadius: '50%' }} />

      {/* Sidebar */}
      <div className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm relative z-10">

        <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
          <img src={dark ? '/logo-dark.png' : '/logo-light.png'} alt="La Trobe+" className="h-9 w-auto" />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {user?.role === 'admin' ? (
            adminNav.map(section => (
              <div key={section.section} className="mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{section.section}</p>
                {section.items.map(item => (
                  <NavLink key={item.to} to={item.to} end className={navLinkClass}>
                    <span className="mr-3 flex-shrink-0">{item.icon}</span>
                    {item.label}
                    {item.to === location.pathname && (
                      <ChevronRight size={14} className="ml-auto text-blue-400" />
                    )}
                  </NavLink>
                ))}
              </div>
            ))
          ) : (
            <>
              {user?.role === 'student' ? (
                studentNav.map(section => (
                  <div key={section.section} className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{section.section}</p>
                    {section.items.map(item => (
                      <NavLink key={item.to} to={item.to} end className={navLinkClass}>
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        {item.label}
                        {item.to === location.pathname && (
                          <ChevronRight size={14} className="ml-auto text-blue-400" />
                        )}
                      </NavLink>
                    ))}
                  </div>
                ))
              ) : (
                <>
                  {lecturerNav.map(section => (
                    <div key={section.section} className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{section.section}</p>
                      {section.items.map((item: any) => {
                        const hasQuery = item.to.includes('?');
                        let computedActive: boolean;
                        if (hasQuery) {
                          const [base, qs] = item.to.split('?');
                          const itemStatus = new URLSearchParams(qs).get('status');
                          const currentStatus = new URLSearchParams(location.search).get('status');
                          computedActive = location.pathname === base && itemStatus === currentStatus;
                        } else {
                          const currentStatus = new URLSearchParams(location.search).get('status');
                          computedActive = location.pathname === item.to &&
                            (item.to !== '/lecturer/students' || !currentStatus);
                        }
                        return (
                          <NavLink key={item.to} to={item.to} end className={() => navLinkClass({ isActive: computedActive })}>
                            <span className="mr-3 flex-shrink-0">{item.icon}</span>
                            {item.label}
                            {item.badge != null ? (
                              <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            ) : computedActive ? (
                              <ChevronRight size={14} className="ml-auto text-blue-400" />
                            ) : null}
                          </NavLink>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}

              {/* At-risk alert for lecturer */}
              {user?.role === 'lecturer' && atRiskCount !== null && atRiskCount > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Alerts</p>
                  <button
                    onClick={() => navigate('/lecturer/dashboard')}
                    className="flex items-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <ShieldAlert size={18} className="mr-3 flex-shrink-0" />
                    {atRiskCount} At-Risk Students
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{atRiskCount}</span>
                  </button>
                </div>
              )}

              {/* Notifications — students only; lecturers have it in the Communication section */}
              {user?.role === 'student' && (
                <div className="mt-4">
                  <NavLink to="/notifications" className={navLinkClass}>
                    <Bell size={18} className="mr-3 flex-shrink-0" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCount}</span>
                    )}
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* At-risk for admin (shown inside section but also as a quick alert) */}
          {user?.role === 'admin' && atRiskCount !== null && atRiskCount > 0 && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-1"
            >
              <ShieldAlert size={18} className="mr-3 flex-shrink-0" />
              {atRiskCount} At-Risk
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{atRiskCount}</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center mb-3 px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="h-8 w-8 rounded-full mr-2 flex-shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                : <div className={`h-full w-full flex items-center justify-center ${roleColour[user?.role || 'student']}`}>
                    <UserCircle size={18} />
                  </div>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
            <LogOut size={16} className="mr-2" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">{pageTitle}</h1>
            {user?.role && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${roleColour[user.role]}`}>
                {user.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* At-risk bell for admin/lecturer */}
            {(user?.role === 'admin' || user?.role === 'lecturer') && atRiskCount !== null && atRiskCount > 0 && (
              <div className="relative">
                <button onClick={() => setShowNotif(v => !v)}
                  className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <ShieldAlert size={20} className="text-red-500" />
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                    {atRiskCount}
                  </span>
                </button>
                <AnimatePresence>
                  {showNotif && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 p-4">
                      <p className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-red-500" /> At-Risk Alert
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-red-600">{atRiskCount} student{atRiskCount > 1 ? 's' : ''}</strong> have a WAM below 50% and require immediate intervention.
                      </p>
                      <button onClick={() => { setShowNotif(false); navigate(user?.role === 'admin' ? '/admin/dashboard' : '/lecturer/dashboard'); }}
                        className="mt-3 w-full text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 rounded-xl font-medium hover:bg-red-100 transition">
                        View At-Risk Students →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notification bell for all users */}
            <div className="relative">
              <button onClick={() => setShowUnread(v => !v)}
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showUnread && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 p-4">
                    <p className="font-bold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <Bell size={16} className="text-yellow-500" />
                      {unreadCount > 0 ? `${unreadCount} Unread` : 'Notifications'}
                    </p>
                    {unreadCount === 0
                      ? <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                      : <p className="text-sm text-gray-600 dark:text-gray-400">You have <strong className="text-yellow-600">{unreadCount} unread</strong> notification{unreadCount > 1 ? 's' : ''}.</p>
                    }
                    <button onClick={() => { setShowUnread(false); navigate(notifPath); }}
                      className="mt-3 w-full text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-xl font-medium hover:bg-yellow-100 transition">
                      View All Notifications →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark mode toggle */}
            <button onClick={toggleDark} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Toggle dark mode">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
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
