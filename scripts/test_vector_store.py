import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.services.ai.vector_store import VectorStore
    print("Attempting to initialize VectorStore...")
    vs = VectorStore()
    print("VectorStore initialized successfully")
    print(f"Model: {vs.model}")
except Exception as e:
    print(f"Failed to initialize VectorStore: {e}")
    import traceback
    traceback.print_exc()
