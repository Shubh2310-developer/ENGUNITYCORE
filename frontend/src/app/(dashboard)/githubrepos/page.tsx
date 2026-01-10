'use client';

import React, { useState, useEffect } from 'react';
import styles from './githubrepos.module.css';
import { githubService } from '@/services/githubrepos';
import { useAuthStore } from '@/stores/authStore';
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
  Check
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
  const [lastSyncTime, setLastSyncTime] = useState<string>('0x82...f4');
  const [selectedFile, setSelectedFile] = useState<string>('src/models/transformer.py');
  const [sandboxLogs, setSandboxLogs] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{title: string, content: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchRepos = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const data = await githubService.getRepositories(token);
        setRepos(data);
        if (data.length > 0) {
          setSelectedRepo(data[0]);
        }
      } catch (err) {
        setError('Failed to load repositories. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [token]);

  useEffect(() => {
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

    fetchDetails();
  }, [token, selectedRepo]);

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
    setSyncing(true);
    // Simulate API delay for syncing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastSyncTime(`0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 4)}`);
    setSyncing(false);
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
      // In a real implementation, we'd call a bulk analysis endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Triggered intelligence analysis for ${selectedRepoIds.size} repositories.`);
      setSelectedRepoIds(new Set());
    } catch (err) {
      console.error('Bulk analysis failed:', err);
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

  const getFileContent = (fileName: string) => {
    const contents: Record<string, string> = {
      'transformer.py': `import torch
import torch.nn as nn

class TransformerModel(nn.Module):
    def __init__(self, vocab_size, d_model, nhead):
        super(TransformerModel, self).__init__()
        self.model_type = 'Transformer'
        self.pos_encoder = PositionalEncoding(d_model)
        self.encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model, nhead),
            num_layers=6
        )
        self.decoder = nn.Linear(d_model, vocab_size)

    def forward(self, src):
        src = self.pos_encoder(src)
        output = self.encoder(src)
        return self.decoder(output)`,
      'attention.py': `import math
import torch
import torch.nn as nn

class ScaledDotProductAttention(nn.Module):
    def __init__(self, d_k):
        super().__init__()
        self.d_k = d_k

    def forward(self, q, k, v, mask=None):
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = nn.functional.softmax(scores, dim=-1)
        return torch.matmul(attn, v), attn`,
      'main.py': `from models.transformer import TransformerModel
import torch

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = TransformerModel(vocab_size=1000, d_model=512, nhead=8).to(device)
    src = torch.randint(0, 1000, (32, 10)).to(device)
    output = model(src)
    print(f"Output shape: {output.shape}")

if __name__ == "__main__":
    main()`,
      'README.md': `# Transformer Optimization Hub\\n\\nThis repository contains production-ready implementations of various transformer architectures with focus on efficiency and performance.\\n\\n## Installation\\n\\n\`\`\`bash\\npip install -r requirements.txt\\n\`\`\``,
      'requirements.txt': `torch>=2.0.0\\nnumpy>=1.24.0\\ntqdm>=4.65.0`
    };

    const key = Object.keys(contents).find(k => fileName.endsWith(k));
    return contents[key || 'transformer.py'] || 'File content not found.';
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
        <p>No repositories found.</p>
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
            <span>{syncing ? 'Syncing Neural Bridge...' : `Synced: ${lastSyncTime}`}</span>
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
            <h2 className={styles.sidebarTitle}>Repository Library</h2>
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
                  <span className={styles.visibilityBadge}>{repo.visibility}</span>
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
              <h4>Neural_Agent_01: Analysis Ready</h4>
              <p>
                I've analyzed {currentRepo.name}. {activeTab === 'overview' ?
                `This repository provides a production-grade implementation of ${currentRepo.language} models. Quality Score: ${currentRepo.qualityScore}.` :
                `Exploring the ${activeTab} module... Found high-level optimizations and research connections.`
              }
              </p>
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
                        <span className="font-medium">{currentRepo.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}><Cpu size={18} /> Intelligence Snapshot</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-xs text-green-600 font-bold uppercase">Quality</div>
                        <div className="text-2xl font-bold text-green-700">{currentRepo.qualityScore}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-bold uppercase">Security</div>
                        <div className="text-2xl font-bold text-blue-700">98/100</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-xs text-purple-600 font-bold uppercase">Research</div>
                        <div className="text-2xl font-bold text-purple-700">12 Papers</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-xs text-amber-600 font-bold uppercase">Complexity</div>
                        <div className="text-2xl font-bold text-amber-700">Moderate</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className={`${styles.card} lg:col-span-2`}>
                    <div className={styles.cardTitle}><FileCode size={18} /> README.md</div>
                    <div className={styles.readmeContent}>
                      <h2 className="text-xl font-bold mb-4">{currentRepo.name}</h2>
                      <p className="mb-4">This repository provides a comprehensive toolkit for {currentRepo.description.toLowerCase()}</p>
                      <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                      <ul className="list-disc ml-5 mb-4 space-y-1">
                        <li>Highly optimized model architectures</li>
                        <li>Parallelized data loading pipelines</li>
                        <li>Standardized evaluation metrics</li>
                        <li>Seamless integration with modern ML frameworks</li>
                      </ul>
                      <div className="bg-gray-50 p-4 rounded-lg border font-mono text-sm">
                        $ git clone https://github.com/{currentRepo.owner}/{currentRepo.name}.git
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className={styles.card}>
                      <div className={styles.cardTitle}><Zap size={18} /> Key Modules</div>
                      <div className={styles.moduleList}>
                        {repoDetails?.code_intelligence?.key_modules?.map((m: any, idx: number) => (
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
                        {repoDetails?.code_intelligence?.file_tree?.map((item: any, idx: number) => (
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
                        {repoDetails?.code_intelligence?.file_tree ? (
                          repoDetails.code_intelligence.file_tree.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col">
                              <div
                                className={`flex items-center gap-2 p-1.5 hover:bg-white hover:shadow-sm rounded cursor-pointer text-sm transition-all ${selectedFile === item.name ? 'bg-white shadow-sm font-medium' : ''}`}
                                onClick={() => item.type === 'file' && setSelectedFile(item.name)}
                              >
                                {item.type === 'dir' ? <ChevronRight size={14} className="text-gray-400" /> : <FileCode size={14} className="text-blue-500" />}
                                {item.name}
                              </div>
                              {item.children && (
                                <div className="ml-4 border-l border-gray-100 pl-2 mt-1 space-y-1">
                                  {item.children.map((child: any, cIdx: number) => (
                                    <div
                                      key={cIdx}
                                      className={`flex items-center gap-2 p-1.5 hover:bg-white hover:shadow-sm rounded cursor-pointer text-xs transition-all ${selectedFile === child.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'}`}
                                      onClick={() => setSelectedFile(child.name)}
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
                            {selectedFile.endsWith('.py') ? 'Python' : selectedFile.endsWith('.md') ? 'Markdown' : 'Text'}
                          </div>
                        </div>
                      </div>
                      <pre className="text-xs leading-relaxed">
                        {getFileContent(selectedFile)}
                      </pre>
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
                    {repoDetails?.research_papers ? (
                      repoDetails.research_papers.map((paper: any, idx: number) => (
                        <div key={idx} className={styles.paperCard}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{paper.title}</h4>
                            <span className={styles.paperBadge}>arxiv:{paper.arxiv_id}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-4">{paper.authors} ({paper.year}) — {paper.relevance}</p>
                          <div className="flex flex-wrap gap-2">
                            {paper.mappings.map((m: any, mIdx: number) => (
                              <div key={mIdx} className={styles.mappingItem}>
                                <FileCode size={12} className="text-blue-500" />
                                <span>{m.file}:{m.line} <span className="text-blue-600 font-semibold">{m.symbol}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-400 italic">No research papers mapped yet.</div>
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
                        <div className={`${styles.scoreValue} text-green-600`}>{repoDetails?.security_audit?.vulnerabilities ?? 0}</div>
                        <div className="text-[10px] text-green-500 font-medium">Critical: 0</div>
                      </div>
                      <div className={styles.scoreCard}>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Secrets Found</div>
                        <div className={`${styles.scoreValue} text-green-600`}>{repoDetails?.security_audit?.secrets ?? 'None'}</div>
                        <div className="text-[10px] text-green-500 font-medium">Safe</div>
                      </div>
                      <div className={styles.scoreCard}>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Maintenance</div>
                        <div className={`${styles.scoreValue} text-blue-600`}>{repoDetails?.security_audit?.maintenance ?? 'High'}</div>
                        <div className="text-[10px] text-blue-500 font-medium">Active</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        Quality Intelligence
                      </h5>
                      <div className={styles.warningList}>
                        {repoDetails?.security_audit?.warnings?.map((w: any, idx: number) => (
                          <div key={idx} className={styles.warningItem}>
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="text-sm text-gray-700 font-medium">{w.issue}</span>
                            </div>
                            <span className={`${styles.severityBadge} ${styles.badgeLow}`}>{w.risk} Risk</span>
                          </div>
                        )) || (
                          <div className="text-sm text-gray-400 italic">No warnings found.</div>
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
                    {(repoDetails?.activity_metrics?.commit_history || [40, 70, 45, 90, 65, 80, 50, 40, 30, 85, 95, 75]).map((h: number, i: number) => (
                      <div key={i} className={styles.barWrapper}>
                        <div
                          className={styles.bar}
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 0.05}s`
                          }}
                          title={`Commits: ${h}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={styles.insightCard}>
                      <div className="flex items-center gap-4">
                        <div className={styles.insightIcon}>
                          <History size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Latest Pulse</div>
                          <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                            {repoDetails?.activity_metrics?.latest_commit?.message || 'N/A'}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {repoDetails?.activity_metrics?.latest_commit?.time || 'N/A'}
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
                            {repoDetails?.activity_metrics?.contributors || 0} active contributors
                          </div>
                          <div className="text-[10px] text-green-500 font-bold">
                            {repoDetails?.activity_metrics?.engagement_trend || '0%'} velocity
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
