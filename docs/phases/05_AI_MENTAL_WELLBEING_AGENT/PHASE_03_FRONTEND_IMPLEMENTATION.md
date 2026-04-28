# Phase 03 - Frontend Implementation

## Objective

Integrate wellbeing support into Analytics UI with low-overhead polling and non-disruptive UX.

## Files to Create

- frontend/src/services/wellbeing.ts
- frontend/src/components/analytics/WellbeingBanner.tsx
- frontend/src/components/analytics/WellbeingActionCard.tsx
- frontend/src/components/analytics/PomodoroInlineTimer.tsx

## Files to Modify

- frontend/src/app/(dashboard)/analytics/page.tsx

## Work Breakdown

### 1) Service Layer

Implement strongly-typed service methods:
- checkWellbeing(period)
- startPomodoro(payload)
- logWellbeingEvent(payload)

Authentication requirement:
- Use Zustand auth token workflow from existing auth store.

### 2) Analytics Page Integration

Mount wellbeing UI:
- Position banner after analytics header and before main split panel.
- Keep all wellbeing rendering isolated to avoid full page rerenders.

### 3) UX States

Healthy:
- No intrusive UI, optional minimal status chip.

Caution/Concern:
- Compact banner with one clear action.
- Expandable card for 2-5 supportive tips.

### 4) Adaptive Polling

Policy:
- First check on mount.
- Poll only when tab is visible.
- 30m healthy, 15m caution, 10m concern.
- 60m in save-data/low-bandwidth conditions.
- Abort in-flight requests on remount/unmount.

## Exit Criteria

- Wellbeing UI appears correctly in analytics route.
- Polling behavior matches visibility and status rules.
- User actions are logged through event endpoint.
- Mobile and desktop behavior is stable.