# Recursive Language Models (RLM) Architecture in Chat Module

**Based on:** "Recursive Language Models" (Zhang et al., 2026) - Paper: `2512.24601v2.pdf`

## Overview

This document explains how Recursive Language Models (RLMs) work and how they're integrated into our chat module to handle arbitrarily long contexts by treating prompts as external environments.

---

## Top-Down Architecture: RLM in Chat Module

```mermaid
graph TD
    subgraph "Frontend Layer"
        A[User Query] --> B[Chat Component]
        B --> C[OmniRAG Service]
        C --> D{Strategy Selection}
        D -->|recursive_intensive| E[RLM Strategy Selected]
    end

    subgraph "API Gateway Layer"
        E --> F[POST /api/v1/omni-rag/query]
        F --> G[Chat API Endpoint]
    end

    subgraph "RLM Core Engine"
        G --> H[RLM Initialization]
        H --> I[Create REPL Environment]
        I --> J[Load Prompt as Variable]
        J --> K{RLM Loop Begins}
        
        K --> L[Root LLM Call]
        L --> M{Action Type?}
        
        M -->|Code Execution| N[Execute Python in REPL]
        M -->|Peek/Inspect| O[Inspect Context Variable]
        M -->|Recursive Call| P[Sub-LLM Query]
        M -->|Final Answer| Q[Return FINAL Response]
        
        N --> R[Update Environment State]
        O --> R
        P --> S[Recursive Sub-Call]
        S --> T[Process Chunk]
        T --> U[Return to Parent]
        U --> R
        
        R --> V{Has FINAL var?}
        V -->|No| K
        V -->|Yes| Q
    end

    subgraph "Supporting Services"
        W[Vector Store] -.->|Context Retrieval| I
        X[Memory System] -.->|Session Context| I
        Y[Document Processor] -.->|Chunking| I
    end

    Q --> Z[Stream Response to Frontend]
    Z --> AA[Display in Chat UI]

    style E fill:#ff9999
    style K fill:#99ccff
    style P fill:#99ff99
    style Q fill:#ffcc99
```

---

## Core RLM Algorithm (From Paper)

```mermaid
flowchart TD
    subgraph "Algorithm 1: Recursive Language Model"
        START[Input: Prompt P] --> INIT[Initialize REPL Environment E]
        INIT --> LOADP[Load P as variable 'context']
        LOADP --> ADDFN[Add sub_RLM function to E]
        ADDFN --> META[Create metadata: length, preview]
        META --> HIST[Initialize history = Metadata only]
        
        HIST --> LOOP{RLM Loop}
        
        LOOP --> LLM[code ← LLM_M history]
        LLM --> EXEC[state, stdout ← REPL E, code]
        EXEC --> UPDATE[history ← history || code || Metadata stdout]
        
        UPDATE --> CHECK{state FINAL set?}
        CHECK -->|No| LOOP
        CHECK -->|Yes| RETURN[return state FINAL]
    end

    style LOOP fill:#e6f3ff
    style LLM fill:#ffe6e6
    style CHECK fill:#e6ffe6
```

---

## Key Design Principles

```mermaid
graph LR
    subgraph "RLM vs Standard LLM"
        A[Standard LLM] --> A1[Prompt fed directly into model]
        A1 --> A2[Context window limitation]
        A2 --> A3[Context rot at long lengths]
        
        B[Recursive LLM] --> B1[Prompt stored as REPL variable]
        B1 --> B2[Symbolic manipulation via code]
        B2 --> B3[Recursive sub-calls on chunks]
        B3 --> B4[Unbounded context processing]
    end

    style A fill:#ffcccc
    style B fill:#ccffcc
```

### Three Critical Differences from Standard Scaffolds:

