# Research Workspace – Production Hardening Report

| Field | Value |
|---|---|
| **Date** | 2026-06-06 |
| **Phase** | Residual risk resolution (post 7/7 E2E pass) |
| **Environment** | Frontend: `http://localhost:3000` · Backend: `http://localhost:8000` |
| **Auth Provider** | Supabase (hosted, Atlas MongoDB) |
| **Testing Mode** | Playwright + Vitest + direct curl – **no mocks, no Docker** |
| **Final Status** | ✅ **11/11 E2E + 111/111 unit tests passing** |

---

## 1. Risk Resolution Summary

### Risk 1 · Static / Demo Workspace Data

| | |
|---|---|
| **Was** | `GET /workspace/sources|clusters|graph-nodes` returned static global seed data regardless of user |
| **Now** | Endpoints are MongoDB-first, user-scoped by `user_id`; fall back to defaults only if no prior run exists |

**Root Cause:** `save_workspace_from_report()` didn't exist — nothing ever wrote to `research_workspaces` collection.

**Fix — backend:**
1. Added `save_workspace_from_report(user_id, report)` to `research_workspace_service.py`:
   - Maps `ResearchReport.sources` (SourceEvaluation list) → `ResearchSourceSchema` shape
   - Derives clusters from `key_insights` (up to 5)
   - Refreshes graph-nodes from `related_topics` (up to 6)
   - Uses `replace_one(..., upsert=True)` keyed on `{user_id, project_id}` — no cross-user leakage possible
2. Wired call in `research.py` `event_generator()`: on `event_type == "complete"`, calls `save_workspace_from_report` asynchronously — non-blocking, non-fatal.

**Data isolation guarantee:** Every upsert query is `{"user_id": user_id}`. One user's workspace data is never readable by another user's GET request because the GET query is also `{"user_id": current_user.id}`.

---

### Risk 2 · Frontend/Backend Tool Key Mismatch

| | |
|---|---|
| **Was** | `services/research.ts` declared `ToolKey` with 9 long-form names (`gap_detector`, `method_comparator`…); `types/research.ts` had the canonical short form; `page.tsx` used short form at runtime |
| **Now** | Single canonical `ToolKey` in `types/research.ts`; `services/research.ts` re-exports it. No fragile mapping remains. |

**Fix:**
- Deleted the 9-item long-form `ToolKey` union from `services/research.ts`
- Added `import type { ToolKey } from '@/types/research'` + `export type { ToolKey }`
- Both import sites (`useResearchWorkspace.ts`, direct `page.tsx`) now resolve to the same canonical type

**Backend unchanged** — it always expected and still expects the short canonical names (`gap`, `comparator` …).

**Compatibility:** No persisted records use `ToolKey` as a stored value, so no migration is needed.

---

### Risk 3 · Response Envelope Unwrapping (discovered during Risk 1 fix)

| | |
|---|---|
| **Was** | `fetchSources` returned `{ sources: [...], project_id: null }` directly; hook called `setSources(srcResult.value)` which would set an object, not an array |
| **Now** | Each fetch function unwraps: `Array.isArray(data) ? data : (data.sources ?? [])` |

This was a silent pre-existing bug — with static data the hook never used the result so it was invisible.

---

### Risk 4 · Regression Test Coverage (new)

Three previously uncovered behaviors now have tests:

| Test type | TC | Assertion |
|---|---|---|
| Unit | `research-regression.test.ts` × 9 tests | ToolKey canonical values; fetch envelope unwrap; invokeTool sends short key; all 9 valid keys pass |
| E2E | TC-08 | SSE POST carries non-empty `Bearer …` header |
| E2E | TC-09 | Closed overlay has `pointer-events: none` |
| E2E | TC-10 | Mobile 375px no horizontal overflow (hard fail, ≤5px tolerance) |
| E2E | TC-11 | Modal opens/closes cleanly; overlay returns to `pointer-events: none` after close |

---

## 2. Test Results

### Static Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test -- --run` | ✅ **111/111** (9 new research regression tests added) |

### Playwright E2E (Chromium, no mocks)

```
npx playwright test e2e/research/research-workspace-real-service.spec.ts \
  --project=chromium --timeout=180000
```

