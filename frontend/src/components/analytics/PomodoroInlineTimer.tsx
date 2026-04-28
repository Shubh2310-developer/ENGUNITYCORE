'use client';

import React, { memo, useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

interface PomodoroInlineTimerProps {
  focusMinutes: number;
  breakMinutes: number;
  onCompleted: () => void;
}

function PomodoroInlineTimer({ focusMinutes, breakMinutes, onCompleted }: PomodoroInlineTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsRemaining((value) => {
        if (value > 1) return value - 1;
        if (mode === 'focus') {
          setMode('break');
          return breakMinutes * 60;
        }
        setIsRunning(false);
        onCompleted();
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [breakMinutes, isRunning, mode, onCompleted]);

  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const seconds = (secondsRemaining % 60).toString().padStart(2, '0');

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <div>
        <p className="font-semibold">{mode === 'focus' ? 'Focus timer' : 'Break timer'}</p>
        <p className="font-mono text-lg font-bold">{minutes}:{seconds}</p>
      </div>
      <button
        type="button"
        onClick={() => setIsRunning((value) => !value)}
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isRunning ? 'Pause' : 'Resume'}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode('focus');
          setSecondsRemaining(focusMinutes * 60);
          setIsRunning(false);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 font-semibold text-blue-800 transition-colors hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
    </div>
  );
}

export default memo(PomodoroInlineTimer);
