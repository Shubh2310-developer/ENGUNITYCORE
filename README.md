# EngUnity X

> **An AI-native engineering platform** — chat, research, code execution, document intelligence, GitHub analysis, decision tracking, and developer wellbeing, unified in a single monorepo.

---

## What This Is

EngUnity X is a full-stack platform built to support engineering workflows end-to-end. It brings together a multi-agent AI backend, a real-time web frontend, RAG-powered document search, a sandboxed code execution environment, blockchain-backed identity primitives, and observable infrastructure — all under one roof.

The project started as a research exercise into what a self-contained "engineering co-pilot" would look like if you didn't shy away from building the hard parts yourself. The result is a monorepo with a FastAPI service, a Next.js application, a shared `ai-core` library, Hardhat-based smart contracts, and operational scripts and monitoring configs used in day-to-day development.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Feature Modules](#feature-modules)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Running with Docker (Recommended)](#running-with-docker-recommended)
  - [Running Natively](#running-natively)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Blockchain / Smart Contracts](#blockchain--smart-contracts)
- [Infrastructure and Monitoring](#infrastructure-and-monitoring)
- [Configuration Reference](#configuration-reference)
- [Development Guidelines](#development-guidelines)
- [Documentation](#documentation)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser / Client                         │
│              Next.js 16  ·  React 18  ·  Tailwind CSS             │
│        Zustand stores  ·  Socket.IO client  ·  Monaco Editor       │
└────────────────────────────┬─────────────────────────────────────┘
                             │  HTTP / WebSocket
┌────────────────────────────▼─────────────────────────────────────┐
│                    FastAPI Backend  (port 8000)                    │
│  Auth  ·  Chat  ·  Code  ·  Research  ·  Documents  ·  GitHub      │
│  Decisions  ·  Omni-RAG  ·  Images  ·  Wellbeing  ·  Terminal      │
│  Celery Task Queue  ·  Rate Limiting  ·  Response Cache            │
└───────────┬────────────────┬───────────────────────────────────────┘
            │                │
   ┌────────▼──────┐  ┌──────▼────────────────────────────────────┐
   │  ai-core lib  │  │           Data Layer                        │
   │  llm/         │  │  PostgreSQL (SQLAlchemy + Alembic)          │
   │  rag/         │  │  MongoDB (Motor async driver)               │
   │  pipelines/   │  │  FAISS Vector Store                        │
   │  evaluation/  │  │  Redis (Celery broker + response cache)     │
   └───────────────┘  └───────────────────────────────────────────┘
```

Auth is handled entirely through **Supabase** (JWT-based). There are no custom auth tables — every auth flow goes through the Supabase SDK on both frontend and backend.

A second, independent sub-application called **Code Studio** runs on ports `8001` (backend) and `3001` (frontend) via `docker-compose.code.yml`. It shares infrastructure but is deployed separately.

---

## Feature Modules

### 💬 Chat

Streaming AI chat with persistent session history. Messages are stored in MongoDB, conversation context is managed per-session, and the frontend renders responses in real time over Socket.IO. The chat pipeline plugs into the Omni-RAG system to ground answers in user-uploaded documents when relevant.

### 🔬 Deep Research

The centerpiece AI feature. `DeepResearchAgent` implements a five-stage iterative pipeline:

1. **Decompose** — breaks the user's query into typed sub-questions via LLM
2. **Search** — fans out parallel async searches across three backends simultaneously: internal vector RAG, live web search, and knowledge-graph community traversal
3. **Evaluate** — scores every retrieved source by relevance (hybrid keyword + LLM) and quality (heuristic), deduplicates, and ranks
4. **Refine** — identifies semantic coverage gaps, generates follow-up queries, and loops back to Search — up to N iterations depending on the configured depth level (Quick / Standard / Deep / Exhaustive)
5. **Synthesize** — compiles a cited, structured report and streams real-time progress events throughout

### 💻 Code Lab

A browser-based multi-language code execution environment backed by a sandboxed execution service. Supports syntax highlighting via Monaco Editor, a built-in xterm.js terminal, and a Coding Team agent that can review, plan, and collaboratively write code. A separate Code Studio app (`docker-compose.code.yml`) runs this experience on dedicated ports.

### 📄 Document Intelligence

Upload PDFs, Word documents, spreadsheets, and images. The backend uses `pdfplumber`, `python-docx`, `openpyxl`, and `EasyOCR` to extract content. Extracted text is chunked and indexed into FAISS for semantic search, then available across Chat, Research, and the Omni-RAG endpoint.

### 🔍 Omni-RAG

A unified retrieval-augmented generation endpoint (`/api/v1/omni-rag`) that intelligently routes queries across vector search, BM25 keyword search, knowledge graph traversal, and web fallback. The `QueryComplexityClassifier` selects the best strategy automatically. Results are reranked using `FlashRankReranker` before being passed to the LLM.

### 🐙 GitHub Repository Analysis

Connect a GitHub token and analyze repositories: commit history, contributor graphs, dependency trees, code patterns. The `PyGithub` integration fetches repository metadata and the AI layer synthesizes summaries and risk assessments.

### 🎯 Decision Vault

A structured decision-logging module. Engineers record architectural, technical, or product decisions with context, options considered, and rationale. Stored in PostgreSQL with idempotency keys to prevent duplicate entries.

### 📊 Analytics

A comprehensive analytics dashboard exposing usage metrics, AI inference performance, system health, and per-user activity. Backend aggregation runs through dedicated analytics routes with performance-indexed queries.

### 💼 Job Prep

An AI-assisted interview preparation module. Provides curated questions, mock answer frameworks, and skill gap analysis based on a target role or job description.

### 🧘 Wellbeing

A developer wellbeing module with check-ins, focus session tracking, and AI-generated mindfulness recommendations. Implemented as a separate agent (`WellbeingAgent`) so its logic stays isolated from the core engineering workflows.

### 🔐 Authentication

All auth is Supabase-native — email/password, GitHub OAuth, and session refresh. JWT tokens are validated on the backend via the `SUPABASE_JWT_SECRET`. No custom user table is involved in credential storage.

---

## Tech Stack

### Backend

| Component | Technology |
|---|---|
| Framework | FastAPI 0.115 + Uvicorn |
| ORM | SQLAlchemy 2.0 + Alembic |
| Async MongoDB | Motor 3.6 |
| Task Queue | Celery 5.4 + Redis 7 |
| Vector Store | FAISS (CPU) |
| Embeddings | Sentence Transformers |
| LLM | Groq SDK (Llama 3/Mixtral) with optional Gemini |
| Vision / OCR | EasyOCR, YOLOv8 (Ultralytics), PyTorch 2.4, OpenCV |
| Auth | Supabase Python SDK + python-jose JWT |
| Real-time | Socket.IO (python-socketio 5.16) |
| Rate Limiting | SlowAPI |
| Logging | Loguru |
| Testing | pytest + pytest-asyncio |

### Frontend

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 18 + Tailwind CSS |
| State | Zustand 5 |
| Editor | Monaco Editor + @monaco-editor/react |
| Terminal | xterm.js (@xterm/xterm 5) |
| Charts | Recharts 3 |
| Animation | Framer Motion 12 |
| HTTP | Axios |
| Markdown | react-markdown + remark-gfm |
| Auth | @supabase/supabase-js 2 |
| Unit Tests | Vitest 4 + Testing Library |
| E2E Tests | Playwright 1.58 |

### Infrastructure

| Component | Technology |
|---|---|
| Containers | Docker + Docker Compose |
| Database | PostgreSQL (Supabase-hosted or self-hosted) |
| Cache | Redis 7 Alpine |
| Auth Provider | Supabase |
| Blockchain | Hardhat + Solidity (Identity, Marketplace, Provenance) |
| CI | GitHub Actions (`.github/workflows/`) |
| Monitoring | Custom Prometheus-compatible dashboards (`infra/monitoring/`) |

---

## Repository Layout

```
ENGUNITYCORE/
│
├── backend/                  # FastAPI application
│   └── app/
│       ├── api/v1/           # Route handlers (one file per feature module)
│       ├── agents/           # AI agent implementations
│       │   ├── research_agent.py       # DeepResearchAgent (5-stage pipeline)
│       │   ├── deep_research_agent.py  # Extended research variant
│       │   ├── code_review_agent.py    # Automated code review
│       │   ├── planner_agent.py        # Task planning
│       │   ├── wellbeing_agent.py      # Developer wellbeing
│       │   └── coding_team/            # Multi-agent coding workflow
│       ├── core/             # Config, security, MongoDB, caching, sockets
│       ├── models/           # SQLAlchemy ORM models
│       ├── schemas/          # Pydantic request/response schemas
│       ├── services/         # Business logic (RAG, chat, GitHub, etc.)
│       ├── workers/          # Celery task definitions
│       └── utils/            # Shared utilities
│
├── frontend/                 # Next.js application
│   └── src/
│       ├── app/
│       │   ├── (auth)/       # Login, register, reset password
│       │   └── (dashboard)/  # All feature pages
│       │       ├── chat/
│       │       ├── code/
│       │       ├── research/
│       │       ├── analytics/
│       │       ├── documents/
│       │       ├── githubrepos/
│       │       ├── decisionvault/
│       │       ├── jobprep/
│       │       ├── notebook/
│       │       ├── overview/
│       │       └── settings/
│       ├── components/       # Reusable UI components
│       ├── hooks/            # Custom React hooks
│       ├── stores/           # Zustand state stores
│       ├── services/         # Axios-based API client functions
│       ├── lib/              # Shared utilities
│       └── types/            # TypeScript type definitions
│
├── ai-core/                  # Shared AI/ML modules
│   ├── llm/                  # LLM client wrappers
│   ├── rag/                  # RAG chunking, retrieval, reranking
│   ├── pipelines/            # Chat, document, and research pipelines
│   └── evaluation/           # Quality metrics and evaluation
│
├── blockchain/               # Hardhat smart contracts
│   └── contracts/
│       ├── Identity.sol      # Decentralized identity
│       ├── Marketplace.sol   # On-chain marketplace
│       └── Provenance.sol    # Asset provenance tracking
│
├── infra/                    # CI configs and monitoring
│   ├── ci/                   # GitHub Actions workflows
│   └── monitoring/           # Dashboards and alert rules
│
├── scripts/                  # Operational scripts
│   ├── deploy/
│   ├── maintenance/
│   ├── setup/
│   └── testing/
│
├── docs/                     # Project documentation (96+ files)
├── tests/                    # Root-level integration tests
│
├── docker-compose.yml        # Core stack (backend, frontend, redis, worker)
├── docker-compose.code.yml   # Code Studio sub-app (ports 8001/3001)
├── docker-compose.override.yml  # Local dev overrides (gitignored)
├── .env.example              # All required environment variables
└── Makefile                  # Common task shortcuts
```

---

## Getting Started

### Prerequisites

- Docker 25+ and Docker Compose v2
- Node.js 20+ and npm (for native frontend development)
- Python 3.11+ (for native backend development)
- A Supabase project (free tier is sufficient for local development)
- A Groq API key (free tier available at [console.groq.com](https://console.groq.com))

### Environment Setup

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

The minimum required variables for local development:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
DATABASE_URL=postgresql://user:pass@localhost:5432/engunity
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=engunity
SECRET_KEY=<at-least-32-random-characters>
GROQ_API_KEY=...
```

See [Configuration Reference](#configuration-reference) for all variables and their purpose.

### Running with Docker (Recommended)

```bash
# Start all core services: backend, frontend, Redis, Celery worker
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend

# Verify the backend is healthy
curl http://localhost:8000/health

# Start the Code Studio sub-app (optional, independent)
docker compose -f docker-compose.code.yml up -d
```

After startup:
- Main app frontend: `http://localhost:3000`
- Backend API + docs: `http://localhost:8000/api/v1/openapi.json`
- Code Studio: `http://localhost:3001`

### Running Natively

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# In a second terminal — Celery worker:
celery -A app.workers.celery_app worker --loglevel=info
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev          # Starts on http://localhost:3000
```

**Database migrations** (run after any model change):

```bash
cd backend
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
```

> ⚠️ Never run `alembic downgrade` without understanding what data will be lost.

---

## API Reference

The full interactive API reference is available at `http://localhost:8000/api/v1/openapi.json` when the backend is running. Key route groups:

| Prefix | Module |
|---|---|
| `/api/v1/auth` | Supabase auth passthrough |
| `/api/v1/chat` | Chat sessions and messages |
| `/api/v1/code` | Code execution and review |
| `/api/v1/research` | Deep research pipeline |
| `/api/v1/analytics` | Usage and performance metrics |
| `/api/v1/documents` | Document upload and indexing |
| `/api/v1/githubrepos` | GitHub repository analysis |
| `/api/v1/decisions` | Decision Vault CRUD |
| `/api/v1/omni-rag` | Unified RAG query endpoint |
| `/api/v1/images` | Image upload and OCR |
| `/api/v1/memory` | Conversation memory management |
| `/api/v1/jobprep` | Job preparation module |
| `/api/v1/wellbeing` | Developer wellbeing |
| `/api/v1/coding-team` | Multi-agent coding workflow |
| `/ws/terminal` | WebSocket terminal session |

---

## Testing

### Frontend

```bash
cd frontend

# Unit tests (Vitest)
npm run test
npm run test:watch
npm run test:coverage

# End-to-end tests (Playwright)
npm run test:e2e
npm run test:e2e:auth    # Auth flows only

# Full suite
npm run test:all
```

### Backend

```bash
cd backend
pytest tests/ -v
pytest tests/ -v -k "test_name"   # Single test
```

### Root-level Integration Tests

```bash
pytest tests/ -v
```

### Type and Lint Checks

```bash
# Frontend TypeScript check
cd frontend && npx tsc --noEmit

# Frontend lint
cd frontend && npm run lint
```

---

## Blockchain / Smart Contracts

Three Solidity contracts are included in `blockchain/contracts/`:

- **Identity.sol** — Decentralized identity registry
- **Marketplace.sol** — On-chain marketplace interactions
- **Provenance.sol** — Asset provenance and ownership tracking

The project uses Hardhat for compilation, testing, and deployment. See `blockchain/hardhat.config.ts` for network configuration.

```bash
cd blockchain
npx hardhat compile
npx hardhat test
```

> The contracts are currently in development and not deployed to any mainnet. Verify deployment status before any production use.

---

## Infrastructure and Monitoring

**Docker Compose files:**

| File | Purpose |
|---|---|
| `docker-compose.yml` | Core stack — backend, frontend, Redis, worker |
| `docker-compose.code.yml` | Code Studio on ports 8001/3001 |
| `docker-compose.override.yml` | Local overrides — hot reload, debug flags (gitignored) |

**Services:**

| Container | Purpose |
|---|---|
| `engunity-backend` | FastAPI application (port 8000) |
| `engunity-frontend` | Next.js application (port 3000) |
| `engunity-redis` | Redis broker + cache (port 6379) |
| `engunity-worker` | Celery background task worker |

**Monitoring configs** live in `infra/monitoring/`. CI pipeline definitions are in `infra/ci/` and `.github/workflows/`.

**Useful operational commands:**

```bash
# Health check
curl http://localhost:8000/health

# Redis connectivity
docker compose exec redis redis-cli ping

# Clear Next.js build cache
cd frontend && rm -rf .next

# Clear GPU memory (if running ML inference)
bash backend/clear_gpu_memory.sh

# Restart a single service
docker compose restart backend
```

---

## Configuration Reference

All secrets must be set in `.env` (root) and `backend/.env`. Never commit these files — they are gitignored. Use `.env.example` as your template.

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase public/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase admin key (backend only) |
| `SUPABASE_JWT_SECRET` | ✅ | Used to validate JWTs server-side |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `MONGODB_DB_NAME` | ✅ | MongoDB database name |
| `SECRET_KEY` | ✅ | Application secret — minimum 32 characters |
| `GROQ_API_KEY` | ✅ | Groq LLM API key |
| `GROQ_API_KEYS` | Optional | Comma-separated keys for rotation |
| `GEMINI_API_KEY` | Optional | Google Gemini fallback |
| `GITHUB_TOKEN` | Optional | GitHub integration (scopes: `repo`, `read:user`) |
| `REDIS_URL` | Optional | Defaults to `redis://localhost:6379/0` |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase URL for the client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon key for the client |

---

## Development Guidelines

This project follows a strict operating model for AI agents and human maintainers alike. The canonical reference is [`.claude/CLAUDE.md`](.claude/CLAUDE.md). Key rules:

**Branch hygiene:** Work on feature branches, not `main`. Name branches `feat/`, `fix/`, or `chore/`.

**Commit format:** `type(scope): short description` — e.g., `feat(backend): add rate limiting to research endpoint`.

**Code style:**
- Python: `snake_case` files and variables, `PascalCase` classes
- TypeScript: `PascalCase` components, `camelCase` utilities
- API routes: `kebab-case`
- Never make `axios` calls directly from React components — use `services/`
- Global state lives in Zustand stores only — no Redux, no global `useState`

**Never commit:**
- `.env`, `backend/.env`, `frontend/.env.local`
- `yolov8n.pt` or other model weights (6.5MB+ binary)
- Debug `print()` or `console.log()` statements

**High-risk areas that require extra caution:**
- `backend/app/core/` — config, security, middleware
- `app/api/v1/auth` — any change requires E2E auth test validation
- Celery worker tasks — verify task discovery after any change
- Alembic migrations — always test reversibility with `alembic downgrade -1` in dev before merging

---

## Documentation

96+ documentation files live in `docs/`. A full index is at [`docs/INDEX.md`](docs/INDEX.md).

Key starting points:

| Document | Purpose |
|---|---|
| [`docs/quickstart/START_HERE.md`](docs/quickstart/START_HERE.md) | First stop for new contributors |
| [`docs/quickstart/QUICK_START.md`](docs/quickstart/QUICK_START.md) | Fast setup reference |
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | System architecture overview |
| [`docs/architecture/ai-design.md`](docs/architecture/ai-design.md) | AI system design decisions |
| [`docs/features/chat/chat_architecture.md`](docs/features/chat/chat_architecture.md) | Chat module deep-dive |
| [`docs/features/rag/OMNI_RAG_IMPLEMENTATION_GUIDE.md`](docs/features/rag/OMNI_RAG_IMPLEMENTATION_GUIDE.md) | Omni-RAG implementation |
| [`docs/deployment/DEPLOYMENT_GUIDE_STEP_BY_STEP.md`](docs/deployment/DEPLOYMENT_GUIDE_STEP_BY_STEP.md) | Production deployment |
| [`RECOVERY_GUIDE.md`](RECOVERY_GUIDE.md) | Incident recovery procedures |
| [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md) | Security audit findings |

---


