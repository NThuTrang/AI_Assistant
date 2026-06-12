import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import { LoginPage, RegisterPage } from '@/pages/auth/AuthPages';
import ChatPage from '@/pages/chat/ChatPage';
import LearnPage from '@/pages/learn/LearnPage';
import QuizPage from '@/pages/quiz/QuizPage';
import CodePage from '@/pages/code/CodePage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

// ---- Auth guard ----
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/chat" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
        >
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="code" element={<CodePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Simple inline profile page
function ProfilePage() {
  const { user, logout } = useAuthStore();
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.fullName || user?.username}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
        <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
          {user?.role}
        </span>
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={logout}
            className="px-6 py-2.5 rounded-xl bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 text-sm transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}