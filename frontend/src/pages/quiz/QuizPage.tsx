import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, CheckCircle, XCircle, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { quizApi } from '@/api/services';
import { GeneratedQuiz, QuizQuestion } from '@/types';
import toast from 'react-hot-toast';

const TOPICS = [
  'Array', 'Linked List', 'Stack', 'Queue', 'Binary Tree', 'BST', 'AVL Tree',
  'Heap', 'Hash Table', 'Graph', 'Trie', 'Bubble Sort', 'Merge Sort',
  'Quick Sort', 'Binary Search', 'BFS', 'DFS', 'Dijkstra', 'Dynamic Programming',
  'Greedy', 'Backtracking',
];

export default function QuizPage() {
  const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [config, setConfig] = useState({ topic: 'Array', difficulty: 'MEDIUM', count: 5 });
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await quizApi.generate(config.topic, config.difficulty, config.count);
      const raw = res.data.data;
      // Parse JSON from AI response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid quiz format');
      const parsed: GeneratedQuiz = JSON.parse(jsonMatch[0]);
      setQuiz(parsed);
      setStep('quiz');
      setCurrent(0);
      setAnswers({});
    } catch (e) {
      toast.error('Không thể tạo quiz. Thử lại nhé!');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [current]: answer }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (current < quiz.questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setStep('result');
    }
  };

  const calcScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const reset = () => {
    setStep('setup');
    setQuiz(null);
    setAnswers({});
    setCurrent(0);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Setup step */}
        {step === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Quiz CTDL&GT</h1>
              <p className="text-gray-400 text-sm mt-1">AI tạo câu hỏi theo chủ đề và mức độ bạn chọn</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              {/* Topic */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Chủ đề</label>
                <select
                  value={config.topic}
                  onChange={(e) => setConfig((c) => ({ ...c, topic: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Mức độ</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setConfig((c) => ({ ...c, difficulty: d }))}
                      className={`py-2 rounded-xl text-sm font-medium border transition-all
                        ${config.difficulty === d
                          ? d === 'EASY' ? 'bg-green-600/20 border-green-600/40 text-green-400'
                            : d === 'MEDIUM' ? 'bg-yellow-600/20 border-yellow-600/40 text-yellow-400'
                            : 'bg-red-600/20 border-red-600/40 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      {d === 'EASY' ? '🟢 Dễ' : d === 'MEDIUM' ? '🟡 Vừa' : '🔴 Khó'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Số câu hỏi: <span className="text-indigo-400">{config.count}</span>
                </label>
                <input
                  type="range" min={3} max={10} value={config.count}
                  onChange={(e) => setConfig((c) => ({ ...c, count: +e.target.value }))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>3</span><span>10</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {generating ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang tạo quiz...</>
                ) : (
                  <><Sparkles size={16} /> Tạo Quiz ngay</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Quiz step */}
        {step === 'quiz' && quiz && (
          <QuizQuestionCard
            question={quiz.questions[current]}
            questionIndex={current}
            total={quiz.questions.length}
            selectedAnswer={answers[current]}
            onAnswer={handleAnswer}
            onNext={handleNext}
            isLast={current === quiz.questions.length - 1}
          />
        )}

        {/* Result step */}
        {step === 'result' && quiz && (
          <ResultScreen
            quiz={quiz}
            answers={answers}
            score={calcScore()}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

// ---- Single question component ----
function QuizQuestionCard({
  question, questionIndex, total, selectedAnswer, onAnswer, onNext, isLast,
}: {
  question: QuizQuestion; questionIndex: number; total: number;
  selectedAnswer?: string; onAnswer: (a: string) => void;
  onNext: () => void; isLast: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (opt: string) => {
    if (revealed) return;
    onAnswer(opt);
  };

  const handleReveal = () => setRevealed(true);

  const handleNextQ = () => {
    setRevealed(false);
    onNext();
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <motion.div key={questionIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Câu {questionIndex + 1} / {total}</span>
          <span>{Math.round(((questionIndex) / total) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            animate={{ width: `${(questionIndex / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="text-base font-medium text-white mb-5 leading-relaxed">
          {question.questionText}
        </p>

        {/* Options */}
        <div className="space-y-2 mb-5">
          {(question.options ?? [question.correctAnswer, 'Sai']).map((opt) => {
            let cls = 'bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500';
            if (revealed) {
              if (opt === question.correctAnswer) cls = 'bg-green-600/15 border-green-600/40 text-green-300';
              else if (opt === selectedAnswer) cls = 'bg-red-600/15 border-red-600/40 text-red-300';
            } else if (opt === selectedAnswer) {
              cls = 'bg-indigo-600/20 border-indigo-600/40 text-indigo-300';
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 rounded-xl mb-4 flex items-start gap-2 text-sm
                ${isCorrect ? 'bg-green-600/10 border border-green-600/20 text-green-300'
                            : 'bg-red-600/10 border border-red-600/20 text-red-300'}`}
            >
              {isCorrect ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <XCircle size={16} className="flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-medium mb-1">{isCorrect ? 'Chính xác!' : 'Chưa đúng'}</p>
                <p className="text-xs opacity-80">{question.explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!revealed && selectedAnswer && (
            <button
              onClick={handleReveal}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-all"
            >
              Kiểm tra đáp án
            </button>
          )}
          {revealed && (
            <button
              onClick={handleNextQ}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-1"
            >
              {isLast ? 'Xem kết quả' : 'Câu tiếp theo'} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---- Result screen ----
function ResultScreen({ quiz, answers, score, onReset }: {
  quiz: GeneratedQuiz; answers: Record<number, string>; score: number; onReset: () => void;
}) {
  const emoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚';
  const msg   = score >= 80 ? 'Xuất sắc!' : score >= 60 ? 'Khá tốt!' : 'Cần ôn thêm!';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="text-center mb-6">
        <span className="text-5xl">{emoji}</span>
        <h2 className="text-2xl font-bold text-white mt-3">{msg}</h2>
        <p className="text-4xl font-bold text-indigo-400 mt-2">{score}%</p>
        <p className="text-gray-500 text-sm mt-1">
          {Object.values(answers).filter((a, i) => a === quiz.questions[i]?.correctAnswer).length}
          /{quiz.questions.length} câu đúng
        </p>
      </div>

      {/* Review */}
      <div className="space-y-3 mb-6">
        {quiz.questions.map((q, i) => {
          const correct = answers[i] === q.correctAnswer;
          return (
            <div key={i} className={`p-3 rounded-xl border text-sm
              ${correct ? 'bg-green-600/10 border-green-600/20' : 'bg-red-600/10 border-red-600/20'}`}>
              <div className="flex items-start gap-2">
                {correct ? <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                         : <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className={correct ? 'text-green-300' : 'text-red-300'}>{q.questionText}</p>
                  {!correct && (
                    <p className="text-xs text-gray-500 mt-1">Đáp án: <span className="text-green-400">{q.correctAnswer}</span></p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
      >
        <RefreshCw size={16} /> Làm quiz mới
      </button>
    </motion.div>
  );
}