/**
 * Export Templates for JobPrep Feature
 * Multiple professional styles for resume/profile exports
 */

import jsPDF from 'jspdf';

export interface TemplateOptions {
  style: 'professional' | 'creative' | 'minimal' | 'ats-friendly';
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

export interface ExportProfile {
  profile: any;
  roles: any[];
  skills: any[];
  projects: any[];
  simulations?: any[];
}

/**
 * Professional Template - Traditional corporate style
 */
export class ProfessionalTemplate {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;
  private yPosition = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generate(data: ExportProfile): Blob {
    this.addHeader(data.profile);
    this.addProfile(data.profile);
    this.addRoles(data.roles);
    this.addSkills(data.skills);
    this.addProjects(data.projects);
    this.addFooter();
    return this.doc.output('blob');
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.yPosition + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  private addHeader(profile: any) {
    // Header with name and title
    this.doc.setFillColor(41, 98, 255); // Blue header
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Professional Profile', this.pageWidth / 2, 20, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Generated ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 30, { align: 'center' });
    
    this.yPosition = 50;
    this.doc.setTextColor(0, 0, 0);
  }

  private addProfile(profile: any) {
    if (!profile) return;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 98, 255);
    this.doc.text('Profile Overview', this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);

    const profileData = [
      ['Current Status:', profile.current_status || 'N/A'],
      ['Experience Level:', profile.experience_level || 'N/A'],
      ['Readiness Score:', `${profile.overall_readiness_score || 0}%`],
      ['Target Timeline:', profile.target_timeline || 'N/A']
    ];

    profileData.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin, this.yPosition);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, this.margin + 50, this.yPosition);
      this.yPosition += 6;
    });

    this.yPosition += 8;
  }

  private addRoles(roles: any[]) {
    if (!roles || roles.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 98, 255);
    this.doc.text('Target Roles', this.margin, this.yPosition);
    this.yPosition += 10;

    roles.forEach((role, index) => {
      this.checkPageBreak(25);

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`${index + 1}. ${role.role_title}`, this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(`${role.role_category} • ${role.seniority_level}`, this.margin + 5, this.yPosition);
      this.yPosition += 5;

      if (role.market_salary_range) {
        this.doc.text(`Salary: ${role.market_salary_range}`, this.margin + 5, this.yPosition);
        this.yPosition += 5;
      }

      this.yPosition += 3;
    });

    this.yPosition += 5;
  }

  private addSkills(skills: any[]) {
    if (!skills || skills.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 98, 255);
    this.doc.text('Skills Matrix', this.margin, this.yPosition);
    this.yPosition += 10;

    // Group by category
    const skillsByCategory = skills.reduce((acc: any, skill: any) => {
      const category = skill.skill_category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});

    Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
      this.checkPageBreak(20);

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(category, this.margin, this.yPosition);
      this.yPosition += 6;

      categorySkills.forEach((skill: any) => {
        this.checkPageBreak(5);

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(60, 60, 60);
        
        const level = '●'.repeat(skill.current_level) + '○'.repeat(5 - skill.current_level);
        this.doc.text(`${skill.skill_name}: ${level}`, this.margin + 5, this.yPosition);
        this.yPosition += 5;
      });

      this.yPosition += 3;
    });

    this.yPosition += 5;
  }

  private addProjects(projects: any[]) {
    if (!projects || projects.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 98, 255);
    this.doc.text('Projects Portfolio', this.margin, this.yPosition);
    this.yPosition += 10;

    projects.forEach((project, index) => {
      this.checkPageBreak(30);

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`${index + 1}. ${project.title}`, this.margin, this.yPosition);
      this.yPosition += 6;

      if (project.description) {
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(60, 60, 60);
        const desc = this.doc.splitTextToSize(project.description, this.pageWidth - 2 * this.margin - 5);
        this.doc.text(desc, this.margin + 5, this.yPosition);
        this.yPosition += desc.length * 5;
      }

      if (project.tech_stack && project.tech_stack.length > 0) {
        this.doc.setFontSize(9);
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(`Tech: ${project.tech_stack.join(', ')}`, this.margin + 5, this.yPosition);
        this.yPosition += 5;
      }

      this.yPosition += 5;
    });
  }

  private addFooter() {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(
        `Generated by Engunity JobPrep • Page ${i} of ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }
}

/**
 * Creative Template - Modern, colorful design with visual elements
 */
export class CreativeTemplate {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;
  private yPosition = 20;
  private colors = {
    primary: [124, 58, 237], // Purple
    secondary: [236, 72, 153], // Pink
    accent: [34, 211, 238], // Cyan
    text: [30, 41, 59]
  };

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generate(data: ExportProfile): Blob {
    this.addCreativeHeader(data.profile);
    this.addProfileWithIcons(data.profile);
    this.addRolesCreative(data.roles);
    this.addSkillsVisual(data.skills);
    this.addProjectsCreative(data.projects);
    this.addCreativeFooter();
    return this.doc.output('blob');
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.yPosition + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  private addCreativeHeader(profile: any) {
    // Gradient-style header with circles
    this.doc.setFillColor(...this.colors.primary);
    this.doc.circle(10, 10, 15, 'F');
    this.doc.setFillColor(...this.colors.secondary);
    this.doc.circle(this.pageWidth - 10, 10, 12, 'F');
    this.doc.setFillColor(...this.colors.accent);
    this.doc.circle(this.pageWidth / 2, 15, 8, 'F');

    this.doc.setTextColor(124, 58, 237);
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Creative Portfolio', this.pageWidth / 2, 25, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.colors.text);
    this.doc.text('Innovation • Excellence • Impact', this.pageWidth / 2, 35, { align: 'center' });

    // Decorative line
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 42, this.pageWidth - this.margin, 42);

    this.yPosition = 55;
  }

  private addProfileWithIcons(profile: any) {
    if (!profile) return;

    // Profile in a colored box
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, this.yPosition, this.pageWidth - 2 * this.margin, 35, 3, 3, 'F');

    this.yPosition += 10;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.colors.primary);
    this.doc.text('🎯 Profile Snapshot', this.margin + 5, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.colors.text);

    const items = [
      `📊 Status: ${profile.current_status || 'N/A'}`,
      `🎓 Level: ${profile.experience_level || 'N/A'}`,
      `⚡ Readiness: ${profile.overall_readiness_score || 0}%`,
      `⏱️ Timeline: ${profile.target_timeline || 'N/A'}`
    ];

    const colWidth = (this.pageWidth - 2 * this.margin - 10) / 2;
    items.forEach((item, idx) => {
      const x = this.margin + 5 + (idx % 2) * colWidth;
      const y = this.yPosition + Math.floor(idx / 2) * 6;
      this.doc.text(item, x, y);
    });

    this.yPosition += 25;
  }

  private addRolesCreative(roles: any[]) {
    if (!roles || roles.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.text('🎯 Target Roles', this.margin, this.yPosition);
    this.yPosition += 12;

    roles.forEach((role, index) => {
      this.checkPageBreak(30);

      // Role card
      this.doc.setFillColor(254, 242, 242);
      this.doc.roundedRect(this.margin, this.yPosition, this.pageWidth - 2 * this.margin, 22, 2, 2, 'F');

      this.yPosition += 8;

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(`${index + 1}. ${role.role_title}`, this.margin + 5, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`${role.role_category} • ${role.seniority_level}`, this.margin + 5, this.yPosition);
      
      if (role.market_salary_range) {
        this.doc.text(`💰 ${role.market_salary_range}`, this.margin + 80, this.yPosition);
      }

      this.yPosition += 12;
    });

    this.yPosition += 5;
  }

  private addSkillsVisual(skills: any[]) {
    if (!skills || skills.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.colors.accent);
    this.doc.text('⚡ Skills & Expertise', this.margin, this.yPosition);
    this.yPosition += 12;

    const skillsByCategory = skills.reduce((acc: any, skill: any) => {
      const category = skill.skill_category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});

    Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
      this.checkPageBreak(25);

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(`📚 ${category}`, this.margin, this.yPosition);
      this.yPosition += 7;

      categorySkills.forEach((skill: any) => {
        this.checkPageBreak(8);

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        
        // Visual skill bar
        this.doc.text(skill.skill_name, this.margin + 5, this.yPosition);
        
        const barX = this.margin + 60;
        const barWidth = 40;
        const barHeight = 3;
        
        // Background bar
        this.doc.setFillColor(229, 231, 235);
        this.doc.rect(barX, this.yPosition - 3, barWidth, barHeight, 'F');
        
        // Filled bar
        const fillWidth = (skill.current_level / 5) * barWidth;
        this.doc.setFillColor(...this.colors.accent);
        this.doc.rect(barX, this.yPosition - 3, fillWidth, barHeight, 'F');
        
        this.doc.setFontSize(8);
        this.doc.text(`${skill.current_level}/5`, barX + barWidth + 3, this.yPosition);

        this.yPosition += 6;
      });

      this.yPosition += 4;
    });

    this.yPosition += 5;
  }

  private addProjectsCreative(projects: any[]) {
    if (!projects || projects.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.colors.primary);
    this.doc.text('🚀 Featured Projects', this.margin, this.yPosition);
    this.yPosition += 12;

    projects.forEach((project, index) => {
      this.checkPageBreak(35);

      // Project card with border
      this.doc.setDrawColor(...this.colors.primary);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(this.margin, this.yPosition, this.pageWidth - 2 * this.margin, 30, 2, 2);

      this.yPosition += 8;

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(`${index + 1}. ${project.title}`, this.margin + 5, this.yPosition);
      this.yPosition += 6;

      if (project.description) {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        const desc = this.doc.splitTextToSize(project.description.substring(0, 150), this.pageWidth - 2 * this.margin - 10);
        this.doc.text(desc, this.margin + 5, this.yPosition);
        this.yPosition += Math.min(desc.length * 4, 12);
      }

      if (project.tech_stack && project.tech_stack.length > 0) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(`🛠️ ${project.tech_stack.slice(0, 5).join(' • ')}`, this.margin + 5, this.yPosition);
      }

      this.yPosition += 12;
    });
  }

  private addCreativeFooter() {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Decorative footer line
      this.doc.setDrawColor(...this.colors.primary);
      this.doc.setLineWidth(1);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(
        `✨ Crafted with Engunity JobPrep • Page ${i}/${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 8,
        { align: 'center' }
      );
    }
  }
}

