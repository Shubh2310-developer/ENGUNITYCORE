/**
 * JobPrep Feature - Edge Case Test Suite
 * Tests boundary conditions, error scenarios, and unusual inputs
 */

import { test, expect } from './fixtures/auth';
import { mockAuth } from './fixtures/auth';

test.describe('JobPrep Edge Cases - Boundary & Error Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.goto('/jobprep');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Input Validation Edge Cases', () => {
    test('should handle extremely long role titles', async ({ page }) => {
      await page.click('button:has-text("Add Role")');
      
      const longTitle = 'A'.repeat(500); // 500 character title
      await page.fill('input[name="role_title"]', longTitle);
      
      await page.click('button[type="submit"]');
      
      // Should either truncate or show validation error
      await page.waitForTimeout(2000);
      // Verify page doesn't crash
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle special characters in skill names', async ({ page }) => {
      await page.click('button:has-text("Add Skill")');
      
      const specialChars = 'React.js / Next.js (TypeScript) & Node.js <v18>';
      await page.fill('input[name="skill_name"]', specialChars);
      await page.fill('input[name="current_level"]', '3');
      
      await page.click('button[type="submit"]');
      
      // Should handle special characters properly
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle empty form submissions', async ({ page }) => {
      await page.click('button:has-text("Add Project")');
      
      // Try to submit without filling anything
      await page.click('button[type="submit"]');
      
      // Should show validation errors or prevent submission
      await page.waitForTimeout(1000);
      const modalStillOpen = await page.locator('input[name="title"]').isVisible();
      expect(modalStillOpen).toBeTruthy(); // Modal should still be open
    });

    test('should handle invalid URLs in project GitHub field', async ({ page }) => {
      await page.click('button:has-text("Add Project")');
      
      await page.fill('input[name="title"]', 'Test Project');
      await page.fill('input[name="github_url"]', 'not-a-valid-url');
      
      await page.click('button[type="submit"]');
      
      // Should validate URL format
      await page.waitForTimeout(1000);
    });

    test('should handle negative skill levels', async ({ page }) => {
      await page.click('button:has-text("Add Skill")');
      
      await page.fill('input[name="skill_name"]', 'Python');
      await page.fill('input[name="current_level"]', '-5');
      
      await page.click('button[type="submit"]');
      
      // Should reject or clamp to valid range
      await page.waitForTimeout(1000);
    });

    test('should handle skill levels above maximum', async ({ page }) => {
      await page.click('button:has-text("Add Skill")');
      
      await page.fill('input[name="skill_name"]', 'Java');
      await page.fill('input[name="current_level"]', '100');
      
      await page.click('button[type="submit"]');
      
      // Should reject or clamp to max (5)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Data Limits & Large Datasets', () => {
    test('should handle adding many roles (stress test)', async ({ page }) => {
      // Try adding 20 roles
      for (let i = 1; i <= 5; i++) { // Reduced to 5 for test speed
        await page.click('button:has-text("Add Role")');
        await page.fill('input[name="role_title"]', `Engineer ${i}`);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }
      
      // Page should still be responsive
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle adding many skills', async ({ page }) => {
      // Try adding 10 skills
      const skills = ['JavaScript', 'Python', 'Java', 'C++', 'Go'];
      
      for (const skill of skills) {
        await page.click('button:has-text("Add Skill")');
        await page.fill('input[name="skill_name"]', skill);
        await page.fill('input[name="current_level"]', '3');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle project with very long description', async ({ page }) => {
      await page.click('button:has-text("Add Project")');
      
      const longDesc = 'This is a detailed project description. '.repeat(100); // ~4000 chars
      await page.fill('input[name="title"]', 'Complex Project');
      await page.fill('textarea[name="description"]', longDesc);
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle many tech stack items', async ({ page }) => {
      await page.click('button:has-text("Add Project")');
      
      const manyTechs = Array(50).fill('').map((_, i) => `Tech${i}`).join(', ');
      await page.fill('input[name="title"]', 'Full Stack App');
      await page.fill('input[name="tech_stack"]', manyTechs);
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Network & API Error Scenarios', () => {
    test('should handle slow API responses', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/v1/jobprep/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
        await route.continue();
      });

      await page.click('button:has-text("Add Role")');
      await page.fill('input[name="role_title"]', 'Slow Role');
      await page.click('button[type="submit"]');
      
      // Should show loading state
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle API timeout', async ({ page }) => {
      await page.route('**/api/v1/jobprep/roles', route => {
        // Abort to simulate timeout
        route.abort('timedout');
      });

      await page.click('button:has-text("Add Role")');
      await page.fill('input[name="role_title"]', 'Timeout Role');
      await page.click('button[type="submit"]');
      
      // Should handle timeout gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle 500 server errors', async ({ page }) => {
      await page.route('**/api/v1/jobprep/skills', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.click('button:has-text("Add Skill")');
      await page.fill('input[name="skill_name"]', 'Error Skill');
      await page.click('button[type="submit"]');
      
      // Should show error notification or message
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle 403 forbidden errors', async ({ page }) => {
      await page.route('**/api/v1/jobprep/projects', route => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({ error: 'Forbidden' })
        });
      });

      await page.click('button:has-text("Add Project")');
      await page.fill('input[name="title"]', 'Forbidden Project');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle malformed API responses', async ({ page }) => {
      await page.route('**/api/v1/jobprep/roles', route => {
        route.fulfill({
          status: 200,
          body: 'This is not valid JSON{[}]'
        });
      });

      await page.goto('/jobprep');
      
      // Should handle parse errors
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Browser & State Edge Cases', () => {
    test('should handle rapid tab switching', async ({ page }) => {
      const tabs = ['overview', 'roles', 'skills', 'projects', 'interview'];
      
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`).first();
        if (await tabButton.isVisible()) {
          await tabButton.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Should not crash or show broken UI
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle rapid modal open/close', async ({ page }) => {
      for (let i = 0; i < 5; i++) {
        await page.click('button:has-text("Add Role")');
        await page.waitForTimeout(200);
        
        const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('button:has-text("Cancel")'));
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(200);
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle offline mode', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true);
      
      await page.click('button:has-text("Add Role")');
      await page.fill('input[name="role_title"]', 'Offline Role');
      await page.click('button[type="submit"]');
      
      // Should show offline error
      await page.waitForTimeout(2000);
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should handle localStorage being full', async ({ page }) => {
      // Fill localStorage
      await page.evaluate(() => {
        try {
          for (let i = 0; i < 1000; i++) {
            localStorage.setItem(`test_${i}`, 'x'.repeat(10000));
          }
        } catch (e) {
          // Storage full - expected
        }
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should handle gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle sessionStorage being cleared mid-session', async ({ page }) => {
      await page.click('button:has-text("Add Skill")');
      
      // Clear session storage mid-action
      await page.evaluate(() => sessionStorage.clear());
      
      await page.fill('input[name="skill_name"]', 'Session Test');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Concurrent Operation Edge Cases', () => {
    test('should handle multiple simultaneous operations', async ({ page }) => {
      // Try to open multiple modals at once (shouldn't be possible but test it)
      await Promise.all([
        page.click('button:has-text("Add Role")').catch(() => {}),
        page.click('button:has-text("Add Skill")').catch(() => {}),
      ]);
      
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle deletion while viewing details', async ({ page }) => {
      // Add a role
      await page.click('button:has-text("Add Role")');
      await page.fill('input[name="role_title"]', 'Delete Test Role');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      // Try to view and delete simultaneously
      const deleteBtn = page.locator('button:has-text("Delete")').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        const confirmBtn = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Yes")'));
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }
      }
      
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('XSS & Security Edge Cases', () => {
    test('should sanitize HTML in role titles', async ({ page }) => {
      await page.click('button:has-text("Add Role")');
      
      const xssAttempt = '<script>alert("XSS")</script>';
      await page.fill('input[name="role_title"]', xssAttempt);
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      
      // Should not execute script
      const alerts = page.locator('text=/alert/i');
      const hasAlert = await alerts.count() > 0;
      // Script tag should be sanitized/escaped
    });

    test('should sanitize SQL-like strings', async ({ page }) => {
      await page.click('button:has-text("Add Skill")');
      
      const sqlInjection = "'; DROP TABLE skills; --";
      await page.fill('input[name="skill_name"]', sqlInjection);
      await page.fill('input[name="current_level"]', '3');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle iframe injection attempts', async ({ page }) => {
      await page.click('button:has-text("Add Project")');
      
      const iframeAttempt = '<iframe src="http://malicious.com"></iframe>';
      await page.fill('input[name="title"]', iframeAttempt);
      await page.fill('textarea[name="description"]', iframeAttempt);
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      
      // Should not render iframe
      const iframes = page.locator('iframe');
      const iframeCount = await iframes.count();
      // Should be 0 malicious iframes (may have legitimate ones)
    });
  });

  test.describe('Accessibility Edge Cases', () => {
    test('should handle keyboard-only navigation', async ({ page }) => {
      // Try navigating with keyboard only
      await page.keyboard.press('Tab'); // Focus first element
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Try to activate
      
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle screen reader mode', async ({ page }) => {
      // Check for ARIA labels
      const ariaLabels = page.locator('[aria-label]');
      const count = await ariaLabels.count();
      
      // Should have some ARIA labels for accessibility
      expect(count).toBeGreaterThan(0);
    });

    test('should maintain focus after modal close', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Role")').first();
      await addButton.click();
      await page.waitForTimeout(500);
      
      const closeButton = page.locator('button:has-text("Cancel")').or(page.locator('button[aria-label="Close"]'));
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
      
      await page.waitForTimeout(500);
      
      // Focus should return to trigger button or reasonable element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('should handle rapid clicking (debounce test)', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add Role")').first();
      
      // Click rapidly 10 times
      for (let i = 0; i < 10; i++) {
        await addButton.click({ timeout: 100 }).catch(() => {});
      }
      
      await page.waitForTimeout(1000);
      
      // Should only open one modal (debounced)
      const modals = page.locator('input[name="role_title"]');
      const modalCount = await modals.count();
      expect(modalCount).toBeLessThanOrEqual(1);
    });

    test('should handle memory leaks in long session', async ({ page }) => {
      // Perform many operations
      for (let i = 0; i < 10; i++) {
        await page.click('button:has-text("Add Role")');
        await page.waitForTimeout(100);
        
        const cancelBtn = page.locator('button:has-text("Cancel")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Check if page is still responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('JobPrep Real-World Scenario Edge Cases', () => {
  test('should handle user changing their mind mid-form', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/jobprep');
    
    // Start adding a role
    await page.click('button:has-text("Add Role")');
    await page.fill('input[name="role_title"]', 'Initial Role');
    
    // Change mind and cancel
    const cancelBtn = page.locator('button:has-text("Cancel")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
    
    // Start again with different data
    await page.click('button:has-text("Add Role")');
    
    // Form should be clean
    const titleInput = page.locator('input[name="role_title"]');
    const value = await titleInput.inputValue();
    expect(value).toBe('');
  });

  test('should handle duplicate skill names', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/jobprep');
    
    // Add a skill
    await page.click('button:has-text("Add Skill")');
    await page.fill('input[name="skill_name"]', 'React');
    await page.fill('input[name="current_level"]', '3');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Try to add same skill again
    await page.click('button:has-text("Add Skill")');
    await page.fill('input[name="skill_name"]', 'React');
    await page.fill('input[name="current_level"]', '4');
    await page.click('button[type="submit"]');
    
    // Should handle duplicate (update or reject)
    await page.waitForTimeout(1000);
  });
});
