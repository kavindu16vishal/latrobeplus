import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus, Search, Pencil, Trash2, KeyRound, X, Check, ChevronDown, Shield, GraduationCap, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  student_id: string | null;
  created_at: string;
}

const ROLE_COLOUR: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  lecturer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};
const ROLE_ICON: Record<string, React.ReactNode> = {
  student: <GraduationCap size={14} />,
  lecturer: <Users size={14} />,
  admin: <Shield size={14} />,
};

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'student', student_id: '' };

type ModalMode = 'create' | 'edit' | 'reset' | null;

export default function UserManagement() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? 'all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const res = await axios.get('http://localhost:5000/api/admin/users', { headers, params });
      setUsers(res.data);
    } catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  }, [token, roleFilter, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setError(''); setModal('create'); };
  const openEdit = (u: User) => {
    setEditTarget(u);
    setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, student_id: u.student_id ?? '' });
    setError('');
    setModal('edit');
  };
  const openReset = (u: User) => { setEditTarget(u); setNewPassword(''); setError(''); setModal('reset'); };
  const closeModal = () => { setModal(null); setEditTarget(null); setError(''); };

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) { setError('Name, email, and password are required'); return; }
    setSaving(true); setError('');
    try {
      await axios.post('http://localhost:5000/api/admin/users', {
        full_name: form.full_name, email: form.email, password: form.password,
        role: form.role, student_id: form.role === 'student' ? form.student_id || undefined : undefined
      }, { headers });
      setSuccess('User created successfully'); closeModal(); loadUsers();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true); setError('');
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${editTarget.id}`, {
        full_name: form.full_name || undefined,
        email: form.email || undefined,
        role: form.role || undefined,
        student_id: form.role === 'student' ? form.student_id || undefined : undefined,
      }, { headers });
      setSuccess('User updated'); closeModal(); loadUsers();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to update user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${deleteTarget.id}`, { headers });
      setSuccess('User deleted'); setDeleteTarget(null); loadUsers();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to delete user'); setDeleteTarget(null); }
  };

  const handleReset = async () => {
    if (!editTarget || !newPassword) { setError('Enter a new password'); return; }
    setSaving(true); setError('');
    try {
      await axios.post(`http://localhost:5000/api/admin/users/${editTarget.id}/reset-password`, { new_password: newPassword }, { headers });
      setSuccess('Password reset successfully'); closeModal();
    } catch (e: any) { setError(e.response?.data?.error ?? 'Failed to reset password'); }
    finally { setSaving(false); }
  };

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create, edit, and manage all user accounts</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm">
            <Check size={16} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or student ID…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Lecturers</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{u.full_name}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${ROLE_COLOUR[u.role] ?? ''}`}>
                        {ROLE_ICON[u.role]} {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{u.student_id ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => openReset(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition" title="Reset Password">
                          <KeyRound size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">{modal === 'create' ? 'Create New User' : 'Edit User'}</h3>
                <button onClick={closeModal} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">{error}</p>}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {modal === 'create' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {form.role === 'student' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                      placeholder="e.g. 19004321"
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={modal === 'create' ? handleCreate : handleEdit} disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Saving…' : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {modal === 'reset' && editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">Reset Password</h3>
                <button onClick={closeModal} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Set a new password for <strong className="text-gray-900 dark:text-white">{editTarget.full_name}</strong></p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleReset} disabled={saving}
                  className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete User?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete <strong className="text-gray-900 dark:text-white">{deleteTarget.full_name}</strong> and all their data. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
