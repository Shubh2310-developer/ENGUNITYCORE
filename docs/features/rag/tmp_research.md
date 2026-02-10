# Research Page Documentation

**Date:** 2026-01-09
**Subject:** Comprehensive Documentation of the Research Module

## Overview
The Research Module is a specific dashboard page designed for academic synthesis, deep-web research, and knowledge graph visualization. It features a "calm, paper-like" interface with a focus on typography and minimal UI distractions.

## Files
The module consists of two main files:
1.  `page.tsx`: The main React component containing the logic, layout, and state management.
2.  `research.module.css`: The CSS module handling the styling, animations, and responsive design.

---

## 1. Source Code: `page.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import {
  Search,
  Globe,
  Database,
  Cpu,
  Zap,
  Filter,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Network,
  FileText,
  Layers,
  Activity,
  Plus,
  Share2,
  X,
  UserPlus,
  Mail,
  MoreVertical,
  Check
} from 'lucide-react';
import styles from './research.module.css';

export default function ResearchPage() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [citationStyle, setCitationStyle] = useState('APA 7th');
  const [activeNode, setActiveNode] = useState(1);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeDraftSection, setActiveDraftSection] = useState('intro');

  React.useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const phases = [
    { id: 1, name: 'Exploration' },
    { id: 2, name: 'Analysis' },
    { id: 3, name: 'Synthesis' },
    { id: 4, name: 'Finalization' },
  ];

  const citationStyles = ['APA 7th', 'IEEE', 'MLA', 'BibTeX'];
  const sources = [
    { title: 'Neural Attention Mechanisms', type: 'Paper', author: 'Vaswani et al.', date: '2017', relevance: '98%' },
    { title: 'Latent Space Distribution v2', type: 'Internal', author: 'Engunity Core', date: '2025', relevance: 'Direct' },
    { title: 'Vector Quantization Strategies', type: 'Technical', author: 'Oord et al.', date: '2018', relevance: '74%' },
  ];

  const clusters = [
    { name: 'Latent Diffusion', progress: 92 },
    { name: 'Transformer Efficiency', progress: 74 },
    { name: 'Vector Indexing', progress: 48 }
  ];

  const graphNodes = [
    { id: 1, label: 'Attention', top: '40%', left: '30%', active: true },
    { id: 2, label: 'Transformers', top: '60%', left: '50%', active: false },
    { id: 3, label: 'LLMs', top: '30%', left: '70%', active: false },
    { id: 4, label: 'Latent Space', top: '70%', left: '20%', active: true },
    { id: 5, label: 'Diffusion', top: '20%', left: '45%', active: false },
  ];

  const draftSections = [
    { id: 'intro', name: 'Introduction', icon: <FileText className="w-4 h-4" /> },
    { id: 'lit', name: 'Literature Review', icon: <Globe className="w-4 h-4" /> },
    { id: 'methods', name: 'Methodology', icon: <Cpu className="w-4 h-4" /> },
    { id: 'results', name: 'Results', icon: <Activity className="w-4 h-4" /> },
  ];

  const aiSuggestions = [
    { id: 1, type: 'Citation', text: 'Consider citing Vaswani et al. (2017) here to support the Transformer claim.', color: '#2563eb' },
    { id: 2, type: 'Rewrite', text: 'This sentence is complex. Would you like to simplify it for better readability?', color: '#8b5cf6' },
  ];


  const toolDetails: Record<string, any> = {
    comparator: {
      title: 'Method Comparator',
      icon: <Activity className="w-6 h-6" />,
      color: '#2563eb',
      bg: '#eff6ff',
      content: (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Feature</th>
                  <th className="px-4 py-3 font-bold text-blue-600">Transformer v2</th>
                  <th className="px-4 py-3">Attention-X</th>
                  <th className="px-4 py-3">Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Complexity</td>
                  <td className="px-4 py-3 text-blue-600">O(n log n)</td>
                  <td className="px-4 py-3">O(n²)</td>
                  <td className="px-4 py-3">O(n²)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Memory Usage</td>
                  <td className="px-4 py-3 text-blue-600">Adaptive</td>
                  <td className="px-4 py-3">Fixed 4GB</td>
                  <td className="px-4 py-3">Variable</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Accuracy</td>
                  <td className="px-4 py-3 text-blue-600">94.2%</td>
                  <td className="px-4 py-3">91.8%</td>
                  <td className="px-4 py-3">88.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h5 className="font-bold text-blue-900 text-sm mb-2">Synthesis Insight</h5>
            <p className="text-sm text-slate-700 leading-relaxed">
              The Transformer v2 architecture shows a 15% efficiency gain in latent mapping without sacrificing attention depth. Recommend merging its weights with local nodes.
            </p>
          </div>
        </div>
      )
    },
    gap: {
      title: 'Gap Detector',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: '#0ea5e9',
      bg: '#f0f9ff',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Sparse Attention in Low-Resource Domains', confidence: 'High' },
              { label: 'Cross-modal Bias in Latent Diffusion', confidence: 'Medium' },
              { label: 'Real-time Vector Quantization Efficiency', confidence: 'High' }
            ].map((gap, i) => (
              <div key={i} className="p-4 bg-white border border-sky-100 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">{gap.label}</h5>
                  <p className="text-xs text-slate-500">Identified from 4 conflicting conclusions</p>
                </div>
                <span className="px-2 py-1 bg-sky-100 text-sky-700 text-[10px] font-black uppercase rounded">
                  {gap.confidence} confidence
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    challenger: {
      title: 'Hypothesis Challenger',
      icon: <Zap className="w-6 h-6" />,
      color: '#f59e0b',
      bg: '#fffbeb',
      content: (
        <div className="space-y-4 text-sm">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <h5 className="font-bold text-red-900 mb-1">Potential Contradiction Found</h5>
            <p className="text-red-800 leading-relaxed">
              Vaswani et al. (2017) suggests global attention is essential, but Oord et al. (2018) demonstrates local quantization can achieve similar results in discrete spaces.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-800">Stress Test Results:</h5>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-[65%]" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Empirical Support: 65%</span>
              <span>Theoretical Risk: 35%</span>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className={styles.researchContainer}>
      <div className={styles.meshBackground}>
        <div className={styles.gridPattern} />
      </div>

      {/* Header Section */}
      <header className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <h1>Research Workspace</h1>
          <p>Deep-web synthesis and academic intelligence gathering.</p>

          <nav className={styles.phaseNav}>
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={`${styles.phaseItem} ${currentPhase === phase.id ? styles.phaseItemActive : ''}`}
                onClick={() => setCurrentPhase(phase.id)}
              >
                <span className={styles.phaseNumber}>{phase.id}</span>
                <span>{phase.name}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.collaborators}>
            <div className={styles.avatar} style={{ background: '#bfdbfe' }}>JD</div>
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
          <button className={`${styles.statBadge} ${styles.newProjectBtn}`}>
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      {/* Search Hero Area */}
      <section className={styles.searchHero}>
        <div className={styles.searchIconWrapper}>
          <Search className="w-8 h-8" />
        </div>
        <div className={styles.heroText}>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Initialize Research Query</h2>
          <p className="text-slate-500">Targeting academic databases, patent offices, and neural repositories.</p>
        </div>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Enter research parameters, DOI, or topics..."
            className={styles.mainInput}
          />
          <button className={styles.synthesizeBtn}>
            Synthesize
          </button>
        </div>

        <div className={styles.tagCloud}>
          {['ArXiv', 'IEEE', 'OpenAI', 'DeepMind', 'Internal_Mesh', 'Patents'].map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Side: Sources & Graph */}
        <div className="flex flex-col gap-8">
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2><Globe className="w-5 h-5 text-blue-600" /> Identified Sources</h2>
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
                      <p>{source.author} • {source.date} • {source.type}</p>
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

          {/* Knowledge Graph Visualization */}
          <div className={styles.graphSection}>
            <div className={styles.sectionHeader}>
              <h2><Network className="w-5 h-5" style={{ color: '#0ea5e9' }} /> Knowledge Synthesis Graph</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-bold bg-slate-100 rounded-full text-slate-600">Re-cluster</button>
                <button className="px-3 py-1 text-xs font-bold bg-slate-100 rounded-full text-slate-600">Export SVG</button>
              </div>
            </div>
            <div className={styles.graphContainer}>
              {/* SVG Edges Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                  </marker>
                </defs>
                {/* Connection: Attention (1) <-> Transformers (2) */}
                <line x1="30%" y1="40%" x2="50%" y2="60%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />

                {/* Connection: Attention (1) <-> Diffusion (5) */}
                <line x1="30%" y1="40%" x2="45%" y2="20%" stroke="#cbd5e1" strokeWidth="2" />

                {/* Connection: Transformers (2) <-> LLMs (3) */}
                <line x1="50%" y1="60%" x2="70%" y2="30%" stroke="#cbd5e1" strokeWidth="2" />

                {/* Connection: Attention (1) <-> Latent Space (4) */}
                <line x1="30%" y1="40%" x2="20%" y2="70%" stroke="#cbd5e1" strokeWidth="2" strokeOpacity="0.5" />
              </svg>

              {graphNodes.map((node) => (
                <div
                  key={node.id}
                  className={`${styles.graphNode} ${activeNode === node.id ? styles.graphNodeActive : ''}`}
                  style={{ top: node.top, left: node.left, transform: 'translate(-50%, -50%)' }} // Recentering nodes to make coordinates actual centers
                  onClick={() => setActiveNode(node.id)}
                >
                  <span className={styles.graphLabel}>{node.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synthesis & Analysis Section */}
          <div className={styles.synthesisGrid}>
            <div className={styles.analysisTool} onClick={() => setActiveTool('comparator')}>
              <div className={styles.toolIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Activity className="w-5 h-5" />
              </div>
              <h4 className={styles.toolTitle}>Method Comparator</h4>
              <p className={styles.toolDesc}>Side-by-side analysis of algorithms and datasets across selected papers.</p>
            </div>

            <div className={styles.analysisTool} onClick={() => setActiveTool('gap')}>
              <div className={styles.toolIcon} style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className={styles.toolTitle}>Gap Detector</h4>
              <p className={styles.toolDesc}>Identify underexplored areas and potential research opportunities.</p>
            </div>

            <div className={styles.analysisTool} onClick={() => setActiveTool('challenger')}>
              <div className={styles.toolIcon} style={{ background: '#fffbeb', color: '#f59e0b' }}>
                <Zap className="w-5 h-5" />
              </div>
              <h4 className={styles.toolTitle}>Hypothesis Challenger</h4>
              <p className={styles.toolDesc}>Critical stress-testing of your research claims against evidence.</p>
            </div>
          </div>

          {/* Active Synthesis Workspace */}
          <div className={styles.draftCard}>
            <div className={styles.draftBadge}>Synthesis Workspace</div>

            <div className={styles.editorLayout}>
              {/* Left: Section Navigator */}
              <aside className={styles.editorSidebar}>
                {draftSections.map(section => (
                  <div
                    key={section.id}
                    className={`${styles.editorNavItem} ${activeDraftSection === section.id ? styles.editorNavItemActive : ''}`}
                    onClick={() => setActiveDraftSection(section.id)}
                  >
                    <span>{section.name}</span>
                  </div>
                ))}
              </aside>

              {/* Center: Main Editor Area */}
              <main className={styles.editorMain}>
                <div className={styles.editorToolbar}>
                  <div className="flex gap-2">
                    <button className={styles.toolbarBtn}><FileText className="w-4 h-4" /></button>
                    <button className={styles.toolbarBtn}><Share2 className="w-4 h-4" /></button>
                    <button className={styles.toolbarBtn}><Mail className="w-4 h-4" /></button>
                  </div>
                  <div className={styles.citationSelectorMini}>
                    {citationStyles.map((style) => (
                      <button
                        key={style}
                        className={`${styles.citationBtnMini} ${citationStyle === style ? styles.citationBtnActiveMini : ''}`}
                        onClick={() => setCitationStyle(style)}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.editableArea}>
                  <h3 className={styles.draftTitle}>Evolution of Attention Mechanisms in Neural Architecture</h3>
                  <p className={styles.draftPreview}>
                    The transition from recurrent neural networks to transformer-based architectures marked a paradigm shift in how sequence dependencies are handled. By utilizing multi-head self-attention, models can now achieve global dependencies without the computational bottleneck of sequential processing.
                    <span className={styles.inlineCitation}>[Vaswani et al., 2017]</span>
                  </p>
                  <p className={styles.draftPreview}>
                    Recent advancements in latent diffusion models have further extended these concepts into the visual domain, leveraging the efficiency of vector quantization to manage high-dimensional data spaces.
                  </p>
                </div>
              </main>

              {/* Right: AI Intelligence Panel */}
              <aside className={styles.aiIntelligencePanel}>
                <div className={styles.aiPanelHeader}>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Suggestions</span>
                </div>
                <div className="space-y-3">
                  {aiSuggestions.map(suggestion => (
                    <div key={suggestion.id} className={styles.suggestionCard} style={{ borderLeftColor: suggestion.color }}>
                      <p className="text-[11px] font-bold uppercase mb-1" style={{ color: suggestion.color }}>{suggestion.type}</p>
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

            <div className={styles.draftFooter}>
              <div className={styles.draftFooterInfo}>
                <span>Last edited: 2 hours ago</span>
                <span>•</span>
                <span>4,204 words</span>
                <span>•</span>
                <span>18 Citations</span>
              </div>
              <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                Open Full Screen Editor <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Agents & Clusters */}
        <div className={styles.sidebarSection}>
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

            <div className={styles.reasoningLog}>
              <div className={styles.logEntry}>
                <span className={styles.logTime}>[14:20:01]</span>
                <span className={styles.logText}>Initializing <span className={styles.logHighlight}>Gap_Detection_Agent</span>...</span>
              </div>
              <div className={styles.logEntry}>
                <span className={styles.logTime}>[14:20:05]</span>
                <span className={styles.logText}>Accessing <span className={styles.logHighlight}>arXiv_API</span> for cross-references.</span>
              </div>
              <div className={styles.logEntry}>
                <span className={styles.logTime}>[14:21:12]</span>
                <span className={styles.logText}><span className={styles.logSuccess}>SUCCESS:</span> Identified 4 methodology gaps in Latent Diffusion.</span>
              </div>
              <div className={styles.logEntry}>
                <span className={styles.logTime}>[14:22:45]</span>
                <span className={`${styles.logText} ${styles.animPulse}`}>Analyzing token relationships in Vector Quantization...</span>
              </div>
            </div>
          </div>

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
      </div>

      {/* Share Workspace Modal */}
      {showShareModal && (
        <div className={styles.shareOverlay}>
          <div className={styles.shareModal}>
            <div className={styles.shareHeader}>
              <h3>Share Workspace</h3>
              <button className={styles.closeBtn} onClick={() => setShowShareModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={styles.shareInputGroup}>
              <input
                type="email"
                placeholder="Collaborator email..."
                className={styles.shareInput}
              />
              <button className={styles.inviteBtn}>Invite</button>
            </div>

            <div className={styles.collabList}>
              <div className={styles.collabItem}>
                <div className={styles.collabUser}>
                  <div className={styles.collabAvatar}>JD</div>
                  <div className={styles.collabInfo}>
                    <h4>John Doe (You)</h4>
                    <p>Owner</p>
                  </div>
                </div>
                <select className={styles.roleSelect} disabled>
                  <option>Owner</option>
                </select>
              </div>

              <div className={styles.collabItem}>
                <div className={styles.collabUser}>
                  <div className={styles.collabAvatar} style={{ background: '#fef3c7', color: '#d97706' }}>AK</div>
                  <div className={styles.collabInfo}>
                    <h4>Alice Kim</h4>
                    <p>alice.k@engunity.ai</p>
                  </div>
                </div>
                <select className={styles.roleSelect}>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Tool Modal */}
      {activeTool && (
        <div className={styles.shareOverlay} onClick={() => setActiveTool(null)}>
          <div className={styles.shareModal} onClick={e => e.stopPropagation()}>
            <div className={styles.shareHeader} style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: toolDetails[activeTool].bg, color: toolDetails[activeTool].color }}
                >
                  {toolDetails[activeTool].icon}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">{toolDetails[activeTool].title}</h3>
              </div>
              <button className={styles.closeBtn} onClick={() => setActiveTool(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              {toolDetails[activeTool].content}
            </div>

            <div className="mt-8 flex gap-3">
              <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-200">
                Run Detailed Analysis
              </button>
              <button className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

## 2. Source Code: `research.module.css`

```css
/* Research Page - Premium Light Theme with Pure Blue Palette */

/* ========================================
   CONTAINER & BASE STYLES
======================================== */

.researchContainer {
    padding: 2rem;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
    height: 100%;
    color: #1f2937;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
}

/* ========================================
   ANIMATIONS
======================================== */

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

@keyframes glow {

    0%,
    100% {
        box-shadow: 0 0 5px rgba(37, 99, 235, 0.2);
    }

    50% {
        box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
    }
}

@keyframes glowPulse {
    0% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
    }

    70% {
        box-shadow: 0 0 0 15px rgba(37, 99, 235, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

@keyframes pulseSubtle {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.7;
    }
}

@keyframes gradientMove {
    0% {
        background-position: 100% 0;
    }

    100% {
        background-position: -100% 0;
    }
}

@keyframes meshMovement {
    0% {
        background-position: 0% 50%, 100% 50%, 50% 50%;
    }

    50% {
        background-position: 100% 50%, 0% 50%, 50% 100%;
    }

    100% {
        background-position: 0% 50%, 100% 50%, 50% 50%;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(30px) scale(0.95);
        opacity: 0;
    }

    to {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-5px);
    }
}

/* Utility Animation Classes */
.animPulse {
    animation: pulseSubtle 2s infinite ease-in-out;
}

/* Staggered Entrance Animations */
.headerSection {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.searchHero {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
    opacity: 0;
}

.contentGrid {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
    opacity: 0;
}

/* ========================================
   BACKGROUND EFFECTS
======================================== */

.meshBackground {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: -1;
    background-image:
        radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(248, 250, 252, 1) 0%, transparent 100%);
    background-size: 200% 200%;
    animation: meshMovement 20s ease infinite;
    transition: all 1s ease;
}

.gridPattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
        linear-gradient(#e2e8f0 1px, transparent 1px),
        linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(circle at 50% 50%, black, transparent 85%);
    opacity: 0.15;
}

/* ========================================
   HEADER SECTION
======================================== */

.headerSection {
    margin-bottom: 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 2rem;
}

.titleGroup h1 {
    font-size: 2.25rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.04em;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #0f172a, #2563eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.titleGroup p {
    color: #64748b;
    font-size: 1.1rem;
    font-weight: 500;
}

.statsGrid {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.statBadge {
    background: white;
    border: 1px solid #e5e7eb;
    padding: 0.6rem 1.25rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.statBadge:hover {
    transform: translateY(-2px);
    border-color: #2563eb;
    color: #2563eb;
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.15);
}

.statIcon {
    color: #2563eb;
    width: 16px;
    height: 16px;
}

.newProjectBtn {
    background: linear-gradient(135deg, #2563eb, #60a5fa) !important;
    color: white !important;
    border-color: transparent !important;
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.newProjectBtn::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: -1;
}

.newProjectBtn:hover::after {
    opacity: 1;
}

.newProjectBtn:hover {
    box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
}

/* ========================================
   PHASE NAVIGATION
======================================== */

.phaseNav {
    display: flex;
    gap: 1.5rem;
    padding: 0.6rem;
    background: #f1f5f9;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    margin-top: 1.5rem;
    width: fit-content;
    overflow-x: auto;
}

.phaseItem {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1.25rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 700;
    color: #64748b;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    white-space: nowrap;
}

.phaseItem:hover {
    color: #334155;
    background: rgba(255, 255, 255, 0.5);
}

.phaseItemActive {
    background: white;
    color: #2563eb;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.15), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
    transform: translateY(-1px);
}

.phaseNumber {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.phaseItemActive .phaseNumber {
    background: #2563eb;
    color: white;
    transform: scale(1.1);
}

/* ========================================
   SEARCH HERO SECTION
======================================== */

.searchHero {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 32px;
    padding: 4rem 3rem;
    margin-bottom: 3rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -6px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.searchHero:hover {
    box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.08);
}

.searchHero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #2563eb, #0ea5e9, #06b6d4, #2563eb);
    background-size: 200% 100%;
    animation: gradientMove 3s linear infinite;
}

.searchIconWrapper {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    color: #2563eb;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
}

.searchHero:hover .searchIconWrapper {
    transform: scale(1.1) rotate(5deg);
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
}

.heroText h2 {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.75rem;
    letter-spacing: -0.03em;
}

.heroText p {
    color: #64748b;
    font-size: 1.125rem;
}

.inputWrapper {
    width: 100%;
    max-width: 800px;
    position: relative;
    margin: 2.5rem 0;
}

.mainInput {
    width: 100%;
    padding: 1.5rem 10rem 1.5rem 1.75rem;
    border-radius: 20px;
    border: 2px solid #f1f5f9;
    background: #f8fafc;
    font-size: 1.25rem;
    color: #0f172a;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.mainInput:focus {
    border-color: #2563eb;
    background: white;
    box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.mainInput::placeholder {
    color: #94a3b8;
}

.synthesizeBtn {
    position: absolute;
    right: 10px;
    top: 10px;
    bottom: 10px;
    padding: 0 2rem;
    background: linear-gradient(135deg, #2563eb, #60a5fa);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);
}

.synthesizeBtn:hover {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.5);
}

.synthesizeBtn:active {
    transform: translateY(0) scale(0.98);
}

.tagCloud {
    display: flex;
    gap: 0.875rem;
    flex-wrap: wrap;
    justify-content: center;
}

.tag {
    padding: 0.6rem 1.25rem;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 99px;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.tag:hover {
    background: white;
    color: #2563eb;
    border-color: #dbeafe;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
}

/* ========================================
   CONTENT GRID
======================================== */

.contentGrid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2.5rem;
}

/* ========================================
   CARD STYLES
======================================== */

.sectionCard,
.agentCard,
.timelineCard,
.analysisTool,
.draftCard,
.graphSection {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.sectionCard:hover,
.agentCard:hover,
.timelineCard:hover,
.draftCard:hover,
.graphSection:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -6px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
}

.sectionHeader {
    padding: 1.75rem 2rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sectionHeader h2 {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    letter-spacing: -0.02em;
}

.filterBtn {
    padding: 0.5rem;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #64748b;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.filterBtn:hover {
    background: white;
    color: #2563eb;
    border-color: #2563eb;
    transform: scale(1.05);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
}

/* ========================================
   SOURCE LIST
======================================== */

.sourceList {
    padding: 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.sourceItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-radius: 18px;
    border: 1px solid #f1f5f9;
    background: #fff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.sourceItem:hover {
    border-color: #2563eb;
    background: #f8fafc;
    transform: translateX(8px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 0 15px rgba(37, 99, 235, 0.05);
}

.sourceInfo {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex: 1;
}

.fileIcon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 800;
    color: #2563eb;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.sourceItem:hover .fileIcon {
    background: linear-gradient(135deg, #2563eb, #60a5fa);
    color: white;
    transform: rotate(-5deg) scale(1.05);
}

.sourceMeta h4 {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.375rem;
}

.sourceMeta p {
    font-size: 0.8125rem;
    color: #64748b;
}

.relevanceBadge {
    padding: 0.375rem 1rem;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    color: #0369a1;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 700;
    border: 1px solid #bfdbfe;
}

/* ========================================
   SIDEBAR SECTION
======================================== */

.sidebarSection {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

.agentCard,
.timelineCard {
    padding: 2rem;
}

.agentHeader,
.timelineHeader {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.agentHeader h3,
.timelineHeader h3 {
    font-size: 1.125rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
}

.timelineHeader h3 {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

/* ========================================
   CLUSTERS
======================================== */

.clusterList {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.clusterItem {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.clusterLabel {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    font-weight: 700;
    color: #334155;
}

.progressBar {
    height: 8px;
    background: #f1f5f9;
    border-radius: 99px;
    overflow: hidden;
}

.progressFill {
    height: 100%;
    background: linear-gradient(90deg, #2563eb, #60a5fa);
    border-radius: 99px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
}

.agentStatus {
    margin-top: 2rem;
    padding: 1.25rem;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #475569;
    font-style: italic;
    line-height: 1.5;
}

.sparkleIcon {
    color: #2563eb;
    flex-shrink: 0;
    animation: pulseSubtle 2s infinite;
}

/* ========================================
   COLLABORATORS
======================================== */

.collaborators {
    display: flex;
    align-items: center;
    margin-right: 2rem;
}

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid white;
    background: #e2e8f0;
    margin-left: -12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
    font-weight: 800;
    color: #475569;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    z-index: 1;
}

.avatar:first-child {
    margin-left: 0;
}

.avatar:hover {
    transform: translateY(-8px) scale(1.1);
    z-index: 10;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.avatarAdd {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    color: #94a3b8;
    cursor: pointer;
}

.avatarAdd:hover {
    border-color: #2563eb;
    color: #2563eb;
    background: #eff6ff;
}

/* ========================================
   KNOWLEDGE GRAPH
======================================== */

.graphSection {
    margin-top: 2.5rem;
    padding: 2rem;
}

.graphContainer {
    height: 350px;
    background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    margin-top: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.03);
}

.graphNode {
    position: absolute;
    width: 14px;
    height: 14px;
    background: #2563eb;
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    animation: float 5s infinite ease-in-out;
}

.graphNode:hover {
    transform: scale(1.5);
    z-index: 10;
}

.graphNodeActive {
    width: 20px;
    height: 20px;
    background: #0ea5e9;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.6);
    z-index: 2;
    animation: float 4s infinite ease-in-out, glowPulse 2s infinite ease-out;
}

.graphLabel {
    position: absolute;
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    white-space: nowrap;
    margin-top: 20px;
    transform: translateX(-50%);
    pointer-events: none;
    transition: all 0.3s ease;
}

.graphNode:hover .graphLabel {
    color: #0f172a;
    font-size: 12px;
}

.graphEdge {
    position: absolute;
    background: #e2e8f0;
    height: 2px;
    transform-origin: left center;
    z-index: 1;
    opacity: 0.3;
    transition: all 0.4s ease;
}

.graphEdgeActive {
    background: linear-gradient(90deg, #2563eb, #0ea5e9);
    opacity: 0.8;
    height: 3px;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
}

/* ========================================
   ANALYSIS TOOLS
======================================== */

.synthesisGrid {
    grid-column: span 2;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.75rem;
    margin-top: 2.5rem;
}

.analysisTool {
    padding: 2rem;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.analysisTool::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2563eb, #60a5fa);
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.analysisTool:hover::before {
    transform: scaleX(1);
}

.analysisTool:hover {
    border-color: #2563eb;
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    transform: translateY(-8px);
}

.toolIcon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    transition: all 0.3s ease;
}

.analysisTool:hover .toolIcon {
    transform: scale(1.1) rotate(8deg);
}

.toolTitle {
    font-weight: 800;
    color: #0f172a;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
}

.toolDesc {
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.6;
}

/* ========================================
   DRAFT EDITOR
======================================== */

.draftCard {
    grid-column: span 2;
    position: relative;
    display: flex;
    flex-direction: column;
    background: transparent;
    box-shadow: none;
    border: none;
}

.draftBadge {
    position: absolute;
    top: 0;
    left: 0;
    background: transparent;
    color: #94a3b8;
    padding: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: none;
    z-index: 5;
    animation: none;
    margin-bottom: 1rem;
    display: none;
    /* Hide badge for cleaner look */
}



.editorLayout {
    display: grid;
    grid-template-columns: 240px 1fr 280px;
    /* Wider center, specific sidebars */
    gap: 2rem;
    min-height: 80vh;
    background: transparent;
    align-items: start;
}

.editorSidebar {
    background: transparent;
    border-right: none;
    padding: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    position: sticky;
    top: 2rem;
}

.editorNavItem {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    border-left: 2px solid transparent;
}

.editorNavItem:hover {
    background: transparent;
    color: #0f172a;
    transform: translateX(2px);
}

.editorNavItemActive {
    background: transparent;
    color: #0f172a;
    font-weight: 600;
    border-left-color: #0f172a;
    box-shadow: none;
}

.editorMain {
    padding: 4rem 5rem;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 4px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.05);
    /* Paper shadow */
    min-height: 100vh;
}

.editorToolbar {
    padding: 0 0 2rem 0;
    border-bottom: none;
    display: flex;
    justify-content: flex-end;
    /* Move toolbar to right or minimal */
    align-items: center;
    background: transparent;
    position: relative;
    top: 0;
    z-index: 10;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.editorToolbar:hover {
    opacity: 1;
}

.toolbarBtn {
    padding: 0.4rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
}

.toolbarBtn:hover {
    background: #f1f5f9;
    color: #0f172a;
    border-color: transparent;
    transform: none;
}

.editableArea {
    padding: 0;
    flex: 1;
    overflow-y: visible;
    /* Scroll happens on page, not div */
}

.draftTitle {
    font-size: 1.75rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 1.5rem;
    letter-spacing: -0.03em;
}

.draftPreview {
    color: #475569;
    line-height: 1.8;
    font-size: 1.0625rem;
    margin-bottom: 2rem;
}

.inlineCitation {
    display: inline-block;
    background: #eff6ff;
    color: #2563eb;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.8125rem;
    font-weight: 700;
    margin: 0 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
}

.inlineCitation:hover {
    background: #2563eb;
    color: white;
}

.citationSelectorMini {
    display: flex;
    gap: 0.25rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 10px;
}

.citationBtnMini {
    padding: 0.375rem 0.75rem;
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    background: transparent;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s;
}

.citationBtnActiveMini {
    background: white;
    color: #2563eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.aiIntelligencePanel {
    background: transparent;
    border-left: none;
    padding: 2rem 0;
    overflow-y: visible;
    position: sticky;
    top: 2rem;
}

.aiPanelHeader {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 1rem;
    letter-spacing: 0.05em;
    padding-left: 0.5rem;
}

.suggestionCard {
    background: transparent;
    padding: 0.75rem 0.5rem;
    border-radius: 8px;
    border: none;
    border-left-width: 0;
    box-shadow: none;
    transition: all 0.2s;
    margin-bottom: 0.5rem;
    cursor: pointer;
}

.suggestionCard:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: none;
    box-shadow: none;
}

.suggestionActionBtn {
    padding: 0.375rem 0.75rem;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    border-radius: 6px;
    background: #f1f5f9;
    border: none;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
}

.suggestionActionBtn:hover {
    background: #2563eb;
    color: white;
}

.draftFooter {
    margin-top: 0;
    padding: 1.5rem 2rem;
    background: #fff;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.draftFooterInfo {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.5rem 1rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    font-size: 0.875rem;
    color: #64748b;
}

/* ========================================
   TIMELINE
======================================== */

.timelineList {
    position: relative;
    padding-left: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.timelineList::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #f1f5f9;
}

.timelineEvent {
    position: relative;
}

.timelineDot {
    position: absolute;
    left: -24px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cbd5e1;
    border: 3px solid white;
    z-index: 1;
    transition: all 0.3s ease;
}

.timelineDotActive {
    background: #2563eb;
    box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.15);
    transform: scale(1.2);
}

.eventTitle {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.375rem;
}

.eventMeta {
    font-size: 0.8125rem;
    color: #94a3b8;
}

.eventAction {
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    color: #2563eb;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.eventAction:hover {
    text-decoration: underline;
}

/* ========================================
   REASONING LOG
======================================== */

.reasoningLog {
    background: #0f172a;
    border-radius: 20px;
    padding: 1.5rem;
    color: #e2e8f0;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.8125rem;
    margin-top: 1.5rem;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #1e293b;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    position: relative;
}

.reasoningLog::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.4), transparent);
}

.logEntry {
    margin-bottom: 0.75rem;
    display: flex;
    gap: 1rem;
    line-height: 1.5;
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}

.logEntry:nth-child(1) {
    animation-delay: 0.1s;
}

.logEntry:nth-child(2) {
    animation-delay: 0.2s;
}

.logEntry:nth-child(3) {
    animation-delay: 0.3s;
}

.logEntry:nth-child(4) {
    animation-delay: 0.4s;
}

.logEntry:nth-child(5) {
    animation-delay: 0.5s;
}

.logTime {
    color: #64748b;
    font-weight: 600;
    flex-shrink: 0;
}

.logText {
    color: #cbd5e1;
}

.logHighlight {
    color: #06b6d4;
    font-weight: 700;
}

.logSuccess {
    color: #10b981;
    font-weight: 700;
}

/* ========================================
   MODALS
======================================== */

.shareOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
}

.shareModal {
    background: white;
    width: 100%;
    max-width: 480px;
    border-radius: 32px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transform: scale(1);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.shareHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.shareHeader h3 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
}

.closeBtn {
    background: #f1f5f9;
    border: none;
    padding: 0.6rem;
    border-radius: 50%;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
}

.closeBtn:hover {
    background: #fee2e2;
    color: #ef4444;
    transform: rotate(90deg);
}

.shareInputGroup {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.shareInput {
    flex: 1;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    border: 2px solid #f1f5f9;
    outline: none;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.shareInput:focus {
    border-color: #2563eb;
    background: #f8fafc;
}

.inviteBtn {
    padding: 0 1.75rem;
    background: linear-gradient(135deg, #2563eb, #60a5fa);
    color: white;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
}

.inviteBtn:hover {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.collabList {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.collabItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-radius: 16px;
    transition: background 0.2s ease;
}

.collabItem:hover {
    background: #f8fafc;
}

.collabUser {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.collabAvatar {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 800;
    color: #2563eb;
}

.collabInfo h4 {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
}

.collabInfo p {
    font-size: 0.875rem;
    color: #64748b;
}

.roleSelect {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #475569;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    outline: none;
    cursor: pointer;
}

/* ========================================
   RESPONSIVE DESIGN
======================================== */

@media (max-width: 1200px) {
    .editorLayout {
        grid-template-columns: 180px 1fr;
    }

    .aiIntelligencePanel {
        display: none;
    }
}

@media (max-width: 1024px) {
    .contentGrid {
        grid-template-columns: 1fr;
    }

    .synthesisGrid {
        grid-template-columns: 1fr;
        grid-column: span 1;
    }

    .draftCard {
        grid-column: span 1;
    }
}

@media (max-width: 768px) {
    .researchContainer {
        padding: 1rem;
    }

    .headerSection {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
    }

    .titleGroup h1 {
        font-size: 1.75rem;
    }

    .statsGrid {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 0.5rem;
    }

    .phaseNav {
        width: 100%;
        overflow-x: auto;
        white-space: nowrap;
        gap: 0.5rem;
    }

    .searchHero {
        padding: 2rem 1.5rem;
        border-radius: 24px;
    }

    .heroText h2 {
        font-size: 1.5rem;
    }

    .mainInput {
        padding: 1.25rem 1.25rem 1.25rem 1.25rem;
        font-size: 1rem;
    }

    .synthesizeBtn {
        position: static;
        width: 100%;
        margin-top: 1rem;
        padding: 1rem;
    }

    .inputWrapper {
        margin: 1.5rem 0;
    }

    .editorLayout {
        grid-template-columns: 1fr;
    }

    .editorSidebar {
        display: none;
    }

    .editableArea {
        padding: 1.5rem;
    }

    .draftTitle {
        font-size: 1.25rem;
    }

    .draftBadge {
        left: 20px;
        font-size: 0.7rem;
        padding: 0.3rem 0.75rem;
    }

    .draftFooter {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem;
    }

    .shareModal {
        max-width: 90%;
        padding: 1.5rem;
        border-radius: 24px;
    }

    .shareInputGroup {
        flex-direction: column;
    }

    .inviteBtn {
        padding: 1rem;
    }
}

@media (max-width: 640px) {
    .collaborators {
        margin-right: 0.5rem;
    }

    .avatar {
        width: 32px;
        height: 32px;
        font-size: 0.75rem;
    }
}

/* ========================================
   CUSTOM SCROLLBARS
======================================== */

.editableArea::-webkit-scrollbar,
.reasoningLog::-webkit-scrollbar,
.aiIntelligencePanel::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.editableArea::-webkit-scrollbar-track,
.reasoningLog::-webkit-scrollbar-track,
.aiIntelligencePanel::-webkit-scrollbar-track {
    background: transparent;
}

.editableArea::-webkit-scrollbar-thumb,
.aiIntelligencePanel::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
}

.reasoningLog::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 10px;
}

.editableArea::-webkit-scrollbar-thumb:hover,
.aiIntelligencePanel::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}

.reasoningLog::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
```
