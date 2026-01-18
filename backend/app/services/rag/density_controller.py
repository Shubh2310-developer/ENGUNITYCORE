"""
Density Controller - Token-to-Value Ratio Optimizer
Part 4 of Text Quality Upgrade Plan
"""

import re
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class DensityController:
    """
    Ensures high information density in answers.
    Target: 70%+ valuable tokens, <30% filler.
    """
    
    # Filler phrases that add no value
    FILLER_PHRASES = [
        "it's important to note",
        "let me explain",
        "let's explore",
        "as mentioned earlier",
        "in this context",
        "it's worth mentioning",
        "to be more specific",
        "in other words",
        "basically",
        "essentially",
        "actually",
        "in fact",
        "to be honest",
        "at the end of the day",
        "when all is said and done",
        "the fact of the matter is",
        "great question",
        "that's interesting",
        "well,",
        "so,",
        "now,",
    ]
    
    # Verbose patterns to tighten
    VERBOSE_PATTERNS = {
        r"in order to": "to",
        r"due to the fact that": "because",
        r"at this point in time": "now",
        r"has the ability to": "can",
        r"is able to": "can",
        r"in the event that": "if",
        r"with regard to": "regarding",
        r"with respect to": "regarding",
        r"for the purpose of": "for",
        r"in spite of the fact that": "although",
        r"on the other hand": "however",
        r"take into consideration": "consider",
        r"make use of": "use",
        r"put an end to": "end",
        r"come to the conclusion": "conclude",
        r"give an indication of": "indicate",
    }
    
    def analyze_density(self, text: str) -> Dict[str, Any]:
        """
        Analyze information density of text.
        
        Returns:
            - word_count: Total words
            - filler_count: Number of filler phrases/words
            - density_score: 0-1 (higher is better)
            - issues: List of detected density problems
        """
        
        word_count = len(text.split())
        text_lower = text.lower()
        
        # Count filler phrases
        filler_count = sum(
            text_lower.count(phrase) 
            for phrase in self.FILLER_PHRASES
        )
        
        # Count verbose patterns
        verbose_count = sum(
            len(re.findall(pattern, text_lower))
            for pattern in self.VERBOSE_PATTERNS.keys()
        )
        
        # Estimate filler word count (each phrase ~3-4 words)
        filler_words = filler_count * 3.5 + verbose_count * 2
        
        # Calculate density (inverse of filler ratio)
        density_score = max(0, 1 - (filler_words / word_count)) if word_count > 0 else 0
        
        # Identify specific issues
        issues = []
        
        if filler_count > 3:
            issues.append(f"Contains {filler_count} filler phrases")
        
        if verbose_count > 2:
            issues.append(f"Contains {verbose_count} verbose patterns")
        
        # Check for long sentences (complexity indicator)
        sentences = re.split(r'[.!?]+', text)
        long_sentences = [s for s in sentences if len(s.split()) > 30]
        
        if len(long_sentences) > len(sentences) * 0.3:
            issues.append("Too many long sentences (>30 words)")
        
        # Check for paragraph length
        paragraphs = text.split('\n\n')
        long_paragraphs = [p for p in paragraphs if len(p.split()) > 150]
        
        if long_paragraphs:
            issues.append(f"{len(long_paragraphs)} paragraphs exceed 150 words")
        
        return {
            'word_count': word_count,
            'filler_count': filler_count,
            'verbose_count': verbose_count,
            'estimated_filler_words': int(filler_words),
            'density_score': round(density_score, 2),
            'issues': issues,
            'is_acceptable': density_score >= 0.7
        }
    
    def optimize_density(self, text: str) -> str:
        """
        Automatically optimize text density by removing obvious issues.
        This is a lightweight pass - the refiner does heavy lifting.
        """
        
        optimized = text
        
        # Remove verbose patterns
        for pattern, replacement in self.VERBOSE_PATTERNS.items():
            optimized = re.sub(pattern, replacement, optimized, flags=re.IGNORECASE)
        
        # Remove standalone filler phrases at sentence starts
        for phrase in self.FILLER_PHRASES:
            # Remove at start of sentence
            pattern = r'(?:^|\. )' + re.escape(phrase) + r',?\s*'
            optimized = re.sub(pattern, '. ', optimized, flags=re.IGNORECASE)
        
        # Clean up multiple spaces
        optimized = re.sub(r'\s+', ' ', optimized)
        
        # Clean up sentence starts
        optimized = re.sub(r'\.\s+\.', '.', optimized)
        
        return optimized.strip()
    
    def get_density_guidance(
        self, 
        analysis: Dict[str, Any], 
        complexity: str
    ) -> str:
        """
        Generate guidance for improving density based on analysis.
        Used in refiner prompts.
        """
        
        guidance = []
        
        target_lengths = {
            'SIMPLE': {'target': 100, 'max': 150},
            'SINGLE_HOP': {'target': 300, 'max': 450},
            'MULTI_HOP': {'target': 500, 'max': 800}
        }
        
        targets = target_lengths.get(complexity, {'target': 300, 'max': 500})
        
        if analysis['word_count'] > targets['max']:
            guidance.append(
                f"REDUCE LENGTH: Currently {analysis['word_count']} words, "
                f"target ≤{targets['max']} words"
            )
        
        if analysis['filler_count'] > 0:
            guidance.append(
                f"REMOVE FILLERS: {analysis['filler_count']} filler phrases detected"
            )
        
        if analysis['verbose_count'] > 0:
            guidance.append(
                f"TIGHTEN WORDING: {analysis['verbose_count']} verbose patterns detected"
            )
        
        if analysis['density_score'] < 0.7:
            guidance.append(
                f"INCREASE DENSITY: Current density {analysis['density_score']}, "
                f"target ≥0.70"
            )
        
        if not guidance:
            guidance.append("Density is acceptable - maintain current level")
        
        return '\n'.join(f"- {g}" for g in guidance)
