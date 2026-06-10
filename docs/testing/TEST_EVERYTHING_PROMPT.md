# ENGUNITYCORE — Comprehensive Testing Prompt

> Use this prompt to launch a thorough test of ALL services, API routes, frontend pages, stores, agents, workers, and integration paths. Produces independent documentation per service.

---

## MISSION

You are a senior QA/test engineer. Perform **exhaustive testing** of every service, route, page, store, agent, worker, and integration path in the ENGUNITYCORE monorepo. Produce **one independent documentation file per service** in `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/`.

---

## ENVIRONMENT & CONSTRAINTS

### Setup

```bash
# 1. Activate conda environment
conda activate engunity

# 2. Working directory
cd /home/agentrogue/projects/ENGUNITYCORE

# 3. Start backend (native, no Docker)
cd /home/agentrogue/projects/ENGUNITYCORE/backend
uvicorn app.main:app --reload --port 8000 &
# Keep this running in background / tmux

# 4. Start frontend
cd /home/agentrogue/projects/ENGUNITYCORE/frontend
npm run dev &
# Keep this running in background / tmux

# 5. Verify both are alive
curl http://localhost:8000/health
curl http://localhost:3000
```

### Critical Rules

- **NO Docker.** Backend = port 8000, Frontend = port 3000 (already open).
- **ALWAYS** use `conda activate engunity` for Python/backend work.
- **NEVER** modify source code — only read, test, and document.
- **NEVER** commit `.env` files or secrets.
- **Clean up** test artifacts (temp databases, uploaded files) after testing.
- **Use code-review-graph MCP tools FIRST** before grep/glob (see `AGENTS.md`).

### Reference Files (read these first)

- `/home/agentrogue/projects/ENGUNITYCORE/.claude/CLAUDE.md` — canonical repo instructions
- `/home/agentrogue/projects/ENGUNITYCORE/AGENTS.md` — MCP tool usage guide

### Available Agents (`.claude/agents/`)

| Agent | Use For |
|---|---|
| `playwright-tester` | E2E browser testing |
| `backend-developer` | Backend service/route testing |
| `frontend-developer` | Frontend component/page testing |
| `documentation-expert` | Writing reports |
| `performance-monitor` | Load/stress testing |
| `typescript-pro` | TypeScript type checking |
| `code-reviewer` | Security review |

### Available Skills (`.claude/skills/`)

| Skill | Use For |
|---|---|
| `backend-dev-guidelines` | Backend testing patterns |
| `senior-backend` | API/route testing best practices |
| `senior-fullstack` | Full-stack integration testing |
| `clean-code` | Code quality verification |
| `qa-test-planner` | Test plan generation |
| `e2e-page-validator` | Automated E2E page testing |
| `documentation-templates` | Report structure |
| `prompt-engineer` | If custom test prompts needed |
| `rag-engineer` | RAG pipeline testing |
| `langfuse` | LLM observability verification |

---

## TESTING SCOPE (20 Categories)

---

### PART 1: Backend Root Services

**Location:** `backend/app/services/`

#### `research_workspace_service.py`

| Test Area | Method | What to Verify |
|---|---|---|
| MongoDB Data Fetchers | `get_sources()` | Returns sources list, handles empty, handles connection error |
| MongoDB Data Fetchers | `get_clusters()` | Returns clusters with correct shape, fallback defaults |
| MongoDB Data Fetchers | `get_graph_nodes()` | Returns graph nodes, handles missing data |
| Persistence | `save_workspace_from_report()` | Saves correctly, handles duplicate reports, validates input schema |
| AI Tool: Gap Detector | `run_gap_detector()` | Returns underexplored areas, handles bad input |
| AI Tool: Method Comparator | `run_method_comparator()` | Side-by-side comparison correct format |
| AI Tool: Assumption Extractor | `run_assumption_extractor()` | Extracts assumptions correctly |
| AI Tool: Strength/Weakness | `run_strength_weakness()` | Tags sources correctly |
| AI Tool: Question Generator | `run_question_generator()` | Generates critical questions |
| AI Tool: Argument Builder | `run_argument_builder()` | Maps claims to evidence |
| AI Tool: Contradiction Resolver | `run_contradiction_resolver()` | Identifies conflicting findings |
| AI Tool: Coherence Flow | `run_coherence_flow()` | Analyzes narrative structure |
| AI Tool: Hypothesis Challenger | `run_hypothesis_challenger()` | Stress-tests hypotheses |
| Dispatcher | `invoke_tool()` | Valid tool keys route correctly, invalid keys return error |

---

### PART 2: Backend AI Services

**Location:** `backend/app/services/ai/` (15 files)

