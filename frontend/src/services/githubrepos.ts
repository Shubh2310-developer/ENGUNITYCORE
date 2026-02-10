const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Ensure API_URL ends with /api/v1
const getBaseUrl = () => {
  let url = API_URL;
  if (!url.includes('/api/v1')) {
    url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
  }
  return url;
};

const FINAL_API_URL = getBaseUrl();

// Enhanced logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[GitHubService] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[GitHubService] ${message}`, error || '');
  },
  time: (label: string) => {
    console.time(`[GitHubService] ${label}`);
  },
  timeEnd: (label: string) => {
    console.timeEnd(`[GitHubService] ${label}`);
  }
};

export const githubService = {
  async getRepositories(token: string) {
    log.time('getRepositories');
    log.info('Fetching repositories from database');
    
    try {
      const response = await fetch(`${FINAL_API_URL}/githubrepos/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        log.error(`Failed to fetch repositories: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();
      log.timeEnd('getRepositories');
      log.info(`✅ Fetched ${data.length} repositories`);
      return data;
    } catch (error) {
      log.timeEnd('getRepositories');
      log.error('Error fetching repositories:', error);
      throw error;
    }
  },

  async getRepositoryDetails(token: string, repoId: string) {
    log.time(`getRepositoryDetails-${repoId}`);
    log.info(`Fetching details for repository: ${repoId}`);
    
    try {
      const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        log.error(`Failed to fetch repository details: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch repository details');
      }

      const data = await response.json();
      log.timeEnd(`getRepositoryDetails-${repoId}`);
      log.info(`✅ Repository details fetched`, { repoId, hasAnalysis: !!data.analysis });
      return data;
    } catch (error) {
      log.timeEnd(`getRepositoryDetails-${repoId}`);
      log.error(`Error fetching repository details for ${repoId}:`, error);
      throw error;
    }
  },

  async triggerAnalysis(token: string, repoId: string) {
    log.info(`Triggering AI analysis for repository: ${repoId}`);
    
    try {
      const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        log.error(`Failed to trigger analysis: ${response.status} ${response.statusText}`);
        throw new Error('Failed to trigger analysis');
      }

      const data = await response.json();
      log.info(`✅ Analysis triggered successfully for ${repoId}`, data);
      return data;
    } catch (error) {
      log.error(`Error triggering analysis for ${repoId}:`, error);
      throw error;
    }
  },

  async executeRepository(token: string, repoId: string, useGpu: boolean = false) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}/execute?use_gpu=${useGpu}`, {
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
    const response = await fetch(`${FINAL_API_URL}/githubrepos/bulk/analyze`, {
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
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}/ai-tool?tool_type=${toolType}`, {
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

  async importRepository(token: string, owner: string, repoName: string, githubToken?: string) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner,
        repo_name: repoName,
        github_token: githubToken
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to import repository');
    }

    return response.json();
  },

  async updateRepository(token: string, repoId: string, data: any) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update repository');
    }

    return response.json();
  },

  async deleteRepository(token: string, repoId: string) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete repository');
    }

    return response.json();
  },

  async syncRepository(token: string, repoId: string) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to sync repository');
    }

    return response.json();
  },

  async getFileContent(token: string, repoId: string, path: string) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}/files/content?path=${encodeURIComponent(path)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file content');
    }

    return response.json();
  },

  async getDownloadUrl(token: string, repoId: string) {
    const response = await fetch(`${FINAL_API_URL}/githubrepos/${repoId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch download URL');
    }

    return response.json();
  },

  async getUserGithubRepositories(token: string, githubToken?: string) {
    const url = new URL(`${FINAL_API_URL}/githubrepos/user-repos`);
    if (githubToken) {
      url.searchParams.append('github_token', githubToken);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub repositories');
    }

    return response.json();
  },
};
