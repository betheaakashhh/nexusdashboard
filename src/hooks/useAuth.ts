// src/hooks/useAuth.ts
import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  // fetchMe is defined once inside the store — it never changes reference
  fetchMe: async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        // No-cache so we always get fresh session info
        cache: 'no-store',
      });
      if (res.ok) {
        const { user } = await res.json();
        set({ user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    set({ user: null });
    window.location.href = '/login';
  },
}));