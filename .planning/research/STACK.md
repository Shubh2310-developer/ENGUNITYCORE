# Technology Stack: Linear AI Workflow Orchestration

**Project:** Engunity AI Workflow Engine
**Researched:** 2026-02-10
**Confidence:** HIGH

## Recommended Stack

For a consumer-focused SaaS platform like Engunity, the stack must balance the robustness of the existing FastAPI/Celery infrastructure with modern 2025 AI orchestration capabilities (state management, tool calling, and observability).

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **LangGraph** | ~0.2.x | Workflow Orchestration | The 2025 standard for AI graphs. Unlike simple chains, it supports state persistence, cycles (loops), and "Human-in-the-loop" approval steps essential for reliable AI workflows. |
| **PydanticAI** | ~0.1.x | Agentic Logic | From the Pydantic team; provides high-performance, model-agnostic, and type-safe tool calling. Better DX than raw LangChain for building specific agentic nodes. |
| **Celery** | 5.4.x | Task Runner | Already present in Engunity. Used as the entry point to trigger and manage long-running LangGraph executions in the background. |
| **FastAPI** | 0.115+ | API Layer | Already present. Provides the async endpoints for workflow triggers and state inspection. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Langfuse** | 2.x | AI Observability | Open-source alternative to LangSmith. Essential for tracing user workflow steps, cost tracking, and debugging failed nodes. |
| **React Flow** (XYFlow) | 12.x | Frontend Graph UI | The standard library for building the "node-based" builder in Next.js. Highly customizable for custom node types (Chat, RAG, Image). |
| **Redis** | 7.x | Persistence/Broker | Used for Celery messaging and as a "Checkpointer" for LangGraph to persist workflow state across restarts. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **LangGraph Studio** | Local Debugging | Visualizes the graph execution flow during development. |
| **Pydantic Logfire** | Observability | Deep integration with PydanticAI for structured logging and performance monitoring. |

## Installation

```bash
# Core Orchestration & AI Logic
pip install langgraph pydantic-ai-slim langfuse

# Celery & Infrastructure (Already present, ensure versions)
pip install celery[redis] motor pydantic>=2.9.2

# Frontend (Next.js)
npm install @xyflow/react
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| **LangGraph** | **Temporal** | Temporal is excellent for months-long durability but adds significant infrastructure complexity (Go/Postgres/Temporal Server) that Engunity's consumer use cases don't yet require. |
| **LangGraph** | **Celery Canvas** | While Celery `chain()` is built-in, it lacks AI-specific features like easy state checkpointing for "Human-in-the-loop" and deep integration with LLM tracing. |
| **PydanticAI** | **LangChain** | LangChain is comprehensive but often "over-abstracted." PydanticAI offers better type safety and a lighter-weight approach to agentic tool-calling. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Flowise / Langflow** | Hard to deeply integrate as a white-labeled feature within an existing React/Next.js dashboard. | **React Flow** (UI) + **LangGraph** (Backend). |
| **Airflow** | Designed for batch ETL/data engineering. Latency and scheduler overhead are too high for interactive consumer AI features. | **Celery** + **LangGraph**. |
| **Synchronous Loops** | Blocking the API worker for 30+ seconds while AI steps run will cause timeouts and UX failure. | **Celery tasks** running LangGraph asynchronously. |

## Stack Patterns by Variant

**For Dynamic User-Defined Flows:**
- Store the graph topology as a JSON schema in MongoDB.
- Use a `factory` pattern in the backend to dynamically build a `StateGraph` from the JSON at runtime.
- **Rationale:** Allows users to edit flows via the UI without changing backend code.

**For Long-Running/Human-Approved Steps:**
- Use **Redis Checkpointers** in LangGraph.
- **Rationale:** Allows the workflow to "pause" at a node, wait for user input (via a Socket.io event), and resume hours later without losing state.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `langgraph@0.2.x` | `pydantic>=2.9` | Essential for V2 model validation in state objects. |
| `pydantic-ai` | `fastapi@0.115` | Fully compatible with modern async FastAPI patterns. |

## Sources

- [LangGraph Official Docs](https://langchain-ai.github.io/langgraph/) (HIGH confidence)
- [PydanticAI Launch & Docs](https://ai.pydantic.dev/) (HIGH confidence)
- [XYFlow (React Flow) Documentation](https://reactflow.dev/) (HIGH confidence)
- [Engunity /backend/requirements.txt](https://github.com/agentrogue/Engunity) (Contextual verification)

---
*Stack research for: Engunity AI Workflow Engine*
*Researched: 2026-02-10*
