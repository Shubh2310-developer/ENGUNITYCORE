'use client';

import React from 'react';
import { TrendingUp, Award, Target, Activity } from 'lucide-react';
import styles from '@/app/(dashboard)/jobprep/jobprep.module.css';

interface SkillTrendChartProps {
  skills: any[];
}

const MiniRadarChart = ({ data }: { data: number[] }) => {
  const size = 100;
  const displayData = data.length >= 3 ? data : [...data, ...Array(3 - data.length).fill(0)];

  const points = displayData.map((val, i) => {
    const angle = (Math.PI * 2 * i) / displayData.length - Math.PI / 2;
    const r = (val / 100) * 40;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      {displayData.map((_, i) => {
        const angle = (Math.PI * 2 * i) / displayData.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={50 + 40 * Math.cos(angle)}
            y2={50 + 40 * Math.sin(angle)}
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon
        points={points}
        fill="rgba(37, 99, 235, 0.15)"
        stroke="#2563eb"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const SkillTrendChart = ({ skills }: SkillTrendChartProps) => {
  const topSkills = skills.slice(0, 5);
  const averageLevel = skills.length > 0
    ? (skills.reduce((acc, s) => acc + s.current_level, 0) / skills.length).toFixed(1)
    : 0;

  return (
    <div className={styles.card}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Skill Progression</h3>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Level</div>
          <div className="text-xl font-black text-blue-600">{averageLevel}/5.0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <MiniRadarChart
            data={topSkills.length > 0 ? topSkills.map(s => (s.current_level / 5) * 100) : [60, 40, 70, 50, 80]}
          />
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Competencies</h4>
          {topSkills.map((skill, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">{skill.skill_name}</span>
                <span className="text-blue-600 font-bold">{skill.current_level}/5</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(skill.current_level / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {topSkills.length === 0 && (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              No skills added to track.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Artifacts</div>
          <div className="font-black text-slate-900">{skills.reduce((acc, s) => acc + (s.evidence_count || 0), 0)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gaps Identified</div>
          <div className="font-black text-red-500">{skills.filter(s => s.is_gap).length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Critical Skills</div>
          <div className="font-black text-amber-500">{skills.filter(s => s.is_critical).length}</div>
        </div>
      </div>
    </div>
  );
};
