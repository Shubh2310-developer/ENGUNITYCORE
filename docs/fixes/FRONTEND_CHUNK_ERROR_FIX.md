# Frontend ChunkLoadError Fix

## Problem
```
ChunkLoadError: Loading chunk app/(dashboard)/layout failed.
(error: http://localhost:3000/_next/static/chunks/app/(dashboard)/layout.js)
```

## Root Cause
This error typically occurs when:
1. **Stale build artifacts** - Old `.next` directory contains outdated chunks
2. **Multiple dev servers** - Multiple Next.js instances running simultaneously
3. **Hot reload issues** - Fast Refresh couldn't update properly
4. **Cache corruption** - Node modules cache got corrupted

## Solution Applied

### Step 1: Kill All Running Dev Servers
```bash
pkill -f "next dev"
```
This stops all Next.js development servers that might be conflicting.

### Step 2: Clean Build Artifacts
```bash
cd frontend
rm -rf .next node_modules/.cache
```
This removes:
- `.next/` - All compiled Next.js build artifacts
- `node_modules/.cache/` - Babel/Webpack cache

### Step 3: Restart Dev Server
```bash
cd frontend
npm run dev
```
This rebuilds all chunks from scratch.

## Verification
```bash
# Check if server is running
curl http://localhost:3000

# Should see: <!DOCTYPE html>...
```

## Status: ✅ FIXED

The frontend is now running correctly at http://localhost:3000

### What Was Fixed:
- ✅ Stopped multiple conflicting dev servers
- ✅ Cleaned stale build artifacts
- ✅ Rebuilt application from scratch
- ✅ Server running successfully on port 3000

## Prevention Tips

### 1. Always Stop Previous Dev Server
```bash
# Before starting dev server
pkill -f "next dev"
cd frontend
npm run dev
```

### 2. Clean Build When Encountering Errors
```bash
cd frontend
rm -rf .next
npm run dev
```

### 3. Full Clean (If Issues Persist)
```bash
cd frontend
rm -rf .next node_modules/.cache
npm install  # Only if dependencies changed
npm run dev
```

### 4. Use npm Scripts for Safety
Add to `frontend/package.json`:
```json
{
  "scripts": {
    "dev:clean": "rm -rf .next node_modules/.cache && next dev",
    "dev:safe": "pkill -f 'next dev' || true && npm run dev"
  }
}
```

## Common Scenarios

### Scenario 1: After Git Pull
```bash
cd frontend
rm -rf .next
npm run dev
```

### Scenario 2: After Changing Next.js Config
```bash
cd frontend
rm -rf .next
npm run dev
```

### Scenario 3: After Installing New Packages
```bash
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run dev
```

### Scenario 4: Multiple Terminal Windows
Make sure only ONE terminal is running `npm run dev`:
```bash
# Check running instances
ps aux | grep "next dev"

# Kill all
pkill -f "next dev"

# Start fresh
npm run dev
```

## Troubleshooting

### Issue: Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue: Module Not Found Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: TypeScript Errors After Cleaning
```bash
cd frontend
npm run build  # Check for actual errors
# Fix any TypeScript errors shown
npm run dev
```

### Issue: Still Getting Chunk Errors
```bash
# Nuclear option - full reinstall
cd frontend
rm -rf .next node_modules package-lock.json node_modules/.cache
npm install
npm run dev
```

## Related Files

- `frontend/.next/` - Build output (auto-generated, can be deleted)
- `frontend/node_modules/.cache/` - Webpack/Babel cache
- `frontend/next.config.mjs` - Next.js configuration
- `frontend/package.json` - Dependencies and scripts

## Next.js Build System

### Development Mode (`npm run dev`)
- Compiles pages on-demand
- Enables Fast Refresh
- Creates chunks in `.next/`
- Uses incremental compilation

### Production Mode (`npm run build`)
- Compiles all pages
- Optimizes bundles
- Generates static chunks
- Minifies code

## Quick Reference

```bash
# Problem: ChunkLoadError
# Solution:
cd frontend
pkill -f "next dev"
rm -rf .next node_modules/.cache
npm run dev

# That's it! ✅
```

---

**Fixed:** 2026-01-23  
**Status:** ✅ Resolved  
**Time to Fix:** ~30 seconds
