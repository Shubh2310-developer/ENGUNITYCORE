export interface GitStatus {
  active_branch: string;
  is_dirty: boolean;
  changed_files: string[];
  untracked_files: string[];
}

export interface GitCommit {
  hexsha: string;
  message: string;
  author: string;
  date: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const gitService = {
  async initRepo(projectId: string): Promise<void> {
    const response = await fetch(`${API_URL}/git/${projectId}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to initialize repository');
  },

  async getStatus(projectId: string): Promise<GitStatus> {
    const response = await fetch(`${API_URL}/git/${projectId}/status`);
    if (!response.ok) throw new Error('Failed to get git status');
    return await response.json();
  },

  async commit(projectId: string, message: string, files: string[] = ['.']): Promise<void> {
    const response = await fetch(`${API_URL}/git/${projectId}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, files })
    });
    if (!response.ok) throw new Error('Failed to commit changes');
  },

  async getHistory(projectId: string): Promise<GitCommit[]> {
    const response = await fetch(`${API_URL}/git/${projectId}/log`);
    if (!response.ok) throw new Error('Failed to fetch git history');
    return await response.json();
  }
};
