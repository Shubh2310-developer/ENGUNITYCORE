# Turbo Quant Full Implementation Plan for Chat Page

Date: 2026-04-15
Owner scope: Frontend chat route + Omni-RAG stream + chat history persistence
Primary target: `frontend/src/app/(dashboard)/chat/page.tsx`
Related feature reference: `docs/features/chat/turbo-quant-integration.md`

---

## 1) Goal and Success Criteria

### Goal
Implement Turbo Quant as a first-class, optional capability in the existing chat flow, not as a separate chat mode, so users can request quantized inference and clearly see whether it was actually applied.

### Success criteria
1. Chat remains functional for all existing users when Turbo Quant is off.
2. Turbo Quant controls are visible only behind feature flags.
3. Request payload supports a typed `turbo_quant` object.
4. SSE metadata distinguishes `requested` vs `applied`.
5. Message history persists Turbo Quant metadata and re-renders it on session reload.
6. Unsupported providers never claim `applied=true`.
7. Deep research flow remains unaffected.

### Non-goals (phase 1)
1. No new standalone chat page.
2. No breaking SSE shape change.
3. No forced provider migration.
4. No frontend-only fake quantization metrics.

---

## 2) What Exists Today (Codebase-Factual)

### Frontend chat route
- `frontend/src/app/(dashboard)/chat/page.tsx`
- Already handles:
  - session creation/switch/delete
  - Omni-RAG streaming via `omniRagService.streamQuery(...)`
  - deep research mode and events
  - metadata badges (`strategy`, `confidence`, `memory_active`, etc.)
  - image/file uploads

### Frontend service contracts
- `frontend/src/services/omniRag.ts`
  - `OmniRAGRequest` currently has `query`, `session_id`, `strategy`, `image_urls`, `image_ids`.
  - `streamQuery(...)` parses SSE events as `any`.
- `frontend/src/services/chat.ts`
  - `Message` interface supports many metadata fields but no typed Turbo Quant block yet.

### Backend stream endpoint
- `backend/app/api/v1/omni_rag.py`
  - `POST /api/v1/omni-rag/stream`
  - emits `metadata`, `content`, `done`, `error` SSE events
  - persists assistant/user messages to Mongo
  - updates SQL chat session title and timestamp

### Report signals to respect
- Existing reports show prior instability in chat streams/session creation.
- Other reports show green runs in separate passes.
- Conclusion: Turbo Quant rollout must include strict gating and fallback behavior, not optimistic assumptions.

---

## 3) Architecture Decision

### Decision
Integrate Turbo Quant as an optional extension of current Omni-RAG request/metadata contracts.

### Why
1. Lowest regression risk: reuse existing stream/session architecture.
2. Best user trust: expose real runtime state (`requested` is not always `applied`).
3. Works with mixed providers: supported providers can apply quant; unsupported providers fall back without killing chat.

### Key constraint
Current routing often uses Groq-hosted inference. Real KV-cache quantization may only be valid on supported local/self-hosted runtimes. Therefore the implementation must provide truthful capability metadata.

---

## 4) Contract Specification (LLM-Ready)

## 4.1 Request contract (frontend -> backend)

Add optional `turbo_quant` to Omni-RAG stream request:

```json
{
  "query": "Explain retrieval strategies",
  "session_id": "optional-session-id",
  "strategy": "adaptive",
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
```

Rules:
1. `turbo_quant` is optional.
2. `mode`: `auto | force | off`
3. `target`: `kv_cache | embeddings | auto`
4. `variant`: `mse | prod`
5. `bit_width`: integer in range `2..8`

## 4.2 SSE metadata contract

Turbo Quant details must be emitted in metadata events:

```json
{
  "type": "metadata",
  "session_id": "...",
  "turbo_quant": {
    "requested": true,
    "applied": false,
    "provider": "groq",
    "fallback_reason": "provider_unsupported"
  }
}
```

Later metadata updates may include runtime metrics:

```json
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
```

Rules:
1. `requested` and `applied` are always explicit when `turbo_quant.enabled=true` was requested.
2. `applied=true` only when backend runtime confirms activation.
3. `fallback_reason` is required when `requested=true` and `applied=false`.

