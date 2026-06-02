// ---- Auth ----
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
}

// ---- Topics ----
export type TopicCategory =
  | 'DATA_STRUCTURE' | 'SORTING' | 'SEARCHING'
  | 'GRAPH' | 'DYNAMIC_PROGRAMMING' | 'GREEDY'
  | 'BACKTRACKING' | 'DIVIDE_CONQUER';

export type TopicDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface AlgorithmTopic {
  id: number;
  slug: string;
  name: string;
  category: TopicCategory;
  difficulty: TopicDifficulty;
  description: string;
  orderIndex: number;
  icon?: string;
}

// ---- Chat ----
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface Message {
  id?: number;
  role: MessageRole;
  content: string;
  isBookmarked?: boolean;
  createdAt?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: number;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  messageCount: number;
  lastMessage?: string;
  updatedAt: string;
  createdAt: string;
}

// ---- Quiz ----
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizQuestion {
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  questionIndex: number;
  userAnswers: Record<number, string>;
  score: number;
  completed: boolean;
}

// ---- Code ----
export type ProgrammingLanguage = 'python' | 'cpp' | 'java';

// ---- UI ----
export type Theme = 'dark' | 'light';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}