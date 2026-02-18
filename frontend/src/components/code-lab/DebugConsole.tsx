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
    <div className="h-full flex flex-col bg-white font-mono text-[11px] leading-relaxed">
      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-6 flex items-center gap-2 opacity-60">
          <Terminal className="w-3 h-3" />
          Debug Console &middot; {debugSession.status === 'idle' ? 'DISCONNECTED' : `CONNECTED (${debugSession.id.substring(0, 8)})`}
        </div>

        {/* Placeholder for debug output history */}
        {debugSession.status === 'running' && (
          <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 p-2 rounded border border-emerald-100 shadow-sm w-fit animate-in slide-in-from-left-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Process started successfully...
          </div>
        )}
        {debugSession.status === 'paused' && (
          <div className="flex items-center gap-2 text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100 shadow-sm w-fit animate-in slide-in-from-left-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Process paused at line {debugSession.currentLine}
          </div>
        )}
        {debugSession.status === 'stopped' && (
          <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-2 rounded border border-red-100 shadow-sm w-fit animate-in slide-in-from-left-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Process terminated with exit code 0
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[#CBD5E1] p-2.5 flex items-center gap-2 bg-[#F1F5F9] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <ChevronRight className="w-4 h-4 text-[#2563EB]" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-white border border-[#CBD5E1] rounded-md px-2 py-1.5 outline-none text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 transition-all shadow-sm"
          placeholder="Evaluate expression (e.g. results.length)..."
          disabled={debugSession.status === 'idle'}
        />
      </div>
    </div>
  );
};
