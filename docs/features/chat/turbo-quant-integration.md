Turbo Quant Chat Integration Implementation Plan
Executive Summary
Integrate TurboQuant into the chat page by treating it as a typed, optional inference capability on the existing Omni-RAG streaming path, not as a separate chat stack. The safest production path is:
1. Add a backward-compatible turbo_quant request/metadata contract to /api/v1/omni-rag/stream.
2. Implement backend capability detection so the system can distinguish requested from applied.
3. Persist TurboQuant metadata in chat history under a typed nested field.
4. Add gated chat-page controls and badges only after the backend contract is stable.
5. Roll out behind a feature flag with provider-aware fallback, since the current primary provider is Groq and real KV-cache control is unlikely there.
A critical architectural constraint: the current chat path primarily uses Groq-hosted inference via ai_router, with local Ollama fallback. TurboQuant-style KV-cache compression is generally realistic only on self-hosted/local runtimes, so phase 1 must support honest fallback semantics rather than claiming quantization is active on unsupported providers.
Current State Analysis
Existing chat page architecture
The chat page is a large client component in frontend/src/app/(dashboard)/chat/page.tsx that owns:
- Input state, message list, active session, sidebar tabs, search state.
- Streaming lifecycle for normal chat via omniRagService.streamQuery(...).
- Session CRUD and history retrieval via chatService.
- Deep research mode via startDeepResearch(...).
- File and image upload behavior.
- UI rendering for message metadata, research progress, and source badges.
Existing state and data flow
Current normal chat flow:
1. handleSend() appends a local user message and assistant placeholder.
2. It calls omniRagService.streamQuery() with query, session_id, strategy, and image references.
3. frontend/src/services/omniRag.ts parses raw SSE events as any.
4. page.tsx handles metadata, content, done, and error events.
5. backend/app/api/v1/omni_rag.py creates or validates the session, builds context, then streams OmniRAGPipeline.stream_query(...).
6. The backend persists the final assistant message to MongoDB and updates the SQL session title/timestamp.
7. chatService.getSession() later reloads persisted messages from /api/v1/chat/{session_id}.
Current service calls
Frontend:
- chatService.getSessions()
- chatService.getSession(sessionId)
- chatService.createSession(title)
- chatService.deleteSession(sessionId)
- omniRagService.streamQuery(request, onEvent, onError)
- omniRagService.uploadDocument(...)
- omniRagService.getCommunities()
- omniRagService.rebuildGraph()
Backend:
- /api/v1/omni-rag/stream
- /api/v1/chat/
- /api/v1/chat/{session_id}
- build_context(...)
- OmniRAGPipeline.stream_query(...)
- ai_router.stream_request(...) on the simpler chat path
Extension points
Best extension points:
- frontend/src/services/omniRag.ts
  - Add typed request and event contract for turbo_quant.
- frontend/src/app/(dashboard)/chat/page.tsx
  - Add TurboQuant UI state and render badges from stream metadata.
- backend/app/api/v1/omni_rag.py
  - Accept turbo_quant options and emit capability/applied metadata early in the stream.
- backend/app/services/rag/pipeline.py
  - Surface provider/runtime metrics into metadata events.
- backend/app/services/ai/router.py
  - Central place for provider detection and fallback semantics.
- backend/app/schemas/chat.py and frontend/src/services/chat.ts
  - Persist and hydrate TurboQuant metadata for session reloads.
