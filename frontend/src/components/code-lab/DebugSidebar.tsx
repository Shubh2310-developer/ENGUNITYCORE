import React from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { Bug, Hash, List } from 'lucide-react';

export const DebugSidebar = () => {
  const { debugSession, breakpoints, files } = useCodeStore();

  const activeFile = files.find(f => f.id === debugSession.currentFileId);

  return (
    <div className="h-full flex flex-col bg-void-950 text-starlight-400 text-sm">
      <div className="p-3 font-semibold text-xs uppercase tracking-wider border-b border-white/5 flex items-center gap-2">
        <Bug className="w-4 h-4" />
        Debug
      </div>

      {/* Variables Section */}
      <div className="flex-1 overflow-y-auto border-b border-white/5">
        <div className="p-2 bg-void-900 font-medium text-xs flex items-center gap-2">
          <Hash className="w-3 h-3" />
          Variables
        </div>
        <div className="p-2">
          {Object.keys(debugSession.variables).length === 0 ? (
            <div className="text-xs text-starlight-400/50 italic">No variables available</div>
          ) : (
            <div className="space-y-1">
              {Object.entries(debugSession.variables.locals || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between font-mono text-xs">
                  <span className="text-cyber-teal">{key}:</span>
                  <span className="text-starlight-200">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breakpoints Section */}
      <div className="flex-1 overflow-y-auto border-b border-white/5">
        <div className="p-2 bg-void-900 font-medium text-xs flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          Breakpoints
        </div>
        <div className="p-2 space-y-1">
          {Object.entries(breakpoints).map(([fileId, lines]) => {
            const file = files.find(f => f.id === fileId);
            return lines.map(line => (
              <div key={`${fileId}-${line}`} className="flex items-center gap-2 text-xs hover:bg-white/5 p-1 rounded cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="truncate flex-1">{file?.name || 'Unknown'}</span>
                <span className="font-mono text-starlight-400/70">:{line}</span>
              </div>
            ));
          })}
          {Object.keys(breakpoints).length === 0 && (
            <div className="text-xs text-starlight-400/50 italic">No breakpoints set</div>
          )}
        </div>
      </div>

      {/* Call Stack Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 bg-void-900 font-medium text-xs flex items-center gap-2">
          <List className="w-3 h-3" />
          Call Stack
        </div>
        <div className="p-2">
           {debugSession.callStack.length === 0 ? (
             <div className="text-xs text-starlight-400/50 italic">Not running</div>
           ) : (
             <div className="space-y-1">
               {/* Placeholder for call stack items */}
               <div className="text-xs font-mono text-starlight-200">Main</div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
