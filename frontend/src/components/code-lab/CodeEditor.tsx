'use client';

import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Code2 } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';

export const CodeEditor = () => {
  const { files, activeFileId, updateFileContent, saveFile, setNotification, setCursorPosition } = useCodeStore();
  const activeFile = files.find(f => f.id === activeFileId);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save logic
  useEffect(() => {
    if (activeFile?.isDirty) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      autoSaveTimerRef.current = setTimeout(() => {
        saveFile(activeFile.id);
        setNotification({ message: `Auto-saved ${activeFile.name}`, type: 'success' });
      }, 5000); // Increased to 5s to be less intrusive
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [activeFile?.content, activeFile?.isDirty, activeFile?.id, saveFile]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-void-950 text-starlight-400 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-void-800/50 via-void-950 to-void-950" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 mb-8 relative group">
            <div className="absolute inset-0 bg-cyber-teal/5 rounded-full blur-3xl group-hover:bg-cyber-teal/10 transition-all duration-700" />
            <div className="relative h-full w-full border border-white/5 rounded-3xl flex items-center justify-center bg-void-900/40 backdrop-blur-md shadow-2xl group-hover:scale-105 transition-all duration-500 ring-1 ring-white/5 group-hover:ring-cyber-teal/20">
              <Code2 className="w-12 h-12 text-starlight-400/20 group-hover:text-cyber-teal/50 transition-all duration-500" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-starlight-100 tracking-tight mb-2">No File Selected</h3>
          <p className="font-mono text-[10px] font-medium tracking-[0.2em] uppercase text-starlight-400/40">Select a file from the explorer to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full min-w-0 overflow-hidden bg-void-950 relative">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Editor
          theme="engunity-dark"
          language={activeFile.language || 'plaintext'}
          value={activeFile.content}
          onChange={(value: string | undefined) => updateFileContent(activeFile.id, value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            automaticLayout: false, // We handle layout manually via ResizeObserver
            padding: { top: 20, bottom: 20 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorStyle: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            selectionHighlight: true,
            occurrencesHighlight: true,
            links: true,
            colorDecorators: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
            lineHeight: 22,
            letterSpacing: 0.5,
            wordWrap: 'on',
          }}
          beforeMount={(monaco: any) => {
            monaco.editor.defineTheme('engunity-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
                { token: 'keyword', foreground: '2dd4bf' },
                { token: 'string', foreground: '4ade80' },
                { token: 'number', foreground: 'fbbf24' },
                { token: 'type', foreground: '0ea5e9' },
                { token: 'function', foreground: '0ea5e9' },
              ],
              colors: {
                'editor.background': '#030712',
                'editor.lineHighlightBackground': '#ffffff03',
                'editorCursor.foreground': '#00f2ff',
                'editor.selectionBackground': '#00f2ff20',
                'editorIndentGuide.background': '#ffffff05',
                'editorIndentGuide.activeBackground': '#ffffff10',
                'editorLineNumber.foreground': '#334155',
                'editorLineNumber.activeForeground': '#94a3b8',
                'editor.inactiveSelectionBackground': '#00f2ff10',
              }
            });
          }}
          onMount={(editor: any, monaco: any) => {
            // Manual Resize Handling
            const container = editor.getContainerDomNode().parentElement;
            const observer = new ResizeObserver(() => {
              try {
                editor.layout();
              } catch (e) {
                // Component might be unmounted, safe to ignore
              }
            });

            if (container) {
              observer.observe(container);
            }

            editor.onDidChangeCursorPosition((e: any) => {
              setCursorPosition(e.position.lineNumber, e.position.column);
            });

            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
              if (activeFileId) {
                saveFile(activeFileId);
                setNotification({ message: `Saved ${activeFile?.name}`, type: 'success' });
              }
            });

            // Cleanup observer on dispose (though Monaco handles most internal cleanup)
            editor.onDidDispose(() => {
              observer.disconnect();
            });
          }}
        />
      </div>
    </div>
  );
};