High-risk coupling areas
1. page.tsx is already overloaded.
2. SSE event parsing is loosely typed and metadata is merged ad hoc.
3. Session/history APIs and Omni-RAG streaming are split across different services.
4. Chat message persistence is effectively schema-by-convention in MongoDB.
5. Provider fallback is hidden inside backend routing, so the frontend cannot currently tell whether a requested optimization was actually applied.
6. Deep research and standard chat share isLoading and message rendering paths, so regressions can leak across modes.
Integration Architecture
Architectural stance
TurboQuant should be integrated as an optional inference capability on the existing chat request, not as a separate page mode and not as a frontend-only toggle with no backend acknowledgement.
UI state location
Keep state local to the chat page initially, but typed and isolated:
- Add turboQuantEnabled
- Add turboQuantConfig
- Add turboQuantRuntimeState
Recommended shapes:
type TurboQuantConfig = {
  enabled: boolean;
  mode: 'auto' | 'force' | 'off';
  target: 'kv_cache' | 'embeddings' | 'auto';
  variant: 'mse' | 'prod';
  bitWidth: 2 | 3 | 4 | 5 | 6 | 7 | 8;
};
type TurboQuantRuntimeState = {
  requested: boolean;
  applied: boolean;
  provider?: string;
  fallbackReason?: string;
  compressionRatio?: number;
  estimatedMemorySavedMb?: number;
  qualityScore?: number;
  firstTokenOverheadMs?: number;
};
If the page grows further during implementation, extract only the TurboQuant controls into a dedicated component. Do not refactor the whole page in the same change.
Service layer location
Frontend:
- Extend frontend/src/services/omniRag.ts request type with optional turbo_quant.
- Extend stream event typing to include optional turbo_quant.
- Extend frontend/src/services/chat.ts Message type with optional turbo_quant.
Backend:
- Add a dedicated service layer for capability evaluation and normalization, for example:
  - backend/app/services/ai/turbo_quant_service.py
  - optionally backend/app/services/ai/turbo_quant_runtime.py
That service should answer:
- Was TurboQuant requested?
- Is it supported on the selected runtime/provider?
- Was it actually applied?
- What metrics should be surfaced?
API contract location
Primary contract change should be on /api/v1/omni-rag/stream.
Request addition:
{
  "query": "string",
  "session_id": "optional",
  "strategy": "optional",
  "image_urls": [],
  "image_ids": [],
  "turbo_quant": {
    "enabled": true,
    "mode": "auto",
    "target": "auto",
    "variant": "prod",
    "bit_width": 4
  }
}
Metadata event addition:
{
  "type": "metadata",
  "turbo_quant": {
    "requested": true,
    "applied": false,
    "provider": "groq",
    "fallback_reason": "provider_unsupported"
  }
}
Later metadata events may update with actual metrics:
{
  "type": "metadata",
  "turbo_quant": {
    "requested": true,
    "applied": true,
    "provider": "ollama",
    "variant": "prod",
    "bit_width": 4,
    "compression_ratio": 4.0,
    "estimated_memory_saved_mb": 512,
    "quality_score": 0.98,
    "first_token_overhead_ms": 42
  }
}
Backend contract changes and backward compatibility
Backward-compatible strategy:
- turbo_quant is optional in requests.
- Missing turbo_quant means current behavior.
- Unsupported providers return requested: true, applied: false, plus a fallback_reason.
- Existing clients ignore the new metadata.
- Existing history consumers ignore the new persisted field.
- No breaking changes to existing type: metadata|content|done|error SSE envelope.
Do not require changes to /api/v1/chat/stream in phase 1 unless another consumer needs TurboQuant there too.
Phased Implementation Plan
Phase 0: Capability and contract definition
Files:
- docs/features/chat/turbo-quant-integration.md
- frontend/src/services/omniRag.ts
- frontend/src/services/chat.ts
- backend/app/api/v1/omni_rag.py
- backend/app/schemas/chat.py
Tasks:
- Freeze request/response contract.
- Add typed frontend interfaces for turbo_quant.
- Add typed backend schema support for persisted TurboQuant metadata.
- Decide capability semantics for groq, ollama, and future runtimes.
Acceptance criteria:
- Contract doc reviewed.
- Frontend and backend types agree on field names and optionality.
- No UI changes yet.
- Existing streaming still works unchanged with no turbo_quant field.
Rollback path:
- Revert type additions only. No behavior change should exist in this phase.
Phase 1: Backend no-op support behind feature flag
Files:
- backend/app/api/v1/omni_rag.py
- backend/app/services/ai/router.py
- backend/app/core/config.py or existing config module
- optional backend/app/api/v1/turbo_quant.py
- optional frontend/src/services/turboQuant.ts
Tasks:
- Add backend feature flag, for example ENABLE_TURBO_QUANT_CHAT.
- Accept turbo_quant request payload.
- Evaluate runtime capability.
- Emit early metadata showing requested/applied/provider/fallback_reason.
- Persist turbo_quant into MongoDB assistant messages and expose it through /api/v1/chat/{session_id}.
Acceptance criteria:
- Request with turbo_quant does not break stream.
- Unsupported providers return explicit fallback metadata.
- Session reload shows TurboQuant metadata consistently.
- Feature disabled means backend ignores the field safely.
Rollback path:
- Turn off feature flag.
- Keep contract fields accepted but inert.
Phase 2: Runtime adapter and real application path
Files:
- backend/app/services/ai/turbo_quant_service.py
- optional backend/app/services/ai/turbo_quant.py
- backend/app/services/ai/router.py
- backend/app/services/rag/pipeline.py
- backend/app/api/v1/omni_rag.py
Tasks:
- Implement runtime adapter that can:
  - Normalize config.
  - Check provider support.
  - Apply TurboQuant only on supported runtimes.
  - Collect metrics.
