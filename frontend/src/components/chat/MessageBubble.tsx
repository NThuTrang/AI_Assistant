import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';
import { Copy, Bookmark, BookmarkCheck, Bot, User } from 'lucide-react';
import { Message } from '@/types';
import { useCopyToClipboard } from '@/hooks';
import 'highlight.js/styles/github-dark.css';

interface Props {
  message: Message;
  onBookmark?: (id: number) => void;
}

export default function MessageBubble({ message, onBookmark }: Props) {
  const isUser = message.role === 'USER';
  const { copy, copied } = useCopyToClipboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
        ${isUser
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-300 dark:border-gray-700'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.isStreaming ? (
            <div>
              <MarkdownContent content={message.content} />
              <TypingCursor />
            </div>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Actions */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <ActionButton
              icon={copied ? <Copy size={12} className="text-green-400" /> : <Copy size={12} />}
              label={copied ? 'Đã copy' : 'Copy'}
              onClick={() => copy(message.content)}
            />
            {message.id && onBookmark && (
              <ActionButton
                icon={message.isBookmarked
                  ? <BookmarkCheck size={12} className="text-yellow-400" />
                  : <Bookmark size={12} />}
                label={message.isBookmarked ? 'Bỏ lưu' : 'Lưu'}
                onClick={() => onBookmark(message.id!)}
              />
            )}
          </div>
        )}

        {/* Timestamp */}
        {message.createdAt && (
          <span className="text-xs text-gray-600 px-1">
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ---- Markdown renderer with code highlighting ----
function MarkdownContent({ content }: { content: string }) {
  const { copy } = useCopyToClipboard();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        // Custom code block with copy button + language badge
        pre({ children, ...props }) {
          return (
            <div className="relative group/code my-3 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700">
              {children}
            </div>
          );
        },
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match?.[1] ?? '';
          const codeStr = String(children).replace(/\n$/, '');
          const isBlock = !!match;

          if (!isBlock) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-indigo-300 text-xs font-mono" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div>
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900/80 border-b border-gray-300 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono uppercase">{lang || 'code'}</span>
                <button
                  onClick={() => copy(codeStr)}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-200 flex items-center gap-1 transition-colors"
                >
                  <Copy size={11} />
                  Copy
                </button>
              </div>
              <code className={`${className} block`} {...props}>
                {children}
              </code>
            </div>
          );
        },
        // Table styling
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs border-collapse border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return <th className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border border-gray-300 dark:border-gray-700 text-left">{children}</th>;
        },
        td({ children }) {
          return <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">{children}</td>;
        },
        // Blockquote
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-indigo-500 pl-4 my-3 text-gray-600 dark:text-gray-400 italic">
              {children}
            </blockquote>
          );
        },
        // Strong
        strong({ children }) {
          return <strong className="font-semibold text-indigo-300">{children}</strong>;
        },
        // Headings
        h1({ children }) { return <h1 className="text-lg font-bold text-white mb-2 mt-4">{children}</h1>; },
        h2({ children }) { return <h2 className="text-base font-bold text-white mb-2 mt-3">{children}</h2>; },
        h3({ children }) { return <h3 className="text-sm font-semibold text-indigo-300 mb-1 mt-3">{children}</h3>; },
        // List
        ul({ children }) { return <ul className="list-disc list-inside space-y-1 my-2 text-gray-700 dark:text-gray-300">{children}</ul>; },
        ol({ children }) { return <ol className="list-decimal list-inside space-y-1 my-2 text-gray-700 dark:text-gray-300">{children}</ol>; },
        li({ children }) { return <li className="leading-relaxed">{children}</li>; },
        // Paragraph
        p({ children }) { return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>; },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ---- Typing cursor animation ----
function TypingCursor() {
  return (
    <span className="inline-flex gap-0.5 ml-1 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 transition-all flex items-center gap-1 text-xs"
    >
      {icon}
    </button>
  );
}