'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Code2 } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';
import { useFindReplace } from './FindReplace';
import { AIInlineCompletionProvider } from './AIInlineProvider';

// Dynamically import Monaco Editor with no SSR
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-void-950">
      <div className="text-starlight-400">Loading editor...</div>
    </div>
  ),
});

export const CodeEditor = () => {
  const { files, activeFileId, updateFileContent, saveFile, setNotification, setCursorPosition, aiSuggestionsEnabled } = useCodeStore();
  const activeFile = files.find(f => f.id === activeFileId);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const aiProviderDisposablesRef = useRef<any[]>([]);

  // Enable Find & Replace
  useFindReplace(editorRef.current, monacoRef.current);

  // Auto-save logic
  useEffect(() => {
    if (activeFile?.isDirty) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      autoSaveTimerRef.current = setTimeout(async () => {
        const saved = await saveFile(activeFile.id);
        setNotification({
          message: saved ? `Auto-saved ${activeFile.name}` : `Auto-save failed for ${activeFile.name}`,
          type: saved ? 'success' : 'error'
        });
      }, 5000); // Increased to 5s to be less intrusive
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [activeFile?.content, activeFile?.isDirty, activeFile?.id, saveFile]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] text-[#64748B] select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-[#F8FAFC] to-[#F8FAFC]" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 mb-8 relative group">
            <div className="absolute inset-0 bg-[#2563EB]/5 rounded-full blur-3xl group-hover:bg-[#2563EB]/10 transition-all duration-700" />
            <div className="relative h-full w-full border border-[#CBD5E1] rounded-3xl flex items-center justify-center bg-white backdrop-blur-md shadow-2xl group-hover:scale-105 transition-all duration-500 ring-1 ring-[#CBD5E1]/50 group-hover:ring-[#2563EB]/20">
              <Code2 className="w-12 h-12 text-[#2563EB]/20 group-hover:text-[#2563EB]/50 transition-all duration-500" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-[#0F172A] tracking-tight mb-2">No File Open</h3>
          <p className="font-bold text-[10px] tracking-[0.2em] uppercase text-[#94A3B8]">Select a file from the explorer to begin coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full min-w-0 overflow-hidden bg-white relative">
      <div className="absolute inset-0 w-full h-full overflow-hidden border-l border-[#CBD5E1]">
        <Editor
          theme="engunity-light"
          language={activeFile.language || 'plaintext'}
          value={activeFile.content}
          onChange={(value: string | undefined) => updateFileContent(activeFile.id, value || '')}
          options={{
            minimap: {
              enabled: true,
              renderCharacters: false,
              maxColumn: 120,
              showSlider: 'mouseover'
            },
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
            occurrencesHighlight: 'singleFile',
            links: true,
            colorDecorators: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'mouseover',
            multiCursorModifier: 'ctrlCmd',
            multiCursorMergeOverlapping: true,
            bracketPairColorization: { enabled: true },
            guides: {
                indentation: true,
                bracketPairs: true
            },
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
            monaco.editor.defineTheme('engunity-light', {
              base: 'vs',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
                { token: 'keyword', foreground: '2563eb', fontStyle: 'bold' },
                { token: 'string', foreground: '059669' },
                { token: 'number', foreground: 'd97706' },
                { token: 'type', foreground: '7c3aed' },
                { token: 'function', foreground: '2563eb' },
              ],
              colors: {
                'editor.background': '#ffffff',
                'editor.lineHighlightBackground': '#f1f5f9',
                'editorCursor.foreground': '#2563eb',
                'editor.selectionBackground': '#2563eb20',
                'editorIndentGuide.background': '#e2e8f0',
                'editorIndentGuide.activeBackground': '#cbd5e1',
                'editorLineNumber.foreground': '#94a3b8',
                'editorLineNumber.activeForeground': '#0f172a',
                'editor.inactiveSelectionBackground': '#2563eb10',
              }
            });
          }}
          onMount={(editor: any, monaco: any) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Register AI Inline Completion Provider (if enabled)
            if (useCodeStore.getState().aiSuggestionsEnabled) {
              const aiProvider = new AIInlineCompletionProvider(monaco);
              aiProviderDisposablesRef.current = [
                monaco.languages.registerInlineCompletionsProvider('python', aiProvider),
                monaco.languages.registerInlineCompletionsProvider('javascript', aiProvider),
                monaco.languages.registerInlineCompletionsProvider('typescript', aiProvider),
              ];
            }

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
              const { activeFileId: latestActiveFileId, files: latestFiles } = useCodeStore.getState();
              if (latestActiveFileId) {
                const latestFile = latestFiles.find(f => f.id === latestActiveFileId);
                void (async () => {
                  const saved = await saveFile(latestActiveFileId);
                  setNotification({
                    message: saved ? `Saved ${latestFile?.name || 'file'}` : `Save failed for ${latestFile?.name || 'file'}`,
                    type: saved ? 'success' : 'error'
                  });
                })();
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