## 4.3 Persisted message metadata contract

Persist on assistant messages in chat history:

```json
"turbo_quant": {
  "requested": true,
  "applied": false,
  "provider": "groq",
  "fallback_reason": "provider_unsupported"
}
```

This field is optional for old messages.

---

## 5) Frontend Implementation Plan (Target: Chat Page)

### 5.1 Types first (no UI yet)

### Files
1. `frontend/src/services/omniRag.ts`
2. `frontend/src/services/chat.ts`

### Add interfaces

```ts
export type TurboQuantMode = 'auto' | 'force' | 'off';
export type TurboQuantTarget = 'kv_cache' | 'embeddings' | 'auto';
export type TurboQuantVariant = 'mse' | 'prod';

export interface TurboQuantRequest {
  enabled: boolean;
  mode: TurboQuantMode;
  target: TurboQuantTarget;
  variant: TurboQuantVariant;
  bit_width: 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export interface TurboQuantRuntimeMetadata {
  requested: boolean;
  applied: boolean;
  provider?: string;
  variant?: TurboQuantVariant;
  bit_width?: number;
  compression_ratio?: number;
  estimated_memory_saved_mb?: number;
  quality_score?: number;
  first_token_overhead_ms?: number;
  fallback_reason?: string;
}
```

### Extend request
- Add `turbo_quant?: TurboQuantRequest` to `OmniRAGRequest`.

### Extend message model
- Add `turbo_quant?: TurboQuantRuntimeMetadata` to `Message` in `chat.ts`.

### SSE typing upgrade
Replace `any` parsing with discriminated union event typing:
1. `MetadataEvent`
2. `ContentEvent`
3. `DoneEvent`
4. `ErrorEvent`

This is mandatory to avoid silent contract drift.

---

### 5.2 Chat page state integration

### File
- `frontend/src/app/(dashboard)/chat/page.tsx`

### Add local state

```ts
const [turboQuantEnabled, setTurboQuantEnabled] = useState(false);
const [turboQuantConfig, setTurboQuantConfig] = useState<TurboQuantRequest>({
  enabled: false,
  mode: 'auto',
  target: 'auto',
  variant: 'prod',
  bit_width: 4,
});
```

### Send payload update
In `handleSend`, include:
- `turbo_quant: turboQuantEnabled ? turboQuantConfig : undefined`

### Metadata merge update
In metadata handler branch:
- merge `event.turbo_quant` into assistant message
- never overwrite with `undefined`
- preserve previous values until replaced

### UI controls placement
Add controls inside current input action toolbar, near strategy selector:
1. Toggle: Turbo Quant on/off
2. Mode select
3. Bit width select
4. Variant select

Do not introduce a full modal in phase 1.

### Badge rendering
In existing metadata badge area, render:
1. `TurboQuant Requested`
2. `TurboQuant Applied`
3. `Fallback: <reason>`
4. `x<compression_ratio>`
5. `<memory_saved>MB saved`

### Session reload behavior
When loading a session via `chatService.getSession(...)`, message badges must re-render from persisted `message.turbo_quant`.

### Deep research isolation
Turbo Quant controls must be ignored during `/research` flow unless explicitly enabled in a future phase.

---

### 5.3 Styling updates

### File
- `frontend/src/app/(dashboard)/chat/chat.module.css`

Add minimal classes only:
1. turbo toggle
2. turbo config select
3. turbo status badge (requested/applied/fallback variants)

Do not restyle unrelated chat layout.

---

## 6) Backend Implementation Plan

### 6.1 Request and validation layer

### File
- `backend/app/api/v1/omni_rag.py`

Add nested request model in same module or schema module:
1. `TurboQuantRequestSchema`
2. Add optional `turbo_quant` field to `OmniRAGRequest`

Validation rules:
1. reject malformed mode/target/variant with `422`
2. reject invalid bit width with `422`

---

### 6.2 Capability evaluation service

### New file
- `backend/app/services/ai/turbo_quant_service.py`

Responsibilities:
1. normalize config
2. detect provider/runtime support
3. decide applied vs fallback
4. produce telemetry-friendly metadata object

