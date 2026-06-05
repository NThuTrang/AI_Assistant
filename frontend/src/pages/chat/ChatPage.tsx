import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Cờ để theo dõi việc gửi tin nhắn tự động từ trang Học tập
  const hasSentTopicRef = useRef(false);
  
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

  // Lắng nghe tín hiệu chuyển trang từ LearnPage để tự động đặt câu hỏi
  useEffect(() => {
    const state = location.state as { topicName?: string } | null;
    
    // Nếu có tên bài học truyền sang VÀ chưa gửi lần nào
    if (state?.topicName && !hasSentTopicRef.current) {
      
      hasSentTopicRef.current = true; // Bật cờ chặn gửi lần 2 (Fix lỗi Strict Mode)
      
      const prompt = `Hãy đóng vai một gia sư chuyên nghiệp. Bắt đầu dạy cho tôi về chủ đề: "${state.topicName}". Hãy giải thích lý thuyết dễ hiểu, có ví dụ minh họa.`;
      
      handleSend(prompt);
      
      // Xóa state trên URL để tránh việc F5 trang tự động gửi lại tin nhắn
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  return (
    <div className="flex h-full">
      {/* Chat sidebar with session list */}
      <ChatSidebar />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <WelcomeScreen onSelect={handleSend} />
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
interface WelcomeScreenProps {
  onSelect: (content: string) => void;
}

function WelcomeScreen({ onSelect }: WelcomeScreenProps) {
  const FEATURES = [
    { emoji: '📚', title: 'Giải thích lý thuyết', desc: 'Array, BST, Graph, Heap...', prompt: 'Hãy giải thích lý thuyết về một cấu trúc dữ liệu cơ bản (ví dụ: Array, BST, Graph, Heap...) và cho biết ứng dụng thực tế của nó.' },
    { emoji: '⚡', title: 'Sinh code ví dụ', desc: 'Python, C++, Java', prompt: 'Hãy sinh cho tôi một đoạn code ví dụ về thuật toán sắp xếp hoặc tìm kiếm bằng ngôn ngữ C++ hoặc Java.' },
    { emoji: '🎯', title: 'Phân tích độ phức tạp', desc: 'Time & Space O(n)', prompt: 'Hãy hướng dẫn tôi cách tính độ phức tạp thời gian (Time) và không gian (Space) của một thuật toán bất kỳ.' },
    { emoji: '🧩', title: 'Tạo bài tập', desc: 'Dễ → Trung bình → Khó', prompt: 'Hãy tạo cho tôi 3 bài tập về Cấu trúc dữ liệu và giải thuật theo mức độ từ Dễ đến Khó để tôi luyện tập.' },
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
            onClick={() => onSelect(f.prompt)}
            className="p-4 rounded-2xl bg-gray-900 border border-gray-800 text-left cursor-pointer hover:bg-gray-800 hover:border-indigo-500/50 transition-colors"
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