import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Trophy, Code2, BookOpen,
  TrendingUp, Flame, Target, Award, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/axios';

interface Stats {
  totalChats: number;
  totalMessages: number;
  totalQuizAttempts: number;
  quizAvgScore: number;
  totalCodeAnalyses: number;
  topicsStudied: number;
  streakDays: number;
  totalProblemsSolved: number;
}

interface ProgressItem {
  name: string;
  pct: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
}

const EMPTY_STATS: Stats = {
  totalChats: 0, totalMessages: 0, totalQuizAttempts: 0,
  quizAvgScore: 0, totalCodeAnalyses: 0, topicsStudied: 0,
  streakDays: 0, totalProblemsSolved: 0,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch user statistics
        const statsRes = await api.get('/users/statistics').catch(() => null);
        if (statsRes?.data?.data) {
          setStats(statsRes.data.data);
        }

        // Fetch user progress per topic
        const progRes = await api.get('/users/progress').catch(() => null);
        if (progRes?.data?.data) {
          setProgress(progRes.data.data);
        }

        // Fallback: count sessions from chat API
        const sessRes = await api.get('/chat/sessions?size=1').catch(() => null);
        if (sessRes?.data?.data) {
          const totalChats = sessRes.data.data.totalElements ?? 0;
          setStats(prev => ({ ...prev, totalChats }));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const STAT_CARDS = [
    { icon: MessageSquare, label: 'Tổng chat',     value: stats.totalChats,       color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
    { icon: Trophy,        label: 'Quiz đã làm',   value: stats.totalQuizAttempts,color: 'text-yellow-400', bg: 'bg-yellow-600/10' },
    { icon: Code2,         label: 'Code phân tích',value: stats.totalCodeAnalyses, color: 'text-emerald-400',bg: 'bg-emerald-600/10'},
    { icon: BookOpen,      label: 'Chủ đề đã học', value: stats.topicsStudied,    color: 'text-purple-400', bg: 'bg-purple-600/10' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  const isNewUser = stats.totalChats === 0 && stats.totalMessages === 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-xl font-bold text-white">
            Xin chào, <span className="text-indigo-400">{user?.fullName || user?.username}</span>! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isNewUser
              ? 'Chào mừng bạn mới! Bắt đầu học CTDL&GT ngay hôm nay 🚀'
              : 'Tổng quan tiến độ học tập của bạn'}
          </p>
        </motion.div>

        {/* New user banner */}
        {isNewUser && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-6 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-600/25 flex items-center gap-4"
          >
            <span className="text-3xl">🎓</span>
            <div>
              <p className="text-sm font-semibold text-indigo-300">Bạn chưa có hoạt động nào</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Vào <strong className="text-indigo-400">AI Chat</strong> để bắt đầu hỏi, hoặc <strong className="text-indigo-400">Học tập</strong> để duyệt roadmap CTDL&GT.
              </p>
            </div>
          </motion.div>
        )}

        {/* Highlight row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Flame,  value: stats.streakDays,       label: 'ngày liên tiếp', from: 'from-orange-600/20', to: 'to-red-600/20',   border: 'border-orange-600/20', color: 'text-orange-400', bg: 'bg-orange-600/20' },
            { icon: Target, value: `${stats.quizAvgScore}%`,label: 'điểm quiz TB',  from: 'from-yellow-600/20', to: 'to-orange-600/20', border: 'border-yellow-600/20', color: 'text-yellow-400', bg: 'bg-yellow-600/20' },
            { icon: Award,  value: stats.totalMessages,    label: 'tin nhắn gửi',  from: 'from-indigo-600/20', to: 'to-purple-600/20', border: 'border-indigo-600/20', color: 'text-indigo-400', bg: 'bg-indigo-600/20' },
          ].map(({ icon: Icon, value, label, from, to, border, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={`bg-gradient-to-br ${from} ${to} border ${border} rounded-2xl p-4 flex items-center gap-3`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={21} className={color} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={17} className={color} />
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
        >
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={17} className="text-indigo-400" />
            Tiến độ học tập
          </h2>

          {progress.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm">Chưa có dữ liệu tiến độ.</p>
              <p className="text-xs mt-1">Bắt đầu học từ mục <span className="text-indigo-400">Học tập</span> để theo dõi tiến độ.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {progress.map((item, i) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.pct}%</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${item.status === 'COMPLETED'   ? 'bg-green-600/15 text-green-400'  :
                          item.status === 'IN_PROGRESS' ? 'bg-yellow-600/15 text-yellow-400':
                                                          'bg-gray-700 text-gray-500'}`}>
                        {item.status === 'COMPLETED' ? 'Xong' :
                         item.status === 'IN_PROGRESS' ? 'Đang học' : 'Chưa học'}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        item.status === 'COMPLETED'   ? 'bg-green-500'  :
                        item.status === 'IN_PROGRESS' ? 'bg-indigo-500' : 'bg-gray-700'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ delay: 0.5 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}