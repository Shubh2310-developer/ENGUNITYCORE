# Analytics Page Connected Files Deep Dive

## Scope
This document maps all files and folders connected to the Analytics dashboard route:

- Primary route: `frontend/src/app/(dashboard)/analytics/page.tsx`
- Related route files: upload page, dataset detail page, export-preview helpers
- Frontend service and state dependencies
- Backend API handlers, schemas, services, models, auth, and DB config
- Database tables and storage paths used by analytics features

This analysis follows real import/call paths currently present in the repository.

---

## Selected Full-Stack Agent and Skill Set (from .claude)

### Chosen Agents
- `nextjs-developer`
  - Reason: Route-level Next.js App Router analysis, client routing behavior, dynamic imports.
- `backend-developer`
  - Reason: FastAPI route tracing, service layer flow, auth dependency understanding.
- `database-architect`
  - Reason: SQLAlchemy model/table mapping and schema-level connectedness.
- `ai-engineer`
  - Reason: ML pipeline inspection (`ml_service`, insights generation, chart data preparation).
- `code-reviewer`
  - Reason: Identify mismatches, dead paths, and integration risks.

### Chosen Skills
- `.claude/skills/senior-fullstack/SKILL.md`
  - End-to-end trace from UI -> API -> DB.
- `.claude/skills/senior-backend/SKILL.md`
  - API contract and backend flow validation.
- `.agents/skills/supabase/SKILL.md`
  - Auth/storage integration analysis and environment assumptions.
- `.claude/skills/rag-engineer/SKILL.md` (applied narrowly for data pipeline discipline)
  - Structured data flow and transformation checkpoints.
- `.claude/skills/documentation-templates/SKILL.md`
  - Produce a maintainable architecture artifact.

---

## Folder-Level Connectivity Map

### Frontend folders connected
- `frontend/src/app/(dashboard)/analytics/`
- `frontend/src/app/(dashboard)/analytics/upload/`
- `frontend/src/app/(dashboard)/analytics/[datasetId]/`
- `frontend/src/app/(dashboard)/analytics/export-preview/`
- `frontend/src/app/(dashboard)/` (parent layout)
- `frontend/src/services/`
- `frontend/src/lib/services/`
- `frontend/src/stores/`
- `frontend/src/components/charts/`

### Backend folders connected
- `backend/app/main.py` (router registration)
- `backend/app/api/v1/` (analytics and auth routers)
- `backend/app/services/analytics/` (data + ML engines)
- `backend/app/models/` (ORM entities)
- `backend/app/schemas/` (request/response contracts)
- `backend/app/core/` (DB + environment)
- `backend/app/services/storage/` (Supabase storage utility)
- Runtime storage path created by analytics router:
  - `backend/app/storage/analytics`

### Database and schema assets connected
- PostgreSQL tables via SQLAlchemy models in `backend/app/models/analytics.py`
- SQL migration reference in `backend/alembic_migration_analytics.sql`
- User table linkage via `backend/app/models/user.py`

---

## Primary Route: Frontend Analytics Page

## File: frontend/src/app/(dashboard)/analytics/page.tsx

### Role
Massive client-side orchestrator for:
- Dataset upload/selection
- Data preview and metadata
- Charts and correlations
- SQL/NLQ query workflows
- AI insights and ML predictions
- Session save/restore
- Export actions

### Key setup
- Declares route as client component (`'use client'`)
- Uses dynamic Monaco import for SQL editor
- Uses Recharts primitives and custom chart wrappers
- Pulls typed API client from `@/services/analytics`

### Core architecture responsibilities
- Session recovery from localStorage and API fallback
  - Session restoration logic starts around line ~555+
  - Uses local keys: `analysisData`, `isSessionLoaded`, `currentSessionId`
- Dataset list and upload control
  - `fetchUserDatasets` at line 914
  - `handleFileUpload` at line 943