| File | Key Exports | What to Test |
|---|---|---|
| `groq_client.py` | `GroqClient` | Init with valid/invalid API key, streaming response, non-streaming response, error handling (network, auth, rate limit), Ollama/mock fallback |
| `router.py` | `AIRouter` | Strategy selection logic, fallback chain |
| `turbo_quant_service.py` | `TurboQuantService` | Config validation, provider fallback, supported providers list, error handling |
| `vector_store.py` | `VectorStore` | FAISS index create/search/save, BGE embedding, similarity search with results |
| `vision_processor.py` | `MultiModalVisionProcessor` | CLIP inference, YOLO detection, Gemini description, multimodal combine |
| `ollama_client.py` | `OllamaClient` | HTTP client init, generate, chat, error handling |
| `model_optimizer.py` | `optimize_torch_for_cpu()`, `get_model_device()` | CPU optimization, device detection |
| `logger.py` | `AILogger` | MongoDB logging, event creation, query |
| `image_processor.py` | `ImageProcessorService` | Image transform, optimization, YOLO detection pipeline |
| `ocr_client.py` | `OCRClient` | EasyOCR text extraction, image preprocessing |
| `gemini_client.py` | `GeminiClient` | Gemini 2.0 Flash API, image description |
| `dependencies.py` | `get_vector_store()`, `get_reranker()`, `get_classifier()` | FastAPI Depends lazy-loaders, singleton behavior |
| `document_processor.py` | `SentenceTransformerWrapper`, `DocumentProcessor` | PDF/docx text extraction, chunking behavior |
| `cache.py` | `AICache` | Redis set/get/delete, TTL expiry, async operations |
| `decision_ai.py` | `DecisionAIService` | AI-powered decision analysis, Redis cache integration |
| `phi2_local.py` | *(empty file)* | Note: empty stub |

---

### PART 3: Backend Analytics Services

**Location:** `backend/app/services/analytics/` (4 files)

| File | Key Exports | What to Test |
|---|---|---|
| `data_analysis_agent_service.py` | `DataAnalysisAgentService` | AI-driven analysis pipeline, insight generation, error handling |
| `ml_service.py` | `MLService` | Regression model, classification model, clustering model, model persistence, data shape validation |
| `data_processor.py` | `DataProcessor` | CSV ingestion, Excel ingestion, JSON ingestion, data preprocessing, missing value handling, type coercion |
| `__init__.py` | *(comment only)* | — |

---

### PART 4: Backend Chat, Code, Debug, Document Services

**Location:** `backend/app/services/`

| Service Dir | File | What to Test |
|---|---|---|
| `chat/` | `context.py` — `build_context()` | MongoDB history retrieval, RAG context integration, token limit handling |
| `code/` | `scanner.py` — `scan_local_workspace()` | AST scanning: LOC count, class extraction, import detection, directory recursion, error on invalid path |
| `code_execution/` | `sandbox.py` — `CodeSandbox` | Multi-language execution (Python/JS/TS/Go/Rust/C/Java), timeout enforcement, memory limits, security isolation, error output capture |
| `code_execution/` | `file_system.py` — `FileSystemService` | Sandbox-enforced read/write/list, path traversal prevention |
| `code_executor/` | `sandbox.py` — `SecureSandbox` | Python-only sandbox, REPL behavior, safe builtins whitelist, injection prevention |
| `debug/` | `adapter.py` — `DebugAdapter` | Breakpoint set/clear, stack frame capture, step over/into, continue, session lifecycle |
| `document/` | `service.py` — `DocumentService` | File upload, file read by ID, error on missing file, content type handling |
| `export/` | `decision_export.py` — `DecisionExportService` | PDF generation, JSON export, Markdown export, STAR format, reportlab integration |
| `git/` | `repository.py` — `GitRepository` | Init, status, commit, log, error on non-repo directory, branch detection |
| `testing/` | `runner.py` — `TestRunner` | Multi-language test execution, result parsing, timeout handling |

---

### PART 5: Backend GitHub & JobPrep Services

**Location:** `backend/app/services/github/` and `jobprep/`

#### GitHub Services (6 files)

| File | Key Exports | What to Test |
|---|---|---|
| `client.py` | `GitHubClient` | Repo info retrieval, file tree, file contents, code search, auth handling |
| `analyzer.py` | `GitHubAnalyzer` | AI-powered code structure analysis, security analysis, quality analysis |
| `research_mapper.py` | `ResearchMapper` | Repo-to-research mapping via LLM |
| `cloner.py` | `RepoCloner` | Git clone, tar creation, Supabase upload, cleanup |
| `cache.py` | `CacheService` | Redis GET/SET, TTL, cache invalidation |

