import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// --- Interfaces ---
export interface JobPrepProfile {
    id: string;
    user_id: number;
    current_status: string;
    target_timeline: string;
    experience_level: string;
    preferred_companies: string[];
    work_authorization?: string;
    remote_preference?: string;
    overall_readiness_score: number;
    last_assessment_date?: string;
    placement_mode_enabled: boolean;
    notifications_enabled: boolean;
}

export interface JobPrepTargetRole {
    id: string;
    role_title: string;
    role_category?: string;
    seniority_level?: string;
    readiness_score: number;
    confidence_level: string;
    is_primary: boolean;
}

export interface JobPrepSkill {
    id: string;
    skill_name: string;
    skill_category: string;
    current_level: number;
    target_level: number;
    is_gap: boolean;
    is_critical: boolean;
    evidence_count: number;
}

export interface JobPrepProject {
    id: string;
    title: string;
    description: string;
    tech_stack: string[];
    complexity_score?: number;
    innovation_score?: number;
    interview_value_score?: number;
    talking_points?: string[];
}

// --- Service ---
const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    if (!token) {
        console.warn('No authentication token found. User may need to log in.');
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const jobPrepService = {
    // Profile
    getProfile: async (): Promise<JobPrepProfile> => {
        const response = await axios.get(`${API_BASE}/jobprep/profile`, getAuthHeaders());
        return response.data;
    },
    createProfile: async (data: any): Promise<JobPrepProfile> => {
        const response = await axios.post(`${API_BASE}/jobprep/profile`, data, getAuthHeaders());
        return response.data;
    },
    updateProfile: async (data: any): Promise<JobPrepProfile> => {
        const response = await axios.patch(`${API_BASE}/jobprep/profile`, data, getAuthHeaders());
        return response.data;
    },

    // Roles
    getTargetRoles: async (): Promise<JobPrepTargetRole[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/roles`, getAuthHeaders());
        return response.data;
    },
    createTargetRole: async (data: any): Promise<JobPrepTargetRole> => {
        const response = await axios.post(`${API_BASE}/jobprep/roles`, data, getAuthHeaders());
        return response.data;
    },
    updateTargetRole: async (roleId: string, data: any): Promise<JobPrepTargetRole> => {
        const response = await axios.patch(`${API_BASE}/jobprep/roles/${roleId}`, data, getAuthHeaders());
        return response.data;
    },
    deleteTargetRole: async (roleId: string): Promise<void> => {
        await axios.delete(`${API_BASE}/jobprep/roles/${roleId}`, getAuthHeaders());
    },

    // Skills
    getSkills: async (): Promise<JobPrepSkill[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/skills`, getAuthHeaders());
        return response.data;
    },
    addSkill: async (data: any): Promise<JobPrepSkill> => {
        const response = await axios.post(`${API_BASE}/jobprep/skills`, data, getAuthHeaders());
        return response.data;
    },
    updateSkill: async (skillId: string, data: any): Promise<JobPrepSkill> => {
        const response = await axios.patch(`${API_BASE}/jobprep/skills/${skillId}`, data, getAuthHeaders());
        return response.data;
    },
    deleteSkill: async (skillId: string): Promise<void> => {
        await axios.delete(`${API_BASE}/jobprep/skills/${skillId}`, getAuthHeaders());
    },

    // Projects
    getProjects: async (): Promise<JobPrepProject[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/projects`, getAuthHeaders());
        return response.data;
    },
    createProject: async (data: any): Promise<JobPrepProject> => {
        const response = await axios.post(`${API_BASE}/jobprep/projects`, data, getAuthHeaders());
        return response.data;
    },
    updateProject: async (projectId: string, data: any): Promise<JobPrepProject> => {
        const response = await axios.patch(`${API_BASE}/jobprep/projects/${projectId}`, data, getAuthHeaders());
        return response.data;
    },
    deleteProject: async (projectId: string): Promise<void> => {
        await axios.delete(`${API_BASE}/jobprep/projects/${projectId}`, getAuthHeaders());
    },
    analyzeProject: async (projectId: string): Promise<JobPrepProject> => {
        const response = await axios.post(`${API_BASE}/jobprep/projects/${projectId}/analyze`, {}, getAuthHeaders());
        return response.data;
    },

    // Simulations
    getSimulations: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/simulations`, getAuthHeaders());
        return response.data;
    },
    startSimulation: async (data: any): Promise<any> => {
        const response = await axios.post(`${API_BASE}/jobprep/simulations`, data, getAuthHeaders());
        return response.data;
    },
    getSimulationQuestion: async (roleId: string, difficulty: string): Promise<any> => {
        const response = await axios.get(`${API_BASE}/jobprep/simulations/question?role_id=${roleId}&difficulty=${difficulty}`, getAuthHeaders());
        return response.data;
    },
    evaluateSimulationResponse: async (simId: string, question: string, userResponse: string): Promise<any> => {
        const response = await axios.post(`${API_BASE}/jobprep/simulations/${simId}/evaluate`, {
            question,
            user_response: userResponse
        }, getAuthHeaders());
        return response.data;
    },

    // Role Analysis
    analyzeRole: async (roleId: string): Promise<any> => {
        const response = await axios.post(`${API_BASE}/jobprep/roles/${roleId}/analyze`, {}, getAuthHeaders());
        return response.data;
    },

    // Skill Evidence
    getSkillEvidence: async (skillId: string): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/skills/${skillId}/evidence`, getAuthHeaders());
        return response.data;
    },
    addSkillEvidence: async (skillId: string, data: any): Promise<any> => {
        const response = await axios.post(`${API_BASE}/jobprep/skills/${skillId}/evidence`, data, getAuthHeaders());
        return response.data;
    },

    // Practice
    evaluatePractice: async (topic: string, answer: string): Promise<any> => {
        const response = await axios.post(`${API_BASE}/jobprep/practice/evaluate`, { topic, user_answer: answer }, getAuthHeaders());
        return response.data;
    },

    // Analysis
    getSkillGaps: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/analysis/gaps`, getAuthHeaders());
        return response.data;
    },
    getReadinessHistory: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/jobprep/analysis/readiness-history`, getAuthHeaders());
        return response.data;
    },

    // GitHub Import
    importGithubRepo: async (owner: string, repoName: string): Promise<JobPrepProject> => {
        const response = await axios.post(`${API_BASE}/jobprep/projects/import-github?owner=${owner}&repo_name=${repoName}`, {}, getAuthHeaders());
        return response.data;
    },

    // Skill Evidence Deletion
    deleteSkillEvidence: async (evidenceId: string): Promise<void> => {
        await axios.delete(`${API_BASE}/jobprep/evidence/${evidenceId}`, getAuthHeaders());
    }
};
