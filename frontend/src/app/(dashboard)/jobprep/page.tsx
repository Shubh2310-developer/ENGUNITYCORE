'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Target, GraduationCap, Award, ShieldCheck,
  Mic2, Compass, TrendingUp, Zap, Sparkles, Brain,
  Search, CheckCircle, AlertTriangle, ChevronRight,
  Plus, FileText, Github, BarChart3, Activity, Users,
  MessageSquare, LayoutDashboard, Settings, Info,
  ExternalLink, ArrowUpRight, Clock, Star, Play,
  Code2, Terminal, Layers, Globe, Database, Cpu,
  Monitor, ShieldAlert, ZapOff
} from 'lucide-react';
import styles from './jobprep.module.css';

// --- Mock Data ---

const roleData = {
  title: "AI/ML Engineer",
  definition: "Design, build, and deploy machine learning models and systems that solve complex real-world problems at scale.",
  demand: "High",
  salary: "$140k - $220k",
  skills: [
    { name: "ML Fundamentals", weight: 45, level: 4 },
    { name: "Python Programming", weight: 35, level: 5 },
    { name: "Math Foundations", weight: 20, level: 3 }
  ],
  marketTrends: [
    "92% of roles now require production deployment experience",
    "LLM fine-tuning has become table-stakes for ML roles",
    "System design importance increased 3x for mid-level positions"
  ]
};

const skillMatrix = [
  { category: "Mathematical Foundations", level: 3, evidence: 2, total: 5 },
  { category: "ML Theory", level: 4, evidence: 8, total: 12 },
  { category: "Programming & Systems", level: 4, evidence: 47, total: 50 },
  { category: "Tools & Frameworks", level: 3, evidence: 5, total: 10 },
  { category: "Domain Knowledge", level: 2, evidence: 3, total: 5 },
  { category: "Communication", level: 3, evidence: 4, total: 10 }
];

const interviewSims = [
  { id: 1, type: "Technical Round", date: "2 days ago", score: 78, status: "Weak Hire" },
  { id: 2, type: "System Design", date: "5 days ago", score: 65, status: "No Hire" },
  { id: 3, type: "Behavioral", date: "1 week ago", score: 90, status: "Strong Hire" }
];

const projects = [
  {
    id: 1,
    title: "Engunity AI Platform",
    description: "AI-powered SaaS for research, code generation, and data analysis.",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "Groq"],
    evidence: "92% Accuracy",
    impact: "500+ daily queries"
  },
  {
    id: 2,
    title: "Neural Vision Lab",
    description: "Computer vision toolkit for real-time object detection and segmentation.",
    stack: ["PyTorch", "OpenCV", "Docker"],
    evidence: "Implemented SOTA",
    impact: "Used in 3 labs"
  }
];

// --- Visual Components ---

