'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, status, _hasHydrated, setAuth, clearAuth, setStatus, setProvider } = useAuthStore();

  useEffect(() => {
    console.log('[AuthProvider] Initializing with status:', status, 'hasToken:', !!token);
    
    const initAuth = async () => {
      // Wait for zustand hydration before making decisions
      if (!_hasHydrated) {
        console.log('[AuthProvider] Waiting for hydration...');
        return;
      }

      // If we have a token and status is idle, start checking
      if (status === 'idle' && token) {
        try {
          console.log('[AuthProvider] Checking existing token...');
          setStatus('checking');
          const user = await authService.getMe(token);
          setAuth(user, token);
          console.log('[AuthProvider] ✅ Token valid, user authenticated');
        } catch (error) {
          console.error('[AuthProvider] Auth initialization failed:', error);
          // Only clear auth if it's an authentication error, not a connection error
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.warn('[AuthProvider] Backend connection failed. Please ensure the backend server is running.');
            // Don't clear auth on connection errors - let user retry
            setStatus('unauthenticated');
          } else {
            // Clear auth for actual authentication failures
            console.log('[AuthProvider] Clearing invalid auth');
            clearAuth();
          }
        }
      } else if (status === 'idle' && !token) {
        console.log('[AuthProvider] No token found, setting unauthenticated');
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, [token, status, _hasHydrated, setAuth, clearAuth, setStatus]);

  // Set up Supabase auth state listener for automatic token refresh
  useEffect(() => {
    console.log('[AuthProvider] Setting up Supabase auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Supabase auth event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthProvider] User signed in via Supabase');
        try {
          const userData = await authService.getMe(session.access_token);
          setAuth(userData, session.access_token);
          
          if (session.provider_token) {
            setProvider('github', session.provider_token);
          }
        } catch (error) {
          console.error('[AuthProvider] Failed to sync user after sign in:', error);
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[AuthProvider] ✅ Token refreshed automatically');
        try {
          const userData = await authService.getMe(session.access_token);
          setAuth(userData, session.access_token);
        } catch (error) {
          console.error('[AuthProvider] Failed to update user after token refresh:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] User signed out');
        clearAuth();
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [setAuth, clearAuth, setProvider]);

  return <>{children}</>;
}
