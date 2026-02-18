'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal as TerminalIcon, Info, AlertCircle, ListTodo, ChevronUp, ChevronDown, Bug, CheckCircle2 } from 'lucide-react';
import { Terminal } from './Terminal';
import { DebugConsole } from './DebugConsole';
import { useCodeStore } from '@/stores/codeStore';

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 256;

export const BottomPanel = () => {
  const { isTerminalOpen, setTerminalOpen, activeBottomTab, setActiveBottomTab } = useCodeStore();
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = panelHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [panelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight.current + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isTerminalOpen) {
    return (
      <div className="h-8 border-t border-[#CBD5E1] bg-[#F1F5F9] flex items-center px-4 justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setTerminalOpen(true)}
          className="flex items-center gap-2 text-[10px] font-bold text-[#475569] uppercase tracking-wider hover:text-[#2563EB] transition-colors"
        >
          <TerminalIcon className="w-3 h-3" />
          Terminal
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'debug_console', label: 'Debug Console', icon: Bug },
    { id: 'console', label: 'Console', icon: Info },
    { id: 'errors', label: 'Errors', icon: AlertCircle },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
  ] as const;

  return (
    <div className="flex flex-col border-t border-[#CBD5E1] bg-white relative" style={{ height: panelHeight }}>
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 right-0 h-[6px] cursor-row-resize z-20 group flex items-center justify-center -translate-y-1/2 hover:bg-[#2563EB]/10 transition-colors"
      >
        <div className="w-10 h-1 rounded-full bg-[#CBD5E1] group-hover:bg-[#2563EB] transition-colors" />
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-between px-2 bg-[#F1F5F9] border-b border-[#CBD5E1] relative z-10 shrink-0">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveBottomTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeBottomTab === tab.id
                  ? 'text-[#2563EB] border-[#2563EB] bg-white'
                  : 'text-[#64748B] border-transparent hover:text-[#0F172A] hover:bg-[#E2E8F0]'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={() => setTerminalOpen(false)}
            className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden relative bg-white">
        <div className={`h-full w-full absolute inset-0 ${activeBottomTab === 'terminal' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <Terminal />
        </div>
        <div className={`h-full w-full absolute inset-0 ${activeBottomTab === 'debug_console' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <DebugConsole />
        </div>
        <div className={`h-full w-full absolute inset-0 p-4 font-mono text-xs space-y-2 bg-[#0F172A] ${activeBottomTab === 'console' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="flex gap-2 text-[#94A3B8]">
            <span className="text-[#475569]">[14:20:01]</span>
            <span className="text-blue-400 font-bold">INFO</span>
            <span className="text-[#E2E8F0]">DevServer started on http://localhost:3000</span>
          </div>
          <div className="flex gap-2 text-[#94A3B8]">
            <span className="text-[#475569]">[14:20:05]</span>
            <span className="text-emerald-400 font-bold">DONE</span>
            <span className="text-[#E2E8F0]">Compiled successfully in 1240ms</span>
          </div>
          <div className="pt-2 animate-pulse text-blue-400 font-bold">_</div>
        </div>
        <div className={`h-full w-full absolute inset-0 p-4 font-mono text-xs text-[#94A3B8] flex flex-col gap-3 bg-[#0F172A] ${activeBottomTab === 'errors' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg w-fit">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">No problems detected in the workspace.</span>
          </div>
        </div>
        <div className={`h-full w-full absolute inset-0 p-4 font-mono text-xs text-[#94A3B8] space-y-4 bg-[#0F172A] ${activeBottomTab === 'tasks' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-3 group">
              <div className="w-4 h-4 rounded border border-[#475569] flex items-center justify-center group-hover:border-[#2563EB]/50 transition-colors">
                <div className="w-2 h-2 rounded-sm bg-[#2563EB]/30" />
              </div>
              <span className="text-[#E2E8F0] font-medium">Implement parallel encoding in generator.py</span>
              <span className="text-[10px] bg-[#1E293B] px-1.5 py-0.5 rounded text-[#94A3B8] border border-[#334155] font-bold">TODO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
