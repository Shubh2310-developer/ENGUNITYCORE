# AI Data Analysis Agent Integration Design (Analytics Dashboard)

Date: 2026-04-15
Scope: Integrate a conversational AI data analysis agent into the Analytics Dashboard with strong performance across desktop and low-power devices.

## 1) Context and Baseline

This plan is grounded in the current repository state and two existing documents:
- docs/ai-agents/04_AI_DATA_ANALYSIS_AGENT.md (feature concept and target data model)
- docs/reports/analytics-dashboard-fullstack-verification-2026-04-14.md (verification baseline and resolved priorities)

Current implementation realities:
- Frontend analytics page already has tabs, query workflow, AI insights timeline, prediction mode, and chart components.
- Backend analytics API already provides datasets, statistics, ML, insights, query, cleaning, export, and session endpoints.
- There is no dedicated conversational "ask your data" endpoint yet in backend/app/api/v1/analytics_complete.py.
- Frontend service layer (frontend/src/services/analytics.ts) does not yet expose an ask-agent method.
- Analytics page still contains residual direct fetch paths for insights/export token handling, while most calls already go through analyticsService.

Integration strategy: add a dedicated AI analysis endpoint and wire a focused Ask Your Data panel into the existing analytics page without destabilizing existing ML/charts/session features.

## 2) Product Goal and Non-Goals

### Goal
Deliver a production-safe conversational analysis flow where a user can ask natural language questions and receive:
- concise summary,
- structured insights,
- chart-ready config,
- follow-up prompts,
- optional raw sample for transparency.

### Non-Goals (this phase)
- Replacing existing SQL query editor and ML workflows.
- Full autonomous BI planner across all tenant data.
- Local-only inference as default path.

## 3) Target User Flow in Analytics Page

1. User opens Analytics page and selects/uploads a dataset.
2. In AI Insights tab, user enters a natural language question.
3. Frontend sends request to new backend endpoint.
4. Backend translates question to safe query plan, executes with user scoping, generates insights and chart config.
5. Frontend renders summary + reusable chart + insights timeline cards.
6. User clicks a suggested follow-up to iterate.
7. Session save stores latest ask-agent outputs in existing analysis session payload.

## 4) API Contract Design

## Request
POST /api/v1/analytics/ask

Payload:
- query: string (required)
- dataset_id: number (optional but recommended in first release)
- time_range: string (default 30d)
- data_source: string (default analytics)

## Response
- query: string
- analysis_type: trend | comparison | distribution | anomaly | prediction | summary
- summary: string
- insights: array of insight objects
- chart: optional chart config
- raw_data: optional limited sample
- suggested_queries: string[]
- processing_time: number

## Error envelope
- 400 for invalid question/query spec
- 401/403 for auth and ownership failures
- 422 for schema violations
- 429 for rate limiting
- 500 for non-recoverable execution failures with sanitized message

## 5) Backend Implementation Plan

### 5.1 New schema file
Create backend/app/schemas/data_analysis_agent.py with strict Pydantic models:
- AnalysisType
- ChartType
- DataAnalysisRequest
- DataInsight
- ChartConfig
- DataAnalysisResponse

Hardening:
- query min/max length validation
- confidence in [0, 1]
- bounded array lengths where practical

### 5.2 New agent service
Create backend/app/agents/data_analysis_agent.py with a staged pipeline:
1. NL-to-query translation via configured LLM provider
2. Query validation + stage allowlist
3. Safe execution with user scoping
4. Insight extraction
5. Chart recommendation and mapping
6. Follow-up suggestion generation

Safety requirements:
- allowlist collections
- force user_id match first in pipeline
- block dangerous operators ($where, $function, mapReduce-like patterns)
- max pipeline stages
- max result rows (for example 1000)
- query timeout guard
- strict JSON extraction with fallback parser

### 5.3 API wiring
Modify backend/app/api/v1/analytics_complete.py:
- import request/response schema and data_analysis_agent singleton
- add route: @router.post("/ask")
- use current_user scoping
- route through standardized exception handling

### 5.4 Observability
Add logging and metrics:
- request id
- model/provider latency
- query execution latency
- result count
- cache hit/miss (if caching enabled)
- error class and sanitized error code

## 6) Frontend Integration Plan (Primary Scope)

Primary target: frontend/src/app/(dashboard)/analytics/page.tsx

### 6.1 Service layer extension
Update frontend/src/services/analytics.ts:
- add DataAnalysisRequest/DataAnalysisResponse interfaces
- add askData(request) method using existing auth header helper

This keeps auth centralized and prevents new token drift.

### 6.2 UI composition approach
Use a focused panel in AI Insights tab instead of a full new page:
- Option A (recommended): add a new component frontend/src/components/charts/DataAnalysisChat.tsx and mount it inside renderAIInsightsPanel().
- Option B: inline panel directly in page.tsx (faster but increases file size in already large page).

Recommendation: Option A to reduce risk and control complexity in page.tsx.

### 6.3 State strategy
Introduce local state for ask-agent interaction:
- askQuery
- askResult
- askLoading
- askError
- askHistory (optional short list)

