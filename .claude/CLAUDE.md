# CLAUDE.md — ENGUNITYCORE Agent Instructions

**Purpose:** This file is the canonical instruction set for AI coding agents (and human maintainers) working in the ENGUNITYCORE monorepo. It replaces assumptions with verified repo facts.

**Who uses this:** AI coding agents (Claude, Gemini, Codex, etc.) as their primary operating guide. Human maintainers as a quick-reference.

---

## Environment & Quick Start

### Preferred Setup (No Docker)
```bash
conda activate engunity              # Python 3.11 env with all deps
cd /home/agentrogue/projects/ENGUNITYCORE

# Backend (port 8000)
cd backend && uvicorn app.main:app --reload --port 8000 &

# Frontend (port 3000)
cd frontend && npm run dev &

# Verify
curl http://localhost:8000/health    # {"status":"healthy"}
curl http://localhost:3000           # HTTP 200
```

### Docker (full stack)
```bash
docker compose up -d
# View logs: docker compose logs -f backend|frontend|worker
```

### Before Touching Any Code
1. Read this file completely.
2. `git status && git diff --stat` — check dirty worktree.
3. Identify scope: `backend/`, `frontend/`, `ai-core/`, `docs/`, etc.
4. `ls -la .env backend/.env frontend/.env.local` — verify env files exist (do NOT read contents).
5. Read affected files before editing.
6. Use code-review-graph MCP tools FIRST (see `AGENTS.md`).

---

## Repository Snapshot

### Architecture
```
ENGUNITYCORE/
├── backend/        FastAPI (port 8000) — SQLAlchemy, Celery, Supabase auth, MongoDB, FAISS
│   ├── app/api/v1/     21 route files (auth, chat, code, research, analytics, etc.)
│   ├── app/services/   20 service directories (AI, RAG, code_exec, github, jobprep, etc.)
│   ├── app/agents/     5 agents (research, wellbeing, coding_team; 2 stubs)
│   ├── app/schemas/    18 Pydantic schema files
│   ├── app/models/     10 SQLAlchemy model files
│   └── tests/          31 test files (165 tests)
├── frontend/       Next.js 16 (port 3000) — React 18, Tailwind, Zustand, Monaco Editor
│   ├── src/app/(dashboard)/  9 main pages + 4 sub-pages
│   ├── src/services/         17 API client files
│   ├── src/stores/           5 Zustand stores
│   ├── src/__tests__/        14 test files (129 Vitest tests)
│   └── e2e/                  8 Playwright spec files (17 chat tests)
├── ai-core/        Shared AI/ML modules (mostly scaffolding, only chunking.py has code)
├── docs/           100+ documents organized by category (testing/ 51 files, architecture/ 8, features/ 40+, deployment/ 5)
├── blockchain/     Hardhat smart contracts (stubs)
└── scripts/        Deploy, maintenance, setup, testing scripts
```

### Cross-Cutting Concerns
- **Auth:** Supabase JWT — no custom auth tables.
- **Message queue:** Redis → Celery (autodiscovers `app.services.ai`, `app.services.rag`).
- **Databases:** PostgreSQL + MongoDB + Redis.
- **AI Models:** YOLOv8 (downloaded), BGE Embedding (1.3GB cached), FlashRank (installed). Vector store needs rebuild: `python3 scripts/init_db.py`.
- **Code Studio:** Separate sub-app on ports 8001/3001 via `docker-compose.code.yml`.

---

## Current State (Last Updated: June 8, 2026)

### Test Results
| Suite | Passed | Failed | Warnings |
|---|---|---|---|
| Backend pytest | **165** | **0** | 1 (sklearn `n_init` — 3rd party) |
| Frontend Vitest | **129** | **0** | 0 |
| E2E Playwright (chat) | **17** | **0** | 0 |

### Deployment Readiness: 🟢 READY
See `docs/DEPLOYMENT_READINESS_REPORT.md` for full details.

### Recent Fixes Applied
| # | Issue | Severity | Fixed |
|---|---|---|---|
| 1 | `RetrievalEvaluator.evaluate` substring match (INCORRECT→CORRECT) | 🔴 CRITICAL | ✅ `"CORRECT" in` → `==` |
| 2 | Missing `import json` in `GitHubAnalyzer` (NameError at runtime) | 🔴 CRITICAL | ✅ Added import |
| 3 | 15 `class Config:` blocks migrated to `ConfigDict()` across 6 schema files | 🟡 MINOR | ✅ Done |
| 4 | `analytics_complete.py` `regex=` → `pattern=` | 🟡 MINOR | ✅ Done |
| 5 | GitHub client `login_or_token` deprecation | 🟡 MINOR | ✅ Done |
| 6 | E2E chat mock endpoint mismatch (`/chat/{id}` → `/chat/history/{id}`) | 🔴 CRITICAL | ✅ Done |

