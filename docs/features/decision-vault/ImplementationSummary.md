# Decision Vault: End-to-End Implementation Research & Execution Plan

## 1. Executive Summary
The Decision Vault is the "intelligence layer" of Engunity AI. It transitions the platform from a generative tool into a decision-making system. It captures the "Why" behind actions taken in Chat, Research, Code, and Analytics modules, providing a structured, defensible, and traceable history of professional thought processes.

## 2. Technical Stack Overview
### Backend (Python/FastAPI)
- **Framework**: FastAPI for high-performance async API endpoints.
- **Relational DB**: PostgreSQL (via SQLAlchemy) for structured metadata, constraints, and tradeoff matrices.
- **Document DB**: MongoDB (via Motor) for high-volume "reasoning traces" and event logs.
- **Validation**: Pydantic v2 for strict data modeling.
- **Security**: JWT-based authentication integrated with the global `current_user` dependency.

### Frontend (TypeScript/Next.js)
- **Framework**: Next.js 14 (App Router) with `use client` components.
- **Styling**: CSS Modules (`decisionvault.module.css`) for the "Premium White" theme.
- **Icons**: `lucide-react` for consistent visual language.
- **State**: Zustand for global decision state and form management.
- **Charts**: `recharts` for decision velocity and calibration analytics.

## 3. Environment & Configuration
### Conda Environment (`engunity`)
Ensure the following are installed in your environment:
- `fastapi`, `sqlalchemy`, `pydantic-settings`, `alembic` (Migrations)
- `motor`, `pymongo`, `certifi` (MongoDB connectivity)
- `python-multipart`, `python-jose` (Auth)

### `.env` Requirements
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/engunity
MONGODB_URL=mongodb+srv://... (Optional but recommended for traces)
MONGODB_DB_NAME=engunity

# AI Integration
GROQ_API_KEY=...
GEMINI_API_KEY=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 4. Current Implementation Status (Audit)
| Component | Status | Location |
|-----------|--------|----------|
| Database Model | **Functional** | [backend/app/models/decision.py](backend/app/models/decision.py) |
| API Router | **Functional** | [backend/app/api/v1/decisions.py](backend/app/api/v1/decisions.py) |
| Pydantic Schemas | **Functional** | [backend/app/schemas/decision.py](backend/app/schemas/decision.py) |
| Frontend Page | **Functional** | [frontend/src/app/(dashboard)/decisionvault/page.tsx](frontend/src/app/(dashboard)/decisionvault/page.tsx) |
| API Service | **Functional** | [frontend/src/services/decision.ts](frontend/src/services/decision.ts) |
| Init Script | **Ready** | [init_db_tables.py](init_db_tables.py) |

## 5. End-to-End Data Flow
1. **Trigger**: User clicks "Convert to Decision" in Chat or "Log Decision" in Research.
2. **Context Passing**: Query parameters (`?source=chat&title=...&problem=...&context=...`) pre-fill the wizard (sanitized client-side before injection).
3. **Drafting**: **7-step wizard** in `page.tsx`:
   - Step 1 — Identity (Title, Category, Confidence)
   - Step 2 — Context (Problem Statement)
   - Step 3 — Options (min. 2 alternatives with effort & risk)
   - Step 4 — Evidence (manual or simulated "Scan Project" — returns mock evidence in current implementation, so it must stay labeled as preview/demo mode unless a real scanner is added)
   - Step 5 — Analysis (6-dimension Tradeoff Matrix sliders)
   - Step 6 — AI Review (auto-triggered on Step 5 → 6 transition; calls `POST /api/v1/decisions/analyze`)
   - Step 7 — Resolution (final option, rationale, privacy, status, revisit rule)
4. **AI Review** (Step 6):
   - Calls `decisionService.analyzeDecision()` → `POST /api/v1/decisions/analyze`.
   - Returns JSON flags: `{ id, flag_type, severity, message, suggested_action }`.
   - Checks for: Optimism Bias, Sunk Cost, Missing Options, Weak Evidence, Confidence Calibration.
   - On failure, degrades gracefully: user sees error banner and can retry or skip.
5. **Persistence** (Step 7 → "Initialize Decision"):
   - `POST /api/v1/decisions/` → Metadata saved to PostgreSQL via SQLAlchemy.
   - Reasoning trace intended for MongoDB `decision_traces` collection (requires `MONGODB_URL` env var).
6. **Consumption**:
   - Kanban board displays status columns (Tentative / Confirmed / Revisited / Deprecated).
   - Analytics view computes Decision Velocity, Evidence Quality, and Reversal Rate from live data.
   - **ADR Export**: Client-side Markdown template generation → copy-to-clipboard. No file download or GitHub commit in current implementation.
   - **STAR Breakdown**: Client-side template interpolation from stored decision fields. Not a separate LLM call.

## 6. Implementation Roadmap (How to make it fully functional)

### Step 1: Database Initialization
Run the initialization script to ensure the `decisions` table exists in PostgreSQL.
```bash
python init_db_tables.py
```

### Step 2: Backend Logic Hardening
- **MongoDB Integration**: Ensure `MONGODB_URL` is set in `.env` to enable the "Reasoning Trace" feature.
- **AI Hook**: Implement a service in `backend/app/services/decision_ai.py` that uses Groq/Gemini to perform the "Adversarial Review" instead of frontend timeouts.

### Step 3: Frontend Feature Completion
- **Real Data Sync**: Keep the existing data flow, but do not describe the scan step as live until a backend scanner exists.
- **Evidence Linking**: Either keep the "Project Scan" flow explicitly in demo mode or replace it with a real backend-backed evidence collector.
- **Export Utility**: Finalize the `exportADR` and `convertToSTAR` functions to allow file downloads or clipboard copies.

### Step 4: Cross-Module Integration
Add "Convert to Decision" buttons to other modules to drive traffic to the Vault.

## 7. Strategic Moats (Competitive Advantage)
- **Adversarial AI**: Unlike generic AI that agrees with the user, Engunity's Vault challenges assumptions.
- **Decision Drift**: Tracking when a user repeatedly reverses similar decisions.
- **STAR/ADR Engine**: Immediate professional utility for job seekers and architects.

---
*Documented by Engunity Research Agent - 2026-01-23*