#### JobPrep Service (1 file)

| File | Key Exports | What to Test |
|---|---|---|
| `jobprep_service.py` | `JobPrepService` | Profile CRUD, target roles CRUD, skills management, interview practice, project management, readiness analysis, skill gap detection |

---

### PART 6: Backend Memory & RAG Services

#### Memory Services (`services/memory/`)

| File | Key Exports | What to Test |
|---|---|---|
| `system.py` | `HierarchicalMemory` | Episodic memory store/retrieve, semantic memory, procedural memory, Mem0 backend, file backend, memory consolidation |

#### RAG Services (`services/rag/` — 16 files)

Test **ALL** files:

| File | What to Test |
|---|---|
| `reranker.py` — `FlashRankReranker` | Two-stage CrossEncoder, marginal utility reranking, score normalization |
| `refiner.py` — `AnswerRefiner` | Stage-B linguistic refinement, faithfulness improvement |
| `web_search.py` — `WebSearchFallback` | Tavily search, mock fallback, error handling |
| `rewriter.py` — `QueryRewriter` | LLM-based query rewriting, multi-query expansion |
| `classifier.py` — `QueryComplexityClassifier` | DistilBERT classification: SIMPLE/SINGLE_HOP/MULTI_HOP |
| `quality_metrics.py` — `QualityMetrics` | Structure scoring, density scoring, naturalness scoring, confidence scoring |
| `extractor.py` — `EntityExtractor` | LLM-based entity extraction, relationship extraction |
| `language_optimizer.py` — `LanguageOptimizer` | LLM-ish phrase removal, natural language transformation |
| `density_controller.py` — `DensityController` | Token-to-value ratio optimization, 70%+ target |
| `evaluator.py` — `RetrievalEvaluator`, `CRAGPipeline`, `SelfCritique` | Retrieval quality eval, corrective RAG, self-critique |
| `pipeline.py` — `OmniRAGPipeline` | Full orchestrator: HyDE → classifier → reranker → web → evaluator → KG → refiner |
| `hyde.py` — `HyDEEngine` | Hypothetical Document Embeddings generation |
| `recursive_agent.py` — `RecursiveReasoningAgent` | REPL-based recursive reasoning, large context handling |
| `graph_store.py` — `KnowledgeGraph` | NetworkX graph, Louvain community detection, GraphRAG store |
| `answer_schema.py` — `AnswerFormatter` | Answer complexity enum, schema validation |
| `prompts/recursive.py` | Prompt template constants |

---

### PART 7: Backend Storage Services

**Location:** `services/storage/`

| File | What to Test |
|---|---|
| `supabase.py` — `SupabaseStorage` | File upload to Supabase, file download, Redis URL cache set/get, cache invalidation, error handling |

---

### PART 8: Backend API Routes (Endpoint Testing)

**Location:** `backend/app/api/v1/` (21 route files)

For **EVERY** endpoint below, test:
- ✅ Success path (200/201)
- ❌ Validation errors (422)
- 🔒 Auth failures (401/403)
- 🔍 Not found (404)
- ⚡ Response time (<500ms simple, <5s complex)
- 📐 Response schema matches Pydantic model

| File | Prefix | Key Endpoints |
|---|---|---|
| `auth.py` | `/auth` | POST `/register`, POST `/login`, POST `/token/refresh`, GET `/me`, POST `/oauth/github` |
| `chat.py` | `/chat` | GET `/sessions`, POST `/sessions`, GET `/sessions/{id}`, POST `/sessions/{id}/messages`, POST `/sessions/{id}/stream` |
| `research.py` | `/research` | POST `/deep-research`, POST `/deep-research/stream` |
| `workspace.py` | `/workspace` | GET `/sources`, GET `/clusters`, GET `/graph-nodes`, POST `/tool-invoke` |
| `documents.py` | `/documents` | GET `/`, POST `/`, GET `/{id}`, PUT `/{id}`, DELETE `/{id}`, POST `/upload` |
| `code.py` | `/code` | GET `/projects`, POST `/projects`, GET `/projects/{id}`, POST `/projects/{id}/files`, POST `/projects/{id}/execute` |
| `coding_team.py` | `/coding-team` | POST `/execute` |
| `analytics.py` | `/analytics` | GET `/dashboard`, GET `/metadata` |
| `analytics_complete.py` | `/analytics` | GET/POST `/datasets`, POST `/datasets/{id}/analyze`, POST `/datasets/{id}/ml`, GET `/charts`, POST `/export` |
| `decisions.py` | `/decisions` | GET/POST `/`, GET/PUT/DELETE `/{id}`, POST `/scan`, POST `/{id}/analyze`, GET `/{id}/export` |
| `jobprep.py` | `/jobprep` | GET/POST `/profiles`, GET/POST `/roles`, GET `/skills/gaps`, POST `/simulations`, GET `/readiness` |
| `wellbeing.py` | `/wellbeing` | POST `/check`, POST `/pomodoro`, POST `/events` |
| `memory.py` | `/memory` | GET `/profile`, GET `/query` |
| `images.py` | `/images` | POST `/upload`, GET `/`, DELETE `/{id}`, POST `/batch` |
| `omni_rag.py` | `/omni-rag` | POST `/query`, POST `/stream`, POST `/upload`, GET `/stats`, POST `/graph/rebuild` |
| `git.py` | `/git` | POST `/init`, GET `/status`, POST `/commit`, GET `/history` |
| `terminal.py` | `/terminal` | WebSocket `/session` |
| `githubrepos.py` | `/github-repos` | POST `/import`, GET `/{id}/analyze`, POST `/bulk`, POST `/{id}/map-research` |
| `testing.py` | `/testing` | POST `/run` |
| `debug.py` | `/debug` | POST `/start`, POST `/stop`, POST `/breakpoint`, POST `/continue`, POST `/step` |
| `agent_tools.py` | `/agent-tools` | POST `/read-file`, POST `/write-file`, POST `/list-files`, POST `/exec-command` |

