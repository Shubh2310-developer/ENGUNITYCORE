'use client';

import { Network } from 'lucide-react';
import type { GraphNode } from '@/types/research';
import { useResearchStore } from '@/stores/researchStore';
import styles from '../../app/(dashboard)/research/research.module.css';

interface KnowledgeGraphProps {
  nodes: GraphNode[];
}

/**
 * KnowledgeGraph — interactive concept-map visualization.
 *
 * Reads `activeNode` and `setActiveNode` from the Zustand researchStore.
 * Prop-drilled state (activeNode, onNodeClick) has been removed.
 *
 * SVG edges are hard-coded for the current 5-node topology.
 * When the graph is data-driven (Phase 2 API), the edges array
 * should also become a prop and the SVG lines be rendered dynamically.
 *
 * CSS classes preserved for E2E selectors:
 *   graphSection, graphContainer, graphNode, graphNodeActive, graphLabel
 */
export default function KnowledgeGraph({ nodes }: KnowledgeGraphProps) {
  const { activeNode, setActiveNode } = useResearchStore();

  return (
    <div className={styles.graphSection}>
      <div className={styles.sectionHeader}>
        <h2>
          <Network className="w-5 h-5" style={{ color: 'var(--r-sky-500)' }} />{' '}
          Knowledge Synthesis Graph
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs font-bold bg-slate-100 rounded-full text-slate-600">
            Re-cluster
          </button>
          <button className="px-3 py-1 text-xs font-bold bg-slate-100 rounded-full text-slate-600">
            Export SVG
          </button>
        </div>
      </div>

      <div className={styles.graphContainer}>
        {/* SVG Edges Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="20"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--r-slate-300)" />
            </marker>
          </defs>
          {/* Attention ↔ Transformers */}
          <line
            x1="30%" y1="40%" x2="50%" y2="60%"
            stroke="var(--r-slate-300)" strokeWidth="2" strokeDasharray="5,5"
          />
          {/* Attention ↔ Diffusion */}
          <line
            x1="30%" y1="40%" x2="45%" y2="20%"
            stroke="var(--r-slate-300)" strokeWidth="2"
          />
          {/* Transformers ↔ LLMs */}
          <line
            x1="50%" y1="60%" x2="70%" y2="30%"
            stroke="var(--r-slate-300)" strokeWidth="2"
          />
          {/* Attention ↔ Latent Space */}
          <line
            x1="30%" y1="40%" x2="20%" y2="70%"
            stroke="var(--r-slate-300)" strokeWidth="2" strokeOpacity="0.5"
          />
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            className={`${styles.graphNode} ${
              activeNode === node.id ? styles.graphNodeActive : ''
            }`}
            style={{
              top: node.top,
              left: node.left,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => setActiveNode(node.id)}
          >
            <span className={styles.graphLabel}>{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