- Data retrieval pipeline
  - `fetchDataPreview` at line 1013
  - `fetchColumnMetadata` at line 1071
  - `fetchDataSummary` at line 1720
  - `fetchChartsData` at line 1766
  - `fetchAIInsights` at line 1571
- ML prediction trigger
  - `handleGeneratePredictions` at line 1630
- Session persistence
  - `autoUpdateSession` at line 1844
  - `saveAnalysisSession` at line 2007
  - `loadSavedSessions` at line 2088
  - `restoreAnalysisSession` at line 2109
- Export and navigation
  - `navigateToPreview` at line 2258
  - `exportDataset` at line 2309
- Dataset deletion
  - `handleDeleteFile` at line 2355

### Important implementation notes
- Contains both typed service calls (`analyticsService`) and direct `fetch` calls.
- Uses mixed numeric dataset IDs (backend) and string IDs (UI/session), with repeated parsing.
- Implements demo dataset fallback paths for non-numeric IDs.
- Extremely large file (5k+ lines), acting as a combined page, state-manager, and workflow engine.

---

## Related Route Files

## File: frontend/src/app/(dashboard)/analytics/upload/page.tsx

### Role
Dedicated dataset upload screen with drag-drop and format validation.

### Connections
- Calls `analyticsService.uploadDataset(...)`
- Redirects back to `/analytics` after success

### Validation
- Accepts CSV/XLS/XLSX/JSON by MIME + extension
- Basic file and dataset name checks

---

## File: frontend/src/app/(dashboard)/analytics/[datasetId]/page.tsx

### Role
Dataset detail screen for a specific numeric dataset.

### Connections
- `getDataset`
- `getDatasetStatistics`
- `listCharts`
- `listAnalyses`
- `getInsights`
- `createChart`
- `deleteChart`
- `exportDataset`

### Behavior
- Rejects non-numeric dataset IDs with user-facing message
- Uses chart wrappers in `frontend/src/components/charts/*`
- Includes chart creation modal and per-chart rendering switch

---

## Files: frontend/src/app/(dashboard)/analytics/export-preview/*

- `chart-capture-utils.tsx`
- `professional-pdf.tsx`
- `simple-pdf.tsx`

### Role
PDF/report generation helpers, chart capture, and AI-assisted chart descriptions.

### Current connectivity status
- Main analytics page navigates to `/dashboard/analysis/export-preview` (line ~2268+), but no matching route file was found under `frontend/src/app`.
- These helper files exist under analytics export-preview folder but are not directly imported by the main analytics page.

### Risk
- Export-preview route appears mismatched or incomplete.

---

## Styling and Parent Layout

## File: frontend/src/app/(dashboard)/analytics/analytics.module.css

### Role
Scoped CSS module for analytics page visual system.

### Characteristics
- Defines light theme variables and page-specific layout classes.
- Coexists with extensive Tailwind utility classes in the page component.

## File: frontend/src/app/(dashboard)/layout.tsx

### Role
Parent dashboard shell that wraps analytics route.

### Analytics-specific behavior
- Sidebar contains analytics nav entry (`href: '/analytics'`, line 72)
- Conditional header suppression for analytics routes
  - path checks at line 176 and container logic at lines 198/202
- Uses auth state from `useAuthStore` and redirects unauthenticated users to `/login`

---

## Frontend Service and State Dependencies

## File: frontend/src/services/analytics.ts

### Role
Typed HTTP client for analytics APIs.

### Base URL and auth
- API base normalization:
  - `API_URL` line 4
  - `getBaseUrl()` line 7
- Service class and auth header access:
  - `class AnalyticsService` line 279
  - `getAuthHeaders()` line 280
- Auth token source: `useAuthStore.getState().token`

