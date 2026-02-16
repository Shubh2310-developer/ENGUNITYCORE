'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Target, Calendar, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/(dashboard)/jobprep/jobprep.module.css';
import { useJobPrepStore } from '@/stores/jobPrepStore';

interface RoleDetailDrawerProps {
  role: any;
  isOpen: boolean;
  onClose: () => void;
}

export const RoleDetailDrawer = ({ role, isOpen, onClose }: RoleDetailDrawerProps) => {
  const { fetchRoleCurriculum } = useJobPrepStore();
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum'>('overview');

  useEffect(() => {
    if (isOpen && role) {
      if (role.role_curriculum) {
        setCurriculum(role.role_curriculum);
      } else {
        handleLoadCurriculum();
      }
    }
  }, [isOpen, role]);

  const handleLoadCurriculum = async () => {
    setLoading(true);
    try {
      const data = await fetchRoleCurriculum(role.id);
      setCurriculum(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{role?.role_title}</h2>
                    <p className="text-slate-500">{role?.role_category}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'curriculum' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Curriculum
                </button>
              </div>

              {activeTab === 'overview' ? (
                <div className="space-y-6">
                  <div className={styles.card}>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Role Readiness
                    </h3>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-3xl font-black text-blue-600">{role?.readiness_score}%</span>
                      <span className="text-sm font-bold text-slate-400 uppercase">Target: 100%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${role?.readiness_score}%` }}
                        className="h-full bg-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Market Demand</span>
                      <span className="font-bold text-slate-900">{role?.market_demand || 'High'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Avg. Salary</span>
                      <span className="font-bold text-green-600">{role?.suggested_salary_range || '$120k - $160k'}</span>
                    </div>
                  </div>

                  {role?.typical_interview_rounds && (
                    <div>
                      <h3 className="font-bold text-slate-900 mb-4">Interview Roadmap</h3>
                      <div className="space-y-3">
                        {role.typical_interview_rounds.map((round: string, i: number) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {i + 1}
                            </div>
                            <span className="font-medium text-slate-700">{round}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p>Generating personalized curriculum...</p>
                    </div>
                  ) : curriculum.length > 0 ? (
                    <div className="space-y-6">
                      {curriculum.map((week: any, i: number) => (
                        <div key={i} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-8 last:pb-0">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Week {week.week}</span>
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> 7 Days
                            </span>
                          </div>
                          <h4 className="font-bold text-lg text-slate-900 mb-2">{week.theme}</h4>
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {week.topics?.map((topic: string, j: number) => (
                                <span key={j} className="text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-600">
                                  {topic}
                                </span>
                              ))}
                            </div>
                            <div className="pt-3 border-t border-slate-200/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Success Criteria</span>
                              <p className="text-sm text-slate-600 italic">"{week.success_criteria}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <button
                        onClick={handleLoadCurriculum}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate AI Curriculum
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
