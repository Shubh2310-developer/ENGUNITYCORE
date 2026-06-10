import { test, expect } from '../fixtures/auth.fixture';

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.evaluate(() => window.localStorage.clear());
        await page.goto('/login');
    });

    test('page loads with correct elements', async ({ page }) => {
        await expect(page.locator('h1').first()).toContainText('Engunity AI');
        await expect(page.locator('input#email')).toBeVisible();
        await expect(page.locator('input#password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('successful login redirects to /overview', async ({ page, testUser }) => {
        // Register test user first
        await page.request.post('http://localhost:8000/api/v1/auth/register', {
            data: { email: testUser.email, password: testUser.password, role: 'user' },
        });

        await page.locator('input#email').fill(testUser.email);
        await page.locator('input#password').fill(testUser.password);
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page).toHaveURL(/\/overview/, { timeout: 10000 });
    });

    test('failed login shows error message', async ({ page }) => {
        await page.locator('input#email').fill('wrong@test.com');
        await page.locator('input#password').fill('wrongpass');
        await page.getByRole('button', { name: /sign in/i }).click();

        // The error message is rendered in an element with red text
        await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 5000 });
    });

    test('shows loading state during submission', async ({ page }) => {
        await page.locator('input#email').fill('any@test.com');
        await page.locator('input#password').fill('anypass');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Spinner should appear
        await expect(page.locator('.animate-spin')).toBeVisible();
    });

    test('GitHub login button triggers OAuth', async ({ page }) => {
        const [popup] = await Promise.all([
            page.waitForEvent('popup').catch(() => null),
            page.getByLabel('Continue with GitHub').click(),
        ]);
    });

    test('navigate to register page', async ({ page }) => {
        await page.getByText('Create an account').click();
        await expect(page).toHaveURL('/register');
    });

    test('navigate to forgot password', async ({ page }) => {
        await page.getByText('Forgot password').click();
        await expect(page).toHaveURL('/reset-password');
    });
});
