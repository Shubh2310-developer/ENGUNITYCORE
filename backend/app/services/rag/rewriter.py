from typing import List, Dict, Optional
from loguru import logger

class QueryRewriter:
    """
    Optimizes user queries for improved retrieval performance.
    """
    def __init__(self, llm_client):
        self.llm = llm_client

    async def rewrite(self, query: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Rewrite the user query to be more descriptive and suitable for vector search.
        Handles conversational context by resolving anaphora (e.g., 'it', 'they', 'that').
        """
        if not history:
            # Simple optimization for a single query
            prompt = f"""Given the following user query, rewrite it to be more suitable for a semantic search engine.
Clarify intent, resolve ambiguity, and remove conversational filler.
IMPORTANT: If the query mentions 'the image', 'this picture', or similar visual references, keep that intent while making it more descriptive for retrieval.
IMPORTANT: Do not expand common industry acronyms (like RAG, AI, LLM, API) unless they are ambiguous in context.
Return ONLY the rewritten query text.

Original Query: {query}

Optimized Query:"""
        else:
            # Context-aware rewriting
            history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-5:]])
            prompt = f"""Given the following conversation history and the latest user query, rewrite the query to be a standalone search term.
Resolve any references to previous messages (like 'it', 'the report', 'that project').
IMPORTANT: If the user is asking about an image mentioned in the history or current query (e.g., 'what is this image?'), ensure the rewritten query reflects a request for image analysis or description.
Make the query descriptive and focused on information retrieval.
IMPORTANT: Do not expand common industry acronyms (like RAG, AI, LLM, API) unless they are ambiguous in context.
Return ONLY the rewritten query text.

Conversation History:
{history_text}

Latest User Query: {query}

Standalone Optimized Query:"""

        try:
            rewritten_query = await self.llm.get_completion(
                [{"role": "system", "content": "You are a search query optimization expert. Your task is to provide the single best search term or phrase. Do not include any explanations, preambles, or conversational text."},
                 {"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.2
            )

            # Clean up the response
            # Remove common prefixes like "Optimized Query:" or "Standalone Optimized Query:"
            clean_query = rewritten_query.strip().strip('"').strip("'")
            prefixes = ["Optimized Query:", "Standalone Optimized Query:", "Rewritten Query:", "Search Term:"]
            for prefix in prefixes:
                if clean_query.lower().startswith(prefix.lower()):
                    clean_query = clean_query[len(prefix):].strip()

            # Remove any trailing explanations (looking for newlines followed by "I made" or similar)
            if "\n" in clean_query:
                clean_query = clean_query.split("\n")[0].strip()

            logger.info(f"Query rewritten: '{query}' -> '{clean_query}'")
            return clean_query
        except Exception as e:
            logger.error(f"Error rewriting query: {e}")
            return query # Fallback to original
