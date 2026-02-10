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
    <div className="flex items-center gap-1 p-1 bg-void-900 border-b border-white/5">
      {!isRunning ? (
        <button
          onClick={handleStart}
          className="p-1 hover:bg-green-500/20 text-green-500 rounded"
          title="Start Debugging"
        >
          <Play className="w-4 h-4" />
        </button>
      ) : (
        <>
          <button
            onClick={() => continueDebug()}
            className="p-1 hover:bg-green-500/20 text-green-500 rounded"
            title="Continue"
          >
            {debugSession.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => stepOver()}
            className="p-1 hover:bg-blue-500/20 text-blue-500 rounded"
            title="Step Over"
          >
            <CornerDownRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => stopDebugSession()}
            className="p-1 hover:bg-red-500/20 text-red-500 rounded"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