### Endpoint methods (frontend)
- uploadDataset: line 290
- listDatasets: line 312
- getDataset: line 320
- getDatasetData: line 327
- deleteDataset: line 335
- getDatasetStatistics: line 343
- trainRegression: line 352
- trainClassification: line 361
- performClustering: line 370
- createChart: line 381
- listCharts: line 390
- getChart: line 397
- updateChart: line 404
- deleteChart: line 413
- listAnalyses: line 421
- executeQuery: line 443
- cleanDataset: line 457
- getInsights: line 471
- exportDataset: line 478

### Contract notes
- Strong TypeScript interface set for datasets/charts/analysis/query/insights.
- Some methods return broad `any`, which reduces compile-time guarantees.

---

## File: frontend/src/lib/services/analysis-service.ts

### Role
Session persistence API client for analytics sessions.

### Key declarations
- API URL line 19
- `AnalysisSession` interface line 21
- `analysisSessionService` line 50
- `formatAnalysisSessionData` line 112

### Endpoints used
- GET `/analytics/sessions/{id}`
- POST `/analytics/sessions`
- PUT `/analytics/sessions/{id}`
- GET `/analytics/sessions`
- DELETE `/analytics/sessions/{id}`

### Data shape concern
- `dataset_id?: string` in frontend interface vs backend integer semantics.

---

## File: frontend/src/stores/authStore.ts

### Role
Persisted auth state (Zustand) used by analytics service headers.

### Key points
- Store declaration: line 27
- `setAuth`: line 35
- `clearAuth`: line 36
- Persists `token`, `user`, `providerToken` under key `engunity-auth`

### Effect on analytics
- Missing/stale token directly breaks authenticated analytics API calls.

---

## Chart Component Dependencies

## Folder: frontend/src/components/charts/

Files:
- `LineChart.tsx`
- `BarChart.tsx`
- `PieChart.tsx`
- `ScatterPlot.tsx`
- `Heatmap.tsx`
- `AreaChart.tsx`
- `Histogram.tsx`
- `BoxPlot.tsx`
- `index.tsx` (exports all)

### Role
Shared render components used heavily by `[datasetId]/page.tsx` and partially by `analytics/page.tsx`.

### Data contract expectations
- `LineChart`, `BarChart`, `AreaChart`: expect `xKey` + `yKeys`
- `PieChart`: expects `[{name, value}]`
- `ScatterPlot`: numeric x/y points
- `Heatmap`: matrix as `{x,y,value}` tuples
- `Histogram`: pre-binned `{range, count}`
- `BoxPlot`: precomputed `{min,q1,median,q3,max}`

---

## Backend API Entry and Route Wiring

## File: backend/app/main.py

### Role
Registers analytics router in FastAPI app.

### Critical lines
- Imports analytics router from complete implementation: line 22
- Includes router with prefix `/api/v1/analytics`: line 165

This confirms active analytics endpoint surface comes from `analytics_complete.py`.

---

## File: backend/app/api/v1/analytics_complete.py

### Role
Primary backend API for analytics page.

### Endpoint map (backend)
- POST `/datasets/upload` line 42
- GET `/datasets` line 113
- GET `/datasets/{dataset_id}` line 128
- GET `/datasets/{dataset_id}/data` line 146
- DELETE `/datasets/{dataset_id}` line 198
- GET `/datasets/{dataset_id}/statistics` line 228
- POST `/datasets/{dataset_id}/ml/regression` line 272
- POST `/datasets/{dataset_id}/ml/classification` line 339
- POST `/datasets/{dataset_id}/ml/clustering` line 406
- POST `/datasets/{dataset_id}/charts` line 474
- GET `/datasets/{dataset_id}/charts` line 525
- GET `/charts/{chart_id}` line 540
- PUT `/charts/{chart_id}` line 558
- DELETE `/charts/{chart_id}` line 588
- GET `/datasets/{dataset_id}/analyses` line 611
- GET `/analyses/{analysis_id}` line 626
- DELETE `/analyses/{analysis_id}` line 644
- GET `/datasets/{dataset_id}/insights` line 665
- GET `/datasets/{dataset_id}/export` line 708
- POST `/datasets/{dataset_id}/query` line 743
- POST `/datasets/{dataset_id}/clean` line 825
- POST `/sessions` line 933
- GET `/sessions` line 963
- GET `/sessions/{session_id}` line 977
- PUT `/sessions/{session_id}` line 995
- DELETE `/sessions/{session_id}` line 1021

