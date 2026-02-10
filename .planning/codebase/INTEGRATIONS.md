# External Integrations

**Analysis Date:** 2026-02-10

## APIs & External Services

**AI & LLM Providers:**
- Groq - Primary LLM service for chat and analysis
  - SDK: `groq` (Python), `groq-sdk` (JS)
  - Auth: `GROQ_API_KEY` or `GROQ_API_KEYS` (for rotation)
- Google Gemini - Optional secondary LLM
  - Auth: `GEMINI_API_KEY`
- OpenRouter - Optional LLM aggregator
  - Auth: `OPENROUTER_API_KEY`

**Source Control:**
- GitHub - Repository interaction and analysis
  - SDK: `PyGithub`
  - Auth: `GITHUB_TOKEN`

## Data Storage

**Databases:**
- PostgreSQL - Primary relational database
  - Connection: `DATABASE_URL`
  - Client: `sqlalchemy`, `psycopg2-binary`
- MongoDB - Used for analysis results and document storage
  - Connection: `MONGODB_URL`
  - Client: `motor` (async)

**Vector Storage:**
- FAISS - Local vector store for RAG
  - Implementation: `backend/app/services/ai/vector_store.py`
  - File: `backend/app/storage/vector_store/index.faiss`

**Caching & Messaging:**
- Redis - Broker for Celery tasks and general caching
  - Connection: `REDIS_URL`
  - Client: `redis` (Python)

## Authentication & Identity

**Auth Provider:**
- Supabase - Managed auth service (OAuth, JWT, GitHub Auth)
  - Implementation: `backend/app/api/v1/auth.py` and `frontend/src/services/auth.ts`
  - Auth Vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`

## Monitoring & Observability

**Logs:**
- Loguru - Structured logging for Python backend
- Standard Output/Error - Captured by Docker logs

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment (likely Linux VPS or Cloud Provider)

**CI Pipeline:**
- Not explicitly detected in codebase, but `Makefile` and setup scripts suggest manual or scripted deployment flows.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `SECRET_KEY`

**Secrets location:**
- Stored in `.env` (excluded from git)
- Referenced in `backend/app/core/config.py`

## Webhooks & Callbacks

**Incoming:**
- Supabase Auth Callbacks: `SUPABASE_AUTH_CALLBACK_URL` (typically `http://localhost:3000/auth/callback`)

**Outgoing:**
- External API calls to Groq, GitHub, and Supabase.

---

*Integration audit: 2026-02-10*
