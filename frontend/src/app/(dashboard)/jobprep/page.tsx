'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Target, GraduationCap, Award, ShieldCheck,
  Mic2, Compass, TrendingUp, Zap, Sparkles, Brain,
  Search, CheckCircle, AlertTriangle, ChevronRight,
  Plus, FileText, Github, BarChart3, Activity, Users,
  MessageSquare, LayoutDashboard, Settings, Info,
  ExternalLink, ArrowUpRight, Clock, Star, Play,
  Code2, Terminal, Layers, Globe, Database, Cpu,
  Monitor, ShieldAlert, ZapOff, ArrowLeft, X, Download
} from 'lucide-react';
import styles from './jobprep.module.css';
import { useJobPrepStore } from '@/stores/jobPrepStore';
import { Modal } from '@/components/shared/Modal';
import NotificationSystem, { useNotifications } from '@/components/shared/NotificationSystem';
import { exportService } from '@/services/export';

// --- Lazy Loaded Components ---
const JobPrepOverviewPanel = dynamic(() => import('@/components/jobprep/JobPrepOverviewPanel').then(m => m.JobPrepOverviewPanel), {
  loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-2xl" />
});

const RoleDetailDrawer = dynamic(() => import('@/components/jobprep/RoleDetailDrawer').then(m => m.RoleDetailDrawer));

const SkillTrendChart = dynamic(() => import('@/components/jobprep/SkillTrendChart').then(m => m.SkillTrendChart), {
  loading: () => <div className="animate-pulse bg-slate-100 h-64 rounded-2xl" />
});

const InterviewTimeline = dynamic(() => import('@/components/jobprep/InterviewTimeline').then(m => m.InterviewTimeline), {
  loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-2xl" />
});

const ProjectImpactDashboard = dynamic(() => import('@/components/jobprep/ProjectImpactDashboard').then(m => m.ProjectImpactDashboard), {
  loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-2xl" />
});

const PracticeArena = dynamic(() => import('@/components/jobprep/PracticeArena').then(m => m.PracticeArena), {
  loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-2xl" />
});

const InterviewSimulator = dynamic(() => import('@/components/jobprep/InterviewSimulator').then(m => m.InterviewSimulator), {
  loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-2xl" />
});

// --- Visual Components ---

