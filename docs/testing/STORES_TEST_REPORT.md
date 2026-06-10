# Frontend Stores — Test Report

## Overview
This report documents the verification of the Zustand state stores (`frontend/src/stores/`) of ENGUNITYCORE. Testing focused on state initialization, actions execution, reactive state mutations, local storage hydration, and performance under rapid updates.

## Files Tested
- `frontend/src/stores/authStore.ts` — User profiles, session tokens, login/logout, and GitHub OAuth persistence.
- `frontend/src/stores/codeStore.ts` — IDE filesystem tree, active tabs, terminal output loggers, breakpoints, debug states, and git stage synchronization.
- `frontend/src/stores/researchStore.ts` — Academic deep research phases, active citation nodes, active RAG tools, and sidebar share toggle states.
- `frontend/src/stores/uiStore.ts` — Global sidebar, landing modal state, and system theme configurations.
- `frontend/src/stores/jobPrepStore.ts` — User target profiles, skills criteria, projects tracking, and interview simulator parameters.

---

## Test Results Summary

| Store | State Initialization | Actions & Mutations | Hydration / Storage Sync | Rerender & Performance | Verification Type |
|-------|----------------------|---------------------|--------------------------|-------------------------|-------------------|
| `authStore` | ✅ PASS | ✅ PASS | ✅ Persisted (local storage) | Very High (minimal keys) | Vitest & E2E |
| `codeStore` | ✅ PASS | ✅ PASS | ❌ Ephemeral (non-persisted) | High (optimized tree selectors) | Playwright E2E |
| `researchStore`| ✅ PASS | ✅ PASS | ❌ Ephemeral (resets on load) | Very High (tab transitions) | Playwright E2E |
| `uiStore` | ✅ PASS | ✅ PASS | ❌ Ephemeral | Immediate | Manual verify |
| `jobPrepStore`| ✅ PASS | ✅ PASS | ❌ Ephemeral | Very High | Playwright E2E |

---

## Detailed Findings

### 1. Authentication Store (`authStore.ts`)
- **Key Features:** Supports four status states (`idle`, `checking`, `authenticated`, `unauthenticated`). Hydration logic sets `_hasHydrated` once local storage is successfully retrieved.
- **Resilience:** Implements a fallback storage interface to handle environment exceptions when `window` or `window.localStorage` is unavailable (such as during Next.js server-side rendering).
- **Mutations:** `setAuth` updates the status to `authenticated`. `clearAuth` sets all user/token fields to `null` and resets status to `unauthenticated`.

### 2. Sandboxed IDE Store (`codeStore.ts`)
- **Key Features:** Manages the active workspace's file hierarchy, file path selection, tab bar stack, and debugger settings.
- **Git Stage Sync:** Seamlessly tracks changes, staging areas, commit comments, and lists files matching unstaged or untracked directories.
- **Performance:** Contains 800+ lines of custom nested state manipulation. Component selectors must be used correctly (e.g., `useCodeStore(s => s.activeFile)`) to avoid re-rendering the entire Monaco/terminal hierarchy on small file changes.

### 3. Research UX Store (`researchStore.ts`)
- **Key Features:** Ephemeral UX coordinator tracking phase (1 to 4), highlighted graph node ID, and the active RAG helper tool.
- **Integrations:** Smoothly coordinates workspace UI panels, avoiding the need for deep prop-drilling.

---

## Security Findings
There are no sensitive keys stored permanently without encryption. Session tokens stored in LocalStorage are validated by the backend API on every request.

---

## Bugs & Issues Found
| Severity | Component | Description | Steps to Reproduce | Suggested Fix |
|----------|-----------|-------------|-------------------|---------------|
| Minor | `codeStore.ts` | Staging identical code directories causes rare file node collision when node IDs are index-based. | Create two files with matching sub-paths in different parent folders. | Use unique path strings as keys instead of index coordinates. |

---

## Recommendations
1. **Scope Zustand Selectors:** Ensure code files are selected using fine-grained Zustand selector paths to prevent excessive rendering of the workspace layout.
2. **Compress Large Stores:** For complex stores like `codeStore`, break down the state structure into smaller, modular slices (e.g. `createFileSlice`, `createTerminalSlice`) for cleaner maintainability.
