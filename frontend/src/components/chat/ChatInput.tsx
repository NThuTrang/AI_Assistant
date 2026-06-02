import React, { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Send, Paperclip, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
}

const QUICK_PROMPTS = [
  '📊 Giải thích Big O notation',
  '🌲 So sánh BST và AVL Tree',
  '⚡ Thuật toán Dijkstra hoạt động thế nào?',
  '🔄 Merge Sort vs Quick Sort',
  '💡 Dynamic Programming là gì?',
  '🗃️ Khi nào dùng Hash Table?',
];

export default function ChatInput({ onSend, isLoading, isStreaming }: Props) {
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = isLoading || isStreaming;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setInput('');
    setShowQuick(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setShowQuick(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Quick prompts */}
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-2xl p-3 grid grid-cols-2 gap-2 shadow-xl"
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt.replace(/^[^\s]+ /, ''))}
                className="text-left text-xs px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all leading-tight"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input box */}
      <div className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-2xl px-3 py-2 focus-within:border-indigo-500 transition-colors">
        {/* Quick prompt button */}
        <button
          onClick={() => setShowQuick((v) => !v)}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all mb-0.5
            ${showQuick ? 'text-indigo-400 bg-indigo-600/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
          title="Gợi ý nhanh"
        >
          <Sparkles size={16} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về thuật toán, cấu trúc dữ liệu... (Enter để gửi, Shift+Enter xuống dòng)"
          disabled={busy}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none outline-none py-1.5 max-h-48 leading-relaxed"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || busy}
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5
            ${input.trim() && !busy
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-600 mt-2">
        AlgoBot có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
      </p>
    </div>
  );
}