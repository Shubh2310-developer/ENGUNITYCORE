'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';

export const EditorTabs = () => {
  const { files, openFileIds, activeFileId, setActiveFile, closeFile } = useCodeStore();

  const openFiles = files.filter(f => openFileIds.includes(f.id));

  if (openFiles.length === 0) {
    return <div className="h-9 bg-[#E5E7EB] border-b border-[#E2E8F0]" />;
  }

  return (
    <div className="flex bg-[#E5E7EB] border-b border-[#E2E8F0] overflow-x-auto no-scrollbar scrollbar-hide h-9 items-center">
      {openFiles.map((file) => (
        <div
          key={file.id}
          className={`flex items-center gap-2 px-4 h-full min-w-[120px] max-w-[200px] border-r border-[#E2E8F0] cursor-pointer group transition-all relative ${activeFileId === file.id
              ? 'bg-white text-[#0F172A] border-t-2 border-t-[#2563EB]'
              : 'bg-[#E5E7EB] text-[#64748B] hover:bg-[#D1D5DB] hover:text-[#334155]'
            }`}
          onClick={() => setActiveFile(file.id)}
        >
          <span className="text-[11px] font-semibold tracking-wide truncate flex-1">
            {file.name}
            {file.isDirty && <span className="ml-1 text-[#DC2626]">•</span>}
          </span>
          <div className="flex items-center gap-1">
            {file.isDirty && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] group-hover:hidden" />
            )}
            <button
              className={`p-0.5 rounded hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity ${activeFileId === file.id ? 'opacity-100' : ''
                }`}
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
