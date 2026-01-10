import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  parentId?: string;
  isOpen?: boolean;
  isDirty?: boolean;
}

interface CodeState {
  files: FileItem[];
  openFileIds: string[];
  activeFileId: string | null;
  isTerminalOpen: boolean;
  isAIRefineOpen: boolean;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  activeSidebarTab: 'explorer' | 'search';
  terminalCommand: string | null;
  terminalTimestamp: number;
  activeBottomTab: 'terminal' | 'console' | 'errors' | 'tasks';
  cursorPosition: { ln: number; col: number };
  notification: { message: string; type: 'info' | 'success' | 'error' } | null;

  // Actions
  setFiles: (files: FileItem[]) => void;
  toggleFolder: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  saveFile: (id: string) => void;
  setCursorPosition: (ln: number, col: number) => void;
  setTerminalOpen: (isOpen: boolean) => void;
  setAIRefineOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setActiveSidebarTab: (tab: 'explorer' | 'search') => void;
  setActiveBottomTab: (tab: 'terminal' | 'console' | 'errors' | 'tasks') => void;
  runCommand: (command: string) => void;
  addFile: (name: string, type: 'file' | 'folder', parentId?: string) => void;
  deleteFile: (id: string) => void;
  setNotification: (notification: { message: string; type: 'info' | 'success' | 'error' } | null) => void;
}

export const useCodeStore = create<CodeState>((set) => ({
  files: [
    { id: '1', name: 'ai-core', type: 'folder', isOpen: true },
    { id: '2', name: 'embeddings', type: 'folder', parentId: '1', isOpen: true },
    { id: '3', name: 'generator.py', type: 'file', parentId: '2', language: 'python', content: 'from typing import List, Union\nimport numpy as np\n\nclass EmbeddingGenerator:\n    """Generates embeddings for text chunks."""\n    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):\n        self.model_name = model_name\n        self.model = None\n\n    def generate(self, text: Union[str, List[str]]) -> np.ndarray:\n        self._load_model()\n        # TODO: Implement parallel encoding', isDirty: false },
    { id: '4', name: 'rag', type: 'folder', parentId: '1' },
    { id: '5', name: 'api', type: 'folder' },
    { id: '6', name: 'frontend', type: 'folder' },
    { id: '7', name: 'package.json', type: 'file', language: 'json', content: '{\n  "name": "engunity-app",\n  "version": "1.0.0"\n}', isDirty: false },
    { id: '8', name: 'requirements.txt', type: 'file', language: 'plaintext', content: 'numpy>=1.24.0\ntorch>=2.0.0', isDirty: false },
  ],
  openFileIds: ['3'],
  activeFileId: '3',
  isTerminalOpen: true,
  isAIRefineOpen: true,
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  activeSidebarTab: 'explorer',
  terminalCommand: null,
  terminalTimestamp: 0,
  activeBottomTab: 'terminal',
  cursorPosition: { ln: 1, col: 1 },
  notification: null,

  setFiles: (files) => set({ files }),

  toggleFolder: (id) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f)
  })),

  openFile: (id) => set((state) => {
    const newOpenIds = state.openFileIds.includes(id)
      ? state.openFileIds
      : [...state.openFileIds, id];
    return {
      openFileIds: newOpenIds,
      activeFileId: id
    };
  }),

  closeFile: (id) => set((state) => {
    const file = state.files.find(f => f.id === id);
    if (file?.isDirty) {
      if (typeof window !== 'undefined' && !confirm(`Save changes to ${file.name}?`)) {
        // Just a simple confirm for now
      }
    }
    const newOpenIds = state.openFileIds.filter(fid => fid !== id);
    let newActiveId = state.activeFileId;
    if (newActiveId === id) {
      newActiveId = newOpenIds.length > 0 ? newOpenIds[newOpenIds.length - 1] : null;
    }
    return {
      openFileIds: newOpenIds,
      activeFileId: newActiveId
    };
  }),

  setActiveFile: (id) => set({ activeFileId: id }),

  updateFileContent: (id, content) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, content, isDirty: true } : f)
  })),

  saveFile: (id) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, isDirty: false } : f)
  })),

  setCursorPosition: (ln, col) => set({ cursorPosition: { ln, col } }),

  setTerminalOpen: (isOpen) => set({ isTerminalOpen: isOpen }),
  setAIRefineOpen: (isOpen) => set({ isAIRefineOpen: isOpen }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
  setActiveBottomTab: (activeBottomTab) => set({ activeBottomTab }),
  runCommand: (command) => set({ terminalCommand: command, terminalTimestamp: Date.now() }),
  addFile: (name, type, parentId) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    const newFile: FileItem = {
      id,
      name,
      type,
      parentId,
      language: name.split('.').pop() === 'py' ? 'python' : 'plaintext',
      content: '',
      isDirty: false
    };
    return {
      files: [...state.files, newFile],
      activeFileId: type === 'file' ? id : state.activeFileId,
      openFileIds: type === 'file' ? [...state.openFileIds, id] : state.openFileIds
    };
  }),

  deleteFile: (id) => set((state) => {
    const file = state.files.find(f => f.id === id);
    if (!file) return state;

    // Recursive deletion for folders
    const getIdsToDelete = (fid: string): string[] => {
      const children = state.files.filter(f => f.parentId === fid);
      return [fid, ...children.flatMap(c => getIdsToDelete(c.id))];
    };

    const idsToDelete = getIdsToDelete(id);
    const newFiles = state.files.filter(f => !idsToDelete.includes(f.id));
    const newOpenIds = state.openFileIds.filter(fid => !idsToDelete.includes(fid));

    let newActiveId = state.activeFileId;
    if (idsToDelete.includes(newActiveId || '')) {
      newActiveId = newOpenIds.length > 0 ? newOpenIds[newOpenIds.length - 1] : null;
    }

    return {
      files: newFiles,
      openFileIds: newOpenIds,
      activeFileId: newActiveId
    };
  }),

  setNotification: (notification) => {
    set({ notification });
    if (notification) {
      setTimeout(() => set({ notification: null }), 3000);
    }
  },
}));