/**
 * Minimal Template - Clean, simple, text-focused design
 */
export class MinimalTemplate {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 25;
  private yPosition = 25;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generate(data: ExportProfile): Blob {
    this.addMinimalHeader();
    this.addProfileMinimal(data.profile);
    this.addRolesMinimal(data.roles);
    this.addSkillsMinimal(data.skills);
    this.addProjectsMinimal(data.projects);
    this.addMinimalFooter();
    return this.doc.output('blob');
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.yPosition + requiredSpace > this.pageHeight - 25) {
      this.doc.addPage();
      this.yPosition = 25;
    }
  }

  private addMinimalHeader() {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROFILE', this.margin, this.yPosition);
    
    this.yPosition += 5;
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    
    this.yPosition += 15;
  }

  private addProfileMinimal(profile: any) {
    if (!profile) return;

    const data = [
      ['Status', profile.current_status || 'N/A'],
      ['Experience', profile.experience_level || 'N/A'],
      ['Readiness', `${profile.overall_readiness_score || 0}%`]
    ];

    this.doc.setFontSize(10);
    data.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${label}: ${value}`, this.margin, this.yPosition);
      this.yPosition += 5;
    });

    this.yPosition += 10;
  }

  private addRolesMinimal(roles: any[]) {
    if (!roles || roles.length === 0) return;

    this.checkPageBreak(30);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TARGET ROLES', this.margin, this.yPosition);
    this.yPosition += 8;

    roles.forEach((role) => {
      this.checkPageBreak(12);

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(role.role_title, this.margin, this.yPosition);
      this.yPosition += 5;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${role.role_category}, ${role.seniority_level}`, this.margin, this.yPosition);
      this.yPosition += 7;
    });

    this.yPosition += 5;
  }

  private addSkillsMinimal(skills: any[]) {
    if (!skills || skills.length === 0) return;

    this.checkPageBreak(30);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SKILLS', this.margin, this.yPosition);
    this.yPosition += 8;

    const skillsByCategory = skills.reduce((acc: any, skill: any) => {
      const category = skill.skill_category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});

    Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
      this.checkPageBreak(15);

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(category, this.margin, this.yPosition);
      this.yPosition += 5;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      const skillNames = categorySkills.map((s: any) => s.skill_name).join(', ');
      const wrapped = this.doc.splitTextToSize(skillNames, this.pageWidth - 2 * this.margin);
      this.doc.text(wrapped, this.margin, this.yPosition);
      this.yPosition += wrapped.length * 4 + 3;
    });

    this.yPosition += 5;
  }

  private addProjectsMinimal(projects: any[]) {
    if (!projects || projects.length === 0) return;

    this.checkPageBreak(30);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROJECTS', this.margin, this.yPosition);
    this.yPosition += 8;

    projects.forEach((project) => {
      this.checkPageBreak(15);

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(project.title, this.margin, this.yPosition);
      this.yPosition += 5;

      if (project.description) {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        const desc = this.doc.splitTextToSize(project.description, this.pageWidth - 2 * this.margin);
        this.doc.text(desc, this.margin, this.yPosition);
        this.yPosition += desc.length * 4;
      }

      this.yPosition += 5;
    });
  }

  private addMinimalFooter() {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${i}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
    }
  }
}

