'use client';

import React, { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';

export const GlobalSearch = () => {
  const { files, openFile } = useCodeStore();
  const [query, setQuery] = useState('');

  const filteredFiles = query.trim()
    ? files.filter(f =>
        f.type === 'file' &&
        (f.name.toLowerCase().includes(query.toLowerCase()) ||
         f.content?.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] select-none shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <div className="p-4 border-b border-[#E2E8F0]">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files or content..."
            className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-9 pr-4 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {query && filteredFiles.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">No results found</p>
          </div>
        )}

        {!query && (
          <div className="p-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Enter query to search</p>
          </div>
        )}

        <div className="divide-y divide-[#F1F5F9]">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => openFile(file.id)}
              className="group flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-[#F8FAFC] transition-colors border-l-2 border-transparent hover:border-[#2563EB]"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                <span className="text-xs font-bold text-[#1E293B] group-hover:text-[#0F172A]">{file.name}</span>
                <span className="text-[9px] text-[#94A3B8] font-mono ml-auto">
                  {file.parentId ? 'in ' + files.find(f => f.id === file.parentId)?.name : 'root'}
                </span>
              </div>
              {query && file.content?.toLowerCase().includes(query.toLowerCase()) && (
                <div className="pl-5 text-[10px] text-[#64748B] font-mono truncate bg-[#F8FAFC] p-1 rounded border border-[#F1F5F9] mt-1">
                  ...{file.content.substring(
                    Math.max(0, file.content.toLowerCase().indexOf(query.toLowerCase()) - 20),
                    file.content.toLowerCase().indexOf(query.toLowerCase()) + 40
                  )}...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
