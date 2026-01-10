'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, status, _hasHydrated, setAuth, clearAuth, setStatus } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      // Wait for zustand hydration before making decisions
      if (!_hasHydrated) return;

      // If we have a token and status is idle, start checking
      if (status === 'idle' && token) {
        try {
          setStatus('checking');
          const user = await authService.getMe(token);
          setAuth(user, token);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          clearAuth();
        }
      } else if (status === 'idle' && !token) {
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, [token, status, _hasHydrated, setAuth, clearAuth, setStatus]);

  return <>{children}</>;
}