### Remaining Known Issues
| Item | Status | Notes |
|---|---|---|
| Vector store rebuild | ⚠️ Pending | Run `python3 scripts/init_db.py` |
| `planner_agent.py` stub | 📝 Empty | Not implemented |
| `code_review_agent.py` stub | 📝 Empty | Not implemented |
| Decision Vault "Project Scan" | 🎭 Mock | Not a real backend scanner |
| 8 missing test reports (frontend/docs) | 📝 Missing | Docs-only, not code blockers |
| `npx tsc --noEmit` | ⚠️ Not run | Should verify before deploy |

---

## Commands and Workflows

### Local Development (Native, No Docker)
```bash
# Backend
cd backend && conda run -n enginity uvicorn app.main:app --reload --port 8000
# Celery worker (separate terminal):
cd backend && conda run -n enginity celery -A app.workers.celery_app worker --loglevel=info

# Frontend
cd frontend && npm run dev           # Dev server on port 3000
cd frontend && npm run build         # Production build
cd frontend && npm run start         # Production server on port 3000
```

### Tests
```bash
# Backend (conda)
conda run -n enginity pytest tests/ -v                    # All 165 tests
conda run -n enginity pytest tests/ -v -k "test_name"     # Single test

# Frontend
cd frontend && npm run test           # Vitest (129 tests)
cd frontend && npm run test:coverage  # With coverage
cd frontend && npm run test:e2e       # Playwright full suite

# Frontend type/lint checks
cd frontend && npx tsc --noEmit       # TypeScript check
cd frontend && npm run lint           # ESLint
```

### Build
```bash
cd frontend && npm run build          # Next.js production build
docker compose build backend          # Backend Docker build
```

### Database Migrations (⚠️ High Risk)
```bash
cd backend
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
# NEVER run alembic downgrade or stamp without user instruction
```

### Troubleshooting
```bash
curl http://localhost:8000/health                    # Backend health
curl http://localhost:8000/openapi.json | python3 -m json.tool | head -60
cd frontend && rm -rf .next node_modules && npm install && npm run dev  # Frontend reset
bash backend/clear_gpu_memory.sh                    # GPU memory (ML inference)
```

---

## Codebase Conventions

### Folder Organization

**Backend (`backend/app/`):**
- `api/v1/` — 21 FastAPI route handlers (versioned)
- `core/` — Config, security, database, dependencies
- `models/` — 10 SQLAlchemy ORM models
- `schemas/` — 18 Pydantic V2 schemas (all `@field_validator`, no `@validator`)
- `services/` — 20 service directories (AI, RAG, code_execution, analytics, git, github, memory, export, etc.)
- `agents/` — 5 agents (deep research, coding team, wellbeing; 2 stubs)
- `workers/` — Celery task definitions (autodiscovers `app.services.ai`, `app.services.rag`)
- `utils/` — Shared utilities
- `storage/` — File storage (not importable code)

**Frontend (`frontend/src/`):**
- `app/(dashboard)/` — 9 main pages + 4 sub-pages (overview, chat, code, research, documents, analytics, decisionvault, jobprep, settings)
- `components/` — Reusable UI components
- `hooks/` — Custom React hooks
- `stores/` — 5 Zustand stores (auth, code, research, ui, jobPrep)
- `services/` — 17 API client files (auth, chat, code, research, analytics, document, decision, etc.)
- `lib/` — Shared utilities
- `types/` — TypeScript type definitions
- `__tests__/` — 14 Vitest test files (129 tests)
- `e2e/` — 8 Playwright spec files

### Naming Conventions
| Context | Convention | Example |
|---|---|---|
| Python files/vars | `snake_case` | `research_agent.py`, `user_id` |
| Python classes | `PascalCase` | `DeepResearchAgent` |
| TypeScript files | `PascalCase` components, `camelCase` utils | `ChatPanel.tsx`, `apiClient.ts` |
| React components | `PascalCase` | `UserCard` |
| API routes | `kebab-case` | `/api/v1/user-profile` |
| Env vars | `UPPER_SNAKE_CASE` | `GROQ_API_KEY` |

