"""
Decision Export Service
Provides PDF, JSON, Markdown (ADR), and STAR format exports
"""
from typing import Dict, Any, Optional
from datetime import datetime
import json
from io import BytesIO

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class DecisionExportService:
    """Service for exporting decisions in various formats"""
    
    def __init__(self):
        self.styles = None
        if REPORTLAB_AVAILABLE:
            self._init_styles()
    
    def _init_styles(self):
        """Initialize PDF styles"""
        self.styles = getSampleStyleSheet()
        
        # Custom styles
        self.styles.add(ParagraphStyle(
            name='DecisionTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='Body',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#374151'),
            spaceAfter=6,
            alignment=TA_JUSTIFY
        ))
    
    def export_to_json(self, decision: Dict[str, Any]) -> str:
        """
        Export decision as JSON
        
        Args:
            decision: Decision dictionary
            
        Returns:
            JSON string
        """
        # Clean up for export
        export_data = {
            "id": decision.get("id"),
            "title": decision.get("title"),
            "type": decision.get("type"),
            "status": decision.get("status"),
            "confidence": decision.get("confidence"),
            "problem_statement": decision.get("problem_statement"),
            "context": decision.get("context"),
            "constraints": decision.get("constraints", []),
            "options": decision.get("options", []),
            "evidence": decision.get("evidence", []),
            "tradeoffs": decision.get("tradeoffs", {}),
            "ai_flags": decision.get("ai_flags", []),
            "final_decision": decision.get("final_decision"),
            "rationale": decision.get("rationale"),
            "tags": decision.get("tags", []),
            "created_at": str(decision.get("created_at", "")),
            "updated_at": str(decision.get("updated_at", "")),
            "exported_at": datetime.now().isoformat()
        }
        
        return json.dumps(export_data, indent=2, default=str)
    
    def export_to_adr(self, decision: Dict[str, Any]) -> str:
        """
        Export decision as Architecture Decision Record (ADR)
        
        Args:
            decision: Decision dictionary
            
        Returns:
            Markdown string in ADR format
        """
        adr = []
        
        # Title and metadata
        adr.append(f"# ADR: {decision.get('title', 'Untitled Decision')}\n")
        adr.append(f"**Status:** {decision.get('status', 'unknown').upper()}\n")
        adr.append(f"**Date:** {decision.get('created_at', 'N/A')}\n")
        adr.append(f"**Decision ID:** {decision.get('id', 'N/A')}\n")
        adr.append("\n---\n\n")
        
        # Context
        adr.append("## Context\n\n")
        adr.append(f"{decision.get('problem_statement', 'No problem statement provided.')}\n\n")
        if decision.get('context'):
            adr.append(f"{decision.get('context')}\n\n")
        
        # Constraints
        constraints = decision.get('constraints', [])
        if constraints:
            adr.append("### Constraints\n\n")
            for constraint in constraints:
                constraint_type = constraint.get('type', 'unknown')
                description = constraint.get('description', '')
                hard_limit = "**Hard Limit**" if constraint.get('hard_limit') else "Soft Limit"
                adr.append(f"- **{constraint_type.title()}** ({hard_limit}): {description}\n")
            adr.append("\n")
        
        # Decision
        adr.append("## Decision\n\n")
        if decision.get('final_decision'):
            # Find the chosen option
            options = decision.get('options', [])
            chosen = next((o for o in options if o.get('id') == decision.get('final_decision')), None)
            if chosen:
                adr.append(f"We will **{chosen.get('label', 'proceed with selected option')}**.\n\n")
                adr.append(f"{chosen.get('description', '')}\n\n")
        else:
            adr.append("Decision is still pending.\n\n")
        
        # Rationale
        if decision.get('rationale'):
            adr.append("### Rationale\n\n")
            adr.append(f"{decision.get('rationale')}\n\n")
        
        # Alternatives Considered
        options = decision.get('options', [])
        if options:
            adr.append("## Alternatives Considered\n\n")
            for option in options:
                adr.append(f"### {option.get('label', 'Option')}\n\n")
                adr.append(f"{option.get('description', 'No description')}\n\n")
                
                pros = option.get('pros', [])
                if pros:
                    adr.append("**Pros:**\n")
                    for pro in pros:
                        adr.append(f"- {pro}\n")
                    adr.append("\n")
                
                cons = option.get('cons', [])
                if cons:
                    adr.append("**Cons:**\n")
                    for con in cons:
                        adr.append(f"- {con}\n")
                    adr.append("\n")
        
        # Consequences
        adr.append("## Consequences\n\n")
        tradeoffs = decision.get('tradeoffs', {})
        if tradeoffs:
            adr.append("### Tradeoff Analysis\n\n")
            for key, value in tradeoffs.items():
                adr.append(f"- **{key.replace('_', ' ').title()}:** {value}/5\n")
            adr.append("\n")
        
        # Evidence
        evidence = decision.get('evidence', [])
        if evidence:
            adr.append("## Supporting Evidence\n\n")
            for ev in evidence:
                credibility = ev.get('credibility', 'unknown').upper()
                source_type = ev.get('source_type', 'unknown')
                adr.append(f"- **[{credibility}]** ({source_type}): {ev.get('excerpt', 'No excerpt')}\n")
            adr.append("\n")
        
        # AI Flags
        ai_flags = decision.get('ai_flags', [])
        if ai_flags:
            adr.append("## AI Analysis Flags\n\n")
            for flag in ai_flags:
                severity = flag.get('severity', 'info').upper()
                flag_type = flag.get('flag_type', 'unknown')
                message = flag.get('message', '')
                adr.append(f"- **[{severity}]** {flag_type.replace('_', ' ').title()}: {message}\n")
            adr.append("\n")
        
        return ''.join(adr)
    
    def export_to_star(self, decision: Dict[str, Any]) -> str:
        """
        Export decision as STAR format (for interviews)
        
        Args:
            decision: Decision dictionary
            
        Returns:
            Markdown string in STAR format
        """
        star = []
        
        star.append(f"# STAR: {decision.get('title', 'Decision')}\n\n")
        star.append("## Situation\n\n")
        
        # Situation - Context and problem
        star.append(f"{decision.get('problem_statement', 'No problem statement.')}\n\n")
        if decision.get('context'):
            star.append(f"{decision.get('context')}\n\n")
        
        # Task
        star.append("## Task\n\n")
        star.append(f"As the decision-maker, I needed to evaluate multiple options and choose the best path forward.\n\n")
        
        constraints = decision.get('constraints', [])
        if constraints:
            star.append("**Key Constraints:**\n")
            for constraint in constraints:
                star.append(f"- {constraint.get('description', 'N/A')}\n")
            star.append("\n")
        
        # Action
        star.append("## Action\n\n")
        star.append("I took the following approach:\n\n")
        
        options = decision.get('options', [])
        star.append(f"1. **Identified {len(options)} potential options** for addressing the problem\n")
        
        evidence = decision.get('evidence', [])
        if evidence:
            primary_count = sum(1 for e in evidence if e.get('credibility') == 'primary')
            star.append(f"2. **Gathered {len(evidence)} pieces of evidence** ({primary_count} primary sources)\n")
        
        star.append("3. **Conducted tradeoff analysis** across multiple dimensions\n")
        
        ai_flags = decision.get('ai_flags', [])
        if ai_flags:
            star.append(f"4. **Addressed {len(ai_flags)} potential cognitive biases** identified by AI review\n")
        
        star.append("5. **Made final decision** based on comprehensive analysis\n\n")
        
        # Result
        star.append("## Result\n\n")
        
        if decision.get('final_decision'):
            options = decision.get('options', [])
            chosen = next((o for o in options if o.get('id') == decision.get('final_decision')), None)
            if chosen:
                star.append(f"**Decision:** {chosen.get('label', 'Selected option')}\n\n")
                star.append(f"**Rationale:** {decision.get('rationale', 'See decision analysis.')}\n\n")
                
                star.append("**Expected Outcomes:**\n")
                for pro in chosen.get('pros', [])[:3]:  # Top 3 benefits
                    star.append(f"- {pro}\n")
                star.append("\n")
        else:
            star.append("Decision is currently in progress.\n\n")
        
        # Confidence and status
        star.append(f"**Confidence Level:** {decision.get('confidence', 'medium').title()}\n")
        star.append(f"**Status:** {decision.get('status', 'unknown').title()}\n\n")
        
        return ''.join(star)
    
    def export_to_pdf(self, decision: Dict[str, Any]) -> Optional[BytesIO]:
        """
        Export decision as PDF
        
        Args:
            decision: Decision dictionary
            
        Returns:
            BytesIO object containing PDF, or None if reportlab not available
        """
        if not REPORTLAB_AVAILABLE:
            return None
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        
        story = []
        
        # Title
        title = Paragraph(decision.get('title', 'Decision'), self.styles['DecisionTitle'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Metadata table
        metadata = [
            ['Status:', decision.get('status', 'N/A').upper()],
            ['Type:', decision.get('type', 'N/A')],
            ['Confidence:', decision.get('confidence', 'N/A').title()],
            ['Created:', str(decision.get('created_at', 'N/A'))[:19]],
            ['Decision ID:', decision.get('id', 'N/A')[:20] + '...']
        ]
        
        meta_table = Table(metadata, colWidths=[1.5*inch, 4.5*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))
        
        # Problem Statement
        story.append(Paragraph('Problem Statement', self.styles['SectionHeader']))
        problem = Paragraph(decision.get('problem_statement', 'N/A'), self.styles['Body'])
        story.append(problem)
        story.append(Spacer(1, 12))
        
        # Context
        if decision.get('context'):
            story.append(Paragraph('Context', self.styles['SectionHeader']))
            context = Paragraph(decision.get('context'), self.styles['Body'])
            story.append(context)
            story.append(Spacer(1, 12))
        
        # Options
        options = decision.get('options', [])
        if options:
            story.append(Paragraph('Options Considered', self.styles['SectionHeader']))
            for i, option in enumerate(options, 1):
                opt_title = f"{i}. {option.get('label', 'Option')}"
                story.append(Paragraph(opt_title, self.styles['Heading3']))
                story.append(Paragraph(option.get('description', ''), self.styles['Body']))
                story.append(Spacer(1, 6))
        
        # Final Decision
        if decision.get('final_decision'):
            story.append(Paragraph('Final Decision', self.styles['SectionHeader']))
            chosen = next((o for o in options if o.get('id') == decision.get('final_decision')), None)
            if chosen:
                final_text = f"<b>{chosen.get('label', 'Selected')}</b>"
                story.append(Paragraph(final_text, self.styles['Body']))
            
            if decision.get('rationale'):
                story.append(Spacer(1, 6))
                story.append(Paragraph(decision.get('rationale'), self.styles['Body']))
            story.append(Spacer(1, 12))
        
        # AI Flags
        ai_flags = decision.get('ai_flags', [])
        if ai_flags:
            story.append(Paragraph('AI Analysis', self.styles['SectionHeader']))
            for flag in ai_flags:
                severity = flag.get('severity', 'info').upper()
                flag_type = flag.get('flag_type', 'unknown').replace('_', ' ').title()
                message = flag.get('message', '')
                
                flag_text = f"<b>[{severity}]</b> {flag_type}: {message}"
                story.append(Paragraph(flag_text, self.styles['Body']))
                story.append(Spacer(1, 4))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer


# Singleton instance
decision_export_service = DecisionExportService()
