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
  Check,
  FileQuestion,
  Tag,
  GitCompare,
  Eye,
  EyeOff,
  HelpCircle,
  Scale,
  Split,
  GitMerge
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

  /* TOOLS MAPPING BY PHASE */
  const toolsByPhase: Record<number, string[]> = {
    1: ['gap'], // Exploration
    2: ['comparator', 'assumption', 'strength', 'question', 'gap'], // Analysis
    3: ['draft', 'argument', 'resolver', 'coherence'], // Synthesis
    4: ['polish', 'citation', 'plagiarism'] // Finalization (Placeholder)
  };

  const toolDetails: Record<string, any> = {
    comparator: {
      title: 'Method Comparator',
      icon: <GitCompare className="w-6 h-6" />,
      color: '#2563eb',
      bg: '#eff6ff',
      description: 'Side-by-side analysis of algorithms and datasets.',
      content: (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button className="px-3 py-1 text-xs font-bold bg-white shadow-sm rounded-md text-slate-700">Table</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-500">Diff</button>
            </div>
          </div>
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

          <div className={styles.diffView}>
            <div className={styles.diffColumn}>
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">Contradictions</h5>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800">
                <strong>Vaswani (2017)</strong> claims global attention is required, while <strong>Oord (2018)</strong> enables local approximations.
              </div>
            </div>
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
      description: 'Identify underexplored areas and opportunities.',
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
    assumption: {
      title: 'Assumption Extractor',
      icon: <FileQuestion className="w-6 h-6" />,
      color: '#8b5cf6',
      bg: '#f3e8ff',
      description: 'Highlight explicit and implicit constraints.',
      content: (
        <div className="space-y-4">
          <div className={styles.assumptionCard}>
            <div className={styles.assumptionHeader}>
              <span className="font-bold text-slate-700 text-sm">Vaswani et al. (2017)</span>
              <span className={styles.assumptionType}>Explicit</span>
            </div>
            <p className={styles.assumptionText}>Assumes availability of massive parallelized compute resources (TPU v2 pods).</p>
          </div>
          <div className={styles.assumptionCard}>
            <div className={styles.assumptionHeader}>
              <span className="font-bold text-slate-700 text-sm">Engunity Core (2025)</span>
              <span className={styles.assumptionType} style={{ background: '#fef3c7', color: '#d97706' }}>Implicit</span>
            </div>
            <p className={styles.assumptionText}>Relies on pre-cleaned, normalized vector datasets for latency comparisons.</p>
          </div>
          <div className={styles.assumptionCard}>
            <div className={styles.assumptionHeader}>
              <span className="font-bold text-slate-700 text-sm">Oord et al. (2018)</span>
              <span className={styles.assumptionType}>Environment</span>
            </div>
            <p className={styles.assumptionText}>Restricted to discrete latent spaces; continuous mappings are out of scope.</p>
          </div>
        </div>
      )
    },
    strength: {
      title: 'Strength / Weakness',
      icon: <Tag className="w-6 h-6" />,
      color: '#10b981',
      bg: '#d1fae5',
      description: 'Tag sources with capabilities and failure cases.',
      content: (
        <div className="space-y-6">
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-3">Attention Is All You Need</h5>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={styles.tagStrength}><Check className="w-3 h-3" /> Global Context</span>
              <span className={styles.tagStrength}><Check className="w-3 h-3" /> Parallelization</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={styles.tagWeakness}><X className="w-3 h-3" /> Quadratic Memory</span>
              <span className={styles.tagWeakness}><X className="w-3 h-3" /> Positional Embedding Fragility</span>
            </div>
          </div>
          <hr className="border-slate-100" />
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-3">Latent Diffusion Models</h5>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={styles.tagStrength}><Check className="w-3 h-3" /> High-Res Synthesis</span>
              <span className={styles.tagStrength}><Check className="w-3 h-3" /> Parameter Efficiency</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={styles.tagWeakness}><X className="w-3 h-3" /> Inference Latency</span>
            </div>
          </div>
        </div>
      )
    },
    question: {
      title: 'Question Generator',
      icon: <HelpCircle className="w-6 h-6" />,
      color: '#f59e0b',
      bg: '#fffbeb',
      description: 'Generate critical questions using AI.',
      content: (
        <div className="space-y-4">
          <div className={styles.questionCard}>
            <p className={styles.questionText}>Why does <strong>Transformer v2</strong> outperform the baseline despite having lower parameter count in sparse scenarios?</p>
          </div>
          <div className={styles.questionCard}>
            <p className={styles.questionText}>What happens to the <strong>Vector Quantization</strong> accuracy if the latent space assumes a non-uniform distribution?</p>
          </div>
          <div className={styles.questionCard}>
            <p className={styles.questionText}>Can <strong>Attention-X</strong> sustain its memory efficiency when sequence length exceeds 16k tokens?</p>
          </div>
        </div>
      )
    },
    argument: {
      title: 'Argument Builder',
      icon: <Scale className="w-6 h-6" />,
      color: '#6366f1',
      bg: '#e0e7ff',
      description: 'Link claims to evidence and build logic.',
      content: (
        <div className="space-y-4">
          <div className={styles.argumentCard} style={{ borderLeftColor: '#ef4444' }}>
            <p className={styles.argumentClaim}>Claim: "Latent Diffusion outperforms standard GANs in diversity."</p>
            <div className={styles.argumentStatus}>
              <span className="text-red-500 font-bold">Unsupported</span>
              <button className="text-blue-600 underline">Find Evidence</button>
            </div>
          </div>
          <div className={styles.argumentCard} style={{ borderLeftColor: '#10b981' }}>
            <p className={styles.argumentClaim}>Claim: "Transformers scale quadratically with sequence length."</p>
            <div className={styles.argumentStatus}>
              <span className="text-green-600 font-bold">Strong Support</span>
              <span>Vaswani (2017)</span>
            </div>
          </div>
        </div>
      )
    },
    resolver: {
      title: 'Contradiction Resolver',
      icon: <Split className="w-6 h-6" />,
      color: '#f43f5e',
      bg: '#ffe4e6',
      description: 'Resolve conflicting findings or definitions.',
      content: (
        <div>
          <div className={styles.resolverCard}>
            <h5 className="text-sm font-bold text-slate-700 mb-2">Conflict #1: Latent Space Nature</h5>
            <div className={styles.resolverSplit}>
              <div className={styles.resolverSide}>
                <strong className="block mb-1 text-slate-800">Source A</strong>
                Discrete (Vector Quantized)
              </div>
              <div className={styles.resolverSide}>
                <strong className="block mb-1 text-slate-800">Source B</strong>
                Continuous (Gaussian)
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600">Favor A</button>
              <button className="flex-1 py-2 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600">Favor B</button>
            </div>
          </div>
        </div>
      )
    },
    coherence: {
      title: 'Coherence Flow',
      icon: <GitMerge className="w-6 h-6" />,
      color: '#8b5cf6',
      bg: '#ede9fe',
      description: 'Visualize narrative flow and transitions.',
      content: (
        <div className={styles.flowMap}>
          <div className={styles.flowNode}>
            <div className={styles.flowDot}>1</div>
            <div className={styles.flowContent}>
              introduction_claims.txt
            </div>
          </div>
          <div className={styles.flowNode}>
            <div className={styles.flowDot}>2</div>
            <div className={styles.flowContent}>
              lit_review_transformers.txt
              <p className={styles.flowIssue}>⚠ Abrupt Transition</p>
            </div>
          </div>
          <div className={styles.flowNode}>
            <div className={styles.flowDot}>3</div>
            <div className={styles.flowContent}>
              methodology_setup.txt
            </div>
          </div>
        </div>
      )
    },
    challenger: {
      title: 'Hypothesis Challenger',
      icon: <Zap className="w-6 h-6" />,
      color: '#ef4444',
      bg: '#fee2e2',
      description: 'Critical stress-testing of your claims.',
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

      {/* Search Hero Area (Exploration Only) */}
      {currentPhase === 1 && (
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
      )}

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

          {/* Synthesis & Analysis Section (Dynamic based on phase) */}
          <div className={styles.synthesisGrid}>
            {(toolsByPhase[currentPhase] || []).map(toolKey => {
              const tool = toolDetails[toolKey];
              if (!tool) return null;
              return (
                <div key={toolKey} className={styles.analysisTool} onClick={() => setActiveTool(toolKey)}>
                  <div className={styles.toolIcon} style={{ background: tool.bg, color: tool.color }}>
                    {tool.icon}
                  </div>
                  <h4 className={styles.toolTitle}>{tool.title}</h4>
                  <p className={styles.toolDesc}>{tool.description}</p>
                </div>
              );
            })}
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
