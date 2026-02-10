# Engunity Code Lab: End-to-End Integration Guide (2026)

This document provides a comprehensive blueprint for integrating full-stack code execution, management, and AI assistance within the Engunity platform.

## 1. System Architecture Overview

The Code Lab follows a modular three-tier architecture:

### A. Frontend (Next.js + Zustand)
- **View Layer**: [page.tsx](frontend/src/app/(dashboard)/code/page.tsx) handles the layout and main execution logic.
- **Components**: Located in [src/components/code-lab/](frontend/src/components/code-lab/), including `CodeEditor` (Monaco/Codemirror), `Terminal` (Xterm.js), and `FileExplorer`.
- **State Management**: [codeStore.ts](frontend/src/stores/codeStore.ts) manages file systems, open tabs, and terminal output.
- **Service Layer**: [code.ts](frontend/src/services/code.ts) handles API communication.

### B. Backend (FastAPI + SQLAlchemy)
- **API Endpoints**: [code.py](backend/app/api/v1/code.py) provides REST endpoints for project/file CRUD and execution.
- **Execution Routing**: Handles both authenticated project-based execution and `execute-direct` for quick testing.

### C. Execution Sandbox (Python + Subprocess/Docker)
- **Sandbox Core**: [sandbox.py](backend/app/services/code_execution/sandbox.py) manages temporary directories, file writing, compilation, and execution.
- **Resource Control**: Implements timeouts and isolated environments to prevent system abuse.

---

## 2. End-to-End Integration Workflow

### Step 1: File Creation & Persistence
When a user creates a file in the `FileExplorer`:
1. `addFile` in `codeStore.ts` generates a local ID and detects the language.
2. The UI reflects the new file immediately.
3. *Integration Task*: Hook `addFile` to call `codeService.createFile` to persist the file in the database.

### Step 2: Code Editing
1. `CodeEditor.tsx` captures changes and updates the `codeStore` via `updateFileContent`.
2. A "dirty" state is tracked to prompt for saving.
3. *Integration Task*: Implement auto-save or a debounced save mechanism that calls `codeService.updateFile`.

### Step 3: Execution Request
1. User clicks the **Run** button.
2. `handleRunProject` in `page.tsx` retrieves the active file content.
3. A POST request is sent to `/api/v1/code/execute-direct` or `/execute`.
4. *Integration Task*: Ensure `stdin_data` is correctly captured via the UI modal for interactive programs.

### Step 4: Sandbox Execution
1. The backend receives the code and language.
2. `CodeSandbox.execute_code` creates a `tempfile.mkdtemp`.
3. If the language is compiled (e.g., C++, Java, Rust), it runs the compiler first.
4. The process is executed using `asyncio.create_subprocess_exec` with a timeout.

### Step 5: Terminal Output Rendering
1. The backend returns a JSON object with `stdout`, `stderr`, and `execution_time`.
2. The frontend receives the result and formats it using ANSI color codes (e.g., `\x1b[32m` for green).
3. `runCommand(output)` updates the store, which the `Terminal` component listens to for rendering.

---

## 3. Supporting 100 Languages (Language Compendium 2026)

To achieve true universal support, the `CodeSandbox.SUPPORTED_LANGUAGES` configuration and the frontend `languageMap` must be expanded. Below is the list of 100 languages to be supported:

### 1-20: Systems & High Performance
1. **Python** (.py) - `python3`
2. **JavaScript** (.js) - `node`
3. **TypeScript** (.ts) - `ts-node`
4. **Rust** (.rs) - `rustc` / `cargo`
5. **C++** (.cpp) - `g++`
6. **C** (.c) - `gcc`
7. **Go** (.go) - `go run`
8. **Zig** (.zig) - `zig run`
9. **Carbon** (.carbon) - `carbon`
10. **Mojo** (.mojo) - `mojo`
11. **Swift** (.swift) - `swift`
12. **Kotlin** (.kt) - `kotlinc`
13. **Java** (.java) - `javac` & `java`
14. **C#** (.cs) - `dotnet run`
15. **Julia** (.jl) - `julia`
16. **R** (.r) - `Rscript`
17. **SQL** (.sql) - `psql` / `sqlite3`
18. **MATLAB** (.m) - `matlab`
19. **Scala** (.scala) - `scala`
20. **Lean 4** (.lean) - `lean`

