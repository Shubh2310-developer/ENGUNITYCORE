import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
    authenticatedPage: any;
    testUser: { email: string; password: string };
};

export const test = base.extend<AuthFixtures>({
    testUser: async ({ }, use) => {
        const user = {
            email: `test-${Date.now()}@engunity.test`,
            password: 'TestP@ssw0rd!2026',
        };
        await use(user);
    },

    authenticatedPage: async ({ page, testUser }, use) => {
        // Register user via API
        await page.request.post('http://localhost:8000/api/v1/auth/register', {
            data: { email: testUser.email, password: testUser.password, role: 'user' },
        });

        // Login via API and save token
        const loginResp = await page.request.post('http://localhost:8000/api/v1/auth/login', {
            form: { username: testUser.email, password: testUser.password },
        });
        const { access_token } = await loginResp.json();

        // Inject auth state into localStorage (Zustand persist)
        await page.goto('/login');
        await page.evaluate((token) => {
            localStorage.setItem('engunity-auth', JSON.stringify({
                state: { token, providerToken: null },
                version: 0,
            }));
        }, access_token);

        await use(page);
    },
});

export { expect };
