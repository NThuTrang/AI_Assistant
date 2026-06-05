import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, Filter } from 'lucide-react';
import { topicsApi } from '@/api/services';
import { AlgorithmTopic, TopicCategory } from '@/types';
import { useChatStore } from '@/store/chatStore';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<TopicCategory, string> = {
  DATA_STRUCTURE:      '🗂️ Cấu trúc dữ liệu',
  SORTING:             '📊 Thuật toán sắp xếp',
  SEARCHING:           '🔍 Tìm kiếm',
  GRAPH:               '🕸️ Đồ thị',
  DYNAMIC_PROGRAMMING: '⚡ Quy hoạch động',
  GREEDY:              '💡 Tham lam',
  BACKTRACKING:        '↩️ Quay lui',
  DIVIDE_CONQUER:      '✂️ Chia để trị',
};

const DIFFICULTY_COLORS = {
  BEGINNER:     'text-green-400 bg-green-400/10 border-green-400/20',
  INTERMEDIATE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  ADVANCED:     'text-red-400 bg-red-400/10 border-red-400/20',
};

const DIFFICULTY_LABELS = {
  BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung bình', ADVANCED: 'Nâng cao',
};

export default function LearnPage() {
  const [topics, setTopics] = useState<AlgorithmTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState<string>('ALL');
  const { createSession, selectSession } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    topicsApi.getAll()
      .then((res) => setTopics(res.data.data))
      .catch(() => toast.error('Không thể tải danh sách chủ đề'))
      .finally(() => setLoading(false));
  }, []);

  // Group by category
  const filtered = topics.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.description?.toLowerCase().includes(search.toLowerCase());
    const matchDiff = filterDiff === 'ALL' || t.difficulty === filterDiff;
    return matchSearch && matchDiff;
  });

  const grouped = filtered.reduce<Record<string, AlgorithmTopic[]>>((acc, topic) => {
    if (!acc[topic.category]) acc[topic.category] = [];
    acc[topic.category].push(topic);
    return acc;
  }, {});

  const handleLearnTopic = async (topic: AlgorithmTopic) => {
    try {
      await createSession(`Học ${topic.name}`);
      // Chuyển sang trang /chat và đính kèm tên bài học qua state
      navigate('/chat', { state: { topicName: topic.name } });
    } catch {
      toast.error('Không thể tạo phiên học');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-400" />
            Roadmap học CTDL&GT
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {topics.length} chủ đề · Từ cơ bản đến nâng cao
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm chủ đề..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Difficulty filter */}
          {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDiff(d)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                ${filterDiff === d
                  ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-400'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                }`}
            >
              {d === 'ALL' ? 'Tất cả' : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Topic groups */}
        <div className="space-y-8">
          {(Object.keys(CATEGORY_LABELS) as TopicCategory[])
            .filter((cat) => grouped[cat]?.length > 0)
            .map((category) => (
              <div key={category}>
                <h2 className="text-base font-semibold text-gray-200 mb-3">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[category].map((topic, idx) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      index={idx}
                      onLearn={() => handleLearnTopic(topic)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy chủ đề phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TopicCard({ topic, index, onLearn }: {
  topic: AlgorithmTopic;
  index: number;
  onLearn: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-indigo-600/40 transition-all cursor-pointer"
      onClick={onLearn}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-200 group-hover:text-indigo-400 transition-colors">
          {topic.name}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[topic.difficulty]}`}>
          {DIFFICULTY_LABELS[topic.difficulty]}
        </span>
      </div>

      {topic.description && (
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {topic.description}
        </p>
      )}

      <div className="flex items-center gap-1 text-xs text-indigo-400 group-hover:gap-2 transition-all">
        <span>Học ngay</span>
        <ChevronRight size={12} />
      </div>
    </motion.div>
  );
}