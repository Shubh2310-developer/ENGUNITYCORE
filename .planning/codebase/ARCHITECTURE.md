# Architecture

**Analysis Date:** 2026-02-10

## Pattern Overview

**Overall:** Modular Monolith with Layered Architecture

**Key Characteristics:**
- **Decoupled Frontend/Backend:** React-based frontend communicating with a FastAPI backend via REST and WebSockets.
- **Polyglot Persistence:** Uses PostgreSQL for relational data, MongoDB for unstructured chat history/logs, and FAISS for vector embeddings.
- **Lazy-Loaded AI Services:** Heavy ML models and AI components are managed via a singleton registry to prevent blocking application startup.

## Layers

**API Layer:**
- Purpose: Entry point for all external requests, handles routing, validation, and authentication.
- Location: `backend/app/api/v1/`
- Contains: FastAPI routers, dependency injection for auth and DB sessions.
- Depends on: `backend/app/services/`, `backend/app/schemas/`, `backend/app/core/`
- Used by: Frontend application

**Service Layer:**
- Purpose: Business logic, orchestration of AI pipelines, and external service integration.
- Location: `backend/app/services/`
- Contains: AI routing logic, RAG pipelines, document processing, and data persistence logic.
- Depends on: `backend/app/core/`, `backend/app/models/` (via DB session)
- Used by: API Layer

**Core/Infrastructure Layer:**
- Purpose: System-wide configuration, database connections, logging, and shared utilities.
- Location: `backend/app/core/`
- Contains: Configuration management, database engines (SQLAlchemy/MongoDB), rate limiting, and service registry.
- Depends on: None (internal)
- Used by: All backend layers

**AI Core Layer:**
- Purpose: Specialized AI/ML logic, embeddings, and RAG components.
- Location: `ai-core/` and `backend/app/services/ai/`
- Contains: LLM clients, vector store management, chunking strategies, and rerankers.
- Depends on: External ML libraries (FAISS, SentenceTransformers)
- Used by: Service Layer

## Data Flow

**Chat Message Flow:**

1. **Request:** Frontend sends a message to `/api/v1/chat/stream` with session ID and content.
2. **Context Retrieval:** `backend/app/services/chat/context.py` invokes `VectorStore` for hybrid search (FAISS + BM25).
3. **AI Routing:** `backend/app/services/ai/router.py` processes visual context (if any) and routes the request to Groq/LLM.
4. **Streaming:** Assistant response is streamed back to the frontend via SSE.
5. **Persistence:** User and assistant messages are saved to MongoDB; session metadata is updated in PostgreSQL.

**State Management:**
- Frontend uses **Zustand** (`frontend/src/stores/`) for client-side state (auth, UI, chat).
- Backend uses **SQLAlchemy** for relational state and **Motor** for asynchronous MongoDB interactions.

## Key Abstractions

**ServiceRegistry:**
- Purpose: Singleton for lazy loading heavy AI components (VectorStore, Reranker).
- Examples: `backend/app/core/service_registry.py`
- Pattern: Registry / Singleton

**AIRouter:**
- Purpose: Orchestrates multi-model routing and visual perception integration.
- Examples: `backend/app/services/ai/router.py`
- Pattern: Strategy / Router

**VectorStore:**
- Purpose: Unified interface for hybrid vector and keyword search.
- Examples: `backend/app/services/ai/vector_store.py`
- Pattern: Adapter

## Entry Points

**Backend API:**
- Location: `backend/app/main.py`
- Triggers: Uvicorn/Gunicorn startup
- Responsibilities: FastAPI app initialization, middleware registration, and AI service warmup.

**Frontend Dashboard:**
- Location: `frontend/src/app/(dashboard)/layout.tsx`
- Triggers: User login and navigation to dashboard
- Responsibilities: Main application shell, navigation, and auth state persistence.

## Error Handling

**Strategy:** Centralized exception handlers with CORS support and structured logging.

**Patterns:**
- **Global Exception Handlers:** FastAPI `@app.exception_handler` used for standardizing error responses.
- **Try-Except blocks in Services:** Used for graceful degradation (e.g., MongoDB failing doesn't crash the API).

## Cross-Cutting Concerns

**Logging:** Uses `loguru` for structured, centralized logging across services.
**Validation:** Pydantic models in `backend/app/schemas/` ensure data integrity.
**Authentication:** JWT-based auth via FastAPI security dependencies.

---

*Architecture analysis: 2026-02-10*
