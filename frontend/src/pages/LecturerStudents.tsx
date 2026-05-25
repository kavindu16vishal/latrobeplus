import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, AlertTriangle, CheckCircle, Clock, ChevronRight, Loader2, ArrowUpDown, UserPlus, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import StudentSlideOver from '../components/StudentSlideOver';

interface StudentRow {
  db_id: number;
  id: string;
  name: string;
  email: string;
  wam: number;
  status: 'On Track' | 'Attention Needed' | 'At Risk';
}

interface Group {
  id: number;
  name: string;
  color: string;
}

type FilterStatus = 'All' | 'At Risk' | 'Attention Needed' | 'On Track';
type SortKey = 'name' | 'id' | 'wam' | 'status';

const STATUS_BADGE: Record<string, string> = {
  'On Track':         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Attention Needed': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'At Risk':          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  'On Track':         <CheckCircle size={13} className="mr-1" />,
  'Attention Needed': <Clock size={13} className="mr-1" />,
  'At Risk':          <AlertTriangle size={13} className="mr-1" />,
};

const FILTER_TABS: FilterStatus[] = ['All', 'At Risk', 'Attention Needed', 'On Track'];

const LecturerStudents: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(() => {
    const param = searchParams.get('status');
    if (param === 'At Risk' || param === 'Attention Needed' || param === 'On Track') return param;
    return 'All';
  });
  const [sortKey, setSortKey] = useState<SortKey>('wam');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync filterStatus when URL query param changes (e.g. sidebar Quick Filters)
  useEffect(() => {
    const param = searchParams.get('status');
    if (param === 'At Risk' || param === 'Attention Needed' || param === 'On Track') setFilterStatus(param);
    else setFilterStatus('All');
  }, [searchParams]);

  // Group assignment
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupPopover, setGroupPopover] = useState<number | null>(null); // student db_id
  const [addedToGroup, setAddedToGroup] = useState<number | null>(null); // flash success
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('http://localhost:5000/api/admin/students', { headers }),
      axios.get('http://localhost:5000/api/lecturer/groups', { headers }),
    ])
      .then(([studRes, grpRes]) => {
        setStudents(studRes.data);
        setGroups(grpRes.data);
      })
      .catch(() => setError('Could not load student list. Make sure the server is running.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setGroupPopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addToGroup = async (groupId: number, studentDbId: number) => {
    try {
      await axios.post(
        `http://localhost:5000/api/lecturer/groups/${groupId}/members`,
        { student_db_ids: [studentDbId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroupPopover(null);
      setAddedToGroup(studentDbId);
      setTimeout(() => setAddedToGroup(null), 2500);
    } catch { /* silent */ }
  };

  const counts = useMemo(() => ({
    all: students.length,
    atRisk: students.filter(s => s.status === 'At Risk').length,
    attention: students.filter(s => s.status === 'Attention Needed').length,
    onTrack: students.filter(s => s.status === 'On Track').length,
  }), [students]);

  const filtered = useMemo(() => {
    let list = students;

    if (filterStatus !== 'All') {
      list = list.filter(s => s.status === filterStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortKey === 'wam') cmp = a.wam - b.wam;
      else if (sortKey === 'status') {
        const order = { 'At Risk': 0, 'Attention Needed': 1, 'On Track': 2 };
        cmp = (order[a.status] ?? 3) - (order[b.status] ?? 3);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [students, filterStatus, search, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortBtn: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
    >
      {label}
      <ArrowUpDown size={11} className={sortKey === k ? 'text-blue-500' : 'text-gray-300'} />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Slide-over + backdrop */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedId(null)}
            />
            <StudentSlideOver
              studentId={selectedId}
              token={token!}
              onClose={() => setSelectedId(null)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Students</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{counts.all} students enrolled — click any row to view full profile</p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, colour: 'text-gray-700 dark:text-white', bg: 'bg-white dark:bg-gray-900', icon: <Users size={18} className="text-blue-500" /> },
          { label: 'At Risk', value: counts.atRisk, colour: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: <AlertTriangle size={18} className="text-red-500" /> },
          { label: 'Attention Needed', value: counts.attention, colour: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: <Clock size={18} className="text-orange-500" /> },
          { label: 'On Track', value: counts.onTrack, colour: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: <CheckCircle size={18} className="text-green-500" /> },
        ].map(chip => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`${chip.bg} p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3`}
          >
            {chip.icon}
            <div>
              <p className={`text-2xl font-bold ${chip.colour}`}>{chip.value}</p>
              <p className="text-xs text-gray-400">{chip.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, student ID, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className="ml-1.5 opacity-70">
                  ({tab === 'At Risk' ? counts.atRisk : tab === 'Attention Needed' ? counts.attention : counts.onTrack})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <div className="col-span-1 text-xs font-semibold text-gray-400">#</div>
          <div className="col-span-3"><SortBtn k="name" label="Name" /></div>
          <div className="col-span-2"><SortBtn k="id" label="Student ID" /></div>
          <div className="col-span-2"><SortBtn k="wam" label="WAM" /></div>
          <div className="col-span-2"><SortBtn k="status" label="Status" /></div>
          <div className="col-span-1 text-xs font-semibold text-gray-400">Group</div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No students match your search.</div>
          ) : (
            filtered.map((s, i) => (
              <div
                key={s.id}
                className="w-full grid grid-cols-12 gap-4 px-5 py-3.5 text-left hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors items-center"
              >
                <div className="col-span-1 text-xs text-gray-400">{i + 1}</div>
                <motion.button
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  onClick={() => setSelectedId(s.id)}
                  className="col-span-3 flex items-center text-left"
                >
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                </motion.button>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{s.id}</span>
                </div>
                <div className="col-span-2">
                  <span className={`text-sm font-bold ${s.wam >= 70 ? 'text-green-600' : s.wam >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
                    {s.wam.toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[s.status] || ''}`}>
                    {STATUS_ICON[s.status]}{s.status}
                  </span>
                </div>

                {/* Add to Group */}
                <div className="col-span-1 relative" ref={groupPopover === s.db_id ? popoverRef : null}>
                  {addedToGroup === s.db_id ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 size={12} /> Added
                    </span>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setGroupPopover(groupPopover === s.db_id ? null : s.db_id); }}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition"
                      title="Add to group"
                    >
                      <UserPlus size={12} />
                    </button>
                  )}
                  <AnimatePresence>
                    {groupPopover === s.db_id && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 top-8 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-44 py-1"
                      >
                        <p className="text-xs text-gray-400 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">Add to group</p>
                        {groups.length === 0 ? (
                          <p className="text-xs text-gray-400 px-3 py-2">No groups yet</p>
                        ) : (
                          groups.map(g => (
                            <button
                              key={g.id}
                              onClick={() => addToGroup(g.id, s.db_id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                            >
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                              {g.name}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <button onClick={() => setSelectedId(s.id)}>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {students.length} students
          </p>
        </div>
      </div>
    </div>
  );
};

export default LecturerStudents;
