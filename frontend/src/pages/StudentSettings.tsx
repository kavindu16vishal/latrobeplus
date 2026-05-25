import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Hash, Camera, Save, Check, Eye, EyeOff,
  Shield, Bell, Target, Lock, AlertCircle, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type Tab = 'profile' | 'goals' | 'security' | 'notifications';

interface ProfileData {
  full_name: string;
  avatar: string | null;
  bio: string;
  target_wam: number;
  study_goal_hours: number;
  preferred_study_time: string;
  notify_email: boolean;
  notify_inapp: boolean;
}

const STUDY_TIMES = [
  { value: 'morning',   label: 'Morning',   icon: '🌅', desc: '6am – 12pm' },
  { value: 'afternoon', label: 'Afternoon',  icon: '☀️',  desc: '12pm – 5pm' },
  { value: 'evening',   label: 'Evening',    icon: '🌇', desc: '5pm – 9pm' },
  { value: 'night',     label: 'Night Owl',  icon: '🌙', desc: '9pm – late' },
];

const resizeImage = (file: File): Promise<string> =>
  new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, 200, 200);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = url;
  });

const StudentSettings: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  const [profile, setProfile] = useState<ProfileData>({
    full_name: user?.full_name || '',
    avatar: null,
    bio: '',
    target_wam: 70,
    study_goal_hours: 20,
    preferred_study_time: 'morning',
    notify_email: true,
    notify_inapp: true,
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  // Security
  const [pw, setPw]         = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    axios.get('http://localhost:5000/api/student/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const d = r.data;
        setProfile({
          full_name:             d.full_name             || '',
          avatar:                d.avatar                || null,
          bio:                   d.bio                   || '',
          target_wam:            d.target_wam            ?? 70,
          study_goal_hours:      d.study_goal_hours      ?? 20,
          preferred_study_time:  d.preferred_study_time  || 'morning',
          notify_email:          d.notify_email          !== 0,
          notify_inapp:          d.notify_inapp          !== 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setProfile(p => ({ ...p, avatar: base64 }));
    e.target.value = '';
  };

  const saveProfile = async () => {
    if (!profile.full_name.trim()) { setError('Name cannot be empty'); return; }
    setSaving(true); setError('');
    try {
      await axios.put('http://localhost:5000/api/student/profile', profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateUser({ full_name: profile.full_name, avatar: profile.avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (!pw.current)          { setPwError('Enter your current password'); return; }
    if (pw.next.length < 8)   { setPwError('New password must be at least 8 characters'); return; }
    if (pw.next !== pw.confirm){ setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await axios.post(
        'http://localhost:5000/api/student/change-password',
        { current_password: pw.current, new_password: pw.next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwSuccess(true);
      setPw({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPwError(msg || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const pwStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength      = pwStrength(pw.next);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][strength];

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',       label: 'Profile',         icon: <User size={16} /> },
    { id: 'goals',         label: 'Academic Goals',  icon: <Target size={16} /> },
    { id: 'security',      label: 'Security',        icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications',   icon: <Bell size={16} /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const SaveBtn = ({ label = 'Save' }: { label?: string }) => (
    <button
      onClick={saveProfile}
      disabled={saving}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
        saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving…' : <><Save size={16} /> {label}</>}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your profile, goals, and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(''); setPwError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >

          {/* ── Profile ── */}
          {tab === 'profile' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">

              {/* Avatar upload */}
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center ring-4 ring-blue-50 dark:ring-blue-900/20">
                    {profile.avatar
                      ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      : <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{initials || '?'}</span>
                    }
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-700 transition"
                  >
                    <Camera size={14} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{profile.full_name || 'Your Name'}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Change photo
                    </button>
                    {profile.avatar && (
                      <button onClick={() => setProfile(p => ({ ...p, avatar: null }))} className="text-xs text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Your full name"
                />
              </div>

              {/* Email — read only */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Mail size={14} className="text-gray-400" /> Email Address
                  </label>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Cannot be changed</span>
                </div>
                <div className="flex items-center w-full px-4 py-2.5 bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400">
                  <Lock size={13} className="mr-2 text-gray-400 flex-shrink-0" />
                  {user?.email}
                </div>
              </div>

              {/* Student ID — read only */}
              {user?.student_id && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Hash size={14} className="text-gray-400" /> Student ID
                    </label>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Cannot be changed</span>
                  </div>
                  <div className="flex items-center w-full px-4 py-2.5 bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 font-mono">
                    <Lock size={13} className="mr-2 text-gray-400 flex-shrink-0" />
                    {user.student_id}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Bio <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="A short bio about yourself…"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{profile.bio.length}/200</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="flex justify-end">
                <SaveBtn label="Save Profile" />
              </div>
            </div>
          )}

          {/* ── Academic Goals ── */}
          {tab === 'goals' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 space-y-8">

              {/* Target WAM */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target WAM</label>
                  <span className={`text-2xl font-bold ${profile.target_wam >= 70 ? 'text-green-600' : profile.target_wam >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
                    {profile.target_wam}%
                  </span>
                </div>
                <input
                  type="range" min={40} max={100} step={1}
                  value={profile.target_wam}
                  onChange={e => setProfile(p => ({ ...p, target_wam: Number(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>40%</span><span>Pass (50%)</span><span>Credit (65%)</span><span>Dist. (75%)</span><span>100%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {profile.target_wam >= 80 ? '🏆 High Distinction — ambitious goal!' :
                   profile.target_wam >= 75 ? '⭐ Distinction — great aspiration' :
                   profile.target_wam >= 65 ? '✅ Credit — solid target' :
                   profile.target_wam >= 50 ? '📚 Pass — focus on passing all subjects' :
                   '📌 Set a higher goal to push yourself'}
                </p>
              </div>

              {/* Weekly study hours */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Weekly Study Hours Goal</label>
                  <span className="text-2xl font-bold text-blue-600">{profile.study_goal_hours}h</span>
                </div>
                <input
                  type="range" min={5} max={60} step={1}
                  value={profile.study_goal_hours}
                  onChange={e => setProfile(p => ({ ...p, study_goal_hours: Number(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>5h</span><span>15h</span><span>30h</span><span>45h</span><span>60h</span>
                </div>
              </div>

              {/* Preferred study time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preferred Study Time</label>
                <div className="grid grid-cols-2 gap-3">
                  {STUDY_TIMES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setProfile(p => ({ ...p, preferred_study_time: t.value }))}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition text-left ${
                        profile.preferred_study_time === t.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${profile.preferred_study_time === t.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</p>
                        <p className="text-xs text-gray-400">{t.desc}</p>
                      </div>
                      {profile.preferred_study_time === t.value && <Check size={16} className="text-blue-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <SaveBtn label="Save Goals" />
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {tab === 'security' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Change Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose a strong password to keep your account secure.</p>
              </div>

              {(['current', 'next', 'confirm'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw[field] ? 'text' : 'password'}
                      value={pw[field]}
                      onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder={
                        field === 'current' ? 'Your current password' :
                        field === 'next' ? 'At least 8 characters' :
                        'Repeat new password'
                      }
                    />
                    <button
                      onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                      {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Strength bar */}
              {pw.next && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {strengthLabel} — {['', 'Add uppercase, numbers or symbols to strengthen', 'Add a number or symbol', 'Almost there!', 'Great password!'][strength]}
                  </p>
                </div>
              )}

              {/* Requirements checklist */}
              <div className="space-y-2">
                {[
                  { label: 'At least 8 characters', ok: pw.next.length >= 8 },
                  { label: 'Contains a number',     ok: /[0-9]/.test(pw.next) },
                  { label: 'Contains uppercase letter', ok: /[A-Z]/.test(pw.next) },
                  { label: 'Passwords match',       ok: pw.next.length > 0 && pw.next === pw.confirm },
                ].map(req => (
                  <div key={req.label} className="flex items-center gap-2 text-xs">
                    {req.ok
                      ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                    }
                    <span className={req.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>{req.label}</span>
                  </div>
                ))}
              </div>

              {pwError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                  <AlertCircle size={16} /> {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl">
                  <CheckCircle size={16} /> Password changed successfully!
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={changePassword}
                  disabled={pwSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
                >
                  <Shield size={16} />
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === 'notifications' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Notification Preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose how you'd like to be notified about updates and alerts.</p>
              </div>

              {[
                {
                  key: 'notify_email' as const,
                  label: 'Email Notifications',
                  desc: 'Receive important updates, grade alerts, and messages via email',
                  icon: <Mail size={20} className="text-blue-500" />,
                },
                {
                  key: 'notify_inapp' as const,
                  label: 'In-App Notifications',
                  desc: 'See notifications and alerts inside the Learning Journey Assistant',
                  icon: <Bell size={20} className="text-purple-500" />,
                },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setProfile(p => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                      profile[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      profile[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}

              <div className="flex justify-end">
                <SaveBtn label="Save Preferences" />
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StudentSettings;
