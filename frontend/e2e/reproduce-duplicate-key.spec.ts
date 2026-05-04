import { test, expect } from '@playwright/test';

test.describe('Duplicate Key Warning Reproduction', () => {
  test('should navigate and trigger list rendering on code page', async ({ page }) => {
    const consoleMessages: string[] = [];
    const duplicateKeyWarnings: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (text.includes('two children') && text.includes('same key')) {
        duplicateKeyWarnings.push(text);
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:3000/code');
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: /new|file|folder/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const event = new CustomEvent('list-render-test');
      window.dispatchEvent(event);
    });
    await page.waitForTimeout(1000);

    console.log('--- All Console Messages ---');
    consoleMessages.forEach(m => console.log(m));
    console.log('--- Duplicate Key Warnings ---');
    console.log(duplicateKeyWarnings);

    console.log('\nRESULT: Test complete');
  });
});