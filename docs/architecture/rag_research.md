# Advanced RAG Architecture: The "Omni-RAG" System

This document outlines the architectural specification for the next generation of Engunity's Retrieval-Augmented Generation (RAG) system. It synthesizes state-of-the-art research (GraphRAG, Self-RAG, CRAG, HyDE, FlashRank, Adaptive-RAG) into a unified, robust, and highly accurate knowledge engine.

## 1. Executive Summary

Moving beyond "Naive RAG" (simple vector similarity), this architecture implements an **Adaptive, Corrective, Graph-Enhanced** pipeline. It dynamically adjusts its strategy based on query complexity, self-corrects poor retrieval results, and understands both specific facts and global themes.

**Key Research Foundations:**
*   **GraphRAG**: For "global sensemaking" and thematic understanding.
*   **Adaptive-RAG**: For routing queries based on complexity.
*   **CRAG (Corrective RAG)**: For fallback to web search when internal retrieval fails.
*   **Self-RAG**: For self-reflection and hallucination checks.
*   **HyDE & FlashRank**: For optimizing retrieval recall and precision.

---

## 2. High-Level Architecture

The system follows a "Router-Retriever-Evaluator-Generator" flow:

```mermaid
graph TD
    UserQuery[User Query] --> Complexity{Complexity Classifier}

    %% Adaptive Routing (Adaptive-RAG)
    Complexity -- "Simple/Known" --> DirectGen[Direct LLM Generation]
    Complexity -- "Fact/Specific" --> VectorFlow[Vector Retrieval Flow]
    Complexity -- "Thematic/Global" --> GraphFlow[Graph Retrieval Flow]

    %% Vector Flow (HyDE + FlashRank)
    subgraph VectorFlow
        HyDE[HyDE: Generate Hypothetical Doc]
        DenseRet[Dense Retrieval (Contriever)]
        Rerank[FlashRank Reranker]
        HyDE --> DenseRet --> Rerank
    end

    %% Graph Flow (GraphRAG)
    subgraph GraphFlow
        EntityExt[Identify Entities]
        CommSearch[Community Summary Search]
        MapReduce[Map-Reduce Summarization]
        EntityExt --> CommSearch --> MapReduce
    end

    %% Corrective Layer (CRAG)
    Rerank --> Eval{Retrieval Evaluator}
    CommSearch --> Eval

    Eval -- "High Confidence" --> Context
    Eval -- "Ambiguous" --> KnowRefine[Knowledge Refinement] --> Context
    Eval -- "Low Confidence" --> WebSearch[Web Search API] --> Context

    %% Generation Layer (Self-RAG)
    Context --> Generator[Generator LLM]
    Generator --> Critique{Self-Reflection}
    Critique -- "Supported" --> FinalAnswer
    Critique -- "Not Supported" --> RePrompt[Refine/Regenerate]
```

---

## 3. Component Deep Dive

### 3.1. The "Brain": Query Classifier (Adaptive-RAG)
**Research Source:** *Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity* (2403.14403v2)

Instead of treating every query as a retrieval task, we employ a lightweight classifier (or a prompt-based router) to categorize the user's intent:
1.  **Level A (Direct)**: General knowledge or conversational (e.g., "Write a python function to sum a list"). -> **Skip Retrieval.**
2.  **Level B (Single-Hop)**: Specific factual queries (e.g., "What is the revenue of Company X?"). -> **Standard Vector RAG.**
3.  **Level C (Multi-Hop/Global)**: Complex reasoning or thematic summaries (e.g., "Compare the growth strategies of Company X and Y over the last 5 years"). -> **GraphRAG + Iterative Retrieval.**

**Implementation:**
*   **Input**: User Query.
*   **Model**: Small, fast LLM (e.g., Haiku, Llama-3-8B) or a finetuned BERT classifier.
*   **Output**: Routing Decision `{strategy: "direct" | "vector" | "graph"}`.

### 3.2. The "Seeker": Advanced Retrieval Layer

#### A. HyDE (Hypothetical Document Embeddings)
**Research Source:** *Precise Zero-Shot Dense Retrieval without Relevance Labels* (2212.10496v1)
*   **Problem**: Queries are short; documents are long. Semantic mismatch is common.
*   **Solution**: Before retrieval, ask the LLM to "write a hypothetical document that answers this question."
*   **Process**:
    1.  Generate `Hypothetical_Doc`.
    2.  Embed `Hypothetical_Doc` (not the query).
    3.  Search vector store using this embedding.
*   **Benefit**: Matches "answer-to-answer" semantics rather than "question-to-answer."

