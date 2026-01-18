from typing import List, Dict, Optional
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from loguru import logger

class QueryComplexityClassifier:
    """
    Classifies queries into complexity levels:
    - SIMPLE: General knowledge, no retrieval needed
    - SINGLE_HOP: Factual, single-document lookup
    - MULTI_HOP: Requires reasoning across multiple documents
    """

    def __init__(self, model_name="distilbert-base-uncased"):
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=3
            )
            self.model.eval()
        except Exception as e:
            logger.error(f"Error loading complexity classifier: {e}")
            self.tokenizer = None
            self.model = None

        self.complexity_labels = {
            0: "SIMPLE",
            1: "SINGLE_HOP",
            2: "MULTI_HOP"
        }

    def extract_features(self, query: str) -> dict:
        """Extract query features for classification"""
        query_lower = query.lower()
        features = {
            'length': len(query.split()),
            'has_wh_words': any(w in query_lower for w in ['what', 'when', 'where', 'who', 'why', 'how']),
            'has_compare': any(w in query_lower for w in ['compare', 'difference', 'versus', 'vs']),
            'has_aggregate': any(w in query_lower for w in ['all', 'every', 'summarize', 'overview', 'total']),
            'has_temporal': any(w in query_lower for w in ['trend', 'over time', 'historical', 'evolution']),
        }
        return features

    def predict_complexity(self, query: str) -> str:
        """Predict query complexity level"""
        # Extract features
        features = self.extract_features(query)

        # Rule-based heuristics (fast path)
        if not features['has_wh_words'] and features['length'] < 10:
            return "SIMPLE"

        if features['has_compare'] or features['has_aggregate'] or features['has_temporal']:
            return "MULTI_HOP"

        if not self.model or not self.tokenizer:
            return "SINGLE_HOP" # Default fallback

        # Model-based classification (for ambiguous cases)
        try:
            inputs = self.tokenizer(query, return_tensors="pt", truncation=True, max_length=128)
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.softmax(outputs.logits, dim=-1)
                predicted_class = torch.argmax(predictions, dim=-1).item()

            return self.complexity_labels[predicted_class]
        except Exception as e:
            logger.error(f"Error in model prediction: {e}")
            return "SINGLE_HOP"

    def route_query(self, query: str, pipelines: dict):
        """Route query to appropriate pipeline"""
        complexity = self.predict_complexity(query)

        if complexity == "SIMPLE":
            return pipelines['direct_generation'](query)
        elif complexity == "SINGLE_HOP":
            return pipelines['vector_rag'](query)
        else:  # MULTI_HOP
            return pipelines['graph_rag'](query)