### Runtime behavior highlights
- Uploads are stored locally under `backend/app/storage/analytics`.
- File processing and metadata extraction done immediately in request flow.
- Query execution tries `pandasql`, with simplified fallback for limited SQL patterns.
- Insights produced via internal ML service, not external LLM endpoint.
- Session object stores full analysis state JSON payload.

### Connected but currently underused import
- `storage_service` from Supabase storage is imported but not used in upload/export flows.

---

## File: backend/app/api/v1/analytics.py

### Role
Legacy/alternate analytics endpoint returning aggregate dashboard stats from Postgres + Mongo.

### Connectivity status
- Not the active route source for `/api/v1/analytics` in current app wiring.
- Useful for reference, but not directly used by analytics frontend page flows.

---

## Backend Processing Services

## File: backend/app/services/analytics/data_processor.py

### Role
Data ingestion and transformation engine for analytics API.

### Key functions
- `DataProcessor` class line 9
- `read_file` line 15
- `get_column_info` line 31
- `get_descriptive_statistics` line 47
- `get_correlation_matrix` line 87
- `prepare_chart_data` line 174

### Functionality
- Reads CSV/XLS/XLSX/JSON via pandas
- Computes numeric/categorical summaries
- Generates chart payloads per chart type
- Provides correlation matrix and utility transforms

---

## File: backend/app/services/analytics/ml_service.py

### Role
Training/inference support for regression, classification, clustering, and insights.

### Key functions
- `MLService` class line 22
- `train_regression` line 71
- `train_classification` line 165
- `perform_clustering` line 267
- `generate_insights` line 332

### Functionality
- Preprocesses features, handles categorical encoding
- Uses scikit-learn models
- Returns train/test metrics and feature importance where available
- Generates rule-based correlation/outlier/pattern insights

---

## Backend Models and Schemas

## File: backend/app/models/analytics.py

### Role
SQLAlchemy ORM for analytics domain.

### Entities
- `AnalyticsDataset` line 37 (`analytics_datasets`)
- `AnalyticsAnalysis` line 62 (`analytics_analyses`)
- `AnalyticsChart` line 83 (`analytics_charts`)
- `AnalyticsDashboard` line 104 (`analytics_dashboards`)
- `AnalyticsDashboardWidget` line 121 (`analytics_dashboard_widgets`)
- `AnalyticsSession` line 135 (`analytics_sessions`)

### Notes
- Rich relational mapping back to `users` table.
- Session model stores full JSON snapshots of analysis state.

## File: backend/app/schemas/analytics.py

### Role
Pydantic contracts for request/response validation.

### Key schema classes
- `Dataset` line 56
- `DatasetStatistics` line 81
- `Analysis` line 103
- `Chart` line 135
- `AnalysisSession` line 238
- `RegressionRequest` line 264
- `ClassificationRequest` line 271
- `ClusteringRequest` line 278
- `ExportFormat` enum line 290

---

## Auth and Identity Dependencies

## File: backend/app/api/v1/auth.py

### Role
Supabase-backed auth endpoints and bearer token user resolution.

### Key integrations
- `get_current_user` line 203
  - Validates bearer token against Supabase user API
  - Upserts user profile into Mongo
  - Upserts/ensures user row in Postgres and rewrites `current_user.id` to DB row id
- Login endpoint line 291
- Me endpoint line 321

### Why this is critical for analytics
- Analytics endpoints depend on `current_user.id` for all user-scoped queries and row ownership.

