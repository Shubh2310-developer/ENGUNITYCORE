'use client';

import React from 'react';
import { Mic2, CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare, Star } from 'lucide-react';
import styles from '@/app/(dashboard)/jobprep/jobprep.module.css';

interface InterviewTimelineProps {
  simulations: any[];
}

export const InterviewTimeline = ({ simulations }: InterviewTimelineProps) => {
  const latestSim = simulations.length > 0 ? simulations[simulations.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Simulation History</h2>
          <p className="text-slate-500">Track your performance across different interview styles</p>
        </div>
        {latestSim && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Star className="w-4 h-4 fill-blue-600" />
            <span className="text-sm font-bold">Latest: {latestSim.overall_score}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {simulations.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Mic2 size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No simulations recorded yet. Start a session to see your progress.</p>
          </div>
        ) : (
          simulations.slice().reverse().map((sim) => (
            <div key={sim.id} className={`${styles.card} group hover:border-blue-200 transition-all`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${sim.overall_score >= 70 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Mic2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {sim.simulation_type}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        sim.hiring_decision === 'hire' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {sim.hiring_decision || 'Evaluated'}
                      </span>
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(sim.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {sim.company_style || 'General Style'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</div>
                    <div className={`text-2xl font-black ${sim.overall_score >= 70 ? 'text-green-600' : 'text-blue-600'}`}>
                      {sim.overall_score}%
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-full transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {sim.strengths && sim.strengths.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Key Strengths
                    </span>
                    <ul className="space-y-1">
                      {sim.strengths.slice(0, 2).map((s: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Improvement Areas
                    </span>
                    <ul className="space-y-1">
                      {sim.weaknesses?.slice(0, 2).map((w: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600">• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
