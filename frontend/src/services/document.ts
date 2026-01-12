import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  content?: string;
  filename?: string;
  file_type?: string;
  size?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  title: string;
  type?: string;
  status?: string;
  content?: string;
}

export interface DocumentUpdate {
  title?: string;
  type?: string;
  status?: string;
  content?: string;
}

export const documentService = {
  async upload(file: File, title?: string, type: string = 'note', sessionId?: string): Promise<Document> {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('type', type);
    if (sessionId) formData.append('session_id', sessionId);

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload document');
    }

    return response.json();
  },

  async createDocument(data: DocumentCreate): Promise<Document> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create document');
    }

    return response.json();
  },

  async getDocuments(): Promise<Document[]> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },

  async getDocument(id: string): Promise<Document> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.json();
  },

  async updateDocument(id: string, data: DocumentUpdate): Promise<Document> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update document');
    }

    return response.json();
  },

  async deleteDocument(id: string): Promise<Document> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    return response.json();
  },

  async getThinkingTrace(id: string): Promise<any[]> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/${id}/trace`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch thinking trace');
    }

    return response.json();
  },

  async addThinkingTrace(id: string, event: string, eventType: string, details?: string): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/documents/${id}/trace`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: id,
        event,
        event_type: eventType,
        details
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add thinking trace entry');
    }

    return response.json();
  }
};
