# EngUnityCore — Chat System Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [AI Core & Omni-RAG Pipeline](#ai-core--omni-rag-pipeline)
6. [Data Models & Storage](#data-models--storage)
7. [Message Lifecycle](#message-lifecycle)
8. [Feature Reference](#feature-reference)
9. [Environment & Configuration](#environment--configuration)

---

## Overview

EngUnityCore's **Neural Chat** is an AI-powered engineering assistant that routes queries through an adaptive Retrieval-Augmented Generation (RAG) pipeline. It supports multi-modal inputs (text + images), streaming responses via SSE, knowledge graph reasoning, hierarchical memory, and optional runtime quantization (TurboQuant).

**Key technology choices:**
| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Zustand, Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy, Motor (async MongoDB) |
| AI LLM | Groq API (`llama-3.3-70b-versatile`), Ollama fallback |
| Vector Store | Custom embeddings (sentence-transformers) |
| Graph Store | In-process KnowledgeGraph (NetworkX + community detection) |
| Message DB | MongoDB (`chat_messages` collection) |
| Session DB | PostgreSQL (`chat_sessions` table) |
| Caching | Redis (AI response cache) |
| Streaming | SSE (Server-Sent Events) |

---

## Step-by-Step Message Journey

This diagram explains exactly what happens when you send a message, from the moment you hit Enter to the final AI response.

```mermaid
flowchart TD
    %% Define Styles
    classDef user fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef frontend fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef ai fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef storage fill:#eceff1,stroke:#263238,stroke-width:2px;

    %% Steps
    Step1([<b>1. User Action</b><br/>📝 Types message + 🖼️ attaches images]) :::user
    
    Step1 --> Step2[<b>2. Frontend Prep</b><br/>Displays message instantly &<br/>opens a ⚡ Streaming Connection] :::frontend
    
    Step2 --> Step3[<b>3. Backend Gatekeeper</b><br/>FastAPI saves your message to 💾 <b>MongoDB</b><br/>and checks your 🔑 Auth token] :::backend
    
    Step3 --> Step4[<b>4. Context Gathering</b><br/>System gathers your 🧠 <b>Chat History</b><br/>and 📚 <b>Grounding Documents</b>] :::backend
    
    Step4 --> Step5{<b>5. AI Analysis</b><br/>Pipeline decides complexity:<br/><i>Simple, Graph, or Research?</i>} :::ai
    
    subgraph AI_Thinking [The Brain at Work]
        direction TB
        Step5 -- Search --> Step6[<b>Vector/Graph Search</b><br/>Finds facts you mentioned] :::ai
        Step6 -- Reason --> Step7[<b>Llama 3.3 (Groq)</b><br/>Generates the perfect answer] :::ai
    end
    
    Step7 --> Step8[<b>6. Real-time Streaming</b><br/>Words (tokens) fly back to your screen<br/>one-by-one for 🚀 Zero Latency] :::frontend
    
    Step8 --> Step9[<b>7. Wrap Up</b><br/>System critiques its own answer &<br/>saves the interaction to 🗃️ <b>Memory</b>] :::backend
    
    Step9 --> Step10([<b>Done!</b><br/>Ready for your next question]) :::user

    %% Storage Links
    Step3 -.-> DB1[(MongoDB)] :::storage
    Step4 -.-> DB2[(Postgres / Vector)] :::storage
    Step9 -.-> DB3[(Long-term Memory)] :::storage
```

---


---



## System Architecture Diagram

```
Browser (Next.js)
     │
     │  HTTP/SSE  (localhost:3000 → localhost:8000)
     ▼
FastAPI App (main.py)
  ├── CORSMiddleware
  ├── GZipMiddleware
  ├── ResponseCacheMiddleware
  ├── RateLimiter (slowapi)
  └── Routers:
       ├── /api/v1/chat        ← Chat sessions & streaming
       ├── /api/v1/omni-rag    ← Document upload & RAG queries
       ├── /api/v1/research    ← Deep Research pipeline
       ├── /api/v1/images      ← Image upload & vision
       └── /api/v1/memory      ← Long-term memory CRUD
            │
            ├── PostgreSQL  ← chat_sessions (session metadata)
            ├── MongoDB     ← chat_messages (message content)
            ├── Redis       ← AI response cache
            └── AI Core:
                 ├── GroqClient (Llama-3.3-70b)
                 │    └── Ollama (local fallback)
                 ├── OmniRAGPipeline
                 │    ├── QueryRewriter
                 │    ├── QueryComplexityClassifier
                 │    ├── HyDEEngine
                 │    ├── VectorStore (hybrid search)
                 │    ├── KnowledgeGraph (community detection)
                 │    ├── FlashRankReranker
                 │    ├── CRAGPipeline (evaluation + web fallback)
                 │    ├── SelfCritique
                 │    ├── RecursiveReasoningAgent
                 │    ├── DensityController
                 │    └── AnswerRefiner
                 └── MemorySystem (Mem0-style long-term memory)
```

---

## Frontend Architecture

### Entry Point: `frontend/src/app/(dashboard)/chat/page.tsx`

The `ChatPage` component (~1965 lines) is the monolithic chat orchestrator.

#### State Management
```typescript
// Session state
const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

// Message state
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [input, setInput] = useState('');

// Feature flags
const [selectedStrategy, setSelectedStrategy] = useState('adaptive');
const [turboQuantEnabled, setTurboQuantEnabled] = useState(false);
const [turboQuantConfig, setTurboQuantConfig] = useState<TurboQuantRequest>({...});
const [researchDepth, setResearchDepth] = useState('standard');

// Image staging
const [stagedImages, setStagedImages] = useState<ImageResponse[]>([]);
```

#### Auth Integration
- Uses `useAuthStore` (Zustand, persisted to `localStorage` as `engunity-auth`).
- Token is injected into every API call via `Authorization: Bearer <token>`.
- Auth state: `idle → checking → authenticated | unauthenticated`.
- Dashboard layout (`layout.tsx`) redirects to `/login` if `unauthenticated`.

#### Frontend Services

| Service | File | Purpose |
|---|---|---|
| `chatService` | `src/services/chat.ts` | Session CRUD, message history, SSE chat stream |
| `omniRagService` | `src/services/omniRag.ts` | Document upload, RAG query stream, graph ops |
| `researchService` | `src/services/research.ts` | Deep research SSE stream |
| `imageService` | `src/services/image.ts` | Image upload, list, delete, search |

#### SSE Streaming Pattern (chat.ts)
```typescript
// Opens a fetch stream, reads chunks, parses SSE events
const response = await fetch(`${API_BASE}/api/v1/chat/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, strategy, turbo_quant, image_ids })
});

