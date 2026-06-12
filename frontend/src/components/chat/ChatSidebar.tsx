import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pin, Trash2, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useDebounce } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ChatSidebar() {
  const {
    sessions, currentSessionId, isLoading,
    fetchSessions, createSession, selectSession,
    togglePin, deleteSession, setSearchQuery, searchQuery,
  } = useChatStore();

  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    fetchSessions();
  }, [debouncedSearch]);

  const handleNewChat = async () => {
    try {
      await createSession('Chat mới');
    } catch {
      toast.error('Không thể tạo phiên chat mới');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Xóa phiên chat này?')) return;
    try {
      await deleteSession(id);
      toast.success('Đã xóa phiên chat');
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handlePin = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await togglePin(id);
  };

  const pinned = sessions.filter((s) => s.isPinned);
  const unpinned = sessions.filter((s) => !s.isPinned);

  return (
    <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Chat mới
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chat..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Pinned */}
        {pinned.length > 0 && (
          <>
            <p className="text-xs text-gray-500 px-2 pt-1 pb-0.5 font-medium uppercase tracking-wider">Đã ghim</p>
            {pinned.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onSelect={() => selectSession(session.id)}
                onPin={(e) => handlePin(e, session.id)}
                onDelete={(e) => handleDelete(e, session.id)}
              />
            ))}
            <div className="border-t border-gray-200 dark:border-gray-800 my-1" />
          </>
        )}

        {/* Recent */}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <p className="text-xs text-gray-500 px-2 pb-0.5 font-medium uppercase tracking-wider">Gần đây</p>
            )}
            <AnimatePresence>
              {unpinned.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onSelect={() => selectSession(session.id)}
                  onPin={(e) => handlePin(e, session.id)}
                  onDelete={(e) => handleDelete(e, session.id)}
                />
              ))}
            </AnimatePresence>
          </>
        )}

        {sessions.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-600">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
            <p className="text-xs mt-1">Nhấn "Chat mới" để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Session Item ----
interface SessionItemProps {
  session: {
    id: number; title: string; isPinned: boolean;
    lastMessage?: string; updatedAt: string;
  };
  isActive: boolean;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SessionItem({ session, isActive, onSelect, onPin, onDelete }: SessionItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onSelect}
      className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all
        ${isActive
          ? 'bg-indigo-600/15 border border-indigo-600/25 text-gray-900 dark:text-gray-100'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-800 dark:text-gray-200'
        }`}
    >
      <MessageSquare size={14} className="flex-shrink-0 mt-0.5 opacity-60" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">
          {session.title}
        </p>
        {session.lastMessage && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {session.lastMessage}
          </p>
        )}
        <p className="text-xs text-gray-600 mt-0.5">
          {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true, locale: vi })}
        </p>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex-shrink-0 hidden group-hover:flex gap-1">
        <button
          onClick={onPin}
          className={`p-1 rounded transition-colors ${session.isPinned ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-700 dark:text-gray-300'}`}
          title={session.isPinned ? 'Bỏ ghim' : 'Ghim'}
        >
          <Pin size={12} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"
          title="Xóa"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}