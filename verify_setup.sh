#!/bin/bash

echo "=================================="
echo "Engunity Setup Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
fi

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python not found${NC}"
fi

# Check root dependencies
echo ""
echo "Checking root dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Root node_modules exists${NC}"
    if [ -d "node_modules/concurrently" ]; then
        echo -e "${GREEN}✅ concurrently installed${NC}"
    else
        echo -e "${YELLOW}⚠️  concurrently not found - run: npm install${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Root node_modules not found - run: npm install${NC}"
fi

# Check frontend dependencies
echo ""
echo "Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend node_modules exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend dependencies missing - run: cd frontend && npm install${NC}"
fi

# Check backend dependencies
echo ""
echo "Checking backend dependencies..."
cd backend 2>/dev/null
if python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${GREEN}✅ FastAPI installed${NC}"
else
    echo -e "${YELLOW}⚠️  FastAPI not found${NC}"
fi

if python3 -c "import llama_index" 2>/dev/null; then
    echo -e "${GREEN}✅ llama-index installed (Semantic Chunking)${NC}"
else
    echo -e "${YELLOW}⚠️  llama-index not found${NC}"
fi

if python3 -c "import transformers" 2>/dev/null; then
    echo -e "${GREEN}✅ transformers installed (Vision Processing)${NC}"
else
    echo -e "${YELLOW}⚠️  transformers not found${NC}"
fi

cd ..

# Check new features
echo ""
echo "Checking ChatGPT-level features..."
if [ -f "backend/app/services/memory/system.py" ]; then
    echo -e "${GREEN}✅ Memory system implemented${NC}"
else
    echo -e "${RED}❌ Memory system missing${NC}"
fi

if [ -f "backend/app/services/ai/vision_processor.py" ]; then
    echo -e "${GREEN}✅ Vision processor implemented${NC}"
else
    echo -e "${RED}❌ Vision processor missing${NC}"
fi

if [ -f "backend/app/api/v1/memory.py" ]; then
    echo -e "${GREEN}✅ Memory API endpoints created${NC}"
else
    echo -e "${RED}❌ Memory API missing${NC}"
fi

if [ -f "backend/app/evaluation/ragas_evaluator.py" ]; then
    echo -e "${GREEN}✅ RAGAS evaluator implemented${NC}"
else
    echo -e "${RED}❌ RAGAS evaluator missing${NC}"
fi

# Check env file
echo ""
echo "Checking configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found - copy from .env.example${NC}"
fi

# Check package.json
echo ""
echo "Checking startup configuration..."
if grep -q "npm run dev" package.json 2>/dev/null; then
    echo -e "${GREEN}✅ npm run dev configured${NC}"
else
    echo -e "${RED}❌ npm run dev not found in package.json${NC}"
fi

echo ""
echo "=================================="
echo "Verification Complete"
echo "=================================="
echo ""
echo "To start all services, run:"
echo -e "${GREEN}npm run dev${NC}"
echo ""
echo "Guides available:"
echo "  - QUICK_START.md (fast setup)"
echo "  - STARTUP_GUIDE.md (detailed docs)"
echo "  - IMPLEMENTATION_COMPLETE.md (features)"
echo ""
