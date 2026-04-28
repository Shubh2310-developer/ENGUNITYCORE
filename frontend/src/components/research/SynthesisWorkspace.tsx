'use client';

import { FileText, Share2, Mail, Sparkles, Shield, ArrowUpRight, Check } from 'lucide-react';
import { X } from 'lucide-react';
import type { AiSuggestion, DraftSection } from '@/types/research';
import { useResearchStore } from '@/stores/researchStore';
import styles from '../../app/(dashboard)/research/research.module.css';

interface SynthesisWorkspaceProps {
  draftSections: DraftSection[];
  citationStyles: string[];
  aiSuggestions: AiSuggestion[];
  onFinalizeDecision: () => void;
}

/**
 * SynthesisWorkspace — rich three-panel editor with section nav, draft area, and AI suggestions.
 *
 * Reads `activeDraftSection`, `citationStyle`, `setActiveDraftSection`, `setCitationStyle`
 * from the Zustand researchStore. Prop-drilled state has been removed.
 *
 * CSS classes preserved for E2E selectors:
 *   draftCard, draftBadge, editorLayout, editorSidebar, editorNavItem, editorNavItemActive,
 *   editorMain, editorToolbar, toolbarBtn, citationSelectorMini, citationBtnMini,
 *   citationBtnActiveMini, editableArea, draftTitle, draftPreview, inlineCitation,
 *   aiIntelligencePanel, aiPanelHeader, suggestionCard, suggestionActionBtn,
 *   draftFooter, draftFooterInfo
 */
export default function SynthesisWorkspace({
  draftSections,
  citationStyles,
  aiSuggestions,
  onFinalizeDecision,
}: SynthesisWorkspaceProps) {
  const {
    activeDraftSection,
    citationStyle,
    setActiveDraftSection,
    setCitationStyle,
  } = useResearchStore();

  return (
    <div id="phase-3-target" className={styles.draftCard}>
      <div className={styles.draftBadge}>Synthesis Workspace</div>

      <div className={styles.editorLayout}>
        {/* ── Section Navigator ──────────────────────────────────────── */}
        <aside className={styles.editorSidebar}>
          {draftSections.map((section) => (
            <div
              key={section.id}
              className={`${styles.editorNavItem} ${
                activeDraftSection === section.id ? styles.editorNavItemActive : ''
              }`}
              onClick={() => setActiveDraftSection(section.id)}
            >
              <span>{section.name}</span>
            </div>
          ))}
        </aside>

        {/* ── Main Editor ────────────────────────────────────────────── */}
        <main className={styles.editorMain}>
          <div className={styles.editorToolbar}>
            <div className="flex gap-2">
              <button className={styles.toolbarBtn}>
                <FileText className="w-4 h-4" />
              </button>
              <button className={styles.toolbarBtn}>
                <Share2 className="w-4 h-4" />
              </button>
              <button className={styles.toolbarBtn}>
                <Mail className="w-4 h-4" />
              </button>
            </div>

            <div className={styles.citationSelectorMini}>
              {citationStyles.map((style) => (
                <button
                  key={style}
                  className={`${styles.citationBtnMini} ${
                    citationStyle === style ? styles.citationBtnActiveMini : ''
                  }`}
                  onClick={() => setCitationStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.editableArea}>
            <h3 className={styles.draftTitle}>
              Evolution of Attention Mechanisms in Neural Architecture
            </h3>
            <p className={styles.draftPreview}>
              The transition from recurrent neural networks to transformer-based architectures
              marked a paradigm shift in how sequence dependencies are handled. By utilizing
              multi-head self-attention, models can now achieve global dependencies without the
              computational bottleneck of sequential processing.
              <span className={styles.inlineCitation}>[Vaswani et al., 2017]</span>
            </p>
            <p className={styles.draftPreview}>
              Recent advancements in latent diffusion models have further extended these concepts
              into the visual domain, leveraging the efficiency of vector quantization to manage
              high-dimensional data spaces.
            </p>
          </div>
        </main>

        {/* ── AI Intelligence Panel ──────────────────────────────────── */}
        <aside className={styles.aiIntelligencePanel}>
          <div className={styles.aiPanelHeader}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--r-color-primary)' }} />
            <span>AI Suggestions</span>
          </div>

          <div className="space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={styles.suggestionCard}
                style={{ borderLeftColor: suggestion.color }}
              >
                <p
                  className="text-[11px] font-bold uppercase mb-1"
                  style={{ color: suggestion.color }}
                >
                  {suggestion.type}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{suggestion.text}</p>
                <div className="flex gap-2 mt-2">
                  <button className={styles.suggestionActionBtn}>
                    <Check className="w-3 h-3 text-green-600" />
                  </button>
                  <button className={styles.suggestionActionBtn}>
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Draft Footer ────────────────────────────────────────────────── */}
      <div className={styles.draftFooter}>
        <div className={styles.draftFooterInfo}>
          <span>Last edited: 2 hours ago</span>
          <span>•</span>
          <span>4,204 words</span>
          <span>•</span>
          <span>18 Citations</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onFinalizeDecision}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-all text-xs font-bold"
          >
            <Shield className="w-3.5 h-3.5" />
            Finalize as Decision
          </button>
          <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            Open Full Screen Editor <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
