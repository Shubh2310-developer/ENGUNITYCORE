import { chatService } from './chat';
import { documentService } from './document';
import { codeService } from './code';
import { analyticsService } from './analytics';
import { decisionService } from './decision';
import { jobPrepService } from './jobprep';
import { fetchSources, fetchClusters } from './research';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverviewMetric {
  id: string;
  label: string;
  value: number | string;
  sublabel?: string;
  href?: string;
  status?: 'ok' | 'warning' | 'error';
}

export interface OverviewWorkItem {
  id: string;
  title: string;
  type: 'chat' | 'document' | 'code' | 'analytics' | 'decision' | 'jobprep' | 'research';
  status: string;
  time: string;
  href: string;
  timestamp?: string;
}

export interface OverviewSignal {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'error';
  href?: string;
}

export interface OverviewActivity {
  id: string;
  time: string;
  action: string;
  target: string;
  href?: string;
  timestamp?: string;
}

export interface OverviewData {
  metrics: OverviewMetric[];
  recentWork: OverviewWorkItem[];
  signals: OverviewSignal[];
  activities: OverviewActivity[];
  moduleErrors: Array<{ module: string; message: string }>;
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────

export function formatRelativeTime(isoString: string | undefined | null): string {
  if (!isoString) return 'unknown';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'unknown';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

export async function getOverviewData(): Promise<OverviewData> {
  const token = useAuthStore.getState().token;

  // Guard: do not make API calls without a token
  if (!token) {
    return {
      metrics: [],
      recentWork: [],
      signals: [],
      activities: [],
      moduleErrors: [{ module: 'auth', message: 'Not authenticated' }],
    };
  }

  // Use a small limit for analytics datasets to avoid loading large payloads
  const ANALYTICS_LIMIT = 10;

  const [
    chatResult,
    documentResult,
    codeResult,
    analyticsResult,
    decisionResult,
    jobPrepProfileResult,
    jobPrepRolesResult,
    jobPrepSkillsResult,
    jobPrepSimulationsResult,
    researchSourcesResult,
    researchClustersResult,
  ] = await Promise.allSettled([
    chatService.getSessions(),
    documentService.getDocuments(),
    codeService.getProjects(),
    analyticsService.listDatasets(0, ANALYTICS_LIMIT),
    decisionService.getDecisions(),
    jobPrepService.getProfile(),
    jobPrepService.getTargetRoles(),
    jobPrepService.getSkills(),
    jobPrepService.getSimulations(),
    fetchSources(token),
    fetchClusters(token),
    // NOTE: fetchGraphNodes is intentionally excluded — it may return large node
    // payloads that are not needed for an overview summary.
  ]);

  const moduleErrors: OverviewData['moduleErrors'] = [];

  const collectError = (module: string, result: PromiseSettledResult<unknown>) => {
    if (result.status === 'rejected') {
      moduleErrors.push({
        module,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  };

  collectError('chat', chatResult);
  collectError('documents', documentResult);
  collectError('code', codeResult);
  collectError('analytics', analyticsResult);
  collectError('decisions', decisionResult);
  collectError('jobprep-profile', jobPrepProfileResult);
  collectError('jobprep-roles', jobPrepRolesResult);
  collectError('jobprep-skills', jobPrepSkillsResult);
  collectError('jobprep-simulations', jobPrepSimulationsResult);
  collectError('research-sources', researchSourcesResult);
  collectError('research-clusters', researchClustersResult);

  // ── Unwrap ─────────────────────────────────────────────────────────────────
  const chatSessions = chatResult.status === 'fulfilled' ? (chatResult.value as any[]) : [];
  const documents = documentResult.status === 'fulfilled' ? (documentResult.value as any[]) : [];
  const codeProjects = codeResult.status === 'fulfilled' ? (codeResult.value as any[]) : [];
  const datasets = analyticsResult.status === 'fulfilled' ? (analyticsResult.value as any[]) : [];
  const decisions = decisionResult.status === 'fulfilled' ? (decisionResult.value as any[]) : [];
  const jobPrepProfile = jobPrepProfileResult.status === 'fulfilled' ? jobPrepProfileResult.value : null;
  const jobPrepRoles = jobPrepRolesResult.status === 'fulfilled' ? (jobPrepRolesResult.value as any[]) : [];
  const jobPrepSkills = jobPrepSkillsResult.status === 'fulfilled' ? (jobPrepSkillsResult.value as any[]) : [];
  const jobPrepSimulations = jobPrepSimulationsResult.status === 'fulfilled' ? (jobPrepSimulationsResult.value as any[]) : [];
  const researchSources = researchSourcesResult.status === 'fulfilled' ? (researchSourcesResult.value as any[]) : [];
  const researchClusters = researchClustersResult.status === 'fulfilled' ? (researchClustersResult.value as any[]) : [];

  // ── Metrics ────────────────────────────────────────────────────────────────
  const jobReadiness = jobPrepProfile ? (jobPrepProfile as any).overall_readiness_score ?? 0 : 0;
  const primaryRole = jobPrepRoles.find((r: any) => r.is_primary);

  const metrics: OverviewMetric[] = [
    {
      id: 'chat',
      label: 'Chat Sessions',
      value: chatSessions.length,
      sublabel: 'sessions',
      href: '/chat',
      status: chatResult.status === 'rejected' ? 'error' : 'ok',
    },
    {
      id: 'documents',
      label: 'Documents',
      value: documents.length,
      sublabel: 'files',
      href: '/documents',
      status: documentResult.status === 'rejected' ? 'error' : 'ok',
    },
    {
      id: 'code',
      label: 'Code Projects',
      value: codeProjects.length,
      sublabel: 'repos',
      href: '/code',
      status: codeResult.status === 'rejected' ? 'error' : 'ok',
    },
    {
      id: 'analytics',
      label: 'Datasets',
      value: datasets.length,
      sublabel: 'datasets',
      href: '/analytics',
      status: analyticsResult.status === 'rejected' ? 'error' : 'ok',
    },
    {
      id: 'decisions',
      label: 'Decisions',
      value: decisions.length,
      sublabel: 'recorded',
      href: '/decisionvault',
      status: decisionResult.status === 'rejected' ? 'error' : 'ok',
    },
    {
      id: 'jobprep',
      label: 'Job Readiness',
      value: jobPrepProfile ? `${jobReadiness}%` : 0,
      sublabel: primaryRole ? primaryRole.role_title : 'no target role',
      href: '/jobprep',
      status: jobPrepProfileResult.status === 'rejected' ? 'error' : 'ok',
    },
    {
      id: 'research',
      label: 'Research Sources',
      value: researchSources.length,
      sublabel: `${researchClusters.length} cluster${researchClusters.length !== 1 ? 's' : ''}`,
      href: '/research',
      status: researchSourcesResult.status === 'rejected' ? 'error' : 'ok',
    },
  ];

  // ── Recent work ────────────────────────────────────────────────────────────
  const recentWork: OverviewWorkItem[] = [];

  // Chat sessions (top 3 most recent)
  chatSessions
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 3)
    .forEach((s: any) => {
      recentWork.push({
        id: `chat-${s.id}`,
        title: s.title || 'Untitled Chat',
        type: 'chat',
        status: 'active',
        time: formatRelativeTime(s.updated_at || s.created_at),
        href: '/chat',
        timestamp: s.updated_at || s.created_at,
      });
    });

  // Documents (top 2)
  documents
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((d: any) => {
      recentWork.push({
        id: `doc-${d.id}`,
        title: d.title || d.filename || 'Untitled Document',
        type: 'document',
        status: d.status || 'draft',
        time: formatRelativeTime(d.updated_at || d.created_at),
        href: `/documents/${d.id}`,
        timestamp: d.updated_at || d.created_at,
      });
    });

  // Code projects (top 2)
  codeProjects
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((p: any) => {
      recentWork.push({
        id: `code-${p.id}`,
        title: p.name || 'Unnamed Project',
        type: 'code',
        status: p.language || 'code',
        time: formatRelativeTime(p.updated_at || p.created_at),
        href: '/code',
        timestamp: p.updated_at || p.created_at,
      });
    });

  // Analytics datasets (top 2)
  datasets
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((ds: any) => {
      recentWork.push({
        id: `analytics-${ds.id}`,
        title: ds.name || 'Unnamed Dataset',
        type: 'analytics',
        status: ds.status || 'ready',
        time: formatRelativeTime(ds.updated_at || ds.created_at),
        href: '/analytics',
        timestamp: ds.updated_at || ds.created_at,
      });
    });

  // Decisions (top 2)
  decisions
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((d: any) => {
      recentWork.push({
        id: `decision-${d.id}`,
        title: d.title || 'Untitled Decision',
        type: 'decision',
        status: d.status || 'tentative',
        time: formatRelativeTime(d.updated_at || d.created_at),
        href: '/decisionvault',
        timestamp: d.updated_at || d.created_at,
      });
    });

  // Job prep simulations (top 1, only if timestamp exists)
  jobPrepSimulations
    .filter((s: any) => s.created_at || s.updated_at)
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 1)
    .forEach((s: any) => {
      recentWork.push({
        id: `jobprep-sim-${s.id}`,
        title: s.role_title || s.title || 'Interview Simulation',
        type: 'jobprep',
        status: s.status || 'completed',
        time: formatRelativeTime(s.updated_at || s.created_at),
        href: '/jobprep',
        timestamp: s.updated_at || s.created_at,
      });
    });

  // Research sources (top 1, only if timestamp exists)
  researchSources
    .filter((s: any) => s.created_at || s.added_at)
    .slice()
    .sort((a: any, b: any) => new Date(b.created_at || b.added_at).getTime() - new Date(a.created_at || a.added_at).getTime())
    .slice(0, 1)
    .forEach((s: any) => {
      const ts = s.created_at || s.added_at;
      recentWork.push({
        id: `research-${s.id}`,
        title: s.title || s.source_name || 'Research Source',
        type: 'research',
        status: 'active',
        time: formatRelativeTime(ts),
        href: '/research',
        timestamp: ts,
      });
    });

  // Sort by real timestamp descending, cap at 8
  recentWork.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
  const trimmedRecentWork = recentWork.slice(0, 8);

  // ── Activities ─────────────────────────────────────────────────────────────
  const activities: OverviewActivity[] = [];

  chatSessions
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 3)
    .forEach((s: any) => {
      const ts = s.updated_at || s.created_at;
      activities.push({
        id: `act-chat-${s.id}`,
        time: formatRelativeTime(ts),
        action: 'Chat',
        target: s.title || 'Untitled Chat',
        href: '/chat',
        timestamp: ts,
      });
    });

  documents
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((d: any) => {
      const ts = d.updated_at || d.created_at;
      activities.push({
        id: `act-doc-${d.id}`,
        time: formatRelativeTime(ts),
        action: 'Document',
        target: d.title || d.filename || 'Untitled Document',
        href: `/documents/${d.id}`,
        timestamp: ts,
      });
    });

  codeProjects
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((p: any) => {
      const ts = p.updated_at || p.created_at;
      activities.push({
        id: `act-code-${p.id}`,
        time: formatRelativeTime(ts),
        action: 'Code',
        target: p.name || 'Unnamed Project',
        href: '/code',
        timestamp: ts,
      });
    });

  decisions
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((d: any) => {
      const ts = d.updated_at || d.created_at;
      activities.push({
        id: `act-decision-${d.id}`,
        time: formatRelativeTime(ts),
        action: 'Decision',
        target: d.title || 'Untitled Decision',
        href: '/decisionvault',
        timestamp: ts,
      });
    });

  datasets
    .slice()
    .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 2)
    .forEach((ds: any) => {
      const ts = ds.updated_at || ds.created_at;
      activities.push({
        id: `act-analytics-${ds.id}`,
        time: formatRelativeTime(ts),
        action: 'Analytics',
        target: ds.name || 'Unnamed Dataset',
        href: '/analytics',
        timestamp: ts,
      });
    });

  // Sort activities by timestamp descending, cap at 10
  activities.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
  const trimmedActivities = activities.slice(0, 10);

  // ── Signals ────────────────────────────────────────────────────────────────
  const signals: OverviewSignal[] = [];

  // Decision vault signals
  const criticalFlags = decisions.flatMap((d: any) =>
    (d.ai_flags ?? []).filter((f: any) => f.severity === 'critical' && !f.dismissed)
  );
  if (criticalFlags.length > 0) {
    signals.push({
      id: 'sig-critical-flags',
      text: `${criticalFlags.length} critical AI flag${criticalFlags.length > 1 ? 's' : ''} in Decision Vault require attention`,
      type: 'error',
      href: '/decisionvault',
    });
  }

  const weakEvidenceDecisions = decisions.filter((d: any) =>
    (d.ai_flags ?? []).some((f: any) => f.flag_type === 'weak_evidence' && !f.dismissed)
  );
  if (weakEvidenceDecisions.length > 0) {
    signals.push({
      id: 'sig-weak-evidence',
      text: `${weakEvidenceDecisions.length} decision${weakEvidenceDecisions.length > 1 ? 's have' : ' has'} weak evidence — review recommended`,
      type: 'warning',
      href: '/decisionvault',
    });
  }

  const lowConfidenceDecisions = decisions.filter((d: any) => d.confidence === 'low' && d.status !== 'deprecated');
  if (lowConfidenceDecisions.length > 0) {
    signals.push({
      id: 'sig-low-confidence',
      text: `${lowConfidenceDecisions.length} low-confidence decision${lowConfidenceDecisions.length > 1 ? 's' : ''} may need revisiting`,
      type: 'warning',
      href: '/decisionvault',
    });
  }

  // Job Prep signals
  if (jobPrepProfile) {
    const score = (jobPrepProfile as any).overall_readiness_score ?? 0;
    if (score < 50) {
      signals.push({
        id: 'sig-jobprep-low',
        text: `Job readiness score is ${score}% — critical skill gaps detected`,
        type: 'error',
        href: '/jobprep',
      });
    } else if (score < 75) {
      signals.push({
        id: 'sig-jobprep-mid',
        text: `Job readiness at ${score}% — some skill gaps remain`,
        type: 'warning',
        href: '/jobprep',
      });
    }
  }

  const criticalSkillGaps = jobPrepSkills.filter((s: any) => s.is_critical && s.is_gap);
  if (criticalSkillGaps.length > 0) {
    signals.push({
      id: 'sig-skill-gaps',
      text: `${criticalSkillGaps.length} critical skill gap${criticalSkillGaps.length > 1 ? 's' : ''} identified in Job Prep`,
      type: 'warning',
      href: '/jobprep',
    });
  }

  // Analytics signals
  const processingDatasets = datasets.filter((d: any) => d.status === 'processing');
  if (processingDatasets.length > 0) {
    signals.push({
      id: 'sig-analytics-processing',
      text: `${processingDatasets.length} dataset${processingDatasets.length > 1 ? 's are' : ' is'} currently processing in Analytics`,
      type: 'info',
      href: '/analytics',
    });
  }

  const errorDatasets = datasets.filter((d: any) => d.status === 'error');
  if (errorDatasets.length > 0 && signals.length < 5) {
    signals.push({
      id: 'sig-analytics-error',
      text: `${errorDatasets.length} dataset${errorDatasets.length > 1 ? 's have' : ' has'} processing errors in Analytics`,
      type: 'error',
      href: '/analytics',
    });
  }

  const readyDatasets = datasets.filter((d: any) => d.status === 'ready');
  if (readyDatasets.length > 0 && signals.length < 5) {
    signals.push({
      id: 'sig-analytics-ready',
      text: `${readyDatasets.length} dataset${readyDatasets.length > 1 ? 's are' : ' is'} ready for analysis`,
      type: 'info',
      href: '/analytics',
    });
  }

  // Research signals
  if (researchSources.length > 0 && signals.length < 6) {
    signals.push({
      id: 'sig-research',
      text: `Research workspace has ${researchSources.length} source${researchSources.length > 1 ? 's' : ''} and ${researchClusters.length} cluster${researchClusters.length !== 1 ? 's' : ''}`,
      type: 'info',
      href: '/research',
    });
  }

  // Module error signals (non-noisy, only if something is broken)
  if (moduleErrors.length > 0 && signals.length < 6) {
    const errorModules = Array.from(new Set(moduleErrors.map(e => e.module.replace(/-.*/, ''))));
    signals.push({
      id: 'sig-module-errors',
      text: `Some modules are unavailable: ${errorModules.join(', ')}`,
      type: 'warning',
    });
  }

  // Keep signals at 4–6 items
  const trimmedSignals = signals.slice(0, 6);

  return {
    metrics,
    recentWork: trimmedRecentWork,
    signals: trimmedSignals,
    activities: trimmedActivities,
    moduleErrors,
  };
}

export const overviewService = { getOverviewData };
