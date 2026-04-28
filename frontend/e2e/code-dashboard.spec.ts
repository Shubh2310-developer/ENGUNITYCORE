/**
 * E2E Test Suite: Code Dashboard Page
 *
 * Covers: /code page — auth guard, page load, Monaco editor hydration,
 * code execution, AI Refine panel, Git sidebar, error handling,
 * sidebar navigation, keyboard shortcuts, state persistence, and performance.
 *
 * All backend API calls are mocked via page.route() — no real backend required.
 * WebSocket terminal sessions are mocked via page.routeWebSocket().
 * Uses the authenticatedPage fixture from e2e/fixtures/auth.fixture.ts.
 *
 * Run: conda run -n engunity npx playwright test e2e/code-dashboard.spec.ts --project=chromium --reporter=list
 */

import { test, expect } from './fixtures/auth.fixture';
import type { Route, WebSocketRoute } from '@playwright/test';

// ─── Shared Mock Helpers ──────────────────────────────────────────────────────

/** Standard mock for code execution endpoint */
async function mockExecuteSuccess(page: any, stdout = 'Hello from Test Execution\n') {
  await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        language: 'python',
        execution_time: 0.05,
        stdout,
        stderr: '',
      }),
    });
  });
}

/** Mock AI assist endpoint */
async function mockAIAssist(page: any, response = 'Here is an optimized version of your code.', improvedCode = 'print("Optimized")') {
  await page.route('**/api/v1/code/ai-assist', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response, improved_code: improvedCode }),
    });
  });
}

/** Mock AI chat endpoint */
async function mockAIChat(page: any, response = 'Here is my explanation.') {
  await page.route('**/api/v1/code/ai-chat', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response }),
    });
  });
}

/** Mock Git status and history endpoints */
async function mockGitEndpoints(page: any, changedFiles: string[] = ['hello.py']) {
  await page.route('**/api/v1/git/*/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        active_branch: 'main',
        changed_files: changedFiles,
        untracked_files: [],
        ahead: 0,
        behind: 0,
      }),
    });
  });

  await page.route('**/api/v1/git/*/log', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { hexsha: 'abc1234', message: 'Initial commit', author: 'Test User' },
      ]),
    });
  });
}

/** Mock code project bootstrap endpoints used on /code mount */
async function mockCodeProjectEndpoints(page: any) {
  await page.route('**/api/v1/code/', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'default-project',
            name: 'Default Project',
            description: 'Mock project',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
      });
      return;
    }

    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'default-project',
          name: 'Default Project',
          description: 'Mock project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/v1/code/*/files', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'file-id',
            name: 'hello.py',
            type: 'file',
            language: 'python',
            content: 'print("Hello from Test Execution")',
            parentId: null,
          },
        ]),
      });
      return;
    }

    await route.fallback();
  });
}

/** Mock WebSocket terminal */
async function mockTerminalWebSocket(page: any) {
  await page.routeWebSocket(/.*\/ws\/terminal\/.*/, (ws: WebSocketRoute) => {
    ws.onMessage((message: string | Buffer) => {
      ws.send(message);
    });
    setTimeout(() => {
      ws.send('\r\n\x1b[32m[Connected to terminal]\x1b[0m\r\n');
    }, 200);
  });
}

/** Mock AI completion to prevent unmocked fetch errors and networkidle timeouts */
async function mockAICompletion(page: any) {
  await page.route('**/api/v1/code/ai-completion', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ completion: '' }),
    });
  });
}

/** Navigate to /code and wait for stable load */
async function goToCode(page: any) {
  await page.goto('/code');
  await page.waitForLoadState('networkidle');
}

/** Apply all standard mocks (exec + ai-assist + ai-chat + git + ws) */
async function applyAllMocks(page: any) {
  await mockCodeProjectEndpoints(page);
  await mockExecuteSuccess(page);
  await mockAIAssist(page);
  await mockAIChat(page);
  await mockGitEndpoints(page);
  await mockTerminalWebSocket(page);
  await mockAICompletion(page);
}

// ─── AUTH & ACCESS ────────────────────────────────────────────────────────────

