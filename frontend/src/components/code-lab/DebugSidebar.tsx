import React from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { Hash, List } from 'lucide-react';

export const DebugSidebar = () => {
  const { debugSession, breakpoints, files } = useCodeStore();

  const activeFile = files.find(f => f.id === debugSession.currentFileId);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] text-[#1E293B] text-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      {/* Variables Section */}
      <div className="flex-1 overflow-y-auto border-b border-[#E2E8F0] bg-white">
        <div className="p-2.5 bg-[#F8FAFC] font-bold text-[10px] uppercase tracking-wider text-[#64748B] flex items-center gap-2 border-b border-[#E2E8F0]">
          <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
          Variables
        </div>
        <div className="p-2">
          {Object.keys(debugSession.variables).length === 0 ? (
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] text-center py-4 opacity-50">No variables</div>
          ) : (
            <div className="space-y-1 px-1">
              {Object.entries(debugSession.variables.locals || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between font-mono text-[11px] p-1.5 rounded hover:bg-[#F1F5F9] transition-colors border border-transparent hover:border-[#E2E8F0]">
                  <span className="text-[#2563EB] font-bold">{key}:</span>
                  <span className="text-[#0F172A]">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breakpoints Section */}
      <div className="flex-1 overflow-y-auto border-b border-[#E2E8F0] bg-white">
        <div className="p-2.5 bg-[#F8FAFC] font-bold text-[10px] uppercase tracking-wider text-[#64748B] flex items-center gap-2 border-b border-[#E2E8F0]">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200" />
          Breakpoints
        </div>
        <div className="p-2 space-y-1">
          {Object.entries(breakpoints).map(([fileId, lines]) => {
            const file = files.find(f => f.id === fileId);
            return lines.map(line => (
              <div key={`${fileId}-${line}`} className="flex items-center gap-2 text-xs hover:bg-[#F1F5F9] p-2 rounded-md cursor-pointer group transition-colors border border-transparent hover:border-[#E2E8F0]">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="truncate flex-1 font-medium text-[#1E293B]">{file?.name || 'Unknown'}</span>
                <span className="font-mono text-[#2563EB] bg-blue-50 px-1 rounded border border-blue-100">:{line}</span>
              </div>
            ));
          })}
          {Object.keys(breakpoints).length === 0 && (
            <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest text-center py-4 opacity-50">No breakpoints</div>
          )}
        </div>
      </div>

      {/* Call Stack Section */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="p-2.5 bg-[#F1F5F9] font-bold text-[10px] uppercase tracking-wider text-[#64748B] flex items-center gap-2 border-b border-[#E2E8F0]">
          <List className="w-3.5 h-3.5 text-[#2563EB]" />
          Call Stack
        </div>
        <div className="p-3">
           {debugSession.callStack.length === 0 ? (
             <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest text-center py-2 opacity-50">Not running</div>
           ) : (
             <div className="space-y-1">
               <div className="text-[11px] font-bold font-mono text-[#2563EB] bg-white p-2 rounded border border-[#E2E8F0] shadow-sm">Main Thread</div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
