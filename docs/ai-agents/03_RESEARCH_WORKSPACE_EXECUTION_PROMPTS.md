# Execution Prompts for Research Workspace Modernization

Use the following targeted prompts with the recommended AITMPL agents and skills to execute the plan outlined in `02_RESEARCH_WORKSPACE_AGENT_RECOMMENDATION.md`. Each prompt is designed to handle a specific phase of the modernization process.

---

## Phase 1: Architecture & Refactoring

**Recommended Agent:** `nextjs-developer`
**Recommended Skill:** `senior-fullstack`

**Prompt to copy:**

```text
I need to refactor our Research Workspace at `/home/agentrogue/Engunity/frontend/src/app/(dashboard)/research/page.tsx`. Currently, it's a monolithic 800+ line Client Component that handles complex state, routing, and renders massive amounts of static mock data for our UI (including a synthesis workspace, knowledge graph, and AI tool panels).

Please use your `senior-fullstack` skill to analyze this file and architect a new component structure. Break the page down into smaller, maintainable Next.js 14 Client Components (e.g., `KnowledgeGraph`, `SynthesisWorkspace`, `ToolPanel`).

Extract all static mock data (`sources`, `clusters`, `graphNodes`, `toolDetails`) into separate files and define strict TypeScript interfaces for them. Ensure the new frontend architecture is performant, SEO-ready where applicable, and prepares the codebase for hooking up real backend APIs in the next phase.
```

---

## Phase 2A: Backend API & AI Intelligence Implementation

**Recommended Agent:** `ai-engineer` (or `backend-developer`)
**Recommended Skill:** `senior-fullstack`

**Prompt to copy:**

```text
We are modernizing our Research Workspace. Based on the TypeScript interfaces extracted from our frontend mock data (`sources`, `clusters`, `graphNodes`, and AI tools like the Gap Detector and Method Comparator), I need you to design and implement the robust backend logic.

Please use the `senior-fullstack` skill to implement real REST/GraphQL endpoints or Server Actions to replace the mock data. Since this involves processing complex AI intelligence (e.g., hypothesis challenging, assumption extraction, contradiction resolving), design the necessary AI orchestration logic for these features. Provide a comprehensive implementation plan integrating these intelligence capabilities with our database and LLM setup.
```

---

## Phase 2B: Frontend-Backend Integration

**Recommended Agent:** `nextjs-developer`
**Recommended Skill:** `senior-fullstack`

**Prompt to copy:**

```text
The backend APIs and AI orchestration for our Research Workspace are now ready. Please update the refactored frontend components (originally from `/home/agentrogue/Engunity/frontend/src/app/(dashboard)/research/page.tsx`) to consume these real data sources.

Use your Next.js expertise and the `senior-fullstack` skill to implement Server Actions, React Server Components (RSC), or optimized data fetching hooks (e.g., SWR, React Query) to load the `sources`, `clusters`, and `graphNodes`.

Wire up the interactive AI tools (like the Method Comparator and Gap Detector) so clicking them triggers real data fetching and processing pipelines instead of displaying static configurations. Handle all loading states, suspense boundaries, and errors gracefully for an exceptional user experience.
```

---

## Phase 3: State Management Optimization & UI Polish

**Recommended Agent:** `nextjs-developer`
**Recommended Skill:** `ui-design-system`

**Prompt to copy:**

```text
Review the current state management and styling in our refactored Research Workspace. We need to handle complex phase transitions (Exploration, Analysis, Synthesis, Finalization) and interactive selections smoothly across multiple separated components.

First, implement a robust local state management solution (such as React Context or Zustand) to avoid deep prop drilling and ensure predictable state updates for things like `activeNode` or `citationStyle`.

Second, use the `ui-design-system` skill to audit the app's styling. Extract the hardcoded CSS colors (`#2563eb`, `#eff6ff`), spacing, and ad-hoc Tailwind classes from the original source files into a proper, maintainable design token system. Ensure the UI remains blazing fast, accessible, and visually consistent across all components.
```

---

## Phase 4: End-to-End Verification

**Recommended Agent:** `playwright-tester`
**Recommended Skill:** None Required

**Prompt to copy:**

```text
Our Research Workspace has been refactored and integrated with real backend AI APIs. We must verify that it is fully functional end-to-end.

Please explore the local development server for the `/research` page and write comprehensive, strict Playwright E2E tests in TypeScript.

Your tests should specifically target interactive state transitions: the four distinct rendering phases, knowledge graph node selections, complex AI tool transitions, and dynamic data loading. Execute these tests, use page screenshots to identify visual or locator issues, diagnose any failures caused by the new architecture, and iterate on your test suite until we achieve a reliable 100% pass rate.
```