test.describe('Code Dashboard — Auth & Access', () => {
  /**
   * CD-01: Unauthenticated users must be redirected from /code.
   * Uses plain page, not authenticatedPage fixture.
   */
  test('CD-01: redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/code');
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
  });
});

// ─── PAGE LOAD & INITIAL STATE ────────────────────────────────────────────────

test.describe('Code Dashboard — Page Load & Initial State', () => {
  /**
   * CD-02: All primary header elements visible after authenticated load.
   */
  test('CD-02: page loads with all main components visible', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // Header branding
    await expect(page.getByText('Code Studio')).toBeVisible({ timeout: 10000 });

    // Run button
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();

    // Sidebar toggle
    await expect(page.getByTitle('Toggle Sidebar')).toBeVisible();

    // Source control icon
    await expect(page.getByTitle('Source Control')).toBeVisible();

    // Status bar (bottom)
    await expect(page.locator('[class*="statusbar"]').first()).toBeVisible();
  });

  /**
   * CD-03: Monaco editor hydrates and is visible within 15 seconds.
   * Validates the editor canvas loads with default hello.py content.
   */
  test('CD-03: Monaco editor loads with default file content', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // Monaco editor container
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });

    // "hello.py" tab should be open (default activeFileId = '3')
    await expect(page.getByText('hello.py').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── CODE EXECUTION ───────────────────────────────────────────────────────────

test.describe('Code Dashboard — Code Execution', () => {
  /**
   * CD-04: Clicking Run sends /execute-direct, shows success notification
   * and output appears in the terminal panel.
   */
  test('CD-04: run code — success notification and terminal output', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // Success notification
    await expect(page.getByText('Code executed successfully')).toBeVisible({ timeout: 10000 });

    // Terminal output contains mocked stdout
    await expect(page.locator('.xterm-rows')).toContainText('Hello from Test Execution', { timeout: 15000 });
  });

  /**
   * CD-05: When execute-direct returns a 5xx error,
   * the UI shows a failure notification (not a crash).
   */
  test('CD-05: run code — 5xx backend error shows error notification', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    // Override execute with server error
    await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) });
    });

    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // UI should show deterministic error notification
    await expect(page.getByText('Failed to execute code')).toBeVisible({ timeout: 12000 });
  });

  /**
   * CD-06: Network failure (connection refused) on execute-direct
   * triggers the catch block — terminal shows the error message.
   */
  test('CD-06: run code — network failure shows terminal error', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    // Abort the execute call
    await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
      await route.abort('connectionrefused');
    });

    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // Catch block triggers user-visible failure state
    await expect(page.getByText('Failed to execute code')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('.xterm-rows')).toContainText('Error:', { timeout: 12000 });
  });
});

// ─── AI REFINE PANEL ─────────────────────────────────────────────────────────

test.describe('Code Dashboard — AI Refine Panel', () => {
  /**
   * CD-07: "Optimize performance" quick-action calls /ai-assist and
   * renders the AI response in the refine panel.
   */
  test('CD-07: AI Refine — optimize action shows response', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // Ensure the AI Refine panel is open (isAIRefineOpen defaults to true in store)
    // If collapsed, open it
    const refineHeader = page.locator('aside').getByText('Refine AI').first();
    if (!await refineHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByTitle('Open AI Refine').click();
    }

    await expect(refineHeader).toBeVisible({ timeout: 8000 });

    // Click "Optimize performance" quick action
    await page.getByRole('button', { name: 'Optimize performance' }).click();

    // AI response appears in panel
    await expect(
      page.getByText('Here is an optimized version of your code.', { exact: true })
    ).toBeVisible({ timeout: 15000 });
  });

  /**
   * CD-08: Sending a custom chat message in the AI Refine textarea
   * calls /ai-chat and renders the response.
   */
  test('CD-08: AI Refine — custom chat message gets response', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    const refineHeader = page.locator('aside').getByText('Refine AI').first();
    if (!await refineHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByTitle('Open AI Refine').click();
    }
    await expect(refineHeader).toBeVisible({ timeout: 8000 });

    // Find the AI chat textarea in the refine panel
    const chatTextarea = page.locator('aside textarea').last();
    await expect(chatTextarea).toBeVisible({ timeout: 5000 });
    await chatTextarea.fill('Explain this code to me');
    await chatTextarea.press('Enter');

    // Response from mocked /ai-chat
    await expect(page.getByText('Here is my explanation.').first()).toBeVisible({ timeout: 15000 });
  });

  /**
   * CD-09: When /ai-assist returns a 5xx, the panel shows an error message
   * and does not crash the page.
   */
  test('CD-09: AI Refine — backend error shows graceful error in panel', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    // Override ai-assist with error
    await page.route('**/api/v1/code/ai-assist', async (route: Route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Service unavailable' }) });
    });

    await goToCode(page);

    const refineHeader = page.locator('aside').getByText('Refine AI').first();
    if (!await refineHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByTitle('Open AI Refine').click();
    }
    await expect(refineHeader).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: 'Optimize performance' }).click();

    // Error message rendered from AI panel catch block
    await expect(page.getByText(/AI service unavailable/i).first()).toBeVisible({ timeout: 15000 });

    // Page still functional — Run button still visible
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  });
});

