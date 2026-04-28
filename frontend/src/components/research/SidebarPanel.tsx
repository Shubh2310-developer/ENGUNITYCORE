'use client';

import { Layers, Activity, Sparkles } from 'lucide-react';
import type { ResearchCluster } from '@/types/research';
import styles from '../../app/(dashboard)/research/research.module.css';

interface SidebarPanelProps {
  clusters: ResearchCluster[];
}

/**
 * SidebarPanel — right-hand column.
 *
 * Contains three independently scrollable sub-sections:
 *   1. Research Clusters (progress bars)
 *   2. Active Research Agents (live status + reasoning log)
 *   3. Project Timeline (chronological events)
 *
 * Currently renders static/mock data for agents, log entries, and timeline.
 * When real APIs are ready, each sub-section should receive its own typed prop.
 *
 * CSS classes preserved for E2E selectors:
 *   sidebarSection, agentCard, agentHeader, clusterList, clusterItem,
 *   clusterLabel, progressBar, progressFill, agentStatus, sparkleIcon,
 *   reasoningLog, logEntry, logTime, logText, logHighlight, logSuccess, animPulse,
 *   timelineCard, timelineHeader, timelineList, timelineEvent,
 *   timelineDot, timelineDotActive, eventTitle, eventMeta, eventAction
 */
export default function SidebarPanel({ clusters }: SidebarPanelProps) {
  return (
    <div className={styles.sidebarSection}>

      {/* ── Research Clusters ─────────────────────────────────────────── */}
      <div className={styles.agentCard}>
        <div className={styles.agentHeader}>
          <Layers className="w-5 h-5 text-blue-600" />
          <h3>Research Clusters</h3>
        </div>

        <div className={styles.clusterList}>
          {clusters.map((cluster) => (
            <div key={cluster.name} className={styles.clusterItem}>
              <div className={styles.clusterLabel}>
                <span>{cluster.name}</span>
                <span>{cluster.progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${cluster.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.agentStatus}>
          <Sparkles className={styles.sparkleIcon} />
          <p>Mesh is analyzing 1,402 related tokens from latest ArXiv submissions.</p>
        </div>
      </div>

      {/* ── Active Research Agents ────────────────────────────────────── */}
      <div className={styles.agentCard}>
        <div className={styles.agentHeader}>
          <Activity className="w-5 h-5 text-blue-600" />
          <h3>Active Research Agents</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-700">Gap Detector</span>
            </div>
            <span className="text-xs text-slate-400">Running...</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-slate-700">Lit Reviewer</span>
            </div>
            <span className="text-xs text-slate-400">Idle</span>
          </div>
        </div>

        {/* Reasoning Log */}
        <div className={styles.reasoningLog}>
          <div className={styles.logEntry}>
            <span className={styles.logTime}>[14:20:01]</span>
            <span className={styles.logText}>
              Initializing{' '}
              <span className={styles.logHighlight}>Gap_Detection_Agent</span>...
            </span>
          </div>
          <div className={styles.logEntry}>
            <span className={styles.logTime}>[14:20:05]</span>
            <span className={styles.logText}>
              Accessing <span className={styles.logHighlight}>arXiv_API</span> for
              cross-references.
            </span>
          </div>
          <div className={styles.logEntry}>
            <span className={styles.logTime}>[14:21:12]</span>
            <span className={styles.logText}>
              <span className={styles.logSuccess}>SUCCESS:</span> Identified 4 methodology
              gaps in Latent Diffusion.
            </span>
          </div>
          <div className={styles.logEntry}>
            <span className={`${styles.logText} ${styles.animPulse}`}>
              <span className={styles.logTime}>[14:22:45]</span> Analyzing token
              relationships in Vector Quantization...
            </span>
          </div>
        </div>
      </div>

      {/* ── Project Timeline ──────────────────────────────────────────── */}
      <div className={styles.timelineCard}>
        <div className={styles.timelineHeader}>
          <Activity className="w-4 h-4 text-slate-400" />
          <h3>Project Timeline</h3>
        </div>

        <div className={styles.timelineList}>
          <div className={styles.timelineEvent}>
            <div className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
            <div className={styles.eventTitle}>Draft Version 4.2 Saved</div>
            <div className={styles.eventMeta}>14:22 • You</div>
            <div className={styles.eventAction}>View Diff</div>
          </div>

          <div className={styles.timelineEvent}>
            <div className={styles.timelineDot} />
            <div className={styles.eventTitle}>Agent: Gap Detector Completed</div>
            <div className={styles.eventMeta}>14:21 • System</div>
            <div className={styles.eventAction}>Review Findings</div>
          </div>

          <div className={styles.timelineEvent}>
            <div className={styles.timelineDot} />
            <div className={styles.eventTitle}>New Source: Vaswani et al.</div>
            <div className={styles.eventMeta}>13:45 • ML Collaborator</div>
            <div className={styles.eventAction}>Read Annotations</div>
          </div>
        </div>
      </div>

    </div>
  );
}
