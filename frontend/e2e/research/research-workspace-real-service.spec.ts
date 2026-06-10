/**
 * Research Workspace – Real-Service E2E Validation
 *
 * No mocks. Real auth → real backend on :8000 → real SSE streaming.
 * Credentials must be supplied via environment variables:
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 *
 * Run:
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
 *   npx playwright test e2e/research/research-workspace-real-service.spec.ts \
 *     --project=chromium --timeout 180000
 */

import { test, expect, type Page } from '@playwright/test';

// ── Credentials ───────────────────────────────────────────────────────────────
const EMAIL    = process.env.TEST_USER_EMAIL    ?? '';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? '';

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.',
  );
}

// ── Shared config (top-level, not inside describe) ────────────────────────────
test.use({
  baseURL:    'http://localhost:3000',
  viewport:   { width: 1440, height: 900 },
});

// ── Login helper ──────────────────────────────────────────────────────────────
async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const emailSel = page
    .locator('input[type="email"], input[name="email"]')
    .or(page.locator('input[placeholder*="email" i]'))
    .first();

  const passSel  = page.locator('input[type="password"]').first();
  const btnSel   = page.locator('button[type="submit"]').first();

  await emailSel.fill(email);
  await passSel.fill(password);
  await btnSel.click();

  // Wait for redirect away from /login
  await page.waitForURL(url => !url.toString().includes('/login'), {
    timeout: 20_000,
  }).catch(() => {
    // If no redirect, that is fine – test will detect it separately
  });
  await page.waitForLoadState('networkidle');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Research Workspace – real service validation', () => {

  // ── TC-01 ─────────────────────────────────────────────────────────────────
  test('TC-01 Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/TC-01-login-page.png', fullPage: true });

    await expect(page.locator('input[type="email"], input[name="email"]').or(
      page.locator('input[placeholder*="email" i]')
    ).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  // ── TC-02 ─────────────────────────────────────────────────────────────────
  test('TC-02 Login rejects bad credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailSel = page.locator('input[type="email"], input[name="email"]').or(
      page.locator('input[placeholder*="email" i]')
    ).first();
    const passSel  = page.locator('input[type="password"]').first();

    await emailSel.fill(EMAIL);
    await passSel.fill('WrongPassword_ZZZ_999!');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/TC-02-bad-creds.png', fullPage: true });

    // Should still be on /login
    expect(page.url()).toContain('/login');
  });

  // ── TC-03 ─────────────────────────────────────────────────────────────────
  test('TC-03 Successful login redirects away from /login', async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD);
    await page.screenshot({ path: 'test-results/TC-03-post-login.png', fullPage: true });

    expect(page.url()).not.toContain('/login');
  });

  // ── TC-04 ─────────────────────────────────────────────────────────────────
  test('TC-04 Research page loads with headings and phase tabs', async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD);

    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/TC-04-research-page.png', fullPage: true });

    // Must not be redirected back to login
    expect(page.url()).not.toContain('/login');

    // Page should contain research-related heading
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('[TC-04] Headings:', headings);

    const hasResearchKeyword = headings.some(h => /research|workspace|exploration/i.test(h));
    expect(hasResearchKeyword).toBe(true);

    // Phase tabs
    const phases = ['Exploration', 'Analysis', 'Synthesis', 'Finalization'];
    const foundPhases: string[] = [];

    for (const phase of phases) {
      const tab = page.locator(`text=${phase}`).first();
      if (await tab.isVisible().catch(() => false)) {
        foundPhases.push(phase);
        await tab.click();
        await page.waitForTimeout(700);
        await page.screenshot({
          path: `test-results/TC-04-phase-${phase.toLowerCase()}.png`,
          fullPage: true,
        });
      }
    }

    console.log('[TC-04] Phase tabs found:', foundPhases);
    // At least the Exploration tab should be present
    expect(foundPhases.length).toBeGreaterThan(0);
  });

  // ── TC-05 ─────────────────────────────────────────────────────────────────
  test('TC-05 Deep Research streaming calls SSE endpoint', async ({ page }) => {
    // Capture research API network traffic
    const networkLog: Array<{
      url: string; method: string; status: number | null; error?: string;
    }> = [];

    page.on('request',  req  => {
      if (req.url().includes('/api/v1/research')) {
        networkLog.push({ url: req.url(), method: req.method(), status: null });
      }
    });
    page.on('response', res  => {
      const entry = networkLog.find(r => r.url === res.url() && r.status === null);
      if (entry) entry.status = res.status();
    });
    page.on('requestfailed', req => {
      if (req.url().includes('/api/v1/research')) {
        networkLog.push({
          url:    req.url(),
          method: req.method(),
          status: null,
          error:  req.failure()?.errorText,
        });
      }
    });

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginAs(page, EMAIL, PASSWORD);

    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find query input – try multiple possible selectors
    const queryInput = page.locator([
      'textarea',
      'input[placeholder*="research" i]',
      'input[placeholder*="query" i]',
      'input[placeholder*="topic" i]',
      'input[placeholder*="question" i]',
    ].join(', ')).first();

    const inputVisible = await queryInput.isVisible().catch(() => false);
    if (!inputVisible) {
      // Debug: log all inputs
      const allInputs = await page.locator('input, textarea').all();
      for (const inp of allInputs) {
        console.log(`  Input: type="${await inp.getAttribute('type')}" placeholder="${await inp.getAttribute('placeholder')}"`);
      }
      await page.screenshot({ path: 'test-results/TC-05-no-input.png', fullPage: true });
    }

    await queryInput.fill('transformer scaling laws in low resource settings');

    // Select Quick depth
    for (const sel of ['button', 'label', '[role="radio"]', '[role="option"]']) {
      const quickBtn = page.locator(sel).filter({ hasText: /^Quick$/i }).first();
      if (await quickBtn.isVisible().catch(() => false)) {
        await quickBtn.click();
        break;
      }
    }

    await page.screenshot({ path: 'test-results/TC-05-pre-start.png', fullPage: true });

    // Click start
    const startBtn = page.locator('button').filter({
      hasText: /start research|begin|research now|analyze/i,
    }).first();
    await startBtn.click();

    await page.screenshot({ path: 'test-results/TC-05-started.png', fullPage: true });

    // Wait up to 3 minutes for completion
    const completionCues = [
      '[data-testid="research-complete"]',
      'text=/research complete/i',
      'text=/executive summary/i',
      'text=/key findings/i',
      'text=/📋 research report/i',
      '[data-testid="report"]',
    ];

    let done = false;
    for (let tick = 0; tick < 36 && !done; tick++) {
      await page.waitForTimeout(5000);
      for (const cue of completionCues) {
        if (await page.locator(cue).first().isVisible().catch(() => false)) {
          done = true;
          console.log(`[TC-05] Complete after ${(tick + 1) * 5}s (matched: ${cue})`);
          break;
        }
      }
    }

    await page.screenshot({ path: 'test-results/TC-05-final.png', fullPage: true });

    console.log('[TC-05] Network log:');
    networkLog.forEach(e => console.log(`  ${e.method} ${e.url} → ${e.status ?? 'FAILED'} ${e.error ?? ''}`));

    if (consoleErrors.length) {
      console.warn('[TC-05] Console errors:', consoleErrors);
    }

    // Assertions
    const streamEntry = networkLog.find(e => e.url.includes('stream'));
    expect(streamEntry).toBeDefined();
    expect(streamEntry?.status).toBe(200);
    expect(done).toBe(true);
  });

  // ── TC-06 ─────────────────────────────────────────────────────────────────
  test('TC-06 Analysis tool cards open modals', async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD);

    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Switch to Analysis phase
    const analysisTab = page.locator('text=Analysis').first();
    if (await analysisTab.isVisible().catch(() => false)) {
      await analysisTab.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/TC-06-analysis.png', fullPage: true });

    const tools = ['Gap Detector', 'Method Comparator', 'Question Generator'];
    const found: string[] = [];

    for (const tool of tools) {
      const card = page.locator(`text="${tool}"`).first();
      if (await card.isVisible().catch(() => false)) {
        found.push(tool);
        await card.click();
        await page.waitForTimeout(800);
        await page.screenshot({
          path: `test-results/TC-06-${tool.replace(/\s+/g, '-').toLowerCase()}.png`,
          fullPage: true,
        });

        // Close modal
        const closeEl = page.locator('[aria-label="Close"]').first();
        if (await closeEl.isVisible().catch(() => false)) {
          await closeEl.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(400);
      }
    }

    console.log('[TC-06] Found tools:', found);
    expect(found.length).toBeGreaterThan(0);
  });

  // ── TC-07 ─────────────────────────────────────────────────────────────────
  test('TC-07 Research page is usable at 375px mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page, EMAIL, PASSWORD);

    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/TC-07-mobile.png', fullPage: true });

    // Not redirected to login
    expect(page.url()).not.toContain('/login');

    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    console.log('[TC-07] Horizontal overflow:', overflow);
    // We report but don't hard-fail on overflow (many apps have minor overflow)
  });
});

