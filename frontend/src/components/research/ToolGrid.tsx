'use client';

import React from 'react';
import {
  GitCompare, ShieldCheck, FileQuestion, Tag, HelpCircle,
  Scale, Split, GitMerge, Zap,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ToolDefinition, ToolsByPhase } from '@/types/research';
import { useResearchStore } from '@/stores/researchStore';
import styles from '../../app/(dashboard)/research/research.module.css';

/** Map of icon name strings → Lucide components for tool cards. */
const TOOL_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  GitCompare,
  ShieldCheck,
  FileQuestion,
  Tag,
  HelpCircle,
  Scale,
  Split,
  GitMerge,
  Zap,
};

interface ToolGridProps {
  toolsByPhase: ToolsByPhase;
  toolDefinitions: Record<string, ToolDefinition>;
}

/**
 * ToolGrid — renders the phase-specific set of analysis/synthesis tool cards.
 *
 * Reads `currentPhase` and `setActiveTool` from the Zustand researchStore.
 * Prop-drilled state (phase, onSelectTool) has been removed.
 *
 * CSS classes preserved for E2E selectors:
 *   synthesisGrid, analysisTool, toolIcon, toolTitle, toolDesc
 */
export default function ToolGrid({ toolsByPhase, toolDefinitions }: ToolGridProps) {
  const { currentPhase, setActiveTool } = useResearchStore();
  const toolKeys = toolsByPhase[currentPhase] ?? [];

  return (
    <div id="phase-2-target" className={styles.synthesisGrid}>
      {toolKeys.map((toolKey) => {
        const tool = toolDefinitions[toolKey];
        if (!tool) return null;

        const Icon = TOOL_ICON_MAP[tool.iconName];

        return (
          <div
            key={toolKey}
            className={styles.analysisTool}
            onClick={() => setActiveTool(toolKey)}
          >
            <div
              className={styles.toolIcon}
              style={{ background: tool.bg, color: tool.color }}
            >
              {Icon && <Icon className="w-6 h-6" />}
            </div>
            <h4 className={styles.toolTitle}>{tool.title}</h4>
            <p className={styles.toolDesc}>{tool.description}</p>
          </div>
        );
      })}
    </div>
  );
}