## File: backend/app/models/user.py

### Role
User table and reverse relationships.

### Analytics relationships
- `analytics_datasets`
- `analytics_analyses`
- `analytics_charts`
- `analytics_dashboards`
- `analytics_sessions`

---

## Database and Environment Dependencies

## File: backend/app/core/database.py

### Role
SQLAlchemy engine + session factory.

### Key lines
- Engine initialization line 5
- `SessionLocal` line 15
- `get_db()` dependency line 39

## File: backend/app/core/config.py

### Role
Environment config used by analytics + auth + storage.

### Key variables for this flow
- `DATABASE_URL` line 13
- `SUPABASE_URL` line 16
- `REDIS_URL` line 33
- `MONGODB_URL` line 36

## File: backend/app/services/storage/supabase.py

### Role
Supabase storage utility service.

### Key lines
- `SupabaseStorage` class line 8
- upload helper line 29
- signed URL helper line 48
- singleton `storage_service` line 100

### Current state in analytics flow
- Available for storage use, but analytics upload in `analytics_complete.py` currently writes to local filesystem.

---

## SQL Migration / Table Definitions

## File: backend/alembic_migration_analytics.sql

### Role
SQL script to create analytics tables.

### Includes
- `analytics_datasets`
- `analytics_analyses`
- `analytics_charts`
- `analytics_dashboards`
- `analytics_dashboard_widgets`

### Important mismatch
- `analytics_sessions` model exists in SQLAlchemy (`backend/app/models/analytics.py`) and API endpoints exist in `analytics_complete.py`, but this SQL file does not create `analytics_sessions`.
- This indicates schema drift risk if this SQL script is used as source-of-truth migration.

---

## End-to-End Data Flow (Primary)

1. User loads analytics page.
2. Page checks/restores local session snapshot and optional server session.
3. Page calls `analyticsService.listDatasets()`.
4. Dataset selected/uploaded -> backend `POST /datasets/upload`.
5. Backend reads file via `data_processor.read_file`, computes metadata, writes local file path.
6. Frontend loads preview, metadata, stats, charts, insights via service methods.
7. ML operations call regression/classification endpoints and display returned metrics.
8. Chart creation stores chart rows in `analytics_charts` and returns chart payload.
9. Session save/update endpoints persist full dashboard state snapshot in `analytics_sessions`.
10. Export endpoint returns a download URL payload.

---

## Connected API Surface Matrix

### Frontend method -> Backend route
- `uploadDataset` -> `POST /api/v1/analytics/datasets/upload`
- `listDatasets` -> `GET /api/v1/analytics/datasets`
- `getDataset` -> `GET /api/v1/analytics/datasets/{id}`
- `getDatasetData` -> `GET /api/v1/analytics/datasets/{id}/data`
- `deleteDataset` -> `DELETE /api/v1/analytics/datasets/{id}`
- `getDatasetStatistics` -> `GET /api/v1/analytics/datasets/{id}/statistics`
- `trainRegression` -> `POST /api/v1/analytics/datasets/{id}/ml/regression`
- `trainClassification` -> `POST /api/v1/analytics/datasets/{id}/ml/classification`
- `performClustering` -> `POST /api/v1/analytics/datasets/{id}/ml/clustering`
- `createChart` -> `POST /api/v1/analytics/datasets/{id}/charts`
- `listCharts` -> `GET /api/v1/analytics/datasets/{id}/charts`
- `listAnalyses` -> `GET /api/v1/analytics/datasets/{id}/analyses`
- `getInsights` -> `GET /api/v1/analytics/datasets/{id}/insights`
- `exportDataset` -> `GET /api/v1/analytics/datasets/{id}/export`
- `executeQuery` -> `POST /api/v1/analytics/datasets/{id}/query`
- `cleanDataset` -> `POST /api/v1/analytics/datasets/{id}/clean`
- Session service endpoints map to `/api/v1/analytics/sessions*`

