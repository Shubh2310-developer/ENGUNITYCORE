import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export interface OmniRAGRequest {
  query: string;
  session_id?: string;
  strategy?: 'direct_generation' | 'vector_rag' | 'graph_rag';
  include_metadata?: boolean;
  image_urls?: string[];
  image_ids?: string[];
}

export interface OmniRAGResponse {
  query: string;
  response: string;
  strategy: string;
  documents: Array<{
    content: string;
    metadata: Record<string, any>;
    score?: number;
  }>;
  metadata: {
    complexity: string;
    retrieval_quality?: string;
    used_web_search?: boolean;
    hyde_doc?: string;
    confidence?: number;
    critique?: string;
    multi_queries?: string[];
    memory_active?: boolean;
    memory_summary?: string;
    context_compressed?: boolean;
  };
  latency: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  chunks: number;
  status: string;
}

class OmniRAGService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')}/api/v1/omni-rag`
    : 'http://localhost:8000/api/v1/omni-rag';

  async query(request: OmniRAGRequest): Promise<OmniRAGResponse> {
    const token = useAuthStore.getState().token;
    const response = await axios.post<OmniRAGResponse>(
      `${this.baseURL}/query`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  async uploadDocument(
    file: File,
    sessionId?: string
  ): Promise<DocumentUploadResponse> {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await axios.post<DocumentUploadResponse>(
      `${this.baseURL}/documents/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  async getStats(): Promise<{ documents: number; chunks: number }> {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${this.baseURL}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async getCommunities(): Promise<{ communities: any[]; total: number }> {
    const token = useAuthStore.getState().token;
    const response = await axios.get(`${this.baseURL}/graph/communities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async rebuildGraph(): Promise<{ status: string; message: string }> {
    const token = useAuthStore.getState().token;
    const response = await axios.post(
      `${this.baseURL}/graph/rebuild`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  async streamQuery(
    request: OmniRAGRequest,
    onEvent: (event: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${this.baseURL}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body reader not available');
      }

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const event = JSON.parse(line.trim().slice(6));
              onEvent(event);
            } catch (e) {
              console.error('Error parsing SSE event:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming query error:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : String(error));
      }
    }
  }
}

export const omniRagService = new OmniRAGService();