### 21-40: Web & Functional
21. **PHP** (.php) - `php`
22. **Ruby** (.rb) - `ruby`
23. **Dart** (.dart) - `dart`
24. **ClojureScript** (.cljs) - `cljs`
25. **Elm** (.elm) - `elm make`
26. **Haxe** (.hx) - `haxe`
27. **Svelte** (.svelte) - `svelte-compile`
28. **CoffeeScript** (.coffee) - `coffee`
29. **Haskell** (.hs) - `ghc`
30. **Elixir** (.ex) - `elixir`
31. **Erlang** (.erl) - `erl`
32. **F#** (.fs) - `dotnet run`
33. **OCaml** (.ml) - `ocaml`
34. **Gleam** (.gleam) - `gleam run`
35. **Clojure** (.clj) - `clojure`
36. **Common Lisp** (.lisp) - `sbcl`
37. **Scheme** (.scm) - `guile`
38. **Racket** (.rkt) - `racket`
39. **Bash** (.sh) - `bash`
40. **PowerShell** (.ps1) - `pwsh`

### 41-60: Scripting & Automation
41. **Lua** (.lua) - `lua`
42. **Perl** (.pl) - `perl`
43. **Groovy** (.groovy) - `groovy`
44. **HCL** (.hcl) - `terraform`
45. **Nix** (.nix) - `nix-instantiate`
46. **Objective-C** (.m) - `clang`
47. **Vala** (.vala) - `valac`
48. **Grain** (.gr) - `grain`
49. **Koka** (.koka) - `koka`
50. **Roc** (.roc) - `roc`
51. **Unison** (.u) - `ucm`
52. **Pony** (.pony) - `ponyc`
53. **Crystal** (.cr) - `crystal`
54. **Nim** (.nim) - `nim`
55. **D** (.d) - `rdmd`
56. **Fortran** (.f90) - `gfortran`
57. **COBOL** (.cob) - `cobc`
58. **Ada** (.ada) - `gnat`
59. **Forth** (.forth) - `gforth`
60. **Smalltalk** (.st) - `gst`

### 61-80: Emerging & Smart Contracts
61. **V** (.v) - `v run`
62. **Janet** (.janet) - `janet`
63. **WebAssembly** (.wat) - `wasmtime`
64. **Solidity** (.sol) - `solc`
65. **Vyper** (.vy) - `vyper`
66. **Move** (.move) - `move`
67. **Cairo** (.cairo) - `cairo-run`
68. **Noir** (.nr) - `nargo`
69. **Verilog** (.v) - `iverilog`
70. **VHDL** (.vhd) - `ghdl`
71. **Chisel** (.scala) - `sbt`
72. **GLSL** (.glsl) - `glslangValidator`
73. **HLSL** (.hlsl) - `dxc`
74. **CUDA** (.cu) - `nvcc`
75. **OpenCL** (.cl) - `clcc`
76. **LabVIEW** (.vi) - `labview`
77. **ABAP** (.abap) - `sap`
78. **Apex** (.cls) - `sfdx`
79. **Tcl** (.tcl) - `tclsh`
80. **PostScript** (.ps) - `gs`

### 81-100: Specialized & Academic
81. **Processing** (.pde) - `processing-java`
82. **OpenSCAD** (.scad) - `openscad`
83. **Prolog** (.pl) - `swipl`
84. **Scratch** (.sb3) - `scratch-vm`
85. **Logo** (.logo) - `logo`
86. **PureScript** (.purs) - `purs`
87. **Idris** (.idr) - `idris2`
88. **Agda** (.agda) - `agda`
89. **Coq** (.v) - `coqc`
90. **1C:Enterprise** (.bsl) - `1c`
91. **Ballerina** (.bal) - `bal run`
92. **Hack** (.hh) - `hhvm`
93. **Pascal** (.pas) - `fpc`
94. **Modula-2** (.mod) - `gm2`
95. **AWK** (.awk) - `awk`
96. **Sed** (.sed) - `sed`
97. **Standard ML** (.sml) - `sml`
98. **Q#** (.qs) - `dotnet run`
99. **ActionScript** (.as) - `asc`
100. **Fennel** (.fnl) - `fennel`

