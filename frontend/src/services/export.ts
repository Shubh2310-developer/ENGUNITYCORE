/**
 * Export Service for JobPrep Feature
 * Handles exporting profile data in various formats
 */

import jsPDF from 'jspdf';
import {
  generateProfessionalPDF,
  generateCreativePDF,
  generateMinimalPDF,
  generateATSFriendlyPDF,
  ExportProfile
} from './export-templates';

export type { ExportProfile };

export interface ExportOptions {
  format: 'pdf' | 'json' | 'markdown' | 'html';
  includeAnalysis?: boolean;
  includeSimulations?: boolean;
  templateStyle?: 'professional' | 'creative' | 'minimal' | 'ats-friendly';
}

class ExportService {
  /**
   * Export JobPrep data in specified format
   */
  async exportData(data: ExportProfile, options: ExportOptions): Promise<Blob | string> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'json':
        return this.exportToJSON(data, options);
      case 'markdown':
        return this.exportToMarkdown(data, options);
      case 'html':
        return this.exportToHTML(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as PDF Resume
   */
  private async exportToPDF(data: ExportProfile, options: ExportOptions): Promise<Blob> {
    // Use template-based PDF generation
    const style = options.templateStyle || 'professional';
    
    switch (style) {
      case 'creative':
        return generateCreativePDF(data);
      case 'minimal':
        return generateMinimalPDF(data);
      case 'ats-friendly':
        return generateATSFriendlyPDF(data);
      case 'professional':
      default:
        return generateProfessionalPDF(data);
    }
    
    // Legacy code below (kept for reference)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Professional Profile', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Profile Information
    if (data.profile) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Profile Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${data.profile.current_status || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Experience Level: ${data.profile.experience_level || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Readiness Score: ${data.profile.overall_readiness_score || 0}%`, 20, yPosition);
      yPosition += 12;
    }

    // Target Roles
    if (data.roles && data.roles.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Target Roles', 20, yPosition);
      yPosition += 10;

      data.roles.forEach((role, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${role.role_title}`, 20, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Category: ${role.role_category} | Level: ${role.seniority_level}`, 25, yPosition);
        yPosition += 6;

        if (role.market_salary_range) {
          doc.text(`Salary Range: ${role.market_salary_range}`, 25, yPosition);
          yPosition += 6;
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Skills Matrix', 20, yPosition);
      yPosition += 10;

      // Group skills by category
      const skillsByCategory = data.skills.reduce((acc: any, skill: any) => {
        const category = skill.skill_category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {});

      Object.entries(skillsByCategory).forEach(([category, skills]: [string, any]) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(category, 20, yPosition);
        yPosition += 6;

        skills.forEach((skill: any) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const level = '●'.repeat(skill.current_level) + '○'.repeat(5 - skill.current_level);
          doc.text(`${skill.skill_name}: ${level}`, 25, yPosition);
          yPosition += 5;
        });
        yPosition += 3;
      });
      yPosition += 5;
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Projects Portfolio', 20, yPosition);
      yPosition += 10;

      data.projects.forEach((project, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${project.title}`, 20, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (project.description) {
          const description = doc.splitTextToSize(project.description, pageWidth - 50);
          doc.text(description, 25, yPosition);
          yPosition += description.length * 5;
        }

        if (project.tech_stack && project.tech_stack.length > 0) {
          doc.text(`Tech Stack: ${project.tech_stack.join(', ')}`, 25, yPosition);
          yPosition += 6;
        }

        if (options.includeAnalysis && project.ai_complexity_score) {
          doc.text(`Complexity: ${project.ai_complexity_score}/10 | Innovation: ${project.ai_innovation_score}/10`, 25, yPosition);
          yPosition += 6;
        }

        yPosition += 3;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated by Engunity JobPrep | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  }

  /**
   * Export as JSON
   */
  private exportToJSON(data: ExportProfile, options: ExportOptions): string {
    const exportData: any = {
      profile: data.profile,
      roles: data.roles,
      skills: data.skills,
      projects: data.projects,
      exportDate: new Date().toISOString(),
    };

    if (options.includeSimulations) {
      exportData.simulations = data.simulations;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as Markdown
   */
  private exportToMarkdown(data: ExportProfile, options: ExportOptions): string {
    let markdown = '# Professional Profile\n\n';
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

    // Profile
    if (data.profile) {
      markdown += '## Profile Summary\n\n';
      markdown += `- **Status:** ${data.profile.current_status}\n`;
      markdown += `- **Experience Level:** ${data.profile.experience_level}\n`;
      markdown += `- **Readiness Score:** ${data.profile.overall_readiness_score}%\n\n`;
    }

    // Target Roles
    if (data.roles && data.roles.length > 0) {
      markdown += '## Target Roles\n\n';
      data.roles.forEach((role: any, index: number) => {
        markdown += `### ${index + 1}. ${role.role_title}\n\n`;
        markdown += `- **Category:** ${role.role_category}\n`;
        markdown += `- **Seniority:** ${role.seniority_level}\n`;
        if (role.market_salary_range) {
          markdown += `- **Salary Range:** ${role.market_salary_range}\n`;
        }
        if (role.preparation_focus) {
          markdown += `- **Focus Areas:** ${role.preparation_focus.join(', ')}\n`;
        }
        markdown += '\n';
      });
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      markdown += '## Skills Matrix\n\n';
      
      const skillsByCategory = data.skills.reduce((acc: any, skill: any) => {
        const category = skill.skill_category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {});

      Object.entries(skillsByCategory).forEach(([category, skills]: [string, any]) => {
        markdown += `### ${category}\n\n`;
        skills.forEach((skill: any) => {
          const level = '★'.repeat(skill.current_level) + '☆'.repeat(5 - skill.current_level);
          markdown += `- **${skill.skill_name}** ${level}`;
          if (skill.evidence_count > 0) {
            markdown += ` (${skill.evidence_count} evidence items)`;
          }
          markdown += '\n';
        });
        markdown += '\n';
      });
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      markdown += '## Projects Portfolio\n\n';
      data.projects.forEach((project: any, index: number) => {
        markdown += `### ${index + 1}. ${project.title}\n\n`;
        if (project.description) {
          markdown += `${project.description}\n\n`;
        }
        if (project.tech_stack && project.tech_stack.length > 0) {
          markdown += `**Tech Stack:** ${project.tech_stack.join(', ')}\n\n`;
        }
        if (project.github_url) {
          markdown += `**Repository:** [GitHub](${project.github_url})\n\n`;
        }
        if (options.includeAnalysis && project.ai_talking_points) {
          markdown += '**Key Talking Points:**\n';
          project.ai_talking_points.forEach((point: string) => {
            markdown += `- ${point}\n`;
          });
          markdown += '\n';
        }
      });
    }

    markdown += '---\n\n';
    markdown += '*Generated by Engunity JobPrep*\n';

    return markdown;
  }

  /**
   * Export as HTML
   */
  private exportToHTML(data: ExportProfile, options: ExportOptions): string {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Profile</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 0.5rem; }
        h2 { color: #1e40af; margin-top: 2rem; }
        h3 { color: #475569; }
        .profile-summary { background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .skill-level { color: #f59e0b; }
        .project-card { border-left: 4px solid #2563eb; padding-left: 1rem; margin: 1rem 0; }
        .tech-stack { display: inline-block; background: #e0e7ff; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0.25rem; font-size: 0.875rem; }
        .footer { text-align: center; margin-top: 3rem; color: #64748b; font-size: 0.875rem; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <h1>Professional Profile</h1>
    <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
`;

    // Profile
    if (data.profile) {
      html += `
    <div class="profile-summary">
        <h2>Profile Summary</h2>
        <p><strong>Status:</strong> ${data.profile.current_status}</p>
        <p><strong>Experience Level:</strong> ${data.profile.experience_level}</p>
        <p><strong>Readiness Score:</strong> ${data.profile.overall_readiness_score}%</p>
    </div>
`;
    }

    // Target Roles
    if (data.roles && data.roles.length > 0) {
      html += '<h2>Target Roles</h2>';
      data.roles.forEach((role: any) => {
        html += `
    <div class="project-card">
        <h3>${role.role_title}</h3>
        <p><strong>Category:</strong> ${role.role_category} | <strong>Level:</strong> ${role.seniority_level}</p>
        ${role.market_salary_range ? `<p><strong>Salary Range:</strong> ${role.market_salary_range}</p>` : ''}
    </div>
`;
      });
    }

    // Skills
    if (data.skills && data.skills.length > 0) {
      html += '<h2>Skills Matrix</h2>';
      const skillsByCategory = data.skills.reduce((acc: any, skill: any) => {
        const category = skill.skill_category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {});

      Object.entries(skillsByCategory).forEach(([category, skills]: [string, any]) => {
        html += `<h3>${category}</h3><ul>`;
        skills.forEach((skill: any) => {
          const level = '★'.repeat(skill.current_level) + '☆'.repeat(5 - skill.current_level);
          html += `<li><strong>${skill.skill_name}</strong> <span class="skill-level">${level}</span></li>`;
        });
        html += '</ul>';
      });
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
      html += '<h2>Projects Portfolio</h2>';
      data.projects.forEach((project: any) => {
        html += `
    <div class="project-card">
        <h3>${project.title}</h3>
        ${project.description ? `<p>${project.description}</p>` : ''}
        ${project.tech_stack && project.tech_stack.length > 0 ? 
          `<div>${project.tech_stack.map((tech: string) => `<span class="tech-stack">${tech}</span>`).join('')}</div>` : ''}
    </div>
`;
      });
    }

    html += `
    <div class="footer">
        <p>Generated by Engunity JobPrep</p>
    </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Download file to user's computer
   */
  downloadFile(content: Blob | string, filename: string, mimeType: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
export default exportService;
