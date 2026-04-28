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
    let rafId: number | null = null;
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      rafId = requestAnimationFrame(() => inputRef.current?.focus());
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
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
      case 'py': return <FileCode className="w-4 h-4 text-[#1D4ED8]" />;
      case 'json': return <FileJson className="w-4 h-4 text-[#B45309]" />;
      case 'txt': return <FileText className="w-4 h-4 text-[#475569]" />;
      default: return <FileType className="w-4 h-4 text-[#475569]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" role="dialog" aria-label="Command Palette" aria-modal="true" data-testid="command-palette">
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a file name to navigate..."
            aria-label="Search files"
            className="flex-1 bg-transparent border-none px-3 py-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none font-medium"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] font-bold text-[#64748B] uppercase tracking-wider shadow-sm">
            <Command className="w-3 h-3" />
            <span>P</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 bg-white">
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest opacity-60">No files found matching &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${index === selectedIndex
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/20'
                      : 'text-[#1E293B] hover:bg-[#F1F5F9] border-transparent'
                    }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    openFile(file.id);
                    setCommandPaletteOpen(false);
                  }}
                >
                  <div className={`p-1.5 rounded-lg ${index === selectedIndex ? 'bg-white/20' : 'bg-[#F8FAFC]'}`}>
                    {getFileIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{file.name}</div>
                    <div className={`text-[10px] uppercase font-bold tracking-tight opacity-60 truncate ${index === selectedIndex ? 'text-white' : 'text-[#64748B]'}`}>
                      {file.parentId ? 'In ' + files.find(f => f.id === file.parentId)?.name : 'Root directory'}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-white bg-black/10 px-1.5 py-0.5 rounded">Open</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0] shadow-sm">↑↓</span>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0] shadow-sm">Enter</span>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0] shadow-sm">Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
