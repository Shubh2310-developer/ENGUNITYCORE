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
          // Only clear auth if it's an authentication error, not a connection error
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.warn('Backend connection failed. Please ensure the backend server is running on the correct port.');
            // Don't clear auth on connection errors - let user retry
            setStatus('unauthenticated');
          } else {
            // Clear auth for actual authentication failures
            clearAuth();
          }
        }
      } else if (status === 'idle' && !token) {
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, [token, status, _hasHydrated, setAuth, clearAuth, setStatus]);

  return <>{children}</>;
}
