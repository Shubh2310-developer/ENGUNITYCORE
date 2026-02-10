"""
FastAPI Dependencies for Lazy-Loaded AI Services
Use these in route handlers via Depends()
"""
from typing import TYPE_CHECKING
from app.core.service_registry import services

if TYPE_CHECKING:
    from app.services.ai.vector_store import VectorStore
    from app.services.rag.reranker import FlashRankReranker
    from app.services.rag.classifier import QueryComplexityClassifier


def get_vector_store() -> 'VectorStore':
    """
    FastAPI dependency for vector store.
    Loads only when endpoint is called.
    
    Usage:
        @router.post("/query")
        def query(vs = Depends(get_vector_store)):
            return vs.search(...)
    """
    return services.get_vector_store()


def get_reranker() -> 'FlashRankReranker':
    """
    FastAPI dependency for reranker.
    Loads only when endpoint is called.
    """
    return services.get_reranker()


def get_classifier() -> 'QueryComplexityClassifier':
    """
    FastAPI dependency for query classifier.
    Loads only when endpoint is called.
    """
    return services.get_classifier()
