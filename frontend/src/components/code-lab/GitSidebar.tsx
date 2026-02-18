import React, { useEffect, useState } from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { GitBranch, RefreshCw, Check, Plus, Clock, Minus } from 'lucide-react';

export const GitSidebar = () => {
  const {
    activeFileId,
    gitStatus,
    gitHistory,
    refreshGitStatus,
    commitChanges,
    initGitRepo,
    isGitLoading,
    fetchGitHistory,
    stageFile,
    unstageFile,
    stagedFiles
  } = useCodeStore();

  const [commitMessage, setCommitMessage] = useState('');
  // In a real app, we would get project ID from the store or route
  const projectId = 'default-project';

  useEffect(() => {
    refreshGitStatus(projectId);
    fetchGitHistory(projectId);
  }, [projectId]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    await commitChanges(projectId, commitMessage);
    setCommitMessage('');
  };

  const handleInit = async () => {
    await initGitRepo(projectId);
  };

  if (!gitStatus && !isGitLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-[#F8FAFC] text-[#64748B] shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
        <GitBranch className="w-12 h-12 mb-4 opacity-20" />
        <p className="mb-4 text-sm font-medium">No Git repository found.</p>
        <button
          onClick={handleInit}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-bold transition-all shadow-md active:scale-95"
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  const allChangedFiles = [
      ...(gitStatus?.changed_files || []).map(f => ({ name: f, status: 'M' })),
      ...(gitStatus?.untracked_files || []).map(f => ({ name: f, status: 'U' }))
  ];

  const unstagedFilesList = allChangedFiles.filter(f => !stagedFiles.includes(f.name));
  const stagedFilesList = allChangedFiles.filter(f => stagedFiles.includes(f.name));

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] text-[#1E293B] text-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <div className="px-3 py-2 border-b border-[#CBD5E1] flex items-center justify-end bg-[#F1F5F9]">
        <button
          onClick={() => refreshGitStatus(projectId)}
          className={`p-1 hover:bg-[#E2E8F0] rounded transition-colors ${isGitLoading ? 'animate-spin' : ''}`}
          title="Refresh Status"
        >
          <RefreshCw className="w-3 h-3 text-[#475569]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* Status Section */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
            <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold font-mono text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    BRANCH: {gitStatus?.active_branch || '...'}
                </div>
            </div>

            <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Message (e.g. 'Fix regression in auth')"
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 mb-3 resize-none h-20 shadow-sm transition-all"
            />

            <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || isGitLoading || stagedFiles.length === 0}
                className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
            >
                <Check className="w-3.5 h-3.5" />
                Commit Staged
            </button>
        </div>

        {/* Staged Changes Section */}
        <div className="border-b border-[#E2E8F0]">
            <div className="p-2.5 bg-[#F1F5F9] font-bold text-[10px] uppercase tracking-wider text-[#64748B] flex items-center gap-2 border-b border-[#E2E8F0]">
                <Check className="w-3 h-3 text-[#2563EB]" />
                Staged Changes ({stagedFilesList.length})
            </div>
            <div className="p-1 space-y-0.5">
                {stagedFilesList.map(file => (
                    <div key={file.name} className="flex items-center gap-2 text-xs hover:bg-[#F1F5F9] p-2 rounded-md cursor-pointer group transition-colors">
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                unstageFile(file.name);
                            }}
                            className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#2563EB] transition-colors"
                            title="Unstage file"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className={`${file.status === 'M' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} font-bold font-mono text-[10px] px-1 rounded border border-black/5 w-5 text-center`}>{file.status}</span>
                        <span className="truncate flex-1 text-[#1E293B] font-medium">{file.name}</span>
                    </div>
                ))}
                 {stagedFilesList.length === 0 && (
                    <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest text-center py-4 opacity-50">No staged changes</div>
                )}
            </div>
        </div>

        {/* Changes Section */}
        <div className="border-b border-[#E2E8F0]">
            <div className="p-2.5 bg-[#F1F5F9] font-bold text-[10px] uppercase tracking-wider text-[#64748B] flex items-center gap-2 border-b border-[#E2E8F0]">
                <Plus className="w-3 h-3 text-[#2563EB]" />
                Changes ({unstagedFilesList.length})
            </div>
            <div className="p-1 space-y-0.5">
                {unstagedFilesList.map(file => (
                    <div key={file.name} className="flex items-center gap-2 text-xs hover:bg-[#F1F5F9] p-2 rounded-md cursor-pointer group transition-colors">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                stageFile(file.name);
                            }}
                            className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#2563EB] transition-colors"
                            title="Stage file"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                        <span className={`${file.status === 'M' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} font-bold font-mono text-[10px] px-1 rounded border border-black/5 w-5 text-center`}>{file.status}</span>
                        <span className="truncate flex-1 text-[#1E293B] font-medium">{file.name}</span>
                    </div>
                ))}
                {unstagedFilesList.length === 0 && (
                    <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest text-center py-4 opacity-50">Clean working tree</div>
                )}
            </div>
        </div>

        {/* History Section */}
        <div className="bg-[#F8FAFC]">
            <div className="p-2.5 bg-[#F1F5F9] font-bold text-[10px] uppercase tracking-wider text-[#64748B] flex items-center gap-2 border-b border-[#E2E8F0]">
                <Clock className="w-3 h-3 text-[#2563EB]" />
                History
            </div>
            <div className="p-3 space-y-3">
                {gitHistory.map((commit) => (
                    <div key={commit.hexsha} className="text-xs border-l-2 border-[#CBD5E1] hover:border-[#2563EB] pl-3 py-1.5 transition-colors bg-white rounded-r-md shadow-sm border border-[#E2E8F0]">
                        <div className="text-[#0F172A] font-bold truncate leading-tight mb-1" title={commit.message}>
                            {commit.message}
                        </div>
                        <div className="flex justify-between text-[10px] text-[#64748B] font-bold uppercase tracking-tight">
                            <span>{commit.author}</span>
                            <span className="font-mono text-[#2563EB] bg-blue-50 px-1 rounded">{commit.hexsha.substring(0, 7)}</span>
                        </div>
                    </div>
                ))}
                {gitHistory.length === 0 && (
                    <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest text-center py-4 opacity-50">No history</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
