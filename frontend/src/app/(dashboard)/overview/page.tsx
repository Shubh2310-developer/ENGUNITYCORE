'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  FileText,
  BookOpen,
  Code2,
  ChevronRight,
  ArrowRight,
  BarChart2,
  Layers,
  Briefcase,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getOverviewData, type OverviewData, type OverviewWorkItem } from '@/services/overview';
import styles from './overview.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserName(email: string | undefined): string {
  if (!email) return 'User';
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function getWorkIcon(type: OverviewWorkItem['type']) {
  switch (type) {
    case 'chat':       return <MessageSquare className="w-4 h-4" />;
    case 'code':       return <Code2 className="w-4 h-4" />;
    case 'research':   return <BookOpen className="w-4 h-4" />;
    case 'analytics':  return <BarChart2 className="w-4 h-4" />;
    case 'decision':   return <Layers className="w-4 h-4" />;
    case 'jobprep':    return <Briefcase className="w-4 h-4" />;
    default:           return <FileText className="w-4 h-4" />;
  }
}

function getWorkIconClass(type: OverviewWorkItem['type'], s: Record<string, string>): string {
  switch (type) {
    case 'chat':       return s.workIconChat;
    case 'code':       return s.workIconCode;
    case 'research':   return s.workIconResearch;
    case 'analytics':  return s.workIconAnalytics;
    case 'decision':   return s.workIconDecision;
    case 'jobprep':    return s.workIconJobprep;
    default:           return '';
  }
}

function getStatusClass(status: string, s: Record<string, string>): string {
  switch (status) {
    case 'running':
    case 'active':
    case 'confirmed':
    case 'ready':
      return s.statusRunning;
    case 'complete':
    case 'final':
      return s.statusComplete;
    default:
      return s.statusDraft;
  }
}

function getSignalBarClass(type: 'info' | 'warning' | 'error', s: Record<string, string>): string {
  switch (type) {
    case 'info':    return s.signalBarInfo;
    case 'warning': return s.signalBarWarning;
    case 'error':   return s.signalBarError;
    default:        return '';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { user, status: authStatus } = useAuthStore();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await getOverviewData();
      setData(result);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load overview data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Wait until auth is confirmed before fetching
    if (authStatus === 'authenticated') {
      loadData();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const userName = getUserName(user?.email);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.overviewLight}>
        <div className={styles.statusBar}>
          <div className={styles.statusLeft}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonMeta} />
          </div>
        </div>
        <div className={styles.metricsGrid}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${styles.metricCard} ${styles.skeletonCard}`}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonValue} />
            </div>
          ))}
        </div>
        <div className={styles.loadingHint}>Loading your workspace data…</div>
      </div>
    );
  }

  // ── Fatal error (no auth) ──────────────────────────────────────────────────
  if (fetchError && !data) {
    return (
      <div className={styles.overviewLight}>
        <div className={styles.errorBanner}>
          <AlertCircle className="w-5 h-5" />
          <span>{fetchError}</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics ?? [];
  const recentWork = data?.recentWork ?? [];
  const signals = data?.signals ?? [];
  const activities = data?.activities ?? [];
  const moduleErrors = data?.moduleErrors ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.overviewLight}>
      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <h1 className={styles.pageTitle}>Welcome back, {userName}</h1>
          <span className={styles.textMeta}>Your workspace is ready</span>
        </div>
        <div className={styles.statusRight}>
          <span className={styles.statusDot}></span>
          <span>All systems operational</span>
          <button
            onClick={handleRefresh}
            className={styles.refreshBtn}
            aria-label="Refresh overview"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? styles.spinning : ''}`} />
          </button>
        </div>
      </div>

      {/* Module error banner (non-blocking) */}
      {moduleErrors.length > 0 && (
        <div className={styles.warningBanner}>
          <AlertCircle className="w-4 h-4" />
          <span>
            Some modules could not load:{' '}
            {Array.from(new Set(moduleErrors.map((e) => e.module.replace(/-.*/, '')))).join(', ')}.
            Showing available data.
          </span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        {metrics.map((m) => (
          <a
            key={m.id}
            href={m.href}
            className={`${styles.metricCard} ${
              m.id === 'chat' ? styles.metricCardChats :
              m.id === 'documents' ? styles.metricCardDocs :
              m.id === 'code' ? styles.metricCardCode :
              m.id === 'analytics' ? styles.metricCardAnalytics :
              m.id === 'decisions' ? styles.metricCardDecisions :
              m.id === 'jobprep' ? styles.metricCardJobprep :
              m.id === 'research' ? styles.metricCardResearch : ''
            } ${styles.metricCardLink}`}
          >
            <div className={styles.metricLabel}>{m.label}</div>
            <div className={styles.metricValue}>
              {m.value}
              <span className={styles.metricSub}>{m.sublabel}</span>
            </div>
            {m.status === 'error' && (
              <div className={styles.metricErrorBadge}>unavailable</div>
            )}
          </a>
        ))}
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column - Recent Work */}
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionHeader}>Recent Work</span>
            <a href="/chat" className={styles.viewAllLink}>
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className={styles.workList}>
            {recentWork.length === 0 ? (
              <div className={styles.emptyState}>
                <span>No recent work yet. Start by opening a module from the sidebar.</span>
              </div>
            ) : (
              recentWork.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={styles.workItem}
                >
                  <div className={styles.workItemLeft}>
                    <div className={`${styles.workIcon} ${getWorkIconClass(item.type, styles)}`}>
                      {getWorkIcon(item.type)}
                    </div>
                    <div>
                      <div className={styles.workTitle}>{item.title}</div>
                      <div className={styles.workMeta}>{item.time}</div>
                    </div>
                  </div>
                  <div className={styles.workItemRight}>
                    <span className={getStatusClass(item.status, styles)}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Intelligence Signals */}
          <div className={styles.signalsPanel}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionHeader}>Intelligence Signals</span>
            </div>
            <div className={styles.signalsList}>
              {signals.length === 0 ? (
                <div className={styles.emptyStateSm}>No signals — your workspace looks healthy.</div>
              ) : (
                signals.map((signal) => (
                  <div
                    key={signal.id}
                    className={styles.signalItem}
                    onClick={() => signal.href && (window.location.href = signal.href)}
                    role={signal.href ? 'link' : undefined}
                    style={{ cursor: signal.href ? 'pointer' : 'default' }}
                  >
                    <div className={`${styles.signalBar} ${getSignalBarClass(signal.type, styles)}`}></div>
                    <span className={styles.signalText}>{signal.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activityPanel}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionHeader}>Recent Activity</span>
            </div>
            <div className={styles.activityList}>
              {activities.length === 0 ? (
                <div className={styles.emptyStateSm}>No activity recorded yet.</div>
              ) : (
                activities.map((activity) => (
                  <a
                    key={activity.id}
                    href={activity.href}
                    className={styles.activityItem}
                    style={{ textDecoration: 'none' }}
                  >
                    <span className={styles.activityTime}>{activity.time}</span>
                    <span className={styles.activityAction}>{activity.action}</span>
                    <span className={styles.activityTarget}>{activity.target}</span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>Engunity AI • Dashboard</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
