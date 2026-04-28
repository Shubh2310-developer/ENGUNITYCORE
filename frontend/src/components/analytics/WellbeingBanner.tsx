'use client';

import React, { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Coffee, ShieldCheck, X } from 'lucide-react';
import WellbeingActionCard from '@/components/analytics/WellbeingActionCard';
import { wellbeingService, WellbeingCheck } from '@/services/wellbeing';

const PomodoroInlineTimer = lazy(() => import('@/components/analytics/PomodoroInlineTimer'));

interface WellbeingBannerProps {
  activeTab: string;
  datasetId: string | null;
  isDark?: boolean;
}

const statusIntervals: Record<WellbeingCheck['overall_status'], number> = {
  healthy: 30 * 60 * 1000,
  caution: 15 * 60 * 1000,
  concern: 10 * 60 * 1000,
};

function getDeviceAwareInterval(check: WellbeingCheck | null) {
  if (typeof navigator !== 'undefined') {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
      return 60 * 60 * 1000;
    }
  }
  return statusIntervals[check?.overall_status || 'healthy'];
}

function isWidgetEnabled() {
  return process.env.NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED !== 'false';
}

function normalizeTips(tips: string[]) {
  const fallbackTips = [
    'Take a 5-minute pause before the next analysis step.',
    'Pick one concrete next action and resume with a smaller scope.',
  ];
  const unique = Array.from(new Set([...(tips || []), ...fallbackTips])).filter(Boolean);
  return unique.slice(0, 5);
}

function WellbeingBanner({ activeTab, datasetId, isDark = false }: WellbeingBannerProps) {
  const [check, setCheck] = useState<WellbeingCheck | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const checkRef = useRef<WellbeingCheck | null>(null);
  const failuresRef = useRef(0);
  const viewedStatusRef = useRef<string | null>(null);

  const eventContext = useCallback(() => ({
    page: 'analytics',
    active_tab: activeTab,
    dataset_id: datasetId ? Number(datasetId) || datasetId : undefined,
    stress_score_snapshot: check?.stress_score,
    status: check?.overall_status,
  }), [activeTab, check?.overall_status, check?.stress_score, datasetId]);

  const loadCheck = useCallback(async (signal?: AbortSignal) => {
    if (!isWidgetEnabled() || (typeof document !== 'undefined' && document.visibilityState !== 'visible')) return undefined;
    try {
      const nextCheck = await wellbeingService.checkWellbeing('24h', { signal });
      failuresRef.current = 0;
      checkRef.current = nextCheck;
      setCheck(nextCheck);
      if (nextCheck.overall_status !== 'healthy' && viewedStatusRef.current !== nextCheck.overall_status) {
        viewedStatusRef.current = nextCheck.overall_status;
        void wellbeingService.logWellbeingEvent({
          event_type: 'viewed',
          context: {
            page: 'analytics',
            active_tab: activeTab,
            dataset_id: datasetId ? Number(datasetId) || datasetId : undefined,
            stress_score_snapshot: nextCheck.stress_score,
            status: nextCheck.overall_status,
          },
        });
      }
      return nextCheck;
    } catch (error) {
      if (signal?.aborted) return undefined;
      failuresRef.current += 1;
      if (failuresRef.current >= 2) {
        checkRef.current = null;
        setCheck(null);
      }
      return undefined;
    }
  }, [activeTab, datasetId]);

  useEffect(() => {
    if (!isWidgetEnabled()) return;
    const controller = new AbortController();
    let timer: number | undefined;

    const schedule = () => {
      window.clearTimeout(timer);
      if (document.visibilityState !== 'visible') return;
      const interval = getDeviceAwareInterval(checkRef.current) * Math.min(failuresRef.current + 1, 4);
      timer = window.setTimeout(async () => {
        await loadCheck(controller.signal);
        schedule();
      }, interval);
    };

    void loadCheck(controller.signal).finally(schedule);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadCheck(controller.signal);
      }
      schedule();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadCheck]);

  const logAction = useCallback((event_type: 'dismissed' | 'action_clicked' | 'break_started' | 'pomodoro_completed') => {
    void wellbeingService.logWellbeingEvent({ event_type, context: eventContext() });
  }, [eventContext]);

  const startPomodoroReset = useCallback(() => {
    setShowTimer(true);
    logAction('break_started');
    void wellbeingService.startPomodoro({
      focus_minutes: 25,
      break_minutes: checkRef.current?.intervention?.duration || 5,
      rounds: 1,
      topic: 'Analytics reset',
    });
  }, [logAction]);

  if (!isWidgetEnabled() || dismissed || !check || check.overall_status === 'healthy') {
    return null;
  }

  const cardCheck: WellbeingCheck = {
    ...check,
    tips: normalizeTips(check.tips),
  };

  const isConcern = check.overall_status === 'concern';
  const accent = isConcern ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-blue-200 bg-blue-50 text-blue-950';

  return (
    <section aria-live="polite" className={`border-b px-6 py-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
      <div className={`mx-auto max-w-screen-2xl rounded-2xl border p-4 ${accent}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/70 p-2">
              {isConcern ? <Coffee className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black uppercase tracking-[0.18em]">Wellbeing support</p>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold capitalize">{check.overall_status}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{check.intervention?.message || check.message}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startPomodoroReset}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              <Activity className="h-4 w-4" />
              Start reset
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded((value) => !value);
                logAction('action_clicked');
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm font-semibold underline decoration-dotted underline-offset-4 hover:opacity-80"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Tips
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                logAction('dismissed');
              }}
              aria-label="Dismiss wellbeing banner"
              className="rounded-xl bg-white/75 p-2 transition-colors hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <WellbeingActionCard
            check={cardCheck}
            isDark={isDark}
            onStartBreak={startPomodoroReset}
            onDismiss={() => {
              setDismissed(true);
              logAction('dismissed');
            }}
          />
        )}

        {showTimer && (
          <Suspense fallback={<div className="mt-3 text-sm font-semibold">Loading timer...</div>}>
            <PomodoroInlineTimer
              focusMinutes={25}
              breakMinutes={check.intervention?.duration || 5}
              onCompleted={() => logAction('pomodoro_completed')}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
}

export default memo(WellbeingBanner);
