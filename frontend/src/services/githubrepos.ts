const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const githubService = {
  async getRepositories(token: string) {
    const response = await fetch(`${API_URL}/githubrepos/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return response.json();
  },

  async getRepositoryDetails(token: string, repoId: string) {
    const response = await fetch(`${API_URL}/githubrepos/${repoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repository details');
    }

    return response.json();
  },

  async triggerAnalysis(token: string, repoId: string) {
    const response = await fetch(`${API_URL}/githubrepos/${repoId}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to trigger analysis');
    }

    return response.json();
  },

  async executeRepository(token: string, repoId: string, useGpu: boolean = false) {
    const response = await fetch(`${API_URL}/githubrepos/${repoId}/execute?use_gpu=${useGpu}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to execute repository code');
    }

    return response.json();
  },

  async bulkTriggerAnalysis(token: string, repoIds: string[]) {
    const response = await fetch(`${API_URL}/githubrepos/bulk/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repo_ids: repoIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to trigger bulk analysis');
    }

    return response.json();
  },

  async runAiTool(token: string, repoId: string, toolType: string) {
    const response = await fetch(`${API_URL}/githubrepos/${repoId}/ai-tool?tool_type=${toolType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to run AI tool');
    }

    return response.json();
  },
};