Suggested API:

```py
class TurboQuantService:
    def evaluate_request(self, provider: str, config: dict) -> dict: ...
    def maybe_apply(self, runtime_ctx: dict, config: dict) -> dict: ...
```

Expected output shape:
- always includes `requested`, `applied`
- includes `fallback_reason` when not applied
- optionally includes runtime metrics

---

### 6.3 Stream event integration

### File
- `backend/app/api/v1/omni_rag.py`

Inside `event_generator()`:
1. evaluate Turbo Quant early
2. emit initial metadata with turbo state before main content
3. pass applied config to pipeline/router only if supported
4. emit updated metadata if metrics become available
5. persist `turbo_quant` inside assistant message payload

Important:
- if provider unsupported and mode=`auto`, continue normal stream
- if mode=`force` and cannot apply, return SSE `error` or explicit fail by product decision

---

### 6.4 Provider/router integration

### Files
1. `backend/app/services/ai/router.py`
2. optionally `backend/app/services/rag/pipeline.py`

Requirements:
1. router exposes actual provider identity used for this request
2. Turbo Quant service receives provider identity
3. final metadata reflects actual runtime path, not requested preference

---

### 6.5 Feature flags

### Backend flag
- `ENABLE_TURBO_QUANT_CHAT`

### Frontend flag
- `NEXT_PUBLIC_ENABLE_TURBO_QUANT_CHAT`

Behavior matrix:
1. FE off + BE off: no feature surface
2. FE on + BE off: visible controls but server returns `applied=false`, `fallback_reason=feature_disabled`
3. FE on + BE on: full behavior

---

## 7) Full-Pace Delivery Plan (Professional Execution)

## Day 0 - Contract freeze (parallel)
1. finalize request/metadata/history schema
2. define provider support policy
3. define force-mode policy

Deliverable: approved contract section in docs

## Day 1 - Backend phase A
1. request parsing + validation
2. capability service scaffold
3. initial metadata emit
4. history persistence field

Deliverable: backend streams still pass without UI changes

## Day 2 - Frontend phase A
1. TypeScript model extensions
2. typed SSE parser
3. page state wiring
4. non-invasive controls + badges

Deliverable: visible controls behind flag, no regression to base chat

## Day 3 - Runtime phase B
1. provider-aware apply path
2. runtime metrics emission
3. fallback hardening

Deliverable: truthful applied/fallback behavior

## Day 4 - QA + perf + canary prep
1. unit/integration/E2E matrix
2. telemetry dashboard checks
3. rollback switch drill

Deliverable: go/no-go checklist completed

---

## 8) Test Plan (Must Pass)

### Frontend unit
1. request serialization with/without `turbo_quant`
2. SSE metadata merge idempotency
3. badge rendering states (requested/applied/fallback)
4. session reload preserves Turbo Quant badges

### Backend unit
1. validation of turbo config
2. provider capability outcomes
3. auto-mode fallback behavior
4. persistence payload includes turbo metadata

### Integration tests
1. `/api/v1/omni-rag/stream` with no turbo field
2. with turbo on unsupported provider
3. with turbo on supported provider mock
4. `/api/v1/chat/{session_id}` returns turbo metadata

### Playwright E2E
1. enable Turbo Quant + send message + observe metadata badges
2. unsupported provider fallback still returns assistant content
3. switch session and return; badges stay accurate
4. create new chat + send with Turbo Quant enabled
5. verify deep research path unchanged

### Performance checks
1. first token latency regression within budget
2. stream error rate does not rise above threshold
3. no memory leak from metadata state updates

---

## 9) Observability and Rollout Safety

### Metrics to add
1. `turbo_quant_requested_total`
2. `turbo_quant_applied_total`
3. `turbo_quant_fallback_total`
4. `turbo_quant_invalid_config_total`
5. `chat_first_token_ms`
6. `chat_stream_error_total`
7. `turbo_quant_compression_ratio`
8. `turbo_quant_estimated_memory_saved_mb`

Segment by:
1. provider
2. strategy
3. variant
4. bit width
5. fallback reason

### Rollout
1. staging only
2. internal canary cohort
3. 5% -> 25% -> 100% eligible runtime cohort
4. keep kill-switch ready

