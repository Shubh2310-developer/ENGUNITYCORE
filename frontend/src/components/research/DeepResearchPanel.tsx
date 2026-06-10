'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { startDeepResearch, ResearchRequest, ResearchStreamEvent, ResearchReport } from '@/services/research';
import { useAuthStore } from '@/stores/authStore';
import styles from './DeepResearch.module.css';

export default function DeepResearchPanel() {
    const [query, setQuery] = useState('');
    const [depth, setDepth] = useState<'quick' | 'standard' | 'deep' | 'exhaustive'>('standard');
    const [isResearching, setIsResearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [events, setEvents] = useState<ResearchStreamEvent[]>([]);
    const [report, setReport] = useState<ResearchReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const eventLogRef = useRef<HTMLDivElement>(null);

    // Auto-scroll event log
    useEffect(() => {
        if (eventLogRef.current) {
            eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
        }
    }, [events]);

    const _hasHydrated = useAuthStore((state) => state._hasHydrated);
    const token = useAuthStore((state) => state.token);

    const handleResearch = useCallback(async () => {
        if (!query.trim()) return;

        // Read the latest token at call-time — avoids stale closure if store
        // hydrated after this component first rendered.
        const currentToken = useAuthStore.getState().token ?? '';
        if (!currentToken) {
            setError('Not authenticated. Please sign in again.');
            return;
        }

        setIsResearching(true);
        setProgress(0);
        setEvents([]);
        setReport(null);
        setError(null);

        const request: ResearchRequest = {
            query,
            depth,
            include_web_search: true,
            include_graph_search: true,
            output_format: 'detailed',
        };

        await startDeepResearch(
            request,
            currentToken,
            (event) => {
                setProgress(event.progress_percent);
                if (event.data && event.data.message) {
                    setStatusMessage(event.data.message);
                }
                setEvents(prev => [...prev, event]);
            },
            (report) => {
                setReport(report);
                setIsResearching(false);
                setStatusMessage('Research Complete');
            },
            (err) => {
                setError(err);
                setIsResearching(false);
                setStatusMessage('Failed');
            }
        );
    }, [query, depth]);

    // Markdown is rendered via react-markdown (remark-gfm) — no dangerouslySetInnerHTML.

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>🔍 Deep Research Agent</h2>
                <p>Multi-step iterative research with source evaluation & conflict resolution</p>
            </div>

            {/* Query Input */}
            <div className={styles.inputSection}>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What would you like to research? (e.g., 'Compare React vs Vue for large-scale applications')"
                    className={styles.queryInput}
                    rows={3}
                    disabled={isResearching}
                />

                <div className={styles.controls}>
                    <select
                        value={depth}
                        onChange={(e) => setDepth(e.target.value as any)}
                        className={styles.depthSelect}
                        disabled={isResearching}
                    >
                        <option value="quick">⚡ Quick (1-2 sources)</option>
                        <option value="standard">📖 Standard (3-5 sources)</option>
                        <option value="deep">🔬 Deep (5-10 sources)</option>
                        <option value="exhaustive">🧠 Exhaustive (10+ sources)</option>
                    </select>

                    <button
                        onClick={handleResearch}
                        disabled={isResearching || !query.trim() || !_hasHydrated || !token}
                        className={styles.researchBtn}
                    >
                        {isResearching ? '🔄 Researching...' : '🚀 Start Research'}
                    </button>
                </div>
            </div>

            {/* Progress */}
            {isResearching && (
                <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <p className={styles.statusText}>{statusMessage}</p>

                    <div className={styles.eventLog} ref={eventLogRef}>
                        {events.map((event, i) => (
                            <div key={i} className={styles.eventItem}>
                                <span className={styles.eventType}>{event.event_type}</span>
                                <span>{event.data.message || JSON.stringify(event.data).slice(0, 50)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && <div className={styles.error}>❌ {error}</div>}

            {/* Report */}
            {report && (
                <div className={styles.report} data-testid="research-complete">
                    <div className={styles.reportHeader}>
                        <h3>📋 Research Report</h3>
                        <div className={styles.reportMeta}>
                            <span>Confidence: {(report.overall_confidence * 100).toFixed(0)}%</span>
                            <span>Sources: {report.sources.length}</span>
                            <span>Duration: {report.duration_seconds?.toFixed(1)}s</span>
                        </div>
                    </div>

                    <div className={styles.reportBody}>
                        {report.detailed_findings.map((f, i) => (
                            <div key={i} className={styles.markdownBody}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {f.full_report}
                                </ReactMarkdown>
                            </div>
                        ))}
                    </div>

                    <div className={styles.reportSources}>
                        <h4>📚 Sources ({report.sources.length})</h4>
                        {report.sources.map((s, i) => (
                            <div key={i} className={styles.sourceCard} onClick={() => s.url && window.open(s.url, '_blank')} style={{ cursor: s.url ? 'pointer' : 'default' }}>
                                <strong>{s.source_name}</strong>
                                <span className={styles.relevanceBadge}>{(s.relevance_score * 100).toFixed(0)}% relevant</span>
                                <p>{s.content_snippet}</p>
                                {s.url && <div className="text-xs text-blue-500 mt-1 truncate">{s.url}</div>}
                            </div>
                        ))}
                    </div>

                    <div className={styles.followUps}>
                        <h4>🔮 Follow-up Questions</h4>
                        {report.follow_up_questions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setQuery(q);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={styles.followUpBtn}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
