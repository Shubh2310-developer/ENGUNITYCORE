# 🧪 Full-Proof Feature Testing & Performance Optimization Guide

**Module:** `frontend/src/app/(dashboard)/chat/page.tsx` (1,475 lines)  
**Services:** `chat.ts` · `omniRag.ts` · `image.ts` · `document.ts`  
**Styles:** `chat.module.css` (720 lines)  
**Auth:** `stores/authStore.ts` (Zustand + persist)  
**Date:** February 2026

---

## Table of Contents

1. [Unit Testing](#1-unit-testing)
2. [Integration Testing](#2-integration-testing)
3. [End-to-End (E2E) Testing](#3-end-to-end-e2e-testing)
4. [Performance Testing](#4-performance-testing)
5. [Security Testing](#5-security-testing)
6. [Accessibility Testing](#6-accessibility-testing)
7. [Responsive & Cross-Browser Testing](#7-responsive--cross-browser-testing)
8. [Performance Optimization Techniques](#8-performance-optimization-techniques)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [CI/CD Integration](#10-cicd-integration)

---

## 1. Unit Testing

**Framework:** Jest + React Testing Library  
**Config:** `jest.config.ts` with `@testing-library/jest-dom`

### 1.1 Component State Management

| Test ID | Feature | Test Description | Expected Result |
|:--------|:--------|:-----------------|:----------------|
| UT-SM-01 | Initial Load | Mount `ChatPage` with empty sessions | Shows welcome message with 4 capability bullets |
| UT-SM-02 | Initial Load | Mount with existing sessions from API | Loads latest session, displays its messages |
| UT-SM-03 | Input State | Type text into textarea | `input` state updates, textarea auto-resizes up to 128px |
| UT-SM-04 | Loading States | Set `isLoading=true` | Send button disabled, loading spinner shown |
| UT-SM-05 | Sidebar Toggle | Click sidebar toggle button | `sidebarOpen` toggles, CSS class switches between `sidebarOpen`/`sidebarClosed` |
| UT-SM-06 | Tab Switching | Click "Knowledge Graph" tab | `sidebarTab` changes to `'graph'`, `fetchCommunities()` called |
| UT-SM-07 | Strategy Select | Change dropdown to "Graph RAG" | `selectedStrategy` updates to `'graph_rag'` |
| UT-SM-08 | Time Update | Wait 60s interval | `now` state refreshes for relative timestamps |

```typescript
// Example: UT-SM-01
import { render, screen } from '@testing-library/react';
import ChatPage from './page';

// Mock all services
jest.mock('@/services/chat', () => ({
  chatService: {
    getSessions: jest.fn().mockResolvedValue([]),
    createSession: jest.fn().mockResolvedValue({ id: 'new-1' }),
    getSession: jest.fn(),
    deleteSession: jest.fn(),
  }
}));

jest.mock('@/services/omniRag', () => ({
  omniRagService: {
    streamQuery: jest.fn(),
    uploadDocument: jest.fn(),
    getCommunities: jest.fn().mockResolvedValue({ communities: [] }),
    rebuildGraph: jest.fn(),
  }
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(() => ({ user: { email: 'test@test.com' }, token: 'tk' })),
}));

test('shows welcome message on empty session', async () => {
  render(<ChatPage />);
  expect(await screen.findByText(/Welcome to/i)).toBeInTheDocument();
  expect(screen.getByText(/Programming & Development/i)).toBeInTheDocument();
});
```

### 1.2 Message Handling (`handleSend`)

| Test ID | Scenario | Input | Expected Behavior |
|:--------|:---------|:------|:-------------------|
| UT-MS-01 | Normal send | `"Hello AI"` | User message added, placeholder assistant message created, `streamQuery` called |
| UT-MS-02 | Empty input | `""` or `"   "` | No message sent, early return |
| UT-MS-03 | While loading | Any text while `isLoading=true` | Blocked, no action |
| UT-MS-04 | `/clear` command | `"/clear"` | `clearCanvas()` called, new session created, input cleared |
| UT-MS-05 | `/explain` command | `"/explain REST APIs"` | Text transformed to explanation prompt |
| UT-MS-06 | `/summarize` command | `"/summarize this article"` | Text transformed to summary prompt |
| UT-MS-07 | `/code` command | `"/code binary search"` | Text transformed to code-help prompt |
| UT-MS-08 | Enter key | Press Enter (no Shift) | `handleSend()` invoked, `preventDefault()` called |
| UT-MS-09 | Shift+Enter | Press Shift+Enter | Newline inserted, no send |
| UT-MS-10 | With staged images | Send with 2 staged images | `image_urls` and `image_ids` included in request, staged images cleared |

### 1.3 SSE Streaming Events

| Test ID | Event Type | Payload | Validation |
|:--------|:-----------|:--------|:-----------|
| UT-SSE-01 | `metadata` | `{ strategy: 'graph_rag', confidence: 0.85 }` | Assistant message updated with strategy/confidence |
| UT-SSE-02 | `content` | `{ content: 'Hello' }` then `{ content: ' World' }` | Content concatenated to `'Hello World'` |
| UT-SSE-03 | `done` | `{ message_id: 'msg-1', title: 'My Chat' }` | Status → `'done'`, loading stops, sidebar title updated |
| UT-SSE-04 | `error` | `{ content: 'Rate limit exceeded' }` | Error appended to message, loading stops |
| UT-SSE-05 | New session | `metadata` with `session_id` when `activeSessionId=null` | New session ID set, sessions list refreshed |
| UT-SSE-06 | Metadata fields | All fields: `complexity`, `used_web_search`, `hyde_doc`, `multi_queries`, `memory_active`, `memory_summary`, `context_compressed`, `steps`, `critique` | Each field stored on assistant message object |

### 1.4 Session Management

| Test ID | Action | Expected |
|:--------|:-------|:---------|
| UT-SES-01 | `createNewChat()` | New session prepended to sidebar, initial message shown, staged images cleared |
| UT-SES-02 | `switchToSession(id)` | Session loaded, messages replaced, staged images cleared |
| UT-SES-03 | `handleDeleteSession(e, id)` | `e.stopPropagation()` called, session removed from list |
| UT-SES-04 | Delete active session | Messages reset to initial, `activeSessionId` set to null |
| UT-SES-05 | Search filter | Type "deploy" in search | `filteredSessions` only includes matching titles |

### 1.5 File & Image Operations

| Test ID | Action | Expected |
|:--------|:-------|:---------|
| UT-FI-01 | `handleFileUpload` success | Upload message with filename and chunk count added |
| UT-FI-02 | `handleFileUpload` failure | Error message added to chat |
| UT-FI-03 | `handleImageUpload` success | Image appended to `stagedImages` |
| UT-FI-04 | `handleImageUpload` failure | Alert shown |
| UT-FI-05 | `removeStagedImage(id)` | Image filtered from `stagedImages` |
| UT-FI-06 | Delete image in message | `imageService.deleteImage` called, image removed from message state |
| UT-FI-07 | File input reset | After upload, `fileInputRef.current.value` is `''` |

### 1.6 Memoized Components

| Test ID | Component | Validation |
|:--------|:----------|:-----------|
| UT-MC-01 | `CodeBlock` | Re-render skipped when `children` and `lang` unchanged |
| UT-MC-02 | `CodeBlock` copy | Clicking copy → clipboard API called, check icon shown for 2s |
| UT-MC-03 | `MarkdownComponents` | `<p>` wrapping: returns `<div>` when children contain `CodeBlock`, else `<p>` |
| UT-MC-04 | `filteredSessions` | `useMemo` returns cached result when inputs unchanged |

### 1.7 Utility Functions

| Test ID | Function | Input | Expected |
|:--------|:---------|:------|:---------|
| UT-UF-01 | `formatTimestamp` | Today's date | Returns `"HH:MM AM/PM"` |
| UT-UF-02 | `formatTimestamp` | Yesterday's date | Returns `"Yesterday"` |
| UT-UF-03 | `formatTimestamp` | 5 days ago | Returns locale date string |
| UT-UF-04 | `shouldShowDivider` | Same day messages | Returns `false` |
| UT-UF-05 | `shouldShowDivider` | Different day messages | Returns `true` |
| UT-UF-06 | `getDividerText` | Today | Returns `"Today"` |
| UT-UF-07 | `getRowHeight` | Message with 500 chars | Returns estimated height > 80 |
| UT-UF-08 | `getRowHeight` | Message with images | Adds 200px to height |
| UT-UF-09 | `getRowHeight` | Message with steps | Adds `steps.length * 80` |

---

## 2. Integration Testing

### 2.1 Service ↔ Component Integration

| Test ID | Flow | Steps | Validation |
|:--------|:-----|:------|:-----------|
| IT-SC-01 | Chat Init | Page mount → `chatService.getSessions()` → `chatService.getSession()` | Messages rendered from API response |
| IT-SC-02 | Send Message | Type + Enter → `omniRagService.streamQuery()` | SSE events update UI progressively |
| IT-SC-03 | Upload Doc | Click paperclip → select file → `omniRagService.uploadDocument()` | Success message with chunk count |
| IT-SC-04 | Upload Image | Click image icon → select image → `imageService.uploadImage()` | Thumbnail in staging area |
| IT-SC-05 | Delete Session | Click trash → `chatService.deleteSession()` | Session removed from sidebar |
| IT-SC-06 | Rebuild Graph | Click "Rebuild Graph" → `omniRagService.rebuildGraph()` → poll `getCommunities()` | Communities render in sidebar |

### 2.2 Auth Store Integration

| Test ID | Scenario | Validation |
|:--------|:---------|:-----------|
| IT-AU-01 | Token included | All fetch calls include `Authorization: Bearer <token>` |
| IT-AU-02 | Token expired | API returns 401 → error handled gracefully |
| IT-AU-03 | User display | `user.email.split('@')[0]` shown in sidebar user profile |

### 2.3 Router Integration

| Test ID | Scenario | Validation |
|:--------|:---------|:-----------|
| IT-RT-01 | Decision Vault redirect | Click shield icon → `router.push('/decisionvault?source=chat&...')` |
| IT-RT-02 | Convert to Decision | Button visible when `messages.length > 5` |

---

## 3. End-to-End (E2E) Testing

**Framework:** Playwright  
**Config:** `playwright.config.ts`

### 3.1 Core Chat Flow

```typescript
// e2e/chat/core-chat.spec.ts
test.describe('Chat Core Flow', () => {
  test('E2E-CHAT-01: Send message and receive streamed response', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForSelector('[class*="messagesContainer"]');
    
    const textarea = page.locator('textarea');
    await textarea.fill('What is TypeScript?');
    await page.locator('button[class*="sendBtn"]').click();
    
    // Verify user message appears
    await expect(page.locator('text=What is TypeScript?')).toBeVisible();
    
    // Verify streaming indicator
    await expect(page.locator('text=AI is thinking...')).toBeVisible({ timeout: 5000 });
    
    // Wait for response completion
    await page.waitForSelector('text=AI is thinking...', { state: 'detached', timeout: 30000 });
    
    // Verify assistant message rendered
    const assistantMessages = page.locator('[class*="messageAssistantContent"]');
    await expect(assistantMessages.last()).not.toBeEmpty();
  });

  test('E2E-CHAT-02: Slash command /clear resets chat', async ({ page }) => {
    await page.goto('/chat');
    const textarea = page.locator('textarea');
    await textarea.fill('/clear');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Chat cleared')).toBeVisible({ timeout: 5000 });
  });
});
```

### 3.2 Full E2E Test Matrix

| Test ID | Scenario | Steps | Pass Criteria |
|:--------|:---------|:------|:-------------|
| E2E-CHAT-01 | Basic send/receive | Send message → wait for response | Response rendered with markdown |
| E2E-CHAT-02 | `/clear` command | Type `/clear` + Enter | Chat reset, new session created |
| E2E-CHAT-03 | `/explain` command | Type `/explain REST APIs` + Enter | Transformed prompt sent |
| E2E-CHAT-04 | New chat creation | Click "New Chat" button | New session in sidebar, welcome message |
| E2E-CHAT-05 | Session switching | Create 2 chats, switch between them | Messages correctly swapped |
| E2E-CHAT-06 | Session deletion | Delete a non-active session | Session removed, active chat unchanged |
| E2E-CHAT-07 | Delete active session | Delete the active session | Reset to welcome message |
| E2E-CHAT-08 | Search sessions | Type in search box | Filtered list shown |
| E2E-CHAT-09 | Copy message | Hover assistant msg → click copy | Clipboard contains message text |
| E2E-CHAT-10 | Regenerate response | Click regenerate on last assistant msg | Last assistant msg removed, re-sent |
| E2E-CHAT-11 | File upload | Upload a PDF | Success message with chunk count |
| E2E-CHAT-12 | Image upload & staging | Upload image | Thumbnail in staging area |
| E2E-CHAT-13 | Remove staged image | Click X on staged image | Image removed from staging |
| E2E-CHAT-14 | Send with image | Stage image + send text | Image URLs included in request |
| E2E-CHAT-15 | Strategy dropdown | Select "Graph RAG" → send | Strategy badge shows on response |
| E2E-CHAT-16 | Knowledge Graph tab | Switch to graph tab | Communities or empty state shown |
| E2E-CHAT-17 | Rebuild graph | Click "Rebuild Graph" | Loading spinner, then communities refresh |
| E2E-CHAT-18 | Sidebar collapse | Click collapse button | Sidebar collapses/expands |
| E2E-CHAT-19 | Keyboard: Enter sends | Press Enter without Shift | Message sent |
| E2E-CHAT-20 | Keyboard: Shift+Enter newline | Press Shift+Enter | Newline in textarea, no send |
| E2E-CHAT-21 | Decision Vault integration | Click shield on assistant msg | Navigates to `/decisionvault` with params |
| E2E-CHAT-22 | Convert to Decision | Click "Convert to Decision" button (>5 msgs) | Navigates with session title + last user msg |
| E2E-CHAT-23 | Code block copy | AI responds with code → click copy on code block | Code copied to clipboard |
| E2E-CHAT-24 | Recursive reasoning steps | Select "Recursive" → ask complex question | Steps appear as collapsible sections |
| E2E-CHAT-25 | Error handling | Simulate network failure mid-stream | Error message shown, loading stops |
| E2E-CHAT-26 | Session persistence | Send messages → refresh page | Session restored from API |
| E2E-CHAT-27 | Multiple rapid sends | Send 3 messages quickly | All processed in order, no message duplication |
| E2E-CHAT-28 | Metadata badges | Get response with confidence/strategy | All relevant badges rendered with correct colors |
| E2E-CHAT-29 | HyDE detail expand | Response with `hyde_doc` → expand details | HyDE content shown |
| E2E-CHAT-30 | Memory summary expand | Response with `memory_summary` → expand | Memory context displayed |

---

## 4. Performance Testing

### 4.1 Rendering Performance

| Test ID | Metric | Target | Measurement Tool |
|:--------|:-------|:-------|:-----------------|
| PT-RP-01 | First Contentful Paint | < 1.2s | Lighthouse |
| PT-RP-02 | Time to Interactive | < 2.5s | Lighthouse |
| PT-RP-03 | Frame rate during streaming | ≥ 55 FPS | Chrome DevTools Performance |
| PT-RP-04 | Re-renders per SSE chunk | ≤ 2 components | React DevTools Profiler |
| PT-RP-05 | Scroll performance (50 msgs) | ≥ 60 FPS | Performance Monitor |
| PT-RP-06 | Scroll performance (200 msgs) | ≥ 30 FPS | Performance Monitor + virtualization check |
| PT-RP-07 | Textarea resize latency | < 16ms | `performance.now()` instrumentation |
| PT-RP-08 | Sidebar search filter | < 50ms for 500 sessions | `console.time` around `useMemo` |

### 4.2 Network Performance

| Test ID | Metric | Target | Method |
|:--------|:-------|:-------|:-------|
| PT-NP-01 | First token latency (simple query) | < 800ms | Timestamp diff: send → first `content` event |
| PT-NP-02 | First token latency (RAG query) | < 2s | Same as above with RAG strategy |
| PT-NP-03 | Recursive step latency | < 2s per step | Timestamp between consecutive `metadata` events |
| PT-NP-04 | Image upload (5MB) | < 3s | Network waterfall |
| PT-NP-05 | Document upload (10MB PDF) | < 5s | Network waterfall |
| PT-NP-06 | Session list load | < 500ms | API response time |
| PT-NP-07 | SSE connection resilience | Auto-recover within 5s | Kill connection, observe reconnect |

### 4.3 Memory Performance

| Test ID | Scenario | Target | Tool |
|:--------|:---------|:-------|:-----|
| PT-MP-01 | 100 messages in session | Heap < 80MB | Chrome Memory tab |
| PT-MP-02 | 500 messages (virtualized) | Heap < 120MB | Chrome Memory tab |
| PT-MP-03 | 10 sessions open/closed | No heap growth > 5MB | Heap snapshot comparison |
| PT-MP-04 | Image staging (10 images) | Heap < 100MB | Chrome Memory tab |
| PT-MP-05 | 30-minute session | No memory leak trend | Timeline recording |

### 4.4 Load Testing Script

```javascript
// k6 load test: backend streaming endpoint
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const token = __ENV.AUTH_TOKEN;
  const res = http.post(
    `${__ENV.API_URL}/api/v1/omni-rag/stream`,
    JSON.stringify({ query: 'What is machine learning?', strategy: 'vector_rag' }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 5. Security Testing

| Test ID | Category | Test | Expected |
|:--------|:---------|:-----|:---------|
| ST-01 | XSS in messages | Send `<script>alert(1)</script>` | ReactMarkdown escapes, no execution |
| ST-02 | XSS in code blocks | Send markdown with malicious code fence | `CodeBlock` renders as text only |
| ST-03 | Prompt injection via REPL | Ask AI to `print(open('/etc/passwd').read())` | Sandbox blocks `open()`, error returned |
| ST-04 | Auth token exposure | Inspect network requests | Token only in `Authorization` header, not URL |
| ST-05 | CSRF protection | POST without valid token | 401 Unauthorized |
| ST-06 | File upload validation | Upload `.exe` file | Backend rejects, UI shows error |
| ST-07 | Image upload validation | Upload 50MB image | Rejected by size limit |
| ST-08 | Session isolation | Access session of another user | 403 Forbidden |
| ST-09 | Rate limiting | Send 100 messages in 10s | Rate limit error after threshold |
| ST-10 | WebSocket/SSE hijacking | Tamper with SSE stream | Graceful error handling, no crash |

---

## 6. Accessibility Testing

| Test ID | Requirement | Validation |
|:--------|:-----------|:-----------|
| AT-01 | Keyboard navigation | Tab through all interactive elements in order |
| AT-02 | Screen reader | ARIA labels on buttons (send, upload, copy, delete) |
| AT-03 | Focus management | After sending message, focus returns to textarea |
| AT-04 | Color contrast | All text meets WCAG 2.1 AA (4.5:1 ratio) |
| AT-05 | Loading announcements | `aria-live` region for streaming status |
| AT-06 | Image alt text | All `<Image>` tags have descriptive `alt` attributes |
| AT-07 | Skip navigation | Skip link to main content area |

---

## 7. Responsive & Cross-Browser Testing

### 7.1 Breakpoint Matrix

| Breakpoint | Sidebar | Messages | Input | Validation |
|:-----------|:--------|:---------|:------|:-----------|
| Desktop (>1024px) | 22rem, always visible | 96% max-width | Full controls visible | Standard layout |
| Tablet (768-1024px) | Overlay on toggle | Full width content | Controls wrap gracefully | No horizontal scroll |
| Mobile (<768px) | Full-screen overlay (z-50) | 100% max-width | Stacked layout | All features accessible |

### 7.2 Browser Matrix

| Browser | Version | Status |
|:--------|:--------|:-------|
| Chrome | 120+ | Primary |
| Firefox | 120+ | Must pass |
| Safari | 17+ | Must pass |
| Edge | 120+ | Must pass |
| Mobile Safari (iOS) | 17+ | Must pass |
| Chrome Android | 120+ | Must pass |

---

## 8. Performance Optimization Techniques

### 8.1 Current Optimizations (Already Implemented)

| Optimization | Location | Impact |
|:-------------|:---------|:-------|
| `React.memo` on `CodeBlock` | Lines 53-84 | Prevents re-render of code blocks during streaming |
| Custom areEqual comparator | Line 82-83 | Only re-renders when `children` or `lang` changes |
| `useCallback` on handlers | Lines 56, 436, 442, 501 | Stable references for `copyMessage`, `regenerateLastMessage`, `removeStagedImage` |
| `useMemo` on `filteredSessions` | Lines 602-607 | Cached filtered session list |
| Conditional virtualization | Lines 916-1024 | `List` from react-window for >50 messages |
| Dynamic row height caching | Lines 209-253 | `rowHeights.current` prevents recalculation |
| Textarea auto-resize capped | Lines 264-269 | Max height 128px to prevent layout shift |
| 60s timer for timestamps | Lines 115-118 | Minimal re-renders for "relative time" updates |

### 8.2 Recommended Optimizations

#### 🔴 Critical Priority

**1. Extract Message Bubble Component + `React.memo`**
```typescript
// Current: Inline JSX in map → entire list re-renders per SSE chunk
// Fix: Extract and memoize individual message bubbles
const MessageBubble = React.memo(({ msg, idx, isLast, copiedId, onCopy, onRegenerate }) => {
  // ... message rendering logic
}, (prev, next) => {
  return prev.msg.content === next.msg.content
    && prev.msg.status === next.msg.status
    && prev.copiedId === next.copiedId
    && prev.isLast === next.isLast;
});
```
**Impact:** Reduces re-renders from O(n) to O(1) per SSE chunk.

**2. Debounce SSE Content Updates**
```typescript
// Current: setState called on EVERY content chunk
// Fix: Batch updates with requestAnimationFrame
const contentBuffer = useRef('');
const rafId = useRef<number>();

const flushContent = useCallback(() => {
  if (contentBuffer.current) {
    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessageId
        ? { ...msg, content: (msg.content || '') + contentBuffer.current }
        : msg
    ));
    contentBuffer.current = '';
  }
}, []);

// In SSE handler:
if (event.type === 'content') {
  contentBuffer.current += event.content;
  if (!rafId.current) {
    rafId.current = requestAnimationFrame(() => {
      flushContent();
      rafId.current = undefined;
    });
  }
}
```
**Impact:** Reduces setState calls from ~100/s to ~60/s (frame rate).

**3. Memoize `MarkdownComponents` Object**
```typescript
// Current: MarkdownComponents is recreated every render (line 632)
// Fix: Move to useMemo or module scope
const MarkdownComponents = useMemo(() => ({
  p: ({ children }) => { /* ... */ },
  code: ({ inline, className, children }) => { /* ... */ },
  // ...
}), []); // Stable reference → prevents ReactMarkdown re-parse
```
**Impact:** Prevents full markdown re-parse on unrelated state changes.

#### 🟡 Medium Priority

**4. Lazy Load ReactMarkdown**
```typescript
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });
```
**Impact:** Reduces initial bundle by ~40KB gzipped.

**5. Virtualize Sidebar Session List**
```typescript
// Current: All sessions rendered even when >100
// Fix: Use react-window FixedSizeList for sessionsList
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={sidebarHeight}
  itemCount={filteredSessions.length}
  itemSize={64}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}><SessionItem session={filteredSessions[index]} /></div>
  )}
</FixedSizeList>
```

**6. Image Lazy Loading with Intersection Observer**
```typescript
// Current: All message images loaded eagerly
// Fix: Add loading="lazy" and use Next.js Image priority only for visible
<Image loading="lazy" sizes="(max-width: 768px) 100vw, 192px" /* ... */ />
```

**7. Optimize `setMessages` During Streaming**
```typescript
// Current: .map() over ALL messages to update ONE message per chunk
// Fix: Use functional update with early exit
setMessages(prev => {
  const idx = prev.findIndex(m => m.id === assistantMessageId);
  if (idx === -1) return prev;
  const updated = [...prev];
  updated[idx] = { ...updated[idx], content: (updated[idx].content || '') + event.content };
  return updated;
});
```

#### 🟢 Low Priority

**8. CSS `content-visibility: auto`**
```css
.messageBubble {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}
```
**Impact:** Browser skips rendering off-screen messages.

**9. Web Worker for Markdown Parsing**
Move heavy markdown parsing to a Web Worker for messages with >5000 characters.

**10. Preconnect to API**
```html
<link rel="preconnect" href="https://api.engunity.com" />
<link rel="dns-prefetch" href="https://api.engunity.com" />
```

### 8.3 Bundle Optimization

| Technique | Current | Recommended | Savings |
|:----------|:--------|:------------|:--------|
| Tree-shake lucide-react | Importing 20+ icons | Already using named imports ✅ | — |
| Dynamic import framer-motion | Loaded on page load | `dynamic(() => import('framer-motion'))` | ~35KB gzip |
| Code split ReactMarkdown | In main bundle | Dynamic import with SSR disabled | ~40KB gzip |
| Optimize Next.js Image | Using `Image` component | Ensure `sizes` prop accurate | Bandwidth savings |
| Remove unused CSS | 720 lines in module | PurgeCSS in production build | ~5KB |

---

## 9. Monitoring & Observability

### 9.1 Frontend Metrics to Track

```typescript
// Custom performance hooks
const useStreamingMetrics = () => {
  const metrics = useRef({
    firstTokenTime: 0,
    totalTokens: 0,
    totalTime: 0,
    renderCount: 0,
  });

  // Track first token latency
  const onFirstToken = () => {
    metrics.current.firstTokenTime = performance.now() - sendTimestamp;
  };

  // Report to analytics
  const reportMetrics = () => {
    analytics.track('chat_response', {
      first_token_ms: metrics.current.firstTokenTime,
      total_tokens: metrics.current.totalTokens,
      tokens_per_second: metrics.current.totalTokens / (metrics.current.totalTime / 1000),
    });
  };
};
```

### 9.2 Key Metrics Dashboard

| Metric | Source | Alert Threshold |
|:-------|:-------|:----------------|
| P95 First Token Latency | Frontend instrumentation | > 3s |
| SSE Connection Drops/hour | Error handler count | > 5 |
| Client-side JS Errors | Error boundary | > 0.1% of sessions |
| Message Send Success Rate | API response codes | < 99% |
| Avg Messages Per Session | Backend analytics | Trend monitoring |
| Image Upload Failure Rate | Error handler count | > 5% |

---

## 10. CI/CD Integration

### 10.1 Pipeline Configuration

```yaml
# .github/workflows/chat-tests.yml
name: Chat Module Tests
on:
  pull_request:
    paths:
      - 'frontend/src/app/(dashboard)/chat/**'
      - 'frontend/src/services/chat.ts'
      - 'frontend/src/services/omniRag.ts'
      - 'frontend/src/services/image.ts'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test -- --coverage --testPathPattern='chat'
      - uses: codecov/codecov-action@v4

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e -- --project=chromium --grep='@chat'

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: 'http://localhost:3000/chat'
          budgetPath: './lighthouse-budget.json'
```

### 10.2 Coverage Targets

| Layer | Target | Current (Est.) |
|:------|:-------|:---------------|
| Unit Tests | > 80% line coverage | ~0% (no tests) |
| Integration Tests | > 70% of service calls | ~0% |
| E2E Tests | 30 scenarios (100% critical paths) | ~0% |
| Performance Budget | LCP < 2s, FID < 100ms | Unmeasured |

---

## Appendix: Test File Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── chat/
│   │   │   ├── ChatPage.test.tsx          # UT-SM, UT-MS, UT-MC
│   │   │   ├── ChatPage.streaming.test.tsx # UT-SSE
│   │   │   ├── ChatPage.sessions.test.tsx  # UT-SES
│   │   │   ├── ChatPage.files.test.tsx     # UT-FI
│   │   │   └── ChatPage.utils.test.tsx     # UT-UF
│   │   ├── services/
│   │   │   ├── chat.service.test.ts
│   │   │   ├── omniRag.service.test.ts
│   │   │   └── image.service.test.ts
│   │   └── setup.ts
│   └── app/(dashboard)/chat/
│       └── CHAT_TESTING_AND_OPTIMIZATION.md  # This file
├── e2e/
│   └── chat/
│       ├── core-chat.spec.ts              # E2E-CHAT-01 to E2E-CHAT-10
│       ├── files-images.spec.ts           # E2E-CHAT-11 to E2E-CHAT-14
│       ├── rag-strategies.spec.ts         # E2E-CHAT-15 to E2E-CHAT-17, E2E-CHAT-24
│       ├── sidebar.spec.ts               # E2E-CHAT-18, E2E-CHAT-04 to E2E-CHAT-08
│       └── security.spec.ts              # ST-01 to ST-10
└── k6/
    └── chat-load-test.js                  # Load testing script
```
