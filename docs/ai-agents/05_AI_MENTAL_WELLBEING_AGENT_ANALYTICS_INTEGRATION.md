# Agent 05 Integration Guide: Mental Wellbeing in Analytics Dashboard

## 1. Objective

This guide explains how to implement Agent 05 from [docs/ai-agents/05_AI_MENTAL_WELLBEING_AGENT.md](docs/ai-agents/05_AI_MENTAL_WELLBEING_AGENT.md) directly into the Analytics workspace at [frontend/src/app/(dashboard)/analytics/page.tsx](frontend/src/app/(dashboard)/analytics/page.tsx), with production-safe performance defaults.

Primary goals:
- Detect burnout risk from real usage signals.
- Show supportive, non-intrusive interventions inside Analytics.
- Keep latency, memory, and battery impact low on all devices.
- Align with existing Supabase auth + MongoDB/analytics infrastructure.

This plan is based on current architecture in:
- [frontend/src/services/analytics.ts](frontend/src/services/analytics.ts)
- [backend/app/api/v1/analytics_complete.py](backend/app/api/v1/analytics_complete.py)
- [backend/app/models/analytics.py](backend/app/models/analytics.py)
- [backend/app/services/ai/logger.py](backend/app/services/ai/logger.py)
- [backend/app/main.py](backend/app/main.py)
- [docs/architecture/analytics-page-connected-files-deep-dive.md](docs/architecture/analytics-page-connected-files-deep-dive.md)

---

## 2. Recommended .claude Agents and Skills

Use these first for high-quality execution:

### Agents (from [.claude/agents](.claude/agents))
- [backend-developer](.claude/agents/backend-developer.md)
  - Build and harden wellbeing API endpoints, validation, and auth.
- [frontend-developer](.claude/agents/frontend-developer.md)
  - Integrate widget into Analytics UI with responsive behavior.
- [ai-engineer](.claude/agents/ai-engineer.md)
  - Tune intervention generation and model fallback behavior.
- [performance-monitor](.claude/agents/performance-monitor.md)
  - Define KPI metrics, alerts, and runtime overhead checks.

### Skills (from [.claude/skills](.claude/skills))
- [brainstorming](.claude/skills/brainstorming/SKILL.md)
  - Use before design changes.
- [ai-agents-architect](.claude/skills/ai-agents-architect/SKILL.md)
  - Set safe autonomy limits and clear failure modes.
- [backend-to-frontend-handoff-docs](.claude/skills/backend-to-frontend-handoff-docs/SKILL.md)
  - Keep API contracts explicit.
- [documentation-templates](.claude/skills/documentation-templates/SKILL.md)
  - Keep this integration document consistent and scannable.
- [frontend-design](.claude/skills/frontend-design/SKILL.md)
  - Ensure dashboard UI remains clean and intentional.

---

## 3. System-Aware Constraints and Performance Targets

Based on your current machine profile:
- OS: Linux (EndeavourOS)
- CPU: Ryzen 7 7735HS
- RAM: ~15 GB total
- GPU: RTX 4050 mobile, 6 GB VRAM

### What this means for Agent 05
- Frontend wellbeing checks must stay lightweight.
- Do not run heavy local models in the browser or on-demand for each poll.
- Prefer remote LLM generation (current Groq flow) with caching.
- Treat GPU as optional accelerator for other workloads, not a requirement for wellbeing checks.

### Performance budget (recommended)
- Wellbeing check API p95: under 120 ms (server-side cached path)
- Payload size: under 3 KB
- Client polling CPU overhead: under 1% average
- Additional memory in Analytics page: under 20 MB

---

## 4. Integration Architecture (Analytics Route First)

### High-level flow
1. Analytics page opens.
2. Client loads wellbeing status once.
3. Client runs adaptive polling only when tab is visible.
4. Backend detects risk signals from analytics and AI usage events.
5. Frontend renders a compact support banner and optional action card.
6. User actions (break started, tip dismissed) are logged for feedback loops.

### Keep integration scoped to Analytics first
Implement in [frontend/src/app/(dashboard)/analytics/page.tsx](frontend/src/app/(dashboard)/analytics/page.tsx), not global dashboard layout, to avoid broad UX impact in phase 1.

---

## 5. Files to Create and Modify

## Backend

