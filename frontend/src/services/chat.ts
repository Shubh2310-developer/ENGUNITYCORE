import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
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
  }
};