```mermaid
graph TD
    subgraph "1. Symbolic Handle to Prompt"
        P1[❌ Standard: P directly in context] 
        P2[✅ RLM: P as REPL variable]
        P1 -.->|Limited| L1[Context Window K]
        P2 -.->|Unlimited| L2[Symbolic Access]
    end

    subgraph "2. Output Generation"
        O1[❌ Standard: Autoregressive FINAL]
        O2[✅ RLM: Variable Construction]
        O1 -.->|Limited| OL1[Output Length K]
        O2 -.->|Unlimited| OL2[Build in REPL]
    end

    subgraph "3. Symbolic Recursion"
        R1[❌ Standard: Verbalized sub-calls]
        R2[✅ RLM: Programmatic loops]
        R1 -.->|Few calls| RL1[Linear delegation]
        R2 -.->|Many calls| RL2[Ω P or Ω P² processes]
    end

    style P2 fill:#ccffcc
    style O2 fill:#ccffcc
    style R2 fill:#ccffcc
```

---

## Implementation in Your Chat Module

### Current Integration Points

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend Chat
    participant API as OmniRAG API
    participant RLM as RLM Pipeline
    participant LLM as Language Model
    participant ENV as REPL Environment

    U->>F: Send long query (>100K tokens)
    F->>API: POST /omni-rag/query<br/>{strategy: 'recursive_intensive'}
    
    API->>RLM: Initialize RLM
    RLM->>ENV: Create Python REPL
    RLM->>ENV: context = user_prompt
    RLM->>ENV: Add sub_llm() function
    
    loop RLM Iterations
        RLM->>LLM: Generate code to process context
        LLM-->>RLM: Python code
        RLM->>ENV: Execute code
        ENV-->>RLM: stdout, updated state
        
        alt Code calls sub_llm(chunk)
            RLM->>LLM: Recursive call on chunk
            LLM-->>RLM: chunk result
            RLM->>ENV: Store result in variable
        end
        
        RLM->>RLM: Check if FINAL set
    end
    
    RLM-->>API: Final answer from REPL
    API-->>F: Stream response
    F-->>U: Display answer
```

---

## REPL Environment Structure

```mermaid
graph TB
    subgraph "REPL Environment E"
        V1[Variable: context<br/>Original prompt P]
        V2[Variable: context_length<br/>Total characters]
        V3[Variable: context_chunks<br/>Array of chunk lengths]
        
        F1[Function: sub_llm query<br/>Invoke recursive LLM]
        F2[Function: print<br/>Output for debugging]
        
        S1[State: Intermediate Variables<br/>buffers, results, etc.]
        S2[State: Final<br/>Answer variable]
    end

    V1 --> F1
    F1 --> S1
    S1 --> S2

    style V1 fill:#e6f3ff
    style F1 fill:#ffe6f3
    style S2 fill:#ccffcc
```

---

## Example: Processing Long Document

```mermaid
stateDiagram-v2
    [*] --> Initialize
    Initialize --> ProbeContext: Inspect context variable
    ProbeContext --> ChooseStrategy: Determine chunking approach
    
    state ChooseStrategy {
        [*] --> CheckLength
        CheckLength --> SmallDoc: <100K chars
        CheckLength --> LargeDoc: >100K chars
        
        SmallDoc --> DirectProcess
        LargeDoc --> ChunkingStrategy
    }
    
    ChooseStrategy --> ExecuteStrategy
    
    state ExecuteStrategy {
        [*] --> ChunkLoop
        ChunkLoop --> SubLLMCall: For each chunk
        SubLLMCall --> StoreResult: Save to buffer
        StoreResult --> ChunkLoop: Next chunk
        ChunkLoop --> Aggregate: All chunks done
    }
    
    ExecuteStrategy --> ConstructFinal
    ConstructFinal --> [*]: Return FINAL variable
```

---

## Complexity Scaling Behavior

```mermaid
graph LR
    subgraph "Task Complexity Classes"
        T1[Constant O 1<br/>Needle-in-haystack<br/>S-NIAH benchmark]
        T2[Linear O n<br/>Semantic aggregation<br/>OOLONG benchmark]
        T3[Quadratic O n²<br/>Pairwise reasoning<br/>OOLONG-Pairs benchmark]
    end

    T1 --> P1[Few sub-calls<br/>Direct retrieval]
    T2 --> P2[Sub-call per chunk<br/>Map-reduce pattern]
    T3 --> P3[Sub-call per pair<br/>Nested loops]

    P1 --> C1[Cost: ~O 1]
    P2 --> C2[Cost: ~O n]
    P3 --> C3[Cost: ~O n²]

    style T1 fill:#ccffcc
    style T2 fill:#ffffcc
    style T3 fill:#ffcccc
