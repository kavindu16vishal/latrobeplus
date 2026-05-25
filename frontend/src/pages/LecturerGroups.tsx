import { useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, Plus, Trash2, X, Search, Send, AlertTriangle, CheckCircle,
  Clock, UserMinus, FileText, Zap, Edit2, ChevronRight, BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Group {
  id: number;
  name: string;
  description: string | null;
  color: string;
  member_count: number;
  avg_wam: number | null;
  created_at: string;
}

interface Member {
  student_db_id: number;
  student_id: string;
  full_name: string;
  email: string;
  wam: number | null;
  status: 'On Track' | 'Attention Needed' | 'At Risk' | 'No Results';
  weakest_subject: string | null;
  weakest_score: number | null;
  notes: string | null;
  added_at: string;
}

interface StudentOption {
  db_id: number;
  id: string;
  name: string;
  email: string;
  wam: number;
  status: string;
}

interface Analytics {
  member_count: number;
  avg_wam: number | null;
  at_risk: number;
  attention: number;
  on_track: number;
  grade_distribution: { grade: string; count: number }[];
}

const GROUP_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#a855f7', '#ec4899', '#14b8a6',
];

const STATUS_BADGE: Record<string, string> = {
  'On Track':         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Attention Needed': 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300',
  'At Risk':          'bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-300',
  'No Results':       'bg-gray-100  text-gray-500  dark:bg-gray-800     dark:text-gray-400',
};

const STATUS_ICON: Record<string, ReactNode> = {
  'On Track':         <CheckCircle size={11} className="mr-1" />,
  'Attention Needed': <Clock size={11} className="mr-1" />,
  'At Risk':          <AlertTriangle size={11} className="mr-1" />,
  'No Results':       <Users size={11} className="mr-1" />,
};

const GRADE_COLORS: Record<string, string> = {
  HD: '#22c55e', D: '#3b82f6', C: '#f59e0b', P: '#f97316', Fail: '#ef4444',
};

