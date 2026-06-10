# Frontend Dashboard Service Agent Map

**Scope:** `frontend/src/app/(dashboard)`  
**Date:** 2026-05-31  
**Source inventory:** `.claude/agents`, `.claude/skills`, dashboard route files, service-specific architecture docs

## Goal

Use the right agents and skills to fully inspect each dashboard service end to end, with a clear split between architecture review, implementation review, and behavior testing.

## Default Review Stack

Use this chain for every dashboard service unless the route needs extra specialization:

1. `documentation-expert` - read the route docs and map the service boundaries.
2. `frontend-developer` - review React structure, props, state, and component composition.
3. `nextjs-developer` - check App Router behavior, client/server boundaries, and route transitions.
4. `typescript-pro` - verify types, contracts, and data shape safety.
5. `qa-test-planner` - design the unit, integration, and E2E test matrix.
6. `playwright-tester` - validate page behavior in a browser.
7. `e2e-page-validator` - confirm page-specific flows and edge cases.
8. `code-reviewer` - do the final quality pass for regressions, maintainability, and risk.

### Cross-cutting skills to use often

- `brainstorming` for any behavior change before implementation.
- `clean-code` for structure, naming, and minimal diffs.
- `frontend-design` for visual quality and layout decisions.
- `tailwind-patterns` for utility-class consistency.
- `ui-design-system` for token and component consistency.
- `ui-ux-pro-max` for interaction-heavy, user-facing tools.
- `documentation-templates` for docs-heavy screens.
- `agent-evaluation` for AI-assisted or response-quality flows.
- `observability-langsmith` for streaming, tracing, and AI debugging.

## Service Map

### 1. Overview

**Route:** `/overview`  
**Components to inspect:** status bar, metrics grid, active work list, intelligence signals, recent activity footer.

**Best agents:** `documentation-expert`, `frontend-developer`, `nextjs-developer`, `code-reviewer`, `playwright-tester`  
**Best skills:** `brainstorming`, `frontend-design`, `ui-design-system`, `tailwind-patterns`, `clean-code`

**Why these are the right fit:**
The overview screen is mostly a presentation layer, so the main risk is layout drift, broken links, and inconsistent visual treatment rather than deep logic bugs.

**Validation focus:**
- Navigation targets still resolve.
- Metrics render without hydration issues.
- Cards and signals remain visually aligned on small screens.

### 2. Chat

**Route:** `/chat`  
**Components to inspect:** session sidebar, streaming message view, markdown rendering, code block copy, file upload, image upload, knowledge graph panel, research mode, strategy selector.

**Best agents:** `documentation-expert`, `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `e2e-page-validator`, `code-reviewer`, `performance-monitor`  
**Best skills:** `brainstorming`, `agent-evaluation`, `observability-langsmith`, `prompt-engineer`, `langgraph`, `clean-code`, `documentation-templates`

**Why these are the right fit:**
This is the most behavior-heavy dashboard route. It needs streaming validation, AI response quality checks, sidebar/session correctness, upload flows, and regression coverage for the Decision Vault handoff.

**Validation focus:**
- SSE/streaming events render in order.
- Session creation, deletion, and switching stay stable.
- Upload, image staging, and command shortcuts work.
- AI answer quality and safety do not regress.

### 3. Code

**Route:** `/code`  
**Components to inspect:** file explorer, editor tabs, breadcrumbs, code editor, debug sidebar, Git sidebar, test runner, team chat, bottom panel, AI refine panel, preview panel, command palette, notification overlay.

**Best agents:** `documentation-expert`, `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `e2e-page-validator`, `code-reviewer`, `performance-monitor`  
**Best skills:** `brainstorming`, `clean-code`, `tailwind-patterns`, `ui-design-system`, `frontend-design`, `agent-evaluation`

**Why these are the right fit:**
Code Studio has the highest surface area after chat. It needs strong contract checks, keyboard shortcut validation, editor state correctness, and repeated browser testing for debug, terminal, and Git interactions.

**Validation focus:**
- File tree, editor, terminal, and debug panels stay synchronized.
- Save, run, and execute flows keep working.
- Shortcut handlers do not collide.
- AI assist and preview panels remain responsive.

### 4. Analytics

**Route:** `/analytics`  
**Child routes:** `/analytics/upload`, `/analytics/[datasetId]`, `/analytics/export-preview`  
**Components to inspect:** analytics shell, Monaco query editor, chart wrappers, analysis chat, wellbeing banner, upload flow, dataset detail screen, export preview, PDF generators, chart capture utilities.

**Best agents:** `documentation-expert`, `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `e2e-page-validator`, `code-reviewer`, `performance-monitor`, `ai-engineer`  
**Best skills:** `brainstorming`, `frontend-design`, `ui-design-system`, `tailwind-patterns`, `agent-evaluation`, `observability-langsmith`, `clean-code`

**Why these are the right fit:**
Analytics mixes large state, chart rendering, file upload, dataset drilling, and export generation. It needs both UI correctness and performance checks because charts and session restore are easy places for regressions.

**Validation focus:**
- Upload and dataset routing work end to end.
- Charts render across data shapes.
- Export preview and PDF generation do not break in browser-only execution.
- Session restore and query execution stay stable.

### 5. Decision Vault

**Route:** `/decisionvault`  
**Components to inspect:** active kanban view, timeline view, analytics view, create wizard, AI review flow, ADR export, STAR analysis, cross-module URL prefill.

**Best agents:** `documentation-expert`, `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `e2e-page-validator`, `code-reviewer`  
**Best skills:** `brainstorming`, `clean-code`, `ui-design-system`, `tailwind-patterns`, `agent-evaluation`, `observability-langsmith`, `documentation-templates`

