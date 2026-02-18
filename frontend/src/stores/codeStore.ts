import { create } from 'zustand';

import { gitService, GitStatus, GitCommit } from '@/services/git';

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

export interface TerminalSession {
  id: string;
  name: string;
  type: 'bash' | 'python' | 'node';
}

export interface DebugSession {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  currentLine: number | null;
  currentFileId: string | null;
  variables: Record<string, any>;
  callStack: any[];
}

interface CodeState {
  files: FileItem[];
  openFileIds: string[];
  activeFileId: string | null;

  // Terminal State
  terminals: TerminalSession[];
  activeTerminalId: string | null;
  isTerminalOpen: boolean;

  // Debug State
  debugSession: DebugSession;
  breakpoints: Record<string, number[]>; // fileId -> line numbers

  // Git State
  gitStatus: GitStatus | null;
  gitHistory: GitCommit[];
  stagedFiles: string[];
  isGitLoading: boolean;

  aiSuggestionsEnabled: boolean;
  isAIRefineOpen: boolean;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  activeSidebarTab: 'explorer' | 'search' | 'debug' | 'git' | 'test' | 'team';
  activeRightTab: 'ai' | 'preview';
  terminalCommand: string | null;
  terminalTimestamp: number;
  activeBottomTab: 'terminal' | 'console' | 'errors' | 'tasks' | 'debug_console';
  cursorPosition: { ln: number; col: number };
  notification: { message: string; type: 'info' | 'success' | 'error' } | null;

  // Actions
  setFiles: (files: FileItem[]) => void;
  toggleFolder: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  renameFile: (id: string, newName: string) => void;
  moveFile: (fileId: string, newParentId: string | undefined) => void;
  saveFile: (id: string) => void;
  setCursorPosition: (ln: number, col: number) => void;

  // Terminal Actions
  addTerminal: (type?: 'bash' | 'python' | 'node') => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  setTerminalOpen: (isOpen: boolean) => void;

  // Debug Actions
  startDebugSession: (fileId: string) => Promise<void>;
  stopDebugSession: () => Promise<void>;
  toggleBreakpoint: (fileId: string, line: number) => void;
  stepOver: () => Promise<void>;
  continueDebug: () => Promise<void>;

  // Git Actions
  initGitRepo: (projectId: string) => Promise<void>;
  refreshGitStatus: (projectId: string) => Promise<void>;
  commitChanges: (projectId: string, message: string, files?: string[]) => Promise<void>;
  fetchGitHistory: (projectId: string) => Promise<void>;
  stageFile: (file: string) => void;
  unstageFile: (file: string) => void;