export default function LecturerGroups() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [groups, setGroups]               = useState<Group[]>([]);
  const [selected, setSelected]           = useState<Group | null>(null);
  const [members, setMembers]             = useState<Member[]>([]);
  const [analytics, setAnalytics]         = useState<Analytics | null>(null);
  const [allStudents, setAllStudents]     = useState<StudentOption[]>([]);
  const [loading, setLoading]             = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch]   = useState('');
  const [toast, setToast]                 = useState('');

  // Create / Edit
  const [showCreate, setShowCreate]       = useState(false);
  const [showEdit, setShowEdit]           = useState(false);
  const [createForm, setCreateForm]       = useState({ name: '', description: '', color: '#6366f1' });
  const [editForm, setEditForm]           = useState({ name: '', description: '', color: '#6366f1' });
  const [saving, setSaving]               = useState(false);

  // Add students modal
  const [showAdd, setShowAdd]             = useState(false);
  const [addSearch, setAddSearch]         = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [addSaving, setAddSaving]         = useState(false);

  // Notify modal
  const [showNotify, setShowNotify]       = useState(false);
  const [notifyForm, setNotifyForm]       = useState({ title: '', body: '' });
  const [notifySending, setNotifySending] = useState(false);

  // Report sending
  const [reportSending, setReportSending] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get('http://localhost:5000/api/lecturer/groups', { headers });
      setGroups(r.data);
      // Re-select updated group if one was selected
      if (selected) {
        const updated = r.data.find((g: Group) => g.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch { showToast('Failed to load groups'); }
    finally { setLoading(false); }
  }, [token, selected?.id]);

  const loadMembers = useCallback(async (groupId: number) => {
    setMembersLoading(true);
    setMembers([]);
    setAnalytics(null);
    try {
      const [mRes, aRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/lecturer/groups/${groupId}/members`, { headers }),
        axios.get(`http://localhost:5000/api/lecturer/groups/${groupId}/analytics`, { headers }),
      ]);
      setMembers(mRes.data);
      setAnalytics(aRes.data);
    } catch { showToast('Failed to load members'); }
    finally { setMembersLoading(false); }
  }, [token]);

  useEffect(() => { loadGroups(); }, [token]);
  useEffect(() => {
    if (selected) loadMembers(selected.id);
  }, [selected?.id]);

  // Load all students for the "Add" modal (lazy)
  const loadAllStudents = async () => {
    if (allStudents.length > 0) return;
    try {
      const r = await axios.get('http://localhost:5000/api/admin/students', { headers });
      setAllStudents(r.data);
    } catch { showToast('Failed to load student list'); }
  };

  const createGroup = async () => {
    if (!createForm.name.trim()) return;
    setSaving(true);
    try {
      await axios.post('http://localhost:5000/api/lecturer/groups', createForm, { headers });
      setShowCreate(false);
      setCreateForm({ name: '', description: '', color: '#6366f1' });
      await loadGroups();
      showToast('Group created');
    } catch { showToast('Failed to create group'); }
    finally { setSaving(false); }
  };

  const updateGroup = async () => {
    if (!selected || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/lecturer/groups/${selected.id}`, editForm, { headers });
      setShowEdit(false);
      await loadGroups();
      showToast('Group updated');
    } catch { showToast('Failed to update group'); }
    finally { setSaving(false); }
  };

  const deleteGroup = async (group: Group) => {
    if (!confirm(`Delete group "${group.name}" and remove all members?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/lecturer/groups/${group.id}`, { headers });
      if (selected?.id === group.id) setSelected(null);
      await loadGroups();
      showToast('Group deleted');
    } catch { showToast('Failed to delete group'); }
  };

  const removeMember = async (member: Member) => {
    if (!selected) return;
    if (!confirm(`Remove ${member.full_name} from this group?`)) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/lecturer/groups/${selected.id}/members/${member.student_db_id}`,
        { headers }
      );
      await Promise.all([loadGroups(), loadMembers(selected.id)]);
      showToast(`${member.full_name} removed from group`);
    } catch { showToast('Failed to remove member'); }
  };

  const addStudents = async () => {
    if (!selected || selectedStudents.length === 0) return;
    setAddSaving(true);
    try {
      const r = await axios.post(
        `http://localhost:5000/api/lecturer/groups/${selected.id}/members`,
        { student_db_ids: selectedStudents },
        { headers }
      );
      setShowAdd(false);
      setSelectedStudents([]);
      setAddSearch('');
      await Promise.all([loadGroups(), loadMembers(selected.id)]);
      showToast(r.data.message);
    } catch { showToast('Failed to add students'); }
    finally { setAddSaving(false); }
  };

  const autoFill = async () => {
    if (!selected) return;
    if (!confirm('Add all students with WAM below 65% to this group?')) return;
    try {
      const r = await axios.post(
        `http://localhost:5000/api/lecturer/groups/${selected.id}/auto-fill`,
        { threshold: 65 },
        { headers }
      );
      await Promise.all([loadGroups(), loadMembers(selected.id)]);
      showToast(r.data.message);
    } catch { showToast('Failed to auto-fill group'); }
  };

  const notifyAll = async () => {
    if (!selected || !notifyForm.title || !notifyForm.body) return;
    setNotifySending(true);
    try {
      const r = await axios.post(
        `http://localhost:5000/api/lecturer/groups/${selected.id}/notify`,
        notifyForm,
        { headers }
      );
      setShowNotify(false);
      setNotifyForm({ title: '', body: '' });
      showToast(r.data.message);
    } catch { showToast('Failed to send notifications'); }
    finally { setNotifySending(false); }
  };

  const sendReports = async () => {
    if (!selected) return;
    if (!confirm(`Send AI-generated individual progress reports to all ${selected.member_count} members?`)) return;
    setReportSending(true);
    try {
      const r = await axios.post(
        `http://localhost:5000/api/lecturer/groups/${selected.id}/progress-report`,
        {},
        { headers }
      );
      showToast(r.data.message);
    } catch { showToast('Failed to send reports'); }
    finally { setReportSending(false); }
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(m =>
      m.full_name.toLowerCase().includes(q) ||
      m.student_id.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const addableStudents = useMemo(() => {
    const inGroup = new Set(members.map(m => m.student_db_id));
    let list = allStudents.filter(s => !inGroup.has(s.db_id));
    if (addSearch.trim()) {
      const q = addSearch.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allStudents, members, addSearch]);

  const toggleStudent = (dbId: number) => {
    setSelectedStudents(prev =>
      prev.includes(dbId) ? prev.filter(id => id !== dbId) : [...prev, dbId]
    );
  };

  const wamColor = (w: number | null) => {
    if (w === null) return 'text-gray-400';
    return w >= 70 ? 'text-green-600' : w >= 50 ? 'text-amber-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2"
          >
            <CheckCircle size={15} className="text-green-400 flex-shrink-0" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={22} /> Student Groups
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create monitoring groups, track at-risk students, and send personalised progress reports
          </p>
        </div>
        <button
          onClick={() => { setCreateForm({ name: '', description: '', color: '#6366f1' }); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition"
        >
          <Plus size={16} /> Create Group
        </button>
      </div>

      {/* Body: two-column */}
      <div className="flex gap-5 items-start">

        {/* ── Left: Group list ─────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {loading ? (
            <div className="flex justify-center pt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No groups yet.</p>
              <p className="text-xs mt-1">Create one to start monitoring students.</p>
            </div>
          ) : (
            groups.map(g => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelected(g)}
                className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 cursor-pointer transition-all ${
                  selected?.id === g.id
                    ? 'border-indigo-400 dark:border-indigo-600 shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{g.name}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteGroup(g); }}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {g.description && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{g.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {g.member_count} student{g.member_count !== 1 ? 's' : ''}
                  </span>
                  {g.avg_wam != null ? (
                    <span className={`text-xs font-bold ${wamColor(Number(g.avg_wam))}`}>
                      {Number(g.avg_wam).toFixed(1)}% avg
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">No results</span>
                  )}
                </div>
                {selected?.id === g.id && (
                  <ChevronRight size={12} className="text-indigo-400 mt-1 ml-auto" />
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* ── Right: Group detail ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center text-gray-400">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a group to view its members and analytics</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Group header */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: selected.color }} />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                      {selected.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selected.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => { setEditForm({ name: selected.name, description: selected.description || '', color: selected.color }); setShowEdit(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={autoFill}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 transition"
                    >
                      <Zap size={12} /> Auto-add At-Risk
                    </button>
                    <button
                      onClick={() => { setNotifyForm({ title: '', body: '' }); setShowNotify(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 transition"
                    >
                      <Send size={12} /> Notify All
                    </button>
                    <button
                      onClick={sendReports}
                      disabled={reportSending || selected.member_count === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 transition disabled:opacity-40"
                    >
                      <FileText size={12} />
                      {reportSending ? 'Sending…' : 'Progress Reports'}
                    </button>
                  </div>
                </div>

                {/* Analytics row */}
                {analytics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Avg WAM', value: analytics.avg_wam != null ? `${Number(analytics.avg_wam).toFixed(1)}%` : '—', color: 'text-gray-900 dark:text-white' },
                      { label: 'At Risk', value: analytics.at_risk ?? 0, color: 'text-red-600' },
                      { label: 'Attention', value: analytics.attention ?? 0, color: 'text-amber-600' },
                      { label: 'On Track', value: analytics.on_track ?? 0, color: 'text-green-600' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-center">
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grade distribution mini-chart */}
                {analytics?.grade_distribution && analytics.grade_distribution.length > 0 && (
                  <div className="flex items-center gap-4 mt-4">
                    <div className="h-28 w-28 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.grade_distribution} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={48} innerRadius={28}>
                            {analytics.grade_distribution.map((entry) => (
                              <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade] || '#9ca3af'} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: unknown) => [`${v} students`]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {analytics.grade_distribution.map(g => (
                        <div key={g.grade} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[g.grade] || '#9ca3af' }} />
                          <span className="text-gray-600 dark:text-gray-400">{g.grade}</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{g.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Members table */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Members <span className="text-gray-400 font-normal text-sm">({selected.member_count})</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        placeholder="Search members…"
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                      />
                    </div>
                    <button
                      onClick={() => { loadAllStudents(); setAddSearch(''); setSelectedStudents([]); setShowAdd(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition font-medium"
                    >
                      <Plus size={14} /> Add Students
                    </button>
                  </div>
                </div>

                {membersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No members yet.</p>
                    <p className="text-xs mt-1">Use "Add Students" or "Auto-add At-Risk" to populate this group.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-3">Student</div>
                      <div className="col-span-2">ID</div>
                      <div className="col-span-1">WAM</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Weakest Subject</div>
                      <div className="col-span-1">Added</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {filteredMembers.map((m, i) => (
                        <motion.div
                          key={m.student_db_id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition"
                        >
                          <div className="col-span-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{m.student_id}</span>
                          </div>
                          <div className="col-span-1">
                            <span className={`text-sm font-bold ${wamColor(m.wam)}`}>
                              {m.wam != null ? `${m.wam}%` : '—'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[m.status]}`}>
                              {STATUS_ICON[m.status]}{m.status}
                            </span>
                          </div>
                          <div className="col-span-2">
                            {m.weakest_subject ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {m.weakest_subject}
                                {m.weakest_score != null && (
                                  <span className="text-red-500 ml-1">({m.weakest_score}%)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                          <div className="col-span-1">
                            <span className="text-xs text-gray-400">
                              {new Date(m.added_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => removeMember(m)}
                              title="Remove from group"
                              className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-400">
                        {filteredMembers.length} of {members.length} members shown
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Group Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus size={16} className="text-indigo-500" /> Create Group
                </h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group Name *</label>
                  <input
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. At-Risk Support Group"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Optional description…"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group Colour</label>
                  <div className="flex gap-2 mt-2">
                    {GROUP_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setCreateForm(f => ({ ...f, color: c }))}
                        className={`w-7 h-7 rounded-full transition ${createForm.color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={createGroup} disabled={saving || !createForm.name.trim()} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Group Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showEdit && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={16} className="text-indigo-500" /> Edit Group
                </h3>
                <button onClick={() => setShowEdit(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group Name</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group Colour</label>
                  <div className="flex gap-2 mt-2">
                    {GROUP_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setEditForm(f => ({ ...f, color: c }))}
                        className={`w-7 h-7 rounded-full transition ${editForm.color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button onClick={updateGroup} disabled={saving || !editForm.name.trim()} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Students Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <h3 className="font-bold text-gray-900 dark:text-white">Add Students to Group</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pt-4 flex-shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                    placeholder="Search by name, ID, or email…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {selectedStudents.length > 0 && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1 mt-2">
                {addableStudents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {allStudents.length === 0 ? 'Loading students…' : 'All students are already in this group'}
                  </p>
                ) : (
                  addableStudents.map(s => {
                    const checked = selectedStudents.includes(s.db_id);
                    return (
                      <button
                        key={s.db_id}
                        onClick={() => toggleStudent(s.db_id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${
                          checked
                            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${checked ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white fill-current"><path d="M9 1L4 7 1 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 truncate">{s.id} · {s.email}</p>
                        </div>
                        <span className={`text-xs font-bold flex-shrink-0 ${wamColor(s.wam)}`}>
                          {s.wam.toFixed(1)}%
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[s.status] || ''}`}>
                          {s.status}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button
                  onClick={addStudents}
                  disabled={addSaving || selectedStudents.length === 0}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                >
                  {addSaving ? 'Adding…' : `Add ${selectedStudents.length > 0 ? `(${selectedStudents.length})` : 'Selected'}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Notify All Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotify && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Send size={16} className="text-indigo-500" /> Notify Group: {selected.name}
                </h3>
                <button onClick={() => setShowNotify(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This message will be sent to all <strong className="text-gray-800 dark:text-white">{selected.member_count}</strong> members of this group.
                </p>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</label>
                  <input
                    value={notifyForm.title}
                    onChange={e => setNotifyForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Important study update"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</label>
                  <textarea
                    value={notifyForm.body}
                    onChange={e => setNotifyForm(f => ({ ...f, body: e.target.value }))}
                    rows={4}
                    placeholder="Write your message here…"
                    className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setShowNotify(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Cancel</button>
                <button
                  onClick={notifyAll}
                  disabled={notifySending || !notifyForm.title || !notifyForm.body}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
                >
                  {notifySending ? 'Sending…' : <><Send size={14} /> Send to All</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
