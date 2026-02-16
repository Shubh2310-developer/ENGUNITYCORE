# Research: Recursive Language Models (RLM) Implementation for Engunity Chat

## 1. Executive Summary

This research explores the integration of **Recursive Language Models (RLMs)** into the Engunity AI platform, based on the findings from the paper *"Recursive Language Models"* (Zhang et al., 2026).

RLMs represent a paradigm shift from standard RAG (Retrieval-Augmented Generation). Instead of passive retrieval where a system fetches documents and feeds them to an LLM, an RLM **treats the user prompt and context as variables in an external programming environment (REPL)**. The LLM writes code to programmatically inspect, decompose, and recursively "call itself" on chunks of data.

**Key Value Proposition:**
- **Unbounded Context:** Can process inputs orders of magnitude larger than the model's context window (e.g., entire codebases, books) by streaming them through a REPL.
- **Higher Accuracy:** Outperforms standard RAG on information-dense tasks (where answers depend on many scattered details) by 10-59%.
- **Agentic Reasoning:** Shifts from "guessing" what to retrieve to "programmatically solving" the retrieval task.

---

## 2. Theoretical Foundation (The Paper)

The core mechanism of an RLM involves three components:
1.  **The Environment ($\mathcal{E}$):** A persistent Python REPL (Read-Eval-Print Loop) where the prompt $P$ is stored as a string variable `context`.
2.  **The Recursive Interface:** A function `llm_query(prompt)` exposed to the REPL that allows the executing code to query the LLM (or a smaller sub-model).
3.  **The Agent Loop:**
    - The Root LM receives the problem description and metadata about the `context` variable (e.g., length, type).
    - It generates Python code to inspect the context (e.g., `chunk = context[:1000]`).
    - It executes the code, observes the output, and iterates.
    - It can write loops to process data in chunks and aggregate results.

### Comparison: RAG vs. RLM
| Feature | Standard RAG (Current Engunity) | Recursive Language Model (Proposed) |
| :--- | :--- | :--- |
| **Control** | Heuristic (BM25/Vector Search) | Programmatic (LLM writes code) |
| **Context Access** | Probabilistic (Top-K chunks) | Deterministic (Can loop over *all* data) |
| **Decomposition** | Fixed (Query rewriting) | Dynamic (LLM decides how to split task) |
| **Capabilities** | Search, Summarize | Count, Sort, Filter, Aggregation, Logic |

---

## 3. Integration Architecture

To implement RLMs in Engunity, we need to introduce a **Code Execution Sandbox** and a new **Recursive Strategy** in the `OmniRAGPipeline`.

### 3.1 Backend Architecture (`backend/app/services/rag/`)

We will create a new agent component `RecursiveReasoningAgent` that sits alongside the existing `GraphRAG` and `VectorRAG` flows.

#### New Component: `RecursiveReasoningAgent`
*   **Role:** Manages the REPL loop.
*   **Tools:**
    *   `execute_python(code)`: Runs code in a secure sandbox (e.g., Docker container or `e2b`).
    *   `llm_query(prompt)`: A recursive call back to the `OmniRAGPipeline` (usually with a cheaper model or "SIMPLE" strategy).
*   **State:** Maintains the `context` variable (which might be too large to fit in RAM, so it could be a memory-mapped file or a pointer to the Vector Store).

#### Updated Pipeline Flow (`OmniRAGPipeline.process_query`)
Currently, `process_query` selects between `SIMPLE`, `SINGLE_HOP`, and `MULTI_HOP`. We will add:
- **`RECURSIVE_INTENSIVE`**: Triggered for queries requiring full-text analysis, counting, or complex aggregation over large docs.

### 3.2 Frontend Architecture (`frontend/src/app/(dashboard)/chat/page.tsx`)

The frontend needs to visualize the "Thinking Process" of the RLM, which is richer than standard RAG.

#### UI Updates:
1.  **Recursive Thought Stream:**
    *   Instead of just "AI is thinking...", we stream the **Code Blocks** being executed.
    *   Show "Input" (Code) and "Output" (Result) pairs in a collapsible "Thinking" accordion.
