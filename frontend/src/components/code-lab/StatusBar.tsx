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
    <div className="h-6 bg-void-900/80 backdrop-blur-md text-starlight-400 border-t border-white/5 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-widest select-none z-30">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 hover:text-primary px-2 h-full cursor-pointer transition-colors group">
          <GitBranch className="w-3 h-3 text-primary/60 group-hover:text-primary" />
          <span>main*</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-primary px-2 h-full cursor-pointer transition-colors group">
          <CheckCircle2 className="w-3 h-3 text-green-500/60 group-hover:text-green-500" />
          <span>No Errors</span>
        </div>
        {activeFile?.isDirty && (
          <div className="flex items-center gap-1.5 px-2 h-full text-primary/60 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Unsaved Changes</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 h-full px-2 opacity-60 tabular-nums">
          <Cpu className="w-3 h-3" />
          <span>CPU: {metrics.cpu}%</span>
        </div>
        <div className="flex items-center gap-1.5 h-full px-2 opacity-60 tabular-nums">
          <Memory className="w-3 h-3" />
          <span>RAM: {metrics.ram}GB / 16GB</span>
        </div>
        <div className="h-3 w-[1px] bg-white/10 mx-1" />
        <div className="flex items-center gap-1.5 h-full px-2 text-primary/80">
          <Wifi className="w-3 h-3 animate-pulse" />
          <span>Connected</span>
        </div>
        <div className="bg-white/5 px-3 h-full flex items-center font-mono text-starlight-100">
          {activeFile?.language || 'plaintext'}
        </div>
        <div className="bg-white/5 px-4 h-full flex items-center font-mono text-starlight-400/60 tabular-nums border-l border-white/5">
          LN {cursorPosition.ln}, COL {cursorPosition.col}
        </div>
        <button className="h-full px-2 hover:bg-white/5 hover:text-white transition-colors relative">
          <Bell className="w-3 h-3" />
          <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-primary rounded-full" />
        </button>
      </div>
    </div>
  );
};
