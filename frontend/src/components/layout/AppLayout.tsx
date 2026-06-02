import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, BookOpen, Code2, BarChart3, User,
  Moon, Sun, Menu, X, LogOut, Zap, Trophy, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks';

const NAV_ITEMS = [
  { path: '/chat',      icon: MessageSquare, label: 'AI Chat'   },
  { path: '/learn',     icon: BookOpen,      label: 'Học tập'   },
  { path: '/quiz',      icon: Trophy,        label: 'Quiz'      },
  { path: '/code',      icon: Code2,         label: 'Code'      },
  { path: '/dashboard', icon: BarChart3,     label: 'Dashboard' },
  { path: '/profile',   icon: User,          label: 'Hồ sơ'    },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* ---- Sidebar ---- */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-64 flex-shrink-0 overflow-hidden bg-gray-900 border-r border-gray-800 flex flex-col z-20"
          >
            {/* Logo */}
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-white">DSA Assistant</p>
                <p className="text-xs text-gray-400">AI Tutor CTDL&GT</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group
                    ${isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'} />
                      <span className="flex-1 truncate">{label}</span>
                      {isActive && <ChevronRight size={14} className="text-indigo-400" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Bottom: user + theme */}
            <div className="p-3 border-t border-gray-800 space-y-2">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>

              {/* User row */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Đăng xuất"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---- Main area ---- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 flex-shrink-0 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1" />
          <span className="text-xs text-gray-500 font-mono">
            Powered by Gemini AI
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}