const reader = response.body?.getReader();
while (true) {
    const { done, value } = await reader.read();
    // parse "data: {...}" lines
    // yield { type: 'content'|'metadata'|'done', ... }
}
```

#### TurboQuant Feature Flag
```typescript
// Enabled via env or window override
const turboQuantFeatureEnabled =
    process.env.NEXT_PUBLIC_ENABLE_TURBO_QUANT_CHAT === 'true' ||
    (typeof window !== 'undefined' && (window as any).__TURBO_QUANT_ENABLED === true);
```

---

## Backend Architecture

### Router: `backend/app/api/v1/chat.py`

**Base prefix:** `/api/v1/chat`

| Endpoint | Method | Description |
|---|---|---|
| `/sessions` | GET | List all sessions for user |
| `/sessions` | POST | Create new session (auto-generates title via AI) |
| `/sessions/{id}` | GET | Get session detail |
| `/sessions/{id}` | DELETE | Delete session + messages |
| `/sessions/{id}/messages` | GET | Fetch message history from MongoDB |
| `/sessions/{id}/stream` | POST | **Main SSE streaming endpoint** |

#### `stream_message` — Core Streaming Handler

```python
async def stream_message(session_id, request, db, current_user):
    # 1. Validate session ownership
    # 2. Save user message to MongoDB (chat_messages)
    # 3. Build context: build_context(session_id, user_id, query)
    #    → fetches last 30 messages from MongoDB
    #    → generates hierarchical memory summary if >10 msgs
    #    → does lightweight vector search for grounding
    # 4. Determine mode:
    #    - use_omni_rag=True → OmniRAGPipeline.stream_query()
    #    - use_omni_rag=False → ai_router.stream_request()
    # 5. Apply TurboQuant if requested
    # 6. Stream SSE events: metadata → content chunks → done
    # 7. Save complete assistant response to MongoDB
    # 8. Store interaction in long-term memory
