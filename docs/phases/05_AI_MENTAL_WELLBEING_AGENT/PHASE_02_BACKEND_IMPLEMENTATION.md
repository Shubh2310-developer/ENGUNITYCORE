# Phase 02 - Backend Implementation

## Objective

Implement Agent 05 backend core: schemas, risk logic, and authenticated wellbeing routes.

## Files to Create

- backend/app/schemas/wellbeing_agent.py
- backend/app/agents/wellbeing_agent.py
- backend/app/api/v1/wellbeing.py

## Files to Modify

- backend/app/main.py (router registration)

## Work Breakdown

### 1) Schemas and Contracts

Define:
- WellbeingSignal enum
- InterventionType enum
- WellbeingCheck response
- PomodoroSession request
- WellbeingEventLog request
- WellbeingInteractionEvent payload

### 2) Agent Logic

Implement scoring over:
- Late-night event density
- Error and retry frustration ratio
- Session marathon behavior
- Cumulative overwork window

Apply policy controls:
- Intervention cooldown
- Severity-based recommendations
- Safe fallback when data is sparse

### 3) API Endpoints

Create endpoints:
- GET /api/v1/wellbeing/check
- POST /api/v1/wellbeing/pomodoro
- POST /api/v1/wellbeing/event

Auth and scoping:
- Use current authenticated user context.
- Enforce strict per-user visibility.

### 4) App Registration

Register router in backend/app/main.py under /api/v1/wellbeing.

## Exit Criteria

- Endpoints respond with validated schema.
- User scoping is enforced.
- Router is visible in OpenAPI.
- Backend unit/API tests for wellbeing pass.