---

### PART 9: Backend Agents (Functional Testing)

**Location:** `backend/app/agents/`

| Agent File | What to Test |
|---|---|
| `research_agent.py` — `DeepResearchAgent` | DECOMPOSE phase, parallel SEARCH (RAG + Web + Graph), EVALUATE (keyword + LLM scoring), REFINE (gap identification), SYNTHESIZE (structured report), depth configs (QUICK/STANDARD/DEEP/EXHAUSTIVE), streaming, singleton factory, concurrency semaphore |
| `deep_research_agent.py` — `DeepResearchAgent` (alt) | Same tests, verify difference in `parallel_search` (uses `omni_rag.process_query()` directly) |
| `wellbeing_agent.py` — `WellbeingAgent` | Signal detection (LATE_NIGHT/FRUSTRATION/MARATHON/OVERWORK), stress score calculation, interventions, caching with TTL, singleton |
| `coding_team/` — `create_coding_team_graph()` | LangGraph construction, AgentState typing, all nodes (team_lead, coder, reviewer), all tools (read_file, write_file, list_files, rag_search_code) |
| `planner_agent.py` | **Empty stub** — document as unimplemented |
| `code_review_agent.py` | **Empty stub** — document as unimplemented |

---

### PART 10: Backend Workers (Celery)

**Location:** `backend/app/workers/celery_app.py`

| Test Area | What to Verify |
|---|---|
| Redis Connectivity | Broker responds, backend responds |
| Task Autodiscovery | `app.services.ai` and `app.services.rag` tasks are discoverable |
| Configuration | Serializer (json), accepted content, timezone (UTC), prefetch multiplier, max_tasks_per_child |
| Task Execution | Submit test task, verify result |
| Error Handling | Worker crash recovery, task failure reporting |

---

### PART 11: Backend Models & Schemas

#### Models (`backend/app/models/`)

| Model File | What to Test |
|---|---|
| `analytics.py` | ORM columns, relationships, constraints |
| `chat.py` | Session model, message model, relationships |
| `code.py` | Project model, file model, execution model |
| `decision.py` | Decision model, analysis model, evidence model |
| `document.py` | Document model, document links |
| `github.py` | Repo model, analysis model |
| `image.py` | Image model, variant model |
| `jobprep.py` | Profile, role, skill, project, simulation models |
| `research.py` | Research report model, source model |
| `user.py` | User model, preferences, auth fields |

Test: SQLAlchemy column types, nullable/required fields, unique constraints, foreign keys, cascade behavior, default values.

#### Schemas (`backend/app/schemas/`)

For each schema file, test: Pydantic field validation, required/optional fields, type coercion, custom validators, serialization/deserialization, error messages.

---

### PART 12: Frontend Dashboard Pages

**Location:** `frontend/src/app/(dashboard)/`

For **EVERY** page below, test:
- ✅ Component renders without errors
- 🔄 Loading state displays correctly
- 🈳 Empty state handles no data gracefully
- ❌ Error state shows appropriate message
- 🎯 User interactions work (clicks, inputs, scrolls)
- 📱 Responsive at mobile/tablet/desktop
- 🔗 API integration works end-to-end
- 🏪 Store integration works correctly

