'use client';

import { Network, Database, Shield, Plus } from 'lucide-react';
import type { GraphNode, Phase } from '@/types/research';
import { useResearchStore } from '@/stores/researchStore';
import styles from '../../app/(dashboard)/research/research.module.css';

interface ResearchHeaderProps {
  phases: Phase[];
  graphNodes: GraphNode[];
  onPhaseClick: (id: number) => void;
  onLogDecision: () => void;
}

/**
 * ResearchHeader — top banner with title, phase nav, stat badges, and CTA buttons.
 *
 * Reads `currentPhase` and `setShowShareModal` from the Zustand researchStore.
 * Prop-drilled state (currentPhase, activeNode, onOpenShare) has been removed.
 */
export default function ResearchHeader({
  phases,
  graphNodes,
  onPhaseClick,
  onLogDecision,
}: ResearchHeaderProps) {
  const { currentPhase, setShowShareModal } = useResearchStore();

  return (
    <header id="phase-1-target" className={styles.headerSection}>
      <div className={styles.titleGroup}>
        <h1>Research Workspace</h1>
        <p>Deep-web synthesis and academic intelligence gathering.</p>

        <nav className={styles.phaseNav}>
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`${styles.phaseItem} ${
                currentPhase === phase.id ? styles.phaseItemActive : ''
              }`}
              onClick={() => onPhaseClick(phase.id)}
            >
              <span className={styles.phaseNumber}>{phase.id}</span>
              <span>{phase.name}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.collaborators}>
          <div className={styles.avatar} style={{ background: 'var(--r-blue-200)' }}>JD</div>
          <div className={styles.avatar} style={{ background: '#fef3c7' }}>AK</div>
          <div className={styles.avatar} style={{ background: '#dcfce7' }}>ML</div>
          <button
            className={`${styles.avatar} ${styles.avatarAdd}`}
            onClick={() => setShowShareModal(true)}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className={styles.statBadge}>
          <Network className={styles.statIcon} />
          <span>12 Active Nodes</span>
        </div>
        <div className={styles.statBadge}>
          <Database className={styles.statIcon} />
          <span>4.2GB indexed</span>
        </div>

        <button
          onClick={onLogDecision}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all text-xs font-bold"
          title="Log Methodology Decision"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Log Decision</span>
        </button>

        <button className={`${styles.statBadge} ${styles.newProjectBtn}`}>
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
}
