'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FileJson,
  FileType,
  Folder,
  FolderOpen,
  FileText,
  Trash2,
  Plus
} from 'lucide-react';
import { useCodeStore, FileItem } from '@/stores/codeStore';

const FileIcon = ({ name, type, isOpen }: { name: string; type: 'file' | 'folder'; isOpen?: boolean }) => {
  if (type === 'folder') {
    // Folder: #334155 (folder text color from spec)
    return isOpen ? <FolderOpen className="w-4 h-4 text-[#334155]" /> : <Folder className="w-4 h-4 text-[#334155]" />;
  }

  const ext = name.split('.').pop();
  switch (ext) {
    case 'py':
      return <FileCode className="w-4 h-4 text-[#1D4ED8]" />; // Functions color
    case 'json':
      return <FileJson className="w-4 h-4 text-[#B45309]" />; // Numbers color
    case 'txt':
      return <FileText className="w-4 h-4 text-[#475569]" />; // Secondary text
    default:
      return <FileType className="w-4 h-4 text-[#475569]" />;
  }
};

const FileBadge = ({ name }: { name: string }) => {
  const ext = name.split('.').pop()?.toUpperCase();
  if (!ext || ext === name.toUpperCase()) return null;

  const colors: Record<string, string> = {
    'PY': 'text-[#1D4ED8] bg-[#EEF2FF]',
    'JSON': 'text-[#B45309] bg-[#FEF3C7]',
    'TXT': 'text-[#475569] bg-[#F1F5F9]',
    'JS': 'text-[#B45309] bg-[#FEF3C7]',
    'TS': 'text-[#1D4ED8] bg-[#EEF2FF]',
  };

  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${colors[ext] || 'text-[#475569] bg-[#F1F5F9]'}`}>
      {ext}
    </span>
  );
};

export const FileExplorer = () => {
  const { files, toggleFolder, openFile, activeFileId, deleteFile, addFile, setNotification } = useCodeStore();

  const handleDelete = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      deleteFile(file.id);
      setNotification({ message: `Deleted ${file.name}`, type: 'info' });
    }
  };

  const handleAdd = (e: React.MouseEvent, parentId?: string) => {
    e.stopPropagation();
    const name = prompt('Enter name:');
    if (name) {
      const type = name.includes('.') ? 'file' : 'folder';
      addFile(name, type, parentId);
      setNotification({ message: `Created ${name}`, type: 'success' });
    }
  };

  const renderTree = (parentId: string | undefined = undefined, level = 0) => {
    return files
      .filter(f => f.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map(file => (
        <div key={file.id}>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group relative ${activeFileId === file.id
                ? 'bg-[#EEF2FF] text-[#0F172A]'
                : 'text-[#0F172A] hover:bg-[#E0E7FF]'
              }`}
            style={{ paddingLeft: `${(level * 12) + 12}px` }}
            onClick={() => {
              if (file.type === 'folder') {
                toggleFolder(file.id);
              } else {
                openFile(file.id);
              }
            }}
          >
            {activeFileId === file.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#2563EB]" />
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {file.type === 'folder' ? (
                <div className="flex items-center justify-center w-4 h-4">
                  {file.isOpen ? <ChevronDown className="w-3 h-3 text-[#64748B]" /> : <ChevronRight className="w-3 h-3 text-[#64748B]" />}
                </div>
              ) : (
                <div className="w-4" />
              )}
              <FileIcon name={file.name} type={file.type} isOpen={file.isOpen} />
              <span className={`text-xs font-mono truncate ${file.type === 'folder' ? 'text-[#334155] font-medium' : 'text-[#0F172A]'
                } ${activeFileId === file.id ? 'font-semibold' : ''}`}>
                {file.name}
              </span>
              {file.type === 'file' && <FileBadge name={file.name} />}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                {file.type === 'folder' && (
                  <button
                    onClick={(e) => handleAdd(e, file.id)}
                    className="p-0.5 hover:bg-[#E0E7FF] rounded text-[#64748B] hover:text-[#2563EB]"
                    title="New File/Folder"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, file)}
                  className="p-0.5 hover:bg-[#FEE2E2] rounded text-[#64748B] hover:text-[#DC2626]"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          {file.type === 'folder' && file.isOpen && renderTree(file.id, level + 1)}
        </div>
      ));
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] border-r border-[#E2E8F0] select-none">
      <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {renderTree()}
      </div>
    </div>
  );
};
