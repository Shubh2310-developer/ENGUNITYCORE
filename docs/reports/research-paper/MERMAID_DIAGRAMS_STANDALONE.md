# Standalone Mermaid Diagrams - Ready for Export

This file contains all mermaid diagrams in standalone format for easy export to PNG/PDF/SVG for your research paper.

---

## Diagram 1: Code Lab System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js UI Components]
        Store[Zustand State Management]
        WS_Client[WebSocket Client]
    end
    
    subgraph "Code Lab Components"
        Editor[Monaco Code Editor]
        Terminal[xterm.js Terminal]
        FileExplorer[File Explorer]
        GitSidebar[Git Integration]
        DebugPanel[Debug Console]
        AIPanel[AI Refine Panel]
    end
    
    subgraph "Backend API Layer"
        FastAPI[FastAPI Server]
        CodeAPI[Code Execution API]
        FileAPI[File Management API]
        GitAPI[Git Operations API]
        TerminalAPI[Terminal WebSocket API]
        DebugAPI[Debug Adapter API]
    end
    
    subgraph "Core Services"
        Sandbox[Code Execution Sandbox]
        SocketMgr[Socket Manager]
        GitService[Git Service]
        AIService[AI Service]
    end
    
    subgraph "Infrastructure"
        Languages[98+ Language Runtimes]
        Docker[Docker Containers]
        FileSystem[File System]
        Database[Supabase DB]
    end
    
    UI --> Store
    Store --> WS_Client
    UI --> Editor
    UI --> Terminal
    UI --> FileExplorer
    UI --> GitSidebar
    UI --> DebugPanel
    UI --> AIPanel
    
    Editor --> CodeAPI
    Terminal --> TerminalAPI
    FileExplorer --> FileAPI
    GitSidebar --> GitAPI
    DebugPanel --> DebugAPI
    AIPanel --> CodeAPI
    
    CodeAPI --> Sandbox
    TerminalAPI --> SocketMgr
    GitAPI --> GitService
    FileAPI --> FileSystem
    DebugAPI --> Sandbox
    
    Sandbox --> Languages
    Sandbox --> Docker
    SocketMgr --> Terminal
    GitService --> FileSystem
    
    CodeAPI --> Database
    FileAPI --> Database
    
    style Editor fill:#2DD4BF
    style Terminal fill:#2DD4BF
    style Sandbox fill:#0EA5E9
    style Languages fill:#22D3EE
```

---

## Diagram 2: Code Execution Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Sandbox
    participant Runtime
    
    User->>Frontend: Write Code & Click Execute
    Frontend->>API: POST /code/execute
    Note over API: Validate request
    API->>Sandbox: execute_code(code, language)
    Note over Sandbox: Create temp file
    Sandbox->>Runtime: Compile/Execute
    Note over Runtime: Python/JS/C++/Java/etc
    Runtime-->>Sandbox: stdout, stderr, exit_code
    Sandbox->>Sandbox: Cleanup temp files
    Sandbox-->>API: Execution result
    API-->>Frontend: JSON response
    Frontend->>User: Display output
```

---

## Diagram 3: Terminal WebSocket Communication

```mermaid
sequenceDiagram
    participant Browser
    participant Frontend
    participant SocketManager
    participant Terminal
    participant Shell
    
    Browser->>Frontend: Open Terminal Tab
    Frontend->>SocketManager: Connect WebSocket
    SocketManager->>Terminal: Create Terminal Instance
    Terminal->>Shell: Spawn bash/sh process
    
    Note over Browser,Shell: Real-time bidirectional communication
    
    Browser->>Frontend: User types command
    Frontend->>SocketManager: Send via WebSocket
    SocketManager->>Terminal: Forward input
    Terminal->>Shell: stdin
    
    Shell-->>Terminal: stdout/stderr
    Terminal-->>SocketManager: Output data
    SocketManager-->>Frontend: WebSocket message
    Frontend-->>Browser: Display in xterm.js
    
    Note over Browser,Shell: Resize handling
    
    Browser->>Frontend: Window resize
    Frontend->>SocketManager: Send resize event
    SocketManager->>Terminal: Update dimensions
    Terminal->>Shell: SIGWINCH signal
```

---

## Diagram 4: Git Integration Workflow

