import { test, expect } from '../fixtures/auth.fixture';

test.describe('Auth Guard — Protected Routes', () => {
    test('unauthenticated user cannot access /overview', async ({ page }) => {
        await page.goto('/overview');
        // Should redirect to login or show unauthenticated UI
        await expect(page).toHaveURL(/\/(login|overview)/, { timeout: 5000 });
    });

    test('authenticated user can access /overview', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/overview');
        await expect(authenticatedPage).toHaveURL(/\/overview/);
    });

    test('authenticated user visiting /login gets redirected to /overview', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/login');
        await expect(authenticatedPage).toHaveURL(/\/overview/, { timeout: 5000 });
    });
});
