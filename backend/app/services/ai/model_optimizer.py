"""
Model Loading Optimization Utilities
Reduces model loading time with CPU-specific optimizations
"""
import torch
import os
from loguru import logger

def optimize_torch_for_cpu():
    """
    Configure PyTorch for optimal CPU performance.
    Call this before loading any models.
    
    Note: Can only be called once before parallel work starts.
    Subsequent calls will be ignored to avoid threading errors.
    """
    # Global flag to track if optimization has been done
    if not hasattr(optimize_torch_for_cpu, '_initialized'):
        try:
            # Set number of threads for CPU operations
            num_threads = max(1, os.cpu_count() // 2)
            torch.set_num_threads(num_threads)
            
            # Only set interop threads if not already set
            # This must be done before any parallel work
            try:
                torch.set_num_interop_threads(num_threads)
            except RuntimeError as e:
                if "parallel work has started" in str(e):
                    logger.debug("⚠️  PyTorch interop threads already set (parallel work started)")
                else:
                    raise
            
            # Disable gradient computation (inference only)
            torch.set_grad_enabled(False)
            
            logger.info(f"✅ PyTorch optimized for CPU with {num_threads} threads")
            optimize_torch_for_cpu._initialized = True
        except Exception as e:
            logger.warning(f"⚠️  Could not optimize PyTorch: Error: {e}")
            optimize_torch_for_cpu._initialized = True  # Mark as attempted
    else:
        logger.debug("PyTorch already optimized, skipping re-initialization")


def get_model_device():
    """
    Get optimal device for model inference.
    Explicitly returns 'cpu' for consistency.
    """
    return 'cpu'


def optimize_sentence_transformer_loading():
    """
    Set environment variables for faster sentence-transformers loading.
    Call this at module import time.
    """
    # Disable tokenizers parallelism to avoid warnings
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    
    # Use cached models, don't re-download
    os.environ["TRANSFORMERS_OFFLINE"] = "0"
    
    # Cache directory (optional - customize if needed)
    # os.environ["SENTENCE_TRANSFORMERS_HOME"] = "/app/.cache/sentence_transformers"
    
    logger.debug("Sentence transformers environment optimized")


# Auto-optimize on import
optimize_sentence_transformer_loading()