  setAISuggestionsEnabled: (enabled: boolean) => void;
  setAIRefineOpen: (isOpen: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setActiveSidebarTab: (tab: 'explorer' | 'search' | 'debug' | 'git' | 'test' | 'team') => void;
  setActiveRightTab: (tab: 'ai' | 'preview') => void;
  setActiveBottomTab: (tab: 'terminal' | 'console' | 'errors' | 'tasks' | 'debug_console') => void;
  runCommand: (command: string) => void;
  addFile: (name: string, type: 'file' | 'folder', parentId?: string) => void;
  deleteFile: (id: string) => void;
  setNotification: (notification: { message: string; type: 'info' | 'success' | 'error' } | null) => void;
}

export const useCodeStore = create<CodeState>((set, get) => ({
  files: [
    { id: '1', name: 'examples', type: 'folder', isOpen: true },

    // Python examples
    { id: '2', name: 'python', type: 'folder', parentId: '1', isOpen: true },
    { id: '3', name: 'hello.py', type: 'file', parentId: '2', language: 'python', content: 'print("Hello from Python!")\nprint("Python version:", end=" ")\nimport sys\nprint(sys.version.split()[0])\n\n# Math operations\nresult = sum(range(1, 11))\nprint(f"Sum of 1-10: {result}")' },
    { id: '4', name: 'calculator.py', type: 'file', parentId: '2', language: 'python', content: '# Simple Calculator\ndef add(a, b):\n    return a + b\n\ndef multiply(a, b):\n    return a * b\n\nprint("Calculator Demo")\nprint("5 + 3 =", add(5, 3))\nprint("4 * 7 =", multiply(4, 7))' },
    
    // JavaScript examples
    { id: '5', name: 'javascript', type: 'folder', parentId: '1', isOpen: true },
    { id: '6', name: 'hello.js', type: 'file', parentId: '5', language: 'javascript', content: 'console.log("Hello from JavaScript!");\nconsole.log("Node version:", process.version);\n\n// Array operations\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log("Array sum:", sum);' },
    { id: '7', name: 'fibonacci.js', type: 'file', parentId: '5', language: 'javascript', content: '// Fibonacci sequence\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log("Fibonacci sequence:");\nfor (let i = 0; i < 10; i++) {\n  console.log(`F(${i}) = ${fibonacci(i)}`);\n}' },
    
    // C examples
    { id: '8', name: 'c', type: 'folder', parentId: '1' },
    { id: '9', name: 'hello.c', type: 'file', parentId: '8', language: 'c', content: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    printf("C is compiled and fast\\n");\n    \n    int sum = 0;\n    for (int i = 1; i <= 10; i++) {\n        sum += i;\n    }\n    printf("Sum of 1-10: %d\\n", sum);\n    \n    return 0;\n}' },
    
    // Java examples
    { id: '10', name: 'java', type: 'folder', parentId: '1' },
    { id: '11', name: 'main.java', type: 'file', parentId: '10', language: 'java', content: 'public class main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        System.out.println("Java version: " + System.getProperty("java.version"));\n        \n        int sum = 0;\n        for (int i = 1; i <= 10; i++) {\n            sum += i;\n        }\n        System.out.println("Sum of 1-10: " + sum);\n    }\n}' },
    
    // Ruby examples
    { id: '12', name: 'ruby', type: 'folder', parentId: '1' },
    { id: '13', name: 'hello.rb', type: 'file', parentId: '12', language: 'ruby', content: 'puts "Hello from Ruby!"\nputs "Ruby version: #{RUBY_VERSION}"\n\n# Array operations\nnumbers = (1..10).to_a\nsum = numbers.sum\nputs "Sum of 1-10: #{sum}"' },
    
    // Go examples
    { id: '14', name: 'go', type: 'folder', parentId: '1' },
    { id: '15', name: 'hello.go', type: 'file', parentId: '14', language: 'go', content: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n    \n    sum := 0\n    for i := 1; i <= 10; i++ {\n        sum += i\n    }\n    fmt.Printf("Sum of 1-10: %d\\n", sum)\n}' },
    
    // Bash examples
    { id: '16', name: 'shell', type: 'folder', parentId: '1' },
    { id: '17', name: 'hello.sh', type: 'file', parentId: '16', language: 'bash', content: '#!/bin/bash\necho "Hello from Bash!"\necho "Shell: $SHELL"\n\n# Loop and calculate sum\nsum=0\nfor i in {1..10}; do\n  sum=$((sum + i))\ndone\necho "Sum of 1-10: $sum"' },
    
    // PHP examples
    { id: '18', name: 'php', type: 'folder', parentId: '1' },
    { id: '19', name: 'hello.php', type: 'file', parentId: '18', language: 'php', content: '<?php\necho "Hello from PHP!\\n";\necho "PHP version: " . phpversion() . "\\n";\n\n$sum = array_sum(range(1, 10));\necho "Sum of 1-10: $sum\\n";\n?>' },
    
    // Rust example
    { id: '20', name: 'rust', type: 'folder', parentId: '1' },
    { id: '21', name: 'hello.rs', type: 'file', parentId: '20', language: 'rust', content: 'fn main() {\n    println!("Hello from Rust!");\n    \n    let sum: i32 = (1..=10).sum();\n    println!("Sum of 1-10: {}", sum);\n}' },
  ],
  openFileIds: ['3'],
  activeFileId: '3',

  // Terminal Initial State
  terminals: [{ id: '1', name: 'Terminal 1', type: 'bash' }],
  activeTerminalId: '1',
  isTerminalOpen: true,

  // Debug Initial State
  debugSession: {
    id: '',
    status: 'idle',
    currentLine: null,
    currentFileId: null,
    variables: {},
    callStack: []
  },
  breakpoints: {},

  // Git Initial State
  gitStatus: null,
  gitHistory: [],
  stagedFiles: [],
  isGitLoading: false,

  aiSuggestionsEnabled: true,
  isAIRefineOpen: true,
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  activeSidebarTab: 'explorer',
  activeRightTab: 'ai',
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

  renameFile: (id, newName) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, name: newName } : f)
  })),

  moveFile: (fileId, newParentId) => set((state) => {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return state;
    if (file.parentId === newParentId) return state;

    // Prevent moving a folder into itself or its descendants
    if (file.type === 'folder' && newParentId !== undefined) {
      const isDescendant = (parentId: string | undefined): boolean => {
        if (parentId === fileId) return true;
        const parent = state.files.find(f => f.id === parentId);
        if (!parent || !parent.parentId) return false;
        return isDescendant(parent.parentId);
      };
      if (isDescendant(newParentId)) return state;
    }

    // Prevent duplicate names in the target folder
    const siblings = state.files.filter(f => f.parentId === newParentId && f.id !== fileId);
    if (siblings.some(s => s.name === file.name && s.type === file.type)) return state;

    return {
      files: state.files.map(f => f.id === fileId ? { ...f, parentId: newParentId } : f)
    };
  }),

  saveFile: (id) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, isDirty: false } : f)
  })),

  setCursorPosition: (ln, col) => set({ cursorPosition: { ln, col } }),

  // Terminal Actions
  addTerminal: (type = 'bash') => set((state) => {
    const id = Math.random().toString(36).substring(7);
    const num = state.terminals.length + 1;
    const newTerminal: TerminalSession = {
      id,
      name: `Terminal ${num}`,
      type
    };
    return {
      terminals: [...state.terminals, newTerminal],
      activeTerminalId: id
    };
  }),

  removeTerminal: (id) => set((state) => {
    // Don't remove the last terminal
    if (state.terminals.length <= 1) return state;

    const newTerminals = state.terminals.filter(t => t.id !== id);
    let newActiveId = state.activeTerminalId;

    if (state.activeTerminalId === id) {
      newActiveId = newTerminals[newTerminals.length - 1].id;
    }

    return {
      terminals: newTerminals,
      activeTerminalId: newActiveId
    };
  }),

  setActiveTerminal: (id) => set({ activeTerminalId: id }),

  // Debug Actions
  startDebugSession: async (fileId: string) => {
    const state = get();
    const file = state.files.find(f => f.id === fileId);
    if (!file || !file.content) return;

    try {
      set({ notification: { message: 'Starting debug session...', type: 'info' } });
      const response = await fetch('http://localhost:8000/api/v1/debug/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: file.content,
          language: file.language || 'python'
        })
      });

      if (!response.ok) throw new Error('Failed to start debugger');

      const { session_id } = await response.json();

      set({
        debugSession: {
          id: session_id,
          status: 'running',
          currentLine: 0,
          currentFileId: fileId,
          variables: {},
          callStack: []
        },
        activeSidebarTab: 'debug',
        activeBottomTab: 'debug_console'
      });

      // Sync breakpoints
      const fileBreakpoints = state.breakpoints[fileId] || [];
      for (const line of fileBreakpoints) {
        await fetch(`http://localhost:8000/api/v1/debug/${session_id}/breakpoint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line, active: true })
        });
      }

      set({ notification: { message: 'Debugger started', type: 'success' } });
    } catch (error) {
      set({ notification: { message: `Debug error: ${error}`, type: 'error' } });
    }
  },

  stopDebugSession: async () => {
    const state = get();
    const sessionId = state.debugSession.id;
    if (!sessionId) return;

    try {
      await fetch(`http://localhost:8000/api/v1/debug/${sessionId}/stop`, {
        method: 'POST'
      });
      set({
        debugSession: {
          id: '',
          status: 'idle',
          currentLine: null,
          currentFileId: null,
          variables: {},
          callStack: []
        }
      });
    } catch (error) {
      console.error('Stop debug error:', error);
    }
  },

  toggleBreakpoint: (fileId, line) => set((state) => {
    const current = state.breakpoints[fileId] || [];
    const exists = current.includes(line);
    const newBreakpoints = exists
      ? current.filter(l => l !== line)
      : [...current, line];

    // If debug session is active, sync with backend
    if (state.debugSession.id) {
      fetch(`http://localhost:8000/api/v1/debug/${state.debugSession.id}/breakpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, active: !exists })
      }).catch(console.error);
    }

    return {
      breakpoints: {
        ...state.breakpoints,
        [fileId]: newBreakpoints
      }
    };
  }),

  stepOver: async () => {
    const state = get();
    const sessionId = state.debugSession.id;
    if (!sessionId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/debug/${sessionId}/step`, {
        method: 'POST'
      });
      const debugState = await response.json();

      // Fetch variables
      const varResponse = await fetch(`http://localhost:8000/api/v1/debug/${sessionId}/variables`);
      const { variables } = await varResponse.json();

      set({
        debugSession: {
          ...state.debugSession,
          status: debugState.status,
          currentLine: debugState.current_line,
          variables
        }
      });
    } catch (error) {
      console.error('Step over error:', error);
    }
  },

  continueDebug: async () => {
    const state = get();
    const sessionId = state.debugSession.id;
    if (!sessionId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/debug/${sessionId}/continue`, {
        method: 'POST'
      });
      const debugState = await response.json();

      const varResponse = await fetch(`http://localhost:8000/api/v1/debug/${sessionId}/variables`);
      const { variables } = await varResponse.json();

      set({
        debugSession: {
          ...state.debugSession,
          status: debugState.status,
          currentLine: debugState.current_line,
          variables
        }
      });
    } catch (error) {
      console.error('Continue error:', error);
    }
  },

  // Git Actions
  initGitRepo: async (projectId: string) => {
    set({ isGitLoading: true });
    try {
      await gitService.initRepo(projectId);
      await get().refreshGitStatus(projectId);
      set({ notification: { message: 'Repository initialized', type: 'success' } });
    } catch (error) {
      set({ notification: { message: `Git init failed: ${error}`, type: 'error' } });
    } finally {
      set({ isGitLoading: false });
    }
  },

  refreshGitStatus: async (projectId: string) => {
    set({ isGitLoading: true });
    try {
      const status = await gitService.getStatus(projectId);
      set({ gitStatus: status });
    } catch (error) {
      console.error('Failed to get git status:', error);
    } finally {
      set({ isGitLoading: false });
    }
  },

  commitChanges: async (projectId: string, message: string, files?: string[]) => {
    set({ isGitLoading: true });
    try {
      const state = get();
      // If files argument is provided, use it. Otherwise use staged files.
      // If no staged files, default to all ('.')
      const filesToCommit = files || (state.stagedFiles.length > 0 ? state.stagedFiles : ['.']);

      await gitService.commit(projectId, message, filesToCommit);
      await get().refreshGitStatus(projectId);
      await get().fetchGitHistory(projectId);
      set({
        notification: { message: 'Changes committed', type: 'success' },
        stagedFiles: [] // Clear staged files after commit
      });
    } catch (error) {
      set({ notification: { message: `Commit failed: ${error}`, type: 'error' } });
    } finally {
      set({ isGitLoading: false });
    }
  },

  fetchGitHistory: async (projectId: string) => {
    try {
      const history = await gitService.getHistory(projectId);
      set({ gitHistory: history });
    } catch (error) {
      console.error('Failed to fetch git history:', error);
    }
  },

  stageFile: (file) => set((state) => ({
    stagedFiles: [...state.stagedFiles, file]
  })),

  unstageFile: (file) => set((state) => ({
    stagedFiles: state.stagedFiles.filter(f => f !== file)
  })),

  setTerminalOpen: (isOpen) => set({ isTerminalOpen: isOpen }),
  setAISuggestionsEnabled: (enabled) => set({ aiSuggestionsEnabled: enabled }),
  setAIRefineOpen: (isOpen) => set({ isAIRefineOpen: isOpen }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
  setActiveRightTab: (activeRightTab) => set({ activeRightTab }),
  setActiveBottomTab: (activeBottomTab) => set({ activeBottomTab }),
  runCommand: (command) => set({ terminalCommand: command, terminalTimestamp: Date.now() }),
  addFile: (name, type, parentId) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    
    // Detect language from extension
    const ext = name.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'java': 'java',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'bash',
      'bash': 'bash',
      'php': 'php',
      'pl': 'perl',
      'lua': 'lua',
      'r': 'r',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'jl': 'julia',
      'dart': 'dart',
      'hs': 'haskell',
      'ex': 'elixir',
      'erl': 'erlang',
      'clj': 'clojure',
      'nim': 'nim',
      'zig': 'zig',
      'f90': 'fortran',
      'cob': 'cobol',
      'sql': 'sql',
      'm': 'matlab',
      'lean': 'lean',
      'st': 'smalltalk',
      'v': 'v',
      'janet': 'janet',
      'vy': 'vyper',
      'cu': 'cuda',
      'cl': 'opencl',
      'ps': 'postscript',
      'pde': 'processing',
      'scad': 'openscad',
      'pl': 'prolog',
      'sb3': 'scratch',
      'logo': 'logo',
      'purs': 'purescript',
      'idr': 'idris',
      'agda': 'agda',
      'bal': 'ballerina',
      'hh': 'hack',
      'pas': 'pascal',
      'mod': 'modula2',
      'awk': 'awk',
      'sed': 'sed',
      'sml': 'sml',
      'qs': 'qsharp',
      'as': 'actionscript',
      'fnl': 'fennel',
      'gr': 'grain',
      'koka': 'koka',
      'roc': 'roc',
      'u': 'unison',
      'pony': 'pony',
      'cr': 'crystal',
      'hcl': 'hcl',
      'nix': 'nix',
      'ps1': 'powershell',
      'glsl': 'glsl',
      'hlsl': 'hlsl',
      'abap': 'abap',
      'cls': 'apex',
      'coffee': 'coffeescript',
      'elm': 'elm',
      'hx': 'haxe',
      'svelte': 'svelte',
      'cljs': 'clojurescript',
      'rkt': 'racket',
      'scm': 'scheme',
      'lisp': 'commonlisp',
      'carbon': 'carbon',
      'mojo': 'mojo',
      'bsl': '1centerprise',
    };
    
    const newFile: FileItem = {
      id,
      name,
      type,
      parentId,
      language: ext ? (languageMap[ext] || 'plaintext') : 'plaintext',
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