/**
 * ATS-Friendly Template - Optimized for Applicant Tracking Systems
 * Simple formatting, keyword-optimized, no graphics
 */
export class ATSFriendlyTemplate {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;
  private yPosition = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  generate(data: ExportProfile): Blob {
    this.addATSHeader(data.profile);
    this.addATSProfile(data.profile);
    this.addATSRoles(data.roles);
    this.addATSSkills(data.skills);
    this.addATSProjects(data.projects);
    return this.doc.output('blob');
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.yPosition + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  private addATSHeader(profile: any) {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROFESSIONAL PROFILE', this.margin, this.yPosition);
    this.yPosition += 10;
  }

  private addATSProfile(profile: any) {
    if (!profile) return;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const lines = [
      `Current Status: ${profile.current_status || 'N/A'}`,
      `Experience Level: ${profile.experience_level || 'N/A'}`,
      `Career Readiness Score: ${profile.overall_readiness_score || 0}%`,
      `Target Timeline: ${profile.target_timeline || 'N/A'}`
    ];

    lines.forEach(line => {
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 5;
    });

    this.yPosition += 8;
  }

  private addATSRoles(roles: any[]) {
    if (!roles || roles.length === 0) return;

    this.checkPageBreak(20);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TARGET POSITIONS', this.margin, this.yPosition);
    this.yPosition += 7;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    roles.forEach((role) => {
      this.checkPageBreak(10);
      
      const text = `${role.role_title} - ${role.role_category} - ${role.seniority_level} Level`;
      this.doc.text(text, this.margin, this.yPosition);
      this.yPosition += 5;

      if (role.market_salary_range) {
        this.doc.text(`Expected Salary Range: ${role.market_salary_range}`, this.margin + 5, this.yPosition);
        this.yPosition += 5;
      }
    });

    this.yPosition += 8;
  }

  private addATSSkills(skills: any[]) {
    if (!skills || skills.length === 0) return;

    this.checkPageBreak(20);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SKILLS AND COMPETENCIES', this.margin, this.yPosition);
    this.yPosition += 7;

    const skillsByCategory = skills.reduce((acc: any, skill: any) => {
      const category = skill.skill_category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});

    this.doc.setFontSize(11);

    Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
      this.checkPageBreak(10);

      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${category}:`, this.margin, this.yPosition);
      this.yPosition += 5;

      this.doc.setFont('helvetica', 'normal');
      const skillList = categorySkills.map((s: any) => 
        `${s.skill_name} (Proficiency: ${s.current_level}/5)`
      ).join(', ');
      
      const wrapped = this.doc.splitTextToSize(skillList, this.pageWidth - 2 * this.margin);
      this.doc.text(wrapped, this.margin + 5, this.yPosition);
      this.yPosition += wrapped.length * 5 + 3;
    });

    this.yPosition += 8;
  }

  private addATSProjects(projects: any[]) {
    if (!projects || projects.length === 0) return;

    this.checkPageBreak(20);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROJECTS AND EXPERIENCE', this.margin, this.yPosition);
    this.yPosition += 7;

    projects.forEach((project) => {
      this.checkPageBreak(20);

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(project.title, this.margin, this.yPosition);
      this.yPosition += 5;

      this.doc.setFont('helvetica', 'normal');

      if (project.description) {
        const desc = this.doc.splitTextToSize(project.description, this.pageWidth - 2 * this.margin);
        this.doc.text(desc, this.margin, this.yPosition);
        this.yPosition += desc.length * 5;
      }

      if (project.tech_stack && project.tech_stack.length > 0) {
        this.doc.text(`Technologies: ${project.tech_stack.join(', ')}`, this.margin, this.yPosition);
        this.yPosition += 5;
      }

      if (project.github_url) {
        this.doc.text(`Repository: ${project.github_url}`, this.margin, this.yPosition);
        this.yPosition += 5;
      }

      this.yPosition += 3;
    });
  }
}

// Export functions for easy use
export function generateProfessionalPDF(data: ExportProfile): Blob {
  const template = new ProfessionalTemplate();
  return template.generate(data);
}

export function generateCreativePDF(data: ExportProfile): Blob {
  const template = new CreativeTemplate();
  return template.generate(data);
}

export function generateMinimalPDF(data: ExportProfile): Blob {
  const template = new MinimalTemplate();
  return template.generate(data);
}

export function generateATSFriendlyPDF(data: ExportProfile): Blob {
  const template = new ATSFriendlyTemplate();
  return template.generate(data);
}
