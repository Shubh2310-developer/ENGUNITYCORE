# Chat System Dependency Map: Frontend to Backend

This document provides a comprehensive mapping of all files and services connected to the Chat page (`frontend/src/app/(dashboard)/chat/page.tsx`).

---

## 1. Frontend: Entry Point & UI Logic

| File Path | Description |
|-----------|-------------|
| `frontend/src/app/(dashboard)/chat/page.tsx` | **Main Entry Point.** Coordinates the chat interface, session management, and message streaming. Handles state for sessions, messages, and various AI modes (Omni-RAG, Research). |
| `frontend/src/store/authStore.ts` | **Authentication Store.** Provides user context and authentication tokens required for all backend API calls. |

### Connected Services (Frontend)

| File Path | Description | API Endpoints Called |
|-----------|-------------|----------------------|
| `frontend/src/services/chat.ts` | **Chat Service.** Manages session CRUD and message history. Handles server-sent events (SSE) for message streaming. | `/api/v1/chat/sessions`, `/api/v1/chat/stream`, `/api/v1/chat/history` |
| `frontend/src/services/omniRag.ts` | **Omni-RAG Service.** Handles document uploads and streaming RAG queries (GraphRAG, Adaptive RAG). | `/api/v1/omni-rag/stream`, `/api/v1/omni-rag/upload` |
| `frontend/src/services/image.ts` | **Image Service.** Manages image uploads and multi-modal interactions. | `/api/v1/images/upload`, `/api/v1/images/analyze` |
| `frontend/src/services/research.ts` | **Research Service.** Interface for deep research tasks using specialized agents. | `/api/v1/research/deep-research/stream` |
| `frontend/src/services/config.ts` | **Global Config.** Defines the `API_BASE` URL for all services. | N/A |

---

## 2. Backend: API Layer (FastAPI Routers)

Found in `backend/app/api/v1/`.

| File Path | Description | Primary Dependencies |
|-----------|-------------|----------------------|
| `backend/app/api/v1/chat.py` | **Chat Controller.** Handles session persistence and message retrieval. Bridges SQL metadata with MongoDB message storage. | `app.models.chat`, `app.services.chat.context`, `app.core.mongodb` |
| `backend/app/api/v1/omni_rag.py` | **RAG Controller.** Orchestrates retrieval-augmented generation. Manages document indexing and query routing. | `app.services.rag.pipeline`, `app.services.document.service` |
| `backend/app/api/v1/images.py` | **Image Controller.** Handles image processing, embedding generation, and metadata storage. | `app.services.storage.supabase`, `app.services.ai.vision` |
| `backend/app/api/v1/research.py` | **Research Controller.** Connects the frontend to the backend research agent for long-running analysis. | `app.services.research.agent` |

---

## 3. Backend: Core Service Layer

These files contain the heavy-lifting logic for the chat system.

| File Path | Description |
|-----------|-------------|
| `backend/app/services/chat/context.py` | **Context Builder.** Assembles the final prompt for the LLM by combining recent history, hierarchical memory, and RAG results. |
| `backend/app/services/rag/pipeline.py` | **OmniRAG Pipeline.** The central brain. Selects search strategies (Adaptive, GraphRAG, Recursive), handles query rewriting (HyDE), and reranking results. |
| `backend/app/services/memory/system/memory_system.py` | **Memory Engine.** Manages short-term and long-term hierarchical summaries to maintain context across long conversations. |
| `backend/app/services/rag/engines/graph_rag.py` | **Knowledge Graph Engine.** Performs entity extraction and community-based summarization for complex global queries. |

---

## 4. Data Layer & Integrations

### Database & Storage
| Component | Connection File | Description |
|-----------|-----------------|-------------|
| **PostgreSQL** | `backend/app/core/database.py` | Stores `User` profiles (Auth) and `ChatSession` metadata (Title, Timestamps). |
| **MongoDB** | `backend/app/core/mongodb.py` | Stores the actual `chat_messages` (the deep history of all conversations). |
| **Supabase** | `backend/app/core/config.py` | Used for object storage (Images, PDF Documents) and public URL generation. |

### Third-Party AI Integrations
| Provider | Role | Used In |
|----------|------|---------|
| **Groq** | Primary LLM | Message generation, query rewriting. |
| **HuggingFace** | Embeddings | Generating vectors for document and image search. |
| **FlashRank** | Reranking | Improving the relevance of retrieved RAG documents. |

---

## 5. Models & Schemas

Found in `backend/app/models/` and `backend/app/schemas/`.

| File Path | Description |
|-----------|-------------|
| `backend/app/models/chat.py` | SQLAlchemy model for `ChatSession`. |
| `backend/app/schemas/chat.py` | Pydantic schemas for chat requests/responses. |
| `backend/app/schemas/omni_rag.py` | Pydantic models for RAG query ingestion. |

---

> [!NOTE]
> This map traces the primary execution paths. Background tasks (like graph rebuilding) and utility middlewares (CORS, Rate Limiting in `app.main.py`) support these flows but operate asynchronously or transparently.
