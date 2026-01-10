'use client';

import React from 'react';
import {
  MessageSquare,
  FileText,
  BookOpen,
  Code2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import styles from './overview.module.css';

export default function OverviewPage() {
  const { user } = useAuthStore();

  // Get user display name from email (since User interface has email, not username)
  const getUserName = () => {
    if (user?.email) {
      // Extract name part from email (before @) and capitalize first letter
      const namePart = user.email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'User';
  };

  // Mock data for demonstration
  const metrics = {
    activeChats: 12,
    documents: 47,
    notebooks: 8,
    codeProjects: 15
  };

  const recentWork = [
    { id: 1, title: 'API Integration Research', type: 'chat', status: 'running', time: '2 min ago' },
    { id: 2, title: 'generator.py', type: 'code', status: 'draft', time: '15 min ago' },
    { id: 3, title: 'ML Model Training Notes', type: 'research', status: 'complete', time: '1 hour ago' },
    { id: 4, title: 'Performance Analysis', type: 'chat', status: 'complete', time: '3 hours ago' },
  ];

  const signals = [
    { id: 1, text: '3 pending code reviews require attention', type: 'info' },
    { id: 2, text: 'Model training completed with 98.5% accuracy', type: 'info' },
    { id: 3, text: 'API rate limit approaching threshold (85%)', type: 'warning' },
  ];

  const activities = [
    { time: '14:32', action: 'Saved', target: 'generator.py' },
    { time: '14:28', action: 'Created', target: 'New Chat Session' },
    { time: '14:15', action: 'Exported', target: 'Analytics Report' },
    { time: '13:45', action: 'Uploaded', target: 'research_data.csv' },
  ];

  const getWorkIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'code':
        return <Code2 className="w-4 h-4" />;
      case 'research':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getWorkIconClass = (type: string) => {
    switch (type) {
      case 'chat':
        return styles.workIconChat;
      case 'code':
        return styles.workIconCode;
      case 'research':
        return styles.workIconResearch;
      default:
        return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'running':
        return styles.statusRunning;
      case 'complete':
        return styles.statusComplete;
      default:
        return styles.statusDraft;
    }
  };

  const getSignalBarClass = (type: string) => {
    switch (type) {
      case 'info':
        return styles.signalBarInfo;
      case 'warning':
        return styles.signalBarWarning;
      case 'error':
        return styles.signalBarError;
      default:
        return '';
    }
  };

  return (
    <div className={styles.overviewLight}>
      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <h1 className={styles.pageTitle}>Welcome back, {getUserName()}</h1>
          <span className={styles.textMeta}>Your workspace is ready</span>
        </div>
        <div className={styles.statusRight}>
          <span className={styles.statusDot}></span>
          <span>All systems operational</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardChats}`}>
          <div className={styles.metricLabel}>Active Chats</div>
          <div className={styles.metricValue}>
            {metrics.activeChats}
            <span className={styles.metricSub}>sessions</span>
          </div>
        </div>
        <div className={`${styles.metricCard} ${styles.metricCardDocs}`}>
          <div className={styles.metricLabel}>Documents</div>
          <div className={styles.metricValue}>
            {metrics.documents}
            <span className={styles.metricSub}>files</span>
          </div>
        </div>
        <div className={`${styles.metricCard} ${styles.metricCardNotebooks}`}>
          <div className={styles.metricLabel}>Notebooks</div>
          <div className={styles.metricValue}>
            {metrics.notebooks}
            <span className={styles.metricSub}>active</span>
          </div>
        </div>
        <div className={`${styles.metricCard} ${styles.metricCardCode}`}>
          <div className={styles.metricLabel}>Code Projects</div>
          <div className={styles.metricValue}>
            {metrics.codeProjects}
            <span className={styles.metricSub}>repos</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column - Active Work */}
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionHeader}>Active Work</span>
            <a href="/chat" className={styles.viewAllLink}>
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className={styles.workList}>
            {recentWork.map((item) => (
              <div key={item.id} className={styles.workItem}>
                <div className={styles.workItemLeft}>
                  <div className={`${styles.workIcon} ${getWorkIconClass(item.type)}`}>
                    {getWorkIcon(item.type)}
                  </div>
                  <div>
                    <div className={styles.workTitle}>{item.title}</div>
                    <div className={styles.workMeta}>{item.time}</div>
                  </div>
                </div>
                <div className={styles.workItemRight}>
                  <span className={getStatusClass(item.status)}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                </div>
              </div>
            ))}
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
              {signals.map((signal) => (
                <div key={signal.id} className={styles.signalItem}>
                  <div className={`${styles.signalBar} ${getSignalBarClass(signal.type)}`}></div>
                  <span className={styles.signalText}>{signal.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activityPanel}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionHeader}>Recent Activity</span>
            </div>
            <div className={styles.activityList}>
              {activities.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <span className={styles.activityTime}>{activity.time}</span>
                  <span className={styles.activityAction}>{activity.action}</span>
                  <span className={styles.activityTarget}>{activity.target}</span>
                </div>
              ))}
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
