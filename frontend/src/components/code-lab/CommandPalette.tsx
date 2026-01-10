'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, FileJson, FileText, FileType, Command } from 'lucide-react';
import { useCodeStore, FileItem } from '@/stores/codeStore';

export const CommandPalette = () => {
  const { files, isCommandPaletteOpen, setCommandPaletteOpen, openFile } = useCodeStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(f =>
    f.type === 'file' &&
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredFiles.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredFiles.length) % Math.max(1, filteredFiles.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          openFile(filteredFiles[selectedIndex].id);
          setCommandPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredFiles, selectedIndex, openFile, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop();
    switch (ext) {
      case 'py': return <FileCode className="w-4 h-4 text-cyber-sky" />;
      case 'json': return <FileJson className="w-4 h-4 text-amber-400" />;
      case 'txt': return <FileText className="w-4 h-4 text-starlight-400" />;
      default: return <FileType className="w-4 h-4 text-starlight-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div
        className="fixed inset-0 bg-void-950/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-void-900/90 border border-white/10 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-white/5 bg-void-800/50">
          <Search className="w-4 h-4 text-starlight-400/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a file name to navigate..."
            className="flex-1 bg-transparent border-none px-3 py-4 text-sm text-starlight-100 placeholder:text-starlight-400/20 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-starlight-400/40 uppercase tracking-widest">
            <Command className="w-3 h-3" />
            <span>P</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-starlight-400/40 font-mono">No files matching &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${index === selectedIndex
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-starlight-400 hover:bg-white/5 border border-transparent'
                    }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    openFile(file.id);
                    setCommandPaletteOpen(false);
                  }}
                >
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono truncate">{file.name}</div>
                    <div className="text-[10px] opacity-40 truncate">
                      {file.parentId ? 'In ' + files.find(f => f.id === file.parentId)?.name : 'Root directory'}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Open</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-void-950/50 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-starlight-400/20 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="px-1 py-0.5 rounded bg-white/5 text-starlight-400/40 border border-white/5">↑↓</span>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1 py-0.5 rounded bg-white/5 text-starlight-400/40 border border-white/5">Enter</span>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.5 rounded bg-white/5 text-starlight-400/40 border border-white/5">Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
