from typing import List, Dict, Tuple
import numpy as np
from sentence_transformers import CrossEncoder, SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from loguru import logger

class FlashRankReranker:
    """
    Two-stage retrieval with marginal utility reranking
    Implements the FlashRank algorithm
    """

    def __init__(
        self,
        reranker_model: str = "BAAI/bge-reranker-base",
        similarity_model: str = "BAAI/bge-large-en-v1.5",
        diversity_weight: float = 0.3
    ):
        try:
            print(f"Loading Optimized Reranker: {reranker_model}")
            self.reranker = CrossEncoder(reranker_model, max_length=512)
            self.embedder = SentenceTransformer(similarity_model)
        except Exception as e:
            logger.error(f"Error loading reranker models: {e}")
            self.reranker = None
            self.embedder = None
        self.diversity_weight = diversity_weight

    def calculate_relevance_scores(
        self,
        query: str,
        documents: List[str]
    ) -> np.ndarray:
        """
        Calculate relevance scores using cross-encoder
        """
        if not self.reranker:
            return np.zeros(len(documents))
        pairs = [[query, doc] for doc in documents]
        scores = self.reranker.predict(pairs)
        return np.array(scores)

    def calculate_diversity_matrix(
        self,
        documents: List[str]
    ) -> np.ndarray:
        """
        Calculate pairwise similarity between documents
        """
        if not self.embedder:
            return np.zeros((len(documents), len(documents)))
        embeddings = self.embedder.encode(documents)
        similarity_matrix = cosine_similarity(embeddings)
        return similarity_matrix

    def marginal_utility_selection(
        self,
        relevance_scores: np.ndarray,
        similarity_matrix: np.ndarray,
        top_k: int = 5
    ) -> List[int]:
        """
        Greedy selection maximizing marginal utility
        """
        n_docs = len(relevance_scores)
        if n_docs == 0:
            return []

        selected_indices = []
        remaining_indices = list(range(n_docs))

        # Select first document (highest relevance)
        first_idx = int(np.argmax(relevance_scores))
        selected_indices.append(first_idx)
        remaining_indices.remove(first_idx)

        # Iteratively select documents with highest marginal utility
        for _ in range(min(top_k - 1, len(remaining_indices))):
            marginal_utilities = []

            for idx in remaining_indices:
                # Base relevance score
                relevance = relevance_scores[idx]

                # Penalty for similarity to already selected documents
                max_similarity = max(
                    similarity_matrix[idx][selected_idx]
                    for selected_idx in selected_indices
                )

                # Marginal utility = relevance - diversity_penalty
                utility = relevance - (self.diversity_weight * max_similarity)
                marginal_utilities.append(utility)

            # Select document with highest marginal utility
            best_idx = remaining_indices[int(np.argmax(marginal_utilities))]
            selected_indices.append(best_idx)
            remaining_indices.remove(best_idx)

        return selected_indices

    def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 5,
        return_scores: bool = True
    ) -> List[Dict]:
        """
        Main reranking function
        """
        if not documents:
            return []

        if not self.reranker or not self.embedder:
            logger.warning("Reranker or embedder not initialized, skipping reranking")
            return documents[:top_k]

        # Extract text content
        doc_texts = [doc.get('content', '') for doc in documents]

        # Calculate relevance scores
        relevance_scores = self.calculate_relevance_scores(query, doc_texts)

        # Calculate diversity matrix
        similarity_matrix = self.calculate_diversity_matrix(doc_texts)

        # Select documents using marginal utility
        selected_indices = self.marginal_utility_selection(
            relevance_scores,
            similarity_matrix,
            top_k
        )

        # Prepare results
        reranked_docs = []
        for rank, idx in enumerate(selected_indices):
            doc = documents[idx].copy()
            if return_scores:
                doc['rerank_score'] = float(relevance_scores[idx])
                doc['rerank_position'] = rank + 1
            reranked_docs.append(doc)

        return reranked_docs
