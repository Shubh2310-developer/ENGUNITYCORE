'use client';

import React from 'react';
import { Info, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';

export const NotificationOverlay = () => {
  const { notification, setNotification } = useCodeStore();

  if (!notification) return null;

  const icons = {
    info: <Info className="w-4 h-4 text-blue-400" />,
    success: <CheckCircle2 className="w-4 h-4 text-primary" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
  };

  const bgColors = {
    info: 'bg-white border-blue-200 text-blue-800 shadow-blue-500/10',
    success: 'bg-white border-emerald-200 text-emerald-800 shadow-emerald-500/10',
    error: 'bg-white border-red-200 text-red-800 shadow-red-500/10',
  };

  return (
    <div className="fixed bottom-12 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl ${bgColors[notification.type]}`}>
        <div className="p-1.5 rounded-lg bg-current/5">
          {icons[notification.type]}
        </div>
        <span className="text-[13px] font-bold tracking-tight">{notification.message}</span>
        <button
          onClick={() => setNotification(null)}
          className="ml-4 p-1 hover:bg-black/5 rounded-lg transition-colors text-[#64748B] active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
