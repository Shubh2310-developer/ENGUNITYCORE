# Deep Research Production Readiness Agent Prompt

Use this prompt to harden the Deep Research streaming workflow until it is genuinely production-ready, with fixes backed by repeatable local E2E evidence.

```text
You are an autonomous senior full-stack engineer, QA engineer, and production-readiness reviewer working inside `/home/agentrogue/projects/ENGUNITYCORE`.

Mission: permanently fix all remaining Deep Research Dashboard streaming, reliability, UX, API, concurrency, and E2E coverage gaps so the feature can be honestly assessed for production readiness.

Do not treat a single happy-path run as success. Production readiness requires root-cause fixes, regression coverage, manual Chrome verification, network/console evidence, negative testing, concurrency testing, timeout testing, responsive testing, and a detailed report.

Target workflow:

- Deep Research feature launched from the Chat dashboard/page.
- Frontend likely under `/home/agentrogue/projects/ENGUNITYCORE/frontend/src/app/(dashboard)/chat`.
- Backend Deep Research pipeline likely involves `research_agent.py`, streaming endpoints, RAG/vector search, graph/community search, web search, synthesis, and report generation.

Required local environment:

- Workspace root: `/home/agentrogue/projects/ENGUNITYCORE`
- Frontend port: `3000`
- Backend/API port: `8000`
- Browser: Chrome only for manual E2E verification
- Docker: forbidden
- Use local services only

Required login credentials:

- Email: `shahshubh655@gmail.com`
- Password: `Meghal0987@23`

Security rule: use the credentials to log in, but never write the raw password into reports, screenshots annotations, logs, commits, or summaries. Mask it as `********`.

Before starting, activate and follow relevant skills from `/home/agentrogue/projects/ENGUNITYCORE/.claude`:

- Load `e2e-page-validator` for manual Chrome E2E exploration, network checks, console checks, screenshots, and evidence-backed reporting.
- Load `backend-dev-guidelines` for backend streaming, service, timeout, async, error-handling, and API fixes.
- Load `frontend-design` only for UX and visual verification of the Chat/Deep Research flow. Do not redesign unrelated UI.
- Load `qa-test-planner` for scenario matrix expansion, regression planning, negative tests, concurrency tests, and production-readiness criteria.
- Load `documentation-templates` for the final report structure.
- Load `clean-code` before applying code fixes so changes stay minimal, maintainable, and targeted.

Use project agents where helpful:

- Use an `explore` agent first to map Deep Research frontend components, backend endpoints, streaming implementation, state management, tests, and docs. Thoroughness: very thorough.
- Use a `general` agent for backend/API investigation if streaming stalls, cancellation fails, duplicate submissions occur, timeout handling is weak, or errors are swallowed.
- Use a `general` agent for frontend investigation if state, refresh, input clearing, loading indicators, or UI recovery behavior is inconsistent.
- Keep agent outputs grounded in file paths and reproducible evidence.

Respect repository instructions:

- Use the code-review knowledge graph tools before falling back to `Grep`, `Glob`, or `Read` when exploring code structure.
- If graph tools are unavailable, explicitly note that in the final report and then use normal file exploration.
- Never revert unrelated user changes.
- Do not use Docker.
- Do not make broad rewrites when targeted fixes are enough.

Primary production-readiness goals:

1. Streaming must not hang, deadlock, or starve the event loop.
2. Backend CPU-bound or blocking operations must not run directly on the async event loop.
3. RAG, graph, web, and synthesis stages must have explicit timeouts and graceful fallback behavior.
4. Frontend input must clear immediately after submission starts.
5. Duplicate submissions must be prevented while a request is in flight.
6. User must be able to stop/cancel generation if the UI exposes cancellation.
7. Refresh, navigation away, and navigation back must not leave broken UI state.
8. Errors, timeouts, partial failures, and empty results must produce understandable user-facing messages.
9. Console must be clean of unhandled runtime errors during normal flows.
10. Network calls must return expected status codes and payload/stream shapes.
11. The feature must work across desktop, laptop, tablet-like, and mobile viewport widths.
12. The test report must include hard evidence, not vague claims.

Initial audit tasks:

1. Check `git status` and document dirty worktree state. Do not overwrite unrelated changes.
2. Identify the exact frontend files for the Chat page and Deep Research UI controls.
3. Identify the exact backend files for Deep Research orchestration, streaming endpoints, RAG/vector search, graph search, web search, and synthesis.
4. Identify the exact route and endpoint used by the Deep Research action.
5. Identify existing tests and previous reports related to Deep Research, Chat, streaming, RAG, timeout fixes, and frontend UX.
6. Identify all places where blocking synchronous calls may still run inside async code.
7. Identify all places where exceptions, cancellations, timeouts, empty results, or partial failures are not handled cleanly.
8. Identify all frontend states: idle, submitting, streaming, completed, failed, cancelled, retrying, refreshed, duplicate-clicked, and navigated-away.

Required code-hardening tasks:

Backend:

1. Ensure all blocking vector, graph, filesystem, model, network, or CPU-heavy operations are offloaded or made truly async.
2. Ensure every external or long-running stage has explicit timeout boundaries.
3. Ensure timeout errors are caught and converted into structured partial-failure events or clear terminal failure events.
4. Ensure cancellation propagates cleanly and frees resources.
5. Ensure streaming emits valid ordered events with stable event names and payload shapes.
6. Ensure errors do not produce broken JSON, half-written SSE events, swallowed exceptions, or hanging client connections.
7. Ensure backend logs are useful but do not leak secrets.
8. Ensure mock sources are not shown as real production evidence unless the app is explicitly running in mock/local mode.
9. Ensure stage progress cannot regress unexpectedly or exceed valid bounds.
10. Ensure backend tests cover success, timeout, partial failure, cancellation if supported, and concurrent requests.

Frontend:

1. Ensure the chat input clears immediately when Deep Research submission starts.
2. Ensure duplicate submission is disabled while the same Deep Research request is in flight.
3. Ensure loading/streaming/progress states are visible, accurate, and reset correctly after success, failure, cancellation, or retry.
4. Ensure stop/cancel control works if present. If absent, document whether this is intentional.
5. Ensure refresh during streaming recovers to a safe state.
6. Ensure navigation away and back recovers to a safe state.
7. Ensure the final report renders markdown, code blocks, links, citations, tables, and long text without layout breakage.
8. Ensure errors and timeouts show actionable messages.
9. Ensure console has no unhandled React/runtime/promise errors during normal and negative flows.
10. Ensure frontend tests cover state transitions, duplicate prevention, error rendering, timeout rendering, and completed report rendering where feasible.

Manual Chrome E2E setup:

1. Start or verify backend/API service on port `8000` without Docker.
2. Start or verify frontend on port `3000` without Docker.
3. Confirm both ports are reachable.
4. Open Chrome at `http://localhost:3000`.
5. Log in with `shahshubh655@gmail.com` and the provided password.
6. Navigate to the Chat dashboard route that exposes Deep Research.
7. Open Chrome DevTools Console and Network tabs.
8. Preserve logs during navigation and streaming tests.

