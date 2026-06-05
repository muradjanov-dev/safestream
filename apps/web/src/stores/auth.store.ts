import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  setUser: (user: User) => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email, password, mfaCode) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, mfaCode }),
            credentials: 'include',
          });
          const data = await res.json() as { success: boolean; data?: { accessToken: string; user: User }; error?: { message: string } };
          if (!res.ok) throw new Error(data.error?.message ?? 'Login failed');
          set({ user: data.data!.user, accessToken: data.data!.accessToken, isLoading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
          throw err;
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          const data = await res.json() as { success: boolean; error?: { message: string } };
          if (!res.ok) throw new Error(data.error?.message ?? 'Registration failed');
          set({ isLoading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Registration failed', isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        const token = get().accessToken;
        if (token) {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          }).catch(() => {});
        }
        set({ user: null, accessToken: null });
      },

      refreshTokens: async () => {
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok) return false;
          const data = await res.json() as { success: boolean; data?: { accessToken: string; user: User } };
          if (data.data) {
            set({ accessToken: data.data.accessToken, user: data.data.user });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'safestream-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
);
