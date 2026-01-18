from rank_bm25 import BM25Okapi
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import pickle
import re
from typing import List, Dict, Any, Optional

class VectorStore:
    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5", storage_path: str = None):
        print(f"Initializing VectorStore with model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.is_bge = "bge" in model_name.lower()

        # Use absolute path for storage to be consistent
        if storage_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            storage_path = os.path.join(base_dir, "storage", "vector_store")

        self.storage_path = storage_path
        self.index_file = os.path.join(storage_path, "index.faiss")
        self.metadata_file = os.path.join(storage_path, "metadata.pkl")
        self.bm25_file = os.path.join(storage_path, "bm25.pkl")

        # Ensure storage directory exists
        os.makedirs(storage_path, exist_ok=True)

        self.index = None
        self.metadata = []
        self.bm25 = None
        self.load()

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization for BM25"""
        return re.findall(r'\w+', text.lower())

    def _build_bm25(self):
        """Build BM25 index from current metadata"""
        if not self.metadata:
            self.bm25 = None
            return

        corpus = [self._tokenize(meta.get("text", "")) for meta in self.metadata]
        self.bm25 = BM25Okapi(corpus)

    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]]):
        if not texts:
            return

        # BGE models perform better with instructions
        processed_texts = texts
        if self.is_bge:
            processed_texts = [f"Represent this document for retrieval: {text}" for text in texts]

        embeddings = self.model.encode(processed_texts, normalize_embeddings=True)

        if self.index is None:
            # Use IndexHNSWFlat for production-grade speed and scalability (ChatGPT/Gemini level)
            # M=32 is a good balance between speed and accuracy
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)
            self.index.hnsw.efConstruction = 200
            self.index.hnsw.efSearch = 100

        self.index.add(np.array(embeddings).astype('float32'))
        self.metadata.extend(metadatas)

        # Rebuild BM25
        self._build_bm25()
        self.save()

    def search(self, query: str, user_id: str = None, session_id: str = None, doc_type: str = None, k: int = 5, alpha: float = 0.5):
        """
        Hybrid search combining Dense (FAISS) and Sparse (BM25)
        alpha: Weight for dense search (0-1). 1.0 = pure vector, 0.0 = pure BM25
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        # 1. Dense Search
        processed_query = query
        if self.is_bge:
            processed_query = f"Represent this query for retrieving relevant documents: {query}"

        query_vector = self.model.encode([processed_query], normalize_embeddings=True)
        # Search more to allow for fusion and filtering
        search_k = min(k * 10, self.index.ntotal)
        dense_distances, dense_indices = self.index.search(np.array(query_vector).astype('float32'), search_k)

        # 2. Sparse Search (BM25)
        sparse_scores = {}
        if self.bm25:
            tokenized_query = self._tokenize(query)
            bm25_scores = self.bm25.get_scores(tokenized_query)
            # Normalize BM25 scores to [0, 1] range roughly
            if len(bm25_scores) > 0:
                max_bm25 = np.max(bm25_scores) if np.max(bm25_scores) > 0 else 1.0
                bm25_scores = bm25_scores / max_bm25

            for i, score in enumerate(bm25_scores):
                sparse_scores[i] = score

        # 3. Reciprocal Rank Fusion (RRF) or Simple Weighted Fusion
        # We'll use Reciprocal Rank Fusion for robustness
        fused_scores = {}
        k_rrf = 60

        # Add dense ranks
        for rank, idx in enumerate(dense_indices[0]):
            if idx == -1: continue
            fused_scores[idx] = fused_scores.get(idx, 0) + alpha * (1.0 / (k_rrf + rank))

        # Add sparse ranks
        if self.bm25:
            # Sort all BM25 scores to get ranks
            sparse_indices = np.argsort(list(sparse_scores.values()))[::-1][:search_k]
            for rank, idx in enumerate(sparse_indices):
                fused_scores[idx] = fused_scores.get(idx, 0) + (1 - alpha) * (1.0 / (k_rrf + rank))

        # 4. Filter and Sort
        sorted_indices = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in sorted_indices:
            meta = self.metadata[idx]

            # Filter by user_id
            if user_id and str(meta.get("user_id")) != str(user_id):
                continue

            # Filter by session_id (if provided, only return docs from this session)
            if session_id and meta.get("session_id") and str(meta.get("session_id")) != str(session_id):
                continue

            # Filter by doc_type
            if doc_type and meta.get("type") != doc_type:
                continue

            results.append({
                "content": meta.get("text", ""),
                "metadata": meta,
                "score": float(score),
                "rank_score": score
            })

            if len(results) >= k:
                break

        return results

    def delete_document(self, document_id: str):
        """Delete all chunks belonging to a specific document_id."""
        initial_count = len(self.metadata)
        keep_indices = [i for i, meta in enumerate(self.metadata) if meta.get("document_id") != document_id]

        if len(keep_indices) == initial_count:
            return False

        remaining_texts = [self.metadata[i].get("text", "") for i in keep_indices]
        remaining_metadatas = [self.metadata[i] for i in keep_indices]

        # Reset and re-add using HNSW for consistency
        self.index = faiss.IndexHNSWFlat(self.dimension, 32)
        self.metadata = []
        self.add_texts(remaining_texts, remaining_metadatas)
        return True

    def save(self):
        if self.index is not None:
            # HNSW indices must be saved to disk
            faiss.write_index(self.index, self.index_file)
        with open(self.metadata_file, "wb") as f:
            pickle.dump(self.metadata, f)
        if self.bm25:
            with open(self.bm25_file, "wb") as f:
                pickle.dump(self.bm25, f)

    def load(self):
        if os.path.exists(self.index_file):
            self.index = faiss.read_index(self.index_file)
        else:
            # Default to HNSW for new indices
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)
            self.index.hnsw.efConstruction = 200
            self.index.hnsw.efSearch = 100

        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, "rb") as f:
                self.metadata = pickle.load(f)

        if os.path.exists(self.bm25_file):
            with open(self.bm25_file, "rb") as f:
                self.bm25 = pickle.load(f)
        elif self.metadata:
            self._build_bm25()

vector_store = VectorStore()