```mermaid
flowchart TD
    Start[User Opens Git Sidebar] --> Status[Get Git Status]
    Status --> Display[Display Files]
    
    Display --> Modified{Files Modified?}
    Modified -->|Yes| ShowFiles[Show Staged/Unstaged Lists]
    Modified -->|No| Clean[Clean Working Tree]
    
    ShowFiles --> UserAction{User Action}
    
    UserAction -->|Stage| Stage[stageFile API call]
    UserAction -->|Unstage| Unstage[unstageFile API call]
    UserAction -->|Commit| Commit[commitChanges API call]
    UserAction -->|View History| History[Show Git Log]
    
    Stage --> UpdateUI[Update UI State]
    Unstage --> UpdateUI
    Commit --> CommitMsg{Commit Message?}
    
    CommitMsg -->|Provided| Execute[Execute git commit]
    CommitMsg -->|Empty| Error[Show Error]
    
    Execute --> Success[Update Status]
    Success --> Display
    
    History --> ShowLog[Display Commits]
    ShowLog --> Display
    
    style Stage fill:#2DD4BF
    style Commit fill:#0EA5E9
    style Success fill:#22D3EE
```

---

## Diagram 5: AI Code Assistance

```mermaid
graph LR
    subgraph "User Interaction"
        Type[User Types Code]
        Select[User Selects Code]
        Refactor[Click Refactor]
    end
    
    subgraph "AI Provider"
        Inline[Inline Completion]
        Analysis[Code Analysis]
        Suggestions[Refactor Suggestions]
    end
    
    subgraph "Backend Processing"
        LLM[Groq/Gemini LLM]
        Context[Code Context]
        Prompt[Prompt Engineering]
    end
    
    Type --> Inline
    Inline --> Context
    Context --> Prompt
    Prompt --> LLM
    LLM --> Inline
    
    Select --> Refactor
    Refactor --> Analysis
    Analysis --> Context
    LLM --> Suggestions
    Suggestions --> Display[Show in AI Panel]
    
    style Inline fill:#2DD4BF
    style LLM fill:#0EA5E9
    style Display fill:#22D3EE
```

---

## Diagram 6: Debug Session State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Starting: User clicks Debug
    Starting --> Running: Session Created
    
    Running --> Paused: Breakpoint Hit
    Running --> Stopped: User stops
    Running --> Error: Exception thrown
    
    Paused --> Running: Continue
    Paused --> Stepping: Step Over/Into/Out
    Paused --> Stopped: Stop Debug
    
    Stepping --> Paused: Step Complete
    
    Error --> Idle: Reset
    Stopped --> Idle: Cleanup
    
    note right of Running
        Variables tracked
        Call stack updated
        Console output
    end note
    
    note right of Paused
        Inspect variables
        Evaluate expressions
        View call stack
    end note
```

---

## Diagram 7: Full Stack Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        NextJS[Next.js 14 App Router]
        React[React Components]
        Zustand[Zustand Store]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy]
        CORS[CORS Handler]
        Auth[JWT Authentication]
    end
    
    subgraph "Application Layer"
        FastAPI[FastAPI Backend]
        SocketIO[Socket.IO Server]
        Celery[Celery Workers]
    end
    
    subgraph "Business Logic"
        CodeExec[Code Execution Service]
        FileService[File Management]
        GitService[Git Operations]
        AIService[AI Integration]
        DebugService[Debug Adapter]
    end
    
    subgraph "Data Layer"
        Supabase[(Supabase PostgreSQL)]
        MongoDB[(MongoDB)]
        Redis[(Redis Cache)]
        FileStorage[File System Storage]
    end
    
    subgraph "External Services"
        Groq[Groq API]
        Gemini[Google Gemini]
        GitHub[GitHub API]
    end
    
    subgraph "Infrastructure"
        Docker[Docker Containers]
        Languages[Language Runtimes]
        Sandbox[Execution Sandbox]
    end
    
    Browser --> NextJS
    NextJS --> React
    React --> Zustand
    
    Zustand --> NGINX
    NGINX --> CORS
    CORS --> Auth
    
    Auth --> FastAPI
    Auth --> SocketIO
    FastAPI --> Celery
    
    FastAPI --> CodeExec
    FastAPI --> FileService
    FastAPI --> GitService
    FastAPI --> AIService
    FastAPI --> DebugService
    
    CodeExec --> Sandbox
    FileService --> FileStorage
    GitService --> FileStorage
    AIService --> Groq
    AIService --> Gemini
    GitService --> GitHub
    
    CodeExec --> Supabase
    FileService --> Supabase
    AIService --> MongoDB
    FastAPI --> Redis
    
    Sandbox --> Docker
    Sandbox --> Languages
    
    style Browser fill:#E2E8F0
    style FastAPI fill:#2DD4BF
    style Sandbox fill:#0EA5E9
    style Supabase fill:#22D3EE
```