### Pydantic V2 Rules (Enforced)
- Use `@field_validator` with `@classmethod` — NEVER `@validator`.
- Use `model_config = ConfigDict(from_attributes=True)` — NEVER `class Config:`.
- Use `pattern=` in FastAPI `Query`/`Field` — NEVER `regex=`.

### Generated Files — Do Not Edit Manually
- `frontend/package-lock.json`, `frontend/tsconfig.tsbuildinfo`, `frontend/.next/`
- `backend/__pycache__/`, `backend/.pytest_cache/`
- Applied Alembic migrations

---

## API Route Map (`backend/app/api/v1/`)

| File | Prefix | Key Endpoints |
|---|---|---|
| `auth.py` | `/auth` | register, login, token/refresh, me, oauth/github |
| `chat.py` | `/chat` | sessions CRUD, messages, stream |
| `research.py` | `/research` | deep-research, deep-research/stream |
| `workspace.py` | `/workspace` | sources, clusters, graph-nodes, tool-invoke |
| `documents.py` | `/documents` | CRUD, upload, AI processing |
| `code.py` | `/code` | projects, files, execute |
| `coding_team.py` | `/coding-team` | execute |
| `analytics.py` | `/analytics` | dashboard, metadata |
| `analytics_complete.py` | `/analytics` | datasets, analyze, ML, charts, export |
| `decisions.py` | `/decisions` | CRUD, scan, analyze, export |
| `jobprep.py` | `/jobprep` | profiles, roles, skills, simulations, readiness |
| `wellbeing.py` | `/wellbeing` | check, pomodoro, events |
| `memory.py` | `/memory` | profile, query |
| `images.py` | `/images` | upload, list, delete, batch |
| `omni_rag.py` | `/omni-rag` | query, stream, upload, stats, graph/rebuild |
| `git.py` | `/git` | init, status, commit, history |
| `terminal.py` | `/terminal` | WebSocket PTY sessions |
| `githubrepos.py` | `/github-repos` | import, analyze, bulk, map-research |
| `testing.py` | `/testing` | run test suites |
| `debug.py` | `/debug` | start/stop sessions, breakpoints |
| `agent_tools.py` | `/agent-tools` | read-file, write-file, list-files, exec-command |

---

## Documentation Map

| Location | Contents |
|---|---|
| `docs/INDEX.md` | Master index of 100+ docs |
| `docs/testing/INDEX.md` | 51 test report files, 20 service categories |
| `docs/testing/TEST_EVERYTHING_PROMPT.md` | Comprehensive testing prompt (707 lines) |
| `docs/testing/CHAT_DASHBOARD_E2E_STABILIZATION_REPORT.md` | E2E stabilization + Pydantic V2 migration |
| `docs/DEPLOYMENT_READINESS_REPORT.md` | Full deploy readiness assessment |
| `docs/architecture/` | 8 system architecture files |
| `docs/features/` | 40+ per-module docs |
| `docs/deployment/` | 5 deployment guides (step-by-step, checklist, status) |
| `docs/main/` | API, auth, scaling, security docs |
| `docs/quickstart/` | 5 getting started guides |
| `backend/DEPLOYMENT_CHECKLIST.txt` | Quick deploy checklist |

---

## Testing and Validation Policy

### Tiered Validation
| Tier | When | Commands |
|---|---|---|
| **Quick** | Every change | `npx tsc --noEmit` (frontend), `pytest -k test_name` (backend) |
| **Targeted** | After logic change | `npm run test`, `pytest tests/test_specific.py -v` |
| **Full suite** | Before declaring complete | `pytest tests/ -v` (165), `npm run test` (129), `npx playwright test e2e/chat.spec.ts --project=chromium` (17) |
| **E2E** | After UI/auth changes | `npm run test:e2e` |

### Unrun Tests Protocol
Document why if a test can't run:
```
⚠️ Unrun: tests/test_rag_integration.py — requires live MongoDB + GROQ_API_KEY.
Risk: Low — function logic unit-tested; integration path unchanged.
```

### Always Run Before Finalizing
1. Lint: `cd frontend && npm run lint`
2. TypeScript: `cd frontend && npx tsc --noEmit`  
3. Tests covering changed code
4. Confirm 0 new warnings emitted

---

## Git and Change Management

### Rules
- Feature branches only, never `main`.
- Branch naming: `feat/desc`, `fix/desc`, `chore/desc`.
- One logical change per commit.
- Message format: `type(scope): short description`.
- NEVER commit `.env`, `yolov8n.pt`, or model weights.