```

#### Request Body Schema
```python
class StreamMessageRequest:
    message: str
    strategy: Optional[str]       # adaptive|vector_rag|graph_rag|recursive_intensive
    use_omni_rag: bool = True
    image_urls: Optional[List[str]]
    image_ids: Optional[List[str]]
    turbo_quant: Optional[TurboQuantRequest]
    memory_summary: Optional[str]
```

### Router: `backend/app/api/v1/omni_rag.py`

**Base prefix:** `/api/v1/omni-rag`

| Endpoint | Method | Description |
|---|---|---|
| `/upload` | POST | Upload & index document into vector store |
| `/query/stream` | POST | **SSE query through OmniRAGPipeline** |
| `/graph/build` | POST | Trigger knowledge graph construction |
| `/graph/communities` | GET | Get community summaries |
| `/graph/search` | POST | Search graph by query |
| `/documents` | GET | List indexed documents |
| `/documents/{id}` | DELETE | Remove document from index |

---

## AI Core & Omni-RAG Pipeline

### `backend/app/services/rag/pipeline.py` — `OmniRAGPipeline`

The pipeline is initialized once and shared across requests. It contains:

#### Sub-components
| Component | Role |
|---|---|
| `QueryRewriter` | Reformulates query for better retrieval using chat history |
| `QueryComplexityClassifier` | Classifies query as SIMPLE / SINGLE_HOP / MULTI_HOP / RECURSIVE_INTENSIVE |
| `HyDEEngine` | Generates a hypothetical answer document to improve embedding search |
| `VectorStore` | Hybrid semantic + keyword search (alpha=0.6 semantic weight) |
| `KnowledgeGraph` | Community detection, entity extraction, graph-based reasoning |
| `FlashRankReranker` | Cross-encoder reranking of top-K retrieved docs |
| `CRAGPipeline` | Evaluates retrieval quality; falls back to web search if poor |
| `SelfCritique` | Post-generation confidence scoring and critique |
| `RecursiveReasoningAgent` | Multi-step REPL-style reasoning for complex queries |
| `DensityController` | Analyzes and controls information density |
| `AnswerRefiner` | Removes filler phrases, improves clarity |
| `QualityMetrics` | Tracks structure/density/naturalness scores |
| `MemorySystem` | Long-term user memory (recall + store) |

#### Execution Paths by Complexity

**SIMPLE** (direct generation with grounding)
```
QueryRewriter → VectorStore(k=3) → GroqClient.get_streaming_completion()
```

**SINGLE_HOP** (full RAG pipeline)
```
QueryRewriter
→ MultiQueryGeneration (4 variants + step-back)
→ HyDE × 4 queries
→ VectorStore(k=20, alpha=0.6) × 4
→ Deduplicate → FlashRankReranker(top_k=10)
→ CRAGPipeline (quality eval + web fallback)
→ ContextualCompression (parallel)
→ DraftGeneration → AnswerRefiner → SelfCritique
→ MemorySystem.remember()
→ QualityMetrics.log()
```

**MULTI_HOP** (GraphRAG + Map-Reduce)
```
HyDE → VectorStore(k=20)
→ KnowledgeGraph.search_communities(top_k=5)
→ MAP: generate partial answers from each source (parallel)
→ REDUCE: synthesize with Groq (streaming)
→ SelfCritique
```

**RECURSIVE_INTENSIVE** (exhaustive reasoning)
```
VectorStore(k=40) + KnowledgeGraph.search_communities(top_k=5)
→ Merge into unified context
→ RecursiveReasoningAgent.solve()
  (iterative thought → action → observation loops)
