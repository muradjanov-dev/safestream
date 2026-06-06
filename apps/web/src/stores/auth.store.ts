'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

export interface User {
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
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInDemo: () => void;
  logout: () => Promise<void>;
  initAuth: () => void;
  clearError: () => void;
}

function mapFirebaseUser(fb: FirebaseUser): User {
  return {
    id: fb.uid,
    email: fb.email ?? '',
    username: (fb.email?.split('@')[0] ?? fb.displayName ?? 'user').replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
    displayName: fb.displayName ?? undefined,
    avatarUrl: fb.photoURL ?? undefined,
    role: 'creator', // signed-in users get creator access (upload + dashboard)
    emailVerified: fb.emailVerified,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        const auth = getFirebaseAuth();
        // Fallback: no Firebase config yet → demo sign-in so the button still works
        if (!auth || !isFirebaseConfigured) {
          set({
            user: {
              id: 'demo-user',
              email: 'demo@safestream.app',
              username: 'demo_user',
              displayName: 'Demo User',
              avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
              role: 'creator',
              emailVerified: true,
            },
            isLoading: false,
          });
          return;
        }
        try {
          const result = await signInWithPopup(auth, googleProvider);
          set({ user: mapFirebaseUser(result.user), isLoading: false });
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code ?? '';
          const msg =
            code === 'auth/popup-closed-by-user'
              ? 'Sign-in cancelled.'
              : code === 'auth/unauthorized-domain'
                ? 'This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.'
                : (err instanceof Error ? err.message : 'Google sign-in failed');
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      signInDemo: () =>
        set({
          user: {
            id: 'demo-user',
            email: 'demo@safestream.app',
            username: 'demo_user',
            displayName: 'Demo User',
            avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
            role: 'creator',
            emailVerified: true,
          },
          error: null,
        }),

      logout: async () => {
        const auth = getFirebaseAuth();
        if (auth) await fbSignOut(auth).catch(() => {});
        set({ user: null });
      },

      initAuth: () => {
        const auth = getFirebaseAuth();
        if (!auth) return;
        onAuthStateChanged(auth, (fb) => {
          if (fb) set({ user: mapFirebaseUser(fb) });
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'safestream-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
