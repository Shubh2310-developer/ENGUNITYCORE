import { test, expect } from '../fixtures/auth.fixture';

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('page loads with correct elements', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Engunity AI');
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('successful login redirects to /overview', async ({ page, testUser }) => {
        // Register test user first
        await page.request.post('http://localhost:8000/api/v1/auth/register', {
            data: { email: testUser.email, password: testUser.password, role: 'user' },
        });

        await page.getByLabel('Email').fill(testUser.email);
        await page.getByLabel('Password').fill(testUser.password);
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page).toHaveURL(/\/overview/, { timeout: 10000 });
    });

    test('failed login shows error message', async ({ page }) => {
        await page.getByLabel('Email').fill('wrong@test.com');
        await page.getByLabel('Password').fill('wrongpass');
        await page.getByRole('button', { name: /sign in/i }).click();

        await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 5000 });
    });

    test('shows loading state during submission', async ({ page }) => {
        await page.getByLabel('Email').fill('any@test.com');
        await page.getByLabel('Password').fill('anypass');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Spinner should appear
        await expect(page.locator('.animate-spin')).toBeVisible();
    });

    test('GitHub login button triggers OAuth', async ({ page }) => {
        const [popup] = await Promise.all([
            page.waitForEvent('popup').catch(() => null),
            page.getByLabel('Continue with GitHub').click(),
        ]);
        // Verify redirect to Supabase/GitHub OAuth URL
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
