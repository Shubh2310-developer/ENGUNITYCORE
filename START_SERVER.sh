#!/bin/bash
# Start Engunity Backend Server with ChatGPT-Level Features

echo "=================================="
echo "Starting Engunity Backend Server"
echo "ChatGPT-Level Features Enabled"
echo "=================================="
echo ""
echo "Features Active:"
echo "  ✅ Semantic Chunking (LlamaIndex)"
echo "  ✅ Multi-Modal Vision Processing"
echo "  ✅ Hierarchical Memory System"
echo "  ✅ RAGAS Quality Evaluation"
echo ""
echo "API Endpoints:"
echo "  - Chat: http://localhost:8000/api/v1/chat"
echo "  - Memory: http://localhost:8000/api/v1/memory"
echo "  - Docs: http://localhost:8000/docs"
echo ""
echo "Starting server..."
echo ""

cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
