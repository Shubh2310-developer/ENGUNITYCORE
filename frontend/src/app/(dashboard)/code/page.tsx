'use client';

import React from 'react';
import {
  Play,
  Settings,
  Search,
  Layout,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Code2,
  Shield,
  Zap,
  Square,
  Bug,
  GitBranch,
  Beaker,
  Users,
  Monitor,
  FolderOpen
} from 'lucide-react';
import { FileExplorer } from '@/components/code-lab/FileExplorer';
import { GlobalSearch } from '@/components/code-lab/GlobalSearch';
import { DebugSidebar } from '@/components/code-lab/DebugSidebar';
import { GitSidebar } from '@/components/code-lab/GitSidebar';
import { TestRunner } from '@/components/code-lab/TestRunner';
import { TeamChat } from '@/components/code-lab/TeamChat';
import { DebugToolbar } from '@/components/code-lab/DebugToolbar';
import { EditorTabs } from '@/components/code-lab/EditorTabs';
import { Breadcrumbs } from '@/components/code-lab/Breadcrumbs';
import { CodeEditor } from '@/components/code-lab/CodeEditor';
import { BottomPanel } from '@/components/code-lab/BottomPanel';
import { StatusBar } from '@/components/code-lab/StatusBar';
import { AIRefinePanel } from '@/components/code-lab/AIRefinePanel';
import { NotificationOverlay } from '@/components/code-lab/NotificationOverlay';
import { CommandPalette } from '@/components/code-lab/CommandPalette';
import { PreviewPanel } from '@/components/code-lab/PreviewPanel';
import { useCodeStore } from '@/stores/codeStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { codeService } from '@/services/code';
import { useAuthStore } from '@/stores/authStore';
import styles from './codelab.module.css';