```

---

## Performance Characteristics (From Paper)

### Context Length vs Performance

```mermaid
graph TD
    subgraph "Standard LLM Performance"
        S1[8K tokens: 100%] --> S2[16K tokens: 90%]
        S2 --> S3[33K tokens: 80%]
        S3 --> S4[66K tokens: 60%]
        S4 --> S5[131K tokens: 40%]
        S5 --> S6[262K tokens: 20%]
        S6 --> S7[>272K: FAILS]
    end

    subgraph "RLM Performance"
        R1[8K tokens: 95%] --> R2[16K tokens: 95%]
        R2 --> R3[33K tokens: 95%]
        R3 --> R4[66K tokens: 95%]
        R4 --> R5[131K tokens: 95%]
        R5 --> R6[262K tokens: 95%]
        R6 --> R7[524K tokens: 95%]
        R7 --> R8[1M+ tokens: 90%+]
    end

    style S7 fill:#ff0000
    style R8 fill:#00ff00
```

---

## Integration with Your Existing RAG Pipeline

```mermaid
graph TB
    subgraph "Enhanced OmniRAG with RLM"
        Q[User Query] --> CLS[Complexity Classifier]
        
        CLS -->|Simple| D1[Direct Generation]
        CLS -->|Medium| D2[Vector RAG]
        CLS -->|Complex| D3[Graph RAG]
        CLS -->|Very Long/Dense| D4[RLM Strategy]
        
        D4 --> RLM[Initialize RLM]
        RLM --> REPL[REPL Environment]
        
        REPL --> TOOLS{Available Tools}
        TOOLS --> T1[Vector Retrieval]
        TOOLS --> T2[Web Search]
        TOOLS --> T3[Memory System]
        TOOLS --> T4[Sub-LLM Calls]
        
        T1 --> COMBINE[Combine Results]
        T2 --> COMBINE
        T3 --> COMBINE
        T4 --> COMBINE
        
        COMBINE --> FINAL[Construct Final Answer]
    end

    style D4 fill:#ff9999
    style RLM fill:#99ccff
```

---

## Emergent Patterns in RLM Trajectories

```mermaid
graph TD
    subgraph "Common RLM Behaviors Observed"
        P1[Pattern 1: Chunking + Recursion]
        P1 --> P1A[Split context by semantic boundaries]
        P1A --> P1B[Sub-LLM call per chunk]
        P1B --> P1C[Aggregate results]
        
        P2[Pattern 2: Filtering with Code]
        P2 --> P2A[Use regex/search without LLM]
        P2A --> P2B[Narrow to relevant sections]
        P2B --> P2C[Sub-LLM only on matches]
        
        P3[Pattern 3: Variable Buffers]
        P3 --> P3A[Build answer incrementally]
        P3A --> P3B[Store in REPL variables]
        P3B --> P3C[Return variable not text]
    end

    style P1 fill:#e6f3ff
    style P2 fill:#ffe6f3
    style P3 fill:#f3ffe6
```

---

## Cost Analysis

```mermaid
graph LR
    subgraph "Token Cost Breakdown"
        ROOT[Root LLM Calls] --> ROOT_COST[Constant metadata<br/>~1K tokens per iteration]
        SUB[Sub-LLM Calls] --> SUB_COST[Variable by strategy<br/>~10-500K per call]
        
        ROOT_COST --> TOTAL
        SUB_COST --> TOTAL
        
        TOTAL[Total Cost] --> OPT[Optimization Strategies]
        
        OPT --> OPT1[Batch chunks intelligently]
        OPT --> OPT2[Use cheaper model for sub-calls]
        OPT --> OPT3[Cache sub-call results]
    end

    style TOTAL fill:#ffffcc
    style OPT fill:#ccffcc
