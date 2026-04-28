// ─────────────────────────────────────────────────────────────────────────────
// Research Workspace — Domain Types
// All component props and mock-data shapes are derived from these interfaces.
// When hooking up real APIs, update only the data layer; these types remain.
// ─────────────────────────────────────────────────────────────────────────────

export interface ResearchSource {
  title: string;
  type: string;
  author: string;
  date: string;
  relevance: string;
}

export interface ResearchCluster {
  name: string;
  progress: number;
}

export interface GraphNode {
  id: number;
  label: string;
  top: string;
  left: string;
  active: boolean;
}

export interface DraftSection {
  id: string;
  name: string;
  /** Lucide icon name — resolved inside components, not stored as JSX. */
  iconName: 'FileText' | 'Globe' | 'Cpu' | 'Activity';
}

export interface AiSuggestion {
  id: number;
  type: string;
  text: string;
  color: string;
}

export type ToolKey =
  | 'comparator'
  | 'gap'
  | 'assumption'
  | 'strength'
  | 'question'
  | 'argument'
  | 'resolver'
  | 'coherence'
  | 'challenger';

export interface ToolDefinition {
  title: string;
  /** Lucide icon name — resolved inside components, not stored as JSX. */
  iconName: string;
  color: string;
  bg: string;
  description: string;
}

export type ToolsByPhase = Record<number, string[]>;

export interface Phase {
  id: number;
  name: string;
}

export interface Collaborator {
  initials: string;
  name: string;
  email?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  avatarColor: string;
  textColor?: string;
}
