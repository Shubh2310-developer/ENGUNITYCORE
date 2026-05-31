'use client';

import { useEffect, useRef, ReactNode, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    return payload;
  } catch {
    return null;
  }
};

const isJwtExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return false;

  // Include a small buffer so we don't race the backend on near-expiry tokens.
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds + 15;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, status, _hasHydrated, setAuth, clearAuth, setStatus, setProvider } = useAuthStore();
  const validatingTokenRef = useRef<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const syncSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const userData = await authService.getMe(session.access_token);
          setAuth(userData, session.access_token);
        } catch {
          clearAuth();
        }
      }
      setIsSyncing(false);
    };
    syncSupabaseSession();
  }, [setAuth, clearAuth]);

  useEffect(() => {
    console.log('[AuthProvider] Initializing with status:', status, 'hasToken:', !!token);
    
    const initAuth = async () => {
      if (!_hasHydrated || isSyncing) {
        console.log('[AuthProvider] Waiting for hydration/sync...');
        return;
      }

      // If we have a token and status is idle, start checking
      if (status === 'idle' && token) {
        if (validatingTokenRef.current === token) {
          return;
        }

        if (isJwtExpired(token)) {
          console.log('[AuthProvider] Stored token is expired, clearing auth');
          clearAuth();
          return;
        }

        try {
          validatingTokenRef.current = token;
          console.log('[AuthProvider] Checking existing token...');
          setStatus('checking');
          const user = await authService.getMe(token);
          setAuth(user, token);
          console.log('[AuthProvider] ✅ Token valid, user authenticated');
        } catch (error) {
          if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            console.log('[AuthProvider] Token unauthorized/expired, clearing auth');
            clearAuth();
          } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.warn('[AuthProvider] Backend connection failed. Please ensure the backend server is running.');
            setStatus('unauthenticated');
          } else {
            console.error('[AuthProvider] Auth initialization failed:', error);
            console.log('[AuthProvider] Clearing invalid auth');
            clearAuth();
          }
        } finally {
          validatingTokenRef.current = null;
        }
      } else if (status === 'idle' && !token) {
        console.log('[AuthProvider] No token found, setting unauthenticated');
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, [token, status, _hasHydrated, isSyncing, setAuth, clearAuth, setStatus]);

  // Set up Supabase auth state listener for automatic token refresh
  useEffect(() => {
    console.log('[AuthProvider] Setting up Supabase auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Supabase auth event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        if (validatingTokenRef.current === session.access_token) {
          return;
        }
        console.log('[AuthProvider] User signed in via Supabase');
        try {
          validatingTokenRef.current = session.access_token;
          const userData = await authService.getMe(session.access_token);
          setAuth(userData, session.access_token);
          
          if (session.provider_token) {
            setProvider('github', session.provider_token);
          }
        } catch (error) {
          console.error('[AuthProvider] Failed to sync user after sign in:', error);
        } finally {
          validatingTokenRef.current = null;
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[AuthProvider] ✅ Token refreshed automatically');
        // Immediately update the token so in-flight requests use the refreshed token.
        // Only do this when we already have a user in the store (skip if not authenticated).
        const existingUser = useAuthStore.getState().user;
        if (existingUser) {
          setAuth(existingUser, session.access_token);
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

  if (!_hasHydrated || isSyncing) {
    return (
      <div className="flex h-screen bg-[#030712] items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