```

---

## Configuration in Your System

### Backend Configuration (`backend/app/services/rag/pipeline.py`)

```python
class RLMConfig:
    max_recursion_depth: int = 1  # Paper uses depth=1
    chunk_size: int = 100000  # ~30K tokens
    max_iterations: int = 20  # Root LLM loop limit
    sub_model: str = "gpt-4o-mini"  # Cheaper for sub-calls
    root_model: str = "gpt-4o"  # Stronger for orchestration
    enable_caching: bool = True
    timeout_per_call: int = 120
```

### Frontend Strategy Selection

```typescript
interface RLMOptions {
  strategy: 'recursive_intensive';
  max_context_length?: number;  // Auto-trigger threshold
  enable_streaming?: boolean;
  chunk_strategy?: 'semantic' | 'fixed' | 'adaptive';
}
```

---

## System Prompt Structure for RLM

```mermaid
graph TD
    PROMPT[System Prompt for RLM]
    
    PROMPT --> ROLE[Role: Code-writing assistant]
    PROMPT --> ENV[Environment: Python REPL]
    PROMPT --> VARS[Available Variables]
    PROMPT --> FUNCS[Available Functions]
    PROMPT --> GOAL[Goal: Solve query symbolically]
    PROMPT --> OUTPUT[Output: FINAL variable or code]
    
    VARS --> V1[context: user prompt]
    VARS --> V2[context_length: int]
    VARS --> V3[context_chunks: list]
    
    FUNCS --> F1[sub_llm query: recursive call]
    FUNCS --> F2[print str: debug output]
    
    OUTPUT --> O1[FINAL answer: direct string]
    OUTPUT --> O2[FINAL_VAR var_name: from REPL]

    style PROMPT fill:#e6f3ff
    style GOAL fill:#ffe6e6
```

---

## Recommendations for Your Implementation

```mermaid
mindmap
  root((RLM Integration))
    Frontend
      Auto-detect long contexts
      Show RLM reasoning steps
      Stream intermediate results
      Progress indicators
    
    Backend
      Implement Algorithm 1 strictly
      Add cost tracking per trajectory
      Enable async sub-calls
      Cache sub-call results
    
    Testing
      Benchmark on OOLONG tasks
      Test with 100K+ token docs
      Measure cost vs accuracy
      Profile recursion patterns
    
    Optimization
      Use smaller model for sub-calls
      Batch chunks intelligently
      Add early stopping
      Implement retries
```

---

## Future Enhancements

1. **Native RLM Training**: Fine-tune model specifically for recursive behavior (paper shows 28.3% improvement)
2. **Asynchronous Sub-Calls**: Parallelize independent sub-LLM queries
3. **Deeper Recursion**: Allow sub-calls to make their own sub-calls (depth > 1)
4. **Cost Prediction**: Estimate trajectory cost before execution
5. **Hybrid Approaches**: Combine RLM with graph RAG for knowledge-intensive tasks

---

## References

- **Paper**: Zhang et al., "Recursive Language Models" (arXiv:2512.24601v2, 2026)
- **Code**: https://github.com/alexzhang13/rlm
- **Your Codebase**: 
  - `backend/app/services/rag/pipeline.py` - RAG pipeline
  - `frontend/src/services/omniRag.ts` - OmniRAG service
  - `backend/app/api/v1/chat.py` - Chat API

---

## Quick Start Integration

### 1. Enable RLM in Chat Request

```typescript
const response = await omniRagService.query({
  query: "Analyze this 200K token document...",
  strategy: 'recursive_intensive',
  session_id: sessionId
});
```

### 2. Backend Detects RLM Strategy

```python
if strategy == "recursive_intensive":
    result = await rlm_pipeline.process(query, context)
```

### 3. RLM Processes with REPL

See Algorithm 1 diagram above for execution flow.

---

**This architecture enables your chat module to handle arbitrarily long contexts (10M+ tokens) while maintaining high quality and reasonable costs.**
