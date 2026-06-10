'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import {
  Shield,
  Search,
  Plus,
  Filter,
  Kanban,
  Clock,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  PlusCircle,
  TrendingUp,
  History,
  FileText,
  User,
  ArrowRight,
  MoreVertical,
  Zap,
  Layout,
  BookOpen,
  Code2,
  Briefcase,
  Activity,
  ExternalLink,
  Target,
  ArrowUpRight,
  Info,
  AlertCircle,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import styles from './decisionvault.module.css';
import { decisionService, Decision, DecisionType, DecisionStatus, DecisionConfidence, Option, Evidence, AIFlag, DecisionAIError } from '@/services/decision';
import { useSearchParams } from 'next/navigation';

type ViewMode = 'active' | 'timeline' | 'analytics';

const DECISION_TYPES: DecisionType[] = ['Architecture', 'Research', 'Code', 'Product', 'Career', 'Compliance'];
const STATUSES: DecisionStatus[] = ['tentative', 'confirmed', 'revisited', 'deprecated'];

const sanitizePrefill = (value: string | null, maxLen: number): string => {
  if (!value) return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
};

const sanitizeContextPrefill = (value: string | null): string => {
  if (!value) return '';
  return sanitizePrefill(value.replace(/<\/?script[^>]*>/gi, ''), 4000);
};

const buildInitialDecision = (): Partial<Decision> => ({
  title: '',
  type: 'Architecture',
  problem_statement: '',
  context: '',
  status: 'tentative',
  confidence: 'medium',
  options: [
    { id: '1', label: '', description: '', pros: [], cons: [], estimated_effort: 'medium', risk_level: 'low' },
    { id: '2', label: '', description: '', pros: [], cons: [], estimated_effort: 'medium', risk_level: 'low' }
  ],
  constraints: [],
  tradeoffs: { performance: 3, cost: 3, complexity: 3, risk: 3, scalability: 3, time_to_implement: 3 },
  evidence: [],
  ai_flags: [],
  revisit_rule: { trigger_type: 'time_based', trigger_value: '3 months', notification_enabled: true },
  tags: [],
  final_decision: '',
  rationale: '',
  privacy: 'private'
});

function DecisionVaultContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingFlags, setIsGeneratingFlags] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SCAN_MESSAGES = [
    'Initializing Engunity Mesh context...',
    'Analyzing repository structure...',
    'Checking git history for architectural drift...',
    'Parsing recent chat sessions for decision context...',
    'Synthesizing evidence nodes...'
  ];
  const [starContent, setStarContent] = useState<{ situation: string; task: string; action: string; result: string } | null>(null);
  const [adrContent, setAdrContent] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<'none' | 'star' | 'adr'>('none');

  const analytics = React.useMemo(() => {
    if (decisions.length === 0) return {
      velocity: 0,
      velocityChange: 0,
      evidenceQuality: 0,
      reversalRate: 0,
      distribution: [] as any[],
      stabilityScore: 0,
      calibrationData: [] as any[]
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentDecisions = decisions.filter(d => new Date(d.created_at) >= thirtyDaysAgo);
    const lastMonthDecisions = decisions.filter(d => {
      const date = new Date(d.created_at);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const velocity = recentDecisions.length;
    const velocityChange = lastMonthDecisions.length === 0
      ? (recentDecisions.length > 0 ? 100 : 0)
      : Math.round(((recentDecisions.length - lastMonthDecisions.length) / lastMonthDecisions.length) * 100);

    const primaryEvidenceDecisions = decisions.filter(d =>
      d.evidence.some(e => e.credibility === 'primary')
    ).length;
    const evidenceQuality = Math.round((primaryEvidenceDecisions / decisions.length) * 100);

    const reversedDecisions = decisions.filter(d =>
      d.status === 'deprecated' || d.status === 'revisited'
    ).length;
    const reversalRate = Math.round((reversedDecisions / decisions.length) * 100);

    const distribution = DECISION_TYPES.map(type => {
      const count = decisions.filter(d => d.type === type).length;
      return {
        label: type,
        count,
        percent: decisions.length > 0 ? Math.round((count / decisions.length) * 100) : 0,
        color: type === 'Architecture' ? '#3b82f6' :
               type === 'Code' ? '#10b981' :
               type === 'Research' ? '#f59e0b' :
               type === 'Product' ? '#ef4444' :
               type === 'Career' ? '#a855f7' : '#64748b'
      };
    }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

    const stabilityScore = decisions.length > 0 ? Math.round((1 - (reversedDecisions / decisions.length)) * 100) : 0;
    const calibrationData = decisions.map(d => ({
      date: d.created_at,
      confidence: d.confidence === 'high' ? 90 : d.confidence === 'medium' ? 60 : 30,
      outcome: d.status === 'confirmed' ? 100 : d.status === 'deprecated' ? 0 : 50
    }));

    return { velocity, velocityChange, evidenceQuality, reversalRate, distribution, stabilityScore, calibrationData };
  }, [decisions]);

  const STEPS = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Context' },
    { id: 3, label: 'Options' },
    { id: 4, label: 'Evidence' },
    { id: 5, label: 'Analysis' },
    { id: 6, label: 'AI Review' },
    { id: 7, label: 'Resolution' }
  ];

  // Form State
  const [newDecision, setNewDecision] = useState<Partial<Decision>>(buildInitialDecision());
  const createRequestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    loadDecisions();
  }, []);

  // Handle incoming triggers from other modules
  useEffect(() => {
    const source = searchParams.get('source');
    const title = sanitizePrefill(searchParams.get('title'), 200);
    const problem = sanitizePrefill(searchParams.get('problem'), 1000);
    const context = sanitizeContextPrefill(searchParams.get('context'));
    const safeSource = source === 'code' || source === 'research' || source === 'chat' ? source : null;

    if (safeSource || title || problem || context) {
      setShowCreateModal(true);
      setSubmitError(null);
      setAiReviewError(null);
      setNewDecision(prev => ({
        ...prev,
        title: title || prev.title,
        context: context || prev.context,
        problem_statement: problem || prev.problem_statement,
        type: safeSource === 'code' ? 'Code' :
              safeSource === 'research' ? 'Research' :
              safeSource === 'chat' ? 'Architecture' : prev.type
      }));

      // If it's a chat conversion, we might want to skip to context or start fresh
      if (safeSource === 'chat' && !problem) {
        setNewDecision(prev => ({
          ...prev,
          problem_statement: `Converted from chat session: ${title || 'Untitled'}`
        }));
      }

      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams]);

  const loadDecisions = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await decisionService.getDecisions();
      setDecisions(data);
    } catch (error) {
      console.error('Failed to load decisions:', error);
      setLoadError('Could not load decisions. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup scan interval and timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  const handleCreateDecision = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    if (!createRequestKeyRef.current) {
      createRequestKeyRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    try {
      const created = await decisionService.createDecision(newDecision, {
        idempotencyKey: createRequestKeyRef.current,
      });
      setDecisions(prev => [created, ...prev]);
      setShowCreateModal(false);
      createRequestKeyRef.current = null;
      resetForm();
    } catch (error) {
      setSubmitError('Failed to initialize decision. Please retry.');
      console.error('Failed to process decision creation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setNewDecision(buildInitialDecision());
    setSubmitError(null);
    setAiReviewError(null);
    createRequestKeyRef.current = null;
    handleCancelScan();
  };

  const filteredDecisions = decisions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.problem_statement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusDecisions = (status: DecisionStatus) =>
    filteredDecisions.filter(d => d.status === status);

  const getTypeStyle = (type: DecisionType) => {
    switch (type) {
      case 'Architecture': return styles.typeArchitecture;
      case 'Research': return styles.typeResearch;
      case 'Code': return styles.typeCode;
      case 'Product': return styles.typeProduct;
      case 'Career': return styles.typeCareer;
      case 'Compliance': return styles.typeCompliance;
      default: return '';
    }
  };

  const getConfidenceColor = (conf: DecisionConfidence) => {
    switch (conf) {
      case 'low': return styles.confLow;
      case 'medium': return styles.confMed;
      case 'high': return styles.confHigh;
      default: return '';
    }
  };

  const getStepValidationError = (): string | null => {
    if (currentStep === 1) {
      if (!newDecision.title?.trim()) return 'Decision title is required.';
      if (newDecision.title.trim().length < 3) return 'Title must be at least 3 characters.';
    }
    if (currentStep === 2) {
      if (!newDecision.problem_statement?.trim()) return 'Problem statement is required.';
      if (newDecision.problem_statement.trim().length < 5) return 'Problem statement must be at least 5 characters.';
    }
    if (currentStep === 3) {
      const opts = newDecision.options || [];
      if (opts.length < 2) return 'At least 2 options are required.';
      if (opts.some(o => !o.label?.trim())) return 'All options must have a label.';
    }
    return null;
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const nextStep = () => {
    const err = getStepValidationError();
    if (err) { setStepError(err); return; }
    setStepError(null);
    if (currentStep === 5) {
      generateAIFlags();
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => { setStepError(null); setCurrentStep(prev => Math.max(prev - 1, 1)); };

  const generateAIFlags = async () => {
    setIsGeneratingFlags(true);
    setAiReviewError(null);
    try {
      const flags = await decisionService.analyzeDecision(newDecision);
      setNewDecision(prev => ({ ...prev, ai_flags: flags }));
    } catch (error) {
      if (error instanceof DecisionAIError) {
        setAiReviewError(error.message || 'AI review unavailable. You can continue, but this draft was not adversarially checked.');
      } else {
        setAiReviewError('AI review unavailable. You can continue, but this draft was not adversarially checked.');
      }
      console.error('Failed to generate AI flags:', error);
    } finally {
      setIsGeneratingFlags(false);
    }
  };

  const addOption = () => {
    const newOptions = [...(newDecision.options || [])];
    newOptions.push({
      id: Math.random().toString(36).substr(2, 9),
      label: '',
      description: '',
      pros: [],
      cons: [],
      estimated_effort: 'medium',
      risk_level: 'low'
    });
    setNewDecision({ ...newDecision, options: newOptions });
  };

  const convertToSTAR = (d: Decision) => {
    setActiveAnalysis('star');
    // Simulate AI generation of STAR format
    setStarContent({
      situation: `We were working on ${d.type} for the workspace. ${d.context || d.problem_statement}`,
      task: `The goal was to address: ${d.title}. Primary constraints included ${d.constraints.map(c => c.description).join(', ') || 'technical and time efficiency'}.`,
      action: `I evaluated ${d.options.length} alternatives: ${d.options.map(o => o.label).join(', ')}. I performed a tradeoff analysis prioritizing ${Object.entries(d.tradeoffs).sort((a,b) => b[1] - a[1]).slice(0,2).map(e => e[0]).join(' and ')}.`,
      result: `Selected "${d.final_decision}" with ${d.confidence} confidence. Rationale: ${d.rationale}`
    });
  };

  const exportADR = (d: Decision) => {
    setActiveAnalysis('adr');
    const date = new Date(d.created_at).toLocaleDateString();
    const adr = `# ADR: ${d.title}

## Status
${d.status.toUpperCase()} (${date})

## Context
${d.problem_statement}

${d.context ? `### Background\n${d.context}\n` : ''}
### Constraints
${d.constraints.map(c => `- ${c.description} (${c.type})`).join('\n') || 'None specified.'}

## Decision
We chose to implement: **${d.final_decision}**

### Rationale
${d.rationale || 'No rationale provided.'}

### Alternatives Considered
${d.options.map(o => `#### ${o.label}\n${o.description}\n- Pros: ${o.pros.join(', ') || 'None'}\n- Cons: ${o.cons.join(', ') || 'None'}`).join('\n\n')}

## Consequences
- **Confidence Level**: ${d.confidence}
- **Performance Assessment**: ${d.tradeoffs.performance}/5
- **Risk Profile**: ${d.options.find(o => o.label === d.final_decision)?.risk_level || 'N/A'}
- **Tradeoffs accepted in**: ${Object.entries(d.tradeoffs).filter(e => e[1] < 3).map(e => e[0]).join(', ') || 'None'}

---
*Generated by Engunity Decision Vault*`;
    setAdrContent(adr);
  };

  const handleCancelScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanProject = () => {
    setIsScanning(true);
    setScanStep(0);

    // Simulate progressive scanning UI transitions
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    scanIntervalRef.current = setInterval(() => {
      setScanStep(prev => {
        if (prev >= SCAN_MESSAGES.length - 1) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    scanTimeoutRef.current = setTimeout(async () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      scanTimeoutRef.current = null;

      try {
        const scanRes = await decisionService.scanWorkspace();
        setNewDecision(prev => ({
          ...prev,
          evidence: [...(prev.evidence || []), ...scanRes.evidence]
        }));
      } catch (err) {
        console.error('Failed real workspace scan, falling back to mock evidence:', err);
        const fallbackEvidence: Evidence[] = [
          {
            id: 'scan-1',
            source_type: 'code_run',
            source_id: 'internal',
            excerpt: 'Analysis of current repository suggests 12 components are using legacy patterns.',
            credibility: 'primary',
            added_at: new Date().toISOString(),
            relevance_score: 0.92
          },
          {
            id: 'scan-2',
            source_type: 'chat',
            source_id: 'recent',
            excerpt: 'Team discussion on 2026-01-05 highlighted concerns regarding scalability of current DB schema.',
            credibility: 'secondary',
            added_at: new Date().toISOString(),
            relevance_score: 0.88
          }
        ];
        setNewDecision(prev => ({
          ...prev,
          evidence: [...(prev.evidence || []), ...fallbackEvidence]
        }));
      } finally {
        setIsScanning(false);
      }
    }, 4500);
  };

  return (
    <div className={styles.vaultTheme}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Decision Vault</h1>
            <p className={styles.headerSubtitle}>The intelligence layer for your reasoning</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="text-xs font-semibold text-blue-700">Decision Velocity: {analytics.velocity}/mo</span>
          </div>
          <button onClick={() => setShowCreateModal(true)} className={styles.newDecisionBtn}>
            <Plus className="w-4 h-4" />
            New Decision
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        <button className={`${styles.navItem} ${viewMode === 'active' ? styles.navItemActive : ''}`} onClick={() => setViewMode('active')}>
          <div className="flex items-center gap-2"><Kanban className="w-4 h-4" />Active Decisions</div>
        </button>
        <button className={`${styles.navItem} ${viewMode === 'timeline' ? styles.navItemActive : ''}`} onClick={() => setViewMode('timeline')}>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Timeline View</div>
        </button>
        <button className={`${styles.navItem} ${viewMode === 'analytics' ? styles.navItemActive : ''}`} onClick={() => setViewMode('analytics')}>
          <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Analytics & Patterns</div>
        </button>
      </nav>

      {/* Sub-Header */}
      <div className={styles.subHeader}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search problem statements, titles, or tags..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <button className={styles.filterBtn}><Filter className="w-4 h-4" />Filter</button>
          <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
          <button className={styles.filterBtn}><TrendingUp className="w-4 h-4" />Sort</button>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-slate-600">{loadError}</p>
            <button onClick={loadDecisions} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">Retry</button>
          </div>
        ) : viewMode === 'active' ? (
          <div className={styles.kanbanBoard}>
            {STATUSES.map(status => (
              <div key={status} className={styles.column}>
                <div className={styles.columnHeader}>
                  <h3 className={styles.columnTitle}>{status}</h3>
                  <span className={styles.columnBadge}>{getStatusDecisions(status).length}</span>
                </div>
                {getStatusDecisions(status).map(decision => (
                  <div key={decision.id} className={styles.card} onClick={() => setSelectedDecision(decision)}>
                    <div className="flex items-center justify-between">
                      <span className={`${styles.cardType} ${getTypeStyle(decision.type)}`}>{decision.type}</span>
                      <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h4 className={styles.cardTitle}>{decision.title}</h4>
                    <div className={styles.cardMeta}>
                      <div className={styles.cardStats}>
                        <div className={styles.statItem}><FileText className="w-3 h-3" /><span>{decision.evidence.length}</span></div>
                        {decision.ai_flags && decision.ai_flags.length > 0 && (
                          <div className={styles.statItem}><AlertTriangle className="w-3 h-3 text-amber-500" /><span>{decision.ai_flags.length}</span></div>
                        )}
                      </div>
                      <div className={`${styles.confidenceBadge} ${getConfidenceColor(decision.confidence)}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="capitalize">{decision.confidence}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          <div className={styles.timeline}>
            {filteredDecisions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(d => (
              <div key={d.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineDate}>{new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className={styles.timelineCard} onClick={() => setSelectedDecision(d)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`${styles.cardType} ${getTypeStyle(d.type)} mb-2 block`}>{d.type}</span>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{d.title}</h4>
                      <p className="text-slate-600 text-sm line-clamp-2">{d.problem_statement}</p>
                    </div>
                    <div className={`${styles.confidenceBadge} ${getConfidenceColor(d.confidence)}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="capitalize text-xs font-bold">{d.confidence}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.analyticsGrid}>
            <div className={styles.statCard}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={styles.statLabel}>Decision Velocity</h3>
                <TrendingUp className={`w-4 h-4 ${analytics.velocityChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div className={styles.statValue}>{analytics.velocity}</div>
              <p className="text-xs text-slate-500">Decisions logged this month ({analytics.velocityChange >= 0 ? '+' : ''}{analytics.velocityChange}% vs last month)</p>
            </div>
            <div className={styles.statCard}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={styles.statLabel}>Evidence Quality</h3>
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div className={styles.statValue}>{analytics.evidenceQuality}%</div>
              <p className="text-xs text-slate-500">Decisions with primary source evidence</p>
            </div>
            <div className={styles.statCard}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={styles.statLabel}>Reversal Rate</h3>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className={styles.statValue}>{analytics.reversalRate}%</div>
              <p className="text-xs text-slate-500">Decisions deprecated or revisited</p>
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase mb-6 flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-400" /> Category Distribution
              </h3>
              <div className="space-y-4">
                {analytics.distribution.map(cat => (
                  <div key={cat.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">{cat.label}</span>
                      <span className="text-slate-900 font-bold">{cat.count} decisions</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Calibration */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" /> Confidence Calibration
              </h3>
              {analytics.calibrationData.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Target className="w-8 h-8 opacity-30" />
                  <p className="text-xs">No decisions yet — calibration will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="h-40 flex items-end gap-2 px-2 border-b border-l border-slate-100">
                    {analytics.calibrationData.slice(-5).map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full relative">
                          <div
                            className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                            style={{
                              height: `${d.confidence}%`,
                              backgroundColor: d.outcome >= 75 ? '#2563eb' : d.outcome >= 40 ? '#3b82f6' : '#94a3b8'
                            }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              {d.confidence}%
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                    Showing confidence vs. outcome alignment for your last {analytics.calibrationData.slice(-5).length} decision{analytics.calibrationData.slice(-5).length !== 1 ? 's' : ''}.
                    Bar height = your initial confidence; color = outcome (blue = confirmed, grey = pending/deprecated).
                  </p>
                </>
              )}
            </div>

            <div className="col-span-full bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase mb-6">AI Pattern Insights</h3>
              {decisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <Zap className="w-8 h-8 opacity-30" />
                  <p className="text-xs text-center max-w-xs">
                    Create your first decision to unlock AI pattern analysis of your reasoning habits.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Reversal / Decision Drift */}
                  {analytics.reversalRate > 20 && (
                    <div className={styles.aiFlag}>
                      <AlertTriangle className={styles.flagIcon} />
                      <div>
                        <h4 className={styles.flagTitle}>Decision Drift Detected</h4>
                        <p className={styles.flagMessage}>
                          {analytics.reversalRate}% of your decisions have been revisited or deprecated. This is above the 20% threshold and may indicate misalignment in long-term goals.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Weak Evidence Pattern */}
                  {analytics.evidenceQuality < 50 && (
                    <div className="flex gap-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Low Evidence Quality</h4>
                        <p className="text-sm text-amber-700">
                          Only {analytics.evidenceQuality}% of your decisions have primary-source evidence attached. Consider adding citations or code references before finalizing decisions.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Calibration insight — only shown when calibration data is available */}
                  {analytics.calibrationData.length > 0 && (() => {
                    const confirmed = analytics.calibrationData.filter(d => d.outcome === 100).length;
                    const total = analytics.calibrationData.length;
                    const pct = Math.round((confirmed / total) * 100);
                    return (
                      <div className="flex gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="text-sm font-bold text-blue-900">Decision Outcome Rate</h4>
                          <p className="text-sm text-blue-700">
                            {pct}% of your decisions are currently in &quot;Confirmed&quot; status ({confirmed}/{total}). Review &quot;Tentative&quot; decisions regularly to improve outcome tracking.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Stability score */}
                  <div className="flex gap-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="text-sm font-bold text-purple-900">Decision Stability Score</h4>
                      <p className="text-sm text-purple-700">
                        Your current stability score is <strong>{analytics.stabilityScore}%</strong> based on {decisions.length} total decision{decisions.length !== 1 ? 's' : ''}.
                        {analytics.stabilityScore >= 80 ? ' High stability — your decisions are holding well.' : analytics.stabilityScore >= 60 ? ' Moderate stability — some decisions may need revisiting.' : ' Low stability — consider reviewing recent reversals.'}
                      </p>
                    </div>
                  </div>
                  {/* All-clear when no warning conditions apply */}
                  {analytics.reversalRate <= 20 && analytics.evidenceQuality >= 50 && (
                    <div className="flex gap-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="text-sm font-bold text-green-900">Healthy Decision Patterns</h4>
                        <p className="text-sm text-green-700">
                          No bias patterns detected in your current decision history. Reversal rate ({analytics.reversalRate}%) and evidence quality ({analytics.evidenceQuality}%) are both within healthy ranges.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Decision Detail Panel */}
      {selectedDecision && (
        <div className={styles.detailOverlay} onClick={() => setSelectedDecision(null)}>
          <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${styles.cardType} ${getTypeStyle(selectedDecision.type)}`}>{selectedDecision.type}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{selectedDecision.status}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedDecision.title}</h2>
              </div>
              <button onClick={() => { setSelectedDecision(null); setActiveAnalysis('none'); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={styles.detailContent}>
              {/* AI Analysis Actions */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => convertToSTAR(selectedDecision)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    activeAnalysis === 'star' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  STAR Breakdown
                </button>
                <button
                  onClick={() => exportADR(selectedDecision)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    activeAnalysis === 'adr' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  ADR Export
                </button>
              </div>

              {/* STAR Content Display */}
              {activeAnalysis === 'star' && starContent && (
                <div className={styles.starResult}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">STAR Analysis</h3>
                    <button onClick={() => setActiveAnalysis('none')} className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className={styles.starSection}>
                    <span className={styles.starLabel}>Situation</span>
                    <p className={styles.starText}>{starContent.situation}</p>
                  </div>
                  <div className={styles.starSection}>
                    <span className={styles.starLabel}>Task</span>
                    <p className={styles.starText}>{starContent.task}</p>
                  </div>
                  <div className={styles.starSection}>
                    <span className={styles.starLabel}>Action</span>
                    <p className={styles.starText}>{starContent.action}</p>
                  </div>
                  <div className={styles.starSection}>
                    <span className={styles.starLabel}>Result</span>
                    <p className={styles.starText}>{starContent.result}</p>
                  </div>
                </div>
              )}

              {/* ADR Content Display */}
              {activeAnalysis === 'adr' && adrContent && (
                <div className={styles.adrExport}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Markdown ADR</h3>
                    <div className="flex gap-2">
                      <button className={styles.adrCopyBtn} onClick={() => {
                        navigator.clipboard.writeText(adrContent);
                        alert('ADR copied to clipboard!');
                      }}>Copy Markdown</button>
                      <button onClick={() => setActiveAnalysis('none')} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {adrContent}
                </div>
              )}

              {/* AI Flags Section */}
              {selectedDecision.ai_flags && selectedDecision.ai_flags.length > 0 && (
                <section className="mb-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> AI Review & Adversarial Checks
                  </h3>
                  <div className="space-y-3">
                    {selectedDecision.ai_flags.map(flag => (
                      <div key={flag.id} className={`p-4 rounded-xl border flex gap-4 ${
                        flag.severity === 'critical' ? 'bg-red-50 border-red-100' :
                        flag.severity === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                      }`}>
                        <div className="mt-0.5">
                          {flag.severity === 'critical' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                           flag.severity === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                           <Info className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{flag.flag_type.replace(/_/g, ' ')}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              flag.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              flag.severity === 'warning' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                            }`}>{flag.severity}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 mb-2">{flag.message}</p>
                          <div className="bg-white/60 p-2 rounded-lg border border-black/5 text-xs text-slate-700">
                            <span className="font-bold">Suggested Action:</span> {flag.suggested_action}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Confidence</p>
                  <div className={`flex items-center gap-1.5 font-bold ${getConfidenceColor(selectedDecision.confidence)}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="capitalize">{selectedDecision.confidence}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Created</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(selectedDecision.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Author</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <User className="w-4 h-4" />
                    <span className="truncate max-w-[120px]" title={selectedDecision.created_by || `user:${selectedDecision.user_id}`}>
                      {selectedDecision.created_by
                        ? selectedDecision.created_by.split('@')[0]
                        : `user:${selectedDecision.user_id}`}
                    </span>
                  </div>
                </div>
              </div>

              <section className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Problem Statement
                </h3>
                <p className="text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  {selectedDecision.problem_statement}
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                  <Kanban className="w-4 h-4" /> Options Analysis
                </h3>
                <div className="space-y-4">
                  {selectedDecision.options.map((opt, i) => (
                    <div key={opt.id} className="p-5 border border-slate-200 rounded-xl hover:border-blue-200 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{opt.label}</h4>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">Effort: {opt.estimated_effort}</span>
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">Risk: {opt.risk_level}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{opt.description}</p>
                      <div className={styles.proConGrid}>
                        <div className="space-y-1.5">
                          {opt.pros.map((pro, idx) => (
                            <div key={idx} className={styles.proItem}><CheckCircle2 className="w-3 h-3" /> {pro}</div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          {opt.cons.map((con, idx) => (
                            <div key={idx} className={styles.conItem}><X className="w-3 h-3" /> {con}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Tradeoff Matrix
                </h3>
                <div className={styles.matrixContainer}>
                  <table className={styles.matrixTable}>
                    <thead>
                      <tr>
                        <th className={styles.matrixTh}>Dimension</th>
                        <th className={styles.matrixTh}>Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedDecision.tradeoffs).map(([key, value]) => (
                        <tr key={key} className={styles.matrixRow}>
                          <td className={`${styles.matrixTd} capitalize font-medium text-slate-700`}>{key.replace(/_/g, ' ')}</td>
                          <td className={styles.matrixTd}>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full ${i <= value ? 'bg-blue-600' : 'bg-slate-200'}`} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {selectedDecision.evidence.length > 0 && (
                <section className="mb-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Supporting Evidence
                  </h3>
                  <div className={styles.evidenceList}>
                    {selectedDecision.evidence.map(ev => (
                      <div key={ev.id} className={styles.evidenceItem}>
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                          {ev.source_type === 'code_run' ? <Code2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 font-medium line-clamp-2">{ev.excerpt}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            <span>{ev.source_type}</span>
                            <span>Credibility: {ev.credibility}</span>
                          </div>
                        </div>
                        <button className="p-1.5 text-slate-400 hover:text-blue-600">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Resolution Section */}
              {(selectedDecision.final_decision || selectedDecision.rationale) && (
                <section className="mb-8 p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Final Resolution
                  </h3>
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Selected Option</p>
                    <p className="text-lg font-bold text-white">{selectedDecision.final_decision || 'Implementation Pending'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Rationale</p>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      {selectedDecision.rationale || 'No rationale provided yet.'}
                    </p>
                  </div>
                </section>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
               <button
                 onClick={() => { setSelectedDecision(null); setActiveAnalysis('none'); loadDecisions(); }}
                 className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-sm"
               >
                 Refresh &amp; Close
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Decision Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>New Decision Entry</h2>
                <p className="text-xs text-slate-500 mt-1">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={styles.stepProgress}>
              {STEPS.map(s => (
                <div key={s.id} className={`${styles.step} ${currentStep === s.id ? styles.stepActive : ''} ${currentStep > s.id ? styles.stepCompleted : ''}`}>
                  <div className={styles.stepCircle}>{currentStep > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}</div>
                  <span className={styles.stepLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.modalContent}>
              {currentStep === 1 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><Shield className="w-4 h-4" />Core Identity</div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Decision Title</label>
                    <input type="text" className={styles.input} placeholder="Should we migrate to serverless architecture?" value={newDecision.title} onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Category</label>
                      <select className={styles.select} value={newDecision.type} onChange={(e) => setNewDecision({ ...newDecision, type: e.target.value as DecisionType })}>
                        {DECISION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Initial Confidence</label>
                      <select className={styles.select} value={newDecision.confidence} onChange={(e) => setNewDecision({ ...newDecision, confidence: e.target.value as DecisionConfidence })}>
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><Layout className="w-4 h-4" />Context & Problem</div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Problem Statement</label>
                    <textarea className={styles.textarea} placeholder="Describe the problem this decision aims to solve..." value={newDecision.problem_statement} onChange={(e) => setNewDecision({ ...newDecision, problem_statement: e.target.value })} />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><PlusCircle className="w-4 h-4" />Options Assembly (Min 2)</div>
                  {newDecision.options?.map((opt, idx) => (
                    <div key={opt.id} className="p-4 border border-slate-100 rounded-lg mb-4 bg-slate-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <input type="text" className={styles.input} placeholder={`Option ${idx + 1} Label`} value={opt.label} onChange={(e) => {
                          const newOpts = [...(newDecision.options || [])];
                          newOpts[idx].label = e.target.value;
                          setNewDecision({ ...newDecision, options: newOpts });
                        }} />
                      </div>
                      <textarea className={`${styles.textarea} bg-white mb-3`} placeholder="Brief description of this alternative..." style={{ minHeight: '60px' }} value={opt.description} onChange={(e) => {
                        const newOpts = [...(newDecision.options || [])];
                        newOpts[idx].description = e.target.value;
                        setNewDecision({ ...newDecision, options: newOpts });
                      }} />
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Effort</label>
                          <select className={styles.select} value={opt.estimated_effort} onChange={(e) => {
                            const newOpts = [...(newDecision.options || [])];
                            newOpts[idx].estimated_effort = e.target.value as any;
                            setNewDecision({ ...newDecision, options: newOpts });
                          }}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                        </div>
                        <div><label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Risk</label>
                          <select className={styles.select} value={opt.risk_level} onChange={(e) => {
                            const newOpts = [...(newDecision.options || [])];
                            newOpts[idx].risk_level = e.target.value as any;
                            setNewDecision({ ...newDecision, options: newOpts });
                          }}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addOption} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5" /> Add alternative</button>
                </div>
              )}

              {currentStep === 4 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><BookOpen className="w-4 h-4" />Evidence & Research</div>

                  {isScanning ? (
                    <div className="bg-slate-50 border-2 border-dashed border-blue-200 rounded-xl p-8 text-center mb-6">
                      <div className="flex flex-col items-center">
                        <Activity className="w-8 h-8 text-blue-600 animate-pulse mb-4" />
                        <p className="text-sm font-bold text-slate-800 mb-2">{SCAN_MESSAGES[scanStep]}</p>
                        <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${((scanStep + 1) / SCAN_MESSAGES.length) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={handleCancelScan}
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm"
                        >
                          Cancel Scan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-6">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Zap className="w-6 h-6 text-blue-600" /></div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">AI Context Linker (Simulated Preview)</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mb-1">Provides a preview of potential evidence generated through simulated project indexing.</p>
                      <p className="text-[10px] text-amber-600 font-semibold mb-3 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Preview Only — scan results are simulated.
                      </p>
                      <button
                        onClick={handleScanProject}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        Run Simulated Scan
                      </button>
                    </div>
                  )}

                  {newDecision.evidence && newDecision.evidence.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Linked Evidence ({newDecision.evidence.length})</h5>
                      {newDecision.evidence.map(ev => (
                        <div key={ev.id} className="p-3 bg-white border border-slate-100 rounded-lg flex gap-3 items-start shadow-sm">
                          <div className="mt-1">
                            {ev.source_type === 'code_run' ? <Code2 className="w-3.5 h-3.5 text-blue-500" /> : <MessageCircle className="w-3.5 h-3.5 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{ev.excerpt}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] font-black uppercase text-slate-400">{ev.source_type}</span>
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Relevance: {(ev.relevance_score * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><Activity className="w-4 h-4" />Tradeoff Matrix</div>
                  <div className={styles.matrixContainer}>
                    <table className={styles.matrixTable}>
                      <thead><tr><th className={styles.matrixTh}>Dimension</th><th className={styles.matrixTh}>Score (1-5)</th></tr></thead>
                      <tbody>
                        {Object.entries(newDecision.tradeoffs || {}).map(([key, value]) => (
                          <tr key={key} className={styles.matrixRow}>
                            <td className={`${styles.matrixTd} capitalize font-medium`}>{key.replace(/_/g, ' ')}</td>
                            <td className={styles.matrixTd}>
                              <div className="flex items-center gap-3">
                                <input type="range" min="1" max="5" step="1" className="flex-1 accent-blue-600" value={value} onChange={(e) => {
                                  setNewDecision({ ...newDecision, tradeoffs: { ...newDecision.tradeoffs as any, [key]: parseInt(e.target.value) } });
                                }} />
                                <span className="w-4 text-center font-bold text-blue-600">{value}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><Zap className="w-4 h-4 text-amber-500" />AI Adversarial Review</div>
                  {isGeneratingFlags ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Zap className="w-8 h-8 text-blue-600 animate-bounce mb-4" />
                      <p className="text-sm font-medium text-slate-600">Analyzing your decision for biases and gaps...</p>
                      <div className="w-48 h-1 bg-slate-200 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-blue-600 animate-[loading_2s_infinite]" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiReviewError ? (
                        <div className="p-5 bg-red-50 border border-red-100 rounded-xl">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-red-900 mb-1">AI review unavailable</h4>
                              <p className="text-sm text-red-700 mb-3">{aiReviewError}</p>
                              <button
                                onClick={generateAIFlags}
                                className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 transition-all"
                              >
                                Retry AI Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : newDecision.ai_flags?.length === 0 ? (
                        <div className="p-6 bg-green-50 border border-green-100 rounded-xl text-center">
                          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                          <h4 className="font-bold text-green-900">No major issues detected</h4>
                          <p className="text-sm text-green-700">Your decision structure appears robust. Proceed to initialization.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 mb-4">
                            <span className="font-bold">AI Note:</span> These flags are adversarial prompts meant to strengthen your reasoning. You can address them or proceed to resolution.
                          </div>
                          {newDecision.ai_flags?.map(flag => (
                            <div key={flag.id} className={`p-4 rounded-xl border flex gap-4 ${
                              flag.severity === 'critical' ? 'bg-red-50 border-red-100' :
                              flag.severity === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                            }`}>
                              <div className="mt-0.5">
                                {flag.severity === 'critical' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                                 flag.severity === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                                 <Info className="w-5 h-5 text-blue-600" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 mb-1">{flag.message}</p>
                                <p className="text-xs text-slate-600 mb-2">{flag.suggested_action}</p>
                                <button className="text-[10px] font-bold text-blue-600 hover:underline">Address Issue</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 7 && (
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}><CheckCircle2 className="w-4 h-4" />Resolution & Initialization</div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Selected Option</label>
                    <div className="grid grid-cols-1 gap-2">
                      {newDecision.options?.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setNewDecision({ ...newDecision, final_decision: opt.label })}
                          className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                            newDecision.final_decision === opt.label
                              ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">{opt.label || 'Untitled Option'}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{opt.description || 'No description provided'}</p>
                          </div>
                          {newDecision.final_decision === opt.label && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Decision Rationale</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Why was this option chosen? Summarize the deciding factors..."
                      value={newDecision.rationale}
                      onChange={(e) => setNewDecision({ ...newDecision, rationale: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Privacy Level</label>
                      <select className={styles.select} value={newDecision.privacy} onChange={(e) => setNewDecision({ ...newDecision, privacy: e.target.value as any })}>
                        <option value="private">Private (Only Me)</option>
                        <option value="workspace">Workspace (Team)</option>
                        <option value="public">Public (Shared Link)</option>
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Initial Status</label>
                      <select className={styles.select} value={newDecision.status} onChange={(e) => setNewDecision({ ...newDecision, status: e.target.value as any })}>
                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className={styles.sectionTitle}><History className="w-4 h-4" /> Governance & Revisit Rule</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Trigger Type</label>
                        <select
                          className={styles.select}
                          value={newDecision.revisit_rule?.trigger_type}
                          onChange={(e) => setNewDecision({
                            ...newDecision,
                            revisit_rule: { ...newDecision.revisit_rule!, trigger_type: e.target.value as any }
                          })}
                        >
                          <option value="time_based">Time Based</option>
                          <option value="metric_based">Metric Based</option>
                          <option value="event_based">Event Based</option>
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Trigger Value</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder={newDecision.revisit_rule?.trigger_type === 'time_based' ? 'e.g. 6 months' : 'e.g. Performance drops > 20%'}
                          value={newDecision.revisit_rule?.trigger_value}
                          onChange={(e) => setNewDecision({
                            ...newDecision,
                            revisit_rule: { ...newDecision.revisit_rule!, trigger_value: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="notify"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={newDecision.revisit_rule?.notification_enabled}
                        onChange={(e) => setNewDecision({
                          ...newDecision,
                          revisit_rule: { ...newDecision.revisit_rule!, notification_enabled: e.target.checked }
                        })}
                      />
                      <label htmlFor="notify" className="text-xs font-medium text-slate-600">Enable AI notification when trigger is met</label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <div className="flex-1">{currentStep > 1 && <button onClick={prevStep} className={`${styles.btn} ${styles.btnSecondary}`}>Back</button>}</div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); setStepError(null); }} className={`${styles.btn} ${styles.btnSecondary}`}>Cancel</button>
              {currentStep < 7 ? (
                <button onClick={nextStep} className={`${styles.btn} ${styles.btnPrimary}`}>Next Step</button>
              ) : (
                <button
                  onClick={handleCreateDecision}
                  disabled={isSubmitting}
                  className={`${styles.btn} ${styles.btnPrimary} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Initializing...' : 'Initialize Decision'}
                </button>
              )}
            </div>
            {stepError && (
              <div className="px-6 pb-3 text-xs font-medium text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />{stepError}
              </div>
            )}
            {submitError && (
              <div className="px-6 pb-5 text-xs font-medium text-red-700">{submitError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionVaultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full" />
      </div>
    }>
      <DecisionVaultContent />
    </Suspense>
  );
}
