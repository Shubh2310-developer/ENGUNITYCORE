# CLAUDE.md — ENGUNITYCORE Agent Instructions

**Purpose:** This file is the canonical instruction set for AI coding agents (and human maintainers) working in the ENGUNITYCORE monorepo. It replaces assumptions with verified repo facts. Follow it literally — do not invent commands, endpoints, or environment variables not listed here.

**Who uses this:** AI coding agents (Claude, Gemini, Codex, etc.) as their primary operating guide. Human maintainers as a quick-reference reference.

---

## Repository Snapshot

### Architecture

ENGUNITYCORE is a **full-stack AI-powered engineering platform** structured as a monorepo with distinct service layers:

| Area | Role |
|---|---|
| `backend/` | FastAPI application (port `8000`). SQLAlchemy ORM, Alembic migrations, Celery task queue, Supabase auth, MongoDB document store, FAISS vector store, PyTorch/EasyOCR ML inference. |
| `frontend/` | Next.js 16 app (port `3000`). React 18, Tailwind CSS, Zustand state, Vitest unit tests, Playwright E2E tests. |
| `ai-core/` | Shared AI/ML modules: `llm/`, `rag/`, `pipelines/`, `evaluation/`. Used by backend agents. |
| `blockchain/` | Hardhat-based smart contracts (`contracts/`). |
| `infra/` | CI configs (`ci/`) and monitoring dashboards/alerts (`monitoring/`). |
| `scripts/` | Operational scripts: `deploy/`, `maintenance/`, `setup/`, `testing/`. Also one-off debug scripts. |
| `docs/` | Project documentation. |
| `tests/` | Root-level integration/E2E tests (separate from `backend/tests/` and `frontend/e2e/`). |
| `.claude/` | Agent instructions, skills, and agents. |
| `.planning/` | Planning artifacts — do not delete. |

### Cross-Cutting Concerns

- **Auth provider:** Supabase (JWT-based). All auth flows go through Supabase; no custom auth tables.
- **Message queue:** Redis → Celery worker (`engunity-worker` container).
- **Databases:** PostgreSQL (via `DATABASE_URL`) + MongoDB (via `MONGODB_URL`) + Redis.
- **Storage:** `backend/storage/` is a Docker volume mount — contains uploaded files.
- **Code Studio:** A second sub-application on ports `8001` (backend) and `3001` (frontend), run via `docker-compose.code.yml`. Independent from the main app.

---

## Fast Start for Agents

**The first 10 minutes before touching any code:**

1. **Read this file completely** before taking any action.
2. **Check the dirty worktree:**
   ```bash
   cd /home/agentrogue/projects/ENGUNITYCORE
   git status
   git diff --stat
   ```
3. **Identify your task scope:** Which area does the task touch? (`backend/`, `frontend/`, `ai-core/`, etc.)
4. **Verify `.env` exists and is non-empty** at root and at `backend/.env`. Do NOT read secret values — just confirm the file exists.
   ```bash
   ls -la .env backend/.env frontend/.env.local
   ```
5. **Check running services:**
   ```bash
   docker compose ps
   ```
6. **Read existing code before editing** — use `view_file` on affected files. Never guess at interfaces.
7. **Identify safe first changes:** Prefer adding new files or extending existing ones. Never delete or rename without explicit instruction.
8. **Confirm your understanding** of the task before starting. If the task is ambiguous, stop and ask.

---

## Standard Working Loop

Every agent task must follow this loop:

```
Discover → Plan → Edit → Validate → Report
```

### Discover
- Read all files you will touch before editing them.
- Trace imports and dependencies to understand blast radius.
- Check for related tests that will be affected.

### Plan
- State what you will change and why before editing.
- For multi-file changes, list affected files explicitly.
- Identify which tests to run after the change.

### Edit
- Make minimal diffs. Do not refactor unrelated code.
- Do not add debug prints, test data, or commented-out code to committed files.
- Follow conventions of the file you are editing.

