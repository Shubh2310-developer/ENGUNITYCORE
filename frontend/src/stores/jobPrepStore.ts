import { create } from 'zustand';
import { jobPrepService, JobPrepProfile, JobPrepTargetRole, JobPrepSkill, JobPrepProject } from '@/services/jobprep';

interface JobPrepState {
  profile: JobPrepProfile | null;
  targetRoles: JobPrepTargetRole[];
  skills: JobPrepSkill[];
  projects: JobPrepProject[];
  simulations: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchTargetRoles: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchSimulations: () => Promise<void>;
  fetchSkillGaps: () => Promise<any[]>;
  fetchReadinessHistory: () => Promise<any[]>;

  createProfile: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;

  addTargetRole: (data: any) => Promise<void>;
  deleteTargetRole: (roleId: string) => Promise<void>;

  addSkill: (data: any) => Promise<void>;
  deleteSkill: (skillId: string) => Promise<void>;

  createProject: (data: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  analyzeProject: (projectId: string) => Promise<void>;
  importGithubRepo: (owner: string, repoName: string) => Promise<void>;
  analyzeRole: (roleId: string) => Promise<void>;
  fetchSkillEvidence: (skillId: string) => Promise<any[]>;
  addSkillEvidence: (skillId: string, data: any) => Promise<void>;
  deleteSkillEvidence: (evidenceId: string) => Promise<void>;
  evaluatePractice: (topic: string, answer: string) => Promise<any>;
}

export const useJobPrepStore = create<JobPrepState>((set, get) => ({
  profile: null,
  targetRoles: [],
  skills: [],
  projects: [],
  simulations: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await jobPrepService.getProfile();
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTargetRoles: async () => {
    try {
      const targetRoles = await jobPrepService.getTargetRoles();
      set({ targetRoles });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSkills: async () => {
    try {
      const skills = await jobPrepService.getSkills();
      set({ skills });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await jobPrepService.getProjects();
      set({ projects });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSimulations: async () => {
    try {
      const simulations = await jobPrepService.getSimulations();
      set({ simulations });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSkillGaps: async () => {
    try {
      return await jobPrepService.getSkillGaps();
    } catch (err: any) {
      set({ error: err.message });
      return [];
    }
  },

  fetchReadinessHistory: async () => {
    try {
      return await jobPrepService.getReadinessHistory();
    } catch (err: any) {
      set({ error: err.message });
      return [];
    }
  },

  createProfile: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await jobPrepService.createProfile(data);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateProfile: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await jobPrepService.updateProfile(data);
      set({ profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addTargetRole: async (data: any) => {
    try {
      const role = await jobPrepService.createTargetRole(data);
      set((state) => ({ targetRoles: [...state.targetRoles, role] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteTargetRole: async (roleId: string) => {
    try {
      await jobPrepService.deleteTargetRole(roleId);
      set((state) => ({ targetRoles: state.targetRoles.filter(r => r.id !== roleId) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addSkill: async (data: any) => {
    try {
      const skill = await jobPrepService.addSkill(data);
      set((state) => ({ skills: [...state.skills, skill] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteSkill: async (skillId: string) => {
    try {
      await jobPrepService.deleteSkill(skillId);
      set((state) => ({ skills: state.skills.filter(s => s.id !== skillId) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createProject: async (data: any) => {
    try {
      const project = await jobPrepService.createProject(data);
      set((state) => ({ projects: [...state.projects, project] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await jobPrepService.deleteProject(projectId);
      set((state) => ({ projects: state.projects.filter(p => p.id !== projectId) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  analyzeProject: async (projectId: string) => {
    try {
      const updatedProject = await jobPrepService.analyzeProject(projectId);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  importGithubRepo: async (owner: string, repoName: string) => {
    set({ isLoading: true });
    try {
      const project = await jobPrepService.importGithubRepo(owner, repoName);
      set((state) => ({ projects: [...state.projects, project], isLoading: false }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  analyzeRole: async (roleId: string) => {
    try {
      await jobPrepService.analyzeRole(roleId);
      await get().fetchTargetRoles(); // Refresh roles to get updated analysis
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchSkillEvidence: async (skillId: string) => {
    try {
      return await jobPrepService.getSkillEvidence(skillId);
    } catch (err: any) {
      set({ error: err.message });
      return [];
    }
  },

  addSkillEvidence: async (skillId: string, data: any) => {
    try {
      await jobPrepService.addSkillEvidence(skillId, data);
      await get().fetchSkills(); // Refresh skills to update evidence count
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteSkillEvidence: async (evidenceId: string) => {
    try {
      await jobPrepService.deleteSkillEvidence(evidenceId);
      await get().fetchSkills(); // Refresh skills to update evidence count
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  evaluatePractice: async (topic: string, answer: string) => {
    try {
      return await jobPrepService.evaluatePractice(topic, answer);
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },
}));
