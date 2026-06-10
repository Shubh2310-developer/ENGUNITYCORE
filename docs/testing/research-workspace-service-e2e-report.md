# Research Workspace – Service-Level E2E Validation Report

| Field | Value |
|---|---|
| **Date** | 2026-06-06 |
| **Environment** | Frontend: `http://localhost:3000` · Backend: `http://localhost:8000` |
| **Auth Provider** | Supabase (hosted) |
| **Testing Mode** | Playwright + direct curl – **no mocks** |
| **Test Spec** | `frontend/e2e/research/research-workspace-real-service.spec.ts` |
| **Playwright Version** | 1.58.1 |
| **Backend Framework** | FastAPI / Uvicorn |
| **Final Status** | ✅ **7/7 tests passing** |

---

## 1. Scope

This report documents a **real-service** end-to-end validation of the Research Workspace
feature. All tests run against live services on `localhost:3000` (Next.js) and
`localhost:8000` (FastAPI) with real Supabase authentication. No mocks or stubs.

---

## 2. Defects Found and Fixed

### DEF-01 · Browser SSE Stream Returns 403

| | |
|---|---|
| **Severity** | Critical |
| **Status** | ✅ Fixed |
| **File** | `frontend/src/components/research/DeepResearchPanel.tsx` |

**Root Cause:** The component called `localStorage.getItem('token')` which always returns
`null` because the Supabase JWT is persisted under the `engunity-auth` key by the Zustand
store, not a bare `token` key. Additionally, the token was captured in a stale `useCallback`
closure before Zustand hydration completed.

**Fix:**
- Import `useAuthStore` and subscribe to `state.token` and `state._hasHydrated`.
- Read the live token inside `handleResearch` via `useAuthStore.getState().token` to
  guarantee the latest value at call-time (avoids stale closure).
- Guard the "Start Research" button with `disabled={!_hasHydrated || !token}` so it cannot
  fire until auth is ready.

---

### DEF-02 · Workspace Endpoints Return 404

| | |
|---|---|
| **Severity** | Critical |
| **Status** | ✅ Fixed |
| **File** | `backend/app/main.py` |

**Root Cause:** `backend/app/api/v1/workspace.py` was fully implemented but never imported
or registered in `main.py`.

**Fix:**
```python
from app.api.v1.workspace import router as workspace_router
# ...
app.include_router(workspace_router, prefix=f"{settings.API_V1_STR}/research", tags=["workspace"])
```

**Verified with curl (authenticated):**
```
GET /api/v1/research/workspace/sources      → 200
GET /api/v1/research/workspace/clusters     → 200
GET /api/v1/research/workspace/graph-nodes  → 200
POST /api/v1/research/workspace/tool-invoke → 200
```

---

### DEF-03 · Share Overlay Intercepts Pointer Events When Closed

| | |
|---|---|
| **Severity** | High |
| **Status** | ✅ Fixed |
| **Files** | `research.module.css`, `page.tsx` |

**Root Cause:** The `.shareOverlay` CSS class had no `pointer-events` guard. A CSS
animation teardown or React reconciliation delay could leave the overlay element briefly
mounted and blocking clicks on tool cards. Additionally, both modal `<div>` elements lacked
a companion class to explicitly opt-in to pointer events only when active.

**Fix:**
- Added `pointer-events: none` to the base `.shareOverlay` CSS rule.
- Added `.shareOverlayOpen { pointer-events: auto; }` companion class.
- Both modal overlay `<div>` elements in `page.tsx` now use
  `className="${styles.shareOverlay} ${styles.shareOverlayOpen}"` when mounted.
- Added `aria-label="Close"` to both modal close buttons (accessibility + test stability).

---

### DEF-04 · Unsafe `dangerouslySetInnerHTML` in Markdown Renderer

| | |
|---|---|
| **Severity** | High (XSS) |
| **Status** | ✅ Fixed |
| **File** | `frontend/src/components/research/DeepResearchPanel.tsx` |

**Root Cause:** The `renderMarkdown()` function used hand-rolled regex replacements and
`dangerouslySetInnerHTML`, which is unsafe for user-controlled or AI-generated content.

**Fix:** Removed `renderMarkdown()` entirely. Replaced with `react-markdown` +
`remark-gfm` (both already present in `package.json`):

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>{f.full_report}</ReactMarkdown>
```

---

## 3. Test Results

### Static Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 warnings |
| `npm run test -- --run` | ✅ 102/102 Vitest unit tests pass |

### Playwright Real-Service E2E (Chromium)

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
| TC-05 | Deep Research streaming calls SSE endpoint | ✅ Pass | 39.3s |
| TC-06 | Analysis tool cards open modals | ✅ Pass | 20.0s |
| TC-07 | Research page is usable at 375px mobile width | ✅ Pass | 8.2s |

**7 passed · 0 failed · Total 41.6s**

### Backend Endpoint Verification (curl with real JWT)

```
GET  /api/v1/research/workspace/sources      → 200 ✅
GET  /api/v1/research/workspace/clusters     → 200 ✅
GET  /api/v1/research/workspace/graph-nodes  → 200 ✅
POST /api/v1/research/workspace/tool-invoke  → 200 ✅
GET  /api/v1/research/workspace/sources      → 403 (no token) ✅ expected
POST /api/v1/research/deep-research/stream   → 200 (with JWT) ✅
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/research/DeepResearchPanel.tsx` | DEF-01: `useAuthStore.getState().token`; `_hasHydrated` guard; DEF-04: `react-markdown`; `data-testid="research-complete"` |
| `backend/app/main.py` | DEF-02: Import and register `workspace_router` under `/api/v1/research` |
| `frontend/src/app/(dashboard)/research/research.module.css` | DEF-03: `pointer-events: none` base + `.shareOverlayOpen` companion |
| `frontend/src/app/(dashboard)/research/page.tsx` | DEF-03: Both overlays use `shareOverlayOpen`; `aria-label="Close"` on close buttons |
| `frontend/e2e/research/research-workspace-real-service.spec.ts` | `data-testid` as primary completion cue; `[aria-label="Close"]` close selector |

---

## 5. No Docker Dependency

All verification was performed without Docker:
- Backend: FastAPI/Uvicorn running directly on `http://localhost:8000`
- Frontend: Next.js dev server on `http://localhost:3000`
- Confirmed: `curl http://localhost:8000/health` → `{"status":"healthy"}`

---

## 6. Residual Risks

| Risk | Severity | Notes |
|---|---|---|
| Static demo data in workspace endpoints | Low | `sources`, `clusters`, `graph-nodes` return mock seed data; production would need real persistence |
| `tool-invoke` enum mismatch between frontend and backend | Low | Frontend uses `gap_detector` key but backend expects `gap`; currently bridged in the service layer |
| Horizontal overflow on mobile | Info | TC-07 reports no overflow; ongoing regression risk with new CSS additions |
| No credentials in source code | ✅ Confirmed | Credentials passed only as env vars; not committed |