→ Stream steps + final conclusion
```

### LLM Client: `backend/app/services/ai/groq_client.py`

- **Primary:** Groq API (`llama-3.3-70b-versatile`, 4096 max tokens)
- **Fallback 1:** Local Ollama (RTX 4050)
- **Fallback 2:** Mock completion (deterministic responses for testing)
- Supports multi-key rotation for rate limit distribution
- `get_streaming_completion()` returns `AsyncGenerator[str, None]`

### AI Router: `backend/app/services/ai/router.py`

Used by simple chat path (non-RAG):
1. Check Redis cache
2. Route to Groq → Ollama fallback
3. Cache response
4. Log to MongoDB via `ai_logger`

---

## Data Models & Storage

### PostgreSQL — Session Metadata

```sql
-- Table: chat_sessions
id          UUID PRIMARY KEY
user_id     INTEGER FK(users.id)
title       VARCHAR
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### MongoDB — Message Content

```
Collection: chat_messages
{
  session_id:  string,
  role:        "user" | "assistant",
  content:     string,
  image_urls:  string[],    // legacy URL refs
  image_ids:   string[],    // managed image IDs
  timestamp:   datetime,
  metadata: {
    strategy, complexity, confidence,
    retrieved_docs, multi_queries,
    memory_active, memory_summary,
    turbo_quant: { applied, bit_width, ... }
  }
}
```

### Vector Store

- Stores document chunks with embeddings per `(user_id, session_id)`
- `cross_session=True` allows retrieval across all user sessions
- Hybrid search: dense (semantic) + sparse (keyword), configurable alpha

### Memory System (`backend/app/services/memory/system.py`)

- `recall(user_id, query, limit=3)` — semantic search over past interactions
- `remember(user_id, message, response, metadata)` — persist interaction
- `get_user_profile(user_id)` — retrieve preference/personalization data

---

## Message Lifecycle

### Standard Chat Message (Full Flow)

```
1. USER types message, presses Enter
   → handleSend() in chat/page.tsx

2. Optimistic UI: append {role:'user', content} to messages state

3. chatService.streamMessage(sessionId, { message, strategy, image_ids, turbo_quant })
   → POST /api/v1/chat/sessions/{id}/stream

4. Backend: stream_message()
   a. Save user msg → MongoDB chat_messages
   b. build_context():
      - Fetch last 30 msgs from MongoDB
      - If >10 msgs: summarize oldest with llama-3.1-8b-instant → memory_summary
      - VectorStore.search(k=5) for grounding context
   c. OmniRAGPipeline.stream_query():
      - QueryRewriter.rewrite(query, history)
      - ComplexityClassifier.predict()
      - Execute complexity-specific path (SIMPLE/SINGLE_HOP/MULTI_HOP/RECURSIVE)
      - Yield SSE events: metadata → content chunks → done

5. Frontend SSE reader:
   - { type: 'metadata' } → update msg.strategy, msg.complexity, etc.
   - { type: 'content' } → append to streaming message bubble
   - { type: 'done' }    → finalize message, set status='done'

6. Backend: save complete assistant response → MongoDB
7. Backend: MemorySystem.remember() → persist for future recall
```

### Deep Research Flow

```
1. USER clicks 🔬 or types research query
   → handleDeepResearch(query)

2. researchService.startDeepResearch({ query, depth, include_web_search, ... })
   → POST /api/v1/research/deep-research/stream

3. SSE events: status → sub_query → source_found → evaluation → insight → progress → complete

4. Frontend renders inline research card:
   - Phase badge (initializing → searching → evaluating → synthesizing)
   - Progress bar
   - Collapsible event log

5. On 'complete': render full ResearchReport
   - Summary, detailed findings, key insights
   - Scored source cards (relevance %)
   - Follow-up question buttons
```

---

## Feature Reference

### TurboQuant
Runtime quantization of LLM token representations.
- **Modes:** `auto` | `force` | `off`
- **Bit widths:** 2–8 bit
- **Variants:** `prod` | `mse`
- Enabled via `NEXT_PUBLIC_ENABLE_TURBO_QUANT_CHAT=true` or `window.__TURBO_QUANT_ENABLED`
- UI shows badges: `Turbo Quant Applied`, compression ratio, MB saved