### Create
- [backend/app/schemas/wellbeing_agent.py](backend/app/schemas/wellbeing_agent.py)
- [backend/app/agents/wellbeing_agent.py](backend/app/agents/wellbeing_agent.py)
- [backend/app/api/v1/wellbeing.py](backend/app/api/v1/wellbeing.py)

### Modify
- [backend/app/main.py](backend/app/main.py)
  - Register wellbeing router under /api/v1/wellbeing.

## Frontend

### Create
- [frontend/src/services/wellbeing.ts](frontend/src/services/wellbeing.ts)
- [frontend/src/components/analytics/WellbeingBanner.tsx](frontend/src/components/analytics/WellbeingBanner.tsx)
- [frontend/src/components/analytics/WellbeingActionCard.tsx](frontend/src/components/analytics/WellbeingActionCard.tsx)
- [frontend/src/components/analytics/PomodoroInlineTimer.tsx](frontend/src/components/analytics/PomodoroInlineTimer.tsx)

### Modify
- [frontend/src/app/(dashboard)/analytics/page.tsx](frontend/src/app/(dashboard)/analytics/page.tsx)
  - Insert wellbeing UI block after the top toolbar and before main content.

Optional phase 2 global rollout:
- [frontend/src/app/(dashboard)/layout.tsx](frontend/src/app/(dashboard)/layout.tsx)

---

## 6. Backend Implementation Plan

## 6.1 Data contracts

In [backend/app/schemas/wellbeing_agent.py](backend/app/schemas/wellbeing_agent.py), define:
- WellbeingSignal enum
- InterventionType enum
- WellbeingCheck response
- PomodoroSession request
- WellbeingEventLog request (recommended)

Add one extra schema for telemetry feedback:
- WellbeingInteractionEvent
  - event_type: viewed | dismissed | action_clicked | break_started | pomodoro_completed
  - context: analytics_tab, dataset_id, stress_score_snapshot

## 6.2 Agent logic

In [backend/app/agents/wellbeing_agent.py](backend/app/agents/wellbeing_agent.py):

Use existing data sources first:
- Mongo: ai_logs (from [backend/app/services/ai/logger.py](backend/app/services/ai/logger.py))
- Postgres: analytics_sessions (from [backend/app/models/analytics.py](backend/app/models/analytics.py))

Signal strategy for day 1:
- late_night:
  - more than N events between 23:00-05:00 in period
- frustration:
  - high ratio of failed actions (query errors, failed analysis, repeated retries)
- marathon:
  - long active session window inferred from event spread with short idle gaps
- overwork:
  - cumulative active window over threshold in 24h

Design guardrails:
- max 1 intervention every 2 hours unless concern level is high
- never block user workflows
- all messages supportive, non-medical, and non-diagnostic

## 6.3 API router

In [backend/app/api/v1/wellbeing.py](backend/app/api/v1/wellbeing.py):
- GET /check?period=24h
- POST /pomodoro
- POST /event

Auth:
- Use existing get_current_user dependency.
- Keep user scope strict and server-side.

## 6.4 Router registration

In [backend/app/main.py](backend/app/main.py):
- include wellbeing router with prefix /api/v1/wellbeing.

---

## 7. Frontend Integration in Analytics

## 7.1 Service layer

Create [frontend/src/services/wellbeing.ts](frontend/src/services/wellbeing.ts):
- checkWellbeing(period)
- startPomodoro(payload)
- logWellbeingEvent(payload)

Auth integration:
- Use Zustand token from [frontend/src/stores/authStore.ts](frontend/src/stores/authStore.ts).
- Do not read token directly from localStorage in component code.

## 7.2 Render location

In [frontend/src/app/(dashboard)/analytics/page.tsx](frontend/src/app/(dashboard)/analytics/page.tsx):
- Render WellbeingBanner right after header and before main split-panel.

Reason:
- User sees support status early.
- Banner remains route-scoped.
- Minimal disruption to existing tabs and chart workflow.

## 7.3 Adaptive polling policy (critical for all-device support)

Implement this client policy:
- On mount: run one check.
- Poll only when document.visibilityState is visible.
- Default interval: 30 minutes.
- If caution: 15 minutes.
- If concern: 10 minutes.
- If save-data mode or low-bandwidth network: 60 minutes.
- On unmount: clear timers and abort in-flight requests.

Use AbortController to prevent stale updates.

## 7.4 UX behavior

Healthy:
- No banner by default (or tiny passive status chip).

