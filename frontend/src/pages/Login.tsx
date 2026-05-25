import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const DEMO_ACCOUNTS = [
  { role: 'Student',  email: 'student@latrobe.edu',  password: 'Student123',  colour: 'blue' },
  { role: 'Lecturer', email: 'lecturer@latrobe.edu', password: 'Lecturer123', colour: 'indigo' },
  { role: 'Admin',    email: 'admin@latrobe.edu',    password: 'Admin123',    colour: 'purple' },
];

const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const doLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePassword?: string) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email:    overrideEmail    ?? email,
        password: overridePassword ?? password,
      });
      login(response.data.token, response.data.user);
      const role = response.data.user.role;
      navigate(role === 'student' ? '/student/dashboard' : role === 'lecturer' ? '/lecturer/dashboard' : '/admin/system');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    doLogin(undefined, acc.email, acc.password);
  };

  const colourMap: Record<string, string> = {
    blue:   'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    indigo: 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  };

  return (
    <div className="login-bg min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.png" alt="La Trobe+" className="h-24 w-auto" />
        </div>
        <p className="mt-1 text-center text-sm text-white">
          La Trobe University · Personalised Learning Platform
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-2xl border border-gray-100 dark:border-gray-700">

          <form className="space-y-5" onSubmit={doLogin}>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@latrobe.edu"
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <motion.button
              type="submit" disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 shadow text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign in'}
            </motion.button>
          </form>

          {/* Demo Accounts — click to instantly log in */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-gray-800 text-gray-400 font-medium">Quick Demo Login</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <motion.button
                  key={acc.role}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => quickLogin(acc)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer disabled:opacity-50 ${colourMap[acc.colour]}`}
                >
                  <span className="block text-xs font-bold mb-0.5">{acc.role}</span>
                  <span className="block text-xs opacity-70 truncate">{acc.email.split('@')[0]}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Click any card to log in instantly</p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;
