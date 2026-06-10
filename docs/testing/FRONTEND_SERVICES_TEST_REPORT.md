# Frontend Services — Test Report

## Overview
This report documents the verification of the Next.js frontend API client services (`frontend/src/services/`) of ENGUNITYCORE. Testing focused on request formatting, authentication header injection, error handling, SSE (Server-Sent Events) streaming pipelines, and resilience against connection failures.

## Files Tested
- `frontend/src/services/config.ts` — API base configuration.
- `frontend/src/services/auth.ts` — Supabase integration and standard authentication flows.
- `frontend/src/services/chat.ts` — Multi-agent chat history and SSE message streaming.
- `frontend/src/services/code.ts` — Monaco workspace files and sandboxed code execution endpoints.
- `frontend/src/services/research.ts` — Academic graph retrieval and structured citation management.
- `frontend/src/services/overview.ts` — Dashboard-wide signals aggregation with partial failure tolerance.
- `frontend/src/services/analytics.ts` — Dataset CRUD and Recharts analysis visualization helpers.
- `frontend/src/services/document.ts` — Markdown upload and AI-enhanced text operations.
- `frontend/src/services/decision.ts` — Kanban status sync and workspace scan triggers.
- `frontend/src/services/jobprep.ts` — Readiness score, skills matrix, and interview simulations.
- `frontend/src/services/wellbeing.ts` — Daily wellbeing status check and metrics logging.
- `frontend/src/services/image.ts` — Binary upload, batch deletion, and OCR/Vision API routing.
- `frontend/src/services/git.ts` — Sandboxed Git repo initialization, diffing, and staging.
- `frontend/src/services/omniRag.ts` — Vector search queries, streaming RAG answers, and TurboQuant toggles.
- `frontend/src/services/terminal-ws.ts` — WebSocket manager wrapping xterm.js terminals.
- `frontend/src/services/export.ts` & `export-templates.ts` — Document exports (PDF/Markdown) and templates.

---

## Test Results Summary

| Service | Status | Auth Header Injection | SSE Streaming | Error / Network Handling | Verification Type |
|---------|--------|-----------------------|---------------|--------------------------|-------------------|
| `config` | ✅ PASS | N/A | N/A | Local env fallback validation | Dev verify |
| `auth` | ✅ PASS | N/A | N/A | Handles network offline / bad credentials | Vitest & E2E |
| `chat` | ✅ PASS | Yes | ✅ Yes (SSE) | Aborts stream on cancellation, catches SSE errors | Vitest & E2E |
| `code` | ✅ PASS | Yes | N/A | Propagates compilation / runtime exception details | Playwright E2E |
| `research` | ✅ PASS | Yes | ✅ Yes (SSE) | Defaults to offline mock graph on connection fail | Vitest & E2E |
| `overview` | ✅ PASS | Yes | N/A | Tolerates partial module failure, handles empty states| Vitest & E2E |
| `analytics` | ✅ PASS | Yes | N/A | Rejects file sizes > 10MB, parses server errors | Playwright E2E |
| `document` | ✅ PASS | Yes | N/A | Handles large form data uploads | Playwright E2E |
| `decision` | ✅ PASS | Yes | N/A | Gracefully maps backend decision flags | Playwright E2E |
| `jobprep` | ✅ PASS | Yes | N/A | Catches and displays simulation validation errors | Playwright E2E |
| `wellbeing` | ✅ PASS | Yes | N/A | Silently fails or logs error during background post | Manual verify |
| `image` | ✅ PASS | Yes | N/A | Validates image extensions and dimensions | Vitest |
| `git` | ✅ PASS | Yes | N/A | Returns structured terminal feedback on commit fail | Playwright E2E |
| `omniRag` | ✅ PASS | Yes | ✅ Yes (SSE) | Catches semantic search database exceptions | Vitest |
| `terminal-ws`| ✅ PASS | Yes (query param) | ✅ WS stream | Implements exponential backoff auto-reconnect | Playwright E2E |
| `export` | ✅ PASS | Yes | N/A | Safe rendering limits for PDF page numbers | Playwright E2E |

---

## Detailed Findings

### 1. Authentication & API Client Configs (`auth.ts`, `config.ts`)
- **API URL Base:** `config.ts` safely parses `process.env.NEXT_PUBLIC_API_URL` and defaults to `http://localhost:8000`. `auth.ts` wraps this path to ensure `/api/v1` suffix matching is correct.
- **Login & Registration:** Formulates standard `x-www-form-urlencoded` headers for OAuth2-compatible token endpoints (`/auth/login`) and JSON payloads for registration.
- **OAuth Integrations:** Supabase helper is imported dynamically to enable GitHub redirection scopes (`repo read:user`).

### 2. Stream-Based Conversation (`chat.ts`, `omniRag.ts`, `research.ts`)
- **EventSource/SSE Implementation:** The chat service leverages custom fetch-based SSE parsers to stream data chunks. It supports injecting `Authorization` bearer headers which native `EventSource` lacks.
- **Stream Interruption:** Verified that client abort controllers successfully terminate active backend stream handlers, avoiding orphan server tasks.

### 3. Sandboxed Operations (`code.ts`, `git.ts`, `terminal-ws.ts`)
- **Execution Lifecycle:** API parameters cleanly specify target paths and arguments. Execution output separates `stdout`, `stderr`, and `exit_code` returned from Python's sandboxed processes.
- **Terminal WebSockets:** Socket connections include backoff-reconnection loops. Message typing uses JSON frames for scaling viewport changes (dimensions update terminal PTY dimensions).

---

## Security Findings
| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Token Exposure | Low | `auth.ts` | Bearer token logged in dev console when `process.env.NODE_ENV === 'development'`. Ensure console logs are stripped during final Webpack/Next.js production compile. |

---

## Bugs & Issues Found
| Severity | Component | Description | Steps to Reproduce | Suggested Fix |
|----------|-----------|-------------|-------------------|---------------|
| Minor | `terminal-ws.ts` | Reconnect attempts loop indefinitely if backend is fully offline. | Shut down backend, open terminal tab, wait 5 min. | Limit total reconnection attempts to 10 before throwing an error toast. |

---

## Recommendations
1. **Centralize Fetch Wrapper:** Create a unified `apiClient` utility class extending `fetch` to automatically attach auth tokens, handle token refresh, and implement a global timeout policy.
2. **Compress SSE Payload:** Configure compression (gzip/brotli) on Server-Sent Events to optimize bandwidth during extensive citation graph streams.
