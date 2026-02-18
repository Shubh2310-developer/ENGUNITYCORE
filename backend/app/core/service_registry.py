"""
Service Registry for Lazy Loading Heavy AI Components
This prevents ML models from blocking app startup
"""
from typing import Optional, TYPE_CHECKING
import os
from loguru import logger

if TYPE_CHECKING:
    from app.services.ai.vector_store import VectorStore
    from app.services.rag.reranker import FlashRankReranker
    from app.services.rag.classifier import QueryComplexityClassifier
    from app.services.rag.pipeline import OmniRAGPipeline


class ServiceRegistry:
    """
    Singleton registry for heavy AI services.
    Services are lazily loaded only when needed.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ServiceRegistry, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Heavy AI components - None until lazy-loaded
        self.vector_store: Optional['VectorStore'] = None
        self.reranker: Optional['FlashRankReranker'] = None
        self.classifier: Optional['QueryComplexityClassifier'] = None
        self.omni_rag: Optional['OmniRAGPipeline'] = None
        
        # Track loading status
        self._vector_store_loading = False
        self._reranker_loading = False
        self._classifier_loading = False
        self._omni_rag_loading = False
        
        # Check if AI is enabled (for dev mode with --reload)
        self.ai_enabled = os.getenv("ENABLE_AI", "true").lower() == "true"
        
        if not self.ai_enabled:
            logger.warning("🚫 AI services DISABLED (ENABLE_AI=false) - Fast dev mode")
        
        self._initialized = True
    
    def is_ai_enabled(self) -> bool:
        """Check if AI services are enabled"""
        return self.ai_enabled
    
    def get_vector_store(self) -> 'VectorStore':
        """Lazy load vector store on first access"""
        if not self.ai_enabled:
            raise RuntimeError("AI services are disabled (ENABLE_AI=false)")
        
        if self.vector_store is None and not self._vector_store_loading:
            self._vector_store_loading = True
            try:
                logger.info("🔄 Lazy loading VectorStore...")
                from app.services.ai.vector_store import VectorStore
                self.vector_store = VectorStore()
                logger.success("✅ VectorStore loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load VectorStore: {e}")
                self._vector_store_loading = False
                raise
            finally:
                self._vector_store_loading = False
        
        return self.vector_store
    
    def get_reranker(self) -> 'FlashRankReranker':
        """Lazy load reranker on first access"""
        if not self.ai_enabled:
            raise RuntimeError("AI services are disabled (ENABLE_AI=false)")
        
        if self.reranker is None and not self._reranker_loading:
            self._reranker_loading = True
            try:
                logger.info("🔄 Lazy loading Reranker...")
                from app.services.rag.reranker import FlashRankReranker
                self.reranker = FlashRankReranker()
                logger.success("✅ Reranker loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load Reranker: {e}")
                self._reranker_loading = False
                raise
            finally:
                self._reranker_loading = False
        
        return self.reranker
    
    def get_classifier(self) -> 'QueryComplexityClassifier':
        """Lazy load classifier on first access"""
        if not self.ai_enabled:
            raise RuntimeError("AI services are disabled (ENABLE_AI=false)")
        
        if self.classifier is None and not self._classifier_loading:
            self._classifier_loading = True
            try:
                logger.info("🔄 Lazy loading Query Classifier...")
                from app.services.rag.classifier import QueryComplexityClassifier
                self.classifier = QueryComplexityClassifier()
                logger.success("✅ Query Classifier loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load Query Classifier: {e}")
                self._classifier_loading = False
                raise
            finally:
                self._classifier_loading = False
        
        return self.classifier

    def get_omni_rag(self) -> 'OmniRAGPipeline':
        """Lazy load OmniRAG Pipeline on first access"""
        if not self.ai_enabled:
            raise RuntimeError("AI services are disabled (ENABLE_AI=false)")

        if self.omni_rag is None and not self._omni_rag_loading:
            self._omni_rag_loading = True
            try:
                logger.info("🔄 Lazy loading OmniRAG Pipeline...")
                from app.api.v1.omni_rag import get_omni_rag_pipeline
                self.omni_rag = get_omni_rag_pipeline()
                logger.success("✅ OmniRAG Pipeline loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load OmniRAG Pipeline: {e}")
                self._omni_rag_loading = False
                raise
            finally:
                self._omni_rag_loading = False
        
        return self.omni_rag
    
    def warmup_all(self):
        """Background warmup - load all AI services"""
        if not self.ai_enabled:
            logger.info("⏭️  Skipping AI warmup (AI disabled)")
            return
        
        logger.info("🔥 Starting background AI warmup...")
        try:
            self.get_vector_store()
            self.get_reranker()
            self.get_classifier()
            # self.get_omni_rag() 
            logger.success("✅ All AI services warmed up")
        except Exception as e:
            logger.error(f"❌ AI warmup failed: {e}")


# Global singleton instance
services = ServiceRegistry()
