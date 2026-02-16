import { test, expect } from '../fixtures/auth.fixture';

test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('successful registration shows success and redirects to login', async ({ page }) => {
        const email = `reg-${Date.now()}@test.com`;
        await page.getByPlaceholder('name@nexus.com').fill(email);
        await page.getByPlaceholder('••••••••').fill('SecureP@ss123');
        await page.getByRole('checkbox').check();
        await page.getByRole('button', { name: /initialize account/i }).click();

        await expect(page.getByText(/clearance granted/i)).toBeVisible({ timeout: 5000 });
        await expect(page).toHaveURL('/login', { timeout: 5000 });
    });

    test('duplicate email shows error', async ({ page, testUser }) => {
        // Register first
        await page.request.post('http://localhost:8000/api/v1/auth/register', {
            data: { email: testUser.email, password: testUser.password, role: 'user' },
        });

        await page.getByPlaceholder('name@nexus.com').fill(testUser.email);
        await page.getByPlaceholder('••••••••').fill(testUser.password);
        await page.getByRole('checkbox').check();
        await page.getByRole('button', { name: /initialize account/i }).click();

        await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 5000 });
    });

    test('has link back to login', async ({ page }) => {
        await page.getByText('Return to Terminal').click();
        await expect(page).toHaveURL('/login');
    });
});
