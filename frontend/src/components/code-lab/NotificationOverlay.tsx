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
    info: 'bg-blue-500/10 border-blue-500/20',
    success: 'bg-primary/10 border-primary/20',
    error: 'bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="fixed bottom-12 right-6 z-50 animate-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${bgColors[notification.type]}`}>
        {icons[notification.type]}
        <span className="text-xs font-medium text-starlight-100">{notification.message}</span>
        <button
          onClick={() => setNotification(null)}
          className="ml-2 p-1 hover:bg-white/5 rounded-md transition-colors text-starlight-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
