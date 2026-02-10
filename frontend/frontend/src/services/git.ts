export interface GitStatus {
  active_branch: string;
  is_dirty: boolean;
  untracked_files: string[];
  changed_files: string[];
}

export interface GitCommit {
  hexsha: string;
  message: string;
  author: string;
  date: string;
}

export const gitService = {
  async initRepo(projectId: string) {
    const response = await fetch(`http://localhost:8000/api/v1/git/${projectId}/init`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to initialize repository');
    return response.json();
  },

  async getStatus(projectId: string): Promise<GitStatus> {
    const response = await fetch(`http://localhost:8000/api/v1/git/${projectId}/status`);
    if (!response.ok) {
        if (response.status === 404) {
            // Repo not found
            throw new Error('Repository not found');
        }
        throw new Error('Failed to get git status');
    }
    return response.json();
  },

  async commit(projectId: string, message: string, files?: string[]) {
    const response = await fetch(`http://localhost:8000/api/v1/git/${projectId}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, files }),
    });
    if (!response.ok) throw new Error('Failed to commit changes');
    return response.json();
  },

  async getHistory(projectId: string): Promise<GitCommit[]> {
    const response = await fetch(`http://localhost:8000/api/v1/git/${projectId}/history`);
    if (!response.ok) throw new Error('Failed to get commit history');
    return response.json();
  }
};