---

## Diagram 8: Data Flow - Code Execution

```mermaid
flowchart LR
    A[User Input] --> B[Frontend Validation]
    B --> C[API Request]
    C --> D{Language Detection}
    
    D --> E[Python Handler]
    D --> F[JavaScript Handler]
    D --> G[C++ Handler]
    D --> H[Java Handler]
    D --> I[Other Languages]
    
    E --> J[Sandbox Execution]
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> K[Capture Output]
    K --> L[Parse Results]
    L --> M[Store in DB]
    M --> N[Return Response]
    N --> O[Display to User]
    
    style D fill:#2DD4BF
    style J fill:#0EA5E9
    style O fill:#22D3EE
```

---

## Diagram 9: Component Hierarchy

```mermaid
graph TD
    App[App Root] --> Layout[Dashboard Layout]
    
    Layout --> Sidebar[Sidebar Navigation]
    Layout --> Main[Main Content Area]
    
    Main --> CodeLab[Code Lab Page]
    
    CodeLab --> TopBar[Top Bar]
    CodeLab --> EditorArea[Editor Area]
    CodeLab --> BottomPanel[Bottom Panel]
    
    TopBar --> Breadcrumbs[Breadcrumbs]
    TopBar --> Actions[Action Buttons]
    
    EditorArea --> Left[Left Sidebar]
    EditorArea --> Center[Center Editor]
    EditorArea --> Right[Right Sidebar]
    
    Left --> FileExplorer[File Explorer]
    Left --> GitSidebar[Git Sidebar]
    
    Center --> EditorTabs[Editor Tabs]
    Center --> Monaco[Monaco Editor]
    Center --> AIInline[AI Inline Provider]
    
    Right --> DebugSidebar[Debug Sidebar]
    Right --> AIRefine[AI Refine Panel]
    
    BottomPanel --> Terminal[Terminal]
    BottomPanel --> DebugConsole[Debug Console]
    BottomPanel --> TestRunner[Test Runner]
    
    style CodeLab fill:#2DD4BF
    style Monaco fill:#0EA5E9
    style Terminal fill:#22D3EE
```

---

## Diagram 10: RAG Architecture (from existing docs)

```mermaid
graph TD
    UserQuery[User Query] --> Complexity{Complexity Classifier}

    %% Adaptive Routing
    Complexity -- "SIMPLE" --> DirectGen[Direct LLM Generation]
    Complexity -- "SINGLE_HOP" --> VectorFlow[Enhanced Vector Flow]
    Complexity -- "MULTI_HOP" --> GraphFlow[GraphRAG Flow]

    %% Enhanced Vector Flow
    subgraph VectorFlow
        MultiQuery[Multi-Query Expansion] --> HyDE[HyDE transformation]
        HyDE --> HybridSearch[Hybrid Search: HNSW + BM25]
        HybridSearch --> Rerank[BGE Reranker v2]
    end

    %% Intelligence Layers
    Rerank --> CRAG{CRAG Evaluator}
    CRAG -- "Fallback" --> WebSearch[Tavily Web Search]

    CRAG --> Compression[Contextual Compression]
    Memory[Hierarchical Memory] --> PromptBuilder[System Prompt Assembly]
    Compression --> PromptBuilder

    PromptBuilder --> Generator[Llama 3.3 70B]
    Generator --> Critique{Self-Critique}
    Critique --> FinalAnswer[Final Response with Citations]
```

---

## Diagram 11: API Endpoints Mind Map

```mermaid
mindmap
  root((Code Lab API))
    Code Execution
      POST /execute
      POST /ai/complete
      POST /ai/refactor
      POST /ai/analyze
    File Management
      GET /files
      POST /files
      GET /files/{id}
      PATCH /files/{id}
      DELETE /files/{id}
    Git Operations
      GET /git/status
      POST /git/commit
      GET /git/branches
      GET /git/log
      POST /git/stage
      POST /git/unstage
    Terminal
      WebSocket /terminal
      POST /terminal/execute
    Debug
      POST /debug/start
      POST /debug/stop
      POST /debug/breakpoint
      POST /debug/continue
      POST /debug/step
      GET /debug/variables
```

---

## Diagram 12: Security Architecture

