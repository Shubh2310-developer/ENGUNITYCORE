# Decision Vault Production Hardening

This document is the production-readiness guide for Decision Vault. It reflects the current codebase truth and the remaining work needed before the feature can be marketed as fully production-ready.

## Current State

- The 7-step wizard, AI review flow, export paths, analytics, and cross-module prefills are implemented and validated in the current codebase.
- Backend export now resolves `final_decision` by option label or option id, which fixes the frontend/backend mismatch.
- The backend regression suite for Decision Vault passes in the `engunity` environment.
- The remaining non-production behavior is the Evidence step scan flow, which is still a simulated preview.

## Production Issues And Fixes

### 1. Evidence Scan Is Still Simulated

Problem: the current UI shows an AI Context Linker / Scan Project experience that returns mock evidence.

Fix options:

1. Keep it as demo-only.
- Label it clearly as preview/demo mode.
- Make sure docs, screenshots, and release notes never call it a live repository scanner.
- Treat it as a safe UX aid, not a production intelligence source.

2. Replace it with a real backend scan service.
- Add an authenticated backend endpoint that collects evidence from chat history, repo metadata, file references, and decision traces.
- Persist scan provenance so users can see where each evidence item came from.
- Add caching and timeout controls so scans do not block the wizard.

Recommended production path: if the real scanner is not ready, keep the feature in demo mode and stop claiming it is a live scan.

### 2. Test Isolation Must Stay Stable

Problem: the Decision Vault test suite previously failed because fixture initialization order allowed duplicate user ids or missing tables.

Fix:

- Keep the schema-first fixture order in `backend/tests/test_decisions_api.py`.
- Ensure `setup_decision_table` always depends on database setup before inserting users.
- Run the suite in the `engunity` conda environment only.

### 3. Docs Must Match Implementation

Problem: several docs were ahead of, or inconsistent with, the actual behavior.

Fix:

- Mark the scan feature as simulated preview wherever it appears.
- Remove or soften any claim that suggests the page has a live repository indexer unless that backend exists.
- Keep the verification report aligned with what was independently confirmed.

### 4. Release Gates For Production

Before release, require all of the following:

- `pytest backend/tests/test_decisions_api.py -q` passes in `engunity`.
- Frontend typecheck passes.
- Frontend lint passes.
- Chrome E2E validation covers load, wizard flow, AI review, prefills, exports, and recovery.
- No doc file claims the scan feature is live unless the backend scanner has actually shipped.

## Recommendation

Decision Vault is production-usable now if the product is scoped honestly: keep the scan step as a labeled demo, keep the validated backend fixes, and ship only after the browser and test gates pass.

If you want the scan step to become a true production capability, that is a separate backend feature project and should be implemented before the feature is marketed as a full decision intelligence scanner.