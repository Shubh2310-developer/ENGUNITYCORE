import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCodeStore } from '@/stores/codeStore';

/**
 * Loads the user's persisted Code Studio files whenever they are authenticated.
 * Call this once at the top of CodeLabPage (or a layout that wraps the code route).
 */
export function useCodePersistence() {
  const authStatus = useAuthStore((s) => s.status);
  const initProject = useCodeStore((s) => s.initProject);
  const projectId = useCodeStore((s) => s.currentProjectId);

  // Track the last auth status we loaded for to avoid duplicate calls
  const lastLoadedFor = useRef<string | null>(null);

  useEffect(() => {
    // Only load when authenticated and we haven't loaded for this session yet
    if (authStatus === 'authenticated' && lastLoadedFor.current !== 'authenticated') {
      lastLoadedFor.current = 'authenticated';
      void initProject();
    }

    // Reset on logout so re-login reloads correctly
    if (authStatus === 'unauthenticated') {
      lastLoadedFor.current = null;
    }
  }, [authStatus, initProject]);

  return { isLoadingFiles: false, projectId };
}
