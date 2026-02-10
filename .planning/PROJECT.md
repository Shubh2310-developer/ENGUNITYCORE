# Engunity AI Platform

## What This Is

A comprehensive AI SaaS platform that empowers consumers to solve complex problems through a suite of integrated tools. Users can interact with individual AI capabilities (Chat, Code, Image, Documents) or chain them together into linear workflows to automate multi-step tasks.

## Core Value

Users can solve "every problem" by accessing a unified suite of AI tools and combining them into automated linear workflows, without needing technical expertise.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ **Chat Interface** — Neural Chat with RAG capabilities (backend/app/api/v1/chat.py)
- ✓ **Code Studio** — Code generation and execution environment (backend/app/api/v1/code.py)
- ✓ **Image Generation** — AI image creation tools (backend/app/api/v1/images.py)
- ✓ **Document Analysis** — PDF/CSV processing and insights (backend/app/api/v1/documents.py)
- ✓ **Research Tools** — Web research capabilities (backend/app/api/v1/research.py)

### Active

<!-- Current scope. Building toward the unified workflow vision. -->

- [ ] **Linear Workflow Builder** — Visual interface to chain tools (e.g., Chat output → Image generation)
- [ ] **Unified Dashboard** — Single pane of glass for managing all tools and workflows
- [ ] **Freemium Monetization** — Subscription tiers and usage limits integration
- [ ] **Workflow Execution Engine** — Backend orchestration for chained tasks

### Out of Scope

<!-- Explicit boundaries. -->

- **Complex Branching Logic** — v1 focuses on linear chains (A->B->C), not complex conditionals
- **Autonomous Agents** — v1 focuses on user-defined linear workflows, not fully autonomous loops
- **Enterprise SSO** — v1 focuses on Consumer/Prosumer users

## Context

**Technical Environment:**
- **Backend:** Python (FastAPI) with Celery for async tasks
- **Frontend:** Next.js (React)
- **AI:** Multi-model support (Claude, GPT, etc.) via unified API
- **Infrastructure:** Docker/Kubernetes ready

**Current State:**
- Strong individual tools exist (Chat, Code, Image, Research).
- The "connective tissue" (Workflows) is the missing link to the "solve every problem" vision.

## Constraints

- **Type**: Tech Stack — Must use existing FastAPI/Next.js architecture
- **Type**: Monetization — Must support Freemium (free tier + paid upgrades)
- **Type**: User Experience — Must be accessible to Consumers (low technical barrier)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Linear Workflows** | Chosen over complex graphs for v1 to ensure usability for consumers. | — Pending |
| **Unified Monolith** | Keeping tools in one repo/deploy to simplify "suite" integration. | — Pending |

---
*Last updated: 2026-02-10 after project initialization*
