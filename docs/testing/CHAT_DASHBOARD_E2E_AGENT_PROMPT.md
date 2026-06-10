# Chat Dashboard E2E Agent Prompt

Use this prompt to run a complete manual, Chrome-based end-to-end validation of the service at `frontend/src/app/(dashboard)/chat`.

```text
You are an autonomous senior QA engineer and full-stack debugging agent working inside `/home/agentrogue/projects/ENGUNITYCORE`.

Mission: perform a complete manual end-to-end test of the dashboard Chat service/page implemented under:

`/home/agentrogue/projects/ENGUNITYCORE/frontend/src/app/(dashboard)/chat`

The validation must be executed locally, manually, and visually in Chrome. Do not use Docker. Use the local frontend on port `3000` and backend/API service on port `8000`.

Required login credentials:

- Email: `shahshubh655@gmail.com`
- Password: `Meghal0987@23`

Important security rule: use the credentials to log in, but do not include the raw password in the final report. Mask it as `********` in all documentation.

Before testing, activate and follow the relevant project skills from `/home/agentrogue/projects/ENGUNITYCORE/.claude`:

- Load `e2e-page-validator` for browser-based E2E exploration, interactive element mapping, network verification, console validation, screenshots, and report generation.
- Load `frontend-design` only for visual quality assessment of the page UI, responsiveness, layout, spacing, and visible interaction states. Do not redesign the page.
- Load `qa-test-planner` if a structured scenario matrix or regression checklist is needed.
- Load `documentation-templates` for the final Markdown report structure.
- Load `backend-dev-guidelines` only if backend/API failures need root-cause analysis.
- Load `clean-code` only if you make any code changes after finding a defect.

Use project agents where helpful:

- Use an `explore` agent first to understand the Chat page route, components, service calls, API dependencies, auth flow, tests, streaming behavior, persistence behavior, and existing docs. Thoroughness: medium.
- Use a `general` agent for parallel investigation only if there are backend/API failures, streaming failures, repeated console errors, or unclear service behavior.
- Do not spawn agents for trivial checks. Keep the testing workflow controlled and reproducible.

Respect the repository instruction in `AGENTS.md`: use the code-review knowledge graph tools before falling back to `Grep`, `Glob`, or `Read` when exploring code structure. If graph tools are unavailable, state that in the report and then use normal file exploration.

Testing environment requirements:

- Workspace root: `/home/agentrogue/projects/ENGUNITYCORE`
- Frontend port: `3000`
- Backend/API port: `8000`
- Browser: Chrome only
- Execution mode: manual visual testing in Chrome, assisted by DevTools and browser automation if available
- Docker: forbidden
- Report directory: `/home/agentrogue/projects/ENGUNITYCORE/docs/testing`
- Final report file: `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/CHAT_DASHBOARD_E2E_MANUAL_REPORT.md`
- Screenshots directory: `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/screenshots/chat-dashboard-e2e/`

Initial setup checklist:

1. Check the current git status and note any dirty worktree state. Do not revert or overwrite unrelated user changes.
2. Inspect package scripts and project docs to determine the correct commands to start frontend and backend locally.
3. Start or verify the backend/API service on port `8000` without Docker.
4. Start or verify the frontend service on port `3000` without Docker.
5. Confirm both ports are reachable before opening the browser.
6. Open Chrome and navigate to the local app, normally `http://localhost:3000`.
7. Log in with the provided email and password.
8. Navigate to the Chat dashboard page associated with `/frontend/src/app/(dashboard)/chat`. Determine the actual browser route, such as `/chat`, `/dashboard/chat`, or another project-specific route.

Core testing objective:

Verify that every visible feature on the Chat page is present, visually correct, interactive, and functionally working according to the service's intended behavior. The test must not stop at page load. Interact with every visible control and validate the backend/service calls behind each meaningful action.

Mandatory visual inspection areas:

1. Page shell and dashboard layout
2. Navigation/sidebar/header state
3. Chat title, descriptions, empty states, onboarding text, helper text, and quota/status indicators
4. Chat history/sidebar, conversation list, new chat controls, rename/delete/archive controls, if present
5. Message composer, textarea/input behavior, send button, stop/regenerate controls, attachment controls, model selectors, prompt templates, or tool selectors, if present
6. User messages, assistant messages, loading/streaming indicators, typing states, markdown rendering, code blocks, tables, links, citations, copy buttons, feedback buttons, and error bubbles
7. File upload, image upload, drag-and-drop, paste handling, and attachment previews, if present
8. Search, filters, conversation switching, pagination, infinite scroll, or history loading, if present
9. Settings panels, dropdowns, menus, modals, drawers, toasts, banners, badges, disabled states, hover states, and focus states
10. Authentication/session state, refresh behavior, route transitions, and dashboard navigation back to the Chat page
11. Responsive behavior on desktop and mobile viewport widths

Functional test coverage requirements:

For every visible interactive element:

1. Record the element name, selector or visible label, location on page, and expected behavior.
2. Click, type into, upload through, select, open, close, or otherwise interact with it manually in Chrome.
3. Capture whether the UI updates correctly.
4. Verify whether it triggers a network request, streaming request, WebSocket event, or Server-Sent Events connection.
5. For each network request, record method, URL, status code, response type, timing, and whether it matches expected behavior.
6. Check the browser console after each major interaction and record any warnings or errors.
7. Capture screenshots for defects, visual problems, broken states, failed service calls, malformed streaming output, or confusing behavior.

Required happy-path scenarios:

1. Successful login using `shahshubh655@gmail.com`.
2. Successful navigation to the Chat dashboard page.
3. Page loads with no blocking error state.
4. Start a new conversation, if the feature exists.
5. Send a simple valid chat message and verify an assistant response appears.
6. Send a multiline prompt and verify formatting is preserved or handled correctly.
7. Send a prompt requesting code or markdown and verify rendered output is readable and copyable, if copy controls exist.
8. Verify streaming/loading indicators appear and disappear correctly while the response is generated.
9. Stop or cancel generation, if the feature exists.
10. Regenerate or retry a response, if the feature exists.
11. Switch between conversations and verify message history is accurate.
12. Refresh the page and verify expected persisted chat state remains available.
13. Use copy, feedback, edit, delete, rename, archive, export, attach, or share actions if those actions are present.
14. Navigate away and back to Chat and verify critical state is preserved unless intended behavior says otherwise.

Required negative and edge-case scenarios:

1. Submit an empty message.
2. Submit whitespace-only input.
3. Submit very long input.
4. Submit special characters, markdown, code fences, JSON, HTML-like text, and multiline content.
5. Submit rapidly multiple times and verify duplicate-send prevention or expected queuing behavior.
6. Refresh while a response is streaming.
7. Navigate away while a response is streaming.
8. Trigger cancel/close actions for modals, drawers, dropdowns, and menus.
9. Retry after a failed or invalid action.
10. Test empty-state behavior when no conversations are available, if feasible.
11. Test loading-state behavior during slow network with Chrome DevTools throttling, if feasible.
12. Test offline or failed-network behavior, if feasible.
13. Verify the app does not expose raw secrets, stack traces, prompt-internal metadata, provider keys, or sensitive implementation details in the UI.

Chrome DevTools requirements:

1. Keep Console open during testing.
2. Keep Network tab open with Fetch/XHR filtering available.
3. Watch streaming/SSE/WebSocket traffic if the chat implementation uses streaming responses.
4. Preserve logs while testing flows where navigation occurs.
5. Capture failed requests, unexpected redirects, CORS errors, auth failures, hydration errors, React errors, unhandled promise rejections, aborted stream errors, and malformed response payloads.
6. Validate that authenticated service calls use the expected session/auth behavior.

Accessibility and usability checks:

1. Verify visible focus states for keyboard navigation.
2. Tab through the page and confirm focus order is logical.
3. Confirm the chat composer can be focused, typed into, and submitted using expected keyboard behavior.
4. Verify Enter versus Shift+Enter behavior matches the UI convention or visible instructions.
5. Confirm buttons and controls have understandable accessible names where inspectable.
6. Confirm generated messages and errors are visible and understandable.
7. Confirm loading states are visible and do not trap the user indefinitely.
8. Confirm text contrast, spacing, clipping, overflow, scroll anchoring, and responsive layout are visually acceptable.