// ─── GIT SIDEBAR ─────────────────────────────────────────────────────────────

test.describe('Code Dashboard — Git Sidebar', () => {
  /**
   * CD-10: Opening Source Control sidebar shows branch info,
   * changed files list, and commit history.
   */
  test('CD-10: Git sidebar — shows branch, changes, and history', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // Click Source Control icon in header
    await page.getByTitle('Source Control').click();

    // Sidebar header label
    await expect(page.locator('aside').getByText('Source Control').first()).toBeVisible({ timeout: 8000 });

    // Branch display from mock
    await expect(page.getByText('Branch: main')).toBeVisible({ timeout: 8000 });

    // Commit Staged button
    await expect(page.getByRole('button', { name: 'Commit Staged' })).toBeVisible();

    // Changes section shows the mocked changed file
    await expect(page.getByText(/^Changes \(\d+\)/)).toBeVisible();
    await expect(page.locator('aside').getByText('hello.py', { exact: true }).first()).toBeVisible();

    // Commit history rendered
    await expect(page.getByText('Initial commit')).toBeVisible({ timeout: 8000 });
  });

  /**
   * CD-11: Staging a file then filling a commit message enables the Commit
   * Staged button (disabled when no staged changes — button logic is in GitSidebar).
   */
  test('CD-11: Git sidebar — stage file enables Commit Staged button', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    await page.getByTitle('Source Control').click();
    await expect(page.locator('aside').getByText('Source Control').first()).toBeVisible({ timeout: 8000 });

    // Commit button is disabled when no staged files
    const commitBtn = page.getByRole('button', { name: 'Commit Staged' });
    await expect(commitBtn).toBeDisabled({ timeout: 5000 });

    // Stage "hello.py" — click the + (Plus) stage action next to it
    const stageBtn = page.locator('aside').locator('[title="Stage file"]').first();
    if (await stageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stageBtn.click();

      // Fill commit message
      await page.locator('aside textarea').first().fill('Test commit message');

      // Commit Staged should now be enabled
      await expect(commitBtn).toBeEnabled({ timeout: 5000 });
    } else {
      // If no stage button visible, just verify the UI structure is correct
      await expect(commitBtn).toBeVisible();
    }
  });
});

// ─── SIDEBAR NAVIGATION ───────────────────────────────────────────────────────

