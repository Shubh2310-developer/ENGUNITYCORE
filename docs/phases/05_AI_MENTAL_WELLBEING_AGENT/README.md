# Agent 05 Mental Wellbeing - Phase Breakdown

This folder reorganizes the integration plan from:
- [Source Guide](../../ai-agents/05_AI_MENTAL_WELLBEING_AGENT_ANALYTICS_INTEGRATION.md)

It is split into delivery phases and agent parts so implementation can be executed in order without ambiguity.

## Phase Map

1. [PHASE_01_SCOPE_AND_ARCHITECTURE.md](PHASE_01_SCOPE_AND_ARCHITECTURE.md)
2. [PHASE_02_BACKEND_IMPLEMENTATION.md](PHASE_02_BACKEND_IMPLEMENTATION.md)
3. [PHASE_03_FRONTEND_IMPLEMENTATION.md](PHASE_03_FRONTEND_IMPLEMENTATION.md)
4. [PHASE_04_API_CONTRACTS_AND_SECURITY.md](PHASE_04_API_CONTRACTS_AND_SECURITY.md)
5. [PHASE_05_PERFORMANCE_AND_DEVICE_OPTIMIZATION.md](PHASE_05_PERFORMANCE_AND_DEVICE_OPTIMIZATION.md)
6. [PHASE_06_TESTING_ROLLOUT_AND_EXECUTION.md](PHASE_06_TESTING_ROLLOUT_AND_EXECUTION.md)

## Agent Parts Map

- [PARTS_BREAKDOWN.md](PARTS_BREAKDOWN.md)

## Target Integration Locations

- Frontend route: frontend/src/app/(dashboard)/analytics/page.tsx
- Backend entry: backend/app/main.py
- API domain: backend/app/api/v1/wellbeing.py
- Frontend service: frontend/src/services/wellbeing.ts

## Delivery Rule

Finish each phase with its exit criteria before starting the next phase.