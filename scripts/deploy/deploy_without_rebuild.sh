#!/bin/bash
# Deploy optimizations WITHOUT rebuilding Docker image
# This applies changes to the existing container

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   APPLYING OPTIMIZATIONS WITHOUT DOCKER REBUILD            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if backend is running
if docker ps | grep -q engunity-backend; then
    echo "✅ Backend container is running"
    
    # Copy optimized files to running container
    echo ""
    echo "📦 Copying optimized files to container..."
    
    docker cp backend/app/core/database.py engunity-backend:/app/app/core/database.py
    docker cp backend/app/core/cache_middleware.py engunity-backend:/app/app/core/cache_middleware.py
    docker cp backend/app/core/query_cache.py engunity-backend:/app/app/core/query_cache.py
    docker cp backend/app/services/ai/model_optimizer.py engunity-backend:/app/app/services/ai/model_optimizer.py
    docker cp backend/app/services/ai/vector_store.py engunity-backend:/app/app/services/ai/vector_store.py
    docker cp backend/app/services/rag/reranker.py engunity-backend:/app/app/services/rag/reranker.py
    docker cp backend/app/services/rag/classifier.py engunity-backend:/app/app/services/rag/classifier.py
    docker cp backend/app/main.py engunity-backend:/app/app/main.py
    
    echo "✅ Files copied successfully"
    
    # Restart the container to apply changes
    echo ""
    echo "🔄 Restarting backend container..."
    docker restart engunity-backend
    
    echo ""
    echo "⏳ Waiting for backend to restart (20 seconds)..."
    sleep 20
    
    # Test
    echo ""
    echo "🧪 Testing API..."
    curl -s http://localhost:8001/health | head -5
    
    echo ""
    echo ""
    echo "✅ Optimizations applied!"
    echo ""
    echo "⚠️  NOTE: This applies code changes but NOT infrastructure changes like:"
    echo "   • Worker count (still using current setting)"
    echo "   • You'll need to rebuild to get 8 workers"
    
else
    echo "❌ Backend container is not running"
    echo ""
    echo "Please start the backend first:"
    echo "   docker compose up -d backend"
fi
