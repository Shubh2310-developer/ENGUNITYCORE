import { test, expect } from './fixtures/auth.fixture';
import type { Route, WebSocketRoute } from '@playwright/test';

test.describe('Code Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Mock Backend APIs
    await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          language: 'python',
          execution_time: 0.05,
          stdout: 'Hello from Test Execution\n',
          stderr: '',
        }),
      });
    });

    await page.route('**/api/v1/code/ai-assist', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Here is an optimized version of your code.',
          improved_code: 'print("Optimized Hello World")',
        }),
      });
    });

    await page.route('**/api/v1/git/*/status', async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                active_branch: 'main',
                changed_files: ['hello.py'],
                untracked_files: [],
                ahead: 0,
                behind: 0
            })
        });
    });

    await page.route('**/api/v1/git/*/log', async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { hexsha: 'abc1234', message: 'Initial commit', author: 'Test User' }
            ])
        });
    });

    // Mock WebSocket for Terminal
    await page.routeWebSocket(/.*\/ws\/terminal\/.*/, (ws: WebSocketRoute) => {
      ws.onMessage((message: string | Buffer) => {
        // Echo back everything received to simulate the backend terminal
        ws.send(message);
      });

      // Send initial connection success message
      setTimeout(() => {
        ws.send('\r\n\x1b[32m[Connected to terminal]\x1b[0m\r\n');
      }, 200);
    });

    // Visit the code dashboard page
    await page.goto('/code');

    // Wait for the page to load by checking for a key element
    await page.waitForLoadState('networkidle');
  });

  test('should load the dashboard and verify main components', async ({ authenticatedPage: page }) => {
    // Check for Header
    await expect(page.getByText('Code Studio')).toBeVisible();

    // Check for Run button
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();

    // Check for Sidebar tabs
    await expect(page.getByTitle('Toggle Sidebar')).toBeVisible();
    await expect(page.getByTitle('Source Control')).toBeVisible();

    // Check for Editor
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
  });

  test('should execute code and show output in terminal', async ({ authenticatedPage: page }) => {
    // Wait for Monaco editor to fully load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Click Run button
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // Verify Terminal Output Notification
    await expect(page.getByText('Code executed successfully')).toBeVisible();

    // Check if the mock output appears in the terminal
    // Using a more flexible check for the terminal rows content
    await expect(page.locator('.xterm-rows')).toContainText('Hello from Test Execution', { timeout: 15000 });
  });

  test('should open AI Refine panel and trigger optimization', async ({ authenticatedPage: page }) => {
    // Header uses "Refine AI"
    const refineHeader = page.locator('aside').getByText('Refine AI').first();

    // If not visible, click to open it
    if (!await refineHeader.isVisible()) {
        await page.getByTitle('Open AI Refine').click();
    }

    await expect(refineHeader).toBeVisible();

    // Click "Optimize performance" button
    await page.getByRole('button', { name: 'Optimize performance' }).click();

    // Expect AI response
    await expect(page.getByText('Here is an optimized version of your code.', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('should switch to Git Sidebar and show changes', async ({ authenticatedPage: page }) => {
    // Click Source Control button in header
    await page.getByTitle('Source Control').click();

    // Verify Git Sidebar header - using .first() to avoid strict mode violation
    await expect(page.locator('aside').getByText('Source Control').first()).toBeVisible({ timeout: 5000 });

    // Verify sidebar is open with git controls
    await expect(page.getByText('Branch: main')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Commit Staged' })).toBeVisible();

    // Verify Changes section exists - use exact regex to avoid matching "Staged Changes"
    await expect(page.getByText(/^Changes \(\d+\)/)).toBeVisible();

    // Verify hello.py is in the changes list in the sidebar
    await expect(page.locator('aside').getByText('hello.py', { exact: true }).first()).toBeVisible();
  });
});
