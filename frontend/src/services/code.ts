import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
    const response = await fetch(`${API_URL}/code/`, {
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
    const response = await fetch(`${API_URL}/code/`, {
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
    const response = await fetch(`${API_URL}/code/${id}`, {
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
    const response = await fetch(`${API_URL}/code/${id}`, {
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
    const response = await fetch(`${API_URL}/code/${id}`, {
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

    const response = await fetch(`${API_URL}/code/${projectId}/upload`, {
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
    const response = await fetch(`${API_URL}/code/${projectId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch project files');
    return response.json();
  },

  async createFile(projectId: string, data: any): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/${projectId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, project_id: projectId }),
    });
    if (!response.ok) throw new Error('Failed to create file');
    return response.json();
  },

  async updateFile(fileId: string, data: any): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/files/${fileId}`, {
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

  async deleteFile(fileId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/code/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete file');
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