**Why these are the right fit:**
Decision Vault is a high-risk logic screen because it combines stateful workflows, AI review, analytics, and cross-app navigation. The main failure modes are broken prefills, wizard state drift, and incorrect decision metrics.

**Validation focus:**
- Create wizard steps stay consistent.
- Chat and research handoff params are parsed safely.
- AI review and export actions still work.
- Analytics metrics are recalculated correctly.

### 6. Documents

**Routes:** `/documents`, `/documents/new`, `/documents/[id]`  
**Components to inspect:** library view, type selection modal, new document form, document editor, outline/sidebar controls, publish/unlock actions, thinking trace history.

**Best agents:** `documentation-expert`, `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `e2e-page-validator`, `code-reviewer`  
**Best skills:** `documentation-templates`, `brainstorming`, `frontend-design`, `clean-code`, `ui-design-system`, `tailwind-patterns`

**Why these are the right fit:**
This is the most documentation-native surface in the app. It needs careful content flow checks, editor-state validation, and a strong writing-focused review lens.

**Validation focus:**
- Document creation and routing remain intact.
- Editor save, publish, and unlock flows work.
- Type-specific suggestions remain accurate.
- Library filtering and detail loading do not break.

### 7. JobPrep

**Route:** `/jobprep`  
**Components to inspect:** overview panel, role drawer, skill trend chart, interview timeline, project impact dashboard, practice arena, interview simulator.

**Best agents:** `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `e2e-page-validator`, `code-reviewer`  
**Best skills:** `brainstorming`, `frontend-design`, `ui-ux-pro-max`, `tailwind-patterns`, `ui-design-system`, `clean-code`

**Why these are the right fit:**
JobPrep is UX-heavy and interaction-heavy. It needs good motion, clean information hierarchy, and a reliable set of modal and dashboard interactions.

**Validation focus:**
- Dynamic panels and drawers open and close correctly.
- Charts and timelines stay readable.
- Simulator and practice flows do not regress.
- The page stays polished on smaller screens.

### 8. Research

**Route:** `/research`  
**Components to inspect:** deep research panel, phase navigation, graph views, draft sections, citation style controls, share modal, AI suggestions.

**Best agents:** `ai-engineer`, `documentation-expert`, `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `code-reviewer`, `performance-monitor`  
**Best skills:** `research-engineer`, `rag-engineer`, `rag-implementation`, `langgraph`, `observability-langsmith`, `agent-evaluation`, `documentation-templates`, `brainstorming`

**Why these are the right fit:**
Research is the most AI and knowledge-work oriented route. It needs agent-quality review, citation integrity, phase navigation correctness, and careful handling of any long-running or graph-based flows.

**Validation focus:**
- Phase switching keeps the right section in view.
- Drafting and citation controls stay synchronized.
- AI-assisted suggestions remain coherent.
- Long-running research interactions do not freeze the UI.

### 9. Settings

**Route:** `/settings`  
**Components to inspect:** profile fields, security protocol cards, integration controls, toggle and select controls, save/discard actions.

**Best agents:** `frontend-developer`, `nextjs-developer`, `typescript-pro`, `qa-test-planner`, `playwright-tester`, `code-reviewer`  
**Best skills:** `brainstorming`, `clean-code`, `ui-design-system`, `tailwind-patterns`, `frontend-design`

**Why these are the right fit:**
Settings is smaller than the other routes, but it still needs contract correctness and visual consistency. This is a good place for a lightweight but strict review stack.

**Validation focus:**
- Form controls preserve state.
- Toggle/select/read-only rendering stays correct.
- Save/discard actions do not break the page shell.

## Route-Specific Add-ons

Use these extra roles when reviewing nested screens separately from the parent route:

### Analytics child routes

- `/analytics/upload` - add `qa-test-planner` and `playwright-tester` for file validation and redirect behavior.
- `/analytics/[datasetId]` - add `performance-monitor` because chart density and data loads are heavier here.
- `/analytics/export-preview` - add `documentation-expert` and `playwright-tester` because PDF generation and browser-only export are the main risk.

### Documents child routes

- `/documents/new` - add `documentation-expert` and `frontend-developer` because this screen is mostly form flow and content intent.
- `/documents/[id]` - add `documentation-expert`, `typescript-pro`, and `playwright-tester` because editor state, publish/unlock logic, and content correctness all matter.

## Recommended Usage Pattern

For each service, run the review in this order:

1. Inventory the route and child routes with `documentation-expert`.
2. Inspect the component and state structure with `frontend-developer` or `nextjs-developer`.
3. Verify types and API shapes with `typescript-pro`.
4. Build the test plan with `qa-test-planner`.
5. Execute browser flows with `playwright-tester` and `e2e-page-validator`.
6. Finish with `code-reviewer`.
7. Add `performance-monitor`, `ai-engineer`, `agent-evaluation`, or `observability-langsmith` where AI, streaming, charts, or long-running flows are involved.

## Short Answer

If you want the smallest strong team for most dashboard services, use this default set:

- `documentation-expert`
- `frontend-developer`
- `nextjs-developer`
- `typescript-pro`
- `qa-test-planner`
- `playwright-tester`
- `e2e-page-validator`
- `code-reviewer`

Then add specialized support for the heavy routes:

- `chat` - `performance-monitor`, `agent-evaluation`, `observability-langsmith`
- `code` - `performance-monitor`
- `analytics` - `performance-monitor`, `ai-engineer`
- `decisionvault` - `agent-evaluation`, `observability-langsmith`
- `documents` - `documentation-expert`
- `research` - `ai-engineer`, `performance-monitor`, `observability-langsmith`
- `jobprep` - `ui-ux-pro-max`
