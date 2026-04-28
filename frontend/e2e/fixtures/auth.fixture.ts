import { test as base, expect } from '@playwright/test';
import type { Route } from '@playwright/test';
import type { Page } from '@playwright/test';

type AuthFixtures = {
    authenticatedPage: any;
    testUser: { email: string; password: string };
};

export const test = base.extend<AuthFixtures>({
    testUser: async ({ }, use) => {
        // Use environment variable if available, otherwise use placeholder
        const testPassword = process.env.TEST_USER_PASSWORD || 'TestP@ssw0rd!2026';
        const user = {
            email: `test-${Date.now()}@engunity.test`,
            password: testPassword,
        };
        await use(user);
    },

    authenticatedPage: async ({ page, testUser }: { page: Page; testUser: { email: string; password: string } }, use: (page: Page) => Promise<void>) => {
        const mockUser = {
            id: 1,
            email: testUser.email,
            role: 'user',
            is_active: true,
        };

        // Mock authentication APIs for standalone testing (no backend required)
        await page.route('**/api/v1/auth/register', async (route: Route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockUser),
            });
        });

        await page.route('**/api/v1/auth/login', async (route: Route) => {
            const mockToken = process.env.TEST_MOCK_JWT || 'mock-jwt-token-test-only';
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: mockToken,
                    token_type: 'bearer',
                }),
            });
        });

        // Mock user data endpoint (called after login to get user details)
        await page.route('**/api/v1/auth/me', async (route: Route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockUser),
            });
        });

        // Navigate to login page
        await page.goto('/login');

        // Fill in the login form
        await page.getByLabel('Email').fill(testUser.email);
        await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);

        // Click sign in button
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for redirect to overview page (which happens on successful login)
        await page.waitForURL(/\/(overview|chat|code|analytics)/, { timeout: 15000 });

        // Wait for the page to be fully loaded
        await page.waitForLoadState('networkidle');

        await use(page);
    },
});

export { expect };
