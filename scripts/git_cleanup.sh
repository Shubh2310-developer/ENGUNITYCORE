#!/bin/bash

# ==========================================
# Git Cleanup Script - Remove Sensitive Files
# Run this BEFORE your first commit
# ==========================================

echo "=========================================="
echo "🧹 Git Cleanup - Removing Sensitive Files"
echo "=========================================="
echo ""

# Remove Python cache
echo "🗑️  Removing Python __pycache__ directories..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
echo "✅ Python cache cleaned"
echo ""

# Remove .next build
echo "🗑️  Removing Next.js build artifacts..."
rm -rf frontend/.next
rm -rf frontend/out
echo "✅ Next.js build artifacts cleaned"
echo ""

# Remove node_modules (optional - run npm install to restore)
echo "⚠️  Skipping node_modules removal (run manually if needed)"
echo "   To remove: rm -rf frontend/node_modules node_modules"
echo ""

# Remove .env files from git tracking
echo "🔐 Checking if .env files are tracked by git..."
if git ls-files .env >/dev/null 2>&1; then
    echo "⚠️  .env is tracked by git. Removing from tracking..."
    git rm --cached .env
    echo "✅ .env removed from git (file kept locally)"
fi

if git ls-files frontend/.env.local >/dev/null 2>&1; then
    echo "⚠️  frontend/.env.local is tracked by git. Removing from tracking..."
    git rm --cached frontend/.env.local
    echo "✅ frontend/.env.local removed from git (file kept locally)"
fi
echo ""

# Remove any accidentally tracked backup files
echo "🗑️  Removing backup files..."
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" \) -delete 2>/dev/null
echo "✅ Backup files cleaned"
echo ""

# Remove OS-specific files
echo "🗑️  Removing OS-specific files..."
find . -type f -name ".DS_Store" -delete 2>/dev/null
find . -type f -name "Thumbs.db" -delete 2>/dev/null
echo "✅ OS files cleaned"
echo ""

# Remove TypeScript build info
echo "🗑️  Removing TypeScript build info..."
find . -type f -name "*.tsbuildinfo" -delete 2>/dev/null
echo "✅ TypeScript build info cleaned"
echo ""

echo "=========================================="
echo "✅ Cleanup complete!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "   1. Verify .gitignore is in place"
echo "   2. Run: ./scripts/git_security_check.sh"
echo "   3. Run: git add ."
echo "   4. Run: git commit -m 'Initial commit'"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - .env files are now gitignored"
echo "   - They remain on your local machine"
echo "   - Never commit API keys or secrets"
echo "   - Share .env.example instead"
echo ""
