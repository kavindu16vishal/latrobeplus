import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

import DashboardLayout from './components/layout/DashboardLayout';
import StudentDashboard from './pages/StudentDashboard';
import AIInsights from './pages/AIInsights';
import Quizzes from './pages/Quizzes';
import LecturerDashboard from './pages/LecturerDashboard';
import AdminDashboard from './pages/AdminDashboard';

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
            path="/lecturer/*" 
            element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <DashboardLayout>
                  <LecturerDashboard />
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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
