#!/usr/bin/env python3
"""Simple test to verify chart generation works"""
import sys
print("Python version:", sys.version, file=sys.stderr)
print("Starting chart generation test...", file=sys.stderr)

try:
    import matplotlib
    print(f"✓ Matplotlib {matplotlib.__version__} imported", file=sys.stderr)
    matplotlib.use('Agg')
    print("✓ Set backend to Agg", file=sys.stderr)
    
    import matplotlib.pyplot as plt
    import numpy as np
    print("✓ Imported pyplot and numpy", file=sys.stderr)
    
    # Create simple test chart
    fig, ax = plt.subplots(figsize=(6, 4))
    x = np.array([1, 2, 3, 4, 5])
    y = np.array([2, 4, 6, 8, 10])
    ax.plot(x, y, 'o-', linewidth=2, markersize=8)
    ax.set_xlabel('X axis')
    ax.set_ylabel('Y axis')
    ax.set_title('Test Chart')
    ax.grid(True, alpha=0.3)
    
    print("✓ Chart created", file=sys.stderr)
    
    plt.savefig('test_chart.png', dpi=150, bbox_inches='tight')
    print("✓ Saved test_chart.png", file=sys.stderr)
    plt.close()
    
    print("\n✅ SUCCESS! test_chart.png created", file=sys.stderr)
    print("Chart generation is working correctly!", file=sys.stderr)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
