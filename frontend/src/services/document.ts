import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Document {
  id: string;
  filename: string;
  file_type: string;
  size: number;
  created_at: string;
}

export const documentService = {
  async upload(file: File): Promise<Document> {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
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
  }
};
