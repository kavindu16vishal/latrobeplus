import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

import DashboardLayout from './components/layout/DashboardLayout';
import StudentDashboard from './pages/StudentDashboard';
import AIInsights from './pages/AIInsights';
import Quizzes from './pages/Quizzes';
import AITutor from './pages/AITutor';
import LecturerDashboard from './pages/LecturerDashboard';
import LecturerStudents from './pages/LecturerStudents';
import AdminDashboard from './pages/AdminDashboard';
import DataManagement from './pages/DataManagement';
import SystemDashboard from './pages/SystemDashboard';
import UserManagement from './pages/UserManagement';
import LecturerManagement from './pages/LecturerManagement';
import SubjectManagement from './pages/SubjectManagement';
import ResultsManagement from './pages/ResultsManagement';
import Notifications from './pages/Notifications';
import GradeCalculator from './pages/GradeCalculator';
import CompetencyMap from './pages/CompetencyMap';
import AssessmentCalendar from './pages/AssessmentCalendar';
import Flashcards from './pages/Flashcards';
import ExamPrepCoach from './pages/ExamPrepCoach';
import AssignmentFeedback from './pages/AssignmentFeedback';
import StudentNotes from './pages/StudentNotes';
import StudyPlanner from './pages/StudyPlanner';
import LecturerResults from './pages/LecturerResults';
import LecturerGroups from './pages/LecturerGroups';
import StudentSettings from './pages/StudentSettings';
import LecturerSettings from './pages/LecturerSettings';
import AdminSettings from './pages/AdminSettings';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="text-center">
      <p className="text-8xl font-bold text-gray-200 dark:text-gray-800 mb-4">403</p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have permission to view this page.</p>
      <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
        Return to login →
      </a>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};

const wrap = (Page: React.FC, roles: string[]) => (
  <ProtectedRoute allowedRoles={roles}>
    <DashboardLayout>
      <Page />
    </DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* ── Student ── */}
          <Route path="/student/dashboard"           element={wrap(StudentDashboard,   ['student'])} />
          <Route path="/student/insights"            element={wrap(AIInsights,         ['student'])} />
          <Route path="/student/tutor"               element={wrap(AITutor,            ['student'])} />
          <Route path="/student/quizzes"             element={wrap(Quizzes,            ['student'])} />
          <Route path="/student/grade-calculator"    element={wrap(GradeCalculator,    ['student'])} />
          <Route path="/student/competency-map"      element={wrap(CompetencyMap,      ['student'])} />
          <Route path="/student/calendar"            element={wrap(AssessmentCalendar, ['student'])} />
          <Route path="/student/flashcards"          element={wrap(Flashcards,         ['student'])} />
          <Route path="/student/exam-prep"           element={wrap(ExamPrepCoach,      ['student'])} />
          <Route path="/student/assignment-feedback" element={wrap(AssignmentFeedback, ['student'])} />
          <Route path="/student/notes"               element={wrap(StudentNotes,       ['student'])} />
          <Route path="/student/study-planner"       element={wrap(StudyPlanner,       ['student'])} />
          <Route path="/student/settings"            element={wrap(StudentSettings,    ['student'])} />

          {/* ── Lecturer ── */}
          <Route path="/lecturer/dashboard" element={wrap(LecturerDashboard, ['lecturer', 'admin'])} />
          <Route path="/lecturer/students"  element={wrap(LecturerStudents,  ['lecturer', 'admin'])} />
          <Route path="/lecturer/results"   element={wrap(LecturerResults,   ['lecturer', 'admin'])} />
          <Route path="/lecturer/groups"    element={wrap(LecturerGroups,    ['lecturer', 'admin'])} />
          <Route path="/lecturer/settings" element={wrap(LecturerSettings,  ['lecturer', 'admin'])} />

          {/* ── Admin God Mode ── */}
          <Route path="/admin/system"        element={wrap(SystemDashboard,    ['admin'])} />
          <Route path="/admin/users"         element={wrap(UserManagement,     ['admin'])} />
          <Route path="/admin/lecturers"     element={wrap(LecturerManagement, ['admin'])} />
          <Route path="/admin/subjects"      element={wrap(SubjectManagement,  ['admin'])} />
          <Route path="/admin/results"       element={wrap(ResultsManagement,  ['admin'])} />
          <Route path="/admin/dashboard"     element={wrap(AdminDashboard,     ['admin'])} />
          <Route path="/admin/data"          element={wrap(DataManagement,     ['admin'])} />
          <Route path="/admin/notifications" element={wrap(Notifications,      ['admin'])} />
          <Route path="/admin/settings"     element={wrap(AdminSettings,      ['admin'])} />

          {/* ── Shared Notifications (students & lecturers) ── */}
          <Route path="/notifications" element={wrap(Notifications, ['student', 'lecturer'])} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