Mandatory E2E scenarios:

Happy path:

1. Run Quick Deep Research query: `Compare microservices vs monolith architecture`.
2. Verify input clears immediately.
3. Verify progress stages update smoothly and monotonically.
4. Verify final report appears, is readable, and contains sources or clearly labeled local/mock sources.
5. Verify follow-up questions and related topics appear if intended.
6. Verify no console errors.
7. Verify network/streaming request succeeds and closes cleanly.

Reliability repeated runs:

1. Run at least 5 sequential Deep Research requests with different queries.
2. Record duration, result status, confidence/coverage/source count if present, console errors, and failed network requests.
3. Confirm no progressive slowdown, memory-like UI degradation, or stuck state.

Concurrency/event-loop tests:

1. Trigger two Deep Research requests in separate browser tabs or sessions if the app supports it.
2. Confirm both progress independently or the UI explicitly prevents concurrent requests safely.
3. Confirm backend remains responsive to a normal lightweight API request while research is running.
4. Confirm no event-loop starvation symptoms, deadlocks, or delayed unrelated requests.

Duplicate prevention:

1. Rapidly click the Deep Research action multiple times after entering a query.
2. Confirm only one request is submitted or duplicates are intentionally queued with clear UI state.
3. Confirm the input and progress state remain consistent.

Validation and edge cases:

1. Submit empty input.
2. Submit whitespace-only input.
3. Submit very long input.
4. Submit special characters and markdown.
5. Submit a multiline prompt.
6. Submit a prompt likely to produce code blocks and tables.
7. Verify clear validation messages and no broken UI.

Timeout and partial-failure behavior:

1. Simulate slow network with Chrome DevTools throttling where feasible.
2. If safe, temporarily force or mock a slow RAG, graph, or web stage in test mode only.
3. Verify timeout behavior does not hang the stream.
4. Verify partial results or terminal error messages are understandable.
5. Revert any temporary test-only fault injection before finishing unless it is committed as a proper test fixture.

Cancellation/navigation recovery:

1. Start Deep Research and click stop/cancel if available.
2. Verify backend request is aborted or UI cleanly marks the run cancelled.
3. Refresh during streaming.
4. Navigate away during streaming and then back to Chat.
5. Verify no stuck loading state, duplicate ghost messages, or broken controls.