Responsive testing requirements:

Test at minimum:

1. Desktop: 1440 x 900
2. Laptop: 1280 x 800
3. Tablet-like: 768 x 1024
4. Mobile: 390 x 844

For each viewport, verify:

1. No critical content is clipped.
2. Navigation remains usable.
3. Main Chat workflow remains accessible.
4. Composer, message list, conversation list, settings, menus, and action buttons are usable.
5. Message bubbles, markdown, code blocks, tables, attachments, and long text wrap or scroll correctly.
6. Horizontal scrolling only occurs where intentionally required, such as inside code blocks.

Backend/service verification requirements:

1. Identify every backend endpoint used by the Chat page during the test.
2. Confirm expected endpoints return 2xx status codes on successful flows.
3. Confirm streaming/SSE/WebSocket connections complete or close cleanly where applicable.
4. Confirm validation errors return appropriate 4xx responses and helpful UI messages.
5. Confirm there are no unexpected 5xx errors.
6. Confirm auth/session failures do not occur after login.
7. Confirm message persistence, conversation retrieval, and conversation updates match intended behavior.
8. If an API fails, inspect the relevant backend/frontend code and report the likely root cause with file references.

Defect handling:

If a bug is found:

1. Record exact reproduction steps.
2. Record expected result and actual result.
3. Record browser viewport, route, timestamp, console errors, network request details, streaming details if applicable, and screenshot path.
4. Assign severity: Critical, High, Medium, Low.
5. Assign category: Functional, Visual, Accessibility, Performance, Auth, API, State Management, Responsiveness, Data Loss, Streaming, Persistence, or Security.
6. If the fix is small and safe, implement it only after clearly identifying the root cause. Do not rewrite unrelated code.
7. After any fix, rerun the failed scenario and update the report with verification evidence.

Final report requirements:

Create this file:

`/home/agentrogue/projects/ENGUNITYCORE/docs/testing/CHAT_DASHBOARD_E2E_MANUAL_REPORT.md`

The report must be highly detailed and include these sections:

1. Title and test metadata
2. Executive summary
3. Environment details
4. Credentials used, with password masked
5. Services started and exact commands used
6. Actual browser route tested
7. Source files and components inspected
8. Feature inventory of everything visually present on the page
9. Manual test scenario matrix
10. Happy-path results
11. Negative and edge-case results
12. Chat streaming and persistence results
13. Responsive viewport results
14. Accessibility and keyboard-navigation results
15. Console log findings
16. Network/API/streaming call table
17. Screenshots and evidence links
18. Bugs found, with severity and reproduction steps
19. Fixes applied, if any
20. Retest results after fixes, if any
21. Residual risks and untested areas
22. Final pass/fail verdict

Use Markdown tables where useful. Include screenshot relative paths from `docs/testing/screenshots/chat-dashboard-e2e/`. The report must be specific enough that another engineer can reproduce the test run without asking follow-up questions.

Suggested report tables:

Feature inventory table columns:

- Area
- Visible feature/control
- Expected behavior
- Tested action
- Result
- Evidence

Scenario matrix columns:

- ID
- Scenario
- Steps
- Expected result
- Actual result
- Status
- Evidence

Network/API/streaming table columns:

- Trigger
- Method/transport
- Endpoint/channel
- Status
- Response/stream verified
- Notes

Bug table columns:

- ID
- Severity
- Category
- Title
- Steps to reproduce
- Expected
- Actual
- Evidence
- Likely root cause
- Status

Completion criteria:

The task is complete only when:

1. Frontend and backend local services have been verified on ports `3000` and `8000`.
2. Chrome manual testing has been performed after login.
3. Every visible Chat page feature/control has been inventoried and tested.
4. Console, Network, and streaming findings have been documented.
5. Screenshots have been saved for failures and important states.
6. The final report exists at `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/CHAT_DASHBOARD_E2E_MANUAL_REPORT.md`.
7. The final response summarizes the verdict, report path, critical defects if any, and any commands that must remain running or can be stopped.
```
