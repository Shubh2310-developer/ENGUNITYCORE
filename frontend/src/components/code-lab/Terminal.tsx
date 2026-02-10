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
      <div className="h-full bg-void-950 p-2 flex items-center justify-center">
        <div className="text-starlight-400">Loading terminal...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-void-950">
      {/* Terminal Tabs */}
      <div className="flex items-center bg-void-900 border-b border-white/5 px-2">
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
          {terminals.map((term) => (
            <div
              key={term.id}
              className={`
                group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-white/5 min-w-[120px] max-w-[200px]
                ${activeTerminalId === term.id
                  ? 'bg-void-800 text-cyber-teal border-t-2 border-t-cyber-teal'
                  : 'text-starlight-400 hover:bg-void-800 hover:text-starlight-200 border-t-2 border-t-transparent'
                }
              `}
              onClick={() => setActiveTerminal(term.id)}
            >
              <TerminalIcon className="w-3 h-3" />
              <span className="truncate flex-1">{term.name}</span>
              <button
                className={`
                  opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10
                  ${activeTerminalId === term.id ? 'opacity-100' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTerminal(term.id);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <button
          className="p-2 text-starlight-400 hover:text-cyber-teal hover:bg-void-800 transition-colors"
          onClick={() => addTerminal()}
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Instances */}
      <div className="flex-1 min-h-0 relative">
        {terminals.map((term) => (
          <TerminalInstance
            key={term.id}
            // In a real app, projectId would come from activeProject or store
            // For now, using a consistent ID to attach to the same backend session container if needed,
            // or we could use term.id as part of the session to isolate them.
            // The backend implementation creates a unique session per websocket connection (TerminalSession class)
            // so we can pass the same project ID and get independent shells.
            projectId="default-project"
            isActive={activeTerminalId === term.id}
          />
        ))}

        {terminals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-starlight-400">
            <p className="mb-4">No open terminals</p>
            <button
              className="px-4 py-2 bg-cyber-teal/10 text-cyber-teal rounded-lg hover:bg-cyber-teal/20 transition-all border border-cyber-teal/20"
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