Persistence and history:

1. Complete a Deep Research run.
2. Refresh page.
3. Switch conversations if conversation history exists.
4. Navigate away and back.
5. Verify expected report/message persistence behavior.

Responsive visual verification:

Test in Chrome at minimum:

1. Desktop: 1440 x 900
2. Laptop: 1280 x 800
3. Tablet-like: 768 x 1024
4. Mobile: 390 x 844

For each viewport, verify:

1. Chat input is visible and usable.
2. Deep Research action is visible or reachable.
3. Streaming progress is visible and not clipped.
4. Generated report, markdown, sources, follow-ups, and related topics are readable.
5. Long content wraps or scrolls correctly.
6. Navigation remains usable.

Accessibility and keyboard verification:

1. Tab to the input and Deep Research control.
2. Verify focus indicators are visible.
3. Verify Enter and Shift+Enter behavior.
4. Verify buttons have accessible names where inspectable.
5. Verify loading and error states are understandable.
6. Verify keyboard-only recovery from errors where feasible.

Network and console evidence requirements:

For every major scenario, record:

1. Console errors/warnings, or explicitly state none observed.
2. Network request method, endpoint, status code, duration, and response/stream behavior.
3. Whether request cancellation, timeout, or stream completion behaved correctly.
4. Screenshot path for completed, failed, cancelled, timeout, mobile, and any defect states.

Required automated tests:

Add or update targeted tests where feasible. Prefer the smallest meaningful tests.

Backend tests should cover:

1. Successful Deep Research stage orchestration.
2. Timeout of RAG/vector stage.
3. Timeout of graph/community stage.
4. Timeout or failure of web stage.
5. Partial failure still emits a terminal event or clear error.
6. Concurrent requests do not block each other.
7. Cancellation if supported by the backend implementation.

Frontend tests should cover:

1. Input clears immediately on Deep Research submission.
2. Duplicate submission is prevented while in flight.
3. Streaming progress renders expected stages.
4. Success state renders final report.
5. Error/timeout state renders actionable message.
6. Cancel/stop behavior if the UI supports it.

Run relevant tests and record exact commands and results in the report. If some tests cannot be run because of environment constraints, document why and what manual coverage replaces them.

Report requirements:

Create or update this final production-readiness report:

`/home/agentrogue/projects/ENGUNITYCORE/docs/testing/DEEP_RESEARCH_PRODUCTION_READINESS_REPORT.md`

Save screenshots under:

`/home/agentrogue/projects/ENGUNITYCORE/docs/testing/screenshots/deep-research-production-readiness/`

The report must include:

1. Title and metadata
2. Executive summary with honest verdict
3. Scope and files inspected
4. Environment and commands used
5. Credentials used with password masked
6. Summary of code fixes applied
7. Backend production-readiness review
8. Frontend production-readiness review
9. Automated test results
10. Manual Chrome E2E scenario matrix
11. Repeated-run reliability table
12. Concurrency/event-loop verification table
13. Timeout and partial-failure verification table
14. Duplicate-submission verification
15. Cancellation/navigation/refresh recovery verification
16. Persistence/history verification
17. Responsive viewport verification
18. Accessibility and keyboard verification
19. Console findings table
20. Network/API/streaming findings table
21. Screenshots and evidence links
22. Bugs found and fixed
23. Bugs found but not fixed, if any
24. Residual risks
25. Production-readiness verdict

Required report tables:

Scenario matrix columns:

- ID
- Scenario
- Steps
- Expected result
- Actual result
- Status
- Evidence

Network/streaming table columns:

- Scenario
- Method/transport
- Endpoint/channel
- Status
- Duration
- Stream completed/aborted/timed out
- Notes

Reliability table columns:

- Run
- Query
- Duration
- Final status
- Confidence
- Sources
- Coverage
- Console errors
- Failed requests
- Notes

Bug table columns:

- ID
- Severity
- Category
- Title
- Reproduction steps
- Expected
- Actual
- Root cause
- Fix
- Retest evidence
- Status

Production-readiness verdict rules:

Use one of these verdicts only:

- `Production Ready`: all critical/high issues fixed, all required happy-path, negative, timeout, concurrency, refresh/navigation, responsive, console, network, and automated checks pass with evidence.
- `Conditionally Ready`: no critical/high issues remain, but documented medium/low risks or environment limitations remain.
- `Not Production Ready`: any critical/high issue remains, or required evidence is missing for major reliability areas.

Do not claim `Production Ready` unless every required evidence category is present and passing.

Final response requirements:

When finished, respond with:

1. Final verdict
2. Report path
3. Tests run
4. Critical/high issues fixed
5. Remaining risks
6. Whether frontend/backend services are still running and how to stop them if relevant
```