### Dirty Worktree
- `git stash` only if changes are clearly unrelated to your task.
- Document stashed changes in your report.

---

## Safety Guardrails

### Forbidden Without Explicit Instruction
- `docker compose down -v` — data loss
- `alembic downgrade` / `alembic stamp` — schema corruption
- `DROP TABLE` / `TRUNCATE` — permanent data loss
- `git push --force` to `main` — overwrites history
- Modifying `.github/workflows/` — breaks CI/CD
- Editing applied Alembic migrations — corrupts history

### Secrets
- NEVER read `.env` contents — only confirm existence with `ls -la`.
- NEVER log API keys, JWT secrets, or tokens.
- Use env vars only, never hardcoded secrets.

### Required Env Vars
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `DATABASE_URL`, `MONGODB_URL`, `MONGODB_DB_NAME`, `SECRET_KEY`, `GROQ_API_KEY`. Optional: `GROQ_API_KEYS`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, `REDIS_URL`.

---

## Area-Specific Playbooks

### Backend Playbook
**Pitfalls:**
- Forgetting Pydantic schema for new route — FastAPI silently accepts unvalidated data.
- Alembic without `DATABASE_URL` — cryptic error.
- Importing `torch`/`ultralytics` in test-imported modules — slow startup.
- Celery tasks must be in `app.workers.celery_app` autodiscover paths.

**Checklist:**
- [ ] `pytest tests/ -v` passes (165 tests)
- [ ] New route in `GET /openapi.json`
- [ ] Schema uses `ConfigDict(from_attributes=True)` and `@field_validator`
- [ ] Migration tested both ways in dev

### Frontend Playbook
**Pitfalls:**
- `next.config.mjs` ignores TS/ESLint errors at build — always run `tsc --noEmit` manually.
- State goes in Zustand stores, not Redux or local `useState` for global state.
- API calls in `services/`, never `axios`/`fetch` from components.
- Supabase storage hostnames must match `next.config.mjs`.

**Checklist:**
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run test` — all 129 pass
- [ ] New components render in dev

### AI/ML Playbook
**Pitfalls:**
- `ai-core/` is mostly scaffolding (only `rag/chunking.py` has code).
- `yolov8n.pt` is 6.5MB — do NOT replace without instruction.
- EasyOCR/PyTorch GPU-optional but slow on CPU.
- Preserve exact whitespace in LLM prompt strings.

**Checklist:**
- [ ] Agent importable: `python3 -c "from app.agents.research_agent import ResearchAgent"`
- [ ] No regressions in `backend/tests/`

### Docs Playbook
- `RECOVERY_GUIDE.md` and `RECOVERY_STATUS.md` at root — do not overwrite.
- `docs/INDEX.md` is the master index — update when adding docs.
- All code examples must match actual code.

---

## Incident and Recovery

### Tests Failing Repeatedly
1. `git stash && pytest tests/ -v && git stash pop` — check if pre-existing.
2. If pre-existing, document. Don't fix broken tests not caused by you.
3. If you introduced the failure, fix before proceeding.
4. If environment issue (missing service, missing env var), stop and report.

### Environment Broken (Nuclear Reset)
```bash
# CONFIRM with user first
docker compose down -v
docker compose up -d --build

# Frontend reset
cd frontend && rm -rf .next node_modules && npm install && npm run dev
```

### When to Stop and Ask
- Operation touches production data or credentials.
- Root cause is in a third-party service (Supabase, Groq, MongoDB Atlas).
- Unexplained test failures after 2 attempts.
- Task scope expanded beyond original description.

---

## Definition of Done

- [ ] All changed files read before editing
- [ ] Diffs minimal and scoped to task
- [ ] No secrets, debug logs, or commented-out code
- [ ] TypeScript check passes (frontend)
- [ ] Lint passes (frontend)
- [ ] Relevant tests pass (documented if skipped)
- [ ] `git diff --staged` reviewed before commit
- [ ] Commit message follows `type(scope): description`
- [ ] No unrelated files modified
- [ ] Any unrun tests or residual risk documented

### Report Template
```
## Task Complete: [Name]

### Changes Made
- [file]: [what and why]

### Tests Run
- ✅ [command] — N passed
- ⚠️ [command] — skipped (reason)

### Residual Risk
[Low/Medium/High] — [explanation]

### Outstanding Items
[Follow-up tasks or known issues]
```
