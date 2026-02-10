import React, { useState, useRef, useEffect } from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { Terminal, ChevronRight } from 'lucide-react';

export const DebugConsole = () => {
  const { debugSession } = useCodeStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debugSession.status]); // Should also depend on output updates if we had them

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Handle REPL input execution here
      // For now, just clear
      setInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-void-950 font-mono text-xs">
      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
        <div className="text-starlight-400/50 italic mb-4">
          Debug Console - {debugSession.status === 'idle' ? 'Not connected' : `Connected (Session: ${debugSession.id.substring(0, 8)}...)`}
        </div>

        {/* Placeholder for debug output history */}
        {debugSession.status === 'running' && (
            <div className="text-green-400">Process started...</div>
        )}
        {debugSession.status === 'paused' && (
            <div className="text-yellow-400">Process paused at line {debugSession.currentLine}</div>
        )}
        {debugSession.status === 'stopped' && (
            <div className="text-red-400">Process terminated with exit code 0</div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 p-2 flex items-center gap-2 bg-void-900/50">
        <ChevronRight className="w-4 h-4 text-cyber-teal" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-starlight-200 placeholder-starlight-400/30"
          placeholder="Evaluate expression..."
          disabled={debugSession.status === 'idle'}
        />
      </div>
    </div>
  );
};
