'use client';

import React from 'react';
import { Target, Award, Briefcase, Mic2, ShieldAlert, Sparkles, Zap, ZapOff, Clock, TrendingUp } from 'lucide-react';
import styles from '@/app/(dashboard)/jobprep/jobprep.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  trend?: number;
}

const StatCard = ({ label, value, icon: Icon, trend }: StatCardProps) => (
  <div className={styles.statCard}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className={styles.statLabel}>{label}</div>
    <div className={styles.statValue}>{value}</div>
  </div>
);

interface JobPrepOverviewPanelProps {
  profile: any;
  skillsCount: number;
  rolesCount: number;
  simulationsCount: number;
  placementMode: boolean;
  timeLeft: number;
  onStartSession: () => void;
  onTogglePlacementMode: () => void;
}

export const JobPrepOverviewPanel = ({
  profile,
  skillsCount,
  rolesCount,
  simulationsCount,
  placementMode,
  timeLeft,
  onStartSession,
  onTogglePlacementMode
}: JobPrepOverviewPanelProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className={`rounded-2xl p-8 text-white relative overflow-hidden shadow-lg transition-colors duration-500 ${placementMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            {placementMode && <ShieldAlert className="text-red-400 animate-pulse" size={20} />}
            <h2 className="text-3xl font-bold">{placementMode ? 'Placement Mode Active' : 'Train the Way Interviews Actually Test You'}</h2>
          </div>
          <p className="text-blue-100 text-lg mb-6 leading-relaxed">
            {placementMode
              ? 'No hints. No pauses. Real-time evaluation against industry standards.'
              : 'Build provable skills, simulate real pressure, and enter interviews with confidence.'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={onStartSession}
              className={`${placementMode ? 'bg-red-600 hover:bg-red-700' : 'bg-white text-blue-600 hover:bg-blue-50'} px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm`}
            >
              {placementMode ? 'Start Evaluation' : 'Start Session'}
            </button>
            <button
              onClick={onTogglePlacementMode}
              className={`px-6 py-2.5 rounded-lg font-bold border transition-colors ${
                placementMode
                  ? 'border-white/20 hover:bg-white/10 text-white'
                  : 'border-blue-400 hover:bg-blue-500 text-white'
              }`}
            >
              {placementMode ? 'Exit Placement' : 'Enable Placement Mode'}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 opacity-10 pointer-events-none">
          <Sparkles className="w-full h-full" />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Ready Score" value={`${profile?.overall_readiness_score || 0}%`} icon={Target} />
        <StatCard label="Skills" value={skillsCount} icon={Award} />
        <StatCard label="Roles" value={rolesCount} icon={Briefcase} />
        <StatCard label="Simulations" value={simulationsCount} icon={Mic2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${styles.card} bg-gradient-to-br from-white to-blue-50/30`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Personalized AI Roadmap</h3>
              <p className="text-sm text-slate-500">Next recommended action based on your profile</p>
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
            <p className="text-slate-700 font-medium">
              Based on your target role as a Senior Frontend Engineer, focus on
              <span className="text-blue-600 font-bold ml-1">System Design</span>
              concepts to increase your readiness score by 15%.
            </p>
          </div>
        </div>

        {placementMode && (
          <div className={`${styles.card} border-red-100 bg-red-50/30`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Placement Timer</h3>
                <p className="text-sm text-slate-500">Evaluation session remaining time</p>
              </div>
            </div>
            <div className="text-4xl font-mono font-black text-red-600 tracking-wider">
              {formatTime(timeLeft)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
