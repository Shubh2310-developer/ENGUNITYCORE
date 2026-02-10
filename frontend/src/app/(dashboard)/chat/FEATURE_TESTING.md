# Feature Analysis & Testing Guide: Chat Module

**Component:** `frontend/src/app/(dashboard)/chat/page.tsx`
**Service:** `frontend/src/services/chat.ts`

This document provides a detailed breakdown of all features implemented in the Chat module, including their operational logic, test cases, and optimization recommendations.

## 1. Core Chat Features

### 1.1 Real-time Streaming (SSE)
- **Description:** Uses Server-Sent Events (SSE) to stream AI responses character-by-character.
- **Logic:** `omniRagService.streamQuery` handles the connection. Parses `data: { type: ... }` messages.
- **Event Types:**
  - `metadata`: Updates message attributes (complexity, strategy, confidence).
  - `content`: Appends text to the message body.
  - `done`: Finalizes message status and updates session title.
  - `error`: Handles stream interruptions.
- **Test Cases:**
  - [ ] **TC-STREAM-01:** Verify text appears incrementally.
  - [ ] **TC-STREAM-02:** Verify multiple chunks are concatenated correctly (no dropped characters).
  - [ ] **TC-STREAM-03:** Verify `done` event stops the loading spinner.
  - [ ] **TC-STREAM-04:** Interrupt stream (network disconnect) and verify error handling.

### 1.2 Markdown & Code Rendering
- **Description:** Renders AI responses using `react-markdown` with GFM support.
- **Features:**
  - Syntax highlighting for code blocks.
  - "Copy Code" button overlaid on code blocks.
  - Tables, lists, and blockquotes rendering.
- **Optimization:** Current implementation uses `ReactMarkdown` which can be heavy.
  - *Recommendation:* Memoize the markdown component to prevent re-parsing unchanged text during streaming.
- **Test Cases:**
  - [ ] **TC-RENDER-01:** render a Python code block.
  - [ ] **TC-RENDER-02:** Click "Copy" on code block -> Verify clipboard content.
  - [ ] **TC-RENDER-03:** Render a Markdown table -> Verify alignment.

### 1.3 Slash Commands
- **Description:** Special commands starting with `/` to trigger specific behaviors.
- **Commands:**
  - `/clear`: Resets the chat canvas.
  - `/explain [topic]`: Wraps input in an explanation prompt.
  - `/summarize [text]`: Wraps input in a summarization prompt.
  - `/code [request]`: Wraps input in a coding prompt.
- **Test Cases:**
  - [ ] **TC-CMD-01:** Type `/clear` -> Verify messages are removed.
  - [ ] **TC-CMD-02:** Type `/explain Quantum` -> Verify prompt sent is "Please explain... Quantum".

## 2. Omni-RAG & Knowledge Graph Features

### 2.1 Metadata Visualization
- **Description:** Displays rich metadata about the AI's reasoning process.
- **Badges:**
  - **Strategy:** "Adaptive", "Vector RAG", "Graph RAG".
  - **Complexity:** Simple, Complex, Multi-step.
  - **Web Search:** Indicates if live internet search was used.
  - **Confidence:** Color-coded (Green >80%, Amber >50%, Red <50%).
- **Collapsible Sections:**
  - **Multi-Query:** Shows alternative search queries generated.
  - **Memory:** Shows hierarchical memory context used.
  - **HyDE:** Shows hypothetical document used for retrieval.
- **Test Cases:**
  - [ ] **TC-RAG-01:** Trigger a complex query -> Verify "Multi-Query" details appear.
  - [ ] **TC-RAG-02:** Verify Confidence badge color changes based on score.

### 2.2 Knowledge Graph Explorer
- **Description:** Sidebar tab showing extracted communities and entities.
- **Logic:** Fetches community summaries from `omniRagService`.
- **Actions:** "Rebuild Graph" triggers a backend re-indexing job.
- **Optimization:** `fetchCommunities` is called on every tab switch.
  - *Recommendation:* Cache community data in `useState` or a global store and only re-fetch on explicit refresh or after a timeout.
- **Test Cases:**
  - [ ] **TC-GRAPH-01:** Switch to "Knowledge Graph" tab -> Verify API call.
  - [ ] **TC-GRAPH-02:** Click "Rebuild Graph" -> Verify loading state and eventual refresh.