const RadarChart = ({ size = 160, data = [80, 70, 90, 60, 75] }: { size?: number, data?: number[] }) => {
  // Ensure we have at least 3 points for a radar chart, or it looks weird
  const displayData = data.length >= 3 ? data : [...data, ...Array(3 - data.length).fill(0)];

  const points = displayData.map((val, i) => {
    const angle = (Math.PI * 2 * i) / displayData.length - Math.PI / 2;
    const r = (val / 100) * 45;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      {displayData.map((_, i) => {
        const angle = (Math.PI * 2 * i) / displayData.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={50 + 45 * Math.cos(angle)}
            y2={50 + 45 * Math.sin(angle)}
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon
        points={points}
        fill="rgba(37, 99, 235, 0.2)"
        stroke="#2563eb"
        strokeWidth="2"
      />
    </svg>
  );
};

const LineChart = ({ data = [40, 45, 48, 30, 25, 10] }: { data?: number[] }) => {
  if (!data || data.length === 0) return null;

  const width = 200;
  const height = 60;
  const maxVal = 100;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - (val / maxVal) * height;
    return { x, y };
  });

  const d = points.reduce((acc, point, i) => {
    if (i === 0) return `M${point.x},${point.y}`;
    // Simple cubic bezier smoothing
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    return `${acc} C${cp1x},${prev.y} ${cp1x},${point.y} ${point.x},${point.y}`;
  }, '');

  const areaD = `${d} L${width},${height} L0,${height} Z`;

  return (
    <svg width="100%" height="100" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path
        d={d}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={areaD}
        fill="url(#gradient)"
        opacity="0.1"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const StatCard = ({ label, value, icon: Icon, trend }: any) => (
  <div className={styles.statCard}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className={styles.statLabel}>{label}</div>
    <div className={styles.statValue}>{value}</div>
  </div>
);

const JobPrepHub = () => {
  const {
    profile,
    targetRoles,
    skills,
    projects,
    simulations,
    isLoading,
    fetchProfile,
    fetchTargetRoles,
    fetchSkills,
    fetchProjects,
    fetchSimulations,
    createProfile,
    updateProfile,
    addTargetRole,
    deleteTargetRole,
    addSkill,
    deleteSkill,
    createProject,
    deleteProject,
    analyzeProject,
    fetchSkillGaps,
    fetchReadinessHistory
  } = useJobPrepStore();

  // Notification system
  const { notifications, dismissNotification, success, error, info, warning } = useNotifications();

  const [activeTab, setActiveTab] = useState('overview');
  const [placementMode, setPlacementMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour for Placement Mode
  const [showSimulator, setShowSimulator] = useState(false);
  const [showArena, setShowArena] = useState(false);

  // Analysis state
  const [skillGaps, setSkillGaps] = useState<any[]>([]);
  const [readinessHistory, setReadinessHistory] = useState<any[]>([]);
  const [readinessForecast, setReadinessForecast] = useState<any>(null);

  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedSkillForEvidence, setSelectedSkillForEvidence] = useState<any>(null);
  const [evidenceForm, setEvidenceForm] = useState({ title: '', evidence_type: 'project', description: '', source_url: '' });

  // Form states
  const [profileForm, setProfileForm] = useState({
    current_status: 'preparing',
    target_timeline: '3 months',
    experience_level: 'mid',
    industry_focus: '',
    salary_expectation_min: 0,
    salary_expectation_max: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    learning_style: 'visual',
    preferred_companies: [] as string[],
    notifications_enabled: true
  });
  const [roleForm, setRoleForm] = useState({ role_title: '', role_category: '', seniority_level: 'mid' });
  const [skillForm, setSkillForm] = useState({ skill_name: '', skill_category: '', target_level: 3 });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tech_stack: '' });
  const [githubForm, setGithubForm] = useState({ owner: '', repo: '' });

  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<any>(null);

  useEffect(() => {
    const initializeJobPrep = async () => {
      try {
        // Parallel load sequence for performance
        await Promise.all([
          fetchProfile(),
          fetchTargetRoles(),
          fetchSkills(),
          fetchProjects(),
          fetchSimulations()
        ]);

        const [gaps, history, forecast] = await Promise.all([
          fetchSkillGaps(),
          fetchReadinessHistory(),
          useJobPrepStore.getState().fetchReadinessForecast()
        ]);

        setSkillGaps(gaps);
        setReadinessHistory(history);
        setReadinessForecast(forecast);
      } catch (error) {
        console.error('Failed to initialize JobPrep:', error);
      }
    };

    initializeJobPrep();
  }, [fetchProfile, fetchTargetRoles, fetchSkills, fetchProjects, fetchSimulations, fetchSkillGaps, fetchReadinessHistory]);

  useEffect(() => {
    if (profile) {
      const profileExtras = profile as Record<string, any>;
      setProfileForm({
        current_status: profile.current_status || 'preparing',
        target_timeline: profile.target_timeline || '3 months',
        experience_level: profile.experience_level || 'mid',
        industry_focus: profileExtras.industry_focus || '',
        salary_expectation_min: profileExtras.salary_expectation_min || 0,
        salary_expectation_max: profileExtras.salary_expectation_max || 0,
        timezone: profileExtras.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        learning_style: profileExtras.learning_style || 'visual',
        preferred_companies: profile.preferred_companies || [],
        notifications_enabled: profile.notifications_enabled !== undefined ? profile.notifications_enabled : true
      });
    }
  }, [profile]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (placementMode && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [placementMode, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'overview', label: 'Hub', icon: LayoutDashboard },
    { id: 'roles', label: 'Role Intelligence', icon: Compass },
    { id: 'skills', label: 'Skill Matrix', icon: Target },
    { id: 'practice', label: 'Practice Arena', icon: Activity },
    { id: 'simulator', label: 'Interview Simulator', icon: Mic2 },
    { id: 'projects', label: 'Project Proof', icon: ShieldCheck },
    { id: 'tracker', label: 'Readiness Tracker', icon: TrendingUp },
  ];

  const handleTogglePlacementMode = async () => {
    const newMode = !placementMode;
    setPlacementMode(newMode);
    await updateProfile({ placement_mode_enabled: newMode });
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTargetRole(roleForm);
      setIsRoleModalOpen(false);
      setRoleForm({ role_title: '', role_category: '', seniority_level: 'mid' });
      // Refresh gaps
      const gaps = await fetchSkillGaps();
      setSkillGaps(gaps);
      success('Role Added', `${roleForm.role_title} has been added to your target roles.`);
    } catch (err) {
      error('Failed to Add Role', 'Please try again or check your connection.');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSkill(skillForm);
      setIsSkillModalOpen(false);
      setSkillForm({ skill_name: '', skill_category: '', target_level: 3 });
      // Refresh gaps
      const gaps = await fetchSkillGaps();
      setSkillGaps(gaps);
      success('Skill Added', `${skillForm.skill_name} has been added to your skill matrix.`);
    } catch (err) {
      error('Failed to Add Skill', 'Please try again or check your connection.');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject({
          ...projectForm,
          tech_stack: projectForm.tech_stack.split(',').map(s => s.trim())
      });
      setIsProjectModalOpen(false);
      setProjectForm({ title: '', description: '', tech_stack: '' });
      success('Project Added', `${projectForm.title} has been added to your portfolio.`);
    } catch (err) {
      error('Failed to Add Project', 'Please try again or check your connection.');
    }
  };

  // Export functionality
  const handleExportProfile = async (format: 'pdf' | 'json' | 'markdown' | 'html') => {
    try {
      info('Generating Export', 'Please wait while we prepare your profile...');
      
      const exportData = {
        profile,
        roles: targetRoles,
        skills,
        projects,
        simulations,
      };

      const content = await exportService.exportData(exportData, {
        format,
        includeAnalysis: true,
        includeSimulations: true,
        templateStyle: 'professional',
      });

      const filename = `jobprep-profile-${new Date().toISOString().split('T')[0]}.${format}`;
      const mimeTypes = {
        pdf: 'application/pdf',
        json: 'application/json',
        markdown: 'text/markdown',
        html: 'text/html',
      };

      exportService.downloadFile(content, filename, mimeTypes[format]);
      success('Export Complete', `Your profile has been exported as ${format.toUpperCase()}.`);
    } catch (err) {
      error('Export Failed', 'Could not export profile. Please try again.');
      console.error('Export error:', err);
    }
  };

  const handleGithubImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const store = useJobPrepStore.getState();
    await store.importGithubRepo(githubForm.owner, githubForm.repo);
    setIsGithubModalOpen(false);
    setGithubForm({ owner: '', repo: '' });
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillForEvidence) return;
    const store = useJobPrepStore.getState();
    await store.addSkillEvidence(selectedSkillForEvidence.id, evidenceForm);
    setSelectedSkillForEvidence(null);
    setEvidenceForm({ title: '', evidence_type: 'project', description: '', source_url: '' });
  };

  const handleOnboarding = async () => {
    await createProfile(profileForm);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setIsSettingsModalOpen(false);
      success('Profile Updated', 'Your career preferences have been saved.');
    } catch (err) {
      error('Update Failed', 'Could not update profile settings.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
                <GraduationCap size={40} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Career Readiness Onboarding</h2>
                <p className="text-slate-500">Configure your intent to unlock personalized AI intelligence.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Current Status</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={profileForm.current_status}
                    onChange={e => setProfileForm({...profileForm, current_status: e.target.value})}
                  >
                    <option value="preparing">Preparing (Not active yet)</option>
                    <option value="active">Actively Interviewing</option>
                    <option value="offers">Evaluating Offers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Timeline</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="e.g. 3 months"
                    value={profileForm.target_timeline}
                    onChange={e => setProfileForm({...profileForm, target_timeline: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Industry Focus</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="e.g. Fintech, AI, Healthcare"
                    value={profileForm.industry_focus}
                    onChange={e => setProfileForm({...profileForm, industry_focus: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Experience Level</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={profileForm.experience_level}
                    onChange={e => setProfileForm({...profileForm, experience_level: e.target.value})}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="staff">Staff/Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Learning Style</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={profileForm.learning_style}
                    onChange={e => setProfileForm({...profileForm, learning_style: e.target.value})}
                  >
                    <option value="visual">Visual (Charts & Diagrams)</option>
                    <option value="practical">Practical (Hands-on Practice)</option>
                    <option value="theoretical">Theoretical (Deep Dives)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Salary Expectations (Min)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    value={profileForm.salary_expectation_min}
                    onChange={e => setProfileForm({...profileForm, salary_expectation_min: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleOnboarding}
              className={`${styles.btnPrimary} w-full justify-center py-4 text-lg font-bold shadow-lg shadow-blue-200`}
            >
              Initialize My Career Hub
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <JobPrepOverviewPanel
            profile={profile}
            skillsCount={skills.length}
            rolesCount={targetRoles.length}
            simulationsCount={simulations.length}
            placementMode={placementMode}
            timeLeft={timeLeft}
            onStartSession={() => {
              setActiveTab('simulator');
              setShowSimulator(true);
            }}
            onTogglePlacementMode={handleTogglePlacementMode}
          />
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Target Roles</h2>
              <button className={styles.btnSecondary} onClick={() => setIsRoleModalOpen(true)}>
                <Plus size={16} /> Add Role
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {targetRoles.map(role => (
                <div key={role.id} className={styles.card}>
                  <div className="flex justify-between items-start">
                    <div className="cursor-pointer" onClick={() => setSelectedRoleForDetail(role)}>
                      <h3 className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">{role.role_title}</h3>
                      <p className="text-slate-500">{role.role_category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {role.is_primary && <span className={styles.badgeGreen}>Primary</span>}
                      <button
                        onClick={() => deleteTargetRole(role.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${role.readiness_score}%` }}></div>
                    </div>
                    <span className="font-bold text-slate-900">{role.readiness_score}%</span>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => useJobPrepStore.getState().analyzeRole(role.id)}
                      className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <Sparkles size={14} className="text-blue-600" />
                      AI Analysis
                    </button>
                    <button
                      onClick={() => setSelectedRoleForDetail(role)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <RoleDetailDrawer
              role={selectedRoleForDetail}
              isOpen={!!selectedRoleForDetail}
              onClose={() => setSelectedRoleForDetail(null)}
            />
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-8">
            <SkillTrendChart skills={skills} />

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Skill Matrix</h2>
              <button className={styles.btnSecondary} onClick={() => setIsSkillModalOpen(true)}>
                <Plus size={16} /> Add Skill
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map(skill => (
                <div key={skill.id} className={styles.card}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{skill.skill_name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Level {skill.current_level}/5</span>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="p-1 text-slate-400 hover:text-red-600 border-none bg-transparent cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{skill.skill_category}</p>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < skill.current_level ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>Evidence: {skill.evidence_count} Artifacts</span>
                  </div>

                  <button
                    onClick={async () => {
                      const evidence = await useJobPrepStore.getState().fetchSkillEvidence(skill.id);
                      setSelectedSkillForEvidence({ ...skill, artifacts: evidence });
                    }}
                    className="w-full py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Manage Evidence
                  </button>
                </div>
              ))}
            </div>
            {selectedSkillForEvidence && (
               <div className="mt-8 p-6 bg-white rounded-2xl border border-blue-200 shadow-sm relative">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Evidence for {selectedSkillForEvidence.skill_name}</h3>
                      <p className="text-xs text-slate-500">Provide proof of your competence through projects, certifications, or work experience.</p>
                    </div>
                    <button onClick={() => setSelectedSkillForEvidence(null)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"><X size={20}/></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Existing Artifacts</h4>
                      {selectedSkillForEvidence.artifacts?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedSkillForEvidence.artifacts.map((art: any) => (
                            <div key={art.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900 truncate">{art.title}</div>
                                <div className="text-[10px] text-slate-500 uppercase flex items-center gap-2">
                                  {art.evidence_type.replace('_', ' ')}
                                  {art.verified && (
                                    <span className="bg-green-100 text-green-700 px-1 rounded flex items-center gap-0.5 text-[8px] font-black">
                                      <ShieldCheck size={8} /> VERIFIED
                                    </span>
                                  )}
                                </div>
                                {art.quality_score > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-green-500" style={{ width: `${art.quality_score * 100}%` }} />
                                    </div>
                                    <span className="text-[9px] font-bold text-green-600">AI Quality: {Math.round(art.quality_score * 100)}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => useJobPrepStore.getState().evaluateEvidence(art.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="AI Quality Evaluation"
                                >
                                  <Sparkles size={14} />
                                </button>
                                {art.source_url && (
                                  <a href={art.source_url} target="_blank" rel="noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                                <button
                                  onClick={async () => {
                                    await useJobPrepStore.getState().deleteSkillEvidence(art.id);
                                    // Refresh local artifacts list
                                    const evidence = await useJobPrepStore.getState().fetchSkillEvidence(selectedSkillForEvidence.id);
                                    setSelectedSkillForEvidence({ ...selectedSkillForEvidence, artifacts: evidence });
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-slate-400 text-sm italic">
                          No artifacts yet.
                        </div>
                      )}
                    </div>

                    <div>
                      <form onSubmit={handleAddEvidence} className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
                        <h4 className="font-bold text-xs text-blue-800 uppercase tracking-widest">Quick Add Evidence</h4>
                        <div>
                          <input
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                            placeholder="Title (e.g. Portfolio Project)"
                            value={evidenceForm.title}
                            onChange={e => setEvidenceForm({...evidenceForm, title: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <select
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                            value={evidenceForm.evidence_type}
                            onChange={e => setEvidenceForm({...evidenceForm, evidence_type: e.target.value})}
                          >
                            <option value="project">Project</option>
                            <option value="certification">Certification</option>
                            <option value="assessment">Assessment</option>
                            <option value="work_history">Work History</option>
                          </select>
                        </div>
                        <div>
                          <input
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
                            placeholder="Source URL (Optional)"
                            value={evidenceForm.source_url}
                            onChange={e => setEvidenceForm({...evidenceForm, source_url: e.target.value})}
                          />
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                          Confirm Artifact
                        </button>
                      </form>
                    </div>
                  </div>
               </div>
            )}
          </div>
        );

      case 'practice':
        return <PracticeArena />;

      case 'simulator':
        if (showSimulator && targetRoles.length > 0) {
          return (
            <InterviewSimulator
              roleId={targetRoles.find(r => r.is_primary)?.id || targetRoles[0].id}
              placementMode={placementMode}
              onComplete={() => {
                setShowSimulator(false);
                fetchSimulations();
              }}
            />
          );
        }
        return (
          <InterviewTimeline simulations={simulations} />
        );

      case 'projects':
        return (
          <ProjectImpactDashboard
            projects={projects}
            onAnalyze={analyzeProject}
            onDelete={deleteProject}
            onImportGithub={() => setIsGithubModalOpen(true)}
            onAddProject={() => setIsProjectModalOpen(true)}
          />
        );

      case 'tracker':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Readiness Tracker</h2>
                <p className="text-slate-600">Honest assessment of your standing for target roles.</p>
              </div>
              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Last updated: {profile.last_assessment_date ? new Date(profile.last_assessment_date).toLocaleString() : 'Never'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className={`${styles.card} flex flex-col items-center text-center py-10 shadow-sm border-blue-100`}>
                  <div className="relative w-32 h-32 mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={339.3}
                        strokeDashoffset={339.3 - (339.3 * profile.overall_readiness_score) / 100}
                        className="text-blue-600"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-950">{profile.overall_readiness_score}</span>
                      <span className="text-[10px] text-slate-500 font-bold">READY</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-2">
                    {profile.overall_readiness_score > 80 ? 'Highly Ready' : profile.overall_readiness_score > 50 ? 'Partially Ready' : 'Early Stage'}
                  </h3>
                  <p className="text-sm text-slate-600 px-4 leading-relaxed">
                    Based on your skills and evidence, you are currently prepared for {profile.overall_readiness_score > 70 ? 'mid-to-senior' : profile.overall_readiness_score > 40 ? 'entry-to-mid' : 'internship'} level roles.
                  </p>
                </div>

                <div className={styles.card}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-blue-500" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Readiness Forecast</h4>
                  </div>
                  {readinessForecast ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-500 font-medium">30-Day Projection</span>
                        <span className="text-2xl font-black text-blue-600">{readinessForecast.projected_score_30d}%</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Your current velocity is <span className="font-bold">{readinessForecast.velocity} points/day</span>.
                          At this rate, you'll be highly ready in approximately
                          <span className="font-bold"> {Math.ceil((100 - readinessForecast.current_score) / (readinessForecast.velocity || 1))} days</span>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-slate-400 text-xs italic">
                      Forecast unavailable. Keep training to generate data.
                    </div>
                  )}
                </div>

                <div className={styles.card}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Skill Gaps</h4>
                  </div>
                  {skillGaps.length === 0 ? (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                       <CheckCircle size={20} className="mx-auto text-green-500 mb-2" />
                       <p className="text-xs text-green-700 font-medium">No critical gaps detected!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {skillGaps.map((gap, i) => (
                        <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                           <div className="flex justify-between items-start mb-1">
                             <span className="text-sm font-bold text-red-700">{gap.skill}</span>
                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${gap.type === 'missing' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                               {gap.type.toUpperCase()}
                             </span>
                           </div>
                           <p className="text-[10px] text-red-600 font-medium">Required for: {gap.role}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className={styles.card}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900">Performance Trajectory</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Readiness</div>
                    </div>
                  </div>
                  <div className="h-48 bg-slate-50 rounded-xl p-6 border border-slate-100 relative">
                    <LineChart
                      data={readinessHistory.length > 0
                        ? readinessHistory.map(h => h.overall_readiness_score)
                        : [20, 35, 30, 50, 45, 60]}
                    />
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                      <span>Start</span>
                      <span>Last Week</span>
                      <span>Current</span>
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className="font-bold text-lg text-slate-900 mb-6">Assessment History</h3>
                  {readinessHistory.length === 0 ? (
                    <div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm italic border border-slate-100">
                      Take assessments to see your progress over time.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {readinessHistory.slice().reverse().map((record, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${record.overall_readiness_score > 70 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                              <TrendingUp size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">Score: {record.overall_readiness_score}%</div>
                              <div className="text-xs text-slate-400">{new Date(record.assessed_at).toLocaleDateString()} at {new Date(record.assessed_at).toLocaleTimeString()}</div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${record.overall_readiness_score > 70 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {record.overall_readiness_score > 70 ? 'Level Up' : 'Evolving'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-8 bg-slate-950 rounded-3xl text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-4">
                       <div className="p-1.5 bg-blue-600 rounded-lg">
                         <Zap className="text-yellow-400" size={16} />
                       </div>
                       <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Personalized AI Roadmap</span>
                     </div>
                     <p className="text-xl font-bold leading-tight mb-6 max-w-md">
                       {skillGaps.length > 0
                         ? `Master ${skillGaps[0].skill} to unlock ${skillGaps[0].role} readiness.`
                         : "You've addressed all critical gaps! Time for a high-stakes simulation."}
                     </p>
                     <button
                        onClick={() => setActiveTab(skillGaps.length > 0 ? 'skills' : 'simulator')}
                        className="px-8 py-3 bg-white text-slate-950 hover:bg-blue-50 rounded-xl text-sm font-black transition-all border-none cursor-pointer flex items-center gap-2 group shadow-xl shadow-blue-900/20"
                     >
                        {skillGaps.length > 0 ? 'Fix Skill Gaps' : 'Take Final Assessment'}
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
                  <Brain size={240} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
                  <Sparkles size={120} className="absolute right-10 top-0 text-white/5" />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="py-20 text-center text-slate-500 font-medium">This module is currently in development.</div>;
    }
  };

  return (
    <div className={`${styles['jobprep-theme']} ${placementMode ? styles.placementMode : ''}`}>
      <header className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <div className={styles.topNavLogo}>
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className={styles.topNavTitle}>Job Prep</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-6">
            <span className={styles.topNavLink}>Roadmap</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border-none bg-transparent cursor-pointer"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className={styles.topNavRight}>
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
            <button
              onClick={() => handleExportProfile('pdf')}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border-none bg-transparent cursor-pointer"
              title="Export PDF Resume"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border-none bg-transparent cursor-pointer"
              title="Career Settings"
            >
              <Settings size={20} />
            </button>
          </div>
          {placementMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-mono font-bold animate-pulse border border-red-100">
              <Clock size={16} /> {formatTime(timeLeft)}
            </div>
          )}
          {profile && (
             <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center gap-2">
              <TrendingUp size={16} /> {profile.overall_readiness_score}% Ready
            </div>
          )}
          <button
            onClick={handleTogglePlacementMode}
            className={`${styles.btnPrimary} ${placementMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {placementMode ? <ZapOff size={16} /> : <Zap size={16} />}
            {placementMode ? 'Exit Placement' : 'Placement Mode'}
          </button>
        </div>
      </header>

      <nav className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setShowSimulator(false);
              setShowArena(false);
            }}
            className={`${styles.tabItem} ${activeTab === tab.id ? styles.active : ''}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className={styles.mainContent}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {profile && (
            <div className={`${styles.aiAssistant} ${placementMode ? 'border-red-200 bg-red-50/50' : ''}`}>
              <div className={`${styles.aiAssistantIcon} ${placementMode ? 'bg-red-100' : ''}`}>
                {placementMode ? <ShieldAlert className="text-red-600" size={20} /> : <Sparkles size={20} />}
              </div>
              <div className={styles.aiAssistantContent}>
                <h4 className={placementMode ? 'text-red-900' : ''}>
                  {placementMode ? 'Placement Evaluation Active' : 'Career Acceleration Insight'}
                </h4>
                <p className={placementMode ? 'text-red-800/80' : ''}>
                  {placementMode
                    ? 'Your performance is being benchmarked against industry rubrics. No external help is permitted.'
                    : 'Focus on System Design concepts to increase your readiness score by 15%.'}
                </p>
              </div>
            </div>
          )}

          {renderContent()}
        </motion.div>
      </main>

      {/* Modals */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Add Target Role">
        <form onSubmit={handleAddRole} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Role Title</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. Senior Frontend Engineer"
              value={roleForm.role_title}
              onChange={e => setRoleForm({...roleForm, role_title: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. Engineering"
              value={roleForm.role_category}
              onChange={e => setRoleForm({...roleForm, role_category: e.target.value})}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary + " w-full justify-center py-2 mt-2"}>Add Role</button>
        </form>
      </Modal>

      <Modal isOpen={isSkillModalOpen} onClose={() => setIsSkillModalOpen(false)} title="Add Skill">
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Skill Name</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. React"
              value={skillForm.skill_name}
              onChange={e => setSkillForm({...skillForm, skill_name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. Frontend"
              value={skillForm.skill_category}
              onChange={e => setSkillForm({...skillForm, skill_category: e.target.value})}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary + " w-full justify-center py-2 mt-2"}>Add Skill</button>
        </form>
      </Modal>

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Add Project">
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Project Title</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. AI Portfolio"
              value={projectForm.title}
              onChange={e => setProjectForm({...projectForm, title: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="Short summary..."
              value={projectForm.description}
              onChange={e => setProjectForm({...projectForm, description: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tech Stack (comma separated)</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="React, FastAPI, PostgreSQL"
              value={projectForm.tech_stack}
              onChange={e => setProjectForm({...projectForm, tech_stack: e.target.value})}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary + " w-full justify-center py-2 mt-2"}>Add Project</button>
        </form>
      </Modal>

      <Modal isOpen={isGithubModalOpen} onClose={() => setIsGithubModalOpen(false)} title="Import GitHub Repository">
        <form onSubmit={handleGithubImport} className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-3 mb-2">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-700 leading-relaxed">
              We'll fetch repository details and perform an AI deep-dive analysis of your code to generate interview talking points.
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Owner</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. facebook"
              value={githubForm.owner}
              onChange={e => setGithubForm({...githubForm, owner: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Repository Name</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="e.g. react"
              value={githubForm.repo}
              onChange={e => setGithubForm({...githubForm, repo: e.target.value})}
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary + " w-full justify-center py-2 mt-2"}>
            <Github size={18} /> Import & Analyze
          </button>
        </form>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Career Profile Settings">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select
                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={profileForm.current_status}
                onChange={e => setProfileForm({...profileForm, current_status: e.target.value})}
              >
                <option value="preparing">Preparing</option>
                <option value="active">Searching</option>
                <option value="offers">Offer Stage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Experience</label>
              <select
                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={profileForm.experience_level}
                onChange={e => setProfileForm({...profileForm, experience_level: e.target.value})}
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Industry Focus</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg"
              value={profileForm.industry_focus}
              onChange={e => setProfileForm({...profileForm, industry_focus: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Salary Min</label>
              <input
                type="number"
                className="w-full p-2 border border-slate-200 rounded-lg"
                value={profileForm.salary_expectation_min}
                onChange={e => setProfileForm({...profileForm, salary_expectation_min: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Salary Max</label>
              <input
                type="number"
                className="w-full p-2 border border-slate-200 rounded-lg"
                value={profileForm.salary_expectation_max}
                onChange={e => setProfileForm({...profileForm, salary_expectation_max: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Learning Style</label>
              <select
                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={profileForm.learning_style}
                onChange={e => setProfileForm({...profileForm, learning_style: e.target.value})}
              >
                <option value="visual">Visual</option>
                <option value="practical">Practical</option>
                <option value="theoretical">Theoretical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-200 rounded-lg"
                value={profileForm.timezone}
                onChange={e => setProfileForm({...profileForm, timezone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Companies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profileForm.preferred_companies.map((company, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  {company}
                  <button
                    type="button"
                    onClick={() => setProfileForm({
                      ...profileForm,
                      preferred_companies: profileForm.preferred_companies.filter((_, i) => i !== idx)
                    })}
                    className="hover:text-blue-900 border-none bg-transparent cursor-pointer p-0 flex items-center"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="Add company and press Enter..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;
                  const val = target.value.trim();
                  if (val && !profileForm.preferred_companies.includes(val)) {
                    setProfileForm({
                      ...profileForm,
                      preferred_companies: [...profileForm.preferred_companies, val]
                    });
                    target.value = '';
                  }
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Weekly Reminders</h4>
              <p className="text-xs text-slate-500">Get notified for assessments and role analysis updates.</p>
            </div>
            <button
              type="button"
              onClick={() => setProfileForm({...profileForm, notifications_enabled: !profileForm.notifications_enabled})}
              className={`w-12 h-6 rounded-full transition-colors relative ${profileForm.notifications_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profileForm.notifications_enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <button type="submit" className={styles.btnPrimary + " w-full justify-center py-2"}>Save Preferences</button>
        </form>
      </Modal>
    </div>
  );
};

export default JobPrepHub;
