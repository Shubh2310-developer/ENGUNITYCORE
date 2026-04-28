import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getBaseUrl = () => {
  let url = API_URL;
  if (!url.includes('/api/v1')) {
    url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
  }
  return url;
};

const FINAL_API_URL = getBaseUrl();

export type WellbeingSignal = 'late_night' | 'frustration' | 'marathon' | 'overwork';
export type WellbeingStatus = 'healthy' | 'caution' | 'concern';
export type WellbeingInteractionEvent = 'viewed' | 'dismissed' | 'action_clicked' | 'break_started' | 'pomodoro_completed';

export interface WellbeingIntervention {
  type: 'break_reminder' | 'encouragement' | 'study_tip' | 'focus_session' | 'cooldown';
  message: string;
  action: string;
  duration?: number;
  tip?: string;
}

export interface WellbeingCheck {
  signals_detected: WellbeingSignal[];
  overall_status: WellbeingStatus;
  stress_score: number;
  intervention: WellbeingIntervention | null;
  message: string;
  tips: string[];
}

export interface PomodoroSessionRequest {
  focus_minutes: number;
  break_minutes: number;
  rounds: number;
  topic?: string;
}

export interface PomodoroSessionResponse {
  status: string;
  focus_minutes: number;
  break_minutes: number;
  topic?: string;
}

export interface WellbeingEventLogRequest {
  event_type: WellbeingInteractionEvent;
  context: Record<string, string | number | boolean | null | undefined>;
}

class WellbeingService {
  private getAuthHeaders() {
    const token = useAuthStore.getState().token;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async checkWellbeing(period: '24h' | '7d' | '30d' = '24h', options?: { signal?: AbortSignal }): Promise<WellbeingCheck> {
    const response = await axios.get(`${FINAL_API_URL}/wellbeing/check`, {
      headers: this.getAuthHeaders(),
      params: { period },
      signal: options?.signal,
    });
    return response.data;
  }

  async startPomodoro(payload: PomodoroSessionRequest): Promise<PomodoroSessionResponse> {
    const response = await axios.post(`${FINAL_API_URL}/wellbeing/pomodoro`, payload, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async logWellbeingEvent(payload: WellbeingEventLogRequest): Promise<{ ok: boolean }> {
    const response = await axios.post(`${FINAL_API_URL}/wellbeing/event`, payload, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const wellbeingService = new WellbeingService();
