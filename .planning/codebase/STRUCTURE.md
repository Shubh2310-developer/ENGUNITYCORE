# Codebase Structure

**Analysis Date:** 2026-02-10

## Directory Layout

```
[project-root]/
├── ai-core/            # Core AI/ML logic and RAG pipelines
├── backend/            # FastAPI application root
│   └── app/
│       ├── api/v1/     # REST API endpoints
│       ├── core/       # Infrastructure and configuration
│       ├── models/     # SQLAlchemy database models
│       ├── schemas/    # Pydantic validation schemas
│       ├── services/   # Business logic and AI orchestration
│       ├── storage/    # Persistence interfaces
│       ├── utils/      # Shared backend utilities
│       └── workers/    # Background task definitions
├── frontend/           # Next.js frontend application
│   └── src/
│       ├── app/        # Next.js App Router (pages and layouts)
│       ├── components/ # Reusable UI components
│       ├── services/   # API client services
│       ├── stores/     # Zustand state management
│       ├── types/      # TypeScript interfaces
│       └── utils/      # Shared frontend utilities
├── blockchain/         # Smart contracts and web3 logic
├── scripts/            # Deployment, setup, and maintenance scripts
├── storage/            # Local data (FAISS index, metadata)
└── infra/              # CI/CD and monitoring configuration
```

## Directory Purposes

**ai-core/:**
- Purpose: Contains the "brain" of the application, independent of the API framework.
- Contains: Embeddings logic, RAG retrieval strategies, and prompt templates.
- Key files: `ai-core/rag/retriever.py`, `ai-core/llm/prompts/`

**backend/app/services/:**
- Purpose: Implements high-level business functionality.
- Contains: Chat logic, document processing, code execution sandboxing, and image analysis.
- Key files: `backend/app/services/ai/router.py`, `backend/app/services/ai/vector_store.py`

**frontend/src/app/:**
- Purpose: Application routing and page-level components.
- Contains: Dashboard views (chat, code, analytics, etc.) and auth flows.
- Key files: `frontend/src/app/(dashboard)/chat/page.tsx`, `frontend/src/app/layout.tsx`

**frontend/src/components/:**
- Purpose: Reusable UI blocks categorized by feature or utility.
- Contains: Shared components (Modals, Auth), feature-specific blocks (CodeEditor, AIRefinePanel).
- Key files: `frontend/src/components/code-lab/CodeEditor.tsx`

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: Backend FastAPI application entry.
- `frontend/src/app/page.tsx`: Frontend root entry (landing/redirect).
- `frontend/src/app/layout.tsx`: Root layout with AuthProvider.

**Configuration:**
- `backend/app/core/config.py`: Backend environment settings.
- `frontend/next.config.mjs`: Next.js build configuration.
- `docker-compose.yml`: Multi-container orchestration.

**Core Logic:**
- `backend/app/services/ai/router.py`: AI request orchestration.
- `backend/app/core/service_registry.py`: Heavy AI component management.
- `frontend/src/stores/authStore.ts`: Client-side auth state.

**Testing:**
- `frontend/playwright.config.ts`: E2E test configuration.
- `scripts/test_jobprep.py`: Specialized backend testing script.

## Naming Conventions

**Files:**
- Backend: `snake_case.py` (e.g., `vector_store.py`)
- Frontend Components: `PascalCase.tsx` (e.g., `CodeEditor.tsx`)
- Frontend Services/Stores: `camelCase.ts` (e.g., `authStore.ts`)

**Directories:**
- Backend: `snake_case` (e.g., `code_execution`)
- Frontend: `kebab-case` (e.g., `code-lab`) or `(parenthesis)` for Next.js groups.

## Where to Add New Code

**New Feature:**
- Endpoint: `backend/app/api/v1/`
- Schema: `backend/app/schemas/`
- Model: `backend/app/models/`
- Service: `backend/app/services/`
- Page: `frontend/src/app/(dashboard)/`

**New Component/Module:**
- Implementation: `frontend/src/components/[feature-name]/`
- Styles: `*.module.css` within the component or app directory.

**Utilities:**
- Shared backend helpers: `backend/app/utils/`
- Shared frontend helpers: `frontend/src/utils/`

## Special Directories

**.planning/:**
- Purpose: Codebase mapping, architectural analysis, and implementation plans.
- Generated: No (Created by GSD tools)
- Committed: Yes

**storage/:**
- Purpose: Local persistent data for FAISS indices and temporary uploads.
- Generated: Yes
- Committed: Generally ignored (data) but directory structure exists.

---

*Structure analysis: 2026-02-10*