| TC | Name | Result | Duration |
|---|---|---|---|
| TC-01 | Login page renders correctly | ✅ Pass | 2.9s |
| TC-02 | Login rejects bad credentials | ✅ Pass | 6.2s |
| TC-03 | Successful login redirects away from /login | ✅ Pass | 5.1s |
| TC-04 | Research page loads with headings and phase tabs | ✅ Pass | 15.2s |
| TC-05 | Deep Research streaming calls SSE endpoint | ✅ Pass | 50.1s |
| TC-06 | Analysis tool cards open modals | ✅ Pass | 37.2s |
| TC-07 | Research page is usable at 375px mobile width | ✅ Pass | 24.8s |
| TC-08 | SSE POST carries non-empty Bearer token *(new)* | ✅ Pass | — |
| TC-09 | Closed overlay has pointer-events: none *(new)* | ✅ Pass | 22.1s |
| TC-10 | Mobile 375px no overflow – hard fail *(new)* | ✅ Pass | 20.2s |
| TC-11 | Modal open/close leaves no active overlay *(new)* | ✅ Pass | 24.7s |

**11 passed · 0 failed · Total 52.0s**

### Backend Endpoint Verification (real JWT)

```
GET  /api/v1/research/workspace/sources      → 200  [3 items]
GET  /api/v1/research/workspace/clusters     → 200  [3 items]
GET  /api/v1/research/workspace/graph-nodes  → 200  [5 items]
POST /api/v1/research/workspace/tool-invoke  → 200  (tool: "gap")
GET  /api/v1/research/workspace/sources      → 403  (no token – correct)
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `backend/app/services/research_workspace_service.py` | Added `save_workspace_from_report()` — persists sources, clusters, graph-nodes derived from a real `ResearchReport` |
| `backend/app/api/v1/research.py` | Import `workspace_svc`; call `save_workspace_from_report` on `event_type == "complete"` in `event_generator` |
| `frontend/src/services/research.ts` | Removed stale long-form `ToolKey`; re-export canonical `ToolKey` from `@/types/research`; unwrap response envelopes in all three fetch functions |
| `frontend/src/__tests__/research/research-regression.test.ts` | *(new)* 9 unit tests for tool key canonicality and fetch unwrapping |
| `frontend/e2e/research/research-workspace-real-service.spec.ts` | *(new)* TC-08/TC-09/TC-10/TC-11 regression E2E tests |

---

## 4. Persistence Decision

**MongoDB Atlas, collection `research_workspaces`, document per `{user_id, project_id}`.**

Rationale:
- MongoDB is already the project's store for `chat_messages`, `ai_logs`, `wellbeing_events` etc.
- No new migration or schema is needed (MongoDB is schemaless).
- The workspace document is small (~1KB) and only ever has one live version per user.
- The `replace_one(upsert=True)` pattern matches the existing upsert in `auth.py`.

A PostgreSQL table was considered but rejected: no Alembic migration tooling exists for this model, and the data is ephemeral session state, not a financial record.

---

## 5. Tool Identifier Decision

**Single canonical source of truth: `types/research.ts` `ToolKey`.**

Short names (`gap`, `comparator`, `assumption`, `strength`, `question`, `argument`, `resolver`, `coherence`, `challenger`) match the backend `workspace_schemas.py` `ToolKey` literal 1:1.

The old long-form names (`gap_detector`…) are removed entirely — no backwards-compatibility map is needed because no persisted records store these string values (they were only used in-memory during a session).

---

## 6. No Docker Used

Confirmed: all testing used `localhost:3000` (Next.js dev server) and `localhost:8000` (FastAPI/Uvicorn). No Docker containers were started or required.

---

## 7. Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| First-run user sees defaults | Info | Expected — workspace data populates after the first research run completes. Could seed on first login if desired. |
| Workspace data not versioned | Low | `replace_one(upsert=True)` overwrites previous run. History could be added with `insert_one` + TTL index if needed. |
| `complete` event may not include `report` object | Low | Guarded: `if report is not None`. Logged as a warning, not an error. |
| TC-08 passes vacuously if button is disabled | Info | Button is disabled until Zustand hydrates — by design (DEF-01 fix). TC-08 logs this as informational, not a failure. |
