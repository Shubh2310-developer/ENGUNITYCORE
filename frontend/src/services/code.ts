import { useAuthStore } from '@/stores/authStore';

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

export interface CodeProject {
  id: string;
  name: string;
  description?: string;
  language?: string;
  repository_url?: string;
  storage_path?: string;
  created_at: string;
  updated_at: string;
}

export interface CodeProjectCreate {
  name: string;
  description?: string;
  language?: string;
  repository_url?: string;
}

export interface CodeProjectUpdate {
  name?: string;
  description?: string;
  language?: string;
  repository_url?: string;
}

export const codeService = {
  async getProjects(): Promise<CodeProject[]> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch code projects');
    }

    return response.json();
  },

  async createProject(data: CodeProjectCreate): Promise<CodeProject> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create project');
    }

    return response.json();
  },

  async getProject(id: string): Promise<CodeProject> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  },

  async updateProject(id: string, data: CodeProjectUpdate): Promise<CodeProject> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update project');
    }

    return response.json();
  },

  async deleteProject(id: string): Promise<CodeProject> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }

    return response.json();
  },

  async uploadFiles(projectId: string, file: File): Promise<CodeProject> {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${FINAL_API_URL}/code/${projectId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload project files');
    }

    return response.json();
  },

  async getProjectFiles(projectId: string): Promise<any[]> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/${projectId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch project files');
    return response.json();
  },

  async getFile(projectId: string, fileId: string): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/${projectId}/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch file');
    return response.json();
  },

  async createFile(projectId: string, data: any): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/${projectId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create file');
    return response.json();
  },

  async updateFile(projectId: string, fileId: string, data: any): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/${projectId}/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update file');
    return response.json();
  },

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete file');
  },

  async analyzeCode(projectId: string, fileId?: string): Promise<any> {
    const token = useAuthStore.getState().token;
    const url = fileId 
      ? `${API_URL}/code/${projectId}/ai/analyze?file_id=${fileId}`
      : `${FINAL_API_URL}/code/${projectId}/ai/analyze`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to analyze code');
    return response.json();
  },

  async getCodeSuggestions(projectId: string, fileId: string, context: string, cursorPosition: any): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/code/${projectId}/ai/suggest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        context,
        cursor_position: cursorPosition
      }),
    });
    if (!response.ok) throw new Error('Failed to get suggestions');
    return response.json();
  },

  async searchCode(projectId: string, query: string): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/${projectId}/search?query=${encodeURIComponent(query)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to search code');
    return response.json();
  },

  async refineCode(data: { file_content: string; language: string; instruction: string; project_id?: string }): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/refine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to refine code');
    }
    return response.json();
  }
};
