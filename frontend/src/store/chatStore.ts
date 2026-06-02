import { create } from 'zustand';
import api from '@/api/axios';

export interface Message {
  id?: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
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
  lastMessage: string;
  updatedAt: string;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: number | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  searchQuery: string;

  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  selectSession: (sessionId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;
  togglePin: (sessionId: number) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  toggleBookmark: (messageId: number) => Promise<void>;
  setSearchQuery: (q: string) => void;
  clearCurrentSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  searchQuery: '',

  fetchSessions: async () => {
    try {
      const { searchQuery } = get();
      const params = searchQuery ? { search: searchQuery } : {};
      const res = await api.get('/chat/sessions', { params });
      set({ sessions: res.data.data.content || [] });
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  },

  createSession: async (title) => {
    const params = title ? { title } : {};
    const res = await api.post('/chat/sessions', null, { params });
    const session = res.data.data;
    set((s) => ({ sessions: [session, ...s.sessions], currentSessionId: session.id, messages: [] }));
    return session;
  },

  selectSession: async (sessionId) => {
    set({ isLoading: true, currentSessionId: sessionId });
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      set({ messages: res.data.data.messages || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    // Optimistically add user message
    const userMsg: Message = { role: 'USER', content, createdAt: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

    try {
      const res = await api.post(`/chat/sessions/${currentSessionId}/messages`, { content });
      const aiMsg: Message = res.data.data;

      set((s) => ({
        messages: [...s.messages, aiMsg],
        isLoading: false,
      }));

      // Update session list
      get().fetchSessions();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  sendMessageStream: async (content) => {
  await get().sendMessage(content);
},

  togglePin: async (sessionId) => {
    await api.patch(`/chat/sessions/${sessionId}/pin`);
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, isPinned: !sess.isPinned } : sess
      ),
    }));
  },

  deleteSession: async (sessionId) => {
    await api.delete(`/chat/sessions/${sessionId}`);
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== sessionId),
      currentSessionId: s.currentSessionId === sessionId ? null : s.currentSessionId,
      messages: s.currentSessionId === sessionId ? [] : s.messages,
    }));
  },

  toggleBookmark: async (messageId) => {
    await api.patch(`/chat/messages/${messageId}/bookmark`);
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, isBookmarked: !m.isBookmarked } : m
      ),
    }));
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  clearCurrentSession: () => set({ currentSessionId: null, messages: [] }),
}));