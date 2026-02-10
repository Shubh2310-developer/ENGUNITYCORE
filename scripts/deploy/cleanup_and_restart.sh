#!/bin/bash
# Complete cleanup: Kill all processes using GPU and clear memory
# Use this before restarting npm run dev

echo "🔴 Checking GPU processes..."
nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader 2>/dev/null || echo "No active GPU processes found via nvidia-smi"

echo ""
echo "🔴 Killing Python processes..."
pkill -9 -f "uvicorn" 2>/dev/null || true
sleep 2

echo ""
echo "🔴 Final GPU check..."
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits

echo ""
echo "✅ GPU cleanup complete!"
echo ""
echo "Now run: npm run dev"