---

## 4. Technical Implementation Details

### A. Frontend Store Integration (Zustand)
In `codeStore.ts`, the `addFile` action must handle the mapping of extensions to the correct language string used by the backend:

```typescript
// frontend/src/stores/codeStore.ts

addFile: (name, type, parentId) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    const ext = name.split('.').pop()?.toLowerCase();

    // Mapping for 100 languages
    const languageMap: Record<string, string> = {
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      // ... (add all 100 here)
      'rs': 'rust',
      'go': 'go',
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
    // ...
});
```

### B. Backend Execution Logic (Python Sandbox)
The `CodeSandbox` class in `sandbox.py` must handle the compilation and execution steps for each language category:

```python
# backend/app/services/code_execution/sandbox.py

async def execute_code(code: str, language: str, timeout: int = 30):
    lang_config = self.SUPPORTED_LANGUAGES.get(language)

    # 1. Create Isolation
    temp_dir = tempfile.mkdtemp()
    file_path = os.path.join(temp_dir, f"main{lang_config['ext']}")

    # 2. Compilation (if required)
    if lang_config.get('compile'):
        compile_cmd = [lang_config['cmd'], file_path, '-o', 'output']
        # Run compilation...

    # 3. Execution with Stdin
    process = await asyncio.create_subprocess_exec(
        *run_cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate(input=stdin_data)
```

### C. Stdin Handling Workflow
For languages that require user input (like Python's `input()` or C's `scanf`):
1. **Detection**: Frontend scans code for keywords (`input`, `scanf`, `readline`).
2. **Modal**: If keywords are found, show the `showStdinModal`.
3. **Payload**: Send the input string in the `stdin_data` field of the POST request.
4. **Processing**: Backend pipes this string into the subprocess's `stdin`.

---

## 6. Advanced Integration: Security & Scalability

### A. Containerized Execution (Production Strategy)
To safely run 100+ languages, a static host installation is insufficient. We implement a **Docker-on-Demand** strategy:

1.  **Orchestrator**: Backend sends code to a specialized "Executor Microservice".
2.  **Image Pulling**: The service pulls minimal images (e.g., `alpine-python`, `rust:slim`) and caches them.
3.  **Volume Mounting**: Code is mounted as a read-only volume to `/app/main.ext`.
4.  **Network Isolation**: Use `--network none` to prevent the executed code from making external requests or accessing internal metadata APIs.

### B. Security Hardening (The "Iron Box")
1.  **Resource Quotas**:
    - CPU: Limit to 0.5 vCPU.
    - RAM: Limit to 256MB.
    - Disk: 10MB temporary write limit.
2.  **Syscall Filtering**: Use `seccomp` profiles to disable dangerous syscalls (e.g., `fork`, `execve`, `ptrace`).
3.  **Process Limit**: Set `ulimit -u 10` to prevent fork bombs.

### C. AI-Powered Developer Assistance
Integration with Groq/Llama-3 (as seen in `code.py`) provides:
1.  **Automated Code Review**: Analyzes the active file on-demand for security flaws and performance bottlenecks.
2.  **Semantic Search**: Uses FAISS vectors to let users search for logic across all 100 languages, not just text matches.
3.  **Contextual Refactoring**: Use the `AIRefinePanel` to send selected code blocks to the backend for AI-driven transformation.

---

## 7. Maintenance & Updates

### Adding a New Language (Language #101+)
1.  **Backend**: Add entry to `SUPPORTED_LANGUAGES` in `sandbox.py`.
2.  **Frontend**: Add extension mapping in `codeStore.ts`.
3.  **Editor**: Register the language in `CodeEditor.tsx` for syntax highlighting.
4.  **Test**: Verify execution via the "Run" button in Code Lab.

---
*End of Guide - Engunity Confidential*
