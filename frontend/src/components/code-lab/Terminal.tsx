'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';
import { TerminalInstance } from './TerminalInstance';

export const Terminal = () => {
  const [isClient, setIsClient] = useState(false);
  const {
    terminals,
    activeTerminalId,
    addTerminal,
    removeTerminal,
    setActiveTerminal
  } = useCodeStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full bg-[#F8FAFC] p-2 flex items-center justify-center border-t border-[#CBD5E1]">
        <div className="text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest animate-pulse">Loading terminal...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Terminal Tabs */}
      <div className="flex items-center bg-[#F1F5F9] border-b border-[#CBD5E1] px-2 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
          {terminals.map((term) => (
            <div
              key={term.id}
              className={`
                group flex items-center gap-2 px-3 py-2 text-[11px] font-bold cursor-pointer border-r border-[#CBD5E1] min-w-[120px] max-w-[200px] transition-all
                ${activeTerminalId === term.id
                  ? 'bg-white text-[#2563EB] border-t-2 border-t-[#2563EB] shadow-sm'
                  : 'text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] border-t-2 border-t-transparent'
                }
              `}
              onClick={() => setActiveTerminal(term.id)}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span className="truncate flex-1 tracking-tight">{term.name}</span>
              <button
                className={`
                  opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/5 transition-all
                  ${activeTerminalId === term.id ? 'opacity-100' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTerminal(term.id);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#E2E8F0] transition-all rounded-md active:scale-95"
          onClick={() => addTerminal()}
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Instances */}
      <div className="flex-1 min-h-0 relative bg-[#0F172A]">
        {terminals.map((term) => (
          <TerminalInstance
            key={term.id}
            projectId="default-project"
            isActive={activeTerminalId === term.id}
          />
        ))}

        {terminals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#94A3B8] bg-[#F8FAFC]">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center mb-4">
               <TerminalIcon className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-xs uppercase tracking-widest opacity-60">No active terminal</p>
            <button
              className="mt-6 px-5 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-all shadow-md active:scale-95 font-bold text-xs"
              onClick={() => addTerminal()}
            >
              Open New Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
