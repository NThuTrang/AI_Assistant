import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/api/axios';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (usernameOrEmail, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { usernameOrEmail, password });
          const { accessToken, refreshToken, user } = response.data.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', data);
          const { accessToken, refreshToken, user } = response.data.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
        set({ accessToken: newAccess, refreshToken: newRefresh });
      },

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
      },
    }),
    {
      name: 'dsa-auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);