2.  **Sub-Call Visualization:**
    *   When the RLM calls `llm_query`, show a nested indicator: *"Querying sub-agent on chunk 1/10..."*
3.  **Artifact Handling:**
    *   RLMs often produce intermediate variables. We can visualize these as "Memory Artifacts" in the sidebar.

---

## 4. Implementation Plan

### Phase 1: The Secure REPL Sandbox (Backend)
**File:** `backend/app/services/code_executor/sandbox.py`
We need a secure way to execute generated Python code.
```python
class SecureSandbox:
    def __init__(self, context_data: str):
        self.context = context_data
        self.locals = {"context": context_data, "results": []}

    def register_tool(self, name, func):
        self.locals[name] = func

    def execute(self, code: str):
        # SECURITY CRITICAL: Must run in isolated container in production
        # For prototype: restricted globals + timeout
        pass
```

### Phase 2: The Recursive Agent (Backend)
**File:** `backend/app/services/rag/recursive_agent.py`
```python
class RecursiveAgent:
    def __init__(self, llm_client):
        self.llm = llm_client
        self.max_steps = 10

    async def solve(self, query: str, context: str):
        # 1. Initialize Sandbox
        sandbox = SecureSandbox(context)

        # 2. Register llm_query tool (The Recursion)
        def llm_query_tool(sub_prompt):
            # Synchronous wrapper around async LLM call
            return self.llm.complete(sub_prompt)

        sandbox.register_tool("llm_query", llm_query_tool)

        # 3. The REPL Loop
        messages = [
            {"role": "system", "content": RLM_SYSTEM_PROMPT},
            {"role": "user", "content": f"Query: {query}\nContext Length: {len(context)}"}
        ]

        for _ in range(self.max_steps):
            # Generate Code
            response = await self.llm.complete(messages)

            # Check for FINAL Answer
            if "FINAL(" in response:
                return extract_final(response)

            # Execute Code
            code_block = extract_code(response)
            output = sandbox.execute(code_block)

            # Feed back output
            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content": f"REPL Output:\n{output}"})
```

### Phase 3: System Prompts
**File:** `backend/app/services/rag/prompts/recursive.py`
We need the prompt from Appendix C of the paper.
```text
You are an RLM. You have access to a 'context' variable.
DO NOT try to read it all at once.
Write Python code to inspect chunks:
chunk = context[:1000]
print(chunk)

Use 'llm_query(prompt)' to delegate reasoning tasks.
```

### Phase 4: Frontend Visualization
**File:** `frontend/src/app/(dashboard)/chat/page.tsx`
Update the `Message` interface and rendering logic to support a new event type `code_execution`.

```typescript
// New Event Type
interface CodeExecutionEvent {
  type: 'code_execution';
  code: string;
  output: string;
  sub_queries?: number;
}
```

Add a `RecursiveThinking` component:
```tsx
const RecursiveThinking = ({ steps }) => (
  <div className="border-l-2 border-purple-500 pl-4 my-2">
    {steps.map(step => (
      <div className="text-xs font-mono">
        <div className="bg-slate-100 p-2 rounded">{step.code}</div>
        <div className="text-slate-500">↳ {step.output}</div>
      </div>
    ))}
  </div>
);
```

---

## 5. Security & Risks

1.  **Code Injection:** The RLM executes code generated by an LLM. This is inherently risky.
    *   *Mitigation:* Use `gVisor` or `Firecracker` microVMs for the sandbox. Never run `exec()` on the host machine.
    *   *Mitigation:* Disable network access (except for controlled API calls) and filesystem access in the sandbox.
2.  **Infinite Loops:** The model might write `while True:`.
    *   *Mitigation:* Strict timeouts (e.g., 5s) on code execution. Max iteration limit (e.g., 10 steps) on the Agent Loop.
3.  **Cost:** RLMs can make many LLM calls.
    *   *Mitigation:* Use a "Budget Manager". If the agent exceeds $X cost or N tokens, force a summary and exit.

## 6. Conclusion

Implementing RLMs will upgrade Engunity from a "Search Engine" to a "Research Assistant" capable of reading entire documents and answering complex questions like "Count how many times X appears in this 50-page PDF" – a task impossible for standard RAG.