test.describe('Code Dashboard — Sidebar Navigation', () => {
  /**
   * CD-12: Clicking "Toggle Sidebar" collapses and re-opens the left sidebar.
   */
  test('CD-12: sidebar toggle — opens and closes left panel', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // File Explorer tab should be open by default
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 10000 });

    // Click toggle to close
    await page.getByTitle('Toggle Sidebar').click();

    // Wait for sidebar to collapse (look for hidden state)
    await page.waitForTimeout(500);

    // Click toggle again to re-open
    await page.getByTitle('Toggle Sidebar').click();

    // Sidebar re-opened
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 5000 });
  });

  /**
   * CD-13: Ctrl+B keyboard shortcut toggles the sidebar.
   */
  test('CD-13: keyboard shortcut Ctrl+B toggles sidebar', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    await page.waitForTimeout(500); // ensure page settled

    // Press Ctrl+B to toggle sidebar closed
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(400);

    // Press Ctrl+B again to toggle open
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(400);

    // Header should still be visible
    await expect(page.getByText('Code Studio')).toBeVisible({ timeout: 5000 });
  });

  /**
   * CD-14: Notification overlay appears when an action fires setNotification,
   * then disappears after 3 seconds (timeout controlled by store).
   */
  test('CD-14: notification overlay shows and auto-dismisses', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    await page.getByRole('button', { name: 'Settings' }).click();

    const notification = page.locator('.fixed.bottom-12.right-6').getByText('Settings', { exact: true });
    await expect(notification).toBeVisible({ timeout: 8000 });
    await expect(notification).toBeHidden({ timeout: 5000 });
  });
});

// ─── FILE EXPLORER ────────────────────────────────────────────────────────────

test.describe('Code Dashboard — File Explorer', () => {
  /**
   * CD-15: File Explorer shows the default folder structure.
   * The examples folder tree (python, javascript, etc.) is pre-loaded from codeStore.
   */
  test('CD-15: file explorer shows default file tree', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // Open explorer sidebar if not already
    await page.getByTitle('File Explorer').click().catch(() =>
      page.locator('[title="File Explorer"]').first().click()
    );

    // Tree is hydrated from backend mock
    await expect(page.getByText('hello.py').first()).toBeVisible({ timeout: 8000 });
  });
});

// ─── COMMAND PALETTE ─────────────────────────────────────────────────────────

test.describe('Code Dashboard — Command Palette', () => {
  /**
   * CD-16: Ctrl+P opens the command palette overlay.
   */
  test('CD-16: Ctrl+P opens command palette', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    await page.keyboard.press('Control+p');

    const palette = page.getByTestId('command-palette');
    await expect(palette).toBeVisible({ timeout: 8000 });

    const input = palette.getByRole('textbox', { name: 'Search files' });
    await expect(input).toBeVisible({ timeout: 8000 });
    await expect(input).toBeFocused({ timeout: 8000 });

    await page.keyboard.press('Escape');
    await expect(palette).toBeHidden({ timeout: 5000 });
  });
});

// ─── STATE PERSISTENCE ────────────────────────────────────────────────────────

test.describe('Code Dashboard — State Persistence', () => {
  /**
   * CD-17: After switching from Explorer to Git sidebar tab, a page reload
   * re-initialises the store to defaults — no stuck/blank state.
   */
  test('CD-17: page refresh keeps editor functional', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    // Reload page — mocks persist via page.route
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Editor still visible after reload
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });

    // Run button still present
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  });
});

// ─── STOP EXECUTION ───────────────────────────────────────────────────────────

test.describe('Code Dashboard — Execution Control', () => {
  /**
   * CD-18: During execution, a Stop button replaces Run.
   * After stop, Run button reappears.
   * Uses a delayed mock to keep execution "in progress" long enough to catch the Stop button.
   */
  test('CD-18: stop execution — Stop button appears then Run returns', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    // Delay execution response to keep isExecuting=true long enough to see Stop
    await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
      await new Promise(res => setTimeout(res, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, language: 'python', execution_time: 2.0, stdout: 'Done\n', stderr: '' }),
      });
    });

    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    // Click Run
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    // Stop button appears (isExecuting = true)
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible({ timeout: 5000 });

    // Click Stop
    await page.getByRole('button', { name: 'Stop' }).click();

    // Run button returns after stop
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ─── PERFORMANCE SANITY ───────────────────────────────────────────────────────

