# Feature Analysis & Testing Guide: Chat Module

**Component:** `frontend/src/app/(dashboard)/chat/page.tsx`
**Service:** `frontend/src/services/chat.ts`, `frontend/src/services/omniRag.ts`

This document provides a detailed breakdown of all features implemented in the Chat module, including their operational logic, test cases, and optimization recommendations.

## 1. Core Chat Features

### 1.1 Real-time Streaming (SSE)
- **Description:** Uses Server-Sent Events (SSE) to stream AI responses character-by-character.
- **Logic:** `omniRagService.streamQuery` handles the connection. Parses `data: { type: ... }` messages.
- **Event Types:**
  - `metadata`: Updates message attributes (complexity, strategy, confidence, **recursive steps**).
  - `content`: Appends text to the message body.
  - `done`: Finalizes message status and updates session title.
  - `error`: Handles stream interruptions.
- **Test Cases:**
  - [ ] **TC-STREAM-01:** Verify text appears incrementally.
  - [ ] **TC-STREAM-02:** Verify multiple chunks are concatenated correctly.
  - [ ] **TC-STREAM-03:** Verify `done` event stops the loading spinner.

### 1.2 Markdown & Code Rendering
- **Description:** Renders AI responses using `react-markdown` with GFM support.
- **Features:**
  - Syntax highlighting for code blocks.
  - "Copy Code" button overlaid on code blocks.
  - Tables, lists, and blockquotes rendering.

### 1.3 Slash Commands
- **Commands:** `/clear`, `/explain`, `/summarize`, `/code`.
- **Test Cases:**
  - [ ] **TC-CMD-01:** Type `/clear` -> Verify canvas resets.

---

## 2. Advanced Reasoning & RAG

### 2.1 Recursive Reasoning (RLM) - NEW
- **Description:** Implements the Recursive Language Model paradigm for handling unbounded context.
- **Features:**
  - **Strategy Selection:** "Recursive (Long Context)" option in the strategy dropdown.
  - **Step-by-Step Visualization:** Collapsible `details` blocks showing the AI's internal "Thought" and "REPL Output".
  - **Programmatic Interaction:** The AI executes Python code in a sandbox to inspect documents.
- **Test Cases:**
  - [ ] **TC-RLM-01:** Select "Recursive (Long Context)" -> Verify the strategy badge shows "recursive intensive".
  - [ ] **TC-RLM-02:** Ask a complex counting question -> Verify "Recursive Reasoning Process" section appears.
  - [ ] **TC-RLM-03:** Click a reasoning step -> Verify it expands to show the code block and the execution result.
  - [ ] **TC-RLM-04:** Verify the final conclusion is derived from the steps.

### 2.2 Omni-RAG Metadata
- **Features:** "Adaptive", "Vector RAG", "Graph RAG" strategies.
- **Badges:** Complexity, Web Search, Confidence (color-coded).
- **Details:** Multi-Query paths, Hierarchical Memory summary, HyDE doc.

### 2.3 Knowledge Graph Explorer
- **Description:** Sidebar tab showing extracted entities and thematic communities.
- **Actions:** "Rebuild Graph" triggers backend re-indexing.

---

## 3. Multi-Modal & Files

### 3.1 Document Upload
- **Logic:** Multipart upload indexed into vector store.
- **Feedback:** Assistant confirms chunk count and indexing strategy.

### 3.2 Image Analysis (Vision)
- **Features:** Staging area for multiple images, hover actions (download, delete).
- **Test Cases:**
  - [ ] **TC-IMG-01:** Upload multiple images -> Verify they appear in the input staging area.

---

## 4. Optimization Recommendations

1.  **Message Memoization:** Use `React.memo` on message bubbles to prevent parent re-renders during streaming.
2.  **Virtualized Sidebar:** Use virtualization for the chat session list when user has >100 conversations.
3.  **Recursive Step Debouncing:** Ensure the UI doesn't jitter when multiple recursive steps are reported in quick succession.
