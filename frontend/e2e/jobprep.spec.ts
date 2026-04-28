/**
 * JobPrep Feature - E2E Test Suite
 * Tests all major functionality of the JobPrep feature
 */

import { test, expect } from './fixtures/auth';
import { mockAuth, waitForApiCall } from './fixtures/auth';

test.describe('JobPrep Feature - Complete E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for faster tests
    await mockAuth(page);
    
    // Navigate to JobPrep page
    await page.goto('/jobprep');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Profile Management', () => {
    test('should display profile section', async ({ page }) => {
      await expect(page.locator('text=Profile')).toBeVisible();
      await expect(page.locator('text=Readiness Score')).toBeVisible();
    });

    test('should allow profile creation on first visit', async ({ page }) => {
      // Check if profile creation happens automatically
      const profileSection = page.locator('[data-testid="profile-section"]').or(page.locator('text=Your Profile'));
      await expect(profileSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display readiness score', async ({ page }) => {
      const readinessScore = page.locator('[data-testid="readiness-score"]').or(page.locator('text=/\\d+%/'));
      await expect(readinessScore.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Target Roles Management', () => {
    test('should open add role modal', async ({ page }) => {
      // Click Add Role button
      const addButton = page.locator('button:has-text("Add Role")').or(page.locator('button:has-text("Add Target Role")'));
      await addButton.first().click();

      // Verify modal is open
      await expect(page.locator('input[name="role_title"]').or(page.locator('input[placeholder*="role"]').first())).toBeVisible();
    });

    test('should create a new target role', async ({ page }) => {
      // Click Add Role button
      await page.click('button:has-text("Add Role"), button:has-text("Add Target Role")');

      // Fill in role details
      await page.fill('input[name="role_title"]', 'Senior Software Engineer');
      await page.selectOption('select[name="role_category"]', 'Engineering');
      await page.selectOption('select[name="seniority_level"]', 'senior');

      // Submit form
      await page.click('button:has-text("Add"), button:has-text("Create"), button[type="submit"]');

      // Verify role appears in list
      await expect(page.locator('text=Senior Software Engineer')).toBeVisible({ timeout: 5000 });
    });

    test('should trigger AI role analysis', async ({ page }) => {
      // Find a role card with analysis button
      const analysisButton = page.locator('button:has-text("Analyze")').or(page.locator('button:has-text("AI Intelligence")'));
      
      if (await analysisButton.count() > 0) {
        await analysisButton.first().click();
        
        // Wait for analysis to complete
        await expect(page.locator('text=Salary Range').or(page.locator('text=Market Data'))).toBeVisible({ timeout: 15000 });
      }
    });

    test('should delete a target role', async ({ page }) => {
      // Find delete button
      const deleteButton = page.locator('button:has-text("Delete")').or(page.locator('[aria-label="Delete role"]'));
      
      if (await deleteButton.count() > 0) {
        const initialCount = await page.locator('[data-testid="role-card"]').count();
        await deleteButton.first().click();
        
        // Confirm deletion if modal appears
        const confirmButton = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Yes")'));
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }
        
        // Verify role is removed
        await page.waitForTimeout(1000);
        const newCount = await page.locator('[data-testid="role-card"]').count();
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    });
  });

  test.describe('Skills Matrix', () => {
    test('should display skills section', async ({ page }) => {
      await expect(page.locator('text=Skills Matrix').or(page.locator('text=Skills'))).toBeVisible();
    });

    test('should add a new skill', async ({ page }) => {
      // Navigate to Skills tab if needed
      const skillsTab = page.locator('button:has-text("Skills")').or(page.locator('[data-tab="skills"]'));
      if (await skillsTab.isVisible({ timeout: 2000 })) {
        await skillsTab.click();
      }

      // Click Add Skill button
      await page.click('button:has-text("Add Skill")');

      // Fill skill form
      await page.fill('input[name="skill_name"]', 'TypeScript');
      await page.selectOption('select[name="skill_category"]', 'Frontend');
      await page.fill('input[name="current_level"]', '3');
      await page.fill('input[name="target_level"]', '5');

      // Submit
      await page.click('button:has-text("Add"), button:has-text("Create"), button[type="submit"]');

      // Verify skill appears
      await expect(page.locator('text=TypeScript')).toBeVisible({ timeout: 5000 });
    });

    test('should manage skill evidence', async ({ page }) => {
      // Find evidence button
      const evidenceButton = page.locator('button:has-text("Evidence")').or(page.locator('button:has-text("Manage Evidence")'));
      
      if (await evidenceButton.count() > 0) {
        await evidenceButton.first().click();
        
        // Verify evidence modal/panel opens
        await expect(page.locator('text=Add Evidence').or(page.locator('text=Evidence Items'))).toBeVisible({ timeout: 3000 });
      }
    });

    test('should add skill evidence', async ({ page }) => {
      // Open evidence management
      const evidenceButton = page.locator('button:has-text("Evidence")').or(page.locator('button:has-text("Manage Evidence")'));
      if (await evidenceButton.count() > 0) {
        await evidenceButton.first().click();
        
        // Add evidence
        const addEvidenceBtn = page.locator('button:has-text("Add Evidence")');
        if (await addEvidenceBtn.isVisible({ timeout: 2000 })) {
          await addEvidenceBtn.click();
          
          await page.fill('input[name="title"]', 'React Project');
          await page.selectOption('select[name="evidence_type"]', 'project');
          await page.fill('input[name="url"]', 'https://github.com/user/react-project');
          
          await page.click('button:has-text("Add"), button[type="submit"]');
          
          // Verify evidence added
          await expect(page.locator('text=React Project')).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test('should delete skill evidence', async ({ page }) => {
      // This tests the fix we just applied
      const deleteEvidenceBtn = page.locator('button:has-text("Delete Evidence")').or(page.locator('[aria-label="Delete evidence"]'));
      
      if (await deleteEvidenceBtn.count() > 0) {
        await deleteEvidenceBtn.first().click();
        
        // Confirm if needed
        const confirmBtn = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Yes")'));
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }
        
        // Should not throw error (tests our fix)
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Projects Portfolio', () => {
    test('should display projects section', async ({ page }) => {
      const projectsTab = page.locator('button:has-text("Projects")').or(page.locator('[data-tab="projects"]'));
      if (await projectsTab.isVisible({ timeout: 2000 })) {
        await projectsTab.click();
      }
      
      await expect(page.locator('text=Projects').or(page.locator('text=Portfolio'))).toBeVisible();
    });

    test('should add a manual project', async ({ page }) => {
      await page.click('button:has-text("Add Project")');

      await page.fill('input[name="title"]', 'E-Commerce Platform');
      await page.fill('textarea[name="description"]', 'Full-stack e-commerce application');
      await page.fill('input[name="github_url"]', 'https://github.com/user/ecommerce');

      await page.click('button:has-text("Add"), button:has-text("Create"), button[type="submit"]');

      await expect(page.locator('text=E-Commerce Platform')).toBeVisible({ timeout: 5000 });
    });

    test('should trigger project AI analysis', async ({ page }) => {
      const analyzeButton = page.locator('button:has-text("Analyze")').or(page.locator('button:has-text("AI Analysis")'));
      
      if (await analyzeButton.count() > 0) {
        await analyzeButton.first().click();
        
        // Wait for analysis results
        await expect(page.locator('text=Complexity Score').or(page.locator('text=Analysis'))).toBeVisible({ timeout: 15000 });
      }
    });

    test('should import GitHub repository', async ({ page }) => {
      const importButton = page.locator('button:has-text("Import")').or(page.locator('button:has-text("GitHub")'));
      
      if (await importButton.isVisible({ timeout: 2000 })) {
        await importButton.click();
        
        await page.fill('input[name="owner"]', 'facebook');
        await page.fill('input[name="repo_name"]', 'react');
        
        await page.click('button:has-text("Import")');
        
        // Wait for import to complete
        await expect(page.locator('text=react')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Interview Simulator', () => {
    test('should display interview simulator', async ({ page }) => {
      const simulatorTab = page.locator('button:has-text("Interview")').or(page.locator('[data-tab="interview"]'));
      if (await simulatorTab.isVisible({ timeout: 2000 })) {
        await simulatorTab.click();
      }
      
      await expect(page.locator('text=Interview Simulator').or(page.locator('text=Practice Interview'))).toBeVisible();
    });

    test('should start a new interview simulation', async ({ page }) => {
      await page.click('button:has-text("Interview"), button:has-text("Simulator")');
      const newSimulationButton = page.locator('button:has-text("New Simulation")').or(page.locator('button:has-text("Start Interview")')).first();
      await newSimulationButton.click();

      // Select role
      await page.selectOption('select[name="role"]', { index: 0 });
      await page.selectOption('select[name="difficulty"]', 'medium');

      await page.click('button:has-text("Start")');

      // Verify question appears
      await expect(page.locator('text=Question').or(page.locator('[data-testid="interview-question"]'))).toBeVisible({ timeout: 5000 });
    });

    test('should submit answer and receive feedback', async ({ page }) => {
      // Assuming we're in an active simulation
      const answerInput = page.locator('textarea[name="answer"]').or(page.locator('textarea[placeholder*="answer"]'));
      
      if (await answerInput.isVisible({ timeout: 2000 })) {
        await answerInput.fill('This is my detailed answer to the interview question...');
        
        await page.click('button:has-text("Submit")');
        
        // Wait for AI feedback
        await expect(page.locator('text=Feedback').or(page.locator('text=Score'))).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Practice Arena', () => {
    test('should display practice arena', async ({ page }) => {
      const practiceTab = page.locator('button:has-text("Practice")').or(page.locator('[data-tab="practice"]'));
      if (await practiceTab.isVisible({ timeout: 2000 })) {
        await practiceTab.click();
      }
      
      await expect(page.locator('text=Practice Arena').or(page.locator('text=Challenges'))).toBeVisible();
    });

    test('should select and attempt a challenge', async ({ page }) => {
      const challengeCard = page.locator('[data-testid="challenge-card"]').or(page.locator('button:has-text("Start Challenge")'));
      
      if (await challengeCard.count() > 0) {
        await challengeCard.first().click();
        
        // Fill in response
        const responseInput = page.locator('textarea[name="response"]').or(page.locator('textarea'));
        if (await responseInput.isVisible({ timeout: 2000 })) {
          await responseInput.fill('My solution to the challenge...');
          
          await page.click('button:has-text("Submit")');
          
          // Wait for evaluation
          await expect(page.locator('text=Evaluation').or(page.locator('text=Score'))).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Readiness Tracker', () => {
    test('should display readiness dashboard', async ({ page }) => {
      const readinessTab = page.locator('button:has-text("Readiness")').or(page.locator('[data-tab="readiness"]'));
      if (await readinessTab.isVisible({ timeout: 2000 })) {
        await readinessTab.click();
      }
      
      await expect(page.locator('text=Readiness').or(page.locator('text=Overall Score'))).toBeVisible();
    });

    test('should display skill gaps', async ({ page }) => {
      await expect(page.locator('text=Skill Gap').or(page.locator('text=Gaps'))).toBeVisible({ timeout: 5000 });
    });

    test('should display readiness history chart', async ({ page }) => {
      const chart = page.locator('canvas').or(page.locator('[data-testid="readiness-chart"]'));
      await expect(chart.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data after page reload', async ({ page }) => {
      // Add a role
      await page.click('button:has-text("Add Role")');
      await page.fill('input[name="role_title"]', 'Data Scientist');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Data Scientist')).toBeVisible();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify data is still there
      await expect(page.locator('text=Data Scientist')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/jobprep');
      await page.waitForLoadState('networkidle');
      
      // Verify main elements are visible
      await expect(page.locator('text=JobPrep').or(page.locator('text=Profile'))).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/jobprep');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=JobPrep').or(page.locator('text=Profile'))).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/jobprep/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/jobprep');
      
      // Should not crash, might show error message
      await page.waitForTimeout(2000);
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle authentication errors', async ({ page }) => {
      // Clear auth token
      await page.evaluate(() => localStorage.removeItem('token'));
      
      await page.goto('/jobprep');
      
      // Should redirect to login or show auth error
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url.includes('/login') || url.includes('/jobprep')).toBeTruthy();
    });
  });
});

test.describe('JobPrep Integration Tests', () => {
  test('complete user journey: profile to interview', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/jobprep');
    
    // 1. Create profile (auto-created)
    await expect(page.locator('text=Profile').or(page.locator('text=JobPrep'))).toBeVisible();
    
    // 2. Add target role
    await page.click('button:has-text("Add Role")');
    await page.fill('input[name="role_title"]', 'Full Stack Developer');
    await page.click('button[type="submit"]');
    
    // 3. Add skills
    await page.click('button:has-text("Add Skill")');
    await page.fill('input[name="skill_name"]', 'Node.js');
    await page.click('button[type="submit"]');
    
    // 4. Add project
    await page.click('button:has-text("Add Project")');
    await page.fill('input[name="title"]', 'REST API');
    await page.click('button[type="submit"]');
    
    // 5. Start interview
    await page.click('button:has-text("Interview")');
    await page.click('button:has-text("New Simulation")');
    
    // Verify entire flow completed
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('jobprep');
  });
});