- Wire runtime results into metadata events.
- Ensure fallback to non-quantized inference happens in-request if setup fails.
Acceptance criteria:
- Supported local runtime can apply TurboQuant.
- Unsupported runtimes never advertise applied: true.
- Stream remains functional if TurboQuant init fails.
- Persisted metadata reflects actual applied state.
Rollback path:
- Keep capability contract.
- Switch service into passthrough mode with applied: false.
Phase 3: Frontend controls and chat-page rendering
Files:
- frontend/src/app/(dashboard)/chat/page.tsx
- optional frontend/src/components/chat/TurboQuantPanel.tsx
- optional frontend/src/components/chat/TurboQuantBadge.tsx
- frontend/src/services/omniRag.ts
- frontend/src/services/chat.ts
- frontend/src/app/(dashboard)/chat/chat.module.css
Tasks:
- Add TurboQuant controls near the existing strategy selector or settings surface.
- Include clear enabled/unsupported/applied states.
- Send turbo_quant in omniRagService.streamQuery(...).
- Merge stream metadata into the assistant message and current runtime state.
- Render badges for:
  - enabled/requested
  - applied
  - fallback
  - compression/memory saved
- On history load, render persisted TurboQuant metadata consistently.
Acceptance criteria:
- User can toggle/configure TurboQuant without affecting standard chat flow.
- Unsupported runtime is shown non-blockingly.
- History reload preserves badges.
- No regression to research mode, file upload, image upload, or session switching.
Rollback path:
- Hide UI with frontend feature flag.
- Backend may remain deployed.
Phase 4: Verification, staging, and canary
Files:
- frontend tests under existing test folders
- backend tests under existing test folders
- Playwright specs under existing e2e folder
- observability config/tests as applicable
Tasks:
- Add unit, integration, and E2E coverage.
- Validate stream timing and message persistence.
- Run canary on supported runtime cohort only.
Acceptance criteria:
- Test matrix passes.
- Metrics stay within budget.
- No increase in stream/session error rates above threshold.
Rollback path:
- Disable feature flag.
- Route all requests through standard inference.
API And Schema Contract Plan
Request shape changes
Add optional turbo_quant to Omni-RAG request.
Validation rules:
- enabled=false allows omitted subfields.
- bit_width must be bounded, recommended 2-8.
- variant must be mse or prod.
- mode must be auto|force|off.
- target must be kv_cache|embeddings|auto.
Response and stream shape changes
Keep current SSE event shape and add optional nested metadata.
Rules:
- Only metadata events carry turbo_quant.
- done remains unchanged except optional summary fields if needed.
- error remains existing shape.
Persisted schema changes
Add optional nested field on message history:
turbo_quant: Optional[TurboQuantMetadata] = None
Recommended nested schema:
- requested: bool
- applied: bool
- provider: Optional[str]
- variant: Optional[str]
- bit_width: Optional[int]
- compression_ratio: Optional[float]
- estimated_memory_saved_mb: Optional[float]
- quality_score: Optional[float]
- fallback_reason: Optional[str]
Error semantics
- 400 for invalid TurboQuant config.
- 200 + metadata fallback for unsupported provider in auto mode.
- 422 only for malformed payload.
- 500 + SSE error event if enabled runtime fails and cannot recover.
- In auto mode, runtime failure should prefer fallback to standard inference over hard failure.
Feature flag strategy
Backend:
- ENABLE_TURBO_QUANT_CHAT
- optionally ENABLE_TURBO_QUANT_LOCAL_ONLY
Frontend:
- NEXT_PUBLIC_ENABLE_TURBO_QUANT_CHAT
Flag rules:
- Frontend flag hides controls.
- Backend flag is source of truth.
- If frontend enabled but backend disabled, backend returns applied: false and fallback_reason: feature_disabled.
UX And Behavior Plan
Loading states
- Before first metadata: no TurboQuant badge.
- After capability metadata: show TurboQuant requested or Unavailable on current runtime.
- After applied metadata: show compression and memory badges.
- Keep existing AI is thinking... state unchanged.
Error states
- Invalid config: inline settings error, no stream attempt.
- Unsupported provider: non-blocking badge/toast, continue normal inference.
- Runtime init failure: continue non-quantized if possible and show fallback badge.
- Stream failure: preserve current error handling and partial content behavior.
Edge cases
- New session creation mid-stream.
- Session switch during or after stream.
- Reloading a session with old messages that lack turbo_quant.
- Deep research mode should ignore TurboQuant controls unless explicitly supported later.
- Image/file uploads should not alter TurboQuant config.
- Regenerate should reuse prior TurboQuant settings for that turn only if still enabled.
Accessibility impacts
- Toggle, select, and sliders need labels and keyboard support.
- Status badges need text labels, not color-only meaning.
- Fallback and unsupported states should be announced in accessible text.
- Do not rely on tooltip-only explanations.
Testing And Verification Plan
Unit tests
Frontend:
- omniRagService request serialization with and without turbo_quant
- SSE parsing for TurboQuant metadata
- message merge logic for repeated metadata updates
- UI state transitions for requested/applied/fallback
Backend:
- request validation
- capability detection by provider
- fallback behavior in auto
- persistence/hydration of turbo_quant
- no-op behavior when flag disabled
Integration tests
Backend API:
- /api/v1/omni-rag/stream without TurboQuant
- /api/v1/omni-rag/stream with valid TurboQuant on unsupported provider
- /api/v1/omni-rag/stream with supported provider mock
- /api/v1/chat/{session_id} returns persisted TurboQuant metadata
Frontend integration:
- page sends correct payload
- badges update across metadata events
- session reload renders same metadata
Playwright E2E matrix
Happy path:
- TurboQuant enabled, supported runtime, successful stream, history reload
Negative path:
- invalid config blocked client-side
- provider unsupported but chat still succeeds
- backend feature disabled while frontend flag on
- stream error after initial metadata
Edge cases:
- create new chat with TurboQuant enabled
- switch sessions after a TurboQuant message
- regenerate last message
- upload image or document then send with TurboQuant enabled
- mobile viewport layout for controls
- accessibility keyboard navigation
Explicit streaming and session checks
- First metadata arrives before meaningful content.
- requested can differ from applied.
- Partial stream content is preserved on fallback.
- Final message persists same TurboQuant summary shown during stream.
- Refreshing the page and reopening the session shows the same state.
Performance And Reliability
Latency budget
Initial go/no-go targets:
- p95 added request-validation overhead: < 10ms
- p95 first-token regression on supported runtime: <= 150ms
- no more than 10% regression in tokens/sec on supported runtime
- no more than 1% increase in stream error rate
Fallback behavior
Order:
1. Validate config
2. Evaluate provider capability
3. If unsupported and mode=auto, continue standard inference
4. If supported but TurboQuant init fails, downgrade to standard inference and emit fallback metadata
5. Only hard-fail if mode=force and explicit product requirement says failure is preferable to fallback
Retry strategy
- No blind retries on streaming start after content has begun.
- One bounded retry for runtime initialization before falling back.
- No frontend auto-resend of the user message.
Observability metrics
Add and monitor:
- turbo_quant_requested_total
- turbo_quant_applied_total
- turbo_quant_fallback_total
- turbo_quant_invalid_config_total
- turbo_quant_init_ms
- chat_first_token_ms
- chat_stream_duration_ms
- chat_stream_error_total
- chat_session_reload_mismatch_total
- turbo_quant_compression_ratio
- turbo_quant_estimated_memory_saved_mb
Segment by:
- provider
- variant
- bit width
- strategy
- success/fallback reason
Risk Register
1. Provider support mismatch
Mitigation: capability detection and explicit applied=false
Go/no-go: no production launch if Groq path can falsely report active TurboQuant
2. Chat page regression from added state/UI
Mitigation: local typed state, minimal extraction, feature flag
Go/no-go: no regressions in send, switch session, upload, research mode
3. SSE contract drift
Mitigation: typed event schema and integration tests
Go/no-go: metadata parsing must be stable across repeated events
4. Persistence/schema mismatch
Mitigation: nested optional turbo_quant field in backend and frontend types
Go/no-go: session reload must reproduce runtime badge state for completed messages
5. Runtime instability on supported local engines
Mitigation: bounded init retry and in-request fallback
Go/no-go: stream error rate cannot materially exceed control
6. Misleading quality/performance claims
Mitigation: display only backend-reported metrics, never inferred frontend estimates
Go/no-go: metrics must come from provider/runtime layer
Implementation Checklist
Owner	File
Backend API	backend/app/api/v1/omni_rag.py
Backend API	backend/app/schemas/chat.py
Backend Runtime	backend/app/services/ai/router.py
Backend Runtime	backend/app/services/ai/turbo_quant_service.py
Backend Runtime	backend/app/services/rag/pipeline.py
Backend Platform	config module
Frontend Service	frontend/src/services/omniRag.ts
Frontend Service	frontend/src/services/chat.ts
Frontend UI	frontend/src/app/(dashboard)/chat/page.tsx
Frontend UI	frontend/src/app/(dashboard)/chat/chat.module.css
Frontend UI	optional new chat component files
QA	Playwright specs
Observability	existing metrics/logging modules
Final Rollout Plan
Staging validation
- Enable backend flag in staging only.
- Run against both unsupported provider path and supported local-runtime path.
- Verify session reload, streaming, and fallback.
- Compare first-token latency and stream error rate versus baseline.
Canary strategy
1. Internal users only.
2. Supported-runtime cohort only.
3. 5% of eligible chat sessions.
4. 25% after 24 hours with stable metrics.
5. 100% of eligible runtime cohort.
6. Reassess Groq path separately; do not equate request support with real application support.
Production monitoring
Watch:
- applied/requested ratio
- fallback rate by provider
- stream error rate
- first-token latency
- history hydration issues
- user-visible complaints around degraded answer quality
Rollback triggers
- stream error rate increases by >1%
- p95 first-token latency regression exceeds budget
- applied sessions show quality degradation above agreed threshold
- session reload loses or corrupts TurboQuant metadata
- provider reports false-positive applied=true
Ready For Build
- [ ] Contract for turbo_quant request and metadata is reviewed by frontend and backend owners.
- [ ] Backend can distinguish requested from applied for every provider path.
- [ ] Unsupported providers fall back without breaking the stream.
- [ ] Chat history persists and reloads TurboQuant metadata correctly.
- [ ] Frontend controls are hidden behind a feature flag.
- [ ] Deep research mode is unaffected.
- [ ] Unit and integration tests cover happy, negative, and fallback paths.
- [ ] Playwright covers streaming, session reload, and session switching.
- [ ] Staging p95 first-token latency regression is <= 150ms.
- [ ] Staging stream error rate increase is <= 1%.
- [ ] Observability dashboards expose requested/applied/fallback counts and latency.
- [ ] Canary plan and rollback owner are explicitly assigned.
One decision needs sign-off before build starts: should phase 1 target real TurboQuant application only on local/self-hosted runtimes and treat Groq as fallback-only, or do you want Groq included in scope with capability reporting but no real quantization?