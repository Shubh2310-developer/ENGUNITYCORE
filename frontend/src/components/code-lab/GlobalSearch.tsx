'use client';

import React, { useState } from 'react';
import { Search, X, FileText, ChevronRight } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';

export const GlobalSearch = () => {
  const { files, openFile, setActiveSidebarTab } = useCodeStore();
  const [query, setQuery] = useState('');

  const filteredFiles = query.trim()
    ? files.filter(f =>
        f.type === 'file' &&
        (f.name.toLowerCase().includes(query.toLowerCase()) ||
         f.content?.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="flex flex-col h-full bg-void-950/50 select-none">
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-void-900/50">
        <span className="text-[10px] font-black uppercase tracking-widest text-starlight-400/50">Search</span>
        <button
          onClick={() => setActiveSidebarTab('explorer')}
          className="p-1 hover:bg-white/5 rounded text-starlight-400/40 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="p-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-starlight-400/40 group-focus-within:text-primary transition-colors" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files or content..."
            className="w-full bg-void-900 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-xs text-starlight-100 placeholder:text-starlight-400/20 focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query && filteredFiles.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-starlight-400/20">No results found</p>
          </div>
        )}

        {!query && (
          <div className="p-8 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-starlight-400/20">Enter query to search</p>
          </div>
        )}

        <div className="space-y-1">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => openFile(file.id)}
              className="group flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-starlight-400/40 group-hover:text-cyber-sky transition-colors" />
                <span className="text-xs font-mono text-starlight-100 group-hover:text-white">{file.name}</span>
                <span className="text-[9px] text-starlight-400/30 font-mono ml-auto">
                  {file.parentId ? 'in ' + files.find(f => f.id === file.parentId)?.name : 'root'}
                </span>
              </div>
              {query && file.content?.toLowerCase().includes(query.toLowerCase()) && (
                <div className="pl-5.5 text-[10px] text-starlight-400/50 font-mono truncate">
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