Bridge outputs into existing structures where useful:
- map returned insights to existing AIInsight timeline format
- map returned chart config to existing chart rendering path/custom chart list

### 6.4 Chart rendering
Reuse existing chart components from frontend/src/components/charts:
- LineChart
- BarChart
- PieChart
- ScatterPlot
- AreaChart
- Heatmap
- Histogram
- BoxPlot

Create a lightweight adapter that maps backend chart config to component props and gracefully falls back when shape mismatches occur.

### 6.5 Session persistence
On save analysis session:
- include latest ask-agent summary and insights in ai_insights
- include generated chart config in custom_charts when compatible
- do not store large raw_data blobs in session payload

## 7) Performance Design (Any Device, Stable UX)

Performance is a first-class requirement. Keep heavy compute server-side and ship a thin client.

### 7.1 Budgets
- Ask endpoint p95 latency: <= 2.5s (remote LLM path)
- Ask endpoint timeout: hard cap 8s with graceful message
- Frontend payload target: <= 200KB for ask response
- Chart points sent to UI: capped/downsampled (for example <= 1000)

### 7.2 Frontend optimization
- Debounce query submit interactions.
- Use AbortController for in-flight ask cancellation when user re-submits.
- Lazy-render non-visible heavy chart sections.
- Avoid rerender storms by memoizing transformed chart data.
- Keep raw_data collapsed by default.

### 7.3 Backend optimization
- Introduce small TTL cache for repeated prompts per user+dataset+time_range.
- Pre-aggregate common metrics where possible.
- Limit LLM calls (single pass for insight+summary where feasible).
- Add fallback deterministic summarizer when LLM fails.

### 7.4 Device-tier behavior
- High capability devices: full chart interactivity and richer explanations.
- Mid-range devices: reduced animation and limited row previews.
- Low-power/mobile devices: summary-first mode, compact chart, lazy detail expansion.

### 7.5 Your current machine profile
Given your provided config (Ryzen 7 7735HS, RTX 4050 6GB, 16GB RAM):
- This is strong for local development and validation.
- Keep cloud/provider inference as default for consistency across all user devices.
- If local fallback is required, use quantized small models and strict token/context limits to prevent VRAM pressure.

## 8) Security and Data Safety

- Enforce per-user data scoping at query execution layer, not only at prompt layer.
- Never execute raw LLM-generated code.
- Never expose internal stack traces/dependency hints in API responses.
- Sanitize prompts and redact sensitive fields in logs.
- Add per-user and per-IP rate limiting for /analytics/ask.

## 9) Testing and Validation Plan

### 9.1 Backend
- Unit tests for query validator and stage allowlist.
- API tests for /analytics/ask auth, ownership, limits, malformed payloads.
- Regression tests for existing analytics endpoints.

### 9.2 Frontend
- Unit tests for ask panel state transitions.
- Component tests for chart adapter mapping.
- Error-state tests (timeout, malformed chart config, empty insights).

### 9.3 E2E
- Ask question -> receive summary -> render chart -> click follow-up -> save session -> reload session.
- Verify no token mismatch issues in ask flow.
- Verify responsive behavior on small viewport widths.

### 9.4 Performance checks
- Measure p50/p95 endpoint latency with representative dataset sizes.
- Validate UI interaction smoothness during repeated ask submissions.

## 10) Skills and Agents from .claude to Use

Recommended skills:
- brainstorming: requirement shaping and trade-off decisions (already activated)
- senior-backend: endpoint contract and validation hardening
- senior-fullstack: end-to-end integration consistency
- e2e-page-validator: browser-level flow and service verification
- qa-test-planner: formal regression test matrix
- documentation-templates: standardized rollout and handoff docs

Recommended agents:
- backend-developer: implement backend agent + route
- frontend-developer: integrate ask panel and chart adapter
- performance-monitor: establish SLOs and observability
- code-reviewer: catch regressions and unsafe query paths
- playwright-tester: verify cross-device flow reliability
- typescript-pro: tighten response typing and adapters
- database-optimization: tune query execution paths if aggregation gets slow

## 11) Execution Timeline (3-4 Days)

Day 1
- Backend schema + agent scaffold + validator
- /analytics/ask route wiring
- Basic unit tests

Day 2
- Frontend analytics service extension
- Ask panel integration in AI Insights tab
- Chart adapter + follow-up query UX

Day 3
- Session persistence mapping
- Error states and retries
- E2E test pass and auth consistency checks

Day 4 (optional hardening)
- Performance tuning and caching
- Observability dashboard updates
- Documentation finalization and release checklist

## 12) Definition of Done

Functional:
- User can ask NL question and get summary + chart + insights + follow-ups.

Reliability:
- No unauthorized data access across users.
- No frontend hard crash on malformed/empty responses.

Performance:
- Endpoint and UI remain within defined budgets.

Maintainability:
- Service-layer auth remains centralized.
- New feature is covered by tests and documented.

## 13) Immediate Next Engineering Tasks

1. Add backend schemas and agent implementation.
2. Add POST /analytics/ask route in analytics_complete.py.
3. Add askData() to analyticsService.
4. Add Ask Your Data panel to AI Insights tab in analytics page.
5. Run targeted backend + frontend + E2E validation.
