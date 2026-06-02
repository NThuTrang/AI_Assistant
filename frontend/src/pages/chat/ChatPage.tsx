import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap } from 'lucide-react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import { useChatStore } from '@/store/chatStore';
import { useScrollToBottom } from '@/hooks';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const {
    messages,
    currentSessionId,
    isLoading,
    isStreaming,
    sendMessage,
    createSession,
    toggleBookmark,
  } = useChatStore();

  const scrollRef = useScrollToBottom([messages]);
  
  // Auto-create session when sending first message without session
  const handleSend = async (content: string) => {
    try {
      if (!currentSessionId) {
        await createSession(content.slice(0, 50));
      }
      await sendMessage(content);
    } catch {
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat sidebar with session list */}
      <ChatSidebar />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id ?? `temp-${idx}`}
                  message={msg}
                  onBookmark={msg.id ? toggleBookmark : undefined}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Welcome screen shown when no messages ----
function WelcomeScreen() {
  const FEATURES = [
    { emoji: '📚', title: 'Giải thích lý thuyết', desc: 'Array, BST, Graph, Heap...' },
    { emoji: '⚡', title: 'Sinh code ví dụ', desc: 'Python, C++, Java' },
    { emoji: '🎯', title: 'Phân tích độ phức tạp', desc: 'Time & Space O(n)' },
    { emoji: '🧩', title: 'Tạo bài tập', desc: 'Dễ → Trung bình → Khó' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-6 py-10"
    >
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl mb-5">
        <Bot size={32} className="text-white" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        Xin chào! Tôi là <span className="text-indigo-400">AlgoBot</span>
      </h1>
      <p className="text-gray-400 text-sm mb-8 max-w-md">
        Trợ giảng AI chuyên về Cấu trúc dữ liệu & Giải thuật. Hỏi tôi bất cứ điều gì về CTDL&GT!
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-2xl bg-gray-900 border border-gray-800 text-left cursor-default"
          >
            <span className="text-2xl">{f.emoji}</span>
            <p className="text-sm font-medium text-gray-200 mt-2">{f.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-8 flex items-center gap-1">
        <Zap size={12} className="text-yellow-500" />
        Powered by Gemini AI
      </p>
    </motion.div>
  );
}