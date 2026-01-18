"""
Language Optimizer - Kill LLM-ish Phrases
Part 8 of Text Quality Upgrade Plan
"""

import re
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)


class LanguageOptimizer:
    """
    Detects and removes AI-specific language patterns.
    Makes text sound natural, not generated.
    """
    
    # Phrases that scream "I'm an AI"
    LLM_ISH_PHRASES = [
        # Conversational hedges
        "i'd be happy to",
        "i can help you",
        "i can assist",
        "sure, i can",
        "certainly, i",
        "of course, i",
        
        # Meta-commentary
        "let me explain",
        "let's dive into",
        "let's explore",
        "let's break down",
        "let's take a look",
        "i'll walk you through",
        
        # Unnecessary qualifiers
        "it's important to note",
        "it's worth noting",
        "it's worth mentioning",
        "keep in mind",
        "bear in mind",
        
        # Exploratory language
        "as you can see",
        "as mentioned earlier",
        "as we discussed",
        "in this context",
        "in this case",
        
        # Filler transitions
        "moving on",
        "now that we've covered",
        "with that said",
        "having said that",
        "that being said",
        
        # Self-referential
        "in summary",
        "to summarize",
        "in conclusion",
        "to conclude",
        
        # Question acknowledgments
        "great question",
        "excellent question",
        "that's a good question",
        "interesting question",
    ]
    
    # Opening phrases that should be cut
    BAD_OPENINGS = [
        "well,",
        "so,",
        "now,",
        "okay,",
        "alright,",
        "sure.",
        "certainly.",
    ]
    
    # Confidence undermining phrases
    WEAK_LANGUAGE = [
        "i think",
        "i believe",
        "it seems",
        "it appears",
        "might be",
        "could be",
        "possibly",
        "perhaps",
        "maybe",
    ]
    
    def detect_llm_language(self, text: str) -> List[Tuple[str, int]]:
        """
        Detect LLM-ish phrases in text.
        
        Returns:
            List of (phrase, count) tuples
        """
        
        text_lower = text.lower()
        detected = []
        
        # Check all LLM-ish phrases
        for phrase in self.LLM_ISH_PHRASES:
            count = text_lower.count(phrase)
            if count > 0:
                detected.append((phrase, count))
        
        # Check bad openings
        for opening in self.BAD_OPENINGS:
            if text_lower.startswith(opening):
                detected.append((opening, 1))
        
        # Check weak language
        for weak in self.WEAK_LANGUAGE:
            count = text_lower.count(weak)
            if count > 0:
                detected.append((weak, count))
        
        return detected
    
    def score_naturalness(self, text: str) -> float:
        """
        Score how natural (non-AI) the text sounds.
        
        Returns:
            0.0 (very LLM-ish) to 1.0 (natural)
        """
        
        detected = self.detect_llm_language(text)
        
        if not detected:
            return 1.0
        
        # Total violations
        total_violations = sum(count for _, count in detected)
        word_count = len(text.split())
        
        # Penalty: 5% per violation
        penalty = min(0.5, (total_violations / max(word_count / 100, 1)) * 0.05)
        
        return max(0.5, 1.0 - penalty)
    
    def clean_llm_language(self, text: str) -> str:
        """
        Remove LLM-ish phrases from text.
        This is aggressive - use carefully.
        """
        
        cleaned = text
        
        # Remove bad openings
        for opening in self.BAD_OPENINGS:
            pattern = r'^' + re.escape(opening) + r'\s*'
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Remove LLM-ish phrases
        for phrase in self.LLM_ISH_PHRASES:
            # Remove at sentence boundaries
            pattern = r'(?:^|\. )' + re.escape(phrase) + r',?\s*'
            cleaned = re.sub(pattern, '. ', cleaned, flags=re.IGNORECASE)
        
        # Clean up artifacts
        cleaned = re.sub(r'\.\s+\.', '.', cleaned)
        cleaned = re.sub(r'^\.\s*', '', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        
        return cleaned.strip()
    
    def generate_improvement_prompt(self, detected: List[Tuple[str, int]]) -> str:
        """
        Generate specific guidance for removing LLM language.
        """
        
        if not detected:
            return "Language is natural - no AI-ish phrases detected."
        
        guidance = ["Remove these AI-ish phrases:"]
        
        for phrase, count in detected[:5]:  # Top 5
            guidance.append(f"  - '{phrase}' (appears {count} time(s))")
        
        guidance.append("\nRewrite to be direct and declarative.")
        
        return '\n'.join(guidance)
    
    def check_declarative_tone(self, text: str) -> dict:
        """
        Check if text uses declarative statements vs exploratory language.
        
        Returns:
            Analysis of tone quality
        """
        
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Declarative indicators
        declarative_count = 0
        exploratory_count = 0
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            
            # Declarative: starts with subject-verb
            if re.match(r'^[a-z]+ (is|are|has|have|can|will|does|provides|offers)', sentence_lower):
                declarative_count += 1
            
            # Exploratory: contains hedge words or questions
            elif any(word in sentence_lower for word in ['let', 'explore', 'see', 'look', 'might', 'could']):
                exploratory_count += 1
        
        total = len(sentences)
        declarative_ratio = declarative_count / total if total > 0 else 0
        
        return {
            'total_sentences': total,
            'declarative_count': declarative_count,
            'exploratory_count': exploratory_count,
            'declarative_ratio': round(declarative_ratio, 2),
            'is_good': declarative_ratio >= 0.6
        }


# Singleton
_optimizer_instance = None

def get_language_optimizer() -> LanguageOptimizer:
    """Get or create optimizer instance"""
    global _optimizer_instance
    if _optimizer_instance is None:
        _optimizer_instance = LanguageOptimizer()
    return _optimizer_instance
