from typing import List, Dict
from loguru import logger
from .web_search import WebSearchFallback

class RetrievalEvaluator:
    """
    Evaluate retrieval quality using LLM and scores
    """
    def __init__(self, llm_client, threshold_correct: float = 0.7, threshold_incorrect: float = 0.3):
        self.llm = llm_client
        self.threshold_correct = threshold_correct
        self.threshold_incorrect = threshold_incorrect

    async def evaluate(self, query: str, retrieved_docs: List[Dict]) -> str:
        """
        Evaluate if retrieved docs are relevant to the query
        Returns: 'CORRECT', 'AMBIGUOUS', or 'INCORRECT'
        """
        if not retrieved_docs:
            return "INCORRECT"

        # Step 1: Score-based heuristic check (fast)
        scores = [doc.get("score", 0) for doc in retrieved_docs]
        min_score = min(scores) if scores else 2.0

        # If very good match, skip LLM for efficiency
        if min_score < 0.5:
            return "CORRECT"

        # Step 2: LLM-based verification (robust)
        context_snippet = "\n\n".join([f"Source {i+1}: {doc['content'][:500]}" for i, doc in enumerate(retrieved_docs[:3])])

        prompt = f"""Evaluate if the following retrieved context contains information relevant to answering the user query.
Query: {query}

Retrieved Context:
{context_snippet}

Is this context relevant? Return ONLY one of these three words:
CORRECT - Context is highly relevant and contains the answer or key information.
AMBIGUOUS - Context is partially relevant or related but missing key details.
INCORRECT - Context is irrelevant or completely off-topic.

Rating:"""

        try:
            rating = await self.llm.get_completion(
                [{"role": "system", "content": "You are a retrieval relevance evaluator."},
                 {"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.1
            )

            rating = rating.strip().upper()
            if "CORRECT" in rating: return "CORRECT"
            if "INCORRECT" in rating: return "INCORRECT"
            return "AMBIGUOUS"

        except Exception as e:
            logger.error(f"Error in LLM evaluation: {e}")
            # Fallback to score heuristic
            if min_score < 1.2: return "CORRECT"
            if min_score < 1.7: return "AMBIGUOUS"
            return "INCORRECT"

class CRAGPipeline:
    """
    Corrective Retrieval Augmented Generation
    """
    def __init__(self, evaluator: RetrievalEvaluator, web_search: WebSearchFallback):
        self.evaluator = evaluator
        self.web_search = web_search

    async def retrieve_with_correction(self, query: str, retrieved_docs: List[Dict]) -> Dict:
        """
        Evaluate and optionally correct retrieval with web search
        """
        quality = await self.evaluator.evaluate(query, retrieved_docs)

        final_docs = retrieved_docs
        used_web_search = False

        if quality == "INCORRECT":
            # Discard and use web search
            final_docs = await self.web_search.search(query)
            used_web_search = True
        elif quality == "AMBIGUOUS":
            # Combine with web search
            web_docs = await self.web_search.search(query)
            final_docs = retrieved_docs + web_docs
            used_web_search = True

        return {
            "documents": final_docs,
            "retrieval_quality": quality,
            "used_web_search": used_web_search
        }

class SelfCritique:
    """
    Implements Self-RAG reflection/critique logic
    """
    def __init__(self, llm_client):
        self.llm = llm_client

    async def critique(self, query: str, response: str, documents: List[Dict]) -> Dict:
        """
        Critique a generated response based on provided documents
        """
        context_text = "\n\n".join([doc['content'] for doc in documents[:5]])

        prompt = f"""Evaluate the following AI response based on the provided context and original query.
Check for accuracy, support from context, and usefulness.

Query: {query}
Context: {context_text}
Response: {response}

Analyze the response using these criteria:
1. Is the response supported by the context? [IsSup: Yes/No]
2. Is the response relevant to the query? [IsRel: Yes/No]
3. Is the response useful? [IsUse: Yes/No]

Provide a short critique and a final confidence score (0.0 to 1.0).
"""

        try:
            critique_text = await self.llm.get_completion(
                [{"role": "system", "content": "You are a factual accuracy evaluator."},
                 {"role": "user", "content": prompt}],
                temperature=0.1
            )

            # Simple parsing of confidence score
            confidence = 0.8 # Default
            if "score" in critique_text.lower():
                import re
                scores = re.findall(r"0\.\d+|1\.0", critique_text)
                if scores:
                    confidence = float(scores[-1])

            return {
                "critique": critique_text,
                "confidence": confidence,
                "is_supported": "[IsSup: Yes]" in critique_text
            }
        except Exception as e:
            logger.error(f"Error in self-critique: {e}")
            return {"critique": "Failed to generate critique", "confidence": 0.5, "is_supported": True}
