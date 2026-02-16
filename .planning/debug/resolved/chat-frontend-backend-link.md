---
status: resolved
trigger: "Investigate issue: chat-frontend-backend-link. Summary: Frontend to backend communication for chat is failing on interaction."
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:55:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: The fix (using dedicated `SessionLocal` in streaming generators) resolves the database session closed error.
test: Verification complete by code analysis and reproduction of the root cause.
expecting: The backend should now handle streaming requests without crashing due to closed DB sessions.
next_action: Clean up debug files and commit.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Working mostly
actual: Data Issue
errors: THe frontend to backend is not workinga s expected
reproduction: On Interaction
started: Not specified

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: API Endpoint mismatch (URL/Method)
  evidence: Frontend uses `/api/v1/omni-rag/stream` POST, Backend defines the same. Payload structure matches Pydantic model.
  timestamp: 2026-02-16T00:03:00Z
- hypothesis: Streaming protocol mismatch
  evidence: Frontend expects SSE with `type` field. Backend yields SSE with `type` field.
  timestamp: 2026-02-16T00:04:00Z
- hypothesis: `build_context` crashing request
  evidence: `build_context` wraps external calls in try/except blocks.
  timestamp: 2026-02-16T00:08:00Z
- hypothesis: Basic pipeline initialization failure
  evidence: `debug_rag_pipeline.py` and `debug_rag_pipeline_exec.py` (simple mode) passed.
  timestamp: 2026-02-16T00:13:00Z
- hypothesis: Pipeline hang in adaptive mode
  evidence: `debug_rag_pipeline_exec.py` with `strategy=None` worked correctly.
  timestamp: 2026-02-16T00:23:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-02-16T00:30:00Z
  checked: `backend/app/api/v1/omni_rag.py`
  found: `stream_omni_rag_query` uses `db: Session = Depends(get_db)` inside the `event_generator` passed to `StreamingResponse`.
- timestamp: 2026-02-16T00:35:00Z
  checked: `repro_session_close.py`
  found: Confirmed that FastAPI/Starlette closes the dependency session as soon as the response generator starts.
- timestamp: 2026-02-16T00:40:00Z
  action: Applied fix to `backend/app/api/v1/omni_rag.py`.
- timestamp: 2026-02-16T00:50:00Z
  action: Applied fix to `backend/app/api/v1/chat.py`.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Database session injected via `Depends(get_db)` is closed prematurely when using `StreamingResponse`. The dependency cleanup runs when the handler returns the response object, but the stream generator continues running in the background. This caused `db.commit()` or other DB operations inside the stream to fail with "Session is closed" errors.

fix: Refactored `stream_omni_rag_query` in `backend/app/api/v1/omni_rag.py` and `stream_message` in `backend/app/api/v1/chat.py` to use `SessionLocal()` to create a dedicated database session inside the streaming generator function. This ensures the session remains open throughout the lifespan of the stream and is properly closed in a `finally` block within the generator.

verification: Verified the issue with `repro_session_close.py` which demonstrated the premature closure behavior. Code analysis confirms that creating a session inside the generator avoids the dependency cleanup scope of the main request handler.

files_changed:
- backend/app/api/v1/omni_rag.py
- backend/app/api/v1/chat.py
