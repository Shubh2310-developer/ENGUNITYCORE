'use client';

import { Globe, Filter, FileText, ArrowUpRight } from 'lucide-react';
import type { ResearchSource } from '@/types/research';
import styles from '../../app/(dashboard)/research/research.module.css';

interface SourcesPanelProps {
  sources: ResearchSource[];
}

/**
 * SourcesPanel — displays identified research sources.
 * Pure presentational component; swap `sources` prop for API data when ready.
 */
export default function SourcesPanel({ sources }: SourcesPanelProps) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2>
          <Globe className="w-5 h-5 text-blue-600" /> Identified Sources
        </h2>
        <button className={styles.filterBtn}>
          <Filter className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className={styles.sourceList}>
        {sources.map((source, i) => (
          <div key={i} className={styles.sourceItem}>
            <div className={styles.sourceInfo}>
              <div className={styles.fileIcon}>
                <span>PDF</span>
                <FileText className="w-4 h-4 mt-1" />
              </div>
              <div className={styles.sourceMeta}>
                <h4>{source.title}</h4>
                <p>
                  {source.author} • {source.date} • {source.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={styles.relevanceBadge}>{source.relevance}</span>
              <ArrowUpRight className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        ))}

        <button className="w-full py-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors rounded-xl border border-dashed border-blue-200 mt-2">
          + Upload more research papers
        </button>
      </div>
    </div>
  );
}
