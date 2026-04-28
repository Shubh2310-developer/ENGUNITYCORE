# Code Page Chrome E2E: Agent + Skill + Full Stack Coverage

This file activates the Code Page testing strategy for:
- frontend route: frontend/src/app/(dashboard)/code
- backend services: code, debug, git, testing, terminal
- database entities: code_projects and code_files

## Activated Organizer Result

The agent-organizer recommendation has been applied for this scope.

- Primary agent: playwright-tester
- Primary skill: e2e-page-validator
- Supporting skill: qa-test-planner
- Optional supporting agents: backend-developer, database-architect, gsd-integration-checker

Why this stack is best:
- playwright-tester is browser-first and suited for manual Chrome workflow validation.
- e2e-page-validator enforces parameter fuzzing + network/service validation + markdown output.
- qa-test-planner adds regression structure and bug-report quality.

## One Prompt To Run (Copy/Paste)

Use this exact prompt:

```text
Use the playwright-tester agent with e2e-page-validator + qa-test-planner skills.

Goal:
Perform complete end-to-end manual Chrome verification for the Code Dashboard at http://localhost:3000/code.

Mandatory coverage:
1) Frontend behavior: all toolbar actions, sidebar tabs, file explorer actions, run/stop execution, notifications, command palette, keyboard shortcuts, AI refine panel, test runner panel, git panel, debug panel.
2) Backend integration: verify request/response behavior for /api/v1/code/*, /api/v1/debug/*, /api/v1/git/*, /api/v1/testing/run and websocket /ws/terminal/{project_id}.
3) Database integrity: validate create/update/delete state for code_projects and code_files, including parent-child file hierarchy and delete cleanup.
4) Service verification: for every UI action that triggers XHR/fetch/ws, record endpoint, method, payload shape, status code, and UI outcome.

Test design requirements:
- Run happy-path, invalid input, missing input, boundary/extreme input, and recovery tests.
- Capture console errors and failed network requests.
- Take screenshots for every failure.

Output artifact:
Write final markdown report to docs/reports/code-page-chrome-e2e-report.md with:
- Executive summary
- Frontend coverage matrix
- API/service coverage table
- Database verification table
- Defects with exact repro steps
- Console/network error summary
- Residual risks and go/no-go recommendation
```

## Manual Chrome Execution Commands (Conda)

Use conda env only:

```bash
conda run -n engunity npm --prefix frontend run dev
conda run -n engunity uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
conda run -n engunity npx playwright test frontend/e2e/code-dashboard.spec.ts --project=chromium --headed --reporter=list
```

## Full File Coverage Map For Code Page

The E2E pass must explicitly touch or verify behavior tied to all files below.

### Frontend Route Files

- frontend/src/app/(dashboard)/code/page.tsx
- frontend/src/app/(dashboard)/code/codelab.module.css

### Frontend Component Files (Code Page Surface)

- frontend/src/components/code-lab/AIInlineProvider.tsx
- frontend/src/components/code-lab/AIRefinePanel.tsx
- frontend/src/components/code-lab/BottomPanel.tsx
- frontend/src/components/code-lab/Breadcrumbs.tsx
- frontend/src/components/code-lab/CodeEditor.tsx
- frontend/src/components/code-lab/CommandPalette.tsx
- frontend/src/components/code-lab/DebugConsole.tsx
- frontend/src/components/code-lab/DebugSidebar.tsx
- frontend/src/components/code-lab/DebugToolbar.tsx
- frontend/src/components/code-lab/EditorTabs.tsx
- frontend/src/components/code-lab/FileExplorer.tsx
- frontend/src/components/code-lab/FindReplace.tsx
- frontend/src/components/code-lab/GitSidebar.tsx
- frontend/src/components/code-lab/GlobalSearch.tsx
- frontend/src/components/code-lab/NotificationOverlay.tsx
- frontend/src/components/code-lab/PreviewPanel.tsx
- frontend/src/components/code-lab/StatusBar.tsx
- frontend/src/components/code-lab/TeamChat.tsx
- frontend/src/components/code-lab/Terminal.tsx
- frontend/src/components/code-lab/TerminalInstance.tsx
- frontend/src/components/code-lab/TestRunner.tsx

### Frontend State/Service Files Required For End-To-End Verification

- frontend/src/stores/codeStore.ts
- frontend/src/services/code.ts
- frontend/src/services/git.ts
- frontend/src/services/terminal-ws.ts

### Existing E2E Baseline To Reuse/Extend

- frontend/e2e/code-dashboard.spec.ts
- frontend/e2e/fixtures/auth.fixture.ts

### Backend API Files Used By Code Page

- backend/app/main.py
- backend/app/api/v1/code.py
- backend/app/api/v1/debug.py
- backend/app/api/v1/git.py
- backend/app/api/v1/testing.py
- backend/app/api/v1/terminal.py

### Backend Model/Schema Files (Database Contract)

- backend/app/models/code.py
- backend/app/schemas/code.py

### Backend Integration Test Baseline

- backend/tests/integration/test_code_dashboard_flow.py

## Required Service Coverage Table

Mark each as Pass/Fail with evidence.

| Area | Endpoint Pattern | Must Verify |
|---|---|---|
| Code execution | POST /api/v1/code/execute-direct | success + failure + network-failure handling |
| AI assist | POST /api/v1/code/ai-assist | optimize/refactor/security/explain error handling |
| AI chat | POST /api/v1/code/ai-chat | response rendering + failure fallback |
| AI inline | POST /api/v1/code/ai-inline-complete | inline completion stability |
| Project CRUD | /api/v1/code/ | auth and persistence |
| File CRUD | /api/v1/code/{project_id}/files | tree integrity and update/delete consistency |
| Auth execute | POST /api/v1/code/{project_id}/execute | authenticated run behavior |
| Debug | /api/v1/debug/* | start, breakpoint, step, continue, variables, stop |
| Git | /api/v1/git/* | init, status, commit, log |
| Testing | POST /api/v1/testing/run | run tests panel behavior |
| Terminal WS | /ws/terminal/{project_id} | connect, command echo/output, failure handling |

## Database Verification Requirements

Verify database outcomes for:
- code_projects row created/updated/deleted correctly.
- code_files row created/updated/deleted correctly.
- parentId hierarchy integrity for nested files/folders.
- delete project removes child files (cascade behavior).

## Required Final Report Format

Create or update:
- docs/reports/code-page-chrome-e2e-report.md

Required sections:
1. Scope and environment
2. Frontend interaction coverage matrix
3. Backend API coverage matrix
4. Database verification matrix
5. Failed scenarios with reproduction steps
6. Console and network errors
7. Residual risk and untested items
8. Final release recommendation (go/no-go)