const RadarChart = ({ size = 160 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="15" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
    <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="#e2e8f0" strokeWidth="0.5" />
    <polygon
      points="50,20 80,40 70,70 30,80 20,40"
      fill="rgba(37, 99, 235, 0.2)"
      stroke="#2563eb"
      strokeWidth="2"
    />
  </svg>
);

const LineChart = () => (
  <svg width="100%" height="100" viewBox="0 0 200 60" preserveAspectRatio="none">
    <path
      d="M0,50 Q25,45 50,48 T100,30 T150,25 T200,10"
      fill="none"
      stroke="#2563eb"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M0,50 Q25,45 50,48 T100,30 T150,25 T200,10 L200,60 L0,60 Z"
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
  const [activeTab, setActiveTab] = useState('overview');
  const [placementMode, setPlacementMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour for Placement Mode

  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState('');
  const [selectedTargetRoles, setSelectedTargetRoles] = useState<string[]>([]);

  React.useEffect(() => {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className={`rounded-2xl p-8 text-white relative overflow-hidden shadow-lg transition-colors duration-500 ${placementMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  {placementMode && <ShieldAlert className="text-red-400 animate-pulse" size={20} />}
                  <h2 className="text-3xl font-bold">{placementMode ? 'Placement Mode Active' : 'Train the Way Interviews Actually Test You'}</h2>
                </div>
                <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                  {placementMode
                    ? 'No hints. No pauses. Real-time evaluation against industry standards. Validate your readiness for target roles.'
                    : 'Move beyond random questions. Build provable skills, simulate real pressure, and enter interviews with evidence-backed confidence.'}
                </p>
                <div className="flex gap-4">
                  <button className={`${placementMode ? 'bg-red-600 hover:bg-red-700' : 'bg-white text-blue-600 hover:bg-blue-50'} px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm`}>
                    {placementMode ? 'Start Final Evaluation' : 'Start Prep Session'}
                  </button>
                  {!placementMode && (
                    <button className="bg-blue-500/30 border border-blue-400/30 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-500/40 transition-colors">
                      View My Roadmap
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 flex items-center justify-center">
                {placementMode ? <ShieldAlert size={240} /> : <GraduationCap size={240} />}
              </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
              <StatCard label="Engineers Prepared" value="847" icon={Users} />
              <StatCard label="Placement Rate" value="89%" icon={Award} />
              <StatCard label="Time to Readiness" value="2.3x Faster" icon={Zap} />
              <StatCard label="Better Performance" value="94%" icon={BarChart3} />
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={styles.card}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Compass className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg">Role Intelligence</h3>
                </div>
                <p className="text-slate-950 text-sm mb-4">Understand what companies actually test for your target role and see hidden patterns.</p>
                <div className="h-24 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  <RadarChart size={80} />
                </div>
              </div>

              <div className={styles.card}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-lg">Evidence Preparation</h3>
                </div>
                <p className="text-slate-950 text-sm mb-4">Replace "I think I know" with "I can prove I know" using concrete evidence artifacts.</p>
                <div className="grid grid-cols-3 gap-2 py-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full ${i < 4 ? 'bg-amber-400' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Mic2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg">Realistic Simulation</h3>
                </div>
                <p className="text-slate-950 text-sm mb-4">Practice under actual conditions with AI that interrupts and challenges you.</p>
                <div className="flex items-end gap-1 h-12">
                  {[4, 7, 5, 9, 6, 8, 4, 6].map((h, i) => (
                    <div key={i} className="flex-1 bg-green-200 rounded-t" style={{ height: `${h * 10}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Recent Simulations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-950 text-sm">
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {interviewSims.map((sim) => (
                      <tr key={sim.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-medium text-slate-950">{sim.type}</td>
                        <td className="py-4 text-slate-950 text-sm">{sim.date}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${sim.score > 75 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${sim.score}%` }}></div>
                            </div>
                            <span className="font-bold text-sm">{sim.score}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sim.status === 'Strong Hire' ? 'bg-green-100 text-green-700' :
                              sim.status === 'Weak Hire' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {sim.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-slate-950 group-hover:text-blue-600 transition-colors">
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'roles':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className={styles.card}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-950 mb-2">{roleData.title}</h2>
                    <p className="text-slate-950 leading-relaxed">{roleData.definition}</p>
                  </div>
                  <span className={styles.badgeGreen}>Active Prep</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-6 border-y border-slate-100">
                  <div>
                    <div className="text-xs text-slate-950 uppercase tracking-wider mb-1">Market Demand</div>
                    <div className="text-lg font-bold text-slate-950 flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-500" />
                      {roleData.demand}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-950 uppercase tracking-wider mb-1">Salary Range</div>
                    <div className="text-lg font-bold text-slate-950">{roleData.salary}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-950 uppercase tracking-wider mb-1">Career Path</div>
                    <div className="text-lg font-bold text-slate-950">Mid-Level</div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-6">Skills Importance Weighting</h3>
                    <div className="space-y-6">
                      {roleData.skills.map(skill => (
                        <div key={skill.name} className={styles.skillRow}>
                          <div className={styles.skillHeader}>
                            <span className={styles.skillName}>{skill.name}</span>
                            <span className={styles.skillLevel}>Importance: {skill.weight}%</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${skill.weight}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full md:w-48 flex items-center justify-center bg-slate-50 rounded-2xl p-4">
                    <RadarChart />
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className="font-bold text-lg mb-4">Market Trends & Insights</h3>
                <div className="space-y-4">
                  {roleData.marketTrends.map((trend, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className="p-1.5 bg-blue-100 rounded text-blue-600 mt-0.5">
                        <Sparkles size={14} />
                      </div>
                      <p className="text-sm text-slate-950 font-medium">{trend}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={styles.card}>
                <h3 className="font-bold text-lg mb-4">Explore Roles</h3>
                <div className="space-y-3">
                  {['AI/ML Engineer', 'Backend Engineer', 'Full Stack Developer', 'Data Scientist', 'Research Engineer', 'DevOps Engineer'].map(role => (
                    <button
                      key={role}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${role === roleData.title ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-950 hover:border-slate-400'}`}
                    >
                      {role}
                    </button>
                  ))}
                  <button className="w-full text-center px-4 py-3 rounded-xl border border-dashed border-slate-400 text-slate-950 hover:text-slate-950 hover:border-slate-500 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Custom Role
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-yellow-400" size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Pro Tip</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed mb-4">
                    "70% of candidates fail on fundamentals, not advanced topics. Most struggle with explaining trade-offs, not implementation."
                  </p>
                  <button className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:text-blue-300">
                    Read Market Report <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 text-white/5">
                  <Info size={120} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Skill Matrix</h2>
                <p className="text-slate-950">Your living proof of competence across all dimensions.</p>
              </div>
              <button className={styles.btnSecondary}>
                <Plus size={16} />
                Add Evidence
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillMatrix.map((item) => (
                <div key={item.category} className={styles.card}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-950">{item.category}</h4>
                      <div className="flex gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-1.5 rounded-full ${i < item.level ? 'bg-blue-600' : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Level {item.level}/5
                    </span>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between text-xs text-slate-950 font-bold uppercase tracking-wider">
                      <span>Evidence Strength</span>
                      <span>{item.evidence} Artifacts</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${(item.evidence / item.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button className="text-xs font-bold text-slate-950 hover:text-blue-600 transition-colors flex items-center gap-1">
                      View Artifacts <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-blue-600" />
                <h3 className="font-bold text-blue-900">Recommended Next Evidence</h3>
              </div>
              <p className="text-blue-800/80 text-sm mb-4">
                You have strong theoretical knowledge in <strong>Linear Algebra</strong>, but no practical artifacts.
                Complete the "SVD Visualization" project in Code Lab to reach Level 4.
              </p>
              <button className="text-sm font-bold text-blue-700 underline hover:text-blue-800">
                Start SVD Project
              </button>
            </div>
          </div>
        );

      case 'practice':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Practice Arena</h2>
                <p className="text-slate-950">Master concepts through high-pressure scenarios and stress tests.</p>
              </div>
              <div className="flex gap-2">
                <button className={styles.btnSecondary}>Drill Library</button>
                <button className={styles.btnPrimary}>
                  <Play size={16} />
                  Quick Start
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Concept Stress Tests", icon: Zap, color: "blue", desc: "Deep conceptual challenges focusing on 'Why' over 'How'." },
                { title: "Technical Problems", icon: Code2, color: "blue", desc: "Multi-step problems that mirror real-world ambiguity." },
                { title: "Explain-Why Drills", icon: MessageSquare, color: "green", desc: "Train your ability to articulate complex trade-offs clearly." }
              ].map((mode) => (
                <div key={mode.title} className={`${styles.card} hover:border-blue-200 transition-all cursor-pointer group`}>
                  <div className={`p-3 bg-${mode.color}-50 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <mode.icon className={`w-6 h-6 text-${mode.color}-600`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{mode.title}</h3>
                  <p className="text-slate-950 text-sm leading-relaxed">{mode.desc}</p>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <h3 className="font-bold text-lg mb-6">Active Practice Scenarios</h3>
              <div className="space-y-4">
                {[
                  { title: "Model Performance Investigation", difficulty: "Advanced", time: "15 min", category: "ML Theory" },
                  { title: "Recommendation System Debug", difficulty: "Expert", time: "45 min", category: "System Design" },
                  { title: "Explain Gradient Descent to a CEO", difficulty: "Intermediate", time: "10 min", category: "Communication" }
                ].map((scenario, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-950 font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-950">{scenario.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold text-blue-700">{scenario.category}</span>
                          <span className="text-xs text-slate-950 flex items-center gap-1">
                            <Clock size={12} /> {scenario.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${scenario.difficulty === 'Expert' ? 'bg-red-50 text-red-600' :
                          scenario.difficulty === 'Advanced' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {scenario.difficulty}
                      </span>
                      <button className="p-2 text-slate-950 hover:text-blue-600 transition-colors">
                        <Play size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'simulator':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Interview Simulator</h2>
                <p className="text-slate-950">Realistic simulations that interrupt, challenge, and push you.</p>
              </div>
              <button className={styles.btnPrimary}>
                <Plus size={16} />
                New Simulation
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className={styles.card}>
                  <h4 className="font-bold text-sm uppercase tracking-widest text-slate-950 mb-4">Quick Setup</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-950 block mb-2">Simulation Type</label>
                      <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>Technical Coding</option>
                        <option>System Design</option>
                        <option>ML Theory Deep Dive</option>
                        <option>Behavioral</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-950 block mb-2">Difficulty</label>
                      <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>Entry Level</option>
                        <option>Mid-Level</option>
                        <option>Senior Level</option>
                        <option>Staff/Principal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-950 block mb-2">Company Style</label>
                      <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>FAANG Style</option>
                        <option>Early Startup</option>
                        <option>Research Lab</option>
                        <option>Product Focused</option>
                      </select>
                    </div>
                    <button className={`${styles.btnPrimary} w-full justify-center py-3 mt-4`}>
                      Launch Session
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl p-6 text-white shadow-lg overflow-hidden relative transition-colors ${placementMode ? 'bg-red-600' : 'bg-blue-600'}`}>
                  <div className="relative z-10">
                    <h4 className="font-bold mb-2">Pro Mode</h4>
                    <p className="text-xs text-blue-100 mb-4">Turn on 'Placement Mode' for zero-safety sessions with no hints or pauses.</p>
                    <button
                      onClick={() => setPlacementMode(!placementMode)}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      {placementMode ? 'Disable Placement Mode' : 'Enable Placement Mode'}
                    </button>
                  </div>
                  <Zap size={80} className="absolute -right-4 -bottom-4 text-white/10" />
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className={styles.card}>
                  <h3 className="font-bold text-lg mb-6">Simulation History & Reports</h3>
                  <div className="space-y-6">
                    {interviewSims.map((sim) => (
                      <div key={sim.id} className="p-6 border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                              <Mic2 className="w-6 h-6 text-slate-950 group-hover:text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-950 text-lg">{sim.type}</h4>
                              <p className="text-sm text-slate-950">{sim.date} • {roleData.title} Loop</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-slate-950">{sim.score}%</div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sim.status === 'Strong Hire' ? 'bg-green-100 text-green-700' :
                                sim.status === 'Weak Hire' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {sim.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                          <div>
                            <div className="text-[10px] font-bold text-slate-950 uppercase tracking-widest mb-2">Technical</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-950">85%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-950 uppercase tracking-widest mb-2">Communication</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '58%' }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-950">58%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-950 uppercase tracking-widest mb-2">Problem Solving</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: '78%' }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-950">78%</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-slate-50 text-slate-950 text-[10px] font-bold rounded">#tradeoffs</span>
                            <span className="px-2 py-1 bg-slate-50 text-slate-950 text-[10px] font-bold rounded">#algorithms</span>
                          </div>
                          <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
                            View Full Analysis Report <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Project Proof</h2>
                <p className="text-slate-950">Transform your repositories into interview-ready evidence.</p>
              </div>
              <button className={styles.btnPrimary}>
                <Github size={16} />
                Import from GitHub
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((project) => (
                <div key={project.id} className={styles.card}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-950">{project.title}</h3>
                        <div className="flex gap-2 mt-1">
                          {project.stack.map(s => (
                            <span key={s} className="text-[10px] font-bold text-slate-950">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-950 hover:text-blue-600">
                      <ExternalLink size={18} />
                    </button>
                  </div>

                  <p className="text-slate-950 text-sm mb-6 leading-relaxed">{project.description}</p>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-950 uppercase tracking-widest mb-1">Evidence Strength</div>
                      <div className="text-sm font-bold text-slate-950">{project.evidence}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-950 uppercase tracking-widest mb-1">Verified Impact</div>
                      <div className="text-sm font-bold text-slate-950">{project.impact}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Interview Talking Points</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-slate-950 font-bold">
                        "I chose {project.stack[1]} over alternatives because of native async support, which was critical for LLM streaming..."
                      </div>
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-slate-950 font-bold">
                        "The biggest challenge was handling high-concurrency requests, which I solved by implementing {project.stack[3]}..."
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-6 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-950 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <Activity size={16} />
                    Generate Deep Dive Analysis
                  </button>
                </div>
              ))}

              <button className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-950 hover:text-slate-950 hover:border-slate-400 transition-all bg-slate-50/30">
                <Plus size={32} className="mb-4" />
                <span className="font-bold">Add Manual Project</span>
                <span className="text-xs mt-1 font-bold">Proof of skills from non-GitHub work</span>
              </button>
            </div>
          </div>
        );

      case 'tracker':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Readiness Tracker</h2>
                <p className="text-slate-950 font-bold">Honest assessment of your standing for target roles.</p>
              </div>
              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-slate-950">
                Last updated: Today, 10:45 AM
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className={`${styles.card} flex flex-col items-center text-center py-10 shadow-sm`}>
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
                        strokeDashoffset={339.3 - (339.3 * 68) / 100}
                        className="text-blue-600"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-950">68</span>
                      <span className="text-xs text-slate-950 font-bold">READY</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-slate-950 mb-2">Partial Ready</h3>
                  <p className="text-sm text-slate-950 font-bold px-4">
                    You're qualified for entry-level and some mid-level roles. Communication clarity is your primary bottleneck.
                  </p>
                </div>

                <div className={styles.card}>
                  <h4 className="font-bold text-slate-950 mb-4 text-xs uppercase tracking-widest">Role Confidence</h4>
                  <div className="space-y-4">
                    {[
                      { role: 'Junior AI Engineer', score: 85 },
                      { role: 'ML Engineering Intern', score: 92 },
                      { role: 'Applied ML Engineer', score: 72 },
                      { role: 'Senior AI Engineer', score: 38 },
                    ].map(role => (
                      <div key={role.role}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-950 font-bold">{role.role}</span>
                          <span className={`font-bold ${role.score > 70 ? 'text-green-600' : 'text-amber-600'}`}>{role.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${role.score > 70 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${role.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className={styles.card}>
                  <h3 className="font-bold text-lg mb-6 text-slate-950">Performance Trajectory</h3>
                  <div className="h-48 bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <LineChart />
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-950 uppercase tracking-widest">
                      <span>6 Weeks Ago</span>
                      <span>Current Status</span>
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Critical Gaps (Must Fix)
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-100 bg-red-50/50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-950">Communication Clarity</h4>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">High Impact</span>
                      </div>
                      <p className="text-sm text-slate-950 font-bold mb-3 leading-relaxed">
                        Detected in 7 interview simulations. Clarity drops significantly after 30 minutes of technical discussion.
                      </p>
                      <div className="flex gap-4">
                        <button className="text-xs font-bold text-blue-700 hover:underline">View Drills</button>
                        <button className="text-xs font-bold text-blue-700 hover:underline">Record Practice</button>
                      </div>
                    </div>

                    <div className="p-4 border border-amber-100 bg-amber-50/50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-950">System Design for Scale</h4>
                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">Medium Impact</span>
                      </div>
                      <p className="text-sm text-slate-950 font-bold mb-3 leading-relaxed">
                        You struggle with database sharding and caching strategies for medium-scale (1M+ users) systems.
                      </p>
                      <div className="flex gap-4">
                        <button className="text-xs font-bold text-blue-700 hover:underline">Study Guide</button>
                        <button className="text-xs font-bold text-blue-700 hover:underline">Mock Session</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`${styles['jobprep-theme']} ${placementMode ? styles.placementMode : ''}`}>
      {/* Top Navigation */}
      <header className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <div className={styles.topNavLogo}>
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className={styles.topNavTitle}>Job Prep</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-6">
            <span className={styles.topNavLink}>Roadmap</span>
            <span className={styles.topNavLink}>Performance</span>
            <span className={styles.topNavLink}>Archives</span>
          </div>
        </div>

        <div className={styles.topNavRight}>
          {placementMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-mono font-bold animate-pulse border border-red-100">
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center gap-2">
            <TrendingUp size={16} />
            68% Ready
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <button
            onClick={() => setPlacementMode(!placementMode)}
            className={`${styles.btnPrimary} ${placementMode ? 'bg-red-600 hover:bg-red-700' : ''} transition-all duration-300`}
          >
            {placementMode ? <ZapOff size={16} /> : <Zap size={16} />}
            {placementMode ? 'Exit Placement' : 'Placement Mode'}
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabItem} ${activeTab === tab.id ? styles.active : ''}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* AI Assistant Insight Box */}
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
                  ? 'Your performance is being benchmarked against Senior AI Engineer rubrics. No external help is permitted.'
                  : <>Based on your recent activity, focusing on <strong>System Design for Medium-scale</strong> could increase your readiness for Senior roles by 15%.</>}
              </p>
            </div>
          </div>

          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

export default JobPrepHub;
