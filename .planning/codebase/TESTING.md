# Testing Patterns

**Analysis Date:** 2026-02-10

## Test Framework

**Runner:**
- **Backend:** `pytest` (listed in `backend/requirements.txt`).
- **Frontend:** `@playwright/test` (v1.58.1) for E2E testing.

**Assertion Library:**
- **Backend:** Standard `pytest` assertions.
- **Frontend:** Playwright's `expect`.

**Run Commands:**
```bash
# Backend (Pytest)
pytest backend/

# Frontend (Playwright)
npx playwright test
```

## Test File Organization

**Location:**
- **Backend:** Ad-hoc tests found in `scripts/` (e.g., `scripts/test_jobprep.py`) and root (e.g., `tmp_rovodev_jobprep_test.py`). No centralized `tests/` directory was found for core application logic.
- **Frontend:** Located in `frontend/e2e/` for end-to-end tests.

**Naming:**
- **Backend:** `test_*.py` or `verify_*.py`.
- **Frontend:** `*.spec.ts`.

## Test Structure

**E2E Tests (Playwright):**
```typescript
import { test, expect } from './fixtures/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup (e.g., mockAuth, navigate)
  });

  test('should perform specific action', async ({ page }) => {
    // Action
    // Assertion
    await expect(page.locator('...')).toBeVisible();
  });
});
```

## Mocking

**Framework:** Playwright's built-in routing and custom fixtures.

**Patterns:**
```typescript
// frontend/e2e/fixtures/auth.ts
export const mockAuth = async (page: Page) => {
  await page.route('**/api/v1/auth/me', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ id: 'test-user', email: 'test@example.com' }),
    });
  });
};
```

**What to Mock:**
- External API calls (Supabase, Backend API) in E2E tests to ensure isolation and speed.
- Auth state via `localStorage` or session mocks.

## Fixtures and Factories

**Test Data:**
- Frontend uses static JSON objects in `page.route` fulfillment for mocking.
- Backend scripts often use hardcoded test IDs or dynamic creation via SQLAlchemy.

**Location:**
- `frontend/e2e/fixtures/`: Contains reusable test setup like `auth.ts`.

## Coverage

**Requirements:** None enforced. No coverage configuration (e.g., `.coveragerc` or `istanbul`) detected in the root.

## Test Types

**Unit Tests:**
- Limited evidence of unit tests for individual functions. Most backend "tests" are integration-style scripts that interact with the database or AI services.

**E2E Tests:**
- Primary focus for frontend testing. Located in `frontend/e2e/` covering major user journeys like `JobPrep`, `Profile Management`, and `Interview Simulator`.

## Common Patterns

**Async Testing:**
- **Backend:** Uses `pytest-asyncio` for testing async FastAPI endpoints.
- **Frontend:** Extensive use of `await` with Playwright locators and `waitForLoadState`.

**Error Testing:**
- Frontend E2E tests explicitly mock 500 errors to verify graceful failure in the UI (see `frontend/e2e/jobprep.spec.ts`).

---

*Testing analysis: 2026-02-10*