#### B. FlashRank Reranking
**Research Source:** *Enhancing Retrieval-Augmented Generation with Two-Stage Retrieval: FlashRank Reranking and Query Expansion* (2601.03258v1)
*   **Problem**: Dense retrieval (top-k) often fetches irrelevant or redundant chunks.
*   **Solution**: Retrieve a larger set (e.g., top-50) using the vector index, then use a specialized, lightweight reranker (FlashRank) to re-order them based on marginal utility.
*   **Benefit**: Improves precision significantly without the latency of heavy cross-encoders.

#### C. GraphRAG (Knowledge Graph Indexing)
**Research Source:** *From Local to Global: A GraphRAG Approach to Query-Focused Summarization* (2404.16130v2)
*   **Problem**: Vector search fails at "holistic" questions (e.g., "What are the main themes in this dataset?").
*   **Solution**:
    1.  **Indexing**: Extract Entities and Relationships using an LLM. Use Leiden algorithm to detect "Communities" (clusters of related topics).
    2.  **Summarization**: Pre-generate summaries for each community.
    3.  **Retrieval**: For global queries, retrieve *Community Summaries* instead of raw text chunks.
*   **Benefit**: Enables "Zoom-out" capabilities impossible with standard RAG.

### 3.3. The "Judge": Corrective Retrieval (CRAG)
**Research Source:** *Corrective Retrieval Augmented Generation* (2401.15884v3)

A lightweight "Retrieval Evaluator" checks the quality of the retrieved documents before generation.

*   **Action Logic**:
    *   **Correct (High Confidence)**: Documents are relevant. Proceed to generation. Strip non-essential info (Knowledge Refinement).
    *   **Incorrect (Low Confidence)**: Documents are irrelevant. **Discard them.** Trigger **Web Search** to find external information.
    *   **Ambiguous**: Combine internal documents with Web Search results to ensure coverage.

### 3.4. The "Critic": Self-Reflective Generation (Self-RAG)
**Research Source:** *Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection* (2310.11511v1)

The Generator LLM is not just a passive writer; it actively critiques its own output using special "Reflection Tokens" (or prompted self-evaluation steps).

*   **Critique Steps**:
    1.  **IsRel (Is Relevant?)**: Is the retrieved chunk actually relevant to the prompt?
    2.  **IsSup (Is Supported?)**: Is the generated sentence supported by the evidence? (Prevents hallucinations).
    3.  **IsUse (Is Useful?)**: Does the response actually answer the user's question?
*   **Implementation**: If `IsSup` is low, the model regenerates the sentence or cites a lack of information.

---

## 4. Technical Stack Implementation Plan

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Orchestrator** | LangGraph / LlamaIndex | Manage the cyclic workflow (Router -> Retriever -> Judge -> Generator). |
| **Vector DB** | FAISS / pgvector | Store dense embeddings of document chunks. |
| **Graph DB** | NetworkX (In-memory) or Neo4j | Store Entities, Relationships, and Community links. |
| **Embedding** | `all-MiniLM-L6-v2` or `OpenAI text-embedding-3` | High-performance dense vectors. |
| **LLM** | **Groq (Llama 3 70B)** | High-speed inference is critical for the "Evaluation/Critique" loops. |
| **Reranker** | `ms-marco-MiniLM-L-12-v2` / FlashRank | Lightweight reranking of top-50 results. |
| **Web Search** | Tavily / Serper | Fallback for CRAG when internal docs are insufficient. |

## 5. Migration Steps

1.  **Upgrade Ingestion**:
    *   Add **Entity Extraction** step to the ingestion pipeline to build the Knowledge Graph (Nodes/Edges).
    *   Run Community Detection (Leiden algorithm) on the graph.
    *   Generate Community Summaries using the LLM.

2.  **Upgrade Retrieval**:
    *   Implement **HyDE** transformation for the query.
    *   Implement **FlashRank** to re-order FAISS results.

3.  **Implement Control Flow**:
    *   Build the **Router** (Adaptive-RAG) to choose between Graph Search (Global) and Vector Search (Specific).
    *   Build the **Evaluator** (CRAG) to trigger Web Search if retrieval score < threshold.

4.  **Refine Generation**:
    *   Update system prompts to include **Self-Reflection** instructions ("Check if your previous sentence is supported...").

## 6. Expected Performance Gains

Based on the research papers:
*   **Accuracy**: +15-20% on complex reasoning tasks (Self-RAG/GraphRAG).
*   **Hallucination Rate**: Significant reduction due to the "IsSupported" critique step.
*   **Global Understanding**: Ability to answer "summary" questions which naive RAG fails at completely.
*   **Robustness**: CRAG ensures that poor internal retrieval doesn't lead to "I don't know" or made-up answers, but seamlessly falls back to the web.
