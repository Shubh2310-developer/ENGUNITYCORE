from typing import List, Dict, Optional
import asyncio
from loguru import logger

class HyDEEngine:
    """
    Hypothetical Document Embeddings for improved retrieval
    """

    def __init__(self, llm_client, embedding_model):
        self.llm = llm_client
        self.embedder = embedding_model
        self.cache = {}  # Cache for common queries

    async def generate_hypothetical_document(
        self,
        query: str,
        document_style: str = "informative"
    ) -> str:
        """
        Generate a hypothetical document that would answer the query
        """
        # Check cache
        cache_key = f"{query}_{document_style}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Prompt engineering for different document styles
        prompts = {
            "informative": f"""Write a detailed, informative paragraph that would answer this question: {query}

Include specific facts, figures, and explanations. Write as if this is an excerpt from an encyclopedia or textbook.""",

            "technical": f"""Write a technical document excerpt that answers: {query}

Use precise terminology, include technical details, and maintain a formal academic tone.""",

            "conversational": f"""Write a clear, conversational explanation that answers: {query}

Explain as if teaching someone, using examples and accessible language."""
        }

        try:
            hypothetical_doc = await self.llm.get_completion(
                [{"role": "user", "content": prompts.get(document_style, prompts["informative"])}],
                max_tokens=200,
                temperature=0.3
            )

            # Cache result
            self.cache[cache_key] = hypothetical_doc
            return hypothetical_doc
        except Exception as e:
            logger.error(f"Error generating hypothetical document: {e}")
            return query # Fallback to original query

    async def transform_query(self, query: str) -> Dict:
        """
        Transform query using HyDE, return both original and transformed embeddings
        """
        # Generate hypothetical document
        hypo_doc = await self.generate_hypothetical_document(query)

        # Embed both query and hypothetical document
        # Note: self.embedder.encode usually returns a numpy array or list
        query_embedding = self.embedder.encode([query])[0]
        hypo_embedding = self.embedder.encode([hypo_doc])[0]

        return {
            "original_query": query,
            "hypothetical_document": hypo_doc,
            "query_embedding": query_embedding,
            "hyde_embedding": hypo_embedding,
            "use_hyde": True
        }