Caution/Concern:
- Show compact banner with message and one action.
- Optional expandable card with 2-5 tips.
- Pomodoro can open inline timer without route change.

Accessibility:
- Keyboard focusable actions
- aria-live polite updates
- color + icon + text (not color-only)
- respects reduced motion preference

---

## 8. API Contract for Frontend Handoff

## GET /api/v1/wellbeing/check?period=24h

Success response example:
{
  "signals_detected": ["late_night", "frustration"],
  "overall_status": "caution",
  "stress_score": 5.0,
  "intervention": {
    "type": "cooldown",
    "message": "Take a 10-minute reset and retry with a fresh pass.",
    "action": "start_break_timer",
    "duration": 10
  },
  "message": "You are pushing hard today. A short break now will improve focus.",
  "tips": [
    "Use a 25/5 focus cycle.",
    "If errors repeat, step away for 5 minutes.",
    "Sleep quality directly impacts debugging speed."
  ]
}

## POST /api/v1/wellbeing/pomodoro

Request example:
{
  "focus_minutes": 25,
  "break_minutes": 5,
  "rounds": 4,
  "topic": "Correlation analysis"
}

Response example:
{
  "status": "started",
  "focus_minutes": 25,
  "break_minutes": 5,
  "topic": "Correlation analysis"
}

## POST /api/v1/wellbeing/event

Request example:
{
  "event_type": "break_started",
  "context": {
    "page": "analytics",
    "active_tab": "insights",
    "dataset_id": 123
  }
}

Response example:
{
  "ok": true
}

---

## 9. Data Safety and Auth Notes

- Keep all endpoints authenticated with current user context.
- Store only interaction metadata and aggregate behavior signals.
- Do not store sensitive free-text content unless required.
- Keep wellbeing messaging explicitly non-clinical.
- Prefer Supabase-backed identity/session flow already in project.

---

## 10. Cross-Device Optimization Checklist

Frontend:
- Memoize wellbeing components.
- Avoid re-rendering entire analytics tree on wellbeing updates.
- Lazy-load optional Pomodoro component.
- Keep CSS and animations minimal.

Backend:
- Cache wellbeing check results per user for short TTL (for example, 3-5 minutes).
- Use indexed timestamp fields in Mongo queries.
- Bound event scans by period and max document count.

Network:
- Small payloads only.
- No polling when tab hidden.
- Exponential backoff on repeated failures.

Fallback behavior:
- If wellbeing API fails, hide banner and continue analytics normally.

---

## 11. Rollout Plan

Phase 1 (analytics-only):
- Backend endpoints live.
- Banner integrated in analytics page.
- Basic telemetry + adaptive polling.

Phase 2 (broader dashboard):
- Promote widget to [frontend/src/app/(dashboard)/layout.tsx](frontend/src/app/(dashboard)/layout.tsx) if user feedback is positive.

Phase 3 (intelligence):
- Improve signal quality using query failure patterns and session continuity.
- Add daily trend summaries.

---

## 12. Validation and Testing

Backend tests:
- Unit test stress scoring and signal detection.
- API tests for auth, happy-path, invalid period, empty data.

Frontend tests:
- Banner renders only for caution/concern.
- Polling pauses when tab hidden.
- Actions emit /event logs.
- Timer controls work on desktop and mobile viewports.

Manual performance checks:
- Verify no visible lag in Analytics interactions.
- Verify network request frequency under hidden tab.
- Verify low-end device behavior remains stable.

Suggested commands:
- conda activate engunity
- cd backend && pytest tests/ -k wellbeing -v
- cd frontend && npm run lint
- cd frontend && npx tsc --noEmit
- cd frontend && npm run test -- wellbeing

---

## 13. Suggested Execution Order (Fastest Safe Path)

1. Implement backend schema + agent + router.
2. Add frontend wellbeing service and banner component.
3. Mount banner in [frontend/src/app/(dashboard)/analytics/page.tsx](frontend/src/app/(dashboard)/analytics/page.tsx).
4. Add adaptive polling + visibility controls.
5. Add telemetry endpoint and action logging.
6. Run targeted tests and manual perf checks.
7. Roll out behind feature flag.

Feature flags (recommended):
- WELLBEING_AGENT_ENABLED (backend)
- NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED (frontend)

This keeps deployment safe while you tune thresholds from real usage data.
