# Comprehensive Testing Guide: Chat Interface

**Component:** `frontend/src/app/(dashboard)/chat/page.tsx`
**Service:** `frontend/src/services/chat.ts`

This document outlines the testing strategy, test cases, and edge cases for the Neural Chat interface.

## 1. Unit Testing Strategy

### 1.1 Component Rendering
- **Initial State:**
  - Verify loading spinner appears initially (`isInitialLoading`).
  - Verify sidebar is open by default.
  - Verify initial "Welcome" message is displayed if no history exists.
  - Verify input area is empty and focused (if applicable).
- **Sidebar Elements:**
  - Verify "Chats" and "Knowledge Graph" tabs exist.
  - Verify "New Chat" button is present.
  - Verify Search bar is present in "Chats" tab.
  - Verify User Profile section is rendered.

### 1.2 Event Handling
- **Text Input:**
  - Test typing updates the state.
  - Test auto-resize of textarea.
  - Test `Enter` key triggers send.
  - Test `Shift+Enter` adds a newline.
- **Button Clicks:**
  - Test "Send" button triggers `handleSend`.
  - Test "File Upload" triggers file picker.
  - Test "Image Upload" triggers file picker.
  - Test Sidebar toggle button.
  - Test Strategy selector changes state.

### 1.3 Message Display
- **Markdown Rendering:**
  - Verify headers, lists, and code blocks render correctly.
  - Verify CodeBlock copy button works.
- **Metadata Badges:**
  - Verify badges (Strategy, Complexity, Web Search, etc.) appear when metadata is present.
  - Verify collapsible details for Multi-Query and Memory Summary.

## 2. Integration Testing Scenarios

### 2.1 Chat Session Management
- **Load Sessions:**
  - Mock `chatService.getSessions` response.
  - Verify session list populates.
  - Verify active session is highlighted.
- **Create Session:**
  - Click "New Chat".
  - Verify `chatService.createSession` is called.
  - Verify UI switches to new empty session.
- **Switch Session:**
  - Click a different session.
  - Verify `chatService.getSession` is called.
  - Verify messages update to selected session.
- **Delete Session:**
  - Click delete icon.
  - Verify `chatService.deleteSession` is called.
  - Verify session is removed from list.
  - Verify active session logic (e.g., switch to next available or clear).

### 2.2 Message Flow & Streaming
- **Send Message:**
  - User sends text.
  - Verify optimistic UI update (user message appears immediately).
  - Verify placeholder assistant message appears.
  - Verify `omniRagService.streamQuery` is called with correct params.
- **Streaming Response:**
  - Simulate SSE events (`metadata`, `content`, `done`).
  - Verify assistant message updates in real-time.
  - Verify badges appear on `metadata` event.
  - Verify status changes to `done` on completion.
- **Error Handling:**
  - Simulate SSE `error` event.
  - Verify error message is displayed in chat bubble.
  - Verify loading state clears.

### 2.3 File & Image Uploads
- **Document Upload:**
  - Select file.
  - Verify `omniRagService.uploadDocument` is called.
  - Verify success message from assistant ("File uploaded successfully").
  - Test failure case (error toast/message).
- **Image Upload (Staging):**
  - Select image.
  - Verify `imageService.uploadImage` is called.
  - Verify image appears in staging area (above input).
  - Verify "Remove" (X) button removes it from staging.
- **Sending Images:**
  - Send message with staged images.
  - Verify `image_urls` and `image_ids` are passed to `streamQuery`.
  - Verify staged images clear after sending.

## 3. End-to-End (E2E) Test Cases

### 3.1 Happy Path: Basic Conversation
1. User logs in and navigates to `/chat`.
2. User types "Hello" and presses Enter.
3. User sees "Hello" in chat bubble.
4. User sees typing indicator/streaming response from Assistant.
5. Conversation appears in Sidebar list.

### 3.2 Feature: Knowledge Graph Interaction
1. User clicks "Knowledge Graph" tab in sidebar.
2. User sees loading state/communities list.
3. User clicks "Rebuild Graph".
4. Verify "Rebuild" button enters loading state.
5. Verify list refreshes after completion.

### 3.3 Feature: Slash Commands
1. User types `/clear`.
2. Verify chat history clears and new session starts.
3. User types `/explain quantum computing`.
4. Verify input transforms to "Please explain..." prompt template.

### 3.4 Feature: Decision Vault Integration
1. User clicks "Convert to Decision" (header or message toolbar).
2. Verify navigation to `/decisionvault` with query params (`source`, `title`, `problem`).

## 4. Edge Cases & Error Boundaries

### 4.1 Network / API Failures
- **Scenario:** Backend is down (500 error on fetch).
  - **Expected:** Graceful error message "Failed to load sessions" or "Connection error" in chat.
- **Scenario:** Streaming connection interrupted.
  - **Expected:** Message shows partial content + error indicator. User can regenerate.

### 4.2 Empty / Invalid States
- **Scenario:** Sending empty message.
  - **Expected:** Send button disabled or no action.
- **Scenario:** Sending only whitespace.
  - **Expected:** No action.
- **Scenario:** No sessions exist.
  - **Expected:** Create new session automatically or show empty state prompting to start.

### 4.3 Large Inputs
- **Scenario:** User pastes 10,000 characters.
  - **Expected:** UI handles large text rendering (virtualization might be needed if extremely large, but standard React rendering should handle reasonable limits).
- **Scenario:** Uploading large file (>10MB).
  - **Expected:** Backend validation/Frontend check prevents upload with user-friendly error.

### 4.4 Concurrent Actions
- **Scenario:** User switches session while streaming response.
  - **Expected:** Stream should probably cancel or continue in background (depending on desired behavior). UI should update to new session immediately.
- **Scenario:** User clicks "Send" multiple times quickly.
  - **Expected:** Button disabled while loading/streaming to prevent duplicate requests.

## 5. Security Testing
- **XSS in Markdown:** Verify that `react-markdown` sanitizes HTML to prevent script injection via user input or AI response.
- **Auth Token:** Verify all service calls include `Authorization: Bearer token`.
- **Resource Access:** Verify user cannot fetch sessions of another user (IDOR check on backend).

