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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/student/insights" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AIInsights />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/student/tutor"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AITutor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/quizzes"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <Quizzes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['lecturer', 'admin']}>
                <DashboardLayout>
                  <LecturerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/lecturer/students"
            element={
              <ProtectedRoute allowedRoles={['lecturer', 'admin']}>
                <DashboardLayout>
                  <LecturerStudents />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/data"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <DataManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