| Route | File | Key Features to Test |
|---|---|---|
| `/overview` | `page.tsx` (324 lines) | Metrics display, recent work section, signals panel, activities list, data aggregation from all modules |
| `/chat` | `page.tsx` (1965 lines) | Message list rendering, sidebar with sessions, slash commands, file/image upload, real-time streaming, session management, markdown rendering |
| `/code` | `page.tsx` (632 lines) | Multi-language IDE, file explorer tree, terminal, debugger UI, git panel, test runner, team chat panel, command palette |
| `/research` | `page.tsx` (890 lines) | Knowledge graph visualization, sources list, clusters view, AI intelligence tools (9 tools), citation manager |
| `/documents` | `page.tsx` (468 lines) | List/grid view toggle, search, type/status filtering, pagination |
| `/documents/[id]` | `page.tsx` (580 lines) | Document editor, rich text, AI features, save/autosave |
| `/documents/new` | `page.tsx` (134 lines) | Creation wizard, template selection, metadata form |
| `/analytics` | `page.tsx` (5397 lines) | Dashboard charts, datasets table, data analysis agent, ML model config, export options |
| `/analytics/[datasetId]` | `page.tsx` (741 lines) | Dataset detail, charts, analysis results, insights |
| `/analytics/upload` | `page.tsx` (260 lines) | Drag-and-drop upload, file validation, progress indicator |
| `/analytics/export-preview` | Components (3 files) | PDF preview rendering, template switching (simple/professional) |
| `/decisionvault` | `page.tsx` (1464 lines) | Kanban board, decision log, AI flagging, filtering/sorting, export |
| `/jobprep` | `page.tsx` (1364 lines) | Profile display, target roles list, skills matrix, projects, simulations, readiness score |
| `/settings` | `page.tsx` (155 lines) | Profile settings, security settings, preferences |

---

### PART 13: Frontend Services (API Client Testing)

**Location:** `frontend/src/services/`

For **EVERY** service, test:
- ✅ Correct API endpoint formatting
- ✅ Proper auth header injection
- ✅ Response parsing and error handling
- ✅ TypeScript type safety
- ❌ Network error handling
- ❌ Timeout handling
- 🔄 Retry logic (if implemented)

| Service File | Key Exports | What to Test |
|---|---|---|
| `config.ts` | `API_BASE` | Correct URL from env var |
| `auth.ts` | `authService` | Login, register, getMe, GitHub OAuth, token management |
| `chat.ts` | `chatService` | getSessions, sendMessage, getMessages, streaming via EventSource/SSE, image interaction |
| `code.ts` | `codeService` | CRUD projects, file management, code execution, execution history |
| `research.ts` | `fetchSources`, `fetchClusters`, etc. | Workspace data fetching, streaming research pipeline |
| `overview.ts` | `overviewService.getOverviewData()` | Aggregation from ALL other services, partial failure handling |
| `analytics.ts` | `analyticsService` | Datasets CRUD, analysis, charts, ML models, insights |
| `document.ts` | `documentService` | Document CRUD, upload with FormData, AI operations |
| `decision.ts` | `decisionService` | Decision CRUD, AI analysis, workspace scanning, export |
| `jobprep.ts` | `jobPrepService` | Profile, roles, skills, projects, simulations, evidence, skill gaps |
| `wellbeing.ts` | `wellbeingService` | Wellbeing check, event logging |
| `image.ts` | `imageService` | Upload, list, delete, batch, auth headers |
| `git.ts` | `gitService` | Init, status, commit, history |
| `omniRag.ts` | `omniRagService` | Query, streaming SSE, document upload, graph operations, TurboQuant |
| `terminal-ws.ts` | `TerminalWebSocket` | WebSocket connect/disconnect, send/receive, reconnect, error handling |
| `export.ts` | `ExportService` | PDF/JSON/markdown/HTML export, options handling |
| `export-templates.ts` | Templates (4) | Professional, creative, minimal, ATS-friendly template rendering |

---

### PART 14: Frontend Stores (State Management)

**Location:** `frontend/src/stores/`

| Store | What to Test |
|---|---|
| `authStore.ts` (78 lines) | User state transitions, token persistence to localStorage, auth status (idle/checking/authenticated/unauthenticated), login/logout actions |
| `codeStore.ts` (897 lines) | File tree manipulation, open/active file tracking, terminal sessions, debug sessions, breakpoints, git status/history, AI suggestions, UI sidebar state, addFile with backend sync, language detection |
| `researchStore.ts` (55 lines) | currentPhase transitions, activeNode/activeTool selection, citationStyle toggle, share modal |
| `uiStore.ts` (11 lines) | isEnteringWorkspace boolean toggle |
| `jobPrepStore.ts` (286 lines) | Profile CRUD, target roles management, skills CRUD, projects CRUD, simulations CRUD, async fetch/analysis actions |

