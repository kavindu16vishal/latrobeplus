import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, RotateCcw, Sparkles, BookOpen, FlaskConical, FileQuestion, GraduationCap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StudentContext {
  wam: number | null;
  status: string;
  subjects: { subject: string; score: number }[];
}

const PROMPT_CATEGORIES = [
  {
    icon: <BookOpen size={16} />,
    label: 'Explain a Concept',
    colour: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    prompts: [
      'Explain object-oriented programming to me',
      'What is time complexity and Big-O notation?',
      'How does TCP/IP work?',
      'What is database normalisation?',
    ],
  },
  {
    icon: <FlaskConical size={16} />,
    label: 'Study Help',
    colour: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    prompts: [
      'Create a study plan for my weakest subject',
      'What study techniques work best for programming?',
      'Help me understand my recent assessment feedback',
      'How should I prioritise my revision?',
    ],
  },
  {
    icon: <FileQuestion size={16} />,
    label: 'Practice Questions',
    colour: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    prompts: [
      'Give me 5 practice questions on algorithms',
      'Quiz me on SQL joins',
      'Test my knowledge of OOP concepts',
      'Give me a practice problem on sorting algorithms',
    ],
  },
  {
    icon: <GraduationCap size={16} />,
    label: 'Exam Prep',
    colour: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    prompts: [
      'What topics should I focus on for my exam?',
      'Give me a mock exam scenario',
      'How do I manage exam stress?',
      'What are common mistakes students make in IT exams?',
    ],
  },
];

const AITutor: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI Learning Tutor. I have access to your academic profile and can help you understand course material, work through practice problems, build study plans, or prepare for exams. What would you like to work on today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<StudentContext | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      const d = r.data;
      setContext({
        wam: d.wam != null ? Number(d.wam) : null,
        status: d.status || 'No Data',
        subjects: (d.subjectScores || []).map((s: any) => ({ subject: s.subject, score: Number(s.score) })),
      });
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = messages.slice(1);
      const response = await axios.post(
        'http://localhost:5000/api/chat',
        { message: text.trim(), history },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...newMessages, { role: 'assistant', content: response.data.reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handlePrompt = (prompt: string) => {
    setActiveCategory(null);
    sendMessage(prompt);
    inputRef.current?.focus();
  };

  const handleNewSession = () => {
    setMessages([
      { role: 'assistant', content: "Session cleared! I'm ready to help. What would you like to work on?" }
    ]);
    setActiveCategory(null);
    setInput('');
  };

  const statusColour: Record<string, string> = {
    'On Track': 'text-green-600 dark:text-green-400',
    'Attention Needed': 'text-orange-600 dark:text-orange-400',
    'At Risk': 'text-red-600 dark:text-red-400',
    'No Data': 'text-gray-400',
  };

  return (
    <div className="h-full flex gap-6" style={{ maxHeight: 'calc(100vh - 9rem)' }}>

      {/* Left sidebar — tools & prompts */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">

        {/* Student context card */}
        {context && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-blue-500" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Profile</p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current WAM</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {context.wam != null ? `${context.wam.toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className={`font-semibold text-sm ${statusColour[context.status] || 'text-gray-500'}`}>
                {context.status}
              </span>
            </div>
            {context.subjects.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ask about a subject</p>
                <div className="space-y-1.5">
                  {context.subjects.map(s => (
                    <button
                      key={s.subject}
                      onClick={() => handlePrompt(`Help me improve in ${s.subject} where my score is ${s.score.toFixed(1)}%`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group text-left"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.subject}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-semibold ${s.score < 50 ? 'text-red-500' : s.score < 65 ? 'text-orange-500' : 'text-green-500'}`}>
                          {s.score.toFixed(0)}%
                        </span>
                        <ChevronRight size={12} className="text-gray-300 group-hover:text-blue-400 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Prompt category cards */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Start</p>
          <div className="space-y-2">
            {PROMPT_CATEGORIES.map((cat, i) => (
              <div key={i}>
                <button
                  onClick={() => setActiveCategory(activeCategory === i ? null : i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${cat.colour} ${activeCategory === i ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                >
                  {cat.icon}
                  {cat.label}
                  <ChevronRight size={14} className={`ml-auto transition-transform ${activeCategory === i ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeCategory === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1.5 space-y-1 pl-1">
                        {cat.prompts.map((p, j) => (
                          <button
                            key={j}
                            onClick={() => handlePrompt(p)}
                            className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">AI Learning Tutor</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Ready to help
              </p>
            </div>
          </div>
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <RotateCcw size={13} />
            New Session
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[78%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[78%]">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-4 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything about your studies…"
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition flex items-center gap-2 text-sm font-medium"
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
