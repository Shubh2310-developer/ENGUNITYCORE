# Technology Stack

**Analysis Date:** 2026-02-10

## Languages

**Primary:**
- Python 3.x - Backend logic and AI services located in `backend/`
- TypeScript 5.x - Frontend application located in `frontend/`

**Secondary:**
- Shell - Setup and maintenance scripts (e.g., `setup_env.sh`, `deploy_optimized_backend.sh`)
- SQL - Database migrations and initialization (e.g., `backend/alembic_migration_analytics.sql`)

## Runtime

**Environment:**
- Node.js 18+ - Frontend runtime
- Python 3.10+ - Backend runtime
- Docker - Containerization platform using `docker-compose.yml`

**Package Manager:**
- npm - Frontend package management via `frontend/package.json`
- pip - Backend package management via `backend/requirements.txt`
- Lockfile: `frontend/package-lock.json` and `package-lock.json` (root) present.

## Frameworks

**Core:**
- Next.js 14.2.35 - React framework for frontend in `frontend/`
- FastAPI 0.115.0 - Web framework for backend in `backend/`
- React 18 - UI library

**Testing:**
- Pytest 9.0.2 - Backend unit and integration testing
- Playwright 1.58.1 - Frontend E2E testing in `frontend/e2e/`

**Build/Dev:**
- Docker Compose - Orchestrates `backend`, `frontend`, `redis`, and `worker` services
- Tailwind CSS 3.4.1 - Styling framework
- Lucide React - Icon library

## Key Dependencies

**Critical:**
- Groq SDK (`groq-sdk`, `groq`) - Primary LLM integration
- Supabase SDK (`@supabase/supabase-js`, `supabase`) - Authentication and database interaction
- Celery 5.4.0 - Distributed task queue for asynchronous processing
- Redis 7 - Message broker for Celery and caching layer

**Infrastructure:**
- SQLAlchemy 2.0.35 - ORM for PostgreSQL interaction
- Alembic 1.13.3 - Database migration tool
- Motor 3.6.0 - Async Python driver for MongoDB
- FAISS 1.8.0 - Vector database for RAG (Retrieval-Augmented Generation)
- Sentence-Transformers 3.1.1 - Generating embeddings for vector search

## Configuration

**Environment:**
- Configured via `.env` files (referenced in `backend/app/core/config.py` and `docker-compose.yml`)
- Backend uses `pydantic-settings` for type-safe configuration in `backend/app/core/config.py`

**Build:**
- `frontend/next.config.mjs` - Next.js configuration
- `backend/Dockerfile` and `frontend/Dockerfile` - Container build instructions
- `docker-compose.yml` - Multi-container service definitions

## Platform Requirements

**Development:**
- Docker and Docker Compose
- Python 3.10+
- Node.js 18+
- Access to Groq and Supabase APIs

**Production:**
- Dockerized environment (Linux recommended)
- Persistent volumes for `redis_data` and `/app/storage`

---

*Stack analysis: 2026-02-10*
