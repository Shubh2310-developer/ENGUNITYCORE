# Coding Conventions

**Analysis Date:** 2026-02-10

## Naming Patterns

**Files:**
- **Backend:** `snake_case.py` (e.g., `auth.py`, `document_processor.py`).
- **Frontend:** PascalCase for components (`CodeEditor.tsx`, `AuthProvider.tsx`), camelCase for services and stores (`auth.ts`, `authStore.ts`), and standard Next.js routing files (`page.tsx`, `layout.tsx`).

**Functions:**
- **Backend:** `snake_case` (e.g., `get_current_user`, `register_user`).
- **Frontend:** `camelCase` (e.g., `login`, `getMe`).

**Variables:**
- **Backend:** `snake_case` for local variables and parameters.
- **Frontend:** `camelCase` for variables and state.

**Types/Classes:**
- **Backend:** `PascalCase` for Pydantic models (`UserCreate`, `TokenPayload`) and SQLAlchemy models (`User`, `CodeProject`).
- **Frontend:** `PascalCase` for Interfaces and Types (e.g., `interface AuthStore`).

## Code Style

**Formatting:**
- **Backend:** Follows PEP 8. No explicit formatter config (like Black) found, but code is consistently indented with 4 spaces.
- **Frontend:** Next.js default (ESLint). Prettier is not explicitly configured in the root but likely used via IDE.

**Linting:**
- **Backend:** No explicit linter config found.
- **Frontend:** ESLint using `eslint-config-next` (config in `frontend/.eslintrc.json`).

## Import Organization

**Backend:**
1. Standard library imports (e.g., `import logging`, `import sys`).
2. Third-party imports (e.g., `from fastapi import ...`).
3. Local application imports (e.g., `from app.core import ...`).

**Frontend:**
- Uses path aliases configured in `tsconfig.json`.
- `@/*` maps to `src/*`.
- Patterns: `import { ... } from '@/components/...'` or `import { ... } from '@/stores/...'`.

## Error Handling

**Patterns:**
- **Backend:** Uses `FastAPI.HTTPException` for client-side errors (4xx). A global exception handler in `backend/app/main.py` catches unhandled `Exception` instances and returns a 500 JSON response with tracebacks logged.
- **Frontend:** Uses `try-catch` blocks around `fetch` calls in services. Specific error types (like `TypeError: Failed to fetch`) are caught to provide user-friendly "Backend connection failed" messages.

## Logging

**Framework:**
- **Backend:** Uses `loguru` and standard Python `logging`.
- **Frontend:** `console.log` and `console.error`.

**Patterns:**
- **Backend:** Centralized configuration in `backend/app/core/logging_config.py`. Uses `RotatingFileHandler` to save logs to `logs/app.log` (10MB limit, 5 backups). Log levels are set specifically for `uvicorn` and `app`.
- **Frontend:** Conditional logging in development mode (`if (process.env.NODE_ENV === 'development')`).

## Function Design

**Size:** Functions are generally concise and single-purpose, though complex logic like `get_current_user` in `backend/app/api/v1/auth.py` can grow to handle multiple authentication strategies (Supabase vs. Standard JWT).

**Parameters:**
- **Backend:** Uses FastAPI dependency injection (`Depends(get_db)`) for services and database sessions.
- **Frontend:** Component props are typed; service functions take explicit arguments.

## Module Design

**Exports:**
- **Backend:** Standard Python modules with explicit imports.
- **Frontend:** Named exports for services and components are preferred (e.g., `export const authService = { ... }`).

---

*Convention analysis: 2026-02-10*
