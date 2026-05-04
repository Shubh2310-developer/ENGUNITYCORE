'use client';

import React, { memo } from 'react';
import { CheckCircle2, Coffee, X } from 'lucide-react';
import type { WellbeingCheck } from '@/services/wellbeing';

interface WellbeingActionCardProps {
  check: WellbeingCheck;
  isDark?: boolean;
  onStartBreak: () => void;
  onDismiss: () => void;
}

function WellbeingActionCard({ check, isDark = false, onStartBreak, onDismiss }: WellbeingActionCardProps) {
  return (
    <div className={`mt-3 rounded-2xl border p-4 shadow-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold">Support options</p>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{check.intervention?.tip || 'Pick one small reset before continuing.'}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss wellbeing support"
          className={`rounded-lg p-1 transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {check.tips.slice(0, 5).map((tip, i) => (
          <li key={`tip-${tip}-${i}`} className={`flex gap-2 rounded-xl px-3 py-2 text-sm ${isDark ? 'bg-slate-700/60 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStartBreak}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
      >
        <Coffee className="h-4 w-4" />
        Start a short reset
      </button>
    </div>
  );
}

export default memo(WellbeingActionCard);
