# Decision Vault Connected Files and Folders Map

Date: 2026-04-15
Target route: frontend/src/app/(dashboard)/decisionvault

## Scope
This map lists files and folders connected to the Decision Vault feature across frontend, backend, database, tests, and configuration.
Connections are grouped as:
- Direct: route, service, API, model, schema
- Integration: pages/components that navigate into Decision Vault
- Infrastructure: auth, DB, Mongo, router registration, monitoring/caching
- Configuration and secret-bearing env files (paths only, no values)

## 1) Frontend Route and UI (Direct)

### Folder
- frontend/src/app/(dashboard)/decisionvault

### Files
- frontend/src/app/(dashboard)/decisionvault/page.tsx
  - Main Decision Vault page component.
  - Loads decisions, creates new decisions, runs AI analysis, handles multi-step decision workflow.
  - Reads inbound query params (source, title, problem, context) from other modules.

- frontend/src/app/(dashboard)/decisionvault/decisionvault.module.css
  - Route-specific styling for Decision Vault UI.

- frontend/src/services/decision.ts
  - Frontend API client for Decision Vault endpoints.
  - Calls: GET /decisions, GET /decisions/{id}, POST /decisions, PATCH /decisions/{id}, POST /decisions/analyze.
  - Uses token from auth store and NEXT_PUBLIC_API_URL base.

## 2) Frontend Dashboard Shell and Navigation (Direct)

### Files
- frontend/src/app/(dashboard)/layout.tsx
  - Adds Decision Vault navigation item (/decisionvault) in dashboard sidebar.
  - Applies layout/header behavior for Decision Vault route.

## 3) Frontend Cross-Feature Entrypoints into Decision Vault (Integration)

### Files
- frontend/src/components/code-lab/AIRefinePanel.tsx
  - "Save to Decision Vault" action pushes to /decisionvault with prefilled query params from active code file.

- frontend/src/app/(dashboard)/code/page.tsx
  - Contains route push to /decisionvault for code-driven decisions.

- frontend/src/app/(dashboard)/chat/page.tsx
  - Contains route push to /decisionvault for chat-derived decisions.

- frontend/src/app/(dashboard)/research/page.tsx
  - Contains route push to /decisionvault for research-derived decisions.
  - "Log Decision" and "Finalize as Decision" route actions.

- frontend/e2e/research/research-workspace.spec.ts
  - E2E coverage for Decision Vault routing triggers from research page.

## 4) Backend API and Business Logic (Direct)

### Files
- backend/app/api/v1/decisions.py
  - Decision Vault REST API.
  - Core operations: list, create, get, update, analyze.
  - Export operations: JSON, ADR markdown, STAR markdown, PDF.
  - Stores metadata in Postgres and reasoning trace events in Mongo collection decision_traces.

- backend/app/services/ai/decision_ai.py
  - Adversarial AI reviewer used by POST /decisions/analyze.
  - Uses Groq client to generate decision flags and bias checks.

- backend/app/services/export/decision_export.py
  - Export formatter for JSON, ADR, STAR, PDF outputs.

- backend/app/services/export/__init__.py
  - Export service package marker for Decision Vault export services.

## 5) Backend Data Models and Schemas (Direct)

### Files
- backend/app/models/decision.py
  - SQLAlchemy model for decisions table.
  - Includes JSON fields for options, evidence, constraints, tradeoffs, ai_flags, tags.

- backend/app/schemas/decision.py
  - Pydantic request/response schemas for Decision APIs.

- backend/app/models/user.py
  - User model relation: decisions back_populates Decision.user.

- backend/app/models/__init__.py
  - Imports Decision model for model registration.

## 6) Backend App Wiring and Platform Dependencies (Infrastructure)

### Files
- backend/app/main.py
  - Registers decisions router at /api/v1/decisions.

- backend/app/api/v1/auth.py
  - Provides get_current_user dependency used by decisions API authorization.

- backend/app/core/database.py
  - Postgres SQLAlchemy engine/session used by Decision model queries.

- backend/app/core/mongodb.py
  - MongoDB client used by decisions API for decision_traces collection writes/reads.

- backend/app/core/query_cache.py
  - Generic cache decorator and invalidation pattern examples including decision query naming.

- backend/app/core/performance_monitor.py
  - Route-level perf monitor references routes like GET /api/v1/decisions/.

- backend/app/api/v1/analytics.py
  - Reads Decision model to compute decision counts in analytics summaries.

## 7) Database and Persistence Artifacts (Direct + Infra)

### Postgres
- Logical table: decisions (from backend/app/models/decision.py)
- Linked user FK: users.id

### MongoDB
- Collection: decision_traces (written/read in backend/app/api/v1/decisions.py)

### SQL/index scripts
- backend/add_performance_indexes.sql
  - Explicit DECISION VAULT indexes for decisions table (user_id, status, created/updated, tags GIN, composites).

## 8) Configuration and Secret-Bearing Files (Paths only)
These files influence Decision Vault runtime connectivity and auth. Values were not inspected.

- .env
- .env.example
- .env.code
- backend/.env
- frontend/.env.local

Related runtime config source files:
- backend/app/core/config.py
- frontend/src/services/decision.ts (uses NEXT_PUBLIC_API_URL)

## 9) Related Docs and Verification Reports

### Files
- docs/testing/research-workspace-e2e-report.md
  - Contains Decision Vault routing notes from research flows.

- docs/testing/TESTING_QUICK_VIEW.md
  - Includes Decision Vault test summary references.

- docs/testing/COMPREHENSIVE_TESTING_REPORT_PROFESSIONAL.md
  - Includes Decision Vault endpoint and architecture references.

## 10) Folder-Level Connection Summary

- frontend/src/app/(dashboard)/decisionvault
  - Primary Decision Vault route implementation.

- frontend/src/services
  - Decision service API adapter.

- frontend/src/app/(dashboard)
  - Cross-route navigation and route shell integration.

- frontend/src/components/code-lab
  - Code-to-Decision Vault handoff.

- backend/app/api/v1
  - Decision API endpoints and export routes.

- backend/app/models
  - Postgres persistence model.

- backend/app/schemas
  - API contract validation and serialization.

- backend/app/services/ai
  - AI analysis of decision quality/risk/bias.

- backend/app/services/export
  - Decision export formats.

- backend/app/core
  - DB, Mongo, auth dependency chain, perf/cache infrastructure.

- docs/testing
  - Existing verification context that references Decision Vault behavior.

## 11) Practical End-to-End Path (Frontend to Backend to DB)
1. User opens /decisionvault.
2. page.tsx calls decisionService.getDecisions().
3. decision.ts calls backend /api/v1/decisions with bearer token.
4. backend decisions.py verifies user via auth dependency.
5. Postgres returns decision rows from decisions table.
6. On create, decisions.py inserts into Postgres and writes creation trace into Mongo decision_traces.
7. On analyze, decisions.py calls decision_ai.py for adversarial flags.
8. On export, decisions.py calls decision_export.py formatters.

## 12) Notes
- No dedicated Decision Vault backend test file was found under backend/tests in this scan.
- Decision Vault routing behavior is currently covered indirectly in research E2E flow.
- Decision Vault is integrated with code/chat/research entrypoints via query-parameter handoff.
