import api from './axios';

// ---- Topics ----
export const topicsApi = {
  getAll: () => api.get('/topics'),
  getBySlug: (slug: string) => api.get(`/topics/${slug}`),
  getByCategory: (category: string) => api.get(`/topics/category/${category}`),
};

// ---- Quiz ----
export const quizApi = {
  generate: (topic: string, difficulty: string, questionCount: number) =>
    api.post('/quiz/generate', null, { params: { topic, difficulty, questionCount } }),

  ask: (question: string) =>
    api.post('/quiz/ask', { question }),
};

// ---- Code Analysis ----
export const codeApi = {
  analyze: (code: string, language: string) =>
    api.post('/code/analyze', { code, language }),

  generate: (algorithm: string, language: string) =>
    api.post('/code/generate', { algorithm, language }),
};

// ---- Practice Problems ----
export const problemsApi = {
  generate: (topic: string, difficulty: string, count: number) =>
    api.post('/problems/generate', null, { params: { topic, difficulty, count } }),
};

// ---- User Profile ----
export const userApi = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) =>
    api.put('/users/profile', data),
  markTopicLearned: (topicId: number | string) => 
    api.post('/users/progress/learn', { topicId }),
};