Test: Zustand state initialization, action dispatch, state mutation, async thunks, persistence, subscription/rerender behavior.

---

### PART 15: AI-Core Module

**Location:** `ai-core/`

| File | Status | What to Test / Document |
|---|---|---|
| `rag/chunking.py` — `SemanticChunker` | **Has code** (182 lines) | Recursive character splitting, chunk size/overlap, text boundary handling |
| `rag/retriever.py` | Empty | Document as stub |
| `rag/reranker.py` | Empty | Document as stub |
| `rag/faiss_store/__init__.py` | Empty | Document as stub |
| `evaluation/accuracy.py` | Empty | Document as stub |
| `evaluation/latency.py` | Empty | Document as stub |
| `evaluation/hallucination.py` | Empty | Document as stub |
| `llm/response_validators.py` | Empty | Document as stub |
| `llm/prompts/__init__.py` | Empty | Document as stub |
| `llm/templates/__init__.py` | Empty | Document as stub |
| `pipelines/document_pipeline.py` | Empty | Document as stub |
| `pipelines/research_pipeline.py` | Empty | Document as stub |
| `pipelines/chat_pipeline.py` | Empty | Document as stub |

---

### PART 16: Integration / End-to-End Flows

Test these full workflows from frontend → backend → database/storage:

| Workflow | Steps |
|---|---|
| **Auth Flow** | Open login page → Register → Redirect to dashboard → Access protected route → Token refresh → Logout |
| **Chat + RAG** | Open chat → Start session → Send message → RAG retrieval → AI streaming response → Session persists → Reload and verify history |
| **Code Lab** | Create project → Add files (multi-language) → Execute code → Git init → Commit → Run tests → Debug session |
| **Research** | Start deep research → Sources retrieved via RAG/web → Knowledge graph built → AI tools invoked → Structured report generated → Save workspace |
| **Analytics** | Upload dataset (CSV) → Data processed → Descriptive stats → ML model (regression/classification/clustering) → Charts generated → Export report |
| **Documents** | Upload document → AI processing → View in editor → Rich text editing → Save → Link to research |
| **Decision Vault** | Scan workspace → AI extracts decisions → Decision recorded → AI analysis → Kanban board → Export decision log |
| **Job Prep** | Create profile → Add target roles → Add skills → Skill gap analysis → Practice simulation → Interview prep → Readiness assessment |
| **GitHub** | Import GitHub repo → File tree analysis → AI structure analysis → Security analysis → Map to research |
| **Images** | Upload image → AI vision processing (YOLO/CLIP) → OCR text extraction → Gemini description |

---

### PART 17: WebSocket Testing

| Component | File(s) | What to Test |
|---|---|---|
| Terminal WS | `terminal-ws.ts` + `terminal.py` | Connection open/close/reconnect lifecycle, PTY session creation, input→output streaming, concurrent terminal sessions, disconnect cleanup, data encoding |
| Chat Streaming | `chat.ts` + `chat.py` | SSE connection, message chunk ordering, abort/cancel mid-stream, reconnection on disconnect, partial response rendering |
| Research Streaming | `research.ts` + `research.py` | SSE events for deep research, progress events per phase, cancellation mid-research |
| OmniRAG Streaming | `omniRag.ts` + `omni_rag.py` | SSE query streaming, error events within stream, metadata in stream events, timeout handling |

---

### PART 18: Security Testing

| Category | What to Test |
|---|---|
| **JWT/Supabase Auth** | Token injection in headers, expired tokens return 401, algorithm confusion (none attack, RS256→HS256), missing auth headers, malformed tokens, token tampering |
| **SQL Injection** | All query parameters with `' OR 1=1 --`, `UNION SELECT`, time-based blind payloads, string interpolation in search endpoints |
| **NoSQL Injection** | MongoDB query operators (`$ne`, `$gt`, `$regex`) in JSON bodies, URL parameters |
| **XSS** | All user-generated content: chat messages, document content, code output, decision descriptions, job prep fields. Test `<script>`, `onerror=`, `javascript:` payloads |
| **CSRF** | Verify state-changing endpoints require proper auth token (not just cookies), test cross-origin requests |
| **Input Validation** | Pydantic/Zod schemas: max length overflow, special characters, Unicode, null bytes, prototype pollution |
| **File Upload Security** | Path traversal (`../../../etc/passwd`), oversized files (>10MB), executable extensions, SVG with XSS, zip bombs |
| **CORS** | Verify CORS headers restrict origins correctly, preflight OPTIONS responses |
| **Rate Limiting** | Check rate limits exist on auth and data endpoints, verify triggers at expected thresholds |
| **Command Injection** | Code execution endpoints (sandbox test), terminal commands, git operations |
| **Path Traversal** | File read/write endpoints, document paths, code file paths |

