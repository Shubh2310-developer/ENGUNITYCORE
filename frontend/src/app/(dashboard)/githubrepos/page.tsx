'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './githubrepos.module.css';
import { githubService } from '@/services/githubrepos';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { io, Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Github,
  Search,
  RefreshCw,
  Info,
  Code2,
  BookOpen,
  PlayCircle,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Star,
  GitFork,
  FileCode,
  Terminal,
  AlertTriangle,
  History,
  Users,
  Database,
  SearchCode,
  Zap,
  Cpu,
  Loader2,
  Copy,
  Check,
  Plus,
  Trash2,
  Pencil,
  Download,
  Globe,
  Lock,
  X
} from 'lucide-react';

// Types
type TabType = 'overview' | 'code' | 'research' | 'sandbox' | 'security' | 'activity';
type SortMode = 'updated' | 'stars' | 'quality' | 'research';

interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  langColor: string;
  stars: number;
  forks: number;
  visibility: 'Public' | 'Private';
  lastUpdated: string;
  qualityScore: string;
}

export default function GithubReposPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<string>>(new Set());
  const [repoDetails, setRepoDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('All');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{title: string, content: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [importData, setImportData] = useState({ owner: '', repo: '', token: '' });
  const [editData, setEditData] = useState({ id: '', name: '', description: '', visibility: 'Public' });
  const [importLoading, setImportLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{status: string, progress: number} | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { token, user, providerToken } = useAuthStore();

  const handleGithubLogin = async () => {
    try {
      await authService.loginWithGithub();
    } catch (err: any) {
      alert(`GitHub login failed: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchReadme = async () => {
      if (!token || !selectedRepo) return;

      try {
        setReadmeLoading(true);
        const data = await githubService.getFileContent(token, selectedRepo.id, 'README.md');
        setReadmeContent(data.content);
      } catch (err) {
        console.error('Failed to fetch README:', err);
        setReadmeContent(`# ${selectedRepo.name}\n\n${selectedRepo.description || 'No description available.'}`);
      } finally {
        setReadmeLoading(false);
      }
    };

    fetchReadme();
  }, [token, selectedRepo]);

  useEffect(() => {
    const fetchFileContent = async () => {
      if (!token || !selectedRepo || !selectedFile) return;

      try {
        setFileLoading(true);
        const data = await githubService.getFileContent(token, selectedRepo.id, selectedFile);
        setFileContent(data.content);
      } catch (err) {
        console.error('Failed to fetch file content:', err);
        setFileContent('Error loading file content.');
      } finally {
        setFileLoading(false);
      }
    };

    if (activeTab === 'code') {
      fetchFileContent();
    }
  }, [token, selectedRepo, selectedFile, activeTab]);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('analysis_status', (data: { repo_id: string, status: string, progress: number }) => {
      if (selectedRepo && data.repo_id === selectedRepo.id) {
        setAnalysisProgress({ status: data.status, progress: data.progress });
        if (data.status === 'completed') {
          // Refresh details when completed
          fetchDetails();
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedRepo]);

  const fetchRepos = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await githubService.getRepositories(token);
      setRepos(data);
      if (data.length > 0 && !selectedRepo) {
        setSelectedRepo(data[0]);
      }
    } catch (err) {
      setError('Failed to load repositories. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    if (!token || !selectedRepo) return;

    try {
      setDetailsLoading(true);
      const data = await githubService.getRepositoryDetails(token, selectedRepo.id);
      setRepoDetails(data);
    } catch (err) {
      console.error('Failed to fetch repo details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [token]);

  useEffect(() => {
    const fetchGithubRepos = async () => {
      if (!token || user?.provider !== 'github') return;

      try {
        setGithubLoading(true);
        const data = await githubService.getUserGithubRepositories(token, providerToken || undefined);
        setGithubRepos(data);
      } catch (err) {
        console.error('Failed to fetch GitHub repos:', err);
      } finally {
        setGithubLoading(false);
      }
    };

    if (repos.length === 0 && user?.provider === 'github') {
      fetchGithubRepos();
    }
  }, [token, user, repos.length, providerToken]);

  useEffect(() => {
    fetchDetails();
  }, [token, selectedRepo]);

  const handleImportRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !importData.owner || !importData.repo) return;

    try {
      setImportLoading(true);
      await githubService.importRepository(token, importData.owner, importData.repo, importData.token);
      setIsImportModalOpen(false);
      setImportData({ owner: '', repo: '', token: '' });
      await fetchRepos();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteRepository = async (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !window.confirm('Are you sure you want to delete this repository?')) return;

    try {
      await githubService.deleteRepository(token, repoId);
      if (selectedRepo?.id === repoId) {
        setSelectedRepo(null);
        setRepoDetails(null);
      }
      await fetchRepos();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!token || !selectedRepo) return;

    try {
      setAiLoading(true);
      setAnalysisProgress({ status: 'queued', progress: 5 });
      await githubService.triggerAnalysis(token, selectedRepo.id);
    } catch (err: any) {
      alert(`Analysis trigger failed: ${err.message}`);
      setAnalysisProgress(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editData.id) return;

    try {
      setEditLoading(true);
      await githubService.updateRepository(token, editData.id, {
        description: editData.description,
        visibility: editData.visibility
      });
      setIsEditModalOpen(false);
      await fetchRepos();
      if (selectedRepo?.id === editData.id) {
        await fetchDetails();
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!token || !currentRepo) return;

    try {
      const data = await githubService.getDownloadUrl(token, currentRepo.id);
      window.open(data.download_url, '_blank');
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleRunAiTool = async (toolType: string) => {
    if (!token || !currentRepo) return;

    try {
      setAiLoading(true);
      setAiAnalysis(null);
      const data = await githubService.runAiTool(token, currentRepo.id, toolType);
      setAiAnalysis(data.result);
    } catch (err) {
      console.error('Failed to run AI tool:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSync = async () => {
    if (!token || !currentRepo) return;

    try {
      setSyncing(true);
      await githubService.syncRepository(token, currentRepo.id);
      await fetchDetails();
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = async () => {
    const content = getFileContent(selectedFile);
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleRepoSelection = (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedRepoIds);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepoIds(newSelected);
  };

  const handleBulkAnalysis = async () => {
    if (!token || selectedRepoIds.size === 0) return;

    setAiLoading(true);
    try {
      await githubService.bulkTriggerAnalysis(token, Array.from(selectedRepoIds));
      alert(`Triggered intelligence analysis for ${selectedRepoIds.size} repositories in the background.`);
      setSelectedRepoIds(new Set());
    } catch (err: any) {
      alert(`Bulk analysis failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredRepos = repos
    .filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          repo.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang = filterLanguage === 'All' || repo.language === filterLanguage;
      return matchesSearch && matchesLang;
    })
    .sort((a, b) => {
      if (sortMode === 'stars') return b.stars - a.stars;
      if (sortMode === 'quality') return b.qualityScore.localeCompare(a.qualityScore);
      // 'updated' and 'research' are simplified for mock data
      return 0;
    });

  const getActivityPulse = () => {
    if (!repoDetails?.activity?.recent_commits || repoDetails.activity.recent_commits.length === 0) {
      return [40, 70, 45, 90, 65, 80, 50, 40, 30, 85, 95, 75];
    }

    const commits = repoDetails.activity.recent_commits;
    const months: Record<string, number> = {};

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months[key] = 0;
    }

    commits.forEach((c: any) => {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (months[key] !== undefined) {
        months[key]++;
      }
    });

    const counts = Object.values(months);
    const maxCount = Math.max(...counts, 1);
    return counts.map(count => Math.max(10, (count / maxCount) * 100));
  };

  const getFileContent = (fileName: string) => {
    return fileContent || 'Select a file to view its content.';
  };

  const languages = ['All', ...Array.from(new Set(repos.map(r => r.language)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-red-500">
        <AlertTriangle size={48} className="mb-4" />
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
        <Github size={48} className="mb-4 opacity-20" />
        <p className="mb-6">No repositories found.</p>
        {!user?.provider || user?.provider !== 'github' ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-400">Log in with GitHub to automatically see your repositories.</p>
            <button
              onClick={handleGithubLogin}
              className="flex items-center gap-2 px-6 py-3 bg-[#24292f] text-white rounded-lg hover:bg-[#1a1e22] transition-colors font-medium shadow-md"
            >
              <Github size={20} />
              Continue with GitHub
            </button>
            <div className="relative w-full max-w-[200px] my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-[#f9fafb] px-2 text-gray-400">Or import manually</span>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Plus size={16} />
              Import a repository
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Your GitHub Repositories</h3>
              <button
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Plus size={12} /> Import manually
              </button>
            </div>

            {githubLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : githubRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {githubRepos.slice(0, 6).map((repo: any) => (
                  <div
                    key={repo.repository_url}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => {
                      setImportData({ owner: repo.owner, repo: repo.name, token: '' });
                      setIsImportModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900 truncate pr-2">{repo.name}</div>
                      <Plus size={16} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{repo.description || 'No description'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> {repo.language}</span>
                      <span className="flex items-center gap-1"><Star size={10} /> {repo.stars}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No repositories found in your GitHub account.</p>
                <button
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  Import manually
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Ensure selectedRepo is not null for the rest of the UI
  const currentRepo = selectedRepo || repos[0];

  return (
    <div className={styles['github-theme']}>
      {/* Top Header */}
      <header className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <div className={styles.topNavLogo}>
            <Github />
          </div>
          <h1 className={styles.topNavTitle}>GitHub_Intelligence</h1>
        </div>
        <div className={styles.topNavRight}>
          <div className={`${styles.syncStatus} ${syncing ? 'animate-pulse' : ''}`} onClick={handleSync} style={{ cursor: 'pointer' }}>
            <div className={`${styles.syncDot} ${syncing ? 'bg-blue-400' : 'bg-green-500'}`} />
            <span>
              {syncing ? 'Syncing Neural Bridge...' :
               repoDetails?.activity?.last_sync ? `Synced: ${new Date(repoDetails.activity.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
               `Synced: ${lastSyncTime}`}
            </span>
          </div>
          <button className={styles.btnSecondary} onClick={() => window.location.reload()}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabItem} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Info size={18} /> Overview
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'code' ? styles.active : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <Code2 size={18} /> Code Intelligence
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'research' ? styles.active : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <BookOpen size={18} /> Research Mapping
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'sandbox' ? styles.active : ''}`}
          onClick={() => setActiveTab('sandbox')}
        >
          <PlayCircle size={18} /> Execution Sandbox
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'security' ? styles.active : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <ShieldCheck size={18} /> Security & Quality
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === 'activity' ? styles.active : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <BarChart3 size={18} /> Activity & Insights
        </button>
      </nav>

      {/* Main Container */}
      <div className={styles.mainContainer}>
        {/* Left Sidebar - Repo Library */}
        <aside className={styles.leftSidebar}>
          <div className={styles.sidebarHeader}>
            <div className="flex items-center justify-between mb-2">
              <h2 className={styles.sidebarTitle}>Repository Library</h2>
              <button
                className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => setIsImportModalOpen(true)}
                title="Import Repository"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search repositories..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <select
                className="flex-1 bg-white border border-gray-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <select
                className="flex-1 bg-white border border-gray-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
              >
                <option value="updated">Recently Updated</option>
                <option value="stars">Most Stars</option>
                <option value="quality">Highest Quality</option>
                <option value="research">Research Mapping</option>
              </select>
            </div>
          </div>

          <div className={styles.repoList}>
            {filteredRepos.map(repo => (
              <div
                key={repo.id}
                className={`${styles.repoCard} ${currentRepo.id === repo.id ? styles.active : ''} ${selectedRepoIds.has(repo.id) ? styles.selected : ''}`}
                onClick={() => setSelectedRepo(repo)}
              >
                <div className={styles.repoCardHeader}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className={styles.repoCheckbox}
                      checked={selectedRepoIds.has(repo.id)}
                      onChange={() => {}} // Handled by onClick on the wrapper for better UX
                      onClick={(e) => toggleRepoSelection(repo.id, e)}
                    />
                    <div className={styles.repoName}>
                      <Database size={16} />
                      {repo.name}
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                    <span className={styles.visibilityBadge}>{repo.visibility}</span>
                    <button
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditData({
                          id: repo.id,
                          name: repo.name,
                          description: repo.description,
                          visibility: repo.visibility
                        });
                        setIsEditModalOpen(true);
                      }}
                      title="Edit Repository"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => handleDeleteRepository(repo.id, e)}
                      title="Delete Repository"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className={styles.repoDesc}>{repo.description}</p>
                <div className={styles.repoMeta}>
                  <div className={styles.repoMetaItem}>
                    <div className={styles.langDot} style={{ backgroundColor: repo.langColor }} />
                    {repo.language}
                  </div>
                  <div className={styles.repoMetaItem}>
                    <Star size={12} /> {repo.stars}
                  </div>
                  <div className={styles.repoMetaItem}>
                    <GitFork size={12} /> {repo.forks}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Bulk Actions Panel */}
        {selectedRepoIds.size > 0 && (
          <div className={styles.bulkActionsPanel}>
            <div className={styles.bulkInfo}>
              <span className={styles.bulkCount}>{selectedRepoIds.size}</span>
              <span className={styles.bulkText}>Repositories Selected</span>
            </div>
            <div className={styles.bulkButtons}>
              <button className={styles.bulkBtnPrimary} onClick={handleBulkAnalysis}>
                <Zap size={14} /> Analyze All
              </button>
              <button className={styles.bulkBtnSecondary} onClick={() => setSelectedRepoIds(new Set())}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {/* AI Assistant Header */}
          <div className={styles.aiAssistant}>
            <div className={styles.aiIcon}>
              <Zap size={20} />
            </div>
            <div className={styles.aiContent}>
              <div className="flex items-center justify-between">
                <h4>Neural_Agent_01: {analysisProgress ? `Analysis ${analysisProgress.status}...` : 'Analysis Ready'}</h4>
                {!analysisProgress && (
                  <button
                    className="flex items-center gap-2 text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                    onClick={handleTriggerAnalysis}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    Trigger Intelligence Analysis
                  </button>
                )}
              </div>
              <p>
                {analysisProgress ?
                  `Current Stage: ${analysisProgress.status.charAt(0).toUpperCase() + analysisProgress.status.slice(1)}. Processing neural layers...` :
                  `I've analyzed ${currentRepo.name}. ${activeTab === 'overview' ?
                  `This repository provides a production-grade implementation of ${currentRepo.language} models. Quality Score: ${currentRepo.qualityScore}.` :
                  `Exploring the ${activeTab} module... Found high-level optimizations and research connections.`
                  }`
                }
              </p>
              {analysisProgress && (
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${analysisProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Content based on Tab */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <div className={styles.overviewTab}>
                <div className={styles.statsGrid}>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}><Database size={18} /> Repository Info</div>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Full Name</span>
                        <span className="font-medium">{currentRepo.owner}/{currentRepo.name}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Primary Language</span>
                        <span className="font-medium">{currentRepo.language}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">License</span>
                        <span className="font-medium">MIT</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Last Sync</span>
                        <span className="font-medium">
                          {repoDetails?.activity?.last_sync ? new Date(repoDetails.activity.last_sync).toLocaleDateString() : currentRepo.lastUpdated}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        className={`${styles.btnSecondary} w-full py-2 flex items-center justify-center gap-2`}
                        onClick={handleDownload}
                        disabled={!repoDetails?.analysis?.storage_path}
                        title={repoDetails?.analysis?.storage_path ? "Download archived source" : "Analysis required to generate archive"}
                      >
                        <Download size={16} />
                        Download Source Archive
                      </button>
                    </div>
                  </div>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}><Cpu size={18} /> Intelligence Snapshot</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-xs text-green-600 font-bold uppercase">Quality</div>
                        <div className="text-2xl font-bold text-green-700">{repoDetails?.analysis?.quality_score || currentRepo.qualityScore || 'B'}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-bold uppercase">Security</div>
                        <div className="text-2xl font-bold text-blue-700">{repoDetails?.analysis?.security_score || '95'}/100</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-bold uppercase">Research</div>
                        <div className="text-2xl font-bold text-blue-700">{repoDetails?.analysis?.research_papers?.length || '0'} Papers</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-xs text-amber-600 font-bold uppercase">Vulnerabilities</div>
                        <div className="text-2xl font-bold text-amber-700">{repoDetails?.analysis?.vulnerabilities || '0'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className={`${styles.card} lg:col-span-2`}>
                    <div className={styles.cardTitle}><FileCode size={18} /> README.md</div>
                    <div className={styles.readmeContent}>
                      {readmeLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                          <Loader2 className="animate-spin" size={32} />
                          <span className="text-sm font-medium">Loading Documentation Pulse...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-slate">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {readmeContent}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className={styles.card}>
                      <div className={styles.cardTitle}><Zap size={18} /> Key Modules</div>
                      <div className={styles.moduleList}>
                        {repoDetails?.analysis?.code_intelligence?.key_modules?.map((m: any, idx: number) => (
                          <div key={idx} className={styles.moduleItem}>
                            <div className={styles.moduleIcon}>
                              <Database size={14} />
                            </div>
                            <div className={styles.moduleInfo}>
                              <h6>{m.name}</h6>
                              <p>{m.description}</p>
                            </div>
                          </div>
                        )) || <div className="text-xs text-gray-400 italic">No modules analyzed.</div>}
                      </div>
                    </div>

                    <div className={styles.card}>
                      <div className={styles.cardTitle}><Terminal size={18} /> Project Structure</div>
                      <div className={styles.structureTree}>
                        {repoDetails?.analysis?.code_intelligence?.file_tree?.map((item: any, idx: number) => (
                          <div key={idx} className="mb-2">
                            <div className={`${styles.treeItem} ${item.type === 'dir' ? styles.treeDir : ''}`}>
                              {item.type === 'dir' ? <ChevronRight size={14} className={styles.treeItemIcon} /> : <FileCode size={14} className={styles.treeItemIcon} />}
                              {item.name}
                            </div>
                            {item.children && (
                              <div className={styles.treeBranch}>
                                {item.children.slice(0, 3).map((child: any, cIdx: number) => (
                                  <div key={cIdx} className={styles.treeItem}>
                                    {child.type === 'dir' ? <ChevronRight size={12} className={styles.treeItemIcon} /> : <FileCode size={12} className={styles.treeItemIcon} />}
                                    {child.name}
                                  </div>
                                ))}
                                {item.children.length > 3 && <div className="text-[10px] text-gray-400 ml-5">... {item.children.length - 3} more files</div>}
                              </div>
                            )}
                          </div>
                        )) || <div className="text-xs text-gray-400 italic">Syncing structure...</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className={styles.codeTab}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}><SearchCode size={18} /> Code Intelligence</div>
                  <div className={styles.codeExplorer}>
                    <div className={styles.fileTree}>
                      <div className="font-semibold text-[10px] uppercase text-gray-400 mb-3 tracking-wider">Explorer</div>
                      <div className="space-y-1">
                        {repoDetails?.analysis?.code_intelligence?.file_tree ? (
                          repoDetails.analysis.code_intelligence.file_tree.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col">
                              <div
                                className={`flex items-center gap-2 p-1.5 hover:bg-white hover:shadow-sm rounded cursor-pointer text-sm transition-all ${selectedFile === item.path ? 'bg-white shadow-sm font-medium' : ''}`}
                                onClick={() => item.type === 'file' && setSelectedFile(item.path)}
                              >
                                {item.type === 'dir' ? <ChevronRight size={14} className="text-gray-400" /> : <FileCode size={14} className="text-blue-500" />}
                                {item.name}
                              </div>
                              {item.children && (
                                <div className="ml-4 border-l border-gray-100 pl-2 mt-1 space-y-1">
                                  {item.children.map((child: any, cIdx: number) => (
                                    <div
                                      key={cIdx}
                                      className={`flex items-center gap-2 p-1.5 hover:bg-white hover:shadow-sm rounded cursor-pointer text-xs transition-all ${selectedFile === child.path ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'}`}
                                      onClick={() => setSelectedFile(child.path)}
                                    >
                                      {child.type === 'dir' ? <ChevronRight size={12} /> : <FileCode size={12} />} {child.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 italic p-2">Syncing structure...</div>
                        )}
                      </div>
                    </div>

                    <div className={styles.codeViewer}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                          <FileCode size={14} /> {selectedFile}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-2 py-1 rounded border border-gray-100"
                          >
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                          <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
                            {selectedFile.split('.').pop() || 'Text'}
                          </div>
                        </div>
                      </div>
                      {fileLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                          <Loader2 className="animate-spin" size={32} />
                          <span className="text-sm font-medium">Fetching Source Code...</span>
                        </div>
                      ) : (
                        <pre className="text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                          {fileContent || 'Select a file to view its content.'}
                        </pre>
                      )}
                    </div>

                    <aside className={styles.aiInsightsPanel}>
                      <div>
                        <h5 className={styles.aiInsightHeader}>Neural Analysis Tools</h5>
                        <div className={styles.aiToolGrid}>
                          <button
                            className={styles.aiToolBtn}
                            onClick={() => handleRunAiTool('explain')}
                            disabled={aiLoading}
                          >
                            <Info size={18} />
                            <span>Explain</span>
                          </button>
                          <button
                            className={styles.aiToolBtn}
                            onClick={() => handleRunAiTool('trace')}
                            disabled={aiLoading}
                          >
                            <Zap size={18} />
                            <span>Trace</span>
                          </button>
                          <button
                            className={styles.aiToolBtn}
                            onClick={() => handleRunAiTool('bottleneck')}
                            disabled={aiLoading}
                          >
                            <AlertTriangle size={18} />
                            <span>Audit</span>
                          </button>
                          <button
                            className={styles.aiToolBtn}
                            onClick={() => handleRunAiTool('dead_code')}
                            disabled={aiLoading}
                          >
                            <SearchCode size={18} />
                            <span>Clean</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <h5 className={styles.aiInsightHeader}>Analysis Result</h5>
                        {aiLoading ? (
                          <div className="flex flex-col items-center justify-center py-10 text-blue-500 gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-xs font-medium">Processing Neural Trace...</span>
                          </div>
                        ) : aiAnalysis ? (
                          <div className={styles.aiResultCard}>
                            <div className={styles.aiResultTitle}>
                              <Zap size={14} className="text-blue-500" />
                              {aiAnalysis.title}
                            </div>
                            <p className={styles.aiResultContent}>{aiAnalysis.content}</p>
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center">
                            <Cpu size={24} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-[10px] text-gray-400">Select a tool above to begin repository-level intelligence analysis.</p>
                          </div>
                        )}
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'research' && (
              <div className={styles.researchTab}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}><BookOpen size={18} /> Research Mapping</div>
                  <p className="text-sm text-gray-500 mb-6">Connecting implementation to academic literature with neural-link precision.</p>

                  <div className="space-y-4">
                    {repoDetails?.analysis?.research_papers ? (
                      repoDetails.analysis.research_papers.map((paper: any, idx: number) => (
                        <div key={idx} className={styles.paperCard}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{paper.title}</h4>
                            <a
                              href={`https://arxiv.org/abs/${paper.arxiv_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.paperBadge} hover:bg-blue-200 transition-colors flex items-center gap-1`}
                            >
                              arxiv:{paper.arxiv_id}
                              <ExternalLink size={10} />
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mb-4">{paper.authors} ({paper.year}) — {paper.relevance}</p>
                          <div className="flex flex-wrap gap-2">
                            {paper.mappings?.map((m: any, mIdx: number) => (
                              <div key={mIdx} className={styles.mappingItem}>
                                <FileCode size={12} className="text-blue-500" />
                                <span>{m.file}:{m.line} <span className="text-blue-600 font-semibold">{m.symbol}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-400 italic">No research papers mapped yet. Trigger analysis to begin.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sandbox' && (
              <div className={styles.sandboxTab}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}><PlayCircle size={18} /> Execution Sandbox</div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold text-gray-800">Isolated Neural Environment</div>
                      <div className="text-xs text-gray-500">Safe, isolated environment for testing code.</div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* GPU Toggle */}
                      <div className={styles.gpuToggleWrapper}>
                        <span className={`text-[10px] font-bold uppercase ${gpuEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                          H100 GPU
                        </span>
                        <button
                          className={`${styles.toggleSwitch} ${gpuEnabled ? styles.toggleOn : ''}`}
                          onClick={() => setGpuEnabled(!gpuEnabled)}
                        >
                          <div className={styles.toggleKnob} />
                        </button>
                      </div>

                      <button
                        className={styles.btnPrimary}
                        disabled={executing || !token || !currentRepo}
                        onClick={async () => {
                        if (!token || !currentRepo) return;
                        try {
                          setExecuting(true);
                          setSandboxLogs([]);
                          const result = await githubService.executeRepository(token, currentRepo.id);
                          setSandboxLogs(result.logs || []);
                        } catch (err) {
                          alert('Failed to trigger sandbox execution.');
                        } finally {
                          setExecuting(false);
                        }
                      }}
                    >
                      {executing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Executing...
                        </>
                      ) : (
                        <>
                          <PlayCircle size={16} /> Run Example
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.terminal}>
                    {sandboxLogs.length > 0 ? (
                      sandboxLogs.map((log, idx) => (
                        <div key={idx} className="mb-1 text-xs">
                          <span className="text-gray-500 mr-2">[{log.time}]</span>
                          <span className={
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'output' ? 'text-blue-300' :
                            'text-gray-300'
                          }>
                            {log.message}
                          </span>
                        </div>
                      ))
                    ) : executing ? (
                      <div className="text-blue-400 animate-pulse text-xs">Initializing secure environment...</div>
                    ) : (
                      <>
                        <div className="text-green-400 mb-2 text-xs">$ # Ready for execution</div>
                        <div className="text-gray-500 italic text-xs">Click "Run Example" to start analysis.</div>
                      </>
                    )}
                    {!executing && sandboxLogs.length > 0 && (
                      <div className="text-green-400 mt-2 text-xs">$ _</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={styles.securityTab}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}><ShieldCheck size={18} /> Security & Quality Audit</div>
                  <div className="space-y-8">
                    <div className={styles.scoreGrid}>
                      <div className={styles.scoreCard}>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Vulnerabilities</div>
                        <div className={`${styles.scoreValue} text-green-600`}>{repoDetails?.analysis?.security_audit?.vulnerabilities ?? 0}</div>
                        <div className="text-[10px] text-green-500 font-medium">Critical: 0</div>
                      </div>
                      <div className={styles.scoreCard}>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Secrets Found</div>
                        <div className={`${styles.scoreValue} text-green-600`}>{repoDetails?.analysis?.security_audit?.secrets ?? 'None'}</div>
                        <div className="text-[10px] text-green-500 font-medium">Safe</div>
                      </div>
                      <div className={styles.scoreCard}>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Maintenance</div>
                        <div className={`${styles.scoreValue} text-blue-600`}>{repoDetails?.analysis?.security_audit?.maintenance ?? 'High'}</div>
                        <div className="text-[10px] text-blue-500 font-medium">Active</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        Quality Intelligence
                      </h5>
                      <div className={styles.warningList}>
                        {repoDetails?.analysis?.security_audit?.warnings?.map((w: any, idx: number) => (
                          <div key={idx} className={styles.warningItem}>
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="text-sm text-gray-700 font-medium">{w.issue}</span>
                            </div>
                            <span className={`${styles.severityBadge} ${styles.badgeLow}`}>{w.risk} Risk</span>
                          </div>
                        )) || (
                          <div className="text-sm text-gray-400 italic">No warnings found. Trigger analysis to begin pulse check.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className={styles.activityTab}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}><BarChart3 size={18} /> Activity & Network Insights</div>

                  <div className={styles.chartContainer}>
                    {getActivityPulse().map((h: number, i: number) => (
                      <div key={i} className={styles.barWrapper}>
                        <div
                          className={styles.bar}
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className={styles.insightCard}>
                      <div className="flex items-center gap-4">
                        <div className={styles.insightIcon}>
                          <History size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Latest Pulse</div>
                          <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                            {repoDetails?.activity?.recent_commits?.[0]?.message || 'No recent activity'}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {repoDetails?.activity?.recent_commits?.[0]?.date ?
                              new Date(repoDetails.activity.recent_commits[0].date).toLocaleDateString() :
                              'N/A'
                            }
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>

                    <div className={styles.insightCard}>
                      <div className="flex items-center gap-4">
                        <div className={styles.insightIcon} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
                          <Users size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Engagement</div>
                          <div className="text-sm font-bold text-gray-900">
                            {currentRepo.stars} stars • {currentRepo.forks} forks
                          </div>
                          <div className="text-[10px] text-green-500 font-bold">
                            Active Pulse Verified
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <History size={16} className="text-blue-500" />
                      Recent Commit History
                    </h5>
                    <div className="space-y-3">
                      {repoDetails?.activity?.recent_commits && repoDetails.activity.recent_commits.length > 0 ? (
                        repoDetails.activity.recent_commits.map((commit: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                            <div className="mt-1">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{commit.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">{commit.author}</span>
                                <span className="text-[10px] text-gray-400">•</span>
                                <span className="text-[10px] text-gray-400">{new Date(commit.date).toLocaleString()}</span>
                              </div>
                            </div>
                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <History size={32} className="mx-auto text-gray-300 mb-3 opacity-20" />
                          <p className="text-sm text-gray-400 font-medium">No activity pulse detected yet.</p>
                          <button
                            onClick={handleSync}
                            className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 mx-auto"
                          >
                            <RefreshCw size={12} />
                            Sync with GitHub
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Import Repository Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Github size={20} />
                Import Repository
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleImportRepository} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repository Owner</label>
                <input
                  type="text"
                  placeholder="e.g. anthropics"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={importData.owner}
                  onChange={(e) => setImportData({ ...importData, owner: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. claude-code"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={importData.repo}
                  onChange={(e) => setImportData({ ...importData, repo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Personal Access Token (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={importData.token}
                    onChange={(e) => setImportData({ ...importData, token: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">Required for private repositories or higher rate limits.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {importLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {importLoading ? 'Importing...' : 'Import Repo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Repository Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw size={20} className="text-blue-600" />
                Edit Repository
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateRepository} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  value={editData.name}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Update repository description..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visibility</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={editData.visibility}
                  onChange={(e) => setEditData({ ...editData, visibility: e.target.value as any })}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {editLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {editLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
