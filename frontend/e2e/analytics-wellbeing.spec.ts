import { test, expect } from './fixtures/auth.fixture';
import type { Route } from '@playwright/test';

function wellbeingCheckConcern() {
  return {
    signals_detected: ['marathon'],
    overall_status: 'concern',
    stress_score: 7,
    intervention: {
      type: 'break_reminder',
      message: 'Take a short reset.',
      action: 'start_break_timer',
      duration: 10,
    },
    message: 'A short reset can help.',
    tips: ['Stand up briefly.', 'Hydrate before continuing.'],
  };
}

test.describe('Analytics Wellbeing Banner', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.route('**/api/v1/analytics/**', async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (method === 'GET' && url.includes('/api/v1/analytics/datasets')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (method === 'GET' && url.includes('/api/v1/analytics/sessions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route('**/api/v1/wellbeing/check**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(wellbeingCheckConcern()),
      });
    });

    await page.route('**/api/v1/wellbeing/event', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route('**/api/v1/wellbeing/pomodoro', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'started',
          focus_minutes: 25,
          break_minutes: 10,
          topic: 'Analytics reset',
        }),
      });
    });
  });

  test('AW-01: renders wellbeing banner and allows key actions', async ({ authenticatedPage: page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Wellbeing support/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Start reset/i })).toBeVisible();

    await page.getByRole('button', { name: /Tips/i }).click();
    await expect(page.getByText(/Support options/i)).toBeVisible();

    await page.getByRole('button', { name: /Start a short reset/i }).click();
    await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible();

    await page.getByLabel('Dismiss wellbeing banner').click();
    await expect(page.getByText(/Wellbeing support/i)).not.toBeVisible();
  });

  test('AW-02: wellbeing interactions keep memory delta under 20MB when browser memory API is available', async ({ authenticatedPage: page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const before = await page.evaluate(() => {
      return (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize ?? null;
    });

    await page.getByRole('button', { name: /Tips/i }).click();
    await page.getByRole('button', { name: /Start a short reset/i }).click();
    await page.getByRole('button', { name: /Pause/i }).click();
    await page.getByRole('button', { name: /Resume/i }).click();

    const after = await page.evaluate(() => {
      return (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize ?? null;
    });

    if (before !== null && after !== null) {
      const delta = after - before;
      expect(delta).toBeLessThan(20 * 1024 * 1024);
    }
  });
});
