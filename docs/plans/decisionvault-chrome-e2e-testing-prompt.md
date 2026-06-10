# Decision Vault Chrome E2E Testing Prompt

Use this prompt to drive a browser-based end-to-end test pass for Decision Vault in Chrome.

## Prompt

You are testing the Decision Vault route in Chrome end to end.

Target route: `/decisionvault`

Before testing the UI, review the relevant Decision Vault docs in `docs/` so your browser checks match the intended behavior:
- `docs/features/decision-vault/decisionvault.md`
- `docs/features/decision-vault/ImplementationSummary.md`
- `docs/features/decision-vault/FinalVerification.md`
- `docs/features/decision-vault/DecisionScience.md`
- `docs/testing/DECISION_VAULT_VERIFICATION_REPORT.md`
- `docs/quickstart/BROWSER_TESTING_GUIDE.md`
- `docs/deployment/QUICK_ACCESS_GUIDE.md`

These docs establish that Decision Vault is the cross-module decision intelligence layer for Chat, Research, Code, Documents, and Career flows. The route supports:
- Active Kanban view
- Timeline view
- Analytics view
- Multi-step create wizard
- AI adversarial review
- ADR export
- STAR analysis
- Cross-module prefills from Chat and Research

## Test Objective

Validate that Decision Vault behaves correctly in a real Chrome browser session from initial page load through decision creation, AI review, export actions, and cross-module navigation.

The test must prove:
- The page loads without UI breakage or hydration errors.
- Each view mode renders and switches correctly.
- The create wizard preserves state across steps.
- Chat and Research handoff parameters are parsed safely.
- AI review generates flags and does not break the creation flow.
- ADR export and STAR analysis are accessible and functional.
- Analytics values update correctly after creation or status changes.
- The UI handles empty state, error state, and refresh/reload cleanly.

## Preflight Checks

1. Open the app in Chrome and sign in with a valid test account if authentication is required.
2. Confirm the backend API is reachable.
3. Confirm the browser starts on a clean session with no stale Decision Vault state.
4. Verify the route is accessible at `/decisionvault`.
5. Capture initial page state, console warnings, and network failures before interacting with the page.

## Core Test Flow

### 1. Initial Load

Check that the page renders the default Decision Vault shell.

Verify:
- The page title or header clearly indicates Decision Vault.
- The main content is visible without layout shift.
- The default view is the Active view unless the product intentionally starts elsewhere.
- Navigation or tabs for Active, Timeline, and Analytics are visible.
- No uncaught errors appear in the browser console.
- No failed requests block the initial UI.

Expected outcome:
- The route loads successfully and shows a usable default view.

### 2. Active View / Kanban Behavior

Switch to or confirm the Active/Kanban view.

Verify:
- The Kanban columns or equivalent status groups are present.
- The decision cards render with the correct decision statuses.
- Empty states are graceful if no decisions exist.
- Cards display the expected core fields such as title, type, status, confidence, or tags where available.
- Clicking a card opens its detail view without breaking navigation.

Expected outcome:
- Decision records are visible and organized by workflow status.

### 3. Timeline View

Switch to the Timeline view.

Verify:
- Timeline entries render in chronological order.
- Timestamps are visible or the ordering is unambiguous.
- The view remains stable when switching back and forth with Active view.
- No duplicated items appear after repeated tab switching.

Expected outcome:
- Timeline is stable, readable, and preserves ordering.

### 4. Analytics View

Switch to the Analytics view.

Verify:
- Analytics panels render without chart or metric errors.
- Any decision velocity, evidence quality, reversal rate, or calibration metrics appear plausible.
- Metrics update after decision creation or status changes if the view refreshes data live.
- Charts or counters do not break when there are few or zero decisions.

Expected outcome:
- Analytics renders correctly in both populated and sparse states.

### 5. Create Decision Wizard

Open the create modal or New Decision action.

Verify the wizard step-by-step (7 steps):
- Step 1: Identity fields (Title, Category, Confidence) render and accept input.
- Step 2: Context fields (Problem Statement) render and accept input.
- Step 3: Options fields render and require at least two options.
- Step 4: Evidence fields render, support manual entries, and the simulated AI Context Linker can run or be canceled cleanly. Treat this as demo-only unless a real backend scanner exists.
- Step 5: Analysis tradeoff matrix (6 dimensions) with 1–5 range sliders.
- Step 6: AI Review triggers the adversarial review via POST to the backend and handles errors/retries safely.
- Step 7: Resolution fields (final option, rationale, revisit rule) render, and submission creates the decision.

Enter a realistic test decision:
- Title: `Chrome E2E Decision Test`
- Type: `Architecture` or the closest supported equivalent
- Problem: `Should we move the dashboard to a shared decision workflow?`
- Context: `Testing Decision Vault in Chrome with end-to-end coverage.`
- Options: include at least two options plus one deliberately incomplete or weak option if the UI allows it
- Evidence: include at least one source with clear credibility labeling if supported

Verify:
- Required fields are enforced.
- Step navigation does not lose entered data.
- Back/next navigation preserves the form.
- Validation messages are understandable.
- The submit action creates a new decision and returns the user to the dashboard or detail view in a predictable way.

Expected outcome:
- A valid decision can be created end to end without state loss.

