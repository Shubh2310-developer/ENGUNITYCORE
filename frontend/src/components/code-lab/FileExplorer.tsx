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
  Pencil,
  FilePlus,
  FolderPlus,
  Sparkles
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
  const { files, toggleFolder, openFile, activeFileId, deleteFile, addFile, renameFile, moveFile, setNotification, aiSuggestionsEnabled, setAISuggestionsEnabled } = useCodeStore();
  const [editingFileId, setEditingFileId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [draggedFileId, setDraggedFileId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState<'file' | 'folder' | null>(null);
  const [createName, setCreateName] = React.useState('');
  const [createParentId, setCreateParentId] = React.useState<string | undefined>(undefined);

  const handleDelete = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      deleteFile(file.id);
      setNotification({ message: `Deleted ${file.name}`, type: 'info' });
    }
  };

  const handleRenameStart = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditName(file.name);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFileId && editName.trim()) {
      renameFile(editingFileId, editName.trim());
      setEditingFileId(null);
      setEditName('');
    }
  };

  const handleRenameCancel = () => {
      setEditingFileId(null);
      setEditName('');
  };

  const startCreating = (type: 'file' | 'folder', parentId?: string) => {
    setIsCreating(type);
    setCreateName('');
    setCreateParentId(parentId);
    if (parentId) {
      const folder = files.find(f => f.id === parentId);
      if (folder && !folder.isOpen) toggleFolder(parentId);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createName.trim() && isCreating) {
      addFile(createName.trim(), isCreating, createParentId);
      setNotification({ message: `Created ${createName.trim()}`, type: 'success' });
      setIsCreating(null);
      setCreateName('');
      setCreateParentId(undefined);
    }
  };

  const handleCreateCancel = () => {
    setIsCreating(null);
    setCreateName('');
    setCreateParentId(undefined);
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.stopPropagation();
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fileId);
  };

  const handleDragOver = (e: React.DragEvent, targetFile: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedFileId || draggedFileId === targetFile.id) return;
    if (targetFile.type === 'folder') {
      e.dataTransfer.dropEffect = 'move';
      setDropTargetId(targetFile.id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFile: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedFileId || targetFile.type !== 'folder') return;
    moveFile(draggedFileId, targetFile.id);
    setNotification({ message: `Moved to ${targetFile.name}`, type: 'success' });
    setDraggedFileId(null);
    setDropTargetId(null);
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFileId) {
      e.dataTransfer.dropEffect = 'move';
      setDropTargetId('root');
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFileId) return;
    moveFile(draggedFileId, undefined);
    setNotification({ message: 'Moved to root', type: 'success' });
    setDraggedFileId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDropTargetId(null);
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
            draggable
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragOver={(e) => handleDragOver(e, file)}
            onDrop={(e) => handleDrop(e, file)}
            onDragEnd={handleDragEnd}
            onDragLeave={(e) => {
              e.stopPropagation();
              if (dropTargetId === file.id) setDropTargetId(null);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group relative ${
              dropTargetId === file.id && file.type === 'folder'
                ? 'bg-[#DBEAFE] ring-1 ring-[#2563EB] ring-inset'
                : draggedFileId === file.id
                  ? 'opacity-50'
                  : activeFileId === file.id
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

              {editingFileId === file.id ? (
                <form
                    onSubmit={handleRenameSubmit}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1"
                >
                    <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRenameCancel}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') handleRenameCancel();
                        }}
                        className="w-full text-xs px-1 py-0.5 border border-blue-500 rounded bg-white text-black focus:outline-none"
                    />
                </form>
              ) : (
                <>
                    <span className={`text-xs font-mono truncate ${file.type === 'folder' ? 'text-[#334155] font-medium' : 'text-[#0F172A]'
                        } ${activeFileId === file.id ? 'font-semibold' : ''}`}>
                        {file.name}
                    </span>
                    {file.type === 'file' && <FileBadge name={file.name} />}
                </>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                {file.type === 'folder' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); startCreating('file', file.id); }}
                      className="p-0.5 hover:bg-[#E0E7FF] rounded text-[#64748B] hover:text-[#2563EB]"
                      title="New File"
                    >
                      <FilePlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startCreating('folder', file.id); }}
                      className="p-0.5 hover:bg-[#E0E7FF] rounded text-[#64748B] hover:text-[#2563EB]"
                      title="New Folder"
                    >
                      <FolderPlus className="w-3 h-3" />
                    </button>
                  </>
                )}
                <button
                    onClick={(e) => handleRenameStart(e, file)}
                    className="p-0.5 hover:bg-[#E0E7FF] rounded text-[#64748B] hover:text-[#2563EB]"
                    title="Rename"
                >
                    <Pencil className="w-3 h-3" />
                </button>
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
          {file.type === 'folder' && file.isOpen && (
            <>
              {renderCreateInput(file.id, level + 1)}
              {renderTree(file.id, level + 1)}
            </>
          )}
        </div>
      ));
  };

  const renderCreateInput = (parentId: string | undefined, level: number) => {
    if (isCreating === null || createParentId !== parentId) return null;
    return (
      <form
        onSubmit={handleCreateSubmit}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border-l-2 border-[#2563EB]"
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        <div className="w-4" />
        {isCreating === 'folder'
          ? <Folder className="w-4 h-4 text-[#334155]" />
          : <FileType className="w-4 h-4 text-[#475569]" />
        }
        <input
          autoFocus
          type="text"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          onBlur={handleCreateCancel}
          onKeyDown={(e) => { if (e.key === 'Escape') handleCreateCancel(); }}
          placeholder={isCreating === 'folder' ? 'folder name' : 'filename.ext'}
          className="flex-1 text-xs px-1.5 py-0.5 border border-[#2563EB] rounded bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/30 placeholder:text-[#94A3B8]"
        />
      </form>
    );
  };

  return (
    <div
      className="flex flex-col h-full bg-[#F8FAFC] border-r border-[#CBD5E1] select-none shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]"
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
      onDragLeave={() => { if (dropTargetId === 'root') setDropTargetId(null); }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-1 px-3 py-1.5 border-b border-[#E2E8F0] bg-[#F1F5F9]">
        <button
          onClick={() => setAISuggestionsEnabled(!aiSuggestionsEnabled)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            aiSuggestionsEnabled
              ? 'bg-[#EEF2FF] text-[#2563EB] hover:bg-[#DBEAFE]'
              : 'bg-[#F1F5F9] text-[#94A3B8] hover:bg-[#E2E8F0]'
          }`}
          title={aiSuggestionsEnabled ? 'Disable AI Suggestions' : 'Enable AI Suggestions'}
        >
          <Sparkles className="w-3 h-3" />
          AI
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startCreating('file')}
            className="p-1 hover:bg-[#E0E7FF] rounded text-[#64748B] hover:text-[#2563EB] transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => startCreating('folder')}
            className="p-1 hover:bg-[#E0E7FF] rounded text-[#64748B] hover:text-[#2563EB] transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-1 transition-colors ${dropTargetId === 'root' ? 'bg-[#F0F9FF]' : ''}`}>
        {renderCreateInput(undefined, 0)}
        {renderTree()}
      </div>
    </div>
  );
};
