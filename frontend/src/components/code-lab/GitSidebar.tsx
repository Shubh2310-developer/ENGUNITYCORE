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
      <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-void-950 text-starlight-400">
        <GitBranch className="w-12 h-12 mb-4 opacity-20" />
        <p className="mb-4 text-sm">No Git repository found.</p>
        <button
          onClick={handleInit}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-xs font-bold transition-colors"
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
    <div className="h-full flex flex-col bg-void-950 text-starlight-400 text-sm">
      <div className="p-3 font-semibold text-xs uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Source Control
        </div>
        <button
          onClick={() => refreshGitStatus(projectId)}
          className={`p-1 hover:bg-white/5 rounded ${isGitLoading ? 'animate-spin' : ''}`}
          title="Refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Status Section */}
        <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono text-cyber-teal">
                    Branch: {gitStatus?.active_branch || '...'}
                </div>
            </div>

            <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Message (e.g. 'Fix bug')"
                className="w-full bg-void-900 border border-white/10 rounded p-2 text-xs text-starlight-200 focus:outline-none focus:border-cyber-teal/50 mb-2 resize-none h-20"
            />

            <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || isGitLoading || stagedFiles.length === 0}
                className="w-full py-1.5 bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 border border-primary-600/50 rounded text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Check className="w-3 h-3" />
                Commit Staged
            </button>
        </div>

        {/* Staged Changes Section */}
        <div className="border-b border-white/5">
            <div className="p-2 bg-void-900 font-medium text-xs flex items-center gap-2">
                <Check className="w-3 h-3" />
                Staged Changes ({stagedFilesList.length})
            </div>
            <div className="p-2 space-y-1">
                {stagedFilesList.map(file => (
                    <div key={file.name} className="flex items-center gap-2 text-xs hover:bg-white/5 p-1 rounded cursor-pointer group">
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                unstageFile(file.name);
                            }}
                            className="p-0.5 hover:bg-white/10 rounded"
                            title="Unstage"
                        >
                            <Minus className="w-3 h-3 text-starlight-400" />
                        </button>
                        <span className={`${file.status === 'M' ? 'text-yellow-500' : 'text-green-500'} font-mono`}>{file.status}</span>
                        <span className="truncate flex-1 text-starlight-300">{file.name}</span>
                    </div>
                ))}
                 {stagedFilesList.length === 0 && (
                    <div className="text-xs text-starlight-400/50 italic px-2">No staged changes</div>
                )}
            </div>
        </div>

        {/* Changes Section */}
        <div className="border-b border-white/5">
            <div className="p-2 bg-void-900 font-medium text-xs flex items-center gap-2">
                <Plus className="w-3 h-3" />
                Changes ({unstagedFilesList.length})
            </div>
            <div className="p-2 space-y-1">
                {unstagedFilesList.map(file => (
                    <div key={file.name} className="flex items-center gap-2 text-xs hover:bg-white/5 p-1 rounded cursor-pointer group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                stageFile(file.name);
                            }}
                            className="p-0.5 hover:bg-white/10 rounded"
                            title="Stage"
                        >
                            <Plus className="w-3 h-3 text-starlight-400" />
                        </button>
                        <span className={`${file.status === 'M' ? 'text-yellow-500' : 'text-green-500'} font-mono`}>{file.status}</span>
                        <span className="truncate flex-1 text-starlight-300">{file.name}</span>
                    </div>
                ))}
                {unstagedFilesList.length === 0 && (
                    <div className="text-xs text-starlight-400/50 italic px-2">No changes detected</div>
                )}
            </div>
        </div>

        {/* History Section */}
        <div>
            <div className="p-2 bg-void-900 font-medium text-xs flex items-center gap-2">
                <Clock className="w-3 h-3" />
                History
            </div>
            <div className="p-2 space-y-3">
                {gitHistory.map((commit) => (
                    <div key={commit.hexsha} className="text-xs border-l-2 border-white/10 pl-3 py-1">
                        <div className="text-starlight-200 font-medium truncate" title={commit.message}>
                            {commit.message}
                        </div>
                        <div className="flex justify-between text-[10px] text-starlight-400/60 mt-1">
                            <span>{commit.author}</span>
                            <span className="font-mono">{commit.hexsha.substring(0, 7)}</span>
                        </div>
                    </div>
                ))}
                {gitHistory.length === 0 && (
                    <div className="text-xs text-starlight-400/50 italic px-2">No commit history</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
