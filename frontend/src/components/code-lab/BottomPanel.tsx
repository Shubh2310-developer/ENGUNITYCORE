'use client';

import React, { useState } from 'react';
import { Terminal as TerminalIcon, Info, AlertCircle, ListTodo, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Terminal } from './Terminal';
import { useCodeStore } from '@/stores/codeStore';

export const BottomPanel = () => {
  const { isTerminalOpen, setTerminalOpen, activeBottomTab, setActiveBottomTab } = useCodeStore();

  if (!isTerminalOpen) {
    return (
      <div className="h-8 border-t border-white/5 bg-void-900 flex items-center px-4 justify-between">
        <button
          onClick={() => setTerminalOpen(true)}
          className="flex items-center gap-2 text-[10px] font-bold text-starlight-400/50 uppercase tracking-widest hover:text-primary transition-colors"
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
    { id: 'console', label: 'Console', icon: Info },
    { id: 'errors', label: 'Errors', icon: AlertCircle },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
  ] as const;

  return (
    <div className="h-64 flex flex-col border-t border-white/5 bg-void-950/40 backdrop-blur-2xl relative">
      <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
      <div className="flex items-center justify-between px-2 bg-void-900/40 border-b border-white/5 relative z-10">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveBottomTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                activeBottomTab === tab.id
                  ? 'text-primary border-b border-primary'
                  : 'text-starlight-400/40 hover:text-starlight-400'
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
            className="p-1 hover:bg-white/5 rounded text-starlight-400/40 hover:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeBottomTab === 'terminal' && <Terminal />}
        {activeBottomTab === 'console' && (
          <div className="p-4 font-mono text-xs space-y-1">
            <div className="flex gap-2 text-starlight-400/40">
              <span>[14:20:01]</span>
              <span className="text-blue-400">INFO</span>
              <span>DevServer started on http://localhost:3000</span>
            </div>
            <div className="flex gap-2 text-starlight-400/40">
              <span>[14:20:05]</span>
              <span className="text-primary">DONE</span>
              <span>Compiled successfully in 1240ms</span>
            </div>
            <div className="pt-2 animate-pulse text-primary/40">_</div>
          </div>
        )}
        {activeBottomTab === 'errors' && (
          <div className="p-4 font-mono text-xs text-starlight-400/60 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-500 bg-green-500/5 border border-green-500/10 p-2 rounded-lg w-fit">
              <span className="text-lg">✓</span> No problems detected in the workspace.
            </div>
            <div className="text-[10px] text-starlight-400/20 uppercase tracking-widest pl-1">
              Last scan: 2 minutes ago
            </div>
          </div>
        )}
        {activeBottomTab === 'tasks' && (
          <div className="p-4 font-mono text-xs text-starlight-400/60 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 group">
                <div className="w-4 h-4 rounded border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <div className="w-2 h-2 rounded-sm bg-primary/20" />
                </div>
                <span className="text-starlight-100">Implement parallel encoding in generator.py</span>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-starlight-400/40">TODO</span>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-4 h-4 rounded border border-primary bg-primary flex items-center justify-center">
                  <span className="text-[10px] text-void-950 font-bold">✓</span>
                </div>
                <span className="text-starlight-100 line-through">Initialize model weights</span>
                <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary">DONE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
