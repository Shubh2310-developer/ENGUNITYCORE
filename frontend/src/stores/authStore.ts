import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  provider?: string;
}

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  providerToken: string | null;
  status: AuthStatus;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
  setHasHydrated: (state: boolean) => void;
  setProvider: (provider: string, providerToken?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      providerToken: null,
      status: 'idle',
      _hasHydrated: false,
      setAuth: (user, token) => set({ user, token, status: 'authenticated' }),
      clearAuth: () => set({ user: null, token: null, providerToken: null, status: 'unauthenticated' }),
      setStatus: (status) => set({ status }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setProvider: (provider, providerToken) => set((state) => ({
        user: state.user ? { ...state.user, provider } : null,
        providerToken: providerToken || state.providerToken
      })),
    }),
    {
      name: 'engunity-auth',
      partialize: (state) => ({ token: state.token, providerToken: state.providerToken }),
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
        };
      },
    }
  )
);
