"""
Answer Refiner - Stage B of two-stage generation
Improves linguistic quality without changing facts
Part 2 of Text Quality Upgrade Plan
"""

import logging
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)


class AnswerRefiner:
    """
    Second-pass refinement for answer quality.
    NEVER adds facts, only improves expression.
    """
    
    def __init__(self, groq_client):
        self.groq_client = groq_client
        self.model = "llama-3.1-8b-instant"  # Smaller, faster
    
    REFINER_SYSTEM_PROMPT = """You are a linguistic refinement specialist.

Your ONLY job: Rewrite the draft answer to improve clarity and precision.

RULES (CRITICAL):
1. Keep ALL facts, numbers, and sources IDENTICAL
2. Do NOT add new information
3. Do NOT remove important details
4. Do NOT change technical accuracy

WHAT YOU SHOULD DO:
- Remove redundancy and repetition
- Kill filler phrases ("it's important to note", "let's explore")
- Improve logical flow between sentences
- Tighten verbose explanations
- Fix awkward phrasing
- Ensure parallel structure in lists
- Make headings more descriptive

WHAT YOU MUST NOT DO:
- Add facts not in the draft
- Remove citations or sources
- Change technical terms
- Alter code examples
- Modify numbers or statistics

Output: The refined answer only (no preamble)."""

    async def refine(
        self,
        draft_answer: str,
        complexity: str,
        validation_scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Refine a draft answer for better clarity.
        
        Args:
            draft_answer: The initial generated answer
            complexity: Query complexity level
            validation_scores: Structure validation scores
        
        Returns:
            Dict with refined_answer, improvement_metrics, should_use_refined
        """
        
        # Decide if refinement is needed
        if not self._should_refine(draft_answer, validation_scores):
            return {
                'refined_answer': draft_answer,
                'refinement_applied': False,
                'reason': 'Quality already acceptable'
            }
        
        # Identify specific issues to fix
        refinement_focus = self._identify_issues(draft_answer, validation_scores)
        
        # Build refinement prompt
        user_prompt = f"""Draft answer to refine:

{draft_answer}

---

Specific issues to address:
{self._format_issues(refinement_focus)}

Produce the refined version now."""

        try:
            # Call refiner model
            refined = await self.groq_client.get_completion(
                messages=[
                    {"role": "system", "content": self.REFINER_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.5,
                max_tokens=2048,
                model=self.model
            )
            
            # Validate that refinement didn't break anything
            validation = self._validate_refinement(draft_answer, refined)
            
            if not validation['safe']:
                logger.warning(
                    f"Refinement rejected: {validation['reason']}\n"
                    f"Keeping draft answer."
                )
                return {
                    'refined_answer': draft_answer,
                    'refinement_applied': False,
                    'reason': validation['reason']
                }
            
            # Calculate improvement metrics
            improvements = self._measure_improvements(
                draft_answer, 
                refined,
                validation_scores
            )
            
            return {
                'refined_answer': refined,
                'refinement_applied': True,
                'improvements': improvements,
                'validation': validation
            }
            
        except Exception as e:
            logger.error(f"Refinement failed: {e}")
            return {
                'refined_answer': draft_answer,
                'refinement_applied': False,
                'reason': f'Error: {str(e)}'
            }
    
    def _should_refine(
        self, 
        draft: str, 
        scores: Dict[str, float]
    ) -> bool:
        """
        Determine if refinement is warranted.
        Don't refine if quality is already high.
        """
        
        word_count = len(draft.split())
        
        # Always refine if structure is poor
        if scores.get('overall_structure_score', 1.0) < 0.7:
            return True
        
        # Refine long answers with low directness
        if word_count > 400 and scores.get('directness', 1.0) < 0.8:
            return True
        
        # Refine if missing actionability
        if scores.get('actionability', 1.0) < 0.8:
            return True
        
        # Don't refine short, well-structured answers
        if word_count < 150 and scores.get('structure', 1.0) > 0.8:
            return False
        
        # Refine if overall score is mediocre
        avg_score = sum(scores.values()) / len(scores) if scores else 1.0
        return avg_score < 0.85
    
    def _identify_issues(
        self, 
        draft: str, 
        scores: Dict[str, float]
    ) -> list:
        """Identify specific problems to fix"""
        
        issues = []
        
        # Check for filler phrases
        filler_phrases = [
            "let me explain", "let's explore", "it's important to note",
            "as mentioned", "in summary", "to summarize", "basically",
            "essentially", "actually", "in fact", "to be honest",
            "great question", "that's interesting"
        ]
        
        draft_lower = draft.lower()
        found_fillers = [p for p in filler_phrases if p in draft_lower]
        
        if found_fillers:
            issues.append(f"Remove filler phrases: {', '.join(found_fillers[:3])}")
        
        # Check for redundancy
        sentences = draft.split('. ')
        if len(sentences) > 5:
            # Simple redundancy check: repeated phrases
            words_seen = {}
            for sentence in sentences:
                key_phrase = ' '.join(sentence.split()[:5])
                words_seen[key_phrase] = words_seen.get(key_phrase, 0) + 1
            
            if any(count > 1 for count in words_seen.values()):
                issues.append("Remove redundant or repetitive content")
        
        # Check for long paragraphs
        paragraphs = draft.split('\n\n')
        long_paragraphs = [p for p in paragraphs if len(p.split()) > 100]
        
        if long_paragraphs:
            issues.append("Break long paragraphs into smaller chunks")
        
        # Check scores
        if scores.get('directness', 1.0) < 0.8:
            issues.append("Start with direct answer, remove preamble")
        
        if scores.get('structure', 1.0) < 0.8:
            issues.append("Add clear headings and bullet points")
        
        if scores.get('actionability', 1.0) < 0.8:
            issues.append("Add concrete next steps section")
        
        return issues
    
    def _format_issues(self, issues: list) -> str:
        """Format issues for prompt"""
        if not issues:
            return "- General clarity and flow improvements"
        return '\n'.join(f"- {issue}" for issue in issues)
    
    def _validate_refinement(
        self, 
        draft: str, 
        refined: str
    ) -> Dict[str, Any]:
        """
        Ensure refinement didn't break anything.
        Check that no facts were added/removed.
        """
        
        # Basic sanity checks
        
        # 1. Length shouldn't increase dramatically (no added info)
        draft_words = len(draft.split())
        refined_words = len(refined.split())
        
        if refined_words > draft_words * 1.3:
            return {
                'safe': False,
                'reason': f'Refined version too long ({refined_words} vs {draft_words} words)'
            }
        
        # 2. Check that sources are preserved
        draft_sources = set(re.findall(r'\[Source: ([^\]]+)\]', draft))
        refined_sources = set(re.findall(r'\[Source: ([^\]]+)\]', refined))
        
        if draft_sources and not draft_sources.issubset(refined_sources):
            return {
                'safe': False,
                'reason': 'Some source citations were removed'
            }
        
        # 3. Check that numbers are preserved
        draft_numbers = set(re.findall(r'\b\d+(?:\.\d+)?%?\b', draft))
        refined_numbers = set(re.findall(r'\b\d+(?:\.\d+)?%?\b', refined))
        
        # Allow slight differences in numbers, but major loss is suspicious
        if len(draft_numbers) > 0:
            preservation_rate = len(refined_numbers) / len(draft_numbers)
            if preservation_rate < 0.7:
                return {
                    'safe': False,
                    'reason': 'Too many numbers removed (possible fact loss)'
                }
        
        # 4. Check for hallucination markers
        hallucination_phrases = [
            "based on my knowledge",
            "in general",
            "typically",
            "usually",
            "most experts agree"
        ]
        
        refined_lower = refined.lower()
        if any(phrase in refined_lower for phrase in hallucination_phrases):
            # These phrases might indicate added opinions
            if all(phrase not in draft.lower() for phrase in hallucination_phrases):
                return {
                    'safe': False,
                    'reason': 'Possible opinion/generalization added'
                }
        
        return {
            'safe': True,
            'reason': 'Validation passed'
        }
    
    def _measure_improvements(
        self,
        draft: str,
        refined: str,
        original_scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Quantify improvements from refinement.
        """
        
        draft_words = len(draft.split())
        refined_words = len(refined.split())
        
        # Brevity improvement
        brevity_gain = (draft_words - refined_words) / draft_words if draft_words > 0 else 0
        
        # Filler phrase reduction
        filler_phrases = [
            "let me", "let's", "it's important", "basically",
            "essentially", "actually", "great question"
        ]
        
        draft_filler_count = sum(
            draft.lower().count(phrase) for phrase in filler_phrases
        )
        refined_filler_count = sum(
            refined.lower().count(phrase) for phrase in filler_phrases
        )
        
        filler_reduction = draft_filler_count - refined_filler_count
        
        # Structure improvements
        draft_headings = draft.count('###')
        refined_headings = refined.count('###')
        
        draft_bullets = draft.count('\n- ')
        refined_bullets = refined.count('\n- ')
        
        return {
            'brevity_gain_pct': round(brevity_gain * 100, 1),
            'words_removed': draft_words - refined_words,
            'filler_phrases_removed': filler_reduction,
            'headings_added': refined_headings - draft_headings,
            'bullets_added': refined_bullets - draft_bullets,
            'original_words': draft_words,
            'refined_words': refined_words
        }


# Singleton instance
_refiner_instance = None

def get_answer_refiner(groq_client) -> AnswerRefiner:
    """Get or create refiner instance"""
    global _refiner_instance
    if _refiner_instance is None:
        _refiner_instance = AnswerRefiner(groq_client)
    return _refiner_instance
