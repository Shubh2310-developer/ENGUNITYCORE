from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class RAGEvaluator:
    """
    Automated RAG quality evaluation using RAGAS framework
    """
    
    def __init__(self):
        try:
            from ragas import evaluate
            from ragas.metrics import (
                faithfulness,
                answer_relevancy,
                context_precision,
                context_recall,
            )
            from datasets import Dataset
            
            self.evaluate = evaluate
            self.Dataset = Dataset
            self.metrics = [
                faithfulness,          # Is answer supported by context?
                answer_relevancy,      # Does answer address question?
                context_precision,     # Are retrieved docs relevant?
                context_recall,        # Did we retrieve all needed info?
            ]
            self.ragas_available = True
            logger.info("✅ RAGAS evaluator initialized")
        except ImportError:
            logger.warning("RAGAS not available. Install with: pip install ragas datasets")
            self.ragas_available = False
    
    async def evaluate_responses(
        self,
        test_cases: List[Dict]
    ) -> Dict:
        """
        Evaluate RAG system on test cases
        
        test_cases format:
        [
            {
                "question": "What is RAG?",
                "answer": "RAG is...",
                "contexts": ["Context 1", "Context 2"],
                "ground_truth": "RAG stands for..."  # Optional
            }
        ]
        """
        if not self.ragas_available:
            return {"error": "RAGAS not available"}
        
        # Convert to RAGAS dataset format
        dataset = self.Dataset.from_dict({
            'question': [tc['question'] for tc in test_cases],
            'answer': [tc['answer'] for tc in test_cases],
            'contexts': [tc['contexts'] for tc in test_cases],
            'ground_truth': [tc.get('ground_truth', '') for tc in test_cases]
        })
        
        # Evaluate
        logger.info(f"Evaluating {len(test_cases)} test cases...")
        results = self.evaluate(dataset, metrics=self.metrics)
        
        # Log results
        logger.info("Evaluation Results:")
        logger.info(f"  Faithfulness: {results.get('faithfulness', 0):.3f}")
        logger.info(f"  Answer Relevancy: {results.get('answer_relevancy', 0):.3f}")
        logger.info(f"  Context Precision: {results.get('context_precision', 0):.3f}")
        logger.info(f"  Context Recall: {results.get('context_recall', 0):.3f}")
        
        return results
    
    async def quick_eval(
        self,
        question: str,
        answer: str,
        contexts: List[str]
    ) -> Dict:
        """Quick evaluation of single QA pair"""
        if not self.ragas_available:
            return {"error": "RAGAS not available"}
        
        from ragas.metrics import faithfulness, answer_relevancy
        
        dataset = self.Dataset.from_dict({
            'question': [question],
            'answer': [answer],
            'contexts': [contexts]
        })
        
        results = self.evaluate(
            dataset, 
            metrics=[faithfulness, answer_relevancy]
        )
        
        return {
            'faithfulness': float(results.get('faithfulness', 0)),
            'answer_relevancy': float(results.get('answer_relevancy', 0))
        }
    
    def continuous_evaluation_decorator(self, rag_function):
        """
        Decorator for continuous evaluation
        Usage:
            @evaluator.continuous_evaluation_decorator
            async def query_rag(query: str):
                ...
        """
        async def wrapper(query: str, *args, **kwargs):
            # Run RAG
            result = await rag_function(query, *args, **kwargs)
            
            # Quick eval
            if result.get('answer') and result.get('contexts'):
                eval_result = await self.quick_eval(
                    question=query,
                    answer=result['answer'],
                    contexts=result['contexts']
                )
                
                # Log warnings for low scores
                if eval_result.get('faithfulness', 1) < 0.7:
                    logger.warning(
                        f"⚠️  Low faithfulness: {eval_result['faithfulness']:.2f} "
                        f"for query: {query[:50]}..."
                    )
                
                if eval_result.get('answer_relevancy', 1) < 0.7:
                    logger.warning(
                        f"⚠️  Low relevancy: {eval_result['answer_relevancy']:.2f} "
                        f"for query: {query[:50]}..."
                    )
                
                # Add eval scores to result
                result['evaluation'] = eval_result
            
            return result
        
        return wrapper


# Create singleton
evaluator = RAGEvaluator()
