# Implementation Plan: Recursive Language Models (RLM)

Based on `docs/features/chat/recursive_chat_research.md`, we will implement the RLM system in 4 phases.

## Phase 1: Secure Code Execution Environment
- [ ] Create `backend/app/services/code_executor/` directory
- [ ] Implement `SecureSandbox` class in `backend/app/services/code_executor/sandbox.py`
    - Support for safe Python code execution
    - Timeouts and memory limits
    - Output capturing (stdout/stderr)
    - Restricted globals (whitelist approach)

## Phase 2: Recursive Agent Logic
- [ ] Create `backend/app/services/rag/prompts/recursive.py`
    - Implement the system prompt from the paper (Appendix C)
- [ ] Implement `RecursiveReasoningAgent` in `backend/app/services/rag/recursive_agent.py`
    - Initialize sandbox with context
    - Implement the `llm_query` tool bridge
    - Implement the main agent loop (Think -> Code -> Execute -> Observe)
    - Handle "FINAL" answer extraction

## Phase 3: Pipeline Integration
- [ ] Update `backend/app/api/v1/omni_rag.py`
    - Add `RECURSIVE_INTENSIVE` to strategy enum/handling
- [ ] Update `backend/app/services/rag/pipeline.py`
    - Integrate `RecursiveReasoningAgent` into `process_query`
    - Route queries to recursive agent when strategy is selected

## Phase 4: Frontend Visualization
- [ ] Update `frontend/src/services/omniRag.ts` to support new event types
- [ ] Update `frontend/src/app/(dashboard)/chat/page.tsx`
    - Add `RecursiveThinking` component
    - Render code execution blocks in the chat stream
    - Visualize sub-agent queries
