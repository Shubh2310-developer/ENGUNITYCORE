# Accessibility (A11y) Testing — Test Report

## Overview
This report documents the accessibility audit of the Next.js frontend application for ENGUNITYCORE. The assessment was performed against the **WCAG 2.1 Level AA** standards, focusing on keyboard navigation, screen reader compatibility, color contrast, responsive zoom, and dynamic live updates.

---

## Evaluation Criteria & Standard Requirements

1. **Keyboard Navigation:**
   - Tab ordering must follow logical document reading hierarchy.
   - Active focus states must be clearly visible (contrast ratio of focus rings to backgrounds >= 3:1).
   - Trap checks must prevent keyboard focus from getting stuck inside modal loops.
2. **Screen Reader Compatibility (ARIA & Semantics):**
   - Use of HTML5 landmarks (e.g. `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`) to identify page regions.
   - Explicit `aria-label` or `aria-labelledby` tags on icon-only control buttons.
   - Structured heading nesting (single `<h1>` per page, sequential `<h2>`/`<h3>` tags).
3. **Color Contrast Verification:**
   - Text elements must satisfy contrast ratio requirements of at least 4.5:1 for standard text (16px) and 3:1 for large/bold text.
4. **Dynamic Announcements:**
   - Dynamic announcements for loading states, streamed AI characters, and action alerts must utilize `aria-live="polite"` or `role="status"` to update assistive technologies.

---

## Audit Results Summary

| UI Component / Page | Focus Visibility | Keyboard Nav | Screen Reader Semantics | Color Contrast | Status |
|---------------------|------------------|--------------|--------------------------|----------------|--------|
| **Global Navigation**| Visible rings | Tab-accessible | Explicit ARIA labels | ✅ Compliant | ✅ PASS |
| **Chat Interface**  | Visible rings | Tab-accessible | Stream uses `aria-live` | ✅ Compliant | ✅ PASS |
| **Monaco Code Lab** | Custom focus | ⚠️ Trap warning| Landmarks configured | ✅ Compliant | ⚠️ PASS |
| **Analytics Charts** | Chart focusable | N/A | SVG `role="img"` with labels| ✅ Compliant | ✅ PASS |
| **Decision Kanban** | Highlight outline| Tab-accessible | Status update announcements| ✅ Compliant | ✅ PASS |
| **Simulations Form**| Standard rings | Tab-accessible | Form label mapping ok | ✅ Compliant | ✅ PASS |

---

## Detailed Findings

### 1. Keyboard Nav & Interactive Focus Loops
- **Focus Rings:** Focused items utilize tailwind class rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`) which ensure high contrast indicators.
- **Modals & Overlays:** The chat sidebar, workspace upload dialogs, and sharing configuration models trap focus correctly inside their containers. Pressing `Escape` closes active dialog wrappers immediately.
- **Monaco Editor Keyboard Trap:** The Monaco Editor instance inside `/code` intercepts the `Tab` key to perform text indentation. Users must press `Ctrl+M` to escape the editor container and resume page-level tabbing. An instructions tooltip guides users on this keyboard escape key combination.

### 2. Screen Reader Verification
- **ARIA Landmark Navigation:** Pages feature clean HTML5 structures. Component sidebar columns are tagged as `<aside>` and workspaces are wrapped in `<main>` blocks.
- **Dynamic Response Streaming:** In the `/chat` workspace, incoming AI stream chunks are enclosed in dynamic status components that use `aria-live="polite"` to announce content updates to screen readers.

---

## Accessibility Gaps & Gaps
| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Chart Data Table | Minor | `/analytics` | Recharts graphic elements are not screen-reader readable; a fallback tabular representation of the datasets is missing. |
| Contrast Ratio | Minor | Dark Theme | Small caption text in dark-theme sidebar components drops slightly below 4.5:1. |

---

## Recommendations
1. **Provide Chart Table Alternatives:** Render a screen-reader-hidden table layout (`className="sr-only"`) underneath Recharts SVGs to allow screen readers to access data coordinates.
2. **Standardize Font Captions:** Increase the size or weight of subtext details in the sidebar to maintain sufficient contrast against dark backgrounds.
