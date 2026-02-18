import { useEffect } from 'react';
import { useCodeStore } from '@/stores/codeStore';

// We accept 'any' for editor and monaco to avoid importing monaco-editor types directly
// which can cause SSR issues if not handled carefully with type-only imports.
export const useFindReplace = (editor: any, monaco: any) => {
  const { setActiveSidebarTab } = useCodeStore();

  useEffect(() => {
    if (!editor || !monaco) return;

    // Register find command (Cmd+F) - Monaco handles this natively, but we can customize if needed
    // The default behavior opens the Find widget

    // Register replace command (Cmd+H) - Monaco default is Cmd+H for replace

    // Custom: Find in Files (Cmd+Shift+F)
    const findInFilesDisposable = editor.addAction({
      id: 'find-in-files',
      label: 'Find in Files',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: () => {
        setActiveSidebarTab('search');
      }
    });

    return () => {
      findInFilesDisposable?.dispose();
    };
  }, [editor, monaco, setActiveSidebarTab]);
};
