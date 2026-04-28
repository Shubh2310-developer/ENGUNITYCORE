import { test, expect } from './fixtures/auth.fixture';

const decisionTitleInput = (page: any) =>
  page.locator('label:has-text("Decision Title")').locator('xpath=following-sibling::input[1]');

const categorySelect = (page: any) =>
  page.locator('label:has-text("Category")').locator('xpath=following-sibling::select[1]');

const problemTextarea = (page: any) =>
  page.locator('label:has-text("Problem Statement")').locator('xpath=following-sibling::textarea[1]');

test.describe('Decision Vault', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.route('**/api/v1/decisions/', async (route: any) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() || {};
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'dv-test-1',
            workspace_id: payload.workspace_id || 'default',
            user_id: 1,
            created_by: 'test-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...payload,
          }),
        });
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/v1/decisions/analyze', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('DV-E2E-001: route renders and modal opens', async ({ authenticatedPage: page }) => {
    await page.goto('/decisionvault');

    await expect(page.getByRole('heading', { name: 'Decision Vault' })).toBeVisible();
    await page.getByRole('button', { name: 'New Decision' }).click();

    await expect(page.getByText('New Decision Entry')).toBeVisible();
    await expect(page.getByText('Step 1 of 7: Identity')).toBeVisible();
  });

  test('DV-E2E-002: query prefill from code sets title/problem/type', async ({ authenticatedPage: page }) => {
    await page.goto('/decisionvault?source=code&title=Refactor%3A%20engine.ts&problem=Architectural%20decision%20required');

    await expect(page.getByText('New Decision Entry')).toBeVisible();
    await expect(decisionTitleInput(page)).toHaveValue('Refactor: engine.ts');
    await expect(categorySelect(page)).toHaveValue('Code');

    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(problemTextarea(page)).toHaveValue('Architectural decision required');
  });

  test('DV-E2E-003: query prefill from chat without problem uses fallback text', async ({ authenticatedPage: page }) => {
    await page.goto('/decisionvault?source=chat&title=Session%20Alpha');

    await expect(page.getByText('New Decision Entry')).toBeVisible();
    await expect(categorySelect(page)).toHaveValue('Architecture');

    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(problemTextarea(page)).toHaveValue('Converted from chat session: Session Alpha');
  });

  test('DV-E2E-003b: query prefill from research sets research type', async ({ authenticatedPage: page }) => {
    await page.goto('/decisionvault?source=research&title=Methodology%3A%20Retriever&problem=Investigating%20optimal%20approach');

    await expect(page.getByText('New Decision Entry')).toBeVisible();
    await expect(decisionTitleInput(page)).toHaveValue('Methodology: Retriever');
    await expect(categorySelect(page)).toHaveValue('Research');

    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(problemTextarea(page)).toHaveValue('Investigating optimal approach');
  });

  test('DV-E2E-004: create flow completes and persists card in UI', async ({ authenticatedPage: page }) => {
    await page.goto('/decisionvault');
    await page.getByRole('button', { name: 'New Decision' }).click();

    await decisionTitleInput(page).fill('Decision Vault smoke create');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await problemTextarea(page).fill('Validate that decision creation works end to end.');

    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.getByText('No major issues detected')).toBeVisible();

    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByText('Untitled Option').first().click();
    await page
      .locator('label:has-text("Decision Rationale")')
      .locator('xpath=following-sibling::textarea[1]')
      .fill('Smoke test rationale.');

    await page.getByRole('button', { name: 'Initialize Decision' }).click();

    await expect(page.getByText('New Decision Entry')).not.toBeVisible();
    await expect(page.getByText('Decision Vault smoke create')).toBeVisible();
  });

  test('DV-E2E-005: prevents duplicate create submits while request pending', async ({ authenticatedPage: page }) => {
    let postCount = 0;
    await page.unroute('**/api/v1/decisions/');
    await page.route('**/api/v1/decisions/', async (route: any) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }
      if (route.request().method() === 'POST') {
        postCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 400));
        const payload = route.request().postDataJSON() || {};
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'dv-idem', user_id: 1, workspace_id: 'default', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...payload }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/decisionvault');
    await page.getByRole('button', { name: 'New Decision' }).click();
    await decisionTitleInput(page).fill('Duplicate submit guard');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await problemTextarea(page).fill('Should submit exactly once.');

    for (let i = 0; i < 5; i += 1) {
      await page.getByRole('button', { name: 'Next Step' }).click();
    }

    await page.getByText('Untitled Option').first().click();
    await page.locator('label:has-text("Decision Rationale")').locator('xpath=following-sibling::textarea[1]').fill('Only one request expected.');

    const submitBtn = page.getByRole('button', { name: 'Initialize Decision' });
    await submitBtn.click();

    await expect(page.getByRole('button', { name: 'Initializing...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Initializing...' })).toBeDisabled();
    await expect(page.getByText('New Decision Entry')).not.toBeVisible();
    expect(postCount).toBe(1);
  });

  test('DV-E2E-006: context prefill is accepted and privacy workspace persists', async ({ authenticatedPage: page }) => {
    let capturedPost: any = null;

    await page.unroute('**/api/v1/decisions/');
    await page.route('**/api/v1/decisions/', async (route: any) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }
      if (route.request().method() === 'POST') {
        capturedPost = route.request().postDataJSON() || {};
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'dv-context', user_id: 1, workspace_id: 'default', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...capturedPost }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/decisionvault?source=code&title=Context%20Test&problem=Need%20context&context=Language%3A%20ts%3Cscript%3Ebad%3C%2Fscript%3E');
    await expect(page.getByText('New Decision Entry')).toBeVisible();

    for (let i = 0; i < 6; i += 1) {
      await page.getByRole('button', { name: 'Next Step' }).click();
    }

    await page.getByText('Untitled Option').first().click();
    const privacySelect = page.locator('label:has-text("Privacy Level")').locator('xpath=following-sibling::select[1]');
    await privacySelect.selectOption('workspace');
    await page.locator('label:has-text("Decision Rationale")').locator('xpath=following-sibling::textarea[1]').fill('Context and privacy validation.');

    await page.getByRole('button', { name: 'Initialize Decision' }).click();
    await expect(page.getByText('New Decision Entry')).not.toBeVisible();

    expect(capturedPost).not.toBeNull();
    expect(capturedPost.privacy).toBe('workspace');
    expect(String(capturedPost.context || '')).not.toContain('<script>');
  });

  test('DV-E2E-007: analyze failure shows explicit warning UX', async ({ authenticatedPage: page }) => {
    await page.unroute('**/api/v1/decisions/analyze');
    await page.route('**/api/v1/decisions/analyze', async (route: any) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ detail: { code: 'AI_PROVIDER_ERROR', message: 'Analysis provider unavailable', retryable: true } }),
      });
    });

    await page.goto('/decisionvault');
    await page.getByRole('button', { name: 'New Decision' }).click();
    await decisionTitleInput(page).fill('AI failure test');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await problemTextarea(page).fill('Reach analysis step and fail cleanly.');

    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();

    await expect(page.getByText('AI review unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry AI Review' })).toBeVisible();
    await expect(page.getByText('No major issues detected')).not.toBeVisible();
  });
});
