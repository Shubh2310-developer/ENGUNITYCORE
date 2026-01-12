import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  status?: 'sending' | 'streaming' | 'done' | 'error';
  retrieved_docs?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export const chatService = {
  async sendMessage(content: string, sessionId?: string) {
    const token = useAuthStore.getState().token;

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, session_id: sessionId }),
      });

      if (response.ok) {
        return response.json();
      }

      throw new Error('Failed to send message');
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  },

  async getSessions() {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/chat/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat sessions');
    }

    return response.json();
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/chat/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat session');
    }

    return response.json();
  },

  async createSession(title: string) {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }

    return response.json();
  },

  async deleteSession(sessionId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/chat/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat session');
    }
  },

  async streamMessage(
    content: string,
    sessionId?: string,
    onChunk?: (chunk: string) => void,
    onMetadata?: (metadata: { session_id: string, retrieved_docs?: string[] }) => void,
    onDone?: (messageId: string, title?: string) => void,
    onError?: (error: string) => void
  ) {
    const token = useAuthStore.getState().token;

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'metadata':
                  onMetadata?.(data);
                  break;
                case 'content':
                  onChunk?.(data.content);
                  break;
                case 'done':
                  onDone?.(data.message_id, data.title);
                  break;
                case 'error':
                  onError?.(data.content);
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat streaming error:', error);
      onError?.(error instanceof Error ? error.message : String(error));
    }
  }
};
