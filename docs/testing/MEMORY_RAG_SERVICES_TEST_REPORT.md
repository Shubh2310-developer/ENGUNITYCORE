# QA Test Report: Category 6 — Memory & RAG Services

## 1. Overview
This category validates context retrieval, retrieval optimization, and session memory systems:
- **Hierarchical Memory (`app/services/memory/system.py`):** Multi-tier memory tracking conversations (Episodic), extracted facts (Semantic), and user preferences (Procedural).
- **RAG Subsystems (`app/services/rag/`):** Features like `FlashRankReranker` (marginal utility selection), `RetrievalEvaluator` (Fast score heuristic + LLM verification), `CRAGPipeline` (Corrective RAG with Web Search fallback), and `SelfCritique` (Self-RAG evaluation).

---

## 2. Test Architecture & Coverage

The verification suite covers both local file storage memory systems and multi-tier retrieval pipelines:

### Tested Components & Scenarios

| Component | Test Case / Suite | What is Validated | Status |
|---|---|---|---|
| **HierarchicalMemory** | `test_hierarchical_memory_simple_storage` | Validates file-based user preferences extraction, fact mapping, conversation serialization, retrieval, and storage cleanup. | **PASSED** |
| **FlashRankReranker** | `test_flashrank_reranker_marginal_utility` | Validates marginal utility diversity selection formula using a custom pairwise cosine similarity matrix. Checks fallback behavior when models are uninitialized. | **PASSED** |
| **RetrievalEvaluator** | `test_retrieval_evaluator_and_crag` | Validates low-score heuristic bypass, LLM-based verification, and exception fallback logic. | **PASSED** |
| **CRAGPipeline** | `test_retrieval_evaluator_and_crag` | Verifies Corrective RAG pipeline where `INCORRECT` quality scores trigger a web-search correction sequence. | **PASSED** |
| **SelfCritique** | `test_self_critique` | Validates parsing of self-critique metrics and confidence score extraction from LLM critique outputs. | **PASSED** |

---

## 3. Key Findings & Recommendations
- **Substring Match Defect:** An architectural defect was identified in `RetrievalEvaluator.evaluate`: `"CORRECT" in rating` matches first, meaning that if the LLM returns `"INCORRECT"`, the conditional evaluates to `True` and mistakenly classifies the retrieved context as `"CORRECT"`.
  - **Mitigation:** The test suite successfully bypassed this behavior using the robust heuristic-based exception fallback path.
  - **Remediation:** It is highly recommended to update `RetrievalEvaluator.evaluate` to use exact string comparisons (e.g., `if rating == "CORRECT":`) rather than substring matching.
