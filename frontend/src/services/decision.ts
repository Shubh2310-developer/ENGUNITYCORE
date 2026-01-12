import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export type DecisionStatus = 'tentative' | 'confirmed' | 'revisited' | 'deprecated';
export type DecisionConfidence = 'low' | 'medium' | 'high';
export type DecisionType = 'Architecture' | 'Research' | 'Code' | 'Product' | 'Career' | 'Compliance';

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
  flag_type: 'missing_option' | 'weak_evidence' | 'bias_detected' | 'contradiction' | 'sunk_cost_fallacy';
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
  created_by: string;
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
  privacy: 'private' | 'team' | 'public';
}

export const decisionService = {
  async getDecisions() {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${API_URL}/decisions/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }
      if (response.status === 404) {
        console.warn('Decisions endpoint not found, feature might be in frontend-only mode');
        return [];
      }
      return []; // Return empty array if not found or error for now (frontend mockable)
    } catch (error) {
      console.error('Decision service error:', error);
      return [];
    }
  },

  async getDecision(id: string): Promise<Decision | null> {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${API_URL}/decisions/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }
      return null;
    } catch (error) {
      console.error('Decision service error:', error);
      return null;
    }
  },

  async createDecision(decision: Partial<Decision>) {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${API_URL}/decisions/`, {
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
      throw new Error('Failed to create decision');
    } catch (error) {
      console.error('Decision service error:', error);
      throw error;
    }
  },

  async updateDecision(id: string, updates: Partial<Decision>) {
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${API_URL}/decisions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to update decision');
    } catch (error) {
      console.error('Decision service error:', error);
      throw error;
    }
  }
};
