/**
 * Authentication Fixtures for E2E Tests
 * Provides reusable authentication setup and teardown
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  token?: string;
}

interface AuthFixtures {
  authenticatedPage: any;
  testUser: TestUser;
}

// Test user credentials - should be configured via environment variables, not hardcoded
// For development/testing only - NEVER use real credentials in code
const getTestCredentials = () => {
  return {
    regular: {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    },
    premium: {
      email: process.env.TEST_PREMIUM_EMAIL || 'premium@example.com',
      password: process.env.TEST_PREMIUM_PASSWORD || 'PremiumPass123!',
    },
  };
};

export const TEST_USERS = getTestCredentials();

/**
 * Extended test fixture with authentication
 */
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    await use(TEST_USERS.regular);
  },

  authenticatedPage: async ({ page, testUser }: { page: Page; testUser: TestUser }, use: (page: Page) => Promise<void>) => {
    // Navigate to login page
    await page.goto('/login');

    // Perform login
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for successful login (redirect or token storage)
    await page.waitForURL('**/overview', { timeout: 10000 }).catch(() => {
      // If URL doesn't change, check for token in localStorage
      return page.waitForFunction(() => localStorage.getItem('token') !== null, { timeout: 5000 });
    });

    // Verify authentication
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    await use(page);

    // Cleanup: logout after test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },
});

export { expect } from '@playwright/test';

/**
 * Mock authentication for tests that don't need real backend
 */
export async function mockAuth(page: any, mockUser: Partial<TestUser> = {}) {
  const mockToken = process.env.TEST_MOCK_TOKEN || 'mock-jwt-token-test-only';
  const defaultMockUser = {
    email: 'mock@example.com',
    token: mockToken,
    ...mockUser,
  };

  await page.addInitScript((user: { email: string; token?: string }) => {
    localStorage.setItem('token', user.token || '');
    localStorage.setItem('user', JSON.stringify({
      id: '123',
      email: user.email,
      name: 'Test User',
    }));
  }, defaultMockUser);
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: any, urlPattern: string | RegExp) {
  return page.waitForResponse((response: any) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}