export default function CodeLabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAIRefineOpen,
    setAIRefineOpen,
    isSidebarOpen,
    setSidebarOpen,
    activeSidebarTab,
    setActiveSidebarTab,
    setCommandPaletteOpen,
    setTerminalOpen,
    setActiveBottomTab,
    appendTerminalOutput,
    addFile,
    saveFile,
    activeFileId,
    setNotification,
    debugSession,
    activeRightTab,
    setActiveRightTab,
    setCurrentProjectId,
    initProject
  } = useCodeStore();
  const { status: authStatus, _hasHydrated } = useAuthStore();

  // State for execution control and stdin input
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [showStdinModal, setShowStdinModal] = React.useState(false);
  const [stdinInput, setStdinInput] = React.useState('');
  const executionAbortRef = React.useRef<AbortController | null>(null);
  const executionLockRef = React.useRef(false);

  // Initialize Project on Mount
  React.useEffect(() => {
    if (!_hasHydrated || authStatus !== 'authenticated') {
      return;
    }

    let isMounted = true;
    const init = async () => {
      try {
        let pid = searchParams.get('projectId');
        if (!pid) {
          const projects = await codeService.getProjects();
          if (projects && projects.length > 0) {
            pid = projects[0].id;
          } else {
            const newProj = await codeService.createProject({ name: 'Default Project', description: 'Auto-created' });
            pid = newProj.id;
          }
        }
        if (isMounted && pid) {
          setCurrentProjectId(pid);
          await initProject();
        }
      } catch (err) {
        console.error('Failed to initialize project on mount:', err);
        if (isMounted) {
          setNotification({ message: 'Failed to initialize code workspace', type: 'error' });
        }
      }
    };
    init();
    return () => { isMounted = false; };
  }, [searchParams, setCurrentProjectId, initProject, setNotification, _hasHydrated, authStatus]);

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+P or Ctrl+P for Command Palette
      const normalizedKey = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && normalizedKey === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd+Shift+F or Ctrl+Shift+F for Search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && normalizedKey === 'f') {
        e.preventDefault();
        setSidebarOpen(true);
        setActiveSidebarTab('search');
      }
      // Cmd+Shift+D or Ctrl+Shift+D for Debug
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && normalizedKey === 'd') {
        e.preventDefault();
        setSidebarOpen(true);
        setActiveSidebarTab('debug');
      }
      // Cmd+Shift+G or Ctrl+Shift+G for Git
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && normalizedKey === 'g') {
        e.preventDefault();
        setSidebarOpen(true);
        setActiveSidebarTab('git');
      }
      // Cmd+Shift+T or Ctrl+Shift+T for Tests
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && normalizedKey === 't') {
        e.preventDefault();
        setSidebarOpen(true);
        setActiveSidebarTab('test');
      }
      // Cmd+B or Ctrl+B for Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && normalizedKey === 'b') {
        e.preventDefault();
        setSidebarOpen(!useCodeStore.getState().isSidebarOpen);
      }
      // Cmd+S or Ctrl+S for Save (Global Fallback)
      if ((e.metaKey || e.ctrlKey) && normalizedKey === 's') {
        e.preventDefault();
        if (activeFileId) {
          void (async () => {
            const saved = await saveFile(activeFileId);
            setNotification({ message: saved ? 'File saved' : 'Save failed', type: saved ? 'success' : 'error' });
          })();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, activeFileId, setSidebarOpen, setActiveSidebarTab, setCommandPaletteOpen, saveFile, setNotification]);

  // Sidebar stays in its current state when entering Code Lab
  // (removed auto-close behavior)

  const handleRunProject = async (withStdin: boolean = false) => {
    const { files, activeFileId, setNotification, setTerminalOpen, setActiveBottomTab } = useCodeStore.getState();

    if (executionLockRef.current) {
      setNotification({ message: 'Execution already in progress', type: 'info' });
      return;
    }
    
    if (!activeFileId) {
      setNotification({ message: 'No file selected to run', type: 'error' });
      return;
    }
    
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile || activeFile.type !== 'file') {
      setNotification({ message: 'Please select a file to run', type: 'error' });
      return;
    }
    
    if (!activeFile.content) {
      setNotification({ message: 'File is empty', type: 'error' });
      return;
    }
    
    // Check if code uses input() or similar
    const needsInput = activeFile.content.includes('input(') || 
                       activeFile.content.includes('Scanner') ||
                       activeFile.content.includes('gets') ||
                       activeFile.content.includes('readline');
    
    if (needsInput && !withStdin) {
      setShowStdinModal(true);
      return;
    }
    
    const abortController = new AbortController();
    executionAbortRef.current = abortController;
    executionLockRef.current = true;

    setTerminalOpen(true);
    setActiveBottomTab('terminal');
    setNotification({ message: `Running ${activeFile.name}...`, type: 'info' });
    setIsExecuting(true);
    
    try {
      // Call backend API to execute code
      const response = await fetch('http://localhost:8000/api/v1/code/execute-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language || 'python',
          filename: activeFile.name,
          stdin_data: withStdin ? stdinInput : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Format output for terminal with proper line breaks
      let output = `\r\n\x1b[33m[Running ${activeFile.name}]\x1b[0m\r\n`;
      output += `\x1b[34m[Language: ${result.language}]\x1b[0m\r\n`;
      output += `\x1b[34m[Execution time: ${result.execution_time}s]\x1b[0m\r\n`;
      if (withStdin) {
        output += `\x1b[34m[Input provided: ${stdinInput.split('\n').length} line(s)]\x1b[0m\r\n`;
      }
      output += '─'.repeat(60) + '\r\n';
      
      if (result.success) {
        const stdout = String(result.stdout ?? '');
        const stderr = String(result.stderr ?? '');
        output += `\x1b[32m[Output]\x1b[0m\r\n`;
        // Process stdout to ensure proper line endings
        const processedStdout = stdout.replace(/\n/g, '\r\n');
        output += processedStdout;
        if (stderr.trim()) {
          const processedStderr = stderr.replace(/\n/g, '\r\n');
          output += `\r\n\x1b[33m[Warnings]\x1b[0m\r\n${processedStderr}`;
        }
        output += `\r\n\x1b[32m✓ Execution completed successfully\x1b[0m`;
        setNotification({ message: 'Code executed successfully', type: 'success' });
      } else {
        const stderr = String(result.stderr ?? '');
        const fallbackError = String(result.error ?? 'Unknown execution error');
        const stdout = String(result.stdout ?? '');
        output += `\x1b[31m[Error]\x1b[0m\r\n`;
        const errorOutput = stderr || fallbackError;
        const processedError = errorOutput.replace(/\n/g, '\r\n');
        output += processedError;
        if (stdout.trim()) {
          const processedStdout = stdout.replace(/\n/g, '\r\n');
          output += `\r\n\x1b[34m[Partial Output]\x1b[0m\r\n${processedStdout}`;
        }
        output += `\r\n\x1b[31m✗ Execution failed\x1b[0m`;
        setNotification({ message: 'Execution failed', type: 'error' });
      }
      
      appendTerminalOutput(output);
      
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        appendTerminalOutput('\r\n\x1b[31m[Execution aborted]\x1b[0m\r\n');
        return;
      }
      const errorMsg = `Error: ${error.message}\r\n\r\nMake sure the backend is running on http://localhost:8000`;
      appendTerminalOutput(`\r\n\x1b[31m${errorMsg}\x1b[0m\r\n`);
      setNotification({ message: 'Failed to execute code', type: 'error' });
    } finally {
      executionLockRef.current = false;
      executionAbortRef.current = null;
      setIsExecuting(false);
      setShowStdinModal(false);
      setStdinInput('');
    }
  };

  const handleStopExecution = () => {
    executionAbortRef.current?.abort();
    executionAbortRef.current = null;
    executionLockRef.current = false;
    setIsExecuting(false);
    setNotification({ message: 'Execution stopped', type: 'info' });
    appendTerminalOutput('\r\n\x1b[31m[Stopped by user]\x1b[0m\r\n');
  };

  const handleSearch = () => {
    setSidebarOpen(true);
    setActiveSidebarTab('search');
  };

  const handleDebug = () => {
    setSidebarOpen(true);
    setActiveSidebarTab('debug');
  };

  const handleGit = () => {
    setSidebarOpen(true);
    setActiveSidebarTab('git');
  };

  const handleTest = () => {
    setSidebarOpen(true);
    setActiveSidebarTab('test');
  };

  const handleTeam = () => {
    setSidebarOpen(true);
    setActiveSidebarTab('team');
  };

  const handleNewFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      addFile(fileName, 'file');
      setNotification({ message: `Created file: ${fileName}`, type: 'success' });
    }
  };

  return (
    <div className={styles.codelab}>
      {/* 
        Professional IDE Layout
        Powered by CSS Modules (codelab.module.css)
      */}
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `${isSidebarOpen ? '280px' : '0px'} 1fr ${isAIRefineOpen ? '380px' : '48px'}`,
        }}
      >

        {/* --- HEADER --- */}
        <div className={`${styles.header} backdrop-blur-md bg-white/80`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center bg-[#2563EB] text-white shadow-sm">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[#0F172A] tracking-tight">Code Studio</span>
            </div>

            <div className="h-4 w-[1px] bg-[#CBD5E1]" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarOpen(!useCodeStore.getState().isSidebarOpen)}
                className={styles.button}
                title="Toggle Sidebar"
              >
                <Layout className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setSidebarOpen(true); setActiveSidebarTab('explorer'); }}
                className={`${styles.button} ${activeSidebarTab === 'explorer' && isSidebarOpen ? '!text-[#2563EB] !bg-[#EEF2FF]' : ''}`}
                title="File Explorer"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={handleSearch}
                className={styles.button}
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={handleDebug}
                className={styles.button}
                title="Debug"
              >
                <Bug className="w-4 h-4" />
              </button>
              <button
                onClick={handleGit}
                className={styles.button}
                title="Source Control"
              >
                <GitBranch className="w-4 h-4" />
              </button>
              <button
                onClick={handleTest}
                className={styles.button}
                title="Test Runner"
              >
                <Beaker className="w-4 h-4" />
              </button>
              <button
                onClick={handleTeam}
                className={styles.button}
                title="Team Chat"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={handleNewFile}
                className={styles.button}
                title="New File"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const activeFile = activeFileId || 'Code Change';
                router.push(`/decisionvault?source=code&title=${encodeURIComponent(`Refactor: ${activeFile}`)}&problem=${encodeURIComponent(`Architectural decision required for ${activeFile}`)}`);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all text-xs font-bold shadow-sm"
              title="Log Architecture Decision"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Log Decision</span>
            </button>

            <div className="h-4 w-[1px] bg-[#CBD5E1] mx-1" />

            {isExecuting ? (
              <button
                onClick={handleStopExecution}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all text-xs font-medium"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => handleRunProject(false)}
                className={styles['button-primary']}
              >
                <Play className="w-3 h-3 fill-current" />
                Run
              </button>
            )}

            <div className="h-4 w-[1px] bg-[#E2E8F0] mx-1" />

            <button
              onClick={() => setNotification({ message: 'Settings', type: 'info' })}
              className={styles.button}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- LEFT SIDEBAR (EXPLORER) --- */}
        <aside className={styles.explorer}>
          <div className={`h-full w-[280px] flex flex-col ${!isSidebarOpen && 'hidden'}`}>
            {/* Sidebar Header */}
            <div className="h-9 flex items-center justify-between px-3 border-b border-[#CBD5E1] bg-[#F1F5F9]">
              <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                {activeSidebarTab === 'explorer' && 'Explorer'}
                {activeSidebarTab === 'search' && 'Search'}
                {activeSidebarTab === 'debug' && 'Debug'}
                {activeSidebarTab === 'git' && 'Source Control'}
                {activeSidebarTab === 'test' && 'Test Runner'}
                {activeSidebarTab === 'team' && 'Team Chat'}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-[#E2E8F0] rounded transition-all text-[#475569] hover:text-[#0F172A]"
                title="Close Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            {activeSidebarTab === 'explorer' && <FileExplorer />}
            {activeSidebarTab === 'search' && <GlobalSearch />}
            {activeSidebarTab === 'debug' && <DebugSidebar />}
            {activeSidebarTab === 'git' && <GitSidebar />}
            {activeSidebarTab === 'test' && <TestRunner />}
            {activeSidebarTab === 'team' && <TeamChat />}
          </div>
        </aside>

        {/* --- MAIN EDITOR --- */}
        <main className={styles.editor}>
          {/* Tabs */}
          <div className="flex flex-col border-b border-[#CBD5E1] bg-[#F8FAFC]">
            <EditorTabs />
            <Breadcrumbs />
            {debugSession.status !== 'idle' && <DebugToolbar />}
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <CodeEditor />
          </div>

          {/* Terminal */}
          <div className={styles.terminal}>
            <BottomPanel />
          </div>
        </main>

        {/* --- RIGHT PANEL (AI REFINE) --- */}
        <aside className={styles.panel}>
          {isAIRefineOpen ? (
            <div className="flex flex-col h-full w-full">
              {/* Right Panel Tabs */}
              <div className="flex items-center border-b border-[#CBD5E1] bg-[#F1F5F9]">
                <button
                  onClick={() => setActiveRightTab('ai')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-r border-[#CBD5E1] transition-colors ${
                    activeRightTab === 'ai'
                      ? 'bg-white text-[#2563EB] border-t-2 border-t-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Refine
                </button>
                <button
                  onClick={() => setActiveRightTab('preview')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-r border-[#CBD5E1] transition-colors ${
                    activeRightTab === 'preview'
                      ? 'bg-white text-[#2563EB] border-t-2 border-t-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Preview
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setAIRefineOpen(false)}
                  className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]"
                  title="Close Panel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {activeRightTab === 'ai' && <AIRefinePanel />}
                {activeRightTab === 'preview' && <PreviewPanel />}
              </div>
            </div>
          ) : (
            // Collapsed State
            <div className="w-full h-full flex flex-col items-center py-3 gap-3 bg-[#F1F5F9]">
              <button
                onClick={() => { setAIRefineOpen(true); setActiveRightTab('ai'); }}
                className={styles.button}
                title="Open AI Refine"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setAIRefineOpen(true); setActiveRightTab('preview'); }}
                className={styles.button}
                title="Open Preview"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <div className="w-5 h-[1px] bg-[#CBD5E1]" />
              <button
                onClick={() => { setSidebarOpen(true); setActiveSidebarTab('search'); }}
                className={styles.button}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* --- STATUS BAR --- */}
        <div className={styles.statusbar}>
          <StatusBar />
        </div>

      </div>

      <NotificationOverlay />
      <CommandPalette />
      
      {/* Stdin Input Modal */}
      {showStdinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Provide Input</h3>
            <p className="text-sm text-gray-600 mb-4">
              This program requires input. Enter the values below (one per line):
            </p>
            <textarea
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              placeholder="Enter input here...\nExample:\nJohn\n25"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleRunProject(true)}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
              >
                Run with Input
              </button>
              <button
                onClick={() => setShowStdinModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
