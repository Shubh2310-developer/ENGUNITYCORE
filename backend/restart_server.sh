#!/bin/bash
# Restart backend with GPU cleanup

echo "🔴 Step 1: Killing existing backend server..."
# Find and kill uvicorn/python processes running the backend
pkill -f "uvicorn app.main:app" || echo "No existing server found"
sleep 2

echo "🔴 Step 2: Clearing GPU memory..."
python3 -c "
import torch
import gc
if torch.cuda.is_available():
    torch.cuda.empty_cache()
    gc.collect()
    print('✅ CUDA cache cleared')
else:
    print('⚠️  CUDA not available')
" 2>/dev/null || echo "GPU cleanup attempted"

echo ""
echo "✅ Ready to restart!"
echo ""
echo "Now run: uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
