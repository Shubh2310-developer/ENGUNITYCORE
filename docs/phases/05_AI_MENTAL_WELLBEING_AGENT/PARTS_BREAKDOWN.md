# Agent 05 - Parts Breakdown

This file breaks Agent 05 into functional parts that map directly to backend and frontend workstreams.

## Part A - Signal Detection Engine

Purpose:
- Detect burnout-related usage patterns from real analytics behavior.

Primary signals:
- late_night
- frustration
- marathon
- overwork

Data sources:
- Mongo AI logs
- Postgres analytics sessions

Suggested implementation file:
- backend/app/agents/wellbeing_agent.py

## Part B - Intervention Policy Engine

Purpose:
- Convert signal intensity into safe, non-intrusive interventions.

Rules:
- Max one intervention every 2 hours unless concern is high.
- Never block user workflow.
- Messaging must remain supportive and non-clinical.

Suggested implementation file:
- backend/app/agents/wellbeing_agent.py

## Part C - Wellbeing API Surface

Purpose:
- Expose check, event logging, and pomodoro controls to frontend.

Endpoints:
- GET /api/v1/wellbeing/check
- POST /api/v1/wellbeing/pomodoro
- POST /api/v1/wellbeing/event

Suggested implementation files:
- backend/app/api/v1/wellbeing.py
- backend/app/schemas/wellbeing_agent.py

## Part D - Analytics UI Wellbeing Layer

Purpose:
- Show route-scoped wellbeing support in Analytics page.

Components:
- WellbeingBanner
- WellbeingActionCard
- PomodoroInlineTimer

Suggested implementation files:
- frontend/src/components/analytics/WellbeingBanner.tsx
- frontend/src/components/analytics/WellbeingActionCard.tsx
- frontend/src/components/analytics/PomodoroInlineTimer.tsx

## Part E - Client Orchestration and Polling

Purpose:
- Fetch wellbeing state with minimal runtime overhead.

Policies:
- Poll only while page is visible.
- Dynamic interval based on risk level.
- Abort stale requests.

Suggested implementation files:
- frontend/src/services/wellbeing.ts
- frontend/src/app/(dashboard)/analytics/page.tsx

## Part F - Telemetry and Feedback Loop

Purpose:
- Capture intervention outcomes for threshold tuning.

Events:
- viewed
- dismissed
- action_clicked
- break_started
- pomodoro_completed

Suggested implementation files:
- backend/app/api/v1/wellbeing.py
- backend/app/agents/wellbeing_agent.py
- frontend/src/services/wellbeing.ts