### 6. AI Review Flow

Reach the AI Review or Analysis step in the wizard.

Verify:
- The AI review request fires successfully.
- Loading state appears while the review is running.
- Returned flags or warnings are rendered in the UI.
- The flow identifies common issues such as missing options, weak evidence, sunk cost wording, optimism bias, or contradictory tradeoffs when those conditions are intentionally introduced.
- The user can continue after review and still submit the decision.

Negative checks:
- If AI review fails, the error is displayed clearly and the rest of the wizard does not crash.
- A failed AI review does not wipe previously entered form state.

Expected outcome:
- AI review is informative, recoverable, and integrated into the decision creation flow.

### 7. Chat Handoff Prefill

Test cross-module navigation from Chat into Decision Vault.

Use a URL or in-app action that passes Chat-derived query parameters such as:
- `source=chat`
- `title=...`
- `problem=...`
- `context=...` if supported by the current implementation

Verify:
- Decision Vault opens with the Create modal or equivalent prefilled state.
- Title and problem statement are safely populated.
- Malformed input is sanitized.
- Script tags, control characters, or URL junk do not render raw HTML or break the page.
- The URL is cleaned up if the app removes the query parameters after loading.

Expected outcome:
- Chat-to-Decision Vault handoff is safe and useful.

### 8. Research Handoff Prefill

Repeat the same test for Research-driven handoff.

Use a URL or in-app action that passes Research-derived query parameters such as:
- `source=research`
- `title=...`
- `problem=...`
- `context=...`

Verify:
- The form opens in a prefilled state.
- Research context is preserved or summarized correctly.
- The create flow still works after prefilling.
- Switching from Research context to a new manual decision does not leave stale values behind.

Expected outcome:
- Research handoff is clean, safe, and correctly mapped to the decision form.

### 9. ADR Export

Open a saved decision and test the ADR export path.

Verify:
- The export action is visible for the selected decision.
- The export generates a downloadable or viewable Architecture Decision Record.
- The output contains expected ADR structure such as context, decision, status, consequences, and rationale if those sections are supported.
- The browser does not hang or lose the current decision when export is triggered.

Expected outcome:
- ADR export works as a real user-facing action.

### 10. STAR Analysis

Open a saved decision and test STAR analysis.

Verify:
- STAR output is visible or can be generated from the decision detail view.
- The result is coherent and reflects the decision context.
- The UI clearly distinguishes STAR output from the normal decision record.
- The flow remains stable when switched repeatedly.

Expected outcome:
- STAR analysis renders as a usable derived artifact.

## Edge Cases To Verify

1. Empty state
- No decisions exist on first load.
- The UI still shows a helpful empty state and create action.

2. Rapid tab switching
- Switch between Active, Timeline, and Analytics multiple times.
- No duplicate cards, missing metrics, or stale panels appear.

3. Refresh recovery
- Create or open a decision, refresh the page, and confirm the app recovers gracefully.

4. Invalid input
- Inject overly long strings, special characters, and HTML-like text in title/problem/context fields.
- Confirm fields are sanitized and the page remains functional.

5. Network failure
- Simulate a failed AI review request or failed create request.
- Confirm the UI shows a readable error and preserves user input.

6. Accessibility sanity check
- Keyboard navigation should reach tabs, form fields, buttons, and submit actions.
- Focus state should remain visible.
- Dialogs and drawers should trap focus appropriately if implemented.

7. Responsive sanity check
- Verify the route on at least one narrow viewport and one desktop viewport.
- The create wizard and analytics view should remain readable.

## Evidence To Capture

During the test session, capture:
- Initial page screenshot
- Kanban view screenshot
- Timeline view screenshot
- Analytics view screenshot
- Create wizard screenshot at the identity step
- AI review screenshot showing flags or analysis results
- Prefill screenshot for Chat handoff
- Prefill screenshot for Research handoff
- ADR export result or download evidence
- STAR analysis result or render evidence
- Any console errors, failed network calls, or UI regressions

## Pass Criteria

The Decision Vault passes only if all of the following are true:
- The route loads successfully in Chrome.
- All three views render and switch reliably.
- The create wizard completes without losing input.
- AI review runs and returns usable feedback.
- Chat and Research prefills are safe and accurate.
- ADR export and STAR analysis are usable.
- Analytics values remain consistent after mutations.
- No console errors or broken flows remain unresolved.

## Suggested Final Report Structure

After testing, report results in this order:
1. Summary of overall health
2. Passed flows
3. Failed flows
4. Console or network issues
5. Data or UI inconsistencies
6. Recommended fixes
7. Any follow-up tests needed

## Notes From Docs

The docs indicate that Decision Vault is the project’s adversarial decision layer. It should challenge weak reasoning, not just store notes. That means the test should pay special attention to:
- Missing-option detection
- Weak-evidence warnings
- Sunk-cost language detection
- Confidence calibration issues
- Cross-module traceability from Chat and Research

The scan step is currently simulated in the frontend. When validating production readiness, confirm the UI labels that flow as preview/demo mode unless a real backend scanner has been shipped.

Keep the test focused on real browser behavior, not just static rendering. The goal is to prove the full user journey in Chrome from entry to decision creation, review, export, and recovery.
