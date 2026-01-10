#!/bin/bash

# ==========================================
# Git Security Check Script
# Scans for sensitive files that shouldn't be committed
# ==========================================

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔒 Git Security Check - Engunity AI"
echo "=========================================="
echo ""

ISSUES_FOUND=0

# Check for .env files
echo "🔍 Checking for .env files..."
ENV_FILES=$(find . -type f \( -name ".env" -o -name ".env.local" -o -name ".env.production" \) 2>/dev/null | grep -v node_modules | grep -v .git)
if [ -n "$ENV_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found .env files (should be gitignored):${NC}"
    echo "$ENV_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
else
    echo -e "${GREEN}✅ No .env files found in working directory${NC}"
fi
echo ""

# Check for API keys in code
echo "🔍 Checking for hardcoded API keys..."
API_KEY_PATTERNS=$(grep -r -i -E "(api[_-]?key|apikey|api[_-]?secret|groq[_-]?api|supabase[_-]?key)" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep -v "api_key" | grep -v "GROQ_API_KEY" | grep -v "# API" | grep -v "settings.GROQ_API_KEY" | head -10)
if [ -n "$API_KEY_PATTERNS" ]; then
    echo -e "${YELLOW}⚠️  Potential API key references found:${NC}"
    echo "$API_KEY_PATTERNS"
    echo ""
    echo -e "${YELLOW}⚠️  Review these files to ensure no hardcoded secrets${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
else
    echo -e "${GREEN}✅ No suspicious API key patterns found${NC}"
fi
echo ""

# Check for __pycache__
echo "🔍 Checking for Python cache directories..."
PYCACHE=$(find . -type d -name "__pycache__" 2>/dev/null | head -5)
if [ -n "$PYCACHE" ]; then
    echo -e "${YELLOW}⚠️  Found __pycache__ directories (should be gitignored):${NC}"
    echo "$PYCACHE"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
else
    echo -e "${GREEN}✅ No __pycache__ directories found${NC}"
fi
echo ""

# Check for node_modules
echo "🔍 Checking for node_modules..."
NODE_MODULES=$(find . -type d -name "node_modules" -maxdepth 3 2>/dev/null)
if [ -n "$NODE_MODULES" ]; then
    echo -e "${GREEN}✅ node_modules found (should be gitignored):${NC}"
    echo "$NODE_MODULES"
else
    echo -e "${GREEN}✅ No node_modules directories found${NC}"
fi
echo ""

# Check for .next build directory
echo "🔍 Checking for Next.js build artifacts..."
NEXT_BUILD=$(find . -type d -name ".next" 2>/dev/null)
if [ -n "$NEXT_BUILD" ]; then
    echo -e "${YELLOW}⚠️  Found .next build directories (should be gitignored):${NC}"
    echo "$NEXT_BUILD"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
else
    echo -e "${GREEN}✅ No .next directories found${NC}"
fi
echo ""

# Check for database files
echo "🔍 Checking for database files..."
DB_FILES=$(find . -type f \( -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" \) 2>/dev/null | grep -v node_modules)
if [ -n "$DB_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found database files (should be gitignored):${NC}"
    echo "$DB_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
else
    echo -e "${GREEN}✅ No database files found${NC}"
fi
echo ""

# Check for large files
echo "🔍 Checking for large files (>10MB)..."
LARGE_FILES=$(find . -type f -size +10M 2>/dev/null | grep -v node_modules | grep -v .git | head -5)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found large files (consider using Git LFS):${NC}"
    echo "$LARGE_FILES"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
else
    echo -e "${GREEN}✅ No large files found${NC}"
fi
echo ""

# Check if .gitignore exists
echo "🔍 Checking for .gitignore..."
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✅ .gitignore exists${NC}"
    LINE_COUNT=$(wc -l < .gitignore)
    echo "   Lines: $LINE_COUNT"
else
    echo -e "${RED}❌ .gitignore not found!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND+1))
fi
echo ""

# Summary
echo "=========================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Repository is secure.${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ISSUES_FOUND potential issues.${NC}"
    echo ""
    echo "📝 Recommended actions:"
    echo "   1. Ensure .gitignore covers all sensitive files"
    echo "   2. Remove accidentally committed secrets"
    echo "   3. Run: git rm --cached <file> to untrack files"
    echo "   4. Rotate any exposed API keys immediately"
fi
echo "=========================================="
