# Phase 04 - API Contracts and Security

## Objective

Lock API payloads for frontend handoff and enforce data safety requirements.

## Contract Surface

### GET /api/v1/wellbeing/check

Response fields:
- signals_detected
- overall_status
- stress_score
- intervention
- message
- tips

### POST /api/v1/wellbeing/pomodoro

Request fields:
- focus_minutes
- break_minutes
- rounds
- topic

Response fields:
- status
- focus_minutes
- break_minutes
- topic

### POST /api/v1/wellbeing/event

Request fields:
- event_type
- context

Response fields:
- ok

## Security Requirements

- All wellbeing endpoints require authenticated user context.
- All reads/writes are user-scoped server-side.
- Do not persist sensitive free-form content unless explicitly required.
- Wellbeing content remains supportive and non-medical.

## Data Safety Requirements

- Log metadata and behavior signals only.
- Keep payloads compact and bounded.
- Avoid exposing internal implementation details in errors.

## Exit Criteria

- Frontend contract is stable and documented.
- Unauthorized access attempts are rejected.
- Security checks and auth-path tests pass.