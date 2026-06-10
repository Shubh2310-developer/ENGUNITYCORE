'use client';

import React from 'react';
import { ShieldCheck, Github, ExternalLink, Activity, MessageSquare, BarChart3, Star, Layers, X, Sparkles, Download } from 'lucide-react';
import styles from '@/app/(dashboard)/jobprep/jobprep.module.css';

interface ProjectImpactDashboardProps {
  projects: any[];
  onAnalyze: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onImportGithub: () => void;
  onAddProject: () => void;
}

export const ProjectImpactDashboard = ({
  projects,
  onAnalyze,
  onDelete,
  onImportGithub,
  onAddProject
}: ProjectImpactDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Proof</h2>
          <p className="text-slate-500">Showcase your technical impact through analyzed repositories</p>
        </div>
        <div className="flex gap-2">
          <button className={styles.btnSecondary} onClick={onImportGithub}>
            <Github size={16} /> Import GitHub
          </button>
          <button className={styles.btnPrimary} onClick={onAddProject}>
            <Star size={16} /> Add Impact Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="md:col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Layers size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No projects added yet. Import from GitHub to generate impact metrics.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className={`${styles.card} flex flex-col h-full group hover:border-blue-200 transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${project.github_url ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    {project.github_url ? <Github size={20} /> : <ShieldCheck size={20} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{project.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-medium">{project.project_type || 'Personal Project'}</span>
                      {project.is_featured && (
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">Featured</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(project.id)}
                  aria-label={`Delete project ${project.title}`}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {project.tech_stack?.slice(0, 5).map((s: string) => (
                  <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200/50">
                    {s}
                  </span>
                ))}
                {project.tech_stack?.length > 5 && (
                  <span className="text-[10px] text-slate-400 font-bold self-center">+{project.tech_stack.length - 5}</span>
                )}
              </div>

              {project.complexity_score !== null ? (
                <div className="mt-auto">
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                    <div className="text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Complexity</div>
                      <div className="text-sm font-black text-slate-900">{Math.round((project.complexity_score || 0) * 100)}%</div>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Innovation</div>
                      <div className="text-sm font-black text-slate-900">{Math.round((project.innovation_score || 0) * 100)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Value</div>
                      <div className="text-sm font-black text-slate-900">{Math.round((project.interview_value_score || 0) * 100)}%</div>
                    </div>
                  </div>

                  {project.talking_points && project.talking_points.length > 0 && (
                    <div className="space-y-2 mb-6 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare size={10} /> Interview Talking Points
                      </span>
                      {project.talking_points.slice(0, 2).map((tp: string, i: number) => (
                        <div key={i} className="text-[11px] text-slate-600 italic line-clamp-1">
                          "{tp}"
                        </div>
                      ))}
                    </div>
                  )}

                  {project.impact_metrics?.role_relevance && Object.keys(project.impact_metrics.role_relevance).length > 0 && (
                    <div className="mb-6">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Role Alignment</span>
                      <div className="space-y-2">
                        {Object.entries(project.impact_metrics.role_relevance).map(([role, score]: [string, any]) => (
                          <div key={role} className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${score * 100}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex-shrink-0 flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                      >
                        <Github size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => onAnalyze(project.id)}
                      className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Activity size={14} />
                    </button>
                    <button
                      className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                      title="Export Project Case Study"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto">
                  <button
                    onClick={() => onAnalyze(project.id)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Generate Impact Report
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
