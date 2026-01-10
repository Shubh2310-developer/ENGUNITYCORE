'use client';

import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { useCodeStore, FileItem } from '@/stores/codeStore';

export const Breadcrumbs = () => {
  const { files, activeFileId, openFile, toggleFolder } = useCodeStore();
  const activeFile = files.find(f => f.id === activeFileId);

  if (!activeFile) return null;

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'file') {
      openFile(item.id);
    } else {
      toggleFolder(item.id);
    }
  };

  const getBreadcrumbs = (file: FileItem): FileItem[] => {
    const path: FileItem[] = [file];
    let current = file;
    while (current.parentId) {
      const parent = files.find(f => f.id === current.parentId);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return path;
  };

  const breadcrumbs = getBreadcrumbs(activeFile);

  return (
    <div className="h-8 flex items-center px-4 bg-[#F1F5F9] border-b border-[#E2E8F0] overflow-hidden select-none">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
        <Home className="w-3 h-3 text-[#94A3B8]" />
        <ChevronRight className="w-2 h-2 text-[#CBD5E1]" />

        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            <div
              onClick={() => handleItemClick(item)}
              className={`flex items-center gap-1.5 hover:text-[#2563EB] cursor-pointer transition-all group ${index === breadcrumbs.length - 1 ? 'text-[#0F172A]' : 'text-[#64748B]'
                }`}
            >
              {item.type === 'folder' && <Folder className="w-3 h-3 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />}
              <span className={index === breadcrumbs.length - 1 ? 'text-[#0F172A] font-semibold' : ''}>{item.name}</span>
            </div>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="w-2 h-2 text-[#CBD5E1]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