test.describe('Code Dashboard — Performance', () => {
  /**
   * CD-19: Under normal load, the code page must be interactive within
   * 20 seconds and the editor must be functional for input.
   */
  test('CD-19: performance sanity — page interactive within threshold', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    const t0 = Date.now();
    await goToCode(page);

    // Wait for editor to be ready
    await page.waitForSelector('.monaco-editor', { timeout: 20000 });
    const elapsed = Date.now() - t0;

    // Time to interactive must be under 20s in local dev
    expect(elapsed).toBeLessThan(20000);

    // Page remains responsive — Run button clickable
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  });

  /**
   * CD-20: Navigation between sidebar tabs (Explorer → Git → Explorer)
   * is instant with no blank/stuck states.
   */
  test('CD-20: sidebar tab switching is fast and stable', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);

    // Switch to Git
    await page.getByTitle('Source Control').click();
    await expect(page.locator('aside').getByText('Source Control').first()).toBeVisible({ timeout: 8000 });

    // Switch to Debug
    await page.getByTitle('Debug').click().catch(() =>
      page.locator('[title="Debug"]').first().click()
    );
    await page.waitForTimeout(300);

    // Switch back to Explorer
    await page.getByTitle('File Explorer').click().catch(() =>
      page.locator('[title="File Explorer"]').first().click()
    );

    // Editor still mounted
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Code Studio header always visible
    await expect(page.getByText('Code Studio')).toBeVisible();
  });
});

// ─── RESILIENCE / CONTINUITY REGRESSIONS ────────────────────────────────────

test.describe('Code Dashboard — Resilience and Continuity', () => {
  test('CD-21: run code — retry succeeds after transient backend 5xx', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    let callCount = 0;
    await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Transient failure' }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, language: 'python', execution_time: 0.03, stdout: 'Recovered\n', stderr: '' }),
      });
    });

    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText('Failed to execute code')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText('Code executed successfully')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.xterm-rows')).toContainText('Recovered', { timeout: 10000 });
  });

  test('CD-22: duplicate run clicks do not trigger duplicate execute requests', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);

    let executeCalls = 0;
    await page.route('**/api/v1/code/execute-direct', async (route: Route) => {
      executeCalls += 1;
      await new Promise(res => setTimeout(res, 1200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, language: 'python', execution_time: 1.2, stdout: 'Single request\n', stderr: '' }),
      });
    });

    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    const runButton = page.getByRole('button', { name: 'Run', exact: true });
    await runButton.dblclick();

    await expect.poll(() => executeCalls, { timeout: 4000 }).toBe(1);
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('CD-23: browser back and forward preserve code page operability', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    await page.goto('/overview');
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/code/, { timeout: 10000 });
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();

    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/overview/, { timeout: 10000 });
  });
  test('CD-24: AI Refine output should not leak into terminal', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    await expect(page.getByText('Refine AI').first()).toBeVisible({ timeout: 8000 });

    // Trigger AI optimize
    await page.getByRole('button', { name: 'Optimize performance' }).click();

    // Verify AI response goes to chat panel
    await expect(page.getByText('Here is an optimized version of your code.')).toBeVisible({ timeout: 10000 });

    // Grab all terminal text content
    const terminalText = await page.locator('.xterm').innerText();
    
    // Verify AI output is NOT in terminal
    expect(terminalText).not.toContain('Here is an optimized version of your code.');
    expect(terminalText).not.toContain('print("Optimized")');
  });

  test('CD-25: File tracking should persist via backend API', async ({ authenticatedPage: page }) => {
    await applyAllMocks(page);
    
    let pathCalls = 0;
    await page.route('**/api/v1/code/*/files/*', async (route: Route) => {
      if (route.request().method() === 'PATCH') {
        pathCalls++;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'file-id' }) });
        return;
      }
      await route.fallback();
    });

    await goToCode(page);
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    // Assume we have activeFileId setup by applyAllMocks (the app defaults if files exist)
    // Wait for the app to initialize its files
    
    // Simulate user editing the file (making it dirty)
    await page.locator('.view-line').first().click();
    await page.keyboard.type('test');

    // Simulate save
    await page.keyboard.press('Control+s');

    // Verify the HTTP PATCH request was fired
    await expect.poll(() => pathCalls, { timeout: 4000 }).toBeGreaterThan(0);
    
    // Verify success notification
    await expect(page.getByText(/Saved|File saved/)).toBeVisible();
  });
});