```mermaid
graph TD
    User[User Request] --> WAF[Web Application Firewall]
    WAF --> SSL[SSL/TLS Termination]
    SSL --> RateLimit[Rate Limiting]
    RateLimit --> Auth[JWT Authentication]
    
    Auth --> RBAC{Role-Based Access}
    RBAC -->|Admin| AdminAPI[Admin APIs]
    RBAC -->|User| UserAPI[User APIs]
    RBAC -->|Guest| PublicAPI[Public APIs]
    
    UserAPI --> Validation[Input Validation]
    Validation --> Sanitization[SQL Injection Prevention]
    Sanitization --> Sandbox[Code Execution Sandbox]
    
    Sandbox --> Isolation[Process Isolation]
    Isolation --> Timeout[Execution Timeout]
    Timeout --> Resource[Resource Limits]
    
    Resource --> Cleanup[Automatic Cleanup]
    Cleanup --> Response[Secure Response]
    
    style WAF fill:#2DD4BF
    style Auth fill:#0EA5E9
    style Sandbox fill:#22D3EE
```

---

## Diagram 13: Language Support Matrix

```mermaid
mindmap
  root((98+ Languages))
    Scripting
      Python
      JavaScript
      TypeScript
      Ruby
      PHP
      Perl
      Lua
      Bash
    Compiled
      C
      C++
      Java
      Rust
      Go
      Swift
      Kotlin
      Scala
    Functional
      Haskell
      Elixir
      Erlang
      Clojure
      OCaml
      F#
    Modern
      Dart
      Julia
      Zig
      Nim
      Crystal
      V
    Blockchain
      Solidity
      Move
      Cairo
      Noir
    Scientific
      R
      MATLAB
      Fortran
    Systems
      Assembly
      COBOL
      Ada
      Pascal
```

---

## Diagram 14: Production Deployment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx Load Balancer]
    end
    
    subgraph "Frontend Cluster"
        Next1[Next.js Instance 1]
        Next2[Next.js Instance 2]
        Next3[Next.js Instance 3]
    end
    
    subgraph "Backend Cluster"
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
        API3[FastAPI Instance 3]
    end
    
    subgraph "Worker Cluster"
        Worker1[Celery Worker 1]
        Worker2[Celery Worker 2]
    end
    
    subgraph "Data Layer"
        DB[(Primary DB)]
        DBReplica[(Read Replica)]
        Cache[(Redis Cluster)]
    end
    
    LB --> Next1
    LB --> Next2
    LB --> Next3
    
    Next1 --> API1
    Next2 --> API2
    Next3 --> API3
    
    API1 --> DB
    API2 --> DB
    API3 --> DB
    
    API1 --> DBReplica
    API2 --> DBReplica
    API3 --> DBReplica
    
    API1 --> Cache
    API2 --> Cache
    API3 --> Cache
    
    API1 --> Worker1
    API2 --> Worker2
    
    style LB fill:#2DD4BF
    style DB fill:#0EA5E9
    style Cache fill:#22D3EE
```

---

## Export Instructions

### Method 1: Mermaid CLI (Recommended for High Quality)
```bash
# Install mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# Export to PNG (high resolution)
mmdc -i diagram.mmd -o diagram.png -w 2400 -H 1800 -b transparent

# Export to SVG (vector, best for papers)
mmdc -i diagram.mmd -o diagram.svg -b transparent

# Export to PDF
mmdc -i diagram.mmd -o diagram.pdf
```

### Method 2: Online Tools
- **Mermaid Live Editor:** https://mermaid.live/
  - Paste diagram code
  - Export as PNG/SVG/PDF
  - Adjust theme and scale

- **Draw.io with Mermaid:** https://app.diagrams.net/
  - Import mermaid code
  - Export in various formats

### Method 3: VS Code Extension
- Install "Markdown Preview Mermaid Support"
- Preview in VS Code
- Right-click to export

---

## Recommended Settings for Research Paper

### For IEEE/ACM Papers:
- **Format:** PNG or PDF (vector)
- **Resolution:** 300 DPI minimum
- **Width:** 3.5 inches (single column) or 7 inches (double column)
- **Color:** Use color sparingly, ensure grayscale readability
- **Fonts:** Embed all fonts

### Export Command for Paper Quality:
```bash
mmdc -i diagram.mmd -o diagram.pdf -t neutral -b white -w 3500 -H 2625
```

This creates 300 DPI images at 7 inches wide (suitable for double-column papers).

---

**Total Diagrams:** 14  
**Ready for Export:** ✅ All diagrams  
**Theme:** Engunity (Cyber Teal/Sky/Cyan)  
**Status:** Production Ready
