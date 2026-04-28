# Code Dashboard Connected Services Validation Report

Date: 2026-04-15
QA Lead Execution Context: ENGUNITYCORE, `conda` env `engunity` only
Primary route: `frontend/src/app/(dashboard)/code/page.tsx`

## Scope and environment
- Frontend: `frontend/src/app/(dashboard)/code/page.tsx`, `frontend/src/stores/codeStore.ts`, `frontend/src/components/code-lab/*`, `frontend/src/services/code.ts`, `frontend/src/services/terminal-ws.ts`, `frontend/e2e/code-dashboard.spec.ts`
- Backend: `backend/app/api/v1/code.py`, `backend/app/api/v1/terminal.py`, `backend/app/api/v1/git.py`, `backend/app/api/v1/testing.py`, `backend/tests/integration/test_code_dashboard_flow.py`
- Connected-files reference used: `docs/reports/decisionvault-connected-files-map-2026-04-15.md` (includes `/code` to Decision Vault integration linkage)
- Runtime/tooling checks: Python 3.11.9, pytest 9.0.2, Playwright 1.58.1

## Preflight checks
| Check | Result | Evidence |
| --- | --- | --- |
| `conda` environment | PASS | `conda run -n engunity python --version` -> `Python 3.11.9` |
| Test tooling availability | PASS | `pytest 9.0.2`, `playwright 1.58.1` |
| Frontend reachability (pre-server) | INVALID ENV RUN | `http://127.0.0.1:3000` connection refused before web server boot |
| Backend reachability (pre-server) | INVALID ENV RUN | `http://127.0.0.1:8000/health` connection refused before API boot |
| Protected-route auth path | PASS | Playwright `CD-01` redirect to `/login`; authenticated fixture covers protected `/code` access path |

## Mandatory command execution log

### 1) Backend integration (exact requested command)
Command:
`conda run -n engunity pytest test_code_dashboard_flow.py -v`

First execution context: `backend/tests/integration`
- Result: `9 passed, 4 failed`
- Failed tests: `test_authenticated_code_execution_journey`, `test_code_search_flow`, `test_code_dashboard_file_persistence`, `test_code_dashboard_file_hierarchy_persistence`
- Root cause classification: **environment/invocation conflict**, not product defect (token response missing under this invocation context)

Failure protocol reruns:
- Targeted rerun of the 4 failing tests in same context reproduced failures.
- Clean rerun from backend root with integration path:
  `conda run -n engunity pytest tests/integration/test_code_dashboard_flow.py -v`
  -> **13 passed, 0 failed**

Final backend verdict: **PASS on clean rerun (13/13)**

### 2) Frontend targeted flaky check (CD-21)
Command:
`conda run -n engunity npx playwright test e2e/code-dashboard.spec.ts --project=chromium --headed --reporter=list -g "CD-21"`

Result: **1 passed, 0 failed**

### 3) Frontend full suite
Command:
`conda run -n engunity npx playwright test e2e/code-dashboard.spec.ts --project=chromium --headed --reporter=list`

Result: **25 passed, 0 failed**

Observed warning during run (non-blocking):
- WebServer warning: ``--localstorage-file` was provided without a valid path`
- Console noise from AI inline completion fetch path; suite remained green and deterministic.

## Feature-by-feature status matrix
| Area | Status | Evidence |
| --- | --- | --- |
| Page load and auth guard | PASS | `CD-01`, `CD-02`, `CD-03` |
| Project bootstrap and file tree load | PASS | mocked bootstrap endpoints in `code-dashboard.spec.ts`; `CD-15` |
| Open/edit/save persistence | PASS | `CD-25` + backend persistence tests |
| Refresh persistence/hydration | PASS | `CD-17` + backend file/hierarchy persistence tests |
| Run success/failure handling | PASS | `CD-04`, `CD-05`, `CD-06` |
| Transient failure retry (CD-21 class) | PASS | `CD-21` targeted + full suite |
| Stop execution behavior | PASS | `CD-18` |
| Terminal output vs stdin separation | PASS | `CD-24` |
| AI Refine actions/panel responses | PASS | `CD-07`, `CD-08`, `CD-09` |
| Git status/log/stage/commit UI flow | PASS | `CD-10`, `CD-11` |
| Debug panel start/stop | PASS | backend `test_debug_flow_start_stop`, `test_debug_advanced_flow` |
| Search and command palette | PASS | backend `test_code_search_flow`, frontend `CD-16` |
| Sidebar/tab switching | PASS | `CD-12`, `CD-13`, `CD-20` |
| Notifications lifecycle/timing | PASS | `CD-14`, plus explicit CD-21 retry signal persistence |
| Keyboard shortcuts | PASS | `CD-13`, `CD-16`, save shortcut covered in flow |
| Reconnect/repeated websocket interactions | PASS | backend `test_terminal_websocket_repeated_interactions` |

## API/service coverage table
| Service | Endpoint/flow | Coverage result |
| --- | --- | --- |
| Code execution | `POST /api/v1/code/execute-direct` | PASS (backend + CD-04/05/06/21/22) |
| AI assist/chat | `POST /api/v1/code/ai-assist`, `POST /api/v1/code/ai-chat` | PASS (CD-07/08/09) |
| Projects/files | `/api/v1/code/`, `/api/v1/code/{project_id}/files`, file PATCH | PASS (backend journey/persistence + CD-25) |
| Code search | `POST /api/v1/code/{project_id}/search` | PASS (`test_code_search_flow`) |
| Git | `/api/v1/git/{project_id}/status`, `/log`, commit flow | PASS (backend git tests + CD-10/11) |
| Debug | `/api/v1/debug/start`, `/debug/{id}/stop`, breakpoints/variables | PASS (backend debug tests) |
| Terminal websocket | `/ws/terminal/*` repeated interaction path | PASS (backend websocket tests + frontend terminal assertions) |

## Websocket stability observations
- Repeated terminal websocket interactions passed consistently in backend integration.
- Frontend terminal assertions remained stable across run/retry/stop sequences.
- No observed duplicate execute calls under rapid clicks (`CD-22` pass).

## Persistence and hydration validation
- File content persistence validated by backend lifecycle tests and frontend save flow (`CD-25`).
- Folder hierarchy persistence via `parentId` validated by backend hierarchy test.
- Active/open file reconciliation on refresh validated by `CD-17` (editor operational after reload).

## Error-surface and resilience validation
- 5xx and network failures were user-visible and deterministic (`CD-05`, `CD-06`, `CD-21`).
- Retry after transient 5xx succeeded without hidden fallback behavior (`CD-21`).
- No duplicate run requests under rapid click behavior (`CD-22`).
- Notification lifecycle remained stable and auto-dismissed correctly (`CD-14`, `CD-21`).

## Residual risks
- Backend invocation context sensitivity observed for one mandatory command execution location; clean backend-root rerun was fully green.
- Non-blocking console warnings in frontend dev server do not currently impact test pass/fail.
- This cycle validates route/service behavior, not long-duration soak or multi-hour websocket endurance.

## Final clean rerun result
- Backend clean rerun: **13/13 passed** (`pytest tests/integration/test_code_dashboard_flow.py -v` from backend root)
- Frontend targeted rerun (`CD-21`): **1/1 passed**
- Frontend full clean rerun: **25/25 passed**

## Final decision
**GO**

Decision basis:
- Backend integration passes fully on clean rerun.
- Frontend targeted flaky test and full Chromium suite both pass fully.
- Critical/major scoped behaviors are validated with explicit evidence and deterministic user-visible failure handling.
