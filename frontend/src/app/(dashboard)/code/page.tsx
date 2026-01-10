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
  Code2
} from 'lucide-react';
import { FileExplorer } from '@/components/code-lab/FileExplorer';
import { GlobalSearch } from '@/components/code-lab/GlobalSearch';
import { EditorTabs } from '@/components/code-lab/EditorTabs';
import { Breadcrumbs } from '@/components/code-lab/Breadcrumbs';
import { CodeEditor } from '@/components/code-lab/CodeEditor';
import { BottomPanel } from '@/components/code-lab/BottomPanel';
import { StatusBar } from '@/components/code-lab/StatusBar';
import { AIRefinePanel } from '@/components/code-lab/AIRefinePanel';
import { NotificationOverlay } from '@/components/code-lab/NotificationOverlay';
import { CommandPalette } from '@/components/code-lab/CommandPalette';
import { useCodeStore } from '@/stores/codeStore';
import styles from './codelab.module.css';

export default function CodeLabPage() {
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
    runCommand,
    addFile,
    saveFile,
    activeFileId,
    setNotification
  } = useCodeStore();

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+P or Ctrl+P for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd+Shift+F or Ctrl+Shift+F for Search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setSidebarOpen(true);
        setActiveSidebarTab('search');
      }
      // Cmd+B or Ctrl+B for Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!isSidebarOpen);
      }
      // Cmd+S or Ctrl+S for Save (Global Fallback)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeFileId) {
          saveFile(activeFileId);
          setNotification({ message: 'File saved', type: 'success' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, activeFileId, setSidebarOpen, setActiveSidebarTab, setCommandPaletteOpen, saveFile, setNotification]);

  // Sidebar stays in its current state when entering Code Lab
  // (removed auto-close behavior)

  const handleRunProject = () => {
    setTerminalOpen(true);
    setActiveBottomTab('terminal');
    runCommand('python generator.py --mode production --batch-size 1024');
    setNotification({ message: 'Project execution started', type: 'info' });
  };

  const handleSearch = () => {
    setSidebarOpen(true);
    setActiveSidebarTab('search');
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
        <div className={styles.header}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center bg-[#2563EB] text-white">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">Code Studio</span>
            </div>

            <div className="h-4 w-[1px] bg-[#E2E8F0]" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className={styles.button}
                title="Toggle Sidebar"
              >
                <Layout className="w-4 h-4" />
              </button>
              <button
                onClick={handleSearch}
                className={styles.button}
                title="Search"
              >
                <Search className="w-4 h-4" />
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
              onClick={handleRunProject}
              className={styles['button-primary']}
            >
              <Play className="w-3 h-3 fill-current" />
              Run
            </button>

            <div className="h-4 w-[1px] bg-[#E2E8F0] mx-1" />

            <button
              onClick={() => setNotification({ message: 'Settings', type: 'info' })}
              className={styles.button}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- LEFT SIDEBAR (EXPLORER) --- */}
        <aside className={styles.explorer}>
          <div className={`h-full w-[280px] flex flex-col ${!isSidebarOpen && 'hidden'}`}>
            {/* Sidebar Header */}
            <div className="h-9 flex items-center justify-between px-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">
                {activeSidebarTab === 'explorer' ? 'Explorer' : 'Search'}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-[#E0E7FF] rounded transition-all text-[#475569] hover:text-[#0F172A]"
                title="Close Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            {activeSidebarTab === 'explorer' ? <FileExplorer /> : <GlobalSearch />}
          </div>
        </aside>

        {/* --- MAIN EDITOR --- */}
        <main className={styles.editor}>
          {/* Tabs */}
          <div className="flex flex-col border-b border-[#E2E8F0]">
            <EditorTabs />
            <Breadcrumbs />
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
            <AIRefinePanel />
          ) : (
            // Collapsed State
            <div className="w-full h-full flex flex-col items-center py-3 gap-3 bg-[#F1F5F9]">
              <button
                onClick={() => setAIRefineOpen(true)}
                className={styles.button}
                title="Open AI Refine"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <div className="w-5 h-[1px] bg-[#E2E8F0]" />
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
    </div>
  );
}