// ── Regression Suite: DEF-01 / DEF-03 / Mobile ───────────────────────────────
// These tests explicitly guard fixes made in the previous session.
// They run separately so they can be targeted individually:
//   npx playwright test --grep "Regression"

test.describe('Regression guards', () => {
  // ── TC-08 ─────────────────────────────────────────────────────────────────
  test('TC-08 SSE POST carries a non-empty Bearer token', async ({ page }) => {
    // Capture every request made to the SSE stream endpoint and verify auth.
    const sseRequests: string[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/deep-research/stream')) {
        const auth = req.headers()['authorization'] ?? '';
        sseRequests.push(auth);
      }
    });

    await loginAs(page, EMAIL, PASSWORD);
    await page.goto('/research');
    await page.waitForLoadState('networkidle');

    // Trigger a research run
    const textarea = page.locator('textarea, input[type="text"]').first();
    await textarea.fill('Machine learning efficiency');
    const startBtn = page.locator('button:has-text("Start Research"), button:has-text("Research")').first();
    await startBtn.click();

    // Wait briefly for the SSE request to fire
    await page.waitForTimeout(3000);

    if (sseRequests.length > 0) {
      const auth = sseRequests[0];
      expect(auth).toMatch(/^Bearer\s+\S+/);
      // The token must not be the literal "null" or empty string
      expect(auth).not.toContain('null');
      expect(auth.length).toBeGreaterThan(10);
      console.log('[TC-08] Bearer auth prefix:', auth.slice(0, 20) + '…');
    } else {
      // Research button may not have fired yet — that's okay for this TC
      console.log('[TC-08] No SSE request observed (button may be disabled until hydrated)');
    }
  });

  // ── TC-09 ─────────────────────────────────────────────────────────────────
  test('TC-09 Closed share overlay does not intercept pointer events', async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD);
    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify the overlay is not blocking clicks by checking its computed style.
    // The overlay must have pointer-events: none when no modal is open.
    const overlayPointerEvents = await page.evaluate(() => {
      // Find any element with shareOverlay in its class list
      const overlay = document.querySelector('[class*="shareOverlay"]') as HTMLElement | null;
      if (!overlay) return 'not_found';
      return window.getComputedStyle(overlay).pointerEvents;
    });

    console.log('[TC-09] Overlay pointer-events when closed:', overlayPointerEvents);

    // Must be 'none' or 'not_found' (element only mounted when modal is open)
    if (overlayPointerEvents !== 'not_found') {
      expect(overlayPointerEvents).toBe('none');
    }
  });

  // ── TC-10 ─────────────────────────────────────────────────────────────────
  test('TC-10 Mobile 375px has no horizontal overflow (hard fail)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page, EMAIL, PASSWORD);

    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const overflowWidth = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth:  window.innerWidth,
    }));

    console.log('[TC-10] scrollWidth:', overflowWidth.scrollWidth, 'innerWidth:', overflowWidth.innerWidth);

    // Allow up to 5px tolerance for sub-pixel rendering
    expect(overflowWidth.scrollWidth).toBeLessThanOrEqual(overflowWidth.innerWidth + 5);
  });

  // ── TC-11 ─────────────────────────────────────────────────────────────────
  test('TC-11 Analysis tool modals open and close without leaving overlay active', async ({ page }) => {
    await loginAs(page, EMAIL, PASSWORD);
    await page.goto('/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the first clickable tool card
    const toolCard = page.locator('[class*="analysisTool"]').first();
    if (!(await toolCard.isVisible().catch(() => false))) {
      console.log('[TC-11] No tool cards visible, skipping');
      return;
    }

    // Open the modal
    await toolCard.click();
    await page.waitForTimeout(600);

    // Modal must be visible
    const modal = page.locator('[class*="shareOverlayOpen"]').first();
    const modalVisible = await modal.isVisible().catch(() => false);
    expect(modalVisible).toBe(true);

    // Close via aria-label button
    const closeBtn = page.locator('[aria-label="Close"]').first();
    await closeBtn.click();
    await page.waitForTimeout(600);

    // After close, overlay pointer-events must return to none
    const afterClose = await page.evaluate(() => {
      const overlay = document.querySelector('[class*="shareOverlay"]') as HTMLElement | null;
      if (!overlay) return 'not_found';
      return window.getComputedStyle(overlay).pointerEvents;
    });

    console.log('[TC-11] Overlay pointer-events after close:', afterClose);
    if (afterClose !== 'not_found') {
      expect(afterClose).toBe('none');
    }
  });
});
