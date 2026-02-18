# Test Plan: Chat Optimization Modes

## 1. Overview
This test plan defines the validation strategy for the Chat feature's optimization modes, covering various Research Depths (Speed Types) and RAG Methods (Retrieval Strategies).

## 2. Test Matrix: Speed vs. RAG Method

| RAG Method \ Speed Type | Quick (⚡) | Standard (📖) | Deep (🔬) | Exhaustive (🧠) |
| :--- | :--- | :--- | :--- | :--- |
| **Adaptive** | Latency: < 2s. Basic summary. | Latency: < 5s. Balanced depth. | Latency: < 15s. Detailed analysis. | Latency: < 30s. Full research report. |
| **Vector RAG** | Single source fetch. Direct answer. | 3-5 sources. Semantic matching. | 10+ sources. Multi-vector search. | Max sources. Comprehensive summary. |
| **Graph RAG** | Entity-only lookup. | Community summary lookup. | Multi-hop reasoning (2+ hops). | Global graph analysis. Relationship mapping. |
| **Recursive (Long Context)** | Single step reasoning. | 2-3 refinement steps. | 5+ recursive steps with critique. | Maximum context window utilization. |

## 3. RAG Method Success Criteria

### 3.1 Adaptive Strategy
- **Requirement**: System must analyze query complexity before execution.
- **Success Criteria**:
  - Metadata in response must include `complexity` (e.g., "simple", "complex").
  - Metadata `strategy` should reflect the dynamically chosen method.

### 3.2 Vector RAG
- **Requirement**: High-speed semantic retrieval from dense vector store.
- **Success Criteria**:
  - Metadata must contain `retrieved_docs` list.
  - `confidence` score must be between 0.0 and 1.0.
  - Snippets in `sources` must show relevant text matches to keywords in query.

### 3.3 Graph RAG
- **Requirement**: Utilize the Knowledge Graph for entity relationships.
- **Success Criteria**:
  - Metadata must indicate `used_graph_search: true` (if available in backend) or show `multi_queries`.
  - Response content should mention relationships between distinct entities.
  - Metadata `strategy` must be `graph_rag`.

### 3.4 Recursive Language Context (Recursive Intensive)
- **Requirement**: Multi-step reasoning and long-form context processing.
- **Success Criteria**:
  - Metadata must contain a `steps` array.
  - Each step must have a `thought` and an `output` (REPL or thought process).
  - Response must show signs of self-critique (metadata `critique` field populated).
  - `context_compressed` flag should be true if the context window limit was approached.

## 4. Speed Type (Research Depth) Success Criteria

### 4.1 Quick (⚡)
- **Success Criteria**:
  - `duration_seconds` < 5s.
  - `progress_percent` reaches 100% rapidly.
  - Minimum 1-2 high-relevance sources.

### 4.2 Standard (📖)
- **Success Criteria**:
  - `duration_seconds` 5s - 15s.
  - Balanced source list (3-7 sources).
  - Includes a "Key Insights" section in the report.

### 4.3 Deep (🔬)
- **Success Criteria**:
  - `duration_seconds` 15s - 60s.
  - `multi_queries` expansion (at least 3 sub-queries).
  - High `coverage_score` (> 0.8).
  - Includes "Related Topics" for follow-up.

### 4.4 Exhaustive (🧠)
- **Success Criteria**:
  - `duration_seconds` > 60s.
  - Maximum iteration count reached.
  - `full_report` exceeds 1000 words.
  - Multiple sources from different types (Web, Graph, Local).

## 5. Performance Thresholds

| Metric | Threshold (Quick) | Threshold (Exhaustive) |
| :--- | :--- | :--- |
| First Token Latency | < 500ms | < 2000ms |
| Total Completion | < 5s | < 180s |
| Source Count | 1-2 | 10+ |
| Accuracy (RAG) | > 70% | > 95% |

## 6. Edge Cases to Test
- **Empty Knowledge Graph**: How does Graph RAG fallback when no entities are indexed?
- **Ambiguous Queries**: Does Adaptive mode correctly identify "complex" for vague prompts?
- **Maximum Context**: Sending extremely long documents to Recursive Intensive mode.
- **Network Interruptions**: Streaming behavior when the connection drops mid-research.