### Validate
- Run the minimum required checks (see [Testing and Validation Policy](#testing-and-validation-policy)).
- Confirm tests pass. If a test is unrunnable (missing service), document why.

### Report
- State what changed, what was tested, and any residual risk.
- Use the [Definition of Done](#definition-of-done) checklist before declaring completion.

### When to stop and ask
- Task overlaps with database migrations, auth, or secrets.
- The correct behavior is genuinely ambiguous after reading the code.
- Tests are failing for reasons unrelated to your change.
- The task requires deleting files or reverting user changes.

---

## Commands and Workflows

### Local Development (Native, No Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt       # or use venv
uvicorn app.main:app --reload --port 8000
# Celery worker (separate terminal):
celery -A app.workers.celery_app worker --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                           # Next.js dev server on port 3000
```

### Docker Compose (Recommended for full stack)

```bash
# Start all core services (backend, frontend, redis, worker)
docker compose up -d

# With overrides (local dev: hot-reload, debug=true)
# docker-compose.override.yml is merged automatically
docker compose up -d

# Code Studio sub-app (independent, ports 8001/3001)
docker compose -f docker-compose.code.yml up -d

# View logs
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend

# Restart single service
docker compose restart backend

# Tear down (preserves volumes)
docker compose down

# Tear down + wipe volumes (DESTRUCTIVE — see Safety Guardrails)
docker compose down -v
```

### Build

**Backend:** No explicit build step — Docker builds on `docker compose up`.
```bash
docker compose build backend
```

**Frontend:**
```bash
cd frontend
npm run build          # Next.js production build
```

### Lint

**Frontend:**
```bash
cd frontend
npm run lint           # eslint via next lint
```

**Backend:** No linter configured. (*Needs Verification — check if ruff/flake8 is in CI.*)

### Tests

**Frontend unit tests (Vitest):**
```bash
cd frontend
npm run test                        # run once
npm run test:watch                  # watch mode
npm run test:coverage               # with coverage
```

**Frontend E2E (Playwright):**
```bash
cd frontend
npm run test:e2e                    # full suite
npm run test:e2e:auth               # auth flows only
```

**Backend tests (pytest):**
```bash
cd backend
pytest tests/ -v
pytest tests/ -v -k "test_name"     # single test
```

**Root-level integration tests:**
```bash
cd /home/agentrogue/projects/ENGUNITYCORE
pytest tests/ -v
```

### Database Migrations (⚠️ High Risk)

```bash
cd backend
# Generate new migration (after model change)
alembic revision --autogenerate -m "describe_change"

# Apply pending migrations
alembic upgrade head

# Downgrade one step (DESTRUCTIVE — data loss risk)
alembic downgrade -1

# View migration history
alembic history
```

> **Do NOT run `alembic downgrade` or `alembic stamp` without explicit user instruction.**

### Troubleshooting Quick Commands

```bash
# Backend: check if API is alive
curl http://localhost:8000/health

# Backend: see routes
curl http://localhost:8000/openapi.json | python3 -m json.tool | head -60

# Redis: check connectivity
docker compose exec redis redis-cli ping

# MongoDB: check connectivity
docker compose exec backend python3 -c "import motor; print('motor ok')"

# Frontend: type-check
cd frontend && npx tsc --noEmit

# Reset Next.js build cache
cd frontend && rm -rf .next

# GPU memory (if ML inference is running)
bash backend/clear_gpu_memory.sh
```

---

## Codebase Conventions

### Folder Organization

**Backend (`backend/app/`):**
- `api/v1/` — FastAPI route handlers (versioned)
- `core/` — Config, security, dependencies
- `models/` — SQLAlchemy ORM models
- `schemas/` — Pydantic request/response schemas
- `services/` — Business logic (called by routes)
- `agents/` — Agentic AI orchestration (research, code review, planning)
- `workers/` — Celery task definitions
- `utils/` — Shared utilities
- `storage/` — File storage (not importable code)

**Frontend (`frontend/src/`):**
- `app/` — Next.js App Router pages and layouts
- `components/` — Reusable UI components
- `hooks/` — Custom React hooks
- `stores/` — Zustand state stores
- `services/` — API client functions (axios-based)
- `lib/` — Shared utilities
- `types/` — TypeScript type definitions
- `__tests__/` — Vitest test files

### Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Python files/vars | `snake_case` | `research_agent.py`, `user_id` |
| Python classes | `PascalCase` | `DeepResearchAgent` |
| TypeScript files | `PascalCase` for components, `camelCase` for utils | `ChatPanel.tsx`, `apiClient.ts` |
| React components | `PascalCase` | `UserCard` |
| API routes | `kebab-case` | `/api/v1/user-profile` |
| Env vars | `UPPER_SNAKE_CASE` | `GROQ_API_KEY` |

### Editing Style

- **Do:** Match the exact style, spacing, and patterns of the file you are editing.
- **Do:** Keep diffs minimal. One logical change per commit.
- **Do:** Add JSDoc/docstrings only when the function is non-obvious.
- **Don't:** Auto-format entire files (introduces noise in diffs).
- **Don't:** Rename variables, move code, or restructure files unless that is the explicit task.
- **Don't:** Add `console.log` or `print()` debug statements to committed code.

### Generated Files — Do Not Edit Manually

- `frontend/package-lock.json` — managed by `npm install`
- `frontend/tsconfig.tsbuildinfo` — managed by TypeScript compiler
- `frontend/.next/` — managed by Next.js build
- `backend/__pycache__/`, `backend/.pytest_cache/` — managed by Python
- Any Alembic migration file already applied — do not edit history

---

## Testing and Validation Policy

### Before Finalizing Any Change

**Always run at minimum:**
1. Lint the changed area (frontend: `npm run lint`; backend: none configured).
2. TypeScript check if changing frontend: `cd frontend && npx tsc --noEmit`.
3. Run tests that directly cover the changed code.

### Tiered Validation Strategy

| Tier | When | Commands |
|---|---|---|
| **Quick** | Every change | `npx tsc --noEmit` (frontend), targeted `pytest -k` (backend) |
| **Targeted** | After any logic change | `npm run test` (frontend unit), `pytest tests/test_specific.py` |
| **Full suite** | Before declaring a feature complete | `npm run test:all`, `pytest tests/ -v` |
| **E2E** | After UI or auth changes | `npm run test:e2e` |

### Reporting Unrun Tests

If a test cannot be run (e.g., requires live Supabase, GROQ key, or a running container), document it in your report:
```
⚠️ Unrun: tests/test_rag_integration.py — requires live MongoDB + GROQ_API_KEY.
Risk: Low — function logic is unit-tested; integration path unchanged.
```

---

## Git and Change Management Rules

### Branch Hygiene

- Work on feature branches, never directly on `main`.
- Branch naming: `feat/short-description`, `fix/issue-description`, `chore/task-description`.
- One logical change per commit.

### Commit Messages

Format: `type(scope): short description`

```
feat(backend): add rate limiting to /api/v1/research endpoint
fix(frontend): resolve chat scroll reset on message update
chore(infra): update docker-compose redis version to 7-alpine
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`

### Absolute Rules

- **Never** revert or overwrite user-made commits without explicit instruction.
- **Never** `git push --force` to `main`.
- **Never** commit `.env`, `backend/.env`, or `frontend/.env.local` — they are gitignored.
- **Never** commit `yolov8n.pt` or other model weights unless explicitly asked (6.5MB+ binary).
- Before committing: `git diff --staged` to verify exactly what is being committed.

### Dirty Worktrees

If the worktree is dirty before your task:
1. Run `git stash` only if the dirty changes are clearly unrelated to your task.
2. Document stashed changes in your report.
3. Do not discard untracked files without user approval.

---

## Safety Guardrails

### Forbidden Without Explicit User Instruction

| Action | Risk |
|---|---|
| `docker compose down -v` | Destroys Redis and named volumes (data loss) |
| `alembic downgrade` | Rolls back applied migrations (schema/data loss) |
| `alembic stamp` | Resets migration tracking (breaks schema history) |
| `DROP TABLE` / `TRUNCATE` in any SQL | Permanent data loss |
| `git push --force` to `main` | Overwrites shared history |
| Deleting files from `backend/storage/` | Permanent file loss |
| Modifying `.github/workflows/` | Breaks CI/CD |
| Editing applied Alembic migration files | Corrupts migration history |
| Removing or replacing `yolov8n.pt` | Breaks ML inference pipeline |

### Secrets Handling

- **Never read** `.env`, `backend/.env`, `frontend/.env.local` contents. Confirm they exist with `ls -la` only.
- **Never log** API keys, JWT secrets, or tokens in any file.
- **Never hardcode** secrets in source code — use env vars.
- All secrets reference: see `.env.example` for required keys.

### Required Env Vars (from `.env.example`)

| Var | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase admin key |
| `SUPABASE_JWT_SECRET` | ✅ | JWT validation |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `MONGODB_DB_NAME` | ✅ | MongoDB database name |
| `SECRET_KEY` | ✅ | App secret (min 32 chars) |
| `GROQ_API_KEY` | ✅ | Groq LLM API |
| `GROQ_API_KEYS` | Opt | Comma-separated key rotation |
| `GEMINI_API_KEY` | Opt | Gemini API |
| `GITHUB_TOKEN` | Opt | GitHub integration |
| `REDIS_URL` | Opt | Defaults to `redis://localhost:6379/0` |

### Production-Impact Caution

- Any change to `backend/app/core/` (config, security, middleware) is high-risk — test thoroughly.
- Any change to `app/api/v1/` auth routes requires E2E auth test validation.
- Any change to Celery workers requires manual confirmation that tasks still queue and execute.

---

## Area-Specific Playbooks

### Backend Playbook

**Typical tasks:** Add API route, modify service logic, create Alembic migration, add Celery task, update AI agent.

**Common pitfalls:**
- Forgetting to add Pydantic schema for new route — FastAPI will silently accept unvalidated data.
- Running Alembic without `DATABASE_URL` set — fails with cryptic connection error.
- Importing `torch` or `ultralytics` in a module that is also imported by tests — causes slow test startup.
- Celery tasks must be registered in `app.workers.celery_app` to be discoverable.

**Validation checklist:**
- [ ] `pytest tests/ -v` passes
- [ ] New route appears in `GET /openapi.json`
- [ ] Pydantic schema covers all fields (use `model_config = {"extra": "forbid"}` for strictness)
- [ ] Migration is reversible (test with `alembic downgrade -1` in dev)

**Escalation:** Stop and ask if changing auth middleware, JWT logic, or Supabase RLS rules.

---

### Frontend Playbook

**Typical tasks:** Add UI component, update API service call, fix state management, write Vitest tests.

**Common pitfalls:**
- `next.config.mjs` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — build will succeed even with errors. Always run `tsc --noEmit` manually.
- State is managed via Zustand (`stores/`). Do not introduce Redux or local `useState` for global state.
- API calls live in `services/` — do not make `axios` calls directly from components.
- Images from Supabase storage must match the allowed hostname pattern in `next.config.mjs`.

**Validation checklist:**
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test` — all Vitest tests pass
- [ ] New UI components are rendered correctly in dev (`npm run dev`)

**Escalation:** Stop and ask if changing Supabase auth callbacks, `middleware.ts`, or socket connection logic.

---

### AI/ML Playbook (`ai-core/` + `backend/app/agents/`)

**Typical tasks:** Modify RAG pipeline, update LLM prompts, add evaluation metric, update agent logic.

**Common pitfalls:**
- `ai-core/` modules are shared — changes cascade to all agents using them.
- `yolov8n.pt` (6.5MB) is the default object detection model. Do NOT replace without user instruction.
- EasyOCR and PyTorch are GPU-optional but slow on CPU — avoid adding GPU-only code paths without fallback.
- LLM prompts in agents are often multi-line strings — preserve exact whitespace when editing.

**Validation checklist:**
- [ ] Agent is importable: `python3 -c "from app.agents.research_agent import ResearchAgent"`
- [ ] RAG pipeline returns results on sample query (requires MongoDB connection)
- [ ] No regressions in `backend/tests/` coverage

**Escalation:** Stop and ask before changing embedding model, replacing `yolov8n.pt`, or modifying FAISS index schema.

---

### Infra/DevOps Playbook (`infra/` + `docker-compose*.yml`)

**Typical tasks:** Update CI config, modify monitoring rules, adjust docker-compose service settings.

**Common pitfalls:**
- `docker-compose.override.yml` is gitignored and auto-merged locally. Verify it exists before blaming config issues on the base compose file.
- Port `8001` / `3001` is the Code Studio app — distinct from the main app on `8000` / `3000`.
- Changing `volumes:` in compose can orphan data in named volumes.

**Validation checklist:**
- [ ] `docker compose config` — no YAML parse errors
- [ ] All containers reach healthy state: `docker compose ps`
- [ ] `curl http://localhost:8000/health` returns 200

**Escalation:** Never modify `.github/workflows/` without explicit user instruction.

---

### Docs Playbook (`docs/`)

**Typical tasks:** Update API documentation, add architectural decision records, update recovery guides.

**Common pitfalls:**
- `RECOVERY_GUIDE.md` and `RECOVERY_STATUS.md` at root are authoritative recovery references — do not overwrite without user approval.
- Docs are manually maintained — no auto-generation currently configured.

**Validation checklist:**
- [ ] Markdown renders correctly (no broken links or malformed tables)
- [ ] Code examples in docs are consistent with actual code

---

## Incident and Recovery Guidance

### Unexpected file changes appear
1. Run `git status` and `git diff` to understand the scope.
2. Do **not** `git checkout -- .` or stash without reading the changes first.
3. If changes are in `backend/storage/`, `logs/`, or `.next/` — these are runtime artifacts, safe to ignore.
4. Report to the user if unexpected changes touch source files.

### Tests failing repeatedly
1. Check if the failure is pre-existing: `git stash && pytest tests/ -v && git stash pop`.
2. If failure exists on clean stash, it is a pre-existing issue — document it and do not claim ownership.
3. If you introduced the failure, fix it before proceeding. Do not skip the failing test.
4. If the failure is environment-related (missing service, missing env var), stop and report.

### Environment is broken
```bash
# Check containers
docker compose ps
docker compose logs backend --tail=50

# Nuclear reset (CONFIRM with user first — deletes volumes)
docker compose down -v
docker compose up -d --build

# Frontend reset
cd frontend && rm -rf .next node_modules && npm install && npm run dev
```

### When to stop immediately and ask
- Any operation would touch production data or credentials.
- The root cause of a bug is in a third-party service (Supabase, Groq, MongoDB Atlas).
- Tests fail for reasons you cannot explain after 2 investigation attempts.
- The task scope has expanded beyond what was originally described.

---

## Definition of Done

Before declaring a task complete, verify every checklist item:

- [ ] All changed files were read before editing (no blind edits).
- [ ] Code changes are minimal and scoped to the task.
- [ ] No secrets, debug logs, or commented-out code committed.
- [ ] TypeScript check passes: `npx tsc --noEmit` (frontend changes).
- [ ] Lint passes: `npm run lint` (frontend changes).
- [ ] Relevant tests run and pass (documented if skipped).
- [ ] `git diff --staged` reviewed before commit.
- [ ] Commit message follows `type(scope): description` format.
- [ ] No unrelated files modified.
- [ ] Any unrun tests or residual risk explicitly documented.

### Final Report Template

```
## Task Complete: [Task Name]

### Changes Made
- [file]: [what changed and why]

### Tests Run
- ✅ [test command] — [N tests passed]
- ⚠️ [test command] — skipped ([reason])

### Residual Risk
[Low/Medium/High] — [explanation]

### Outstanding Items
[Any follow-up tasks or known issues]
```

---

## Needs Verification Appendix

| Item | Why It Matters |
|---|---|
| Backend linter (ruff/flake8/pylint) | No linter config found at root or `backend/`. CI may enforce one — check `infra/ci/`. |
| Alembic config location | `alembic.ini` not confirmed at `backend/alembic.ini`. Verify before running migrations. |
| `backend/app/workers/celery_app` task registration mechanism | Auto-discovery vs. explicit registration affects whether new tasks run. |
| Ollama/vLLM fallback | `backend/start_vllm.sh` and `verify_ollama_fallback.py` exist — unclear if vLLM is actively used in production or only optional. |
| Blockchain (`blockchain/`) active status | Hardhat config exists but no deployment scripts confirmed. Verify if contracts are deployed or pending. |
| `tests/` root directory coverage | Unclear what integration tests exist here vs. `backend/tests/` — verify before running. |
| `scripts/deploy/` scripts | Content not read — verify deploy scripts and whether they target staging or production before running any. |
| MongoDB Atlas vs. local | `MONGODB_URL` defaults to `localhost:27017` in `.env.example` but production may use Atlas. Verify target environment before any migration. |
| `ai-core/` import path | Whether `ai-core/` modules are installed as a package or imported by path — verify `PYTHONPATH` or `sys.path` in backend startup. |
| GitHub Actions secrets | Required CI secrets not checked — verify `infra/ci/` configs before modifying CI. |
