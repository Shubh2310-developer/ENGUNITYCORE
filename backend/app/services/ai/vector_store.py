import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import pickle
from typing import List, Dict, Any

class VectorStore:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", storage_path: str = None):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

        # Use absolute path for storage to be consistent
        if storage_path is None:
            # Default to backend/storage/vector_store
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            storage_path = os.path.join(base_dir, "storage", "vector_store")

        self.storage_path = storage_path
        self.index_file = os.path.join(storage_path, "index.faiss")
        self.metadata_file = os.path.join(storage_path, "metadata.pkl")

        # Ensure storage directory exists
        os.makedirs(storage_path, exist_ok=True)

        if os.path.exists(self.index_file):
            self.index = faiss.read_index(self.index_file)
            with open(self.metadata_file, "rb") as f:
                self.metadata = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []

    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]]):
        if not texts:
            return
        embeddings = self.model.encode(texts)
        self.index.add(np.array(embeddings).astype('float32'))
        self.metadata.extend(metadatas)
        self.save()

    def search(self, query: str, user_id: str = None, session_id: str = None, k: int = 5):
        if self.index.ntotal == 0:
            return []

        query_vector = self.model.encode([query])
        # Search more than k to allow for filtering
        search_k = k * 10 if (user_id or session_id) else k
        distances, indices = self.index.search(np.array(query_vector).astype('float32'), min(search_k, self.index.ntotal))

        results = []
        for i in range(len(indices[0])):
            idx = indices[0][i]
            if idx != -1:
                meta = self.metadata[idx]

                # Filter by user_id if provided (Security: MUST match user)
                if user_id and str(meta.get("user_id")) != str(user_id):
                    continue

                # Filter by session_id:
                # 1. If session_id is provided, include docs from this session OR global docs (session_id is None)
                # 2. If no session_id is provided, only include global docs
                meta_session_id = meta.get("session_id")
                if session_id:
                    if meta_session_id and meta_session_id != session_id:
                        continue
                elif meta_session_id:
                    # Searching globally, skip session-specific docs
                    continue

                results.append({
                    "content": meta.get("text", ""),
                    "metadata": meta,
                    "score": float(distances[0][i])
                })

                if len(results) >= k:
                    break
        return results

    def delete_document(self, document_id: str):
        """Delete all chunks belonging to a specific document_id."""
        initial_count = len(self.metadata)

        # Identify indices to keep
        keep_indices = [i for i, meta in enumerate(self.metadata) if meta.get("document_id") != document_id]

        if len(keep_indices) == initial_count:
            return False # Nothing deleted

        # Extract texts and metadatas to keep
        remaining_texts = [self.metadata[i].get("text", "") for i in keep_indices]
        remaining_metadatas = [self.metadata[i] for i in keep_indices]

        # Reset index and re-add remaining (simplest way for FlatL2 to ensure consistency)
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata = []

        if remaining_texts:
            self.add_texts(remaining_texts, remaining_metadatas)
        else:
            self.save()

        return True

    def save(self):
        faiss.write_index(self.index, self.index_file)
        with open(self.metadata_file, "wb") as f:
            pickle.dump(self.metadata, f)

    def load(self):
        if os.path.exists(self.index_file):
            self.index = faiss.read_index(self.index_file)
            with open(self.metadata_file, "rb") as f:
                self.metadata = pickle.load(f)

vector_store = VectorStore()