### 2.3 Document Upload (RAG Indexing)
- **Description:** Upload PDFs/Text files to be indexed into the vector store.
- **Logic:** `omniRagService.uploadDocument` handles multipart/form-data upload.
- **Feedback:** Assistant message confirms filename and chunk count.
- **Test Cases:**
  - [ ] **TC-DOC-01:** Upload PDF -> Verify success message with chunk count.
  - [ ] **TC-DOC-02:** Upload invalid file type -> Verify error handling.

## 3. Session Management Features

### 3.1 Session Lifecycle
- **Description:** CRUD operations for chat sessions.
- **Logic:**
  - **List:** Fetched on mount, sorted by timestamp (implied).
  - **Create:** "New Chat" button calls API.
  - **Delete:** Trash icon calls API.
  - **Switch:** Clicking a session ID updates `activeSessionId` and `messages`.
- **Optimization:** `setChatSessions` is updated frequently during streaming to update the "Last Message" preview.
  - *Recommendation:* Debounce session list updates during streaming to avoid re-rendering the sidebar for every character.
- **Test Cases:**
  - [ ] **TC-SESS-01:** Create New Chat -> Verify empty message list.
  - [ ] **TC-SESS-02:** Switch Session -> Verify messages restore correctly.
  - [ ] **TC-SESS-03:** Delete Active Session -> Verify redirection to new/empty session.

### 3.2 Search & Filtering
- **Description:** Filter sessions by title.
- **Logic:** Client-side filtering of the `chatSessions` array.
- **Test Cases:**
  - [ ] **TC-SEARCH-01:** Type "Python" -> Verify only matching sessions remain visible.

## 4. Multi-Modal Features (Images)

### 4.1 Image Upload & Staging
- **Description:** Upload images for analysis (Vision capabilities).
- **Logic:**
  - Upload -> `imageService` -> Returns URL/ID.
  - Image is added to `stagedImages` state.
  - Staged images are displayed above the input box.
- **Test Cases:**
  - [ ] **TC-IMG-01:** Upload image -> Verify thumbnail appears in staging.
  - [ ] **TC-IMG-02:** Click "X" on staged image -> Verify removal.

### 4.2 Image Rendering
- **Description:** Display images in chat (both user-uploaded and AI-generated).
- **Features:**
  - Hover actions: Download, Delete.
  - Click to open full size.
- **Test Cases:**
  - [ ] **TC-IMG-03:** Click image in chat -> Verify it opens in new tab.
  - [ ] **TC-IMG-04:** Delete image -> Verify it disappears from chat history.

## 5. Integration Features

### 5.1 Decision Vault Integration
- **Description:** Export a conversation to the Decision Vault for structured analysis.
- **Logic:** `router.push` to `/decisionvault` with query parameters (`title`, `problem`, `source=chat`).
- **Trigger:** Button in header or message toolbar.
- **Test Cases:**
  - [ ] **TC-INT-01:** Click "Convert to Decision" -> Verify URL parameters on destination page.

## 6. Optimization Recommendations

1.  **Message List Virtualization:**
    *   **Problem:** Rendering 100+ messages with Markdown is expensive.
    *   **Solution:** Use `react-window` or `virtuoso` to render only visible messages.

2.  **Memoization:**
    *   **Problem:** Typing in the input box triggers re-renders of the entire parent component.
    *   **Solution:** Wrap `MessageBubble` components in `React.memo` to prevent re-rendering unchanged messages.

3.  **Socket Connection:**
    *   **Current:** HTTP Streaming (SSE) via `fetch`.
    *   **Proposal:** Switch to `WebSocket` for bi-directional communication, which is better for "Stop Generation" and real-time typing indicators.

4.  **State Management:**
    *   **Current:** Local `useState` for messages.
    *   **Proposal:** Move chat state to `Zustand` or `Redux` to persist chat history when navigating away from the page (e.g., to Settings and back).

## 7. Service Analysis

### `chatService` (`frontend/src/services/chat.ts`)
- **Strengths:**
  - Clean separation of concerns (API calls vs UI).
  - Robust error handling in `streamMessage`.
  - Handles SSE parsing manually (flexible).
- **Weaknesses:**
  - Hardcoded API endpoints (partially mitigated by `FINAL_API_URL`).
  - `streamMessage` is a very large function; could be split into a custom hook (e.g., `useChatStream`).

### `omniRagService` & `imageService`
- **Integration:** The chat page acts as a "hub", orchestrating calls to these separate services. This is a good Micro-Frontend pattern.

---
**Document Status:** Draft v1.0
**Author:** QA Team
