'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth';

export default function TestAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const testSupabaseSession = async () => {
    addLog('Testing Supabase session...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`❌ Error: ${error.message}`);
      } else if (session) {
        addLog('✅ Session found!');
        addLog(`Access Token: ${session.access_token.substring(0, 50)}...`);
        addLog(`Provider Token: ${session.provider_token ? session.provider_token.substring(0, 50) + '...' : 'Not available'}`);
        addLog(`Email: ${session.user.email}`);
        setSessionInfo(session);
      } else {
        addLog('⚠️ No session found - Please login first');
      }
    } catch (error: any) {
      addLog(`❌ Exception: ${error.message}`);
    }
  };

  const testBackendAuth = async () => {
    addLog('Testing backend /auth/me endpoint...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog('❌ No session - please login first');
        return;
      }

      addLog(`Calling /auth/me via authService...`);
      const userData = await authService.getMe(session.access_token);
      addLog('✅ Backend auth successful!');
      addLog(`User data: ${JSON.stringify(userData, null, 2)}`);
    } catch (error: any) {
      addLog(`❌ Backend auth failed: ${error.message}`);
    }
  };

  const loginWithGitHub = async () => {
    addLog('Initiating GitHub login...');
    try {
      await authService.loginWithGithub();
    } catch (error: any) {
      addLog(`❌ GitHub login failed: ${error.message}`);
    }
  };

  const logout = async () => {
    addLog('Logging out...');
    await supabase.auth.signOut();
    setSessionInfo(null);
    addLog('✅ Logged out');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testSupabaseSession}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-2"
          >
            Test Supabase Session
          </button>
          
          <button
            onClick={testBackendAuth}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-2"
          >
            Test Backend Auth
          </button>
          
          <button
            onClick={loginWithGitHub}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded mr-2"
          >
            Login with GitHub
          </button>
          
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded mr-2"
          >
            Logout
          </button>
          
          <button
            onClick={() => setLogs([])}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            Clear Logs
          </button>
        </div>

        {sessionInfo && (
          <div className="bg-gray-800 p-4 rounded mb-4">
            <h2 className="text-xl font-semibold mb-2">Session Info:</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Logs:</h2>
          <div className="space-y-1 font-mono text-sm">
            {logs.length === 0 && (
              <p className="text-gray-500">No logs yet. Click a button to test!</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
