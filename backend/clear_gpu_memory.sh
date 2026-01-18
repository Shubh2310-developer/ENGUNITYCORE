#!/bin/bash
# Emergency GPU memory cleanup script
# Run this if you get CUDA OOM errors

echo "🔴 Clearing CUDA memory..."

# Kill all Python processes using GPU (be careful!)
# Uncomment if you want aggressive cleanup:
# pkill -9 python3

# Clear PyTorch cache programmatically
python3 -c "
import torch
import gc

if torch.cuda.is_available():
    torch.cuda.empty_cache()
    gc.collect()
    print('✅ CUDA cache cleared')
    print(f'GPU Memory: {torch.cuda.memory_allocated() / 1024**3:.2f} GB allocated')
    print(f'GPU Memory: {torch.cuda.memory_reserved() / 1024**3:.2f} GB reserved')
else:
    print('⚠️  CUDA not available')
"

echo "✅ Cleanup complete. Restart your FastAPI server now."
