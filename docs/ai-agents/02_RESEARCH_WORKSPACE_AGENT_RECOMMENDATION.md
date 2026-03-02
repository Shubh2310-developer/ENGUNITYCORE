# Research Workspace Modernization: Agent & Skill Recommendations

Based on a detailed analysis of the `/home/agentrogue/Engunity/frontend/src/app/(dashboard)/research/page.tsx` file and the available agents and skills in `/home/agentrogue/Engunity/.claude`, here is the recommended approach to make the Research Workspace fully functional end-to-end.

## The Challenge: Research Workspace (`page.tsx`)

The Research Workspace is a highly complex, interactive, and state-driven Next.js client component (`'use client'`). It features:

1.  **Multi-Phase Navigation:** (Exploration, Analysis, Synthesis, Finalization) with smooth scrolling and dynamic rendering of tools based on the active phase.
2.  **State Management:** Complex local state handling UI toggles (`showShareModal`), current phase (`currentPhase`), citation styles (`citationStyle`), active graph nodes (`activeNode`), active tools (`activeTool`), draft sections (`activeDraftSection`), and project context (`activeProject`).
3.  **Dynamic Rendering & Complex UI:** Extensive use of conditional rendering to display various AI tools (Method Comparator, Gap Detector, Assumption Extractor, etc.) and their intricate internal UI structures (tables, tags, flow graphs).
4.  **Interactive Elements:** A functional (rendered, but currently mock-data driven) knowledge graph visualization with SVG edges and clickable nodes, plus a complex draft editor layout.
5.  **Integration Points:** Next.js routing (`useRouter`) for logging decisions to `/decisionvault` and importing external components like `DeepResearchPanel`.

To make this page _fully functional end-to-end_, the static mock data (like `sources`, `clusters`, `graphNodes`, `draftSections`, `toolDetails`) needs to be replaced with real backend integrations, the interactive features need to modify real data, and the overall Next.js architecture must be optimized for performance and reliability.

## Recommended Agent: `nextjs-developer`

**Why `nextjs-developer` is the absolute best choice for the core implementation:**

- **Deep Next.js Expertise:** The page relies heavily on Next.js 14+ client-side features (`use client`, `useRouter`). The `nextjs-developer` agent specializes in the App Router, client/server boundaries, and full-stack integration within the Next.js ecosystem.
- **State & Interactivity:** Converting this static, complex UI into a fully functional application requires expertly managing complex React state and bridging it with backend API routes or Server Actions. The `nextjs-developer` is explicitly designed for this.
- **Performance Optimization:** The Research page is dense with DOM elements (graphs, multi-panel editors, complex tables). The `nextjs-developer` focuses on Core Web Vitals, ensuring the application remains blazing fast even when populated with real, heavy data.
- **Full-Stack Capabilities:** It handles bridging the frontend component with backend APIs and database integrations required to make the tools (e.g., fetching real sources, clustering data, saving drafts) functional.

_Runner-up / Supporting Agent: `frontend-developer`_
While `frontend-developer` is excellent for React UI implementation, `nextjs-developer` provides the crucial Next.js 14+ specific context (App Router, Server Actions, optimization) needed to modernize this specific file effectively within its architectural context.

## Recommended Supporting Agents (For Specialized Tasks):

1.  **`backend-developer` (or `ai-engineer`):** To build the robust backend APIs or microservices that power the complex "tools" (Gap Detector, Assumption Extractor, etc.). The frontend cannot be fully functional without a capable backend processing the AI intelligence. If the backend relies heavily on LLM orchestration, `ai-engineer` is preferable.
2.  **`playwright-tester`:** As identified in previous workflows, this agent is critical for writing the complex E2E tests required to ensure the intricate state transitions (switching phases, clicking tools, interacting with the graph) work flawlessly.

## Recommended Skill: `senior-fullstack`

**Why `senior-fullstack` is the best skill to equip:**

- **Complete Tech Stack Guidance:** The `senior-fullstack` skill provides comprehensive guidance on integrating Next.js with the necessary backend (Node.js/GraphQL/REST) and database (PostgreSQL/Prisma) technologies to replace the mock data.
- **Architecture Patterns:** It offers structured approaches to implementing complex state management and API integration patterns, which are desperately needed to unclutter the massive 800+ line `page.tsx` file (e.g., breaking out the `toolDetails` into separate, functional components).
- **Code Quality Analyzer:** The skill includes scripts (`code_quality_analyzer.py`) that can help refactor the current monolithic `page.tsx` into smaller, maintainable, and type-safe components.

_Supporting Skill: `ui-design-system`_
The Research page uses complex inline styles and specific color codes (e.g., `#2563eb`, `#eff6ff`). The `ui-design-system` skill can help extract these hardcoded values into a proper design token system, ensuring consistency and maintainability as the application grows.

## Execution Strategy

1.  **Phase 1: Architecture & Refactoring (Lead: `nextjs-developer` + `senior-fullstack`)**
    - Break down the monolithic `page.tsx` into separate Client Components (e.g., `KnowledgeGraph`, `SynthesisWorkspace`, `ToolPanel`).
    - Extract mock data into separate files to define TypeScript interfaces for the expected backend data models.
2.  **Phase 2: Backend Integration (Lead: `nextjs-developer` + Backend Agent)**
    - Implement Server Actions or RTK Query/SWR hooks to fetch real data for `sources`, `clusters`, and `graphNodes`.
    - Wire up the AI tool actions (e.g., clicking "Method Comparator" triggers a real data fetching/processing pipeline).
3.  **Phase 3: State Management Optimization (Lead: `nextjs-developer`)**
    - Implement robust local state management (potentially using Context or Zustand if prop drilling becomes too deep after refactoring) to handle phase transitions and active selections smoothly.
4.  **Phase 4: Verification (Lead: `playwright-tester`)**
    - Employ the Playwright testing workflow established in previous iterations to ensure all interactive elements and data bindings function correctly end-to-end.