### Rollback triggers
1. stream error increase > 1%
2. p95 first-token latency regression > agreed budget
3. metadata persistence mismatch on reload
4. false `applied=true` on unsupported provider

---

## 10) Recommended Agents and Skills from .claude (Professional Setup)

## 10.1 Agent execution stack

1. `agent-organizer`
   - Use for workstream split, dependency ordering, and pace control.
2. `backend-developer`
   - Implement API, stream, and persistence changes.
3. `frontend-developer`
   - Integrate controls, state, and badges in chat page.
4. `typescript-pro`
   - Harden typed event contracts and request models.
5. `code-reviewer`
   - Verify contract correctness and regression risk.
6. `playwright-tester`
   - Execute and stabilize Turbo Quant E2E matrix.
7. `performance-monitor`
   - Validate latency/error impact and rollout budgets.
8. `backend-architect` (optional, advisory)
   - Final pass on provider capability model and fallback semantics.

## 10.2 Skill activation stack

1. `.claude/skills/brainstorming`
   - Requirement clarification and option trade-off framing.
2. `.claude/skills/subagent-driven-development`
   - Parallel implementation orchestration.
3. `.claude/skills/backend-dev-guidelines`
   - Backend endpoint/service conventions and safety.
4. `.claude/skills/qa-test-planner`
   - Build full test matrix and pass/fail criteria.
5. `.claude/skills/e2e-page-validator`
   - Validate full chat page behavior under real browser flows.
6. `.claude/skills/review-changes.md`
   - Final PR-quality review process.
7. `.claude/skills/refactor-safely.md`
   - Keep changes minimal and avoid collateral refactors.
8. `.claude/skills/agent-memory-mcp`
   - Persist decisions/lessons for future runs.

Optional add-ons:
1. `.claude/skills/context7-auto-research` for runtime/library docs refresh.
2. `.claude/skills/senior-fullstack` for high-level architecture synthesis.

---

## 11) Implementation Order (Copy/Paste for Any LLM)

1. Extend frontend types in `omniRag.ts` and `chat.ts`.
2. Extend backend request schema in `omni_rag.py`.
3. Add backend capability service (`turbo_quant_service.py`).
4. Emit Turbo Quant metadata at stream start.
5. Persist Turbo Quant metadata in assistant message writes.
6. Render Turbo Quant controls in chat toolbar (flag-gated).
7. Merge stream metadata into assistant message state.
8. Render requested/applied/fallback badges.
9. Add unit/integration tests for contract + fallback.
10. Add Playwright scenarios for stream/session/reload.
11. Validate staging telemetry and canary thresholds.
12. Roll out progressively with kill switch.

---

## 12) Execution Commands (Conda-Only Workflow)

Note: keep conda env policy (`engunity`) and avoid venv.

Backend targeted tests:

```bash
conda run -n engunity pytest backend/tests/ -v -k "chat or omni or turbo"
```

Frontend type check:

```bash
cd frontend && conda run -n engunity npx tsc --noEmit
```

Frontend lint:

```bash
cd frontend && conda run -n engunity npm run lint
```

Turbo Quant E2E slice:

```bash
cd frontend && conda run -n engunity npx playwright test e2e/chat.spec.ts --project=chromium --headed --reporter=list
```

---

## 13) Definition of Done

1. Feature flag off path is fully safe and unchanged.
2. Feature flag on path shows controls and truthful runtime status.
3. Request/stream/history contracts are fully typed and aligned.
4. Unsupported providers produce fallback metadata, not failures.
5. Session reload reproduces Turbo Quant state exactly.
6. Deep research and uploads are unaffected.
7. Unit + integration + E2E checks pass for Turbo Quant scope.
8. Telemetry confirms no unacceptable latency/error regressions.

---

## 14) Final Build Decision Gate

Before implementation starts, one explicit product choice is required:

Do we scope real Turbo Quant application to supported local/self-hosted runtimes first (with Groq path as fallback-only), or do we attempt provider-agnostic force mode in phase 1?

Recommended professional choice: local/self-hosted-first with explicit fallback on unsupported providers.
