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
