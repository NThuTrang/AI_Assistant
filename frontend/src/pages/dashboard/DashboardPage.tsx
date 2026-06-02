import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Trophy, Code2, BookOpen,
  TrendingUp, Flame, Target, Award,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const MOCK_STATS = {
  totalChats: 47,
  totalMessages: 312,
  quizAttempts: 23,
  quizAvgScore: 78,
  problemsSolved: 15,
  codeAnalyses: 8,
  streakDays: 7,
  topicsStudied: 14,
};

const MOCK_PROGRESS = [
  { name: 'Array',       pct: 100, status: 'COMPLETED'   },
  { name: 'Linked List', pct: 80,  status: 'IN_PROGRESS' },
  { name: 'Stack',       pct: 100, status: 'COMPLETED'   },
  { name: 'Queue',       pct: 60,  status: 'IN_PROGRESS' },
  { name: 'Binary Tree', pct: 40,  status: 'IN_PROGRESS' },
  { name: 'BST',         pct: 20,  status: 'IN_PROGRESS' },
  { name: 'Graph',       pct: 0,   status: 'NOT_STARTED' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const STAT_CARDS = [
    { icon: MessageSquare, label: 'Tổng chat', value: MOCK_STATS.totalChats,     color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
    { icon: Trophy,        label: 'Quiz đã làm', value: MOCK_STATS.quizAttempts, color: 'text-yellow-400', bg: 'bg-yellow-600/10' },
    { icon: Code2,         label: 'Code phân tích', value: MOCK_STATS.codeAnalyses, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { icon: BookOpen,      label: 'Chủ đề đã học', value: MOCK_STATS.topicsStudied, color: 'text-purple-400', bg: 'bg-purple-600/10' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-xl font-bold text-white">
            Xin chào, <span className="text-indigo-400">{user?.fullName || user?.username}</span>! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Đây là tổng quan tiến độ học tập của bạn</p>
        </motion.div>

        {/* Streak + Score highlight */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="col-span-1 bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-600/20 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Flame size={22} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{MOCK_STATS.streakDays}</p>
              <p className="text-xs text-gray-400">ngày liên tiếp</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="col-span-1 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-600/20 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-yellow-600/20 flex items-center justify-center">
              <Target size={22} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{MOCK_STATS.quizAvgScore}%</p>
              <p className="text-xs text-gray-400">điểm quiz TB</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="col-span-1 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-600/20 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              <Award size={22} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-400">{MOCK_STATS.totalMessages}</p>
              <p className="text-xs text-gray-400">tin nhắn gửi</p>
            </div>
          </motion.div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
        >
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={17} className="text-indigo-400" />
            Tiến độ học tập
          </h2>

          <div className="space-y-3">
            {MOCK_PROGRESS.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{item.pct}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${item.status === 'COMPLETED'   ? 'bg-green-600/15 text-green-400' :
                        item.status === 'IN_PROGRESS' ? 'bg-yellow-600/15 text-yellow-400' :
                                                        'bg-gray-700 text-gray-500'}`}
                    >
                      {item.status === 'COMPLETED' ? 'Xong' :
                       item.status === 'IN_PROGRESS' ? 'Đang học' : 'Chưa học'}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full
                      ${item.status === 'COMPLETED' ? 'bg-green-500' :
                        item.status === 'IN_PROGRESS' ? 'bg-indigo-500' : 'bg-gray-700'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}