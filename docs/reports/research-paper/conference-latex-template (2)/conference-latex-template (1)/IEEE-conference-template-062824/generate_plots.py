import matplotlib.pyplot as plt
import numpy as np

# Set style for professional academic publication
# Using default but customizing for high contrast B&W
plt.style.use('default')
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.labelsize'] = 10
plt.rcParams['axes.titlesize'] = 11
plt.rcParams['xtick.labelsize'] = 9
plt.rcParams['ytick.labelsize'] = 9
plt.rcParams['legend.fontsize'] = 9

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# Plot 1: RAG Retrieval Accuracy
queries = ['Simple Fact', 'Multi-hop', 'Code Gen', 'Abstract Concept']
standard_rag = [85, 45, 60, 40]
omni_rag = [92, 88, 95, 82]

x = np.arange(len(queries))
width = 0.35

# Use hatching patterns for distinct B&W visibility
rects1 = ax1.bar(x - width/2, standard_rag, width, label='Standard RAG',
                 color='white', edgecolor='black', hatch='///')
rects2 = ax1.bar(x + width/2, omni_rag, width, label='Engunity OmniRAG',
                 color='lightgray', edgecolor='black', hatch='...')

ax1.set_ylabel('Retrieval Accuracy (%)')
ax1.set_title('Retrieval Accuracy by Query Type')
ax1.set_xticks(x)
ax1.set_xticklabels(queries, rotation=15)
ax1.set_ylim(0, 110)
ax1.legend()
ax1.grid(True, axis='y', linestyle='--', alpha=0.5)

# Add value labels
def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax1.annotate('{}'.format(height),
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=8)

autolabel(rects1)
autolabel(rects2)

# Plot 2: System Latency vs Concurrency
concurrency = [1, 10, 50, 100, 500]
latency_fastapi = [120, 135, 180, 250, 480] # ms
latency_monolith = [150, 400, 1200, 3500, 8000] # ms

# Distinct markers and line styles
ax2.plot(concurrency, latency_monolith, marker='o', linestyle='--', color='black',
         label='Legacy Monolith', markersize=6, fillstyle='none')
ax2.plot(concurrency, latency_fastapi, marker='s', linestyle='-', color='black',
         label='Engunity Microservices', markersize=6, linewidth=2)

ax2.set_xlabel('Concurrent Users (Log Scale)')
ax2.set_ylabel('Average Latency (ms)')
ax2.set_title('System Latency under Load')
ax2.set_xscale('log')
ax2.set_xticks(concurrency)
ax2.set_xticklabels(concurrency)
ax2.legend()
ax2.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
plt.savefig('/home/agentrogue/Engunity/conference-latex-template (2)/conference-latex-template (1)/IEEE-conference-template-062824/evaluation_results.png', dpi=300, bbox_inches='tight')
print("High-contrast graph generated successfully.")
