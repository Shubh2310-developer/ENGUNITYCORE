import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ---------- helpers ----------
/** Accept a specific set of HTTP status codes for a response. */
const isStatus = (res: any, statuses: number[]) => statuses.includes(res.status());

/** Check GitHub token presence without reading its value. */
const hasGithubToken = !!process.env.GITHUB_TOKEN;

test.describe('JobPrep - Real Authentication E2E Manual Test Suite', () => {
  const reportsDir = path.join(__dirname, '../../docs/testing');
  const screenshotsDir = path.join(reportsDir, 'screenshots/jobprep');
  const runDetailsFile = path.join(reportsDir, 'jobprep_e2e_run_details.json');

  const consoleLogs: any[] = [];
  const consoleErrors: string[] = [];
  const networkCalls: any[] = [];
  const unexpectedApiFailures: string[] = [];

  test.beforeAll(() => {
    // Ensure screenshot directories exist
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Perform complete JobPrep validation flow', async ({ browser }) => {
    // Set longer timeout for this specific test
    test.setTimeout(180000);

    const authFile = path.join(__dirname, '../playwright/.auth/user.json');
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    let context;
    let loggedIn = false;
    if (fs.existsSync(authFile)) {
      console.log('Found existing authentication session, reusing it...');
      try {
        context = await browser.newContext({ storageState: authFile });
        loggedIn = true;
      } catch (e) {
        console.warn('Failed to load session, falling back to full login', e);
        context = await browser.newContext();
      }
    } else {
      console.log('No existing session found, will perform full login flow...');
      context = await browser.newContext();
    }

    const page = await context.newPage();

    // Intercept console logs - sanitize token fragments before storing
    const SENSITIVE_RE = /eyJ[A-Za-z0-9._-]{10,}/g;
    page.on('console', msg => {
      const rawText = msg.text();
      const safeText = rawText.replace(SENSITIVE_RE, '[REDACTED_TOKEN]');
      if (msg.type() === 'error') {
        consoleErrors.push(safeText);
      }
      consoleLogs.push({
        type: msg.type(),
        text: safeText,
        location: msg.location()
      });
    });

    // Intercept API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1')) {
        const raw = request.postData() || undefined;
        // Redact credentials from stored postData
        const safePost = raw ? raw.replace(/password=[^&]*/gi, 'password=[REDACTED]') : undefined;
        networkCalls.push({
          type: 'request',
          url,
          method: request.method(),
          postData: safePost,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Known-expected negative-path URLs (explicit error cases only)
    const expectedNegativePaths = ['/import-github?owner=invalid-owner-xyz'];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/v1')) {
        const status = response.status();
        console.log(`[API RESPONSE] ${status} ${url}`);
        // Collect unexpected 4xx/5xx as failures (ignore known negative-path tests)
        if (status >= 400 && !expectedNegativePaths.some(p => url.includes(p))) {
          unexpectedApiFailures.push(`${status} ${url}`);
        }
        networkCalls.push({
          type: 'response',
          url,
          status,
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // 1. Authentication Check & Login Flow
    const e2eEmail = process.env.E2E_USER_EMAIL;
    const e2ePassword = process.env.E2E_USER_PASSWORD;

    if (!loggedIn) {
      if (!e2eEmail || !e2ePassword) {
        throw new Error(
          'E2E_USER_EMAIL and E2E_USER_PASSWORD env vars are required when no saved auth state exists. ' +
          'Do not hardcode credentials.'
        );
      }

      console.log('Navigating to http://localhost:3000/login');
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('#email');
      await page.screenshot({ path: path.join(screenshotsDir, '01_login_page.png') });

      await page.fill('#email', e2eEmail);
      await page.fill('#password', e2ePassword);
      await page.screenshot({ path: path.join(screenshotsDir, '02_login_filled.png') });

      console.log('Submitting login form');
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard - using 60 seconds timeout
      console.log('Waiting for redirection to overview');
      await page.waitForURL('**/overview', { timeout: 60000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('text=Dashboard', { timeout: 20000 }).catch(() => {});
      await page.screenshot({ path: path.join(screenshotsDir, '03_dashboard_redirect.png') });

      console.log('Saving authentication session...');
      await context.storageState({ path: authFile });
    } else {
      console.log('Using pre-authenticated session, navigating directly to JobPrep');
    }

    // 2. Navigation to JobPrep Dashboard
    console.log('Navigating to /jobprep');
    await page.goto('http://localhost:3000/jobprep');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the main page content to load by checking for one of the tabs
    await page.waitForSelector('button:has-text("Hub")', { timeout: 20000 });
    await page.screenshot({ path: path.join(screenshotsDir, '04_jobprep_initial.png') });

    // 3. Onboarding flow (if profile not set)
    const onboardingTitle = page.locator('text=Career Readiness Onboarding');
    const isOnboardingVisible = await onboardingTitle.isVisible();
    console.log(`Onboarding screen visible: ${isOnboardingVisible}`);

    if (isOnboardingVisible) {
      console.log('Filling onboarding details');
      await page.selectOption('div:has(label:has-text("Current Status")) select', 'active');
      await page.fill('div:has(label:has-text("Target Timeline")) input', '3 months');
      await page.fill('div:has(label:has-text("Industry Focus")) input', 'AI / SaaS');
      await page.selectOption('div:has(label:has-text("Experience Level")) select', 'mid');
      await page.selectOption('div:has(label:has-text("Learning Style")) select', 'practical');
      await page.fill('div:has(label:has-text("Salary Expectations (Min)")) input', '80000');

      await page.screenshot({ path: path.join(screenshotsDir, '05_onboarding_filled.png') });
      console.log('Initializing career hub');
      await page.click('button:has-text("Initialize My Career Hub")');
      await page.waitForSelector('button:has-text("Hub")', { timeout: 20000 });
      await page.screenshot({ path: path.join(screenshotsDir, '06_career_hub_initialized.png') });
    }

    // 4. Tab 1: Hub (Overview)
    console.log('Navigating to Hub tab');
    await page.click('button:has-text("Hub")');
    await page.waitForSelector('text=Ready Score');
    await page.screenshot({ path: path.join(screenshotsDir, '07_hub_overview.png') });

    // Verify indicators
    const readyScore = await page.locator('text=% Ready').or(page.locator('text=READY')).first().textContent().catch(() => 'N/A');
    console.log(`Readiness Score visible: ${readyScore}`);

    // Toggle Placement Mode
    console.log('Toggling Placement Mode');
    const placementBtn = page.locator('button:has-text("Placement Mode"), button:has-text("Enable Placement Mode")').first();
    if (await placementBtn.isVisible()) {
      const modePatchPromise = page.waitForResponse(res => res.url().includes('/jobprep/profile') && res.status() === 200);
      await placementBtn.click();
      await modePatchPromise;
      await page.screenshot({ path: path.join(screenshotsDir, '08_placement_mode_on.png') });

      console.log('Exiting Placement Mode');
      const exitPlacementBtn = page.locator('button:has-text("Exit Placement"), button:has-text("Disable Placement Mode"), button:has-text("Placement Mode")').first();
      if (await exitPlacementBtn.isVisible()) {
        const exitPatchPromise = page.waitForResponse(res => res.url().includes('/jobprep/profile') && res.status() === 200);
        await exitPlacementBtn.click();
        await exitPatchPromise;
        await page.screenshot({ path: path.join(screenshotsDir, '09_placement_mode_off.png') });
      }
    }

    // 5. Tab 2: Role Intelligence
    console.log('Navigating to Role Intelligence');
    await page.click('button:has-text("Role Intelligence")');
    await page.waitForSelector('button:has-text("Add Role")');
    await page.screenshot({ path: path.join(screenshotsDir, '10_role_intelligence.png') });

    // Add target role
    console.log('Clicking Add Role');
    await page.click('button:has-text("Add Role")');
    await page.waitForSelector('text=Add Target Role');
    await page.fill('input[placeholder="e.g. Senior Frontend Engineer"]', 'Senior Frontend Engineer');
    await page.fill('input[placeholder="e.g. Engineering"]', 'Engineering');
    await page.screenshot({ path: path.join(screenshotsDir, '11_add_role_modal.png') });

    console.log('Submitting new role');
    const addRolePromise = page.waitForResponse(res => res.url().includes('/jobprep/roles') && isStatus(res, [200, 201]) && res.request().method() === 'POST');
    await page.click('form button:has-text("Add Role")');
    await addRolePromise;
    await page.waitForSelector('text=Senior Frontend Engineer');
    await page.screenshot({ path: path.join(screenshotsDir, '12_role_added.png') });

    // Click view details
    console.log('Opening role details drawer');
    const viewDetailsBtn = page.locator('button:has-text("View Details")').first();
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click();
      await page.waitForSelector('div.fixed.right-0:has-text("Role Readiness")');
      await page.screenshot({ path: path.join(screenshotsDir, '13_role_details.png') });
      
      // Close details using the close button in the fixed drawer header
      console.log('Closing role details drawer');
      const closeBtn = page.locator('div.fixed.right-0 button:has(svg)').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        const backdrop = page.locator('div.fixed.inset-0.bg-slate-900\\/40').first();
        if (await backdrop.isVisible()) {
          await backdrop.click();
        }
      }
      await page.waitForSelector('div.fixed.right-0:has-text("Role Readiness")', { state: 'hidden' });
    }

    // AI Analysis
    console.log('Clicking AI Analysis on target role');
    const aiAnalysisBtn = page.locator('button:has-text("AI Analysis")').first();
    if (await aiAnalysisBtn.isVisible()) {
      const aiAnalysisPromise = page.waitForResponse(res => res.url().includes('/analyze') && res.status() === 200, { timeout: 60000 });
      await aiAnalysisBtn.click();
      await aiAnalysisPromise;
      await page.screenshot({ path: path.join(screenshotsDir, '14_role_ai_analysis.png') });
    }

    // 6. Tab 3: Skill Matrix
    console.log('Navigating to Skill Matrix');
    await page.click('button:has-text("Skill Matrix")');
    await page.waitForSelector('button:has-text("Add Skill")');
    await page.screenshot({ path: path.join(screenshotsDir, '15_skill_matrix.png') });

    // Add Skill
    console.log('Clicking Add Skill');
    await page.click('button:has-text("Add Skill")');
    await page.waitForSelector('text=Add Skill');
    await page.fill('input[placeholder="e.g. React"]', 'React');
    await page.fill('input[placeholder="e.g. Frontend"]', 'Frontend');
    await page.screenshot({ path: path.join(screenshotsDir, '16_add_skill_modal.png') });

    console.log('Submitting new skill');
    const addSkillPromise = page.waitForResponse(res => res.url().includes('/jobprep/skills') && isStatus(res, [200, 201]) && res.request().method() === 'POST');
    await page.click('form button:has-text("Add Skill")');
    await addSkillPromise;
    await page.waitForSelector('h4:has-text("React")');
    await page.screenshot({ path: path.join(screenshotsDir, '17_skill_added.png') });

    // Manage evidence
    console.log('Opening manage evidence panel for React');
    const manageEvidenceBtn = page.locator('button:has-text("Manage Evidence")').first();
    if (await manageEvidenceBtn.isVisible()) {
      const fetchEvidencePromise = page.waitForResponse(res => res.url().includes('/evidence') && res.status() === 200);
      await manageEvidenceBtn.click();
      await fetchEvidencePromise;
      await page.waitForSelector('text=Existing Artifacts');
      await page.screenshot({ path: path.join(screenshotsDir, '18_evidence_panel.png') });

      // Add evidence
      console.log('Adding evidence item');
      await page.fill('input[placeholder*="Title"]', 'Portfolio Project');
      await page.selectOption('form select', 'project');
      await page.fill('input[placeholder*="URL"]', 'https://github.com/test/example');
      await page.screenshot({ path: path.join(screenshotsDir, '19_evidence_form_filled.png') });
      const confirmEvidencePromise = page.waitForResponse(res => res.url().includes('/evidence') && isStatus(res, [200, 201]) && res.request().method() === 'POST');
      await page.click('form button:has-text("Confirm Artifact")');
      await confirmEvidencePromise;

      // Reopen the evidence panel because it gets closed upon confirmation
      console.log('Reopening manage evidence panel to verify artifact');
      const reopenEvidencePromise = page.waitForResponse(res => res.url().includes('/evidence') && res.status() === 200);
      await page.locator('button:has-text("Manage Evidence")').first().click();
      await reopenEvidencePromise;

      await page.waitForSelector('text=Portfolio Project');
      await page.screenshot({ path: path.join(screenshotsDir, '20_evidence_added.png') });

      // Evaluate evidence
      console.log('Evaluating evidence quality');
      const evaluateBtn = page.locator('button[title="AI Quality Evaluation"]').first();
      if (await evaluateBtn.isVisible()) {
        const evalEvidencePromise = page.waitForResponse(res => res.url().includes('/evaluate') && res.status() === 200, { timeout: 60000 });
        await evaluateBtn.click();
        await evalEvidencePromise;
        await page.screenshot({ path: path.join(screenshotsDir, '21_evidence_evaluated.png') });
      }

      // Clean up evidence and skill
      console.log('Deleting test evidence');
      const deleteEvidenceBtn = page.locator('button[title="AI Quality Evaluation"] >> xpath=following-sibling::button').first();
      if (await deleteEvidenceBtn.isVisible()) {
        const deleteEvidencePromise = page.waitForResponse(res => res.url().includes('/evidence/') && res.status() === 200 && res.request().method() === 'DELETE');
        await deleteEvidenceBtn.click();
        await deleteEvidencePromise;
      }

      console.log('Closing evidence panel');
      const closeEvidenceBtn = page.locator('div.mt-8 button:has(svg)').first();
      if (await closeEvidenceBtn.isVisible()) {
        await closeEvidenceBtn.click();
      }
      await page.waitForSelector('text=Existing Artifacts', { state: 'hidden' });
    }
    
    console.log('Deleting test skill');
    const deleteSkillBtn = page.locator('div.flex:has(> h4:has-text("React")) button').first();
    if (await deleteSkillBtn.isVisible()) {
      const deleteSkillPromise = page.waitForResponse(res => res.url().includes('/jobprep/skills/') && res.status() === 200 && res.request().method() === 'DELETE');
      await deleteSkillBtn.click();
      await deleteSkillPromise;
    }
    await page.screenshot({ path: path.join(screenshotsDir, '22_skill_cleaned.png') });

    // 7. Tab 4: Practice Arena
    console.log('Navigating to Practice Arena');
    await page.click('button:has-text("Practice Arena")');
    
    // Select first challenge
    console.log('Starting a practice challenge');
    const playChallengeBtn = page.locator('xpath=//h4[contains(text(), "Model Performance Investigation")]/../../button');
    await playChallengeBtn.click();

    await page.waitForSelector('textarea[placeholder*="answer"], textarea[placeholder*="response"], textarea');
    await page.screenshot({ path: path.join(screenshotsDir, '23_practice_arena.png') });

    // Submit answer in Practice Arena
    const practiceTextarea = page.locator('textarea[placeholder*="answer"], textarea[placeholder*="response"], textarea').first();
    if (await practiceTextarea.isVisible()) {
      console.log('Entering practice answer');
      await practiceTextarea.fill('To optimize React performance, we should avoid unnecessary re-renders by using React.memo, useMemo, and useCallback. Also, virtualizing long lists with react-window or react-virtualized is crucial.');
      await page.screenshot({ path: path.join(screenshotsDir, '24_practice_answer.png') });
      
      const submitAnswerPromise = page.waitForResponse(res => res.url().includes('/practice/evaluate') && res.status() === 200, { timeout: 60000 });
      await page.click('button:has-text("Submit"), button:has-text("Evaluate")');
      await submitAnswerPromise;
      await page.screenshot({ path: path.join(screenshotsDir, '25_practice_feedback.png') });

      // Click Done
      console.log('Clicking Done to close challenge feedback');
      const doneBtn = page.locator('button:has-text("Done")').first();
      if (await doneBtn.isVisible()) {
        await doneBtn.click();
      }
    }

    // 8. Tab 5: Interview Simulator
    console.log('Navigating to Hub to start Interview Simulator');
    await page.click('button:has-text("Hub")');
    await page.click('button:has-text("Start Session"), button:has-text("Start Evaluation")');
    await page.waitForSelector('button:has-text("Launch Simulator"), button:has-text("New Simulation"), button:has-text("Start Interview")');
    await page.screenshot({ path: path.join(screenshotsDir, '26_interview_simulator_home.png') });

    // Start a new simulation
    const startSimBtn = page.locator('button:has-text("Launch Simulator"), button:has-text("New Simulation"), button:has-text("Start Interview")').first();
    if (await startSimBtn.isVisible()) {
      console.log('Launching interview simulator');
      const startSimPromise = page.waitForResponse(res => res.url().includes('/simulations') && isStatus(res, [200, 201]) && res.request().method() === 'POST');
      await startSimBtn.click();
      await startSimPromise;
      await page.waitForSelector('textarea');
      await page.screenshot({ path: path.join(screenshotsDir, '27_simulation_active.png') });

      // Answer question if prompt visible
      const simTextarea = page.locator('textarea').first();
      if (await simTextarea.isVisible()) {
        console.log('Answering simulator question');
        await simTextarea.fill('As a frontend engineer, I focus on performance by optimizing asset delivery, using lazy loading, deferring non-critical scripts, implementing CDN caching, and keeping bundles lightweight using tree-shaking.');
        await page.screenshot({ path: path.join(screenshotsDir, '28_simulation_answer.png') });
        
        const evaluateResponsePromise = page.waitForResponse(res => res.url().includes('/evaluate') && res.status() === 200, { timeout: 60000 });
        await page.click('button:has-text("Submit Response"), button:has-text("Submit")');
        await evaluateResponsePromise;
        await page.screenshot({ path: path.join(screenshotsDir, '29_simulation_feedback.png') });
      }
    }

    // 9. Tab 6: Project Proof
    console.log('Navigating to Project Proof');
    await page.click('button:has-text("Project Proof")');
    await page.waitForSelector('button:has-text("Add Impact Project")');
    await page.screenshot({ path: path.join(screenshotsDir, '30_project_proof.png') });

    // Add manual project
    console.log('Clicking Add Impact Project');
    await page.click('button:has-text("Add Impact Project")');
    await page.waitForSelector('text=Add Project');
    await page.fill('input[placeholder="e.g. AI Portfolio"]', 'AI Interview Prep Dashboard');
    await page.fill('textarea[placeholder*="summary"]', 'Full-stack dashboard for job readiness and interview simulation.');
    await page.fill('input[placeholder="React, FastAPI, PostgreSQL"]', 'React, FastAPI, PostgreSQL');
    await page.screenshot({ path: path.join(screenshotsDir, '31_add_project_modal.png') });
    
    const addProjectPromise = page.waitForResponse(res => res.url().includes('/jobprep/projects') && isStatus(res, [200, 201]) && res.request().method() === 'POST');
    await page.click('form button:has-text("Add Project")');
    await addProjectPromise;
    await page.waitForSelector('h3:has-text("AI Interview Prep Dashboard")');
    await page.screenshot({ path: path.join(screenshotsDir, '32_project_added.png') });

    // Trigger AI analysis on project
    console.log('Triggering AI Project Analysis');
    const projectAnalyzeBtn = page.locator('button:has-text("Generate Impact Report"), button:has-text("Analyze")').first();
    if (await projectAnalyzeBtn.isVisible()) {
      const analyzeProjectPromise = page.waitForResponse(res => res.url().includes('/analyze') && res.status() === 200, { timeout: 60000 });
      await projectAnalyzeBtn.click();
      await analyzeProjectPromise;
      await page.waitForSelector('text=Complexity');
      await page.screenshot({ path: path.join(screenshotsDir, '33_project_analyzed.png') });
    }

    // GitHub Import (Happy path - only run if GITHUB_TOKEN is present for real validation)
    console.log(`Opening GitHub Import modal (GITHUB_TOKEN present: ${hasGithubToken})`);
    const githubImportBtn = page.locator('button:has-text("Import GitHub")').first();
    if (await githubImportBtn.isVisible()) {
      await githubImportBtn.click();
      await page.waitForSelector('text=Import GitHub Repository');
      await page.fill('input[placeholder="e.g. facebook"]', 'facebook');
      await page.fill('input[placeholder="e.g. react"]', 'react');
      await page.screenshot({ path: path.join(screenshotsDir, '34_github_import_modal.png') });

      const importGithubPromise = page.waitForResponse(res => res.url().includes('/import-github') && isStatus(res, [200, 201]), { timeout: 60000 });
      await page.click('form button:has-text("Import & Analyze")');
      const importRes = await importGithubPromise;
      if (hasGithubToken) {
        // Real token: assert real repo data was returned
        expect(importRes.status(), 'GitHub import with real token must succeed').toBe(201);
        await page.waitForSelector('h3:has-text("react")');
      } else {
        // No token: backend falls back to simulated data — this is acceptable but not full production
        console.warn('[GITHUB] GITHUB_TOKEN absent — import used simulated fallback data. Not fully production-ready.');
      }
      await page.screenshot({ path: path.join(screenshotsDir, '35_github_imported.png') });
    }

    // GitHub Import (Unhappy path - invalid repo)
    if (await githubImportBtn.isVisible()) {
      console.log('Opening GitHub Import modal for failure test');
      await githubImportBtn.click();
      await page.waitForSelector('text=Import GitHub Repository');
      await page.fill('input[placeholder="e.g. facebook"]', 'invalid-owner-xyz');
      await page.fill('input[placeholder="e.g. react"]', 'missing-repo-xyz');
      await page.screenshot({ path: path.join(screenshotsDir, '36_github_import_invalid_filled.png') });
      
      const importGithubFailPromise = page.waitForResponse(res => res.url().includes('/import-github'), { timeout: 60000 });
      await page.click('form button:has-text("Import & Analyze")');
      await importGithubFailPromise;
      const closeBtn = page.locator('div.fixed button:has(svg), button:has-text("Close"), svg >> xpath=ancestor::button').first();
      await closeBtn.waitFor();
      await page.screenshot({ path: path.join(screenshotsDir, '37_github_import_failed.png') });
      await closeBtn.click().catch(() => {});
    }

    // Clean up manual project - button is now always visible (no hover-only opacity)
    console.log('Deleting test manual project');
    const deleteByLabel = page.locator('[aria-label^="Delete project"]').first();
    if (await deleteByLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      const deleteProjectPromise = page.waitForResponse(res =>
        res.url().includes('/jobprep/projects/') && res.status() === 200 && res.request().method() === 'DELETE'
      );
      await deleteByLabel.click();
      await deleteProjectPromise;
    }
    await page.screenshot({ path: path.join(screenshotsDir, '38_project_cleaned.png') });

    // 10. Tab 7: Readiness Tracker
    console.log('Navigating to Readiness Tracker');
    await page.click('button:has-text("Readiness Tracker")');
    await page.waitForSelector('text=Readiness Forecast');
    await page.screenshot({ path: path.join(screenshotsDir, '39_readiness_tracker.png') });

    // 11. Career Settings Modal Flow
    console.log('Opening Settings Modal');
    const settingsBtn = page.locator('button[title="Career Settings"]').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForSelector('text=Career Profile Settings');
      // Add target company
      await page.fill('input[placeholder*="company"]', 'Google');
      await page.press('input[placeholder*="company"]', 'Enter');
      await page.screenshot({ path: path.join(screenshotsDir, '40_settings_modal.png') });
      
      const saveSettingsPromise = page.waitForResponse(res => res.url().includes('/jobprep/profile') && res.status() === 200 && res.request().method() === 'PATCH');
      await page.click('button:has-text("Save Preferences")');
      await saveSettingsPromise;
      await page.screenshot({ path: path.join(screenshotsDir, '41_settings_saved.png') });
    }

    // 12. Profile Export Flow
    console.log('Triggering PDF Export');
    const exportBtn = page.locator('button[title="Export PDF Resume"]').first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(2000); // Allow brief render time
      await page.screenshot({ path: path.join(screenshotsDir, '42_export_pdf.png') });
    }

    // 13. Mobile Responsiveness Check
    console.log('Resizing viewport to mobile size (375x667)');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // Wait for transition
    await page.screenshot({ path: path.join(screenshotsDir, '43_mobile_viewport.png') });

    // Restore viewport size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Save logs and network details to file
    const details = {
      summary: {
        totalConsoleLogs: consoleLogs.length,
        unexpectedErrors: consoleErrors.filter(e => !e.includes('net::ERR_ABORTED') && !e.includes('favicon') && !e.includes('422') && !e.includes('Unprocessable Entity')),
        unexpectedApiFailures,
        totalNetworkCalls: networkCalls.length,
        githubTokenPresent: hasGithubToken,
        timestamp: new Date().toISOString()
      },
      consoleLogs,
      consoleErrors,
      networkCalls
    };
    fs.writeFileSync(runDetailsFile, JSON.stringify(details, null, 2), 'utf-8');
    console.log(`Saved E2E test logs to ${runDetailsFile}`);

    // Final hard assertions
    const unexpectedErrors = consoleErrors.filter(e =>
      !e.includes('net::ERR_ABORTED') &&
      !e.includes('favicon') &&
      !e.includes('HMR') &&
      !e.includes('DevTools') &&
      !e.includes('422') &&
      !e.includes('Unprocessable Entity')
    );
    expect(unexpectedErrors, `Unexpected browser console errors:\n${unexpectedErrors.join('\n')}`).toEqual([]);
    expect(unexpectedApiFailures, `Unexpected API failures (4xx/5xx):\n${unexpectedApiFailures.join('\n')}`).toEqual([]);
  });
});
