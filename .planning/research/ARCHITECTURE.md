# Architecture Patterns: AI Workflow Orchestration

**Project:** Engunity AI Workflow Engine
**Researched:** 2026-02-10
**Confidence:** HIGH

## Recommended Architecture

The system follows a **Graph-based Orchestration** pattern, where LangGraph manages the state and logic flow, while Celery handles the asynchronous lifecycle and infrastructure integration.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Graph Factory** | Dynamically constructs `langgraph.StateGraph` from JSON workflow definitions stored in MongoDB. | MongoDB (Definitions), LangGraph (Compiler) |
| **Stateful Engine** | Executes the compiled graph, manages node transitions, and persists state via Redis checkpointers. | Redis (Checkpoints), AI Services (Tools) |
| **Task Orchestrator**| A dedicated Celery worker that wraps the LangGraph execution to provide background processing and retry logic. | Redis (Queue), FastAPI (Trigger) |
| **Tool Adapters** | Normalizes existing monolith services (Chat, RAG, Code) into PydanticAI tools for the engine to consume. | Existing Services, PydanticAI |

### Data Flow

1.  **Workflow Trigger:** User initiates a flow via FastAPI.
2.  **Job Queuing:** FastAPI submits a `run_workflow` task to Celery with the `workflow_id` and initial `inputs`.
3.  **Graph Construction:** The Celery worker fetches the JSON definition, uses the **Graph Factory** to build the LangGraph, and attaches a **Redis Checkpointer**.
4.  **Node Execution:** LangGraph traverses the nodes. For each node, it calls a **Tool Adapter** which invokes the underlying monolithic service (e.g., calling the `chat` service).
5.  **State Persistence:** After each node completion, LangGraph automatically persists the state (snapshot) to Redis.
6.  **Human-in-the-Loop (Optional):** If a node requires approval, the graph interrupts execution. The worker marks the job as `WAITING`. Once the user approves via Socket.io/API, the graph resumes from the exact checkpoint.

## Patterns to Follow

### Pattern 1: Dynamic StateGraph Factory
**What:** Decoupling the workflow definition (JSON) from the execution logic by using a factory that maps JSON step types to Python node functions.
**When:** Essential for user-defined workflows where the graph structure isn't known at compile time.
**Example:**
```python
def create_graph(definition: dict):
    builder = StateGraph(WorkflowState)
    for node in definition['nodes']:
        builder.add_node(node['id'], tool_registry[node['type']])
    for edge in definition['edges']:
        builder.add_edge(edge['source'], edge['target'])
    return builder.compile(checkpointer=redis_checkpointer)
```

### Pattern 2: The "Side-Loaded" Context
**What:** Storing large data artifacts (PDF text, image buffers) in an object store and passing only the reference (ID/URL) through the LangGraph `State`.
**When:** To prevent Redis memory bloat and keep state transitions fast.
**Instead:** Do not put 10MB of extracted text directly into the `State` dictionary.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Synchronous AI Chains
**What:** Running a multi-step LLM chain directly in the FastAPI request-response cycle.
**Why bad:** High latency (30s+) will cause gateway timeouts and block API workers.
**Instead:** Always hand off to Celery and use Socket.io for progress updates.

### Anti-Pattern 2: Deeply Nested JSON State
**What:** Storing every single intermediate LLM response in a single global `state` object.
**Why bad:** Makes versioning and state migration difficult; hard to debug.
**Instead:** Use specific keys for specific nodes and use a `logs` list for execution history.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Redis Memory** | Minimal impact. | Checkpointer state grows; needs eviction policies for old runs. | Dedicated Redis cluster for state persistence. |
| **Worker Capacity**| Standard Celery pool. | Dedicated "AI Queues" to prevent workflow steps from blocking simple tasks. | Autoscaling worker groups based on queue depth. |
| **Tool Latency** | Sequential calls OK. | Use `asyncio.gather` within LangGraph nodes for parallel sub-tasks. | Implement global rate-limiting and circuit breakers per provider. |

## Sources

- [LangGraph Conceptual Guide: Persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- [Celery Canvas: Complex Workflows](https://docs.celeryq.dev/en/stable/userguide/canvas.html)
- [PydanticAI: Tool Calling Patterns](https://ai.pydantic.dev/tools/)

---
*Architecture research for: Engunity AI Workflow Engine*
*Researched: 2026-02-10*
