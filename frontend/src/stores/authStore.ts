import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
}

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: 'idle',
      _hasHydrated: false,
      setAuth: (user, token) => set({ user, token, status: 'authenticated' }),
      clearAuth: () => set({ user: null, token: null, status: 'unauthenticated' }),
      setStatus: (status) => set({ status }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'engunity-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
        };
      },
    }
  )
);
