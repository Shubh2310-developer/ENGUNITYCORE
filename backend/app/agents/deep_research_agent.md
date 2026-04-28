# DeepResearchAgent Documentation

**File Path:** `/home/agentrogue/projects/ENGUNITYCORE/backend/app/agents/deep_research_agent.py`

## Overview

The `DeepResearchAgent` is an advanced, multi-step iterative research pipeline built on Python's `asyncio`. It is designed to autonomously investigate complex queries by fanning out searches across multiple data backends, repeatedly refining its understanding based on discovered gaps, and ultimately producing a well-structured, comprehensive synthesis report.

Both batch processing (`research()`) and real-time streaming (`stream_research()`) modes are supported.

## Architecture & Pipeline Steps

The research process runs through five core phases:

### 1. Decompose
- **Goal:** Break down a broad, complex user query into a configurable number of focused, typed sub-questions using an LLM.
- **Sub-question Types:** Factual, Analytical, Comparative, Exploratory.
- **Fail-safe:** If the LLM extraction fails, it gracefully falls back to using the original query.

### 2. Search
- **Goal:** Concurrently retrieve data across three distinct backends.
- **Execution:** Uses `asyncio.gather` for rapid, parallel IO.
- **Backends:**
  - **Internal Vector RAG (`OmniRAGPipeline`):** Queries internal knowledge bases.
  - **Web Search (`WebSearchFallback`):** Connects to live internet data.
  - **Knowledge Graph (`KnowledgeGraph`):** Performs semantic community traversal.

### 3. Evaluate
- **Goal:** Assess the relevance and quality of every single retrieved snippet.
- **Relevance Scoring:** Computes a hybrid score using fast keyword matching, falling back to a dedicated 0.0–1.0 LLM scoring prompt for granular assessment.
- **Quality Assessment:** Applies heuristic checks for structure (e.g., bullet points, sections, data markers, code blocks) to bump the score.
- **Filtering:** Deduplicates sources and discards any snippet scoring below a `0.4` relevance threshold.

### 4. Refine
- **Goal:** Analyze the accepted evidence against the original query to identify missing information.
- **Execution:** Prompts an LLM to state remaining "coverage gaps" as a list.
- **Iteration:** If gaps exist (and the configured maximum iterations or minimum source count haven't been reached), it spawns new exploratory "refinement queries" and loops back to Step 2 (Search) for another pass.

### 5. Synthesize
- **Goal:** Draft a final, authoritative research report.
- **Execution:** Uses a robust prompt injecting all accepted snippets to write a categorized response (Executive Summary, Key Findings, Analysis, Caveats, Follow-ups, Related Topics) based on the requested output format (Detailed, Summary, Bullet Points).
- **Post-processing:** Re-prompts the LLM briefly to cleanly extract structured JSON arrays for related topics, follow-ups, and key insights.

## Depth Configurations

The agent dynamically adjusts its scope based on the chosen `ResearchDepth` parameter:

| Priority Class | Max Sub-Queries | Max Loops (Iterations) | Min Target Sources | Typical Use Case |
|---|---|---|---|---|
| **QUICK** | 2 | 1 | 2 | Fast, direct answers. |
| **STANDARD** | 5 | 3 | 4 | Standard investigative tasks. |
| **DEEP** | 8 | 5 | 7 | Comprehensive subject reviews. |
| **EXHAUSTIVE** | 12 | 8 | 10 | Complete mapping of complex top-level domains. |

## Core Methods Interface

### `async def research(request, user_id, session_id=None)`
- **Parameters:** `ResearchRequest` containing the query, requested depth, output formatting constraints, and toggle flags for web/graph search.
- **Returns:** A fully hydrated `ResearchReport` containing the synthesized text, accepted sources, confidence scores, and iteration metrics.
- **Usage:** Standard REST request/response flow.

### `async def stream_research(request, user_id, session_id=None)`
- **Returns:** An `AsyncGenerator[ResearchStreamEvent, None]`.
- **Usage:** Designed for Server-Sent Events (SSE) or WebSocket streaming. Clients can render dynamic progress bars (via the `progress_percent` field) and display live snippets as the agent discovers them.

## Key Design Patterns

- **Parallelism Over Sub-queries:** Instead of serializing searches, the agent dispatches `N` sub-queries * `3` backends `asyncio` tasks concurrently per iteration.
- **Defensive LLM Parsing:** Most LLM calls explicitly parse and sanitize raw strings (e.g., stripping Markdown code fence backticks ` ```json `) to prevent formatting crashes.
- **Stateless Operation:** The agent itself maintains zero state between requests. All state (history, sources) is contained within the lifecycle of the local `research()` or `stream_research()` invocation.
