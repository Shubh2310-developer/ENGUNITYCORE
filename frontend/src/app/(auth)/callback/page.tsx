'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setAuth, setProvider } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Callback] Starting auth callback...');
        
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Callback] Error getting session:', error);
          router.push('/login?error=session_error');
          return;
        }

        console.log('[Callback] Session retrieved:', {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          hasProviderToken: !!session?.provider_token,
          userEmail: session?.user?.email
        });

        if (session?.access_token) {
          // Get provider token for GitHub API access
          const providerToken = session.provider_token;
          
          if (providerToken) {
            console.log('[Callback] Setting GitHub provider token');
            setProvider('github', providerToken);
          }

          console.log('[Callback] Fetching user data from backend...');
          // Fetch user details from our backend using the Supabase token
          const userData = await authService.getMe(session.access_token);

          console.log('[Callback] User data received, updating auth store');
          // Update global state with user record
          setAuth(userData, session.access_token);

          console.log('[Callback] Redirecting to overview...');
          router.push('/overview');
        } else {
          console.log('[Callback] No access token found');
          // Check for error in query params
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('error')) {
            router.push(`/login?error=${urlParams.get('error_description')}`);
          } else {
            // If no token and no error, just redirect to login
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('[Callback] Error processing auth callback:', error);
        router.push('/login?error=auth_callback_failed');
      }
    };

    handleCallback();
  }, [router, setAuth, setProvider]);

  return (
    <div className="min-h-screen bg-void-900 flex flex-col items-center justify-center text-starlight-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyber-teal" />
        <h2 className="text-xl font-medium tracking-tight">Synchronizing Neural Session...</h2>
        <p className="text-starlight-400 text-sm">Please wait while we establish a secure connection.</p>
      </div>
    </div>
  );
}