---

### PART 19: Accessibility (A11y) Testing

| Category | What to Test (WCAG AA standard) |
|---|---|
| **Keyboard Navigation** | Tab order follows visual order, all interactive elements focusable, no keyboard traps, focus indicators visible (min 2:1 contrast), skip-to-content link |
| **Screen Reader** | Semantic HTML (nav, main, section, article, aside), ARIA labels on all interactive elements, alt text on all images, ARIA live regions for dynamic content, proper heading hierarchy (h1→h2→h3) |
| **Color Contrast** | All text meets 4.5:1 ratio (AA), large text (18px+ bold or 24px+) meets 3:1, focus states maintain contrast, error states not color-only |
| **Forms** | Explicit label-input associations, error announcements with `aria-live` or `role="alert"`, required field indicators, autocomplete attributes |
| **Dynamic Content** | Live region announcements for: new chat messages, loading states, notifications, search results, streaming responses |
| **Responsive/Zoom** | Touch targets min 44x44px, 200% zoom no content loss, horizontal scrolling avoided, orientation not locked |
| **Motion & Time** | Respects `prefers-reduced-motion`, no auto-playing content without pause, timeouts communicated |
| **Screen Size/Viewport** | Responsive layout at 320px, 768px, 1024px, 1440px widths |

---

### PART 20: Existing Test Coverage (Run + Extend)

#### Frontend Unit Tests (`frontend/src/__tests__/`)

| Test File | What it Tests | Action |
|---|---|---|
| `setup.ts` | Vitest mocks | Run and verify |
| `overview/overview.service.test.ts` | `getOverviewData()` | Run, add missing service mocks |
| `research/research-regression.test.ts` | ToolKey, response envelope | Run, verify |
| `chat/ChatPage.test.tsx` | Chat component | Run, verify all test cases |
| `chat/chat.service.test.ts` | chatService methods | Run, add missing coverage |
| `chat/ChatPage.utils.test.ts` | Utility functions | Run |
| `chat/omniRag.service.test.ts` | OmniRAG service | Run, extend |
| `chat/image.service.test.ts` | Image service | Run, extend |

#### Frontend Integration Tests (`frontend/src/services/__tests__/`)

| Test File | Action |
|---|---|
| `auth.integration.test.ts` | Run, add MSW handlers for more services |

#### Backend Tests (`backend/tests/`)

| Test File | Action |
|---|---|
| Run ALL tests: `python -m pytest tests/ -v` | Establish baseline |
| Extend coverage for missing route/endpoint tests | Create test files for untested routes |

#### Root-Level Tests (`tests/`)

| Test File | Action |
|---|---|
| `tests/load/load_test.js` (k6) | Run with `k6 run` |
| `tests/load/auth-load.js` (k6) | Run with `k6 run` |
| `tests/load/perf_baseline.py` | Run performance profiler |

---

## DOCUMENTATION REQUIREMENTS

### Per-Service Documentation

For **EACH** of the 20 categories above, create **one markdown file** in `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/`.

**Naming:** `SERVICE_NAME_TEST_REPORT.md` (e.g., `AI_SERVICES_TEST_REPORT.md`, `API_ROUTES_TEST_REPORT.md`, `DASHBOARD_PAGES_TEST_REPORT.md`)

**Template:**

```markdown
# [Category Name] — Test Report

## Overview
Brief description, purpose, dependencies.

## Files Tested
- `path/to/file.py` — key exports, what it does

## Test Results Summary
| Component | Status | Tests Passed | Tests Failed | Coverage Est. |
|-----------|--------|-------------|-------------|--------------|

## Detailed Findings

### Component Name — ✅ PASS / ❌ FAIL
- **What was tested:** ...
- **Result:** ...
- **Issues found:** ...

## Security Findings (if applicable)
| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|

## Accessibility Findings (if applicable)
| Issue | WCAG Criterion | Location | Description |
|-------|---------------|----------|-------------|

## WebSocket Findings (if applicable)
| Test | Result | Notes |
|------|--------|-------|

## Bugs & Issues Found
| Severity | Component | Description | Steps to Reproduce | Suggested Fix |
|----------|-----------|-------------|-------------------|---------------|

## Coverage Gaps
- What's NOT tested
- Risk level

## Recommendations
- Actionable improvement items
```

### Index Document

Create `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/INDEX.md`:

```markdown
# ENGUNITYCORE Testing Index

## Overall Health Dashboard
| Category | Health | Tests | Coverage | Issues |
|----------|--------|-------|----------|--------|
| ... | ✅/⚠️/❌ | X/Y pass | % | N critical |

## Service Reports
- [1. Backend Root Services](./ROOT_SERVICES_TEST_REPORT.md)
- [2. AI Services](./AI_SERVICES_TEST_REPORT.md)
- ... (all 20 categories)

## Critical Issues
- #1: ...
- #2: ...

## Quick Links
- [Comprehensive Report](./COMPREHENSIVE_TESTING_REPORT.md)
```

### Comprehensive Final Report

Create `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/COMPREHENSIVE_TESTING_REPORT.md`:

1. **Executive Summary** — Overall health score (0-100%), key metrics, headline risks
2. **Per-Category Health** — Table with health score per category
3. **Critical Bugs** — Severity-ordered bug list
4. **Security Risk Assessment** — Overall score, critical findings, recommended fixes
5. **Accessibility Score** — WCAG AA compliance %, top violations
6. **WebSocket Reliability** — Connection stability, latency, error rates
7. **Coverage Gaps** — What's missing and risk impact
8. **Performance Baseline** — Response times, P95 latency, throughput
9. **Load Test Results** — k6 metrics, concurrent user capacity
10. **Priority Action Items** — Ranked by impact/effort

---

## EXECUTION PLAN

### Phase 1: Environment & Baseline (30 min)
- [ ] `conda activate engunity`
- [ ] Start backend (port 8000) and frontend (port 3000)
- [ ] Verify health endpoints
- [ ] Read CLAUDE.md, AGENTS.md, key service files
- [ ] Load code-review-graph MCP tools
- [ ] Run ALL existing tests to establish baseline
- [ ] Run `npx tsc --noEmit` for frontend type check

### Phase 2: Backend Deep Dive (4-5 hours)
- [ ] Unit test all services (Parts 1-7)
- [ ] Endpoint test all API routes (Part 8)
- [ ] Functional test all agents (Part 9)
- [ ] Test celery workers (Part 10)
- [ ] Validate models and schemas (Part 11)
- [ ] Security test all endpoints (Part 18)

### Phase 3: Frontend Deep Dive (4-5 hours)
- [ ] Component test all dashboard pages (Part 12)
- [ ] Unit test all frontend services (Part 13)
- [ ] State test all Zustand stores (Part 14)
- [ ] Accessibility audit all pages (Part 19)
- [ ] Run `npm run lint` and `npx tsc --noEmit`

### Phase 4: Integration & Performance (3-4 hours)
- [ ] End-to-end workflows (Part 16)
- [ ] WebSocket testing (Part 17)
- [ ] Performance baseline (Part 20)
- [ ] Load testing with k6 (Part 20)
- [ ] ai-core module check (Part 15)
- [ ] Write missing automated tests

### Phase 5: Documentation (3-4 hours)
- [ ] Generate one doc per category (20 docs)
- [ ] Create INDEX.md
- [ ] Create COMPREHENSIVE_TESTING_REPORT.md
- [ ] Review all docs for accuracy

---

## VALIDATION COMMANDS REFERENCE

```bash
# Backend
cd /home/agentrogue/projects/ENGUNITYCORE/backend
curl http://localhost:8000/health                         # Health check
curl http://localhost:8000/openapi.json | python3 -m json.tool | head -60  # Routes
python -m pytest tests/ -v                                # Run all backend tests
python -m pytest tests/test_specific.py -v                # Single test file

# Frontend
cd /home/agentrogue/projects/ENGUNITYCORE/frontend
npm run test                                                # All Vitest tests
npm run test:coverage                                       # With coverage
npm run test:e2e                                            # Playwright E2E
npx tsc --noEmit                                            # Type check
npm run lint                                                # Lint check

# Load Tests
cd /home/agentrogue/projects/ENGUNITYCORE
k6 run tests/load/load_test.js                              # k6 load test
k6 run tests/load/auth-load.js                              # Auth load test
python tests/load/perf_baseline.py                          # Performance baseline
```

---

## REMINDERS

- **NEVER** edit source code — only read, test, document
- **NEVER** commit `.env`, secrets, or temp artifacts
- **ALWAYS** clean up test databases and uploaded files when done
- Each service gets its OWN markdown report
- Use code-review-graph MCP tools BEFORE grep/glob
- Use the available agents and skills listed above
- Write automated tests where gaps exist (Vitest for frontend, pytest for backend)
- Document ALL findings including empty/unimplemented components
- Final report must include security, accessibility, and WebSocket sections
