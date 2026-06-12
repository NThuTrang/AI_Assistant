import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Sparkles, Search, Loader2, Copy, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { codeApi } from '@/api/services';
import { ProgrammingLanguage } from '@/types';
import { useCopyToClipboard } from '@/hooks';
import toast from 'react-hot-toast';

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'python', label: '🐍 Python' },
  { value: 'cpp',    label: '⚙️ C++' },
  { value: 'java',   label: '☕ Java' },
];

const EXAMPLES = [
  'Bubble Sort', 'Merge Sort', 'Quick Sort', 'Binary Search',
  'BFS', 'DFS', 'Dijkstra', 'Stack', 'Queue', 'Linked List',
  'Binary Tree traversal', 'Hash Table', 'Dynamic Programming - Fibonacci',
];

export default function CodePage() {
  const [mode, setMode] = useState<'analyze' | 'generate'>('analyze');
  const [code, setCode] = useState('');
  const [algorithm, setAlgorithm] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>('python');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { copy, copied } = useCopyToClipboard();

  const handleAnalyze = async () => {
    if (!code.trim()) { toast.error('Nhập code vào để phân tích'); return; }
    setLoading(true);
    try {
      const res = await codeApi.analyze(code, language);
      setResult(res.data.data.analysis);
    } catch { toast.error('Phân tích thất bại'); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!algorithm.trim()) { toast.error('Chọn thuật toán cần tạo code'); return; }
    setLoading(true);
    try {
      const res = await codeApi.generate(algorithm, language);
      setResult(res.data.data.code);
    } catch { toast.error('Sinh code thất bại'); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-6">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 size={22} className="text-indigo-400" />
            Code Analysis & Generator
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Upload code để AI phân tích, hoặc sinh code theo thuật toán</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'analyze', label: '🔍 Phân tích code' },
            { id: 'generate', label: '✨ Sinh code' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setMode(id as 'analyze' | 'generate'); setResult(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
                ${mode === id
                  ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-400'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left panel: input */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Language selector */}
            <div className="flex gap-2 mb-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                    ${language === l.value
                      ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {mode === 'analyze' ? (
              /* Code input textarea */
              <div className="flex-1 flex flex-col">
                <div className="flex-1 relative">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`# Paste code ${language} vào đây để AI phân tích...\n\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]`}
                    className="w-full h-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-700 dark:text-gray-300 font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  {loading ? 'Đang phân tích...' : 'Phân tích code'}
                </button>
              </div>
            ) : (
              /* Algorithm selector */
              <div className="flex-1 flex flex-col">
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1.5 block">Chọn thuật toán / CTDL</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setAlgorithm(ex)}
                        className={`text-left text-xs px-3 py-2 rounded-xl border transition-all truncate
                          ${algorithm === ex
                            ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-400'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
                          }`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <input
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    placeholder="Hoặc nhập tên thuật toán..."
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {loading ? 'Đang sinh code...' : `Sinh code ${language.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>

          {/* Right panel: AI result */}
          <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'analyze' ? '🤖 Kết quả phân tích' : '✨ Code được sinh'}
              </span>
              {result && (
                <button
                  onClick={() => copy(result)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  <Copy size={12} />
                  {copied ? 'Đã copy!' : 'Copy'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 size={18} className="animate-spin text-indigo-400" />
                  <span className="text-sm">AI đang xử lý...</span>
                </div>
              ) : result ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children }) {
                        const lang = /language-(\w+)/.exec(className || '')?.[1];
                        return (
                          <pre className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 overflow-x-auto my-3 border border-gray-300 dark:border-gray-700">
                            <code className={`text-xs font-mono ${lang ? `language-${lang}` : ''}`}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      p({ children }) { return <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 leading-relaxed">{children}</p>; },
                      h1({ children }) { return <h1 className="text-base font-bold text-white mb-2">{children}</h1>; },
                      h2({ children }) { return <h2 className="text-sm font-bold text-indigo-300 mb-2 mt-3">{children}</h2>; },
                      strong({ children }) { return <strong className="text-indigo-300">{children}</strong>; },
                      ul({ children }) { return <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 list-disc list-inside my-2">{children}</ul>; },
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-600">
                  <div>
                    <Code2 size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {mode === 'analyze'
                        ? 'Paste code vào bên trái và nhấn "Phân tích"'
                        : 'Chọn thuật toán và nhấn "Sinh code"'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}