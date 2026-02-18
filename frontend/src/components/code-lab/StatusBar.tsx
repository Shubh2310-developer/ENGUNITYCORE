'use client';

import React from 'react';
import { Cpu, MemoryStick as Memory, GitBranch, CheckCircle2, Wifi, Bell } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';

export const StatusBar = () => {
  const { files, activeFileId, cursorPosition } = useCodeStore();
  const activeFile = files.find(f => f.id === activeFileId);
  const [metrics, setMetrics] = React.useState({ cpu: 12, ram: 4.2 });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 15) + 5, // 5-20%
        ram: Number((4.1 + Math.random() * 0.3).toFixed(1)) // 4.1-4.4GB
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-6 bg-[#F1F5F9] backdrop-blur-md text-[#475569] border-t border-[#CBD5E1] flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider select-none z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 hover:text-[#2563EB] px-2 h-full cursor-pointer transition-colors group">
          <GitBranch className="w-3 h-3 text-[#2563EB]/60 group-hover:text-[#2563EB]" />
          <span>main*</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-[#2563EB] px-2 h-full cursor-pointer transition-colors group">
          <CheckCircle2 className="w-3 h-3 text-emerald-500/80 group-hover:text-emerald-600" />
          <span>No Errors</span>
        </div>
        {activeFile?.isDirty && (
          <div className="flex items-center gap-1.5 px-2 h-full text-[#2563EB]/60 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>Unsaved</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 h-full px-2 opacity-80 tabular-nums">
          <Cpu className="w-3 h-3 text-[#2563EB]" />
          <span>CPU: {metrics.cpu}%</span>
        </div>
        <div className="flex items-center gap-1.5 h-full px-2 opacity-80 tabular-nums border-r border-[#CBD5E1]">
          <Memory className="w-3 h-3 text-[#2563EB]" />
          <span>RAM: {metrics.ram}GB</span>
        </div>
        <div className="flex items-center gap-1.5 h-full px-2 text-[#2563EB]">
          <Wifi className="w-3 h-3 animate-pulse" />
          <span>Connected</span>
        </div>
        <div className="bg-[#E2E8F0] px-3 h-full flex items-center font-mono text-[#1E293B]">
          {activeFile?.language || 'plaintext'}
        </div>
        <div className="bg-[#E2E8F0] px-4 h-full flex items-center font-mono text-[#475569] tabular-nums border-l border-[#CBD5E1]">
          LN {cursorPosition.ln}, COL {cursorPosition.col}
        </div>
        <button className="h-full px-2 hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors relative">
          <Bell className="w-3 h-3" />
          <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-red-500 rounded-full" />
        </button>
      </div>
    </div>
  );
};
