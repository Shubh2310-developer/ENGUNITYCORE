"""
Quality Metrics and Logging
Part 11 of Text Quality Upgrade Plan
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class QualityMetrics:
    """
    Comprehensive quality tracking for text generation.
    """
    
    def __init__(self):
        self.metrics_log = []
    
    def calculate_overall_quality(
        self,
        structure_score: float,
        density_score: float,
        naturalness_score: float,
        confidence: float,
        complexity: str
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive quality score.
        
        6 Dimensions:
        1. Intent Alignment (via confidence)
        2. Information Density
        3. Structural Clarity
        4. Groundedness (via confidence)
        5. Actionability (via structure)
        6. Consistency (measured over time)
        """
        
        # Weighted quality calculation
        weights = {
            'structure': 0.25,
            'density': 0.25,
            'naturalness': 0.20,
            'confidence': 0.30
        }
        
        overall_score = (
            weights['structure'] * structure_score +
            weights['density'] * density_score +
            weights['naturalness'] * naturalness_score +
            weights['confidence'] * confidence
        )
        
        # Categorize quality
        if overall_score >= 0.85:
            quality_tier = "Excellent"
        elif overall_score >= 0.70:
            quality_tier = "Good"
        elif overall_score >= 0.50:
            quality_tier = "Acceptable"
        else:
            quality_tier = "Needs Improvement"
        
        return {
            'overall_score': round(overall_score, 3),
            'quality_tier': quality_tier,
            'dimensions': {
                'intent_alignment': round(confidence, 3),
                'information_density': round(density_score, 3),
                'structural_clarity': round(structure_score, 3),
                'groundedness': round(confidence, 3),
                'actionability': round(structure_score, 3),  # Correlated with structure
                'naturalness': round(naturalness_score, 3)
            },
            'complexity': complexity,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def log_generation_quality(
        self,
        query: str,
        response: str,
        quality_data: Dict[str, Any],
        refinement_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log quality metrics for analysis.
        """
        
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'query': query[:200],  # Truncate for privacy
            'response_length': len(response.split()),
            'quality': quality_data,
            'refinement': refinement_data
        }
        
        self.metrics_log.append(log_entry)
        
        # Log to standard logger
        logger.info(
            f"Quality Metrics: Score={quality_data['overall_score']} "
            f"Tier={quality_data['quality_tier']} "
            f"Complexity={quality_data['complexity']}"
        )
        
        # If quality is poor, log warning
        if quality_data['overall_score'] < 0.5:
            logger.warning(
                f"Low quality response detected: {quality_data['overall_score']}\n"
                f"Dimensions: {quality_data['dimensions']}"
            )
    
    def get_quality_summary(self, last_n: int = 100) -> Dict[str, Any]:
        """
        Get summary statistics for recent generations.
        """
        
        if not self.metrics_log:
            return {'message': 'No metrics available'}
        
        recent = self.metrics_log[-last_n:]
        
        # Calculate averages
        avg_score = sum(m['quality']['overall_score'] for m in recent) / len(recent)
        
        # Quality distribution
        tiers = {}
        for entry in recent:
            tier = entry['quality']['quality_tier']
            tiers[tier] = tiers.get(tier, 0) + 1
        
        # Average dimensions
        dimensions = {}
        for dim in ['intent_alignment', 'information_density', 'structural_clarity', 
                    'groundedness', 'actionability', 'naturalness']:
            scores = [m['quality']['dimensions'][dim] for m in recent]
            dimensions[dim] = round(sum(scores) / len(scores), 3)
        
        # Refinement stats
        refinement_count = sum(
            1 for m in recent 
            if m.get('refinement') and m.get('refinement', {}).get('refinement_applied', False)
        )
        
        return {
            'sample_size': len(recent),
            'average_quality_score': round(avg_score, 3),
            'quality_distribution': tiers,
            'average_dimensions': dimensions,
            'refinement_rate': round(refinement_count / len(recent), 2),
            'timestamp': datetime.utcnow().isoformat()
        }


class QualityLogger:
    """
    Dedicated logger for quality tracking with structured output.
    """
    
    def __init__(self, log_file: str = "quality_metrics.jsonl"):
        self.log_file = log_file
        self.logger = logging.getLogger("quality_logger")
    
    def log_interaction(
        self,
        query: str,
        response: str,
        metadata: Dict[str, Any]
    ) -> None:
        """
        Log a complete interaction with all quality metrics.
        """
        
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'query_length': len(query.split()),
            'response_length': len(response.split()),
            'complexity': metadata.get('complexity', 'unknown'),
            'quality_scores': {
                'structure': metadata.get('structure_score', 0),
                'density': metadata.get('density_score', 0),
                'naturalness': metadata.get('naturalness_score', 0),
                'confidence': metadata.get('confidence', 0),
                'overall': metadata.get('overall_quality_score', 0)
            },
            'refinement_applied': metadata.get('refinement_applied', False),
            'refinement_improvements': metadata.get('refinement_improvements', {}),
            'retrieval_quality': metadata.get('retrieval_quality', 'unknown'),
            'used_web_search': metadata.get('used_web_search', False)
        }
        
        # Write to JSONL file
        try:
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            self.logger.error(f"Failed to write quality log: {e}")
    
    def analyze_quality_trends(self) -> Dict[str, Any]:
        """
        Analyze quality trends from log file.
        """
        
        try:
            with open(self.log_file, 'r') as f:
                entries = [json.loads(line) for line in f]
            
            if not entries:
                return {'message': 'No log entries found'}
            
            # Recent entries (last 100)
            recent = entries[-100:]
            
            # Calculate trends
            avg_quality = sum(e['quality_scores']['overall'] for e in recent) / len(recent)
            avg_response_length = sum(e['response_length'] for e in recent) / len(recent)
            refinement_rate = sum(1 for e in recent if e['refinement_applied']) / len(recent)
            
            # Complexity breakdown
            complexity_stats = {}
            for entry in recent:
                comp = entry['complexity']
                if comp not in complexity_stats:
                    complexity_stats[comp] = {'count': 0, 'avg_quality': 0}
                complexity_stats[comp]['count'] += 1
                complexity_stats[comp]['avg_quality'] += entry['quality_scores']['overall']
            
            for comp in complexity_stats:
                count = complexity_stats[comp]['count']
                complexity_stats[comp]['avg_quality'] /= count
                complexity_stats[comp]['avg_quality'] = round(complexity_stats[comp]['avg_quality'], 3)
            
            return {
                'total_entries': len(entries),
                'recent_sample': len(recent),
                'average_quality': round(avg_quality, 3),
                'average_response_length': round(avg_response_length, 1),
                'refinement_rate': round(refinement_rate, 2),
                'complexity_breakdown': complexity_stats
            }
            
        except Exception as e:
            self.logger.error(f"Failed to analyze quality trends: {e}")
            return {'error': str(e)}


# Singleton instances
_quality_metrics_instance = None
_quality_logger_instance = None

def get_quality_metrics() -> QualityMetrics:
    """Get or create quality metrics instance"""
    global _quality_metrics_instance
    if _quality_metrics_instance is None:
        _quality_metrics_instance = QualityMetrics()
    return _quality_metrics_instance

def get_quality_logger() -> QualityLogger:
    """Get or create quality logger instance"""
    global _quality_logger_instance
    if _quality_logger_instance is None:
        _quality_logger_instance = QualityLogger()
    return _quality_logger_instance
