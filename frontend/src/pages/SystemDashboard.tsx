import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, AlertTriangle,
  FileText, UserPlus, Upload, Bell, Activity, Clock, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemStats {
  students: number;
  lecturers: number;
  admins: number;
  subjects: number;
  total_results: number;
  at_risk_count: number;
  recent_users: { full_name: string; email: string; role: string; created_at: string }[];
}

interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  target_type: string;
  details: string;
  created_at: string;
}

const ACTION_COLOUR: Record<string, string> = {
  CREATE_USER: 'text-green-600 dark:text-green-400',
  DELETE_USER: 'text-red-600 dark:text-red-400',
  UPDATE_USER: 'text-blue-600 dark:text-blue-400',
  RESET_PASSWORD: 'text-yellow-600 dark:text-yellow-400',
  ADD_RESULT: 'text-green-600 dark:text-green-400',
  EDIT_RESULT: 'text-blue-600 dark:text-blue-400',
  DELETE_RESULT: 'text-red-600 dark:text-red-400',
  CREATE_SUBJECT: 'text-green-600 dark:text-green-400',
  DELETE_SUBJECT: 'text-red-600 dark:text-red-400',
  ASSIGN_SUBJECT: 'text-indigo-600 dark:text-indigo-400',
  UNASSIGN_SUBJECT: 'text-orange-600 dark:text-orange-400',
};

const ROLE_COLOUR: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  lecturer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export default function SystemDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('http://localhost:5000/api/admin/system-stats', { headers }),
      axios.get('http://localhost:5000/api/admin/audit-logs?limit=20', { headers }),
    ]).then(([statsRes, auditRes]) => {
      setStats(statsRes.data);
      setAudit(auditRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Students', value: stats?.students ?? 0, icon: <GraduationCap size={22} />, colour: 'bg-blue-500', action: () => navigate('/admin/users?role=student') },
    { label: 'Lecturers', value: stats?.lecturers ?? 0, icon: <Users size={22} />, colour: 'bg-indigo-500', action: () => navigate('/admin/lecturers') },
    { label: 'Subjects', value: stats?.subjects ?? 0, icon: <BookOpen size={22} />, colour: 'bg-teal-500', action: () => navigate('/admin/subjects') },
    { label: 'At-Risk', value: stats?.at_risk_count ?? 0, icon: <AlertTriangle size={22} />, colour: 'bg-red-500', action: () => navigate('/admin/dashboard') },
    { label: 'Total Results', value: stats?.total_results ?? 0, icon: <FileText size={22} />, colour: 'bg-orange-500', action: () => navigate('/admin/results') },
    { label: 'Admins', value: stats?.admins ?? 0, icon: <Shield size={22} />, colour: 'bg-purple-500', action: () => navigate('/admin/users?role=admin') },
  ];

  const quickActions = [
    { label: 'Add User', icon: <UserPlus size={18} />, to: '/admin/users', colour: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100' },
    { label: 'Manage Lecturers', icon: <Users size={18} />, to: '/admin/lecturers', colour: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 hover:bg-indigo-100' },
    { label: 'Manage Subjects', icon: <BookOpen size={18} />, to: '/admin/subjects', colour: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 hover:bg-teal-100' },
    { label: 'Upload Data', icon: <Upload size={18} />, to: '/admin/data', colour: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 hover:bg-orange-100' },
    { label: 'Send Notification', icon: <Bell size={18} />, to: '/admin/notifications', colour: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 hover:bg-yellow-100' },
    { label: 'Student Monitor', icon: <Activity size={18} />, to: '/admin/dashboard', colour: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Overview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time platform stats and recent activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={card.action}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-left hover:shadow-md transition group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 ${card.colour}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${a.colour}`}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
          <div className="space-y-3">
            {(stats?.recent_users ?? []).map((u, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0 ${ROLE_COLOUR[u.role] ?? ''}`}>{u.role}</span>
              </div>
            ))}
            {(stats?.recent_users ?? []).length === 0 && (
              <p className="text-sm text-gray-400">No users yet</p>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" /> Recent Activity
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {audit.map(log => (
              <div key={log.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold text-xs ${ACTION_COLOUR[log.action] ?? 'text-gray-600 dark:text-gray-400'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{log.details}</p>
                <p className="text-gray-400 text-xs">by {log.admin_name}</p>
              </div>
            ))}
            {audit.length === 0 && <p className="text-sm text-gray-400">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
