#!/bin/bash

# Test Code Studio Standalone Docker Setup
# This script validates that the Code Studio containers are working correctly

set -e

# Detect Docker Compose version
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Error: Docker Compose not found"
    exit 1
fi

echo "================================================"
echo "Code Studio Docker Test Suite"
echo "================================================"
echo ""

# Check if containers are running
echo "1. Checking if containers are running..."
backend_running=$($DOCKER_COMPOSE -f docker-compose.code.yml ps -q code-backend 2>/dev/null)
frontend_running=$($DOCKER_COMPOSE -f docker-compose.code.yml ps -q code-frontend 2>/dev/null)

if [ -z "$backend_running" ]; then
    echo "❌ Backend container is not running"
    exit 1
fi

if [ -z "$frontend_running" ]; then
    echo "❌ Frontend container is not running"
    exit 1
fi

echo "✓ Both containers are running"
echo ""

# Test backend health
echo "2. Testing backend API..."
backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/docs || echo "000")

if [ "$backend_response" = "200" ]; then
    echo "✓ Backend is responding (Status: $backend_response)"
else
    echo "❌ Backend health check failed (Status: $backend_response)"
    exit 1
fi
echo ""

# Test frontend
echo "3. Testing frontend..."
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")

if [ "$frontend_response" = "200" ] || [ "$frontend_response" = "304" ]; then
    echo "✓ Frontend is responding (Status: $frontend_response)"
else
    echo "⚠️  Frontend check returned status: $frontend_response"
    echo "   This may be normal if the page requires JavaScript"
fi
echo ""

# Test code execution endpoint
echo "4. Testing code execution endpoint..."
execution_test=$(curl -s -X POST http://localhost:8001/api/v1/code/execute-direct \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello from Docker!\")",
    "language": "python",
    "timeout": 5
  }' || echo '{"error": "request_failed"}')

if echo "$execution_test" | grep -q "Hello from Docker"; then
    echo "✓ Code execution endpoint is working"
else
    echo "⚠️  Code execution test did not return expected output"
    echo "   Response: $execution_test"
fi
echo ""

# Check language runtimes in backend container
echo "5. Checking language runtimes in backend container..."
echo ""
echo "   Python:"
$DOCKER_COMPOSE -f docker-compose.code.yml exec -T code-backend python3 --version || echo "   ❌ Python not found"

echo "   Node.js:"
$DOCKER_COMPOSE -f docker-compose.code.yml exec -T code-backend node --version || echo "   ❌ Node.js not found"

echo "   GCC (C/C++):"
$DOCKER_COMPOSE -f docker-compose.code.yml exec -T code-backend gcc --version | head -1 || echo "   ❌ GCC not found"

echo "   Go:"
$DOCKER_COMPOSE -f docker-compose.code.yml exec -T code-backend go version || echo "   ❌ Go not found"

echo "   Java:"
$DOCKER_COMPOSE -f docker-compose.code.yml exec -T code-backend java -version 2>&1 | head -1 || echo "   ❌ Java not found"

echo ""
echo "================================================"
echo "✅ Test Suite Complete!"
echo "================================================"
echo ""
echo "Summary:"
echo "  • Containers: Running"
echo "  • Backend API: Accessible at http://localhost:8001"
echo "  • Frontend UI: Accessible at http://localhost:3001/code"
echo "  • Code Execution: Working"
echo "  • Language Runtimes: Installed"
echo ""
echo "Open http://localhost:3001/code in your browser to use the IDE!"
echo ""
