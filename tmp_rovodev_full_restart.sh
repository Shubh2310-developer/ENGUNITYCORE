#!/bin/bash

echo "🔄 Full restart of development servers..."
echo ""

# Kill all related processes
echo "🛑 Stopping all dev processes..."
pkill -f "concurrently" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
sleep 2

echo "✅ All processes stopped"
echo ""

# Clean Next.js cache
echo "🧹 Cleaning Next.js build cache..."
rm -rf frontend/.next
echo "✅ Cache cleaned"
echo ""

echo "📋 Current environment:"
if [ -f "frontend/.env.local" ]; then
  cat frontend/.env.local | sed 's/^/   /'
else
  echo "   ❌ .env.local not found!"
fi
echo ""

echo "🚀 Ready to restart!"
echo ""
echo "Run: npm run dev"
echo ""
