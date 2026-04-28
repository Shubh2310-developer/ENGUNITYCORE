import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export interface OmniRAGRequest {
  query: string;
  session_id?: string;
  strategy?: 'direct_generation' | 'vector_rag' | 'graph_rag' | 'recursive_intensive';
  include_metadata?: boolean;
  image_urls?: string[];
  image_ids?: string[];
  turbo_quant?: TurboQuantRequest;
}

export type TurboQuantMode = 'auto' | 'force' | 'off';
export type TurboQuantTarget = 'kv_cache' | 'embeddings' | 'auto';
export type TurboQuantVariant = 'mse' | 'prod';
export type TurboQuantBitWidth = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TurboQuantRequest {
  enabled: boolean;
  mode: TurboQuantMode;
  target: TurboQuantTarget;
  variant: TurboQuantVariant;
  bit_width: TurboQuantBitWidth;
}

export interface TurboQuantRuntimeMetadata {
  requested?: boolean;
  applied?: boolean;
  provider?: string;
  variant?: TurboQuantVariant;
  bit_width?: number;
  compression_ratio?: number;
  estimated_memory_saved_mb?: number;
  quality_score?: number;
  first_token_overhead_ms?: number;
  fallback_reason?: string;
}

export interface OmniRAGMetadataEvent {
  type: 'metadata';
  session_id?: string;
  complexity?: string;
  strategy?: string;
  used_web_search?: boolean;
  retrieved_docs?: string[];
  hyde_doc?: string;
  multi_queries?: string[];
  memory_active?: boolean;
  memory_summary?: string;
  context_compressed?: boolean;
  confidence?: number;
  critique?: string;
  steps?: Array<{ thought: string; output: string }>;
  turbo_quant?: TurboQuantRuntimeMetadata;
}

export interface OmniRAGContentEvent {
  type: 'content';
  content: string;
}

export interface OmniRAGDoneEvent {
  type: 'done';
  message_id?: string;
  title?: string;
  strategy?: string;
}

export interface OmniRAGErrorEvent {
  type: 'error';
  content: string;
}

export type OmniRAGStreamEvent =
  | OmniRAGMetadataEvent
  | OmniRAGContentEvent
  | OmniRAGDoneEvent
  | OmniRAGErrorEvent;

function parseSseEvent(raw: string): OmniRAGStreamEvent | null {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const event = parsed as Record<string, unknown>;
  const eventType = event.type;
  if (
    eventType === 'metadata' ||
    eventType === 'content' ||
    eventType === 'done' ||
    eventType === 'error'
  ) {
    return event as unknown as OmniRAGStreamEvent;
  }

  return null;
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
    steps?: Array<{
      thought: string;
      output: string;
    }>;
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
  private getBaseUrl() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    let url = API_URL;
    if (!url.includes('/api/v1')) {
      url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
    }
    return `${url}/omni-rag`;
  }

  private get baseURL() {
    return this.getBaseUrl();
  }

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
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
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
    onEvent: (event: OmniRAGStreamEvent) => void,
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
            let event: OmniRAGStreamEvent | null = null;
            try {
              event = parseSseEvent(line.trim().slice(6));
            } catch (e) {
              // Only catch JSON parse errors here — let onEvent errors propagate
              console.error('Error parsing SSE event JSON:', e);
              continue;
            }

            if (!event) {
              continue;
            }

            // Call onEvent OUTSIDE the JSON parse try-catch so that errors thrown
            // from inside onEvent (e.g. when handling type:'error' events) propagate
            // to the outer catch block and correctly invoke onError.
            onEvent(event);
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