---

## Integration Risks and Gaps Found

- Export preview navigation mismatch:
  - Main page routes to `/dashboard/analysis/export-preview`, but corresponding Next.js route file was not found under `frontend/src/app`.
- Data contract inconsistency for `dataset_id`:
  - Frontend session interface treats it as string/nullable patterns; backend expects integer semantics.
- Schema drift risk:
  - SQL migration script omits `analytics_sessions` table despite model and API usage.
- Mixed API call style:
  - Main page uses both `analyticsService` and direct `fetch`; this can cause auth/header inconsistency.
- Storage architecture split:
  - Supabase storage service exists, but active analytics upload path currently uses local disk.

---

## Dependencies Snapshot

### Frontend package dependencies used by this route family
- `@monaco-editor/react`
- `axios`
- `framer-motion`
- `recharts`
- `lucide-react`
- `zustand`
- `groq-sdk`
- `jspdf`, `jspdf-autotable`, `html2canvas`

### Backend package dependencies used by analytics stack
- `sqlalchemy`
- `pandas`
- `numpy`
- `scikit-learn`
- `openpyxl`
- `xlrd`
- `supabase`

---

## Final Connected File List (Consolidated)

### Frontend
- `frontend/src/app/(dashboard)/analytics/page.tsx`
- `frontend/src/app/(dashboard)/analytics/analytics.module.css`
- `frontend/src/app/(dashboard)/analytics/upload/page.tsx`
- `frontend/src/app/(dashboard)/analytics/[datasetId]/page.tsx`
- `frontend/src/app/(dashboard)/analytics/export-preview/chart-capture-utils.tsx`
- `frontend/src/app/(dashboard)/analytics/export-preview/professional-pdf.tsx`
- `frontend/src/app/(dashboard)/analytics/export-preview/simple-pdf.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/services/analytics.ts`
- `frontend/src/lib/services/analysis-service.ts`
- `frontend/src/stores/authStore.ts`
- `frontend/src/components/charts/index.tsx`
- `frontend/src/components/charts/LineChart.tsx`
- `frontend/src/components/charts/BarChart.tsx`
- `frontend/src/components/charts/PieChart.tsx`
- `frontend/src/components/charts/ScatterPlot.tsx`
- `frontend/src/components/charts/Heatmap.tsx`
- `frontend/src/components/charts/AreaChart.tsx`
- `frontend/src/components/charts/Histogram.tsx`
- `frontend/src/components/charts/BoxPlot.tsx`
- `frontend/package.json`

### Backend
- `backend/app/main.py`
- `backend/app/api/v1/analytics_complete.py`
- `backend/app/api/v1/analytics.py` (legacy/non-active for route wiring)
- `backend/app/api/v1/auth.py`
- `backend/app/schemas/analytics.py`
- `backend/app/models/analytics.py`
- `backend/app/models/user.py`
- `backend/app/services/analytics/data_processor.py`
- `backend/app/services/analytics/ml_service.py`
- `backend/app/services/storage/supabase.py`
- `backend/app/core/database.py`
- `backend/app/core/config.py`
- `backend/requirements.txt`

### Database / Schema Artifacts
- `backend/alembic_migration_analytics.sql`
- Runtime directory: `backend/app/storage/analytics` (created by backend route at startup)

---

## Practical Recommendation Summary

- Split `frontend/src/app/(dashboard)/analytics/page.tsx` into feature modules (upload, query, charts, sessions, export, AI insights).
- Unify export-preview routing with actual route files and wire existing export-preview components.
- Normalize `dataset_id` type contracts across frontend session service and backend schemas.
- Replace direct `fetch` usage in page with `analyticsService` wrappers for consistency.
- Decide and document canonical storage target (local disk vs Supabase) for analytics files.
- Align migration SQL with ORM models, including `analytics_sessions`.
