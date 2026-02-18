import React from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { Play, Pause, Square, SkipForward, ArrowRight, CornerDownRight } from 'lucide-react';

export const DebugToolbar = () => {
  const { debugSession, startDebugSession, stopDebugSession, stepOver, continueDebug, activeFileId } = useCodeStore();
  const isRunning = debugSession.status === 'running' || debugSession.status === 'paused';

  const handleStart = () => {
    if (activeFileId) {
      startDebugSession(activeFileId);
    }
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] border-b border-[#CBD5E1] shadow-sm">
      {!isRunning ? (
        <button
          onClick={handleStart}
          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-[10px] font-bold uppercase transition-all"
          title="Start Debugging"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Debug
        </button>
      ) : (
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#E2E8F0] shadow-sm">
          <button
            onClick={() => continueDebug()}
            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
            title="Continue"
          >
            {debugSession.status === 'paused' ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>
          <div className="w-[1px] h-4 bg-[#E2E8F0]" />
          <button
            onClick={() => stepOver()}
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
            title="Step Over"
          >
            <CornerDownRight className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-[#E2E8F0]" />
          <button
            onClick={() => stopDebugSession()}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
            title="Stop"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
};