### Hierarchical Memory
- Triggered when session has >10 messages
- Oldest messages (beyond 8 recent) are summarized by `llama-3.1-8b-instant`
- Summary injected into system prompt as `[HIERARCHICAL MEMORY]`
- UI shows collapsible "Memory Summary" panel on assistant messages

### Multi-Query Expansion
- Pipeline generates 4 search variants + 1 step-back abstraction
- Each query independently hits HyDE + VectorStore
- Results merged, deduplicated, reranked
- UI shows collapsible "Multi-Query Expansion (N paths)" detail

### HyDE (Hypothetical Document Embeddings)
- LLM generates a hypothetical answer document
- That document's embedding is used for vector search (vs. query embedding)
- Dramatically improves recall for ambiguous or short queries
- UI shows collapsible "AI Hypothetical Reasoning (HyDE)" detail

### CRAG (Corrective RAG)
- After retrieval, evaluates document relevance
- If quality is poor → triggers web search fallback
- UI badge: "Web Search Used" (emerald)

### Self-Critique
- After generation, LLM evaluates its own response
- Returns confidence score (0–1) and critique text
- UI shows color-coded confidence badge (green/amber/red) and critique box

### Decision Vault Integration
- "Convert to Decision" button (appears after 5+ messages)
- Each assistant message has a shield icon to save to Decision Vault
- Routes: `/decisionvault?source=chat&title=...&problem=...`

### Image Support
- Upload via `imageInputRef` (file input `accept="image/*"`)
- `imageService.uploadImage()` → `POST /api/v1/images/upload`
- Returns `ImageResponse` with variants (small/medium/large thumbnails)
- Staged images attached to next message; `image_ids` sent to backend
- Backend: `image_processor.get_visual_context()` → multimodal context string

---

## Environment & Configuration

### Backend (`.env`)
```bash
DATABASE_URL=postgresql://...
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_...
GROQ_API_KEYS=gsk_key1,gsk_key2    # Multi-key rotation
PROJECT_NAME=EngUnityCore
API_V1_STR=/api/v1
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENABLE_TURBO_QUANT_CHAT=true   # TurboQuant feature flag
```

### CORS Allowed Origins
```python
ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
}
```

### Backend Startup Sequence
1. `connect_to_mongo()` — establish MongoDB connection
2. `setup_logging()` — configure Loguru
3. Background `warmup_ai_services()`:
   - `services.get_vector_store()` (loads sentence-transformer model)
   - `services.get_reranker()` (loads FlashRank)
   - `services.get_classifier()` (loads complexity classifier)
   - All three in parallel via `asyncio.gather()`

---

## Key File Map

| File | Purpose |
|---|---|
| `frontend/src/app/(dashboard)/chat/page.tsx` | Main chat UI component |
| `frontend/src/app/(dashboard)/layout.tsx` | Dashboard layout, sidebar, auth guard |
| `frontend/src/services/chat.ts` | Chat API client + SSE stream |
| `frontend/src/services/omniRag.ts` | Omni-RAG API client |
| `frontend/src/services/research.ts` | Deep Research API client |
| `frontend/src/services/image.ts` | Image upload/management |
| `frontend/src/stores/authStore.ts` | Zustand auth store (persisted) |
| `backend/app/main.py` | FastAPI app, middleware, router registration |
| `backend/app/api/v1/chat.py` | Chat endpoints + SSE stream handler |
| `backend/app/api/v1/omni_rag.py` | RAG document & query endpoints |
| `backend/app/api/v1/research.py` | Deep research pipeline endpoint |
| `backend/app/services/rag/pipeline.py` | `OmniRAGPipeline` orchestrator |
| `backend/app/services/chat/context.py` | `build_context()` — history + RAG context builder |
| `backend/app/services/ai/groq_client.py` | Groq LLM client with Ollama fallback |
| `backend/app/services/ai/router.py` | `AIRouter` — cache + route + log |
| `backend/app/services/memory/system.py` | Long-term memory (recall/remember) |
| `backend/app/models/chat.py` | `ChatSession` SQLAlchemy model |
| `backend/app/core/mongodb.py` | MongoDB connection manager |
| `backend/app/core/service_registry.py` | Singleton AI service registry |
