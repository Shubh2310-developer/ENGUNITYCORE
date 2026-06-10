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

export type DecisionStatus = 'tentative' | 'confirmed' | 'revisited' | 'deprecated';
export type DecisionConfidence = 'low' | 'medium' | 'high';
export type DecisionType = 'Architecture' | 'Research' | 'Code' | 'Product' | 'Career' | 'Compliance';
export type DecisionPrivacy = 'private' | 'workspace' | 'public';

export interface Option {
  id: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high';
  dismissed_reason?: string | null;
}

export interface Evidence {
  id: string;
  source_type: 'chat' | 'document' | 'code_run' | 'external_url' | 'research_paper';
  source_id: string;
  excerpt: string;
  credibility: 'primary' | 'secondary' | 'anecdotal';
  added_at: string;
  relevance_score: number;
}

export interface Constraint {
  type: 'budget' | 'time' | 'technical' | 'policy' | 'team_capacity';
  description: string;
  hard_limit: boolean;
  current_status: string;
}

export interface AIFlag {
  id: string;
  flag_type: 'missing_option' | 'weak_evidence' | 'bias_detected' | 'contradiction' | 'sunk_cost_fallacy' | 
             'anchoring_bias' | 'availability_bias' | 'groupthink' | 'optimism_bias' | 
             'status_quo_bias' | 'recency_bias' | 'bandwagon_effect';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggested_action: string;
  dismissed: boolean;
}

export interface RevisitRule {
  trigger_type: 'time_based' | 'metric_based' | 'event_based';
  trigger_value: string;
  notification_enabled: boolean;
}

export interface Decision {
  id: string;
  title: string;
  type: DecisionType;
  workspace_id: string;
  user_id: number;
  created_by?: string;  // Author email, populated by the API from user.email
  created_at: string;
  updated_at: string;
  status: DecisionStatus;
  confidence: DecisionConfidence;
  problem_statement: string;
  context?: string;
  constraints: Constraint[];
  options: Option[];
  evidence: Evidence[];
  tradeoffs: {
    performance: number;
    cost: number;
    complexity: number;
    risk: number;
    scalability: number;
    time_to_implement: number;
  };
  final_decision?: string;
  rationale?: string;
  ai_flags?: AIFlag[];
  revisit_rule?: RevisitRule;
  tags: string[];
  privacy: DecisionPrivacy;
}

const normalizePrivacy = (privacy: unknown): DecisionPrivacy => {
  if (privacy === 'workspace' || privacy === 'public' || privacy === 'private') return privacy;
  if (privacy === 'team') return 'workspace';
  return 'private';
};

const normalizeDecision = (decision: any): Decision => ({
  ...decision,
  privacy: normalizePrivacy(decision?.privacy),
});

export class DecisionAIError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DecisionAIError';
    this.status = status;
  }
}

export const decisionService = {
  async getDecisions() {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${FINAL_API_URL}/decisions/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      throw new Error(`Failed to load decisions (HTTP ${response.status}).`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeDecision);
  },

  async getDecision(id: string): Promise<Decision | null> {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${FINAL_API_URL}/decisions/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return normalizeDecision(data);
      }
      return null;
    } catch (error) {
      console.error('Decision service error:', error);
      return null;
    }
  },

  async createDecision(decision: Partial<Decision>, opts?: { idempotencyKey?: string }) {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${FINAL_API_URL}/decisions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(opts?.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {}),
        },
        body: JSON.stringify(decision),
      });

      if (response.ok) {
        const data = await response.json();
        return normalizeDecision(data);
      }
      throw new Error('Failed to create decision');
    } catch (error) {
      console.error('Decision service error:', error);
      throw error;
    }
  },

  async updateDecision(id: string, updates: Partial<Decision>) {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${FINAL_API_URL}/decisions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        return normalizeDecision(data);
      }
      throw new Error('Failed to update decision');
    } catch (error) {
      console.error('Decision service error:', error);
      throw error;
    }
  },

  async analyzeDecision(decision: Partial<Decision>): Promise<AIFlag[]> {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${FINAL_API_URL}/decisions/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(decision),
      });

      if (response.ok) {
        return response.json();
      }

      let message = 'Decision analysis failed';
      try {
        const body = await response.json();
        message = body?.detail?.message || body?.detail || message;
      } catch {
        message = `Decision analysis failed with status ${response.status}`;
      }

      throw new DecisionAIError(message, response.status);
    } catch (error) {
      console.error('Decision analysis error:', error);
      if (error instanceof DecisionAIError) {
        throw error;
      }
      throw new DecisionAIError('Decision analysis unavailable. Please retry.', 0);
    }
  },

  async scanWorkspace(): Promise<{ evidence: Evidence[] }> {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${FINAL_API_URL}/decisions/scan-workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to run codebase scan');
    } catch (error) {
      console.error('Scan workspace error:', error);
      throw error;
    }
  }
};
