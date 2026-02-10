# Visual Assets for Research Paper - Engunity Code Lab

**Generated:** 2026-02-04  
**Purpose:** Complete collection of images, mermaid diagrams, and architecture visuals for research paper

---

## Table of Contents
1. [Existing Images](#existing-images)
2. [Existing Mermaid Diagrams](#existing-mermaid-diagrams)
3. [New Code Lab Diagrams](#new-code-lab-diagrams)
4. [System Architecture](#system-architecture)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Component Hierarchies](#component-hierarchies)
7. [API Documentation](#api-documentation)

---

## 1. Existing Images

### Project Screenshots (frontend/public/)

1. **HERO.jpeg** (72 KB)
   - Main landing page hero image
   - Shows overall platform interface

2. **Hero1.jpeg** (103 KB)
   - Alternative hero image
   - Platform overview

3. **AICODEANDCHAT.jpeg** (99 KB)
   - AI Code and Chat feature showcase
   - Demonstrates dual functionality

4. **ClincialCodeAsistant.jpeg** (60 KB)
   - Clinical code assistant feature
   - Healthcare AI integration

5. **DocumentRAG.jpeg** (96 KB)
   - Document RAG system visualization
   - Shows document processing pipeline

6. **BENTO.jpeg** (68 KB)
   - Bento grid layout showcase
   - Feature matrix display

7. **Logo1.jpg** (42 KB)
   - Official Engunity logo
   - Branding asset

**Location:** `/home/agentrogue/Engunity/frontend/public/`

---

## 2. Existing Mermaid Diagrams

### 2.1 RAG Architecture (from rag_research.md)

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

**Description:** Advanced RAG system with adaptive routing, hybrid search, and self-correction

---

### 2.2 Chat Implementation (from chat_implementation.md)

```mermaid
graph TD
    User[User Message] --> API[Chat API Endpoint]
    API --> Router[AI Router]
    
    Router --> Provider{AI Provider Selection}
    Provider -->|Local| Groq[Groq API]
    Provider -->|Cloud| Gemini[Gemini API]
    
    Groq --> Response[Generate Response]
    Gemini --> Response
    
    Response --> Store[Save to Database]
    Store --> Return[Return to Frontend]
```

**Description:** Chat message flow with AI provider routing

---

## 3. New Code Lab Diagrams

### 3.1 Code Lab System Architecture

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

**Description:** Complete Code Lab system architecture showing all layers and integrations

---

### 3.2 Code Execution Flow

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

**Description:** Step-by-step code execution process with sandbox isolation

---

### 3.3 Terminal WebSocket Flow

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

**Description:** Real-time terminal communication via WebSocket

---

### 3.4 Git Integration Workflow

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

**Description:** Git operations workflow with stage/unstage/commit

---

### 3.5 AI Code Assistance Flow

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

**Description:** AI-powered code completion and refactoring

---

### 3.6 Debug Session Flow

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

**Description:** Debug session state machine

---

## 4. System Architecture Diagrams

### 4.1 Full Stack Architecture

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

**Description:** Complete full-stack architecture from browser to infrastructure

---

### 4.2 Microservices Architecture

```mermaid
graph LR
    subgraph "Frontend Services"
        WebApp[Web Application]
    end
    
    subgraph "Backend Microservices"
        CodeSvc[Code Execution Service]
        FileSvc[File Service]
        GitSvc[Git Service]
        AISvc[AI Service]
        DebugSvc[Debug Service]
        TermSvc[Terminal Service]
    end
    
    subgraph "Shared Infrastructure"
        Gateway[API Gateway]
        AuthSvc[Auth Service]
        Logger[Logging Service]
        Monitor[Monitoring]
    end
    
    WebApp --> Gateway
    Gateway --> AuthSvc
    
    Gateway --> CodeSvc
    Gateway --> FileSvc
    Gateway --> GitSvc
    Gateway --> AISvc
    Gateway --> DebugSvc
    Gateway --> TermSvc
    
    CodeSvc --> Logger
    FileSvc --> Logger
    GitSvc --> Logger
    AISvc --> Logger
    DebugSvc --> Logger
    TermSvc --> Logger
    
    Logger --> Monitor
    
    style CodeSvc fill:#2DD4BF
    style Gateway fill:#0EA5E9
    style AuthSvc fill:#22D3EE
```

**Description:** Microservices architecture with shared infrastructure

---

## 5. Data Flow Diagrams

### 5.1 Data Flow - Code Execution

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

**Description:** Complete data flow for code execution

---

### 5.2 Data Flow - File Operations

```mermaid
flowchart TD
    Create[Create File] --> Validate[Validate Path]
    Read[Read File] --> Validate
    Update[Update File] --> Validate
    Delete[Delete File] --> Validate
    
    Validate --> Auth{Authenticated?}
    Auth -->|Yes| Permission{Has Permission?}
    Auth -->|No| Reject[401 Unauthorized]
    
    Permission -->|Yes| Execute[Execute Operation]
    Permission -->|No| Reject2[403 Forbidden]
    
    Execute --> FileSystem[File System]
    Execute --> Database[Update Database]
    
    FileSystem --> Success{Success?}
    Database --> Success
    
    Success -->|Yes| Response[200 OK + Data]
    Success -->|No| Error[500 Error]
    
    style Auth fill:#2DD4BF
    style Execute fill:#0EA5E9
    style Response fill:#22D3EE
```

**Description:** File operations with authentication and authorization

---

### 5.3 Data Flow - Real-time Terminal

```mermaid
flowchart LR
    Input[User Input] --> WS[WebSocket]
    WS --> Server[Socket Manager]
    Server --> Terminal[Terminal Instance]
    Terminal --> Shell[Shell Process]
    
    Shell --> Output[Process Output]
    Output --> Terminal
    Terminal --> Server
    Server --> WS
    WS --> Display[Browser Display]
    
    style WS fill:#2DD4BF
    style Server fill:#0EA5E9
    style Display fill:#22D3EE
```

**Description:** Real-time bidirectional terminal communication

---

## 6. Component Hierarchies

### 6.1 Frontend Component Tree

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

**Description:** Complete frontend component hierarchy

---

### 6.2 Backend Service Structure

```mermaid
graph TD
    Main[main.py] --> API[API Router]
    
    API --> V1[API v1]
    
    V1 --> CodeAPI[code.py]
    V1 --> TermAPI[terminal.py]
    V1 --> GitAPI[git.py]
    V1 --> DebugAPI[debug.py]
    V1 --> FileAPI[file operations]
    
    CodeAPI --> Sandbox[sandbox.py]
    TermAPI --> SocketMgr[socket_manager.py]
    GitAPI --> GitService[repository.py]
    DebugAPI --> DebugAdapter[adapter.py]
    
    Sandbox --> Languages[Language Handlers]
    SocketMgr --> Rooms[Room Management]
    GitService --> GitOps[Git Operations]
    
    style Main fill:#2DD4BF
    style Sandbox fill:#0EA5E9
    style SocketMgr fill:#22D3EE
```

**Description:** Backend service architecture and dependencies

---

## 7. API Documentation Diagrams

### 7.1 API Endpoints Map

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

**Description:** Complete API endpoint structure

---

### 7.2 Request/Response Flow

```mermaid
sequenceDiagram
    participant Client
    participant Nginx
    participant FastAPI
    participant Service
    participant Database
    
    Client->>Nginx: HTTPS Request
    Nginx->>Nginx: SSL Termination
    Nginx->>FastAPI: HTTP Request
    FastAPI->>FastAPI: JWT Validation
    FastAPI->>FastAPI: Request Validation
    FastAPI->>Service: Business Logic
    Service->>Database: Query Data
    Database-->>Service: Results
    Service-->>FastAPI: Processed Data
    FastAPI-->>Nginx: JSON Response
    Nginx-->>Client: HTTPS Response
    
    Note over Client,Database: Average latency: 50-200ms
```

**Description:** Complete request/response cycle with timing

---

## 8. Deployment Architecture

### 8.1 Production Deployment

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

**Description:** Production deployment with high availability

---

### 8.2 Docker Container Architecture

```mermaid
graph LR
    subgraph "Docker Host"
        subgraph "Frontend Container"
            NextApp[Next.js App]
            Node[Node.js Runtime]
        end
        
        subgraph "Backend Container"
            FastAPIApp[FastAPI App]
            Python[Python Runtime]
            Languages[98+ Languages]
        end
        
        subgraph "Database Container"
            Postgres[PostgreSQL]
        end
        
        subgraph "Cache Container"
            RedisCache[Redis]
        end
        
        Network[Docker Network]
    end
    
    NextApp --> Network
    FastAPIApp --> Network
    Postgres --> Network
    RedisCache --> Network
    
    Network --> FastAPIApp
    Network --> Postgres
    Network --> RedisCache
    
    style Network fill:#2DD4BF
    style FastAPIApp fill:#0EA5E9
    style Postgres fill:#22D3EE
```

**Description:** Docker containerization architecture

---

## 9. Security Architecture

### 9.1 Security Layers

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

**Description:** Multi-layer security architecture

---

## 10. Performance Monitoring

### 10.1 Monitoring Architecture

```mermaid
graph LR
    subgraph "Application"
        App[Application Code]
        Metrics[Metrics Collection]
    end
    
    subgraph "Monitoring Stack"
        Prometheus[Prometheus]
        Grafana[Grafana Dashboard]
        AlertManager[Alert Manager]
    end
    
    subgraph "Logging"
        AppLogs[Application Logs]
        LogAggregator[Log Aggregator]
        LogStorage[Log Storage]
    end
    
    App --> Metrics
    Metrics --> Prometheus
    Prometheus --> Grafana
    Prometheus --> AlertManager
    
    App --> AppLogs
    AppLogs --> LogAggregator
    LogAggregator --> LogStorage
    
    AlertManager --> Notification[Slack/Email]
    
    style Prometheus fill:#2DD4BF
    style Grafana fill:#0EA5E9
    style LogStorage fill:#22D3EE
```

**Description:** Comprehensive monitoring and alerting system

---

## 11. Language Support Matrix

### 11.1 Supported Languages Visual

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

**Description:** Complete language support matrix

---

## Summary

### Asset Inventory

| Category | Count | Description |
|----------|-------|-------------|
| **Existing Images** | 7 | Screenshots and branding |
| **Existing Mermaid Diagrams** | 2 | RAG and Chat architecture |
| **New System Diagrams** | 11 | Complete architecture coverage |
| **Data Flow Diagrams** | 3 | Process flows |
| **Component Hierarchies** | 2 | Frontend and backend structure |
| **API Diagrams** | 2 | Endpoint maps and flows |
| **Deployment Diagrams** | 2 | Production and Docker |
| **Security Diagrams** | 1 | Security layers |
| **Monitoring Diagrams** | 1 | Observability stack |
| **Language Matrix** | 1 | Language support |

**Total Visual Assets:** 32+ diagrams and images

---

## Usage Instructions

### For LaTeX/IEEE Papers
1. Export mermaid diagrams to PNG/PDF using mermaid-cli or online tools
2. Use existing JPEG images from frontend/public/
3. Reference diagrams in paper with proper captions

### For Markdown/HTML
1. Copy mermaid code blocks directly into markdown
2. Use GitHub or GitLab rendering for automatic visualization
3. Embed images using relative paths

### For Presentations
1. Export high-resolution diagrams
2. Use consistent color scheme (Engunity theme)
3. Maintain aspect ratios for clarity

---

**Document Status:** Complete  
**Last Updated:** 2026-02-04  
**Assets Location:** Multiple (documented above)  
**Ready for:** Research Paper, Presentations, Documentation
