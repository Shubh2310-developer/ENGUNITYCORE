"""
Answer Schema Enforcement
Ensures consistent, high-quality output structure
Part 1 of Text Quality Upgrade Plan
"""

from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
import re


class AnswerComplexity(str, Enum):
    """Maps to existing complexity classifier"""
    SIMPLE = "SIMPLE"
    SINGLE_HOP = "SINGLE_HOP"
    MULTI_HOP = "MULTI_HOP"


class AnswerSchema(BaseModel):
    """
    Universal answer structure enforced on all responses.
    This is the internal contract, not shown to users.
    """
    
    direct_answer: str = Field(
        ...,
        description="1-2 sentence direct response (≤50 words)",
        max_length=250
    )
    
    structured_explanation: str = Field(
        ...,
        description="Main explanation with headings/bullets"
    )
    
    technical_depth: Optional[str] = Field(
        None,
        description="Detailed technical content (only for SINGLE_HOP+)"
    )
    
    edge_cases: Optional[List[str]] = Field(
        None,
        description="Pitfalls, limitations, or warnings"
    )
    
    actionable_steps: List[str] = Field(
        default_factory=list,
        description="Concrete next steps (3-5 items)"
    )
    
    sources: List[str] = Field(
        default_factory=list,
        description="Document citations used"
    )


class AnswerFormatter:
    """Converts schema to user-facing markdown"""
    
    @staticmethod
    def format(schema: AnswerSchema, complexity: AnswerComplexity) -> str:
        """
        Render the structured answer as markdown.
        Adapts formatting based on complexity.
        """
        
        sections = []
        
        # 1. Direct answer (always first)
        sections.append(schema.direct_answer)
        sections.append("")  # Blank line
        
        # 2. Structured explanation
        sections.append(schema.structured_explanation)
        
        # 3. Technical depth (conditional)
        if schema.technical_depth and complexity != AnswerComplexity.SIMPLE:
            sections.append("")
            sections.append("### Technical Details")
            sections.append(schema.technical_depth)
        
        # 4. Edge cases (conditional)
        if schema.edge_cases:
            sections.append("")
            sections.append("### ⚠️ Important Considerations")
            for case in schema.edge_cases:
                sections.append(f"- {case}")
        
        # 5. Actionable steps (always)
        if schema.actionable_steps:
            sections.append("")
            sections.append("### What you should do next")
            for i, step in enumerate(schema.actionable_steps, 1):
                sections.append(f"{i}. {step}")
        
        # 6. Sources (always, if available)
        if schema.sources:
            sections.append("")
            sections.append("### Sources")
            for source in schema.sources:
                sections.append(f"- [Source: {source}]")
        
        return "\n".join(sections)


# Schema-specific prompts by complexity
SCHEMA_PROMPTS = {
    AnswerComplexity.SIMPLE: """
Structure your answer as follows:

1. **Direct Answer** (1-2 sentences, ≤50 words)
   - Answer the question immediately
   - No preamble or context-setting

2. **Brief Explanation** (2-3 sentences)
   - Key details only
   - Use bullets if listing items
   - No tangents

3. **Next Steps** (2-3 actions)
   - Concrete, actionable items
   - No vague suggestions

Keep total length under 150 words.
""",
    
    AnswerComplexity.SINGLE_HOP: """
Structure your answer as follows:

1. **Direct Answer** (1-2 sentences)
   - Clear, specific response

2. **Structured Explanation**
   - Use headings (###) for major sections
   - Use bullets for lists
   - Use numbered lists for sequences
   - Keep paragraphs ≤3 sentences

3. **Technical Depth** (if applicable)
   - Code examples, formulas, or specifics
   - Label clearly

4. **Important Considerations** (if applicable)
   - Edge cases, limitations, warnings

5. **Next Steps** (3-5 actions)
   - Prioritized recommendations
   - Specific and measurable

Target length: 200-400 words.
""",
    
    AnswerComplexity.MULTI_HOP: """
Structure your answer as follows:

1. **Direct Answer** (2 sentences)
   - High-level synthesis

2. **Structured Explanation**
   - Break into clear sections with ### headings
   - Each section: 1 concept or comparison
   - Use tables for comparisons
   - Use bullets for lists
   - Use code blocks for examples

3. **Technical Depth**
   - Detailed analysis with supporting evidence
   - Reference specific sources

4. **Edge Cases & Limitations**
   - When approach A vs B is better
   - Trade-offs and considerations

5. **Next Steps** (5 actions)
   - Decision framework
   - Implementation sequence
   - Evaluation criteria

Target length: 400-800 words.
"""
}


def get_schema_prompt(complexity: AnswerComplexity) -> str:
    """Get the appropriate schema prompt for complexity level"""
    return SCHEMA_PROMPTS[complexity]


def validate_answer_structure(answer: str, complexity: AnswerComplexity) -> dict:
    """
    Check if answer follows the schema.
    Returns quality scores and violations.
    """
    
    violations = []
    scores = {}
    
    # Check 1: Has direct answer in first 100 chars
    first_100 = answer[:100].lower()
    filler_phrases = [
        "let me", "let's", "sure", "i'll explain", "i can help",
        "great question", "that's interesting"
    ]
    if any(phrase in first_100 for phrase in filler_phrases):
        violations.append("Starts with filler phrase instead of direct answer")
        scores['directness'] = 0.3
    else:
        scores['directness'] = 1.0
    
    # Check 2: Has structure (headings or bullets)
    has_headings = "###" in answer or "##" in answer
    has_bullets = "\n- " in answer or "\n* " in answer
    has_numbers = bool(re.search(r'\n\d+\.', answer))
    
    if not (has_headings or has_bullets or has_numbers):
        violations.append("Missing structure (no headings, bullets, or numbered lists)")
        scores['structure'] = 0.4
    else:
        scores['structure'] = 1.0
    
    # Check 3: Has actionable section
    has_next_steps = any(phrase in answer.lower() for phrase in [
        "next steps", "what you should do", "recommendations:",
        "action items", "to implement", "what to do"
    ])
    
    if not has_next_steps and complexity != AnswerComplexity.SIMPLE:
        violations.append("Missing actionable next steps")
        scores['actionability'] = 0.5
    else:
        scores['actionability'] = 1.0
    
    # Check 4: Length appropriate for complexity
    word_count = len(answer.split())
    
    length_ranges = {
        AnswerComplexity.SIMPLE: (50, 200),
        AnswerComplexity.SINGLE_HOP: (150, 500),
        AnswerComplexity.MULTI_HOP: (300, 1000)
    }
    
    min_words, max_words = length_ranges[complexity]
    
    if word_count < min_words:
        violations.append(f"Too brief ({word_count} words, expected {min_words}+)")
        scores['length'] = word_count / min_words
    elif word_count > max_words:
        violations.append(f"Too verbose ({word_count} words, expected ≤{max_words})")
        scores['length'] = max_words / word_count
    else:
        scores['length'] = 1.0
    
    # Overall structure score
    overall_score = sum(scores.values()) / len(scores)
    
    return {
        'valid': len(violations) == 0,
        'violations': violations,
        'scores': scores,
        'overall_structure_score': overall_score
    }
