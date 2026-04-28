import { create } from 'zustand';

/**
 * researchStore — session-only Zustand store for Research Workspace UX state.
 *
 * Eliminates prop-drilling of activeNode, citationStyle, currentPhase,
 * activeTool, activeDraftSection and showShareModal across the component tree.
 *
 * Not persisted — state resets on page reload, which is the intended behaviour
 * for an ephemeral research session.
 */

interface ResearchState {
  /** Current workflow phase (1 = Exploration … 4 = Finalization) */
  currentPhase: number;
  /** Currently highlighted graph node ID */
  activeNode: number;
  /** Key of the currently open tool modal, or null */
  activeTool: string | null;
  /** Active section in the draft editor sidebar */
  activeDraftSection: string;
  /** Selected citation style string */
  citationStyle: string;
  /** Whether the Share Workspace modal is visible */
  showShareModal: boolean;
  /** Active project label (read-only for now) */
  activeProject: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setPhase: (id: number) => void;
  setActiveNode: (id: number) => void;
  setActiveTool: (key: string | null) => void;
  setActiveDraftSection: (id: string) => void;
  setCitationStyle: (style: string) => void;
  setShowShareModal: (open: boolean) => void;
}

export const useResearchStore = create<ResearchState>((set) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  currentPhase: 1,
  activeNode: 1,
  activeTool: null,
  activeDraftSection: 'intro',
  citationStyle: 'APA 7th',
  showShareModal: false,
  activeProject: 'Neural Architecture Analysis',

  // ── Setters ────────────────────────────────────────────────────────────────
  setPhase: (id) => set({ currentPhase: id }),
  setActiveNode: (id) => set({ activeNode: id }),
  setActiveTool: (key) => set({ activeTool: key }),
  setActiveDraftSection: (id) => set({ activeDraftSection: id }),
  setCitationStyle: (style) => set({ citationStyle: style }),
  setShowShareModal: (open) => set({ showShareModal: open }),
}));
