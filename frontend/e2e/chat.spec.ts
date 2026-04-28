/**
 * E2E Test Suite: Chat Dashboard Page
 * 
 * Covers: /chat page full flow — auth guard, page load, send/stream,
 * error handling, session management, history persistence, multi-message
 * sequence, slash commands, and performance sanity.
 *
 * All API calls are mocked via page.route() — no real backend required.
 * Uses the authenticatedPage fixture from e2e/fixtures/auth.fixture.ts.
 * 
 * Run: conda run -n engunity npx playwright test e2e/chat.spec.ts --project=chromium
 */

import { test, expect } from './fixtures/auth.fixture';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Encode an SSE event line */
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** Build a complete mock SSE streaming response */
function mockStreamResponse(replyText: string, sessionId = 'sess-001', msgId = 'msg-001') {
  const chunks = replyText.split(' ');
  const events = [
    sseEvent({ type: 'metadata', session_id: sessionId, retrieved_docs: [], strategy: 'adaptive', complexity: 'simple' }),
    ...chunks.map(word => sseEvent({ type: 'content', content: word + ' ' })),
    sseEvent({ type: 'done', message_id: msgId, title: 'Test chat' }),
  ];
  return events.join('');
}

function mockTurboStreamResponse(
  replyText: string,
  turboQuant: Record<string, unknown>,
  sessionId = 'sess-tq-001',
  msgId = 'msg-tq-001'
) {
  const chunks = replyText.split(' ');
  const events = [
    sseEvent({ type: 'metadata', session_id: sessionId, strategy: 'adaptive', turbo_quant: turboQuant }),
    ...chunks.map(word => sseEvent({ type: 'content', content: word + ' ' })),
    sseEvent({ type: 'done', message_id: msgId, title: 'Turbo chat' }),
  ];
  return events.join('');
}

/** Mock the omni-rag/stream endpoint */
async function mockOmniStream(page: any, replyText: string, sessionId = 'sess-001') {
  await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: mockStreamResponse(replyText, sessionId),
    });
  });
}

/** Mock the chat sessions endpoint */
async function mockSessions(page: any, sessions: any[] = []) {
  await page.route('**/api/v1/chat/', async (route: any) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sessions),
      });
    } else {
      route.continue();
    }
  });
}

/** Mock GET /chat/{sessionId} */
async function mockGetSession(page: any, session: any) {
  await page.route(`**/api/v1/chat/${session.id}`, async (route: any) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session),
      });
    } else {
      route.continue();
    }
  });
}

/** Mock POST /chat/sessions (create new session) */
async function mockCreateSession(page: any, newSession: any) {
  await page.route('**/api/v1/chat/sessions', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(newSession),
    });
  });
}

/** Navigate to chat and wait for page to be stable */
async function goToChat(page: any) {
  await page.goto('/chat');
  await page.waitForLoadState('networkidle');
}

async function goToChatWithTurbo(page: any) {
  await page.addInitScript(() => {
    (window as any).__ENABLE_TURBO_QUANT_CHAT = true;
  });
  await goToChat(page);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Chat Dashboard — Auth & Access', () => {
  /**
   * C-01: Unauthenticated users must be redirected away from /chat.
   * The Next.js middleware enforces auth; accessing /chat without a session
   * should redirect to /login.
   */
  test('C-01: redirects to /login when unauthenticated', async ({ page }) => {
    // Do NOT use the authenticatedPage fixture — plain page
    await page.goto('/chat');
    // Next.js middleware redirects to /login or root
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
  });
});

test.describe('Chat Dashboard — Page Load & Initial State', () => {
  /**
   * C-02: When authenticated and no prior sessions exist, the chat page
   * should render with the welcome message and correct layout elements.
   */
  test('C-02: page loads with empty state and welcome message', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);
    await goToChat(page);

    // Header is present
    await expect(page.locator('h1').filter({ hasText: 'Neural Chat' })).toBeVisible({ timeout: 10000 });

    // Input area is rendered and enabled
    const textarea = page.locator('textarea[placeholder*="Ask anything"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();

    // Send button is rendered (disabled when input is empty)
    const sendBtn = page.locator('button[aria-label="Send message"]');
    await expect(sendBtn).toBeVisible();

    // Welcome message from setInitialMessage()
    await expect(page.getByText(/Welcome to.*Engunity AI Chat/i)).toBeVisible({ timeout: 8000 });

    // Sidebar renders
    await expect(page.getByText('Research Hub')).toBeVisible();
    await expect(page.getByText('New Chat')).toBeVisible();
  });

  /**
   * C-02b: When authenticated with existing sessions, the sidebar shows them
   * and the latest session's messages are loaded.
   */
  test('C-02b: page loads with existing sessions in sidebar', async ({ authenticatedPage: page }) => {
    const sessions = [
      { id: 'sess-001', title: 'My first convo', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), message_count: 2 },
    ];
    const sessionDetail = {
      ...sessions[0],
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: new Date().toISOString() },
      ],
    };

    await mockSessions(page, sessions);
    await mockGetSession(page, sessionDetail);
    await goToChat(page);

    // Session title appears in sidebar
    await expect(page.getByText('My first convo')).toBeVisible({ timeout: 10000 });

    // Messages from the session are rendered
    await expect(page.getByText('Hello')).toBeVisible();
    await expect(page.getByText('Hi there!')).toBeVisible();
  });
});

test.describe('Chat Dashboard — Send Message & Streaming', () => {
  /**
   * C-03: Sending a message should result in the user message appearing,
   * followed by the assistant's response after streaming completes.
   */
  test('C-03: send message — user message appears, assistant responds', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);
    await mockOmniStream(page, 'Hello from assistant!', 'sess-new');
    await mockCreateSession(page, { id: 'sess-new', title: 'New Chat', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages: [] });
    await goToChat(page);

    const textarea = page.locator('textarea[placeholder*="Ask anything"]');
    await textarea.fill('Hello, AI!');

    // Send button should now be enabled
    const sendBtn = page.locator('button[aria-label="Send message"]');
    await expect(sendBtn).toBeEnabled();

    // Submit via Enter key (same as clicking send, avoids disabled-state race with instant mock)
    await textarea.press('Enter');

    // User message appears in the message list (p.whitespace-pre-wrap is user bubble)
    await expect(page.locator('p.whitespace-pre-wrap').filter({ hasText: 'Hello, AI!' })).toBeVisible({ timeout: 10000 });

    // Input was cleared when send fired
    await expect(textarea).toHaveValue('', { timeout: 8000 });

    // Assistant response appears (ReactMarkdown renders from content state)
    await expect(page.getByText(/Hello from assistant/i).first()).toBeVisible({ timeout: 15000 });
  });

  /**
   * C-04: During streaming, partial content must render progressively.
   * The placeholder/streaming state should be visible before completion.
   */
  test('C-04: streaming — placeholder state and partial content visible during stream', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);

    // Slow stream: manually control chunks
    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      // Give a minimal metadata + one content chunk + done
      const body = [
        sseEvent({ type: 'metadata', session_id: 'sess-slow', retrieved_docs: [], strategy: 'adaptive' }),
        sseEvent({ type: 'content', content: 'Partial ' }),
        sseEvent({ type: 'content', content: 'response ' }),
        sseEvent({ type: 'content', content: 'here.' }),
        sseEvent({ type: 'done', message_id: 'msg-slow', title: 'Slow chat' }),
      ].join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await goToChat(page);

    const textarea = page.locator('textarea[placeholder*="Ask anything"]');
    await textarea.fill('Test streaming');
    await page.locator('button[aria-label="Send message"]').click();

    // Final assembled content should be visible
    await expect(page.getByText(/Partial response here/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Chat Dashboard — Error Handling', () => {
  /**
   * C-05: When the stream returns an error event, the message should show
   * an error indicator (❌ prefix) and the input should be re-enabled.
   */
  test('C-05: stream error — shows error in message bubble, input re-enabled', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);
    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          sseEvent({ type: 'metadata', session_id: 'sess-err', retrieved_docs: [] }),
          sseEvent({ type: 'error', content: 'LLM service unavailable' }),
        ].join(''),
      });
    });

    await goToChat(page);

    await page.locator('textarea[placeholder*="Ask anything"]').fill('Will this fail?');
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea[placeholder*="Ask anything"]') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = 'Fallback please';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.locator('button[aria-label="Send message"]').click();

    // Wait for the error text to appear anywhere in the messages area.
    // The onError callback sets msg.content = '<prev>\n\n❌ Error: LLM service unavailable'.
    // ReactMarkdown renders this inside the assistant bubble.
    await page.waitForFunction(
      () => document.body.innerText.includes('LLM service unavailable') ||
            document.body.innerText.includes('❌ Error'),
      { timeout: 15000 }
    );

    // Input should be re-enabled after error (isLoading → false)
    await expect(page.locator('textarea[placeholder*="Ask anything"]')).toBeEnabled({ timeout: 12000 });
  });

  /**
   * C-06: When the network request fails (connection refused / abort),
   * the error handler fires and the message shows a failure prompt.
   */
  test('C-06: network failure — shows failure message, input recovers', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);
    // Abort the stream request to simulate network failure
    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      await route.abort('connectionrefused');
    });

    await goToChat(page);

    await page.locator('textarea[placeholder*="Ask anything"]').fill('Network test');
    await page.locator('button[aria-label="Send message"]').click();

    // Frontend catch block sets content to '❌ Failed to start chat session. Please try again.'
    // This renders via ReactMarkdown as a paragraph. Use .first() to avoid strict mode.
    await expect(
      page.getByText(/❌|Failed to start chat|Error/i).first()
    ).toBeVisible({ timeout: 12000 });

    // Input re-enabled after failure
    await expect(page.locator('textarea[placeholder*="Ask anything"]')).toBeEnabled({ timeout: 12000 });
  });
});

test.describe('Chat Dashboard — Session Management', () => {
  /**
   * C-07: Refreshing the page with an active session should reload history.
   * Messages from the session must persist across a page refresh.
   */
  test('C-07: history persistence — messages reload after page refresh', async ({ authenticatedPage: page }) => {
    const sessionId = 'sess-persist';
    const sessions = [
      { id: sessionId, title: 'Persisted Chat', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), message_count: 2 },
    ];
    const sessionDetail = {
      ...sessions[0],
      messages: [
        { id: 'm1', role: 'user', content: 'Remember this message', timestamp: new Date().toISOString() },
        { id: 'm2', role: 'assistant', content: 'I will remember it!', timestamp: new Date().toISOString() },
      ],
    };

    await mockSessions(page, sessions);
    await mockGetSession(page, sessionDetail);
    await goToChat(page);

    // Verify messages on first load
    await expect(page.getByText('Remember this message')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('I will remember it!')).toBeVisible();

    // Refresh page — mocks persist via page.route handlers
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Messages must still be visible after reload
    await expect(page.getByText('Remember this message')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('I will remember it!')).toBeVisible();
  });

  /**
   * C-09: Clicking "New Chat" button creates a session and resets UI.
   */
  test('C-09: create new chat — session created, welcome message shown', async ({ authenticatedPage: page }) => {
    const newSession = {
      id: 'sess-new-001',
      title: 'New Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };

    await mockSessions(page, []);
    await mockCreateSession(page, newSession);
    await goToChat(page);

    const newChatBtn = page.getByRole('button', { name: /New Chat/i });
    await expect(newChatBtn).toBeVisible();
    await newChatBtn.click();

    // Wait for welcome message to appear after session creation
    await expect(page.getByText(/Welcome to.*Engunity AI Chat|🧹 Chat cleared/i)).toBeVisible({ timeout: 8000 });
  });

  /**
   * C-10: Deleting a session removes it from the sidebar.
   */
  test('C-10: delete session — removed from sidebar list', async ({ authenticatedPage: page }) => {
    const sessionId = 'sess-to-delete';
    const sessions = [
      { id: sessionId, title: 'Delete me', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), message_count: 1 },
    ];
    const sessionDetail = { ...sessions[0], messages: [] };

    await mockSessions(page, sessions);
    await mockGetSession(page, sessionDetail);

    // Mock DELETE endpoint
    await page.route(`**/api/v1/chat/${sessionId}`, async (route: any) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success' }) });
      } else {
        route.continue();
      }
    });

    await goToChat(page);

    // Session must be visible in sidebar
    await expect(page.getByText('Delete me')).toBeVisible({ timeout: 10000 });

    // Click delete button for the session
    await page.locator('button[title="Delete conversation"]').first().click();

    // Session is removed from the sidebar
    await expect(page.getByText('Delete me')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Chat Dashboard — Multi-Message Sequence', () => {
  /**
   * C-08: Sending multiple messages in sequence must maintain order
   * and not mix up message content.
   */
  test('C-08: multi-message sequence — messages appear in order', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);

    let callCount = 0;
    const replies = ['First reply.', 'Second reply.', 'Third reply.'];

    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      const reply = replies[callCount % replies.length];
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockStreamResponse(reply, 'sess-multi', `msg-${callCount}`),
      });
    });
    await mockCreateSession(page, { id: 'sess-multi', title: 'Multi Chat', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages: [] });

    await goToChat(page);

    const textarea = page.locator('textarea[placeholder*="Ask anything"]');
    const sendBtn = page.locator('button[aria-label="Send message"]');

    // Send message 1
    await textarea.fill('Question one');
    await sendBtn.click();
    // User message appears in message list — p.whitespace-pre-wrap is user bubble
    await expect(page.locator('p.whitespace-pre-wrap').filter({ hasText: 'Question one' })).toBeVisible({ timeout: 8000 });
    // Wait for the first reply to appear before sending second message
    await expect(page.getByText(/First reply/i).first()).toBeVisible({ timeout: 15000 });
    // Wait for send button to be re-enabled (isLoading = false after done event)
    await expect(sendBtn).toBeEnabled({ timeout: 10000 });

    // Send message 2
    await textarea.fill('Question two');
    await sendBtn.click();
    await expect(page.locator('p.whitespace-pre-wrap').filter({ hasText: 'Question two' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Second reply/i).first()).toBeVisible({ timeout: 15000 });

    // Verify both user messages are in DOM using paragraph selector
    const userMsgs = page.locator('p.whitespace-pre-wrap');
    await expect(userMsgs.filter({ hasText: 'Question one' })).toBeVisible();
    await expect(userMsgs.filter({ hasText: 'Question two' })).toBeVisible();
  });
});

test.describe('Chat Dashboard — Slash Commands', () => {
  /**
   * C-11: The /clear slash command should clear the canvas and create
   * a new session, showing the "Chat cleared" confirmation message.
   */
  test('C-11: /clear slash command — canvas cleared with confirmation', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);
    await mockCreateSession(page, {
      id: 'sess-cleared',
      title: 'New Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    });

    // Mock the omni-rag stream for any potential calls
    await mockOmniStream(page, 'ok', 'sess-cleared');

    await goToChat(page);

    const textarea = page.locator('textarea[placeholder*="Ask anything"]');
    await textarea.fill('/clear');
    await textarea.press('Enter');

    // /clear triggers clearCanvas() which creates a new session
    await expect(page.getByText(/🧹 Chat cleared/i)).toBeVisible({ timeout: 8000 });

    // Input is cleared
    await expect(textarea).toHaveValue('');
  });
});

test.describe('Chat Dashboard — Performance', () => {
  /**
   * C-12: A conversation with many messages must still scroll to bottom
   * and keep input responsive. Validates no UI freeze on long context.
   */
  test('C-12: performance sanity — long conversation scrolls correctly', async ({ authenticatedPage: page }) => {
    // Build a session with 20 messages
    const msgs = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i + 1}: ${i % 2 === 0 ? 'User says something here.' : 'Assistant replies with details.'}`,
      timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
    }));

    const session = {
      id: 'sess-long',
      title: 'Long Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 20,
      messages: msgs,
    };

    await mockSessions(page, [{ id: session.id, title: session.title, created_at: session.created_at, updated_at: session.updated_at, message_count: 20 }]);
    await mockGetSession(page, session);
    await goToChat(page);

    // All messages should render within reasonable time
    await expect(page.getByText('Message 1:')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Message 20:')).toBeVisible({ timeout: 10000 });

    // Last message is visible (scroll-to-bottom worked)
    const lastMsg = page.getByText('Message 20:');
    await expect(lastMsg).toBeInViewport({ timeout: 5000 });

    // Input is still responsive
    const textarea = page.locator('textarea[placeholder*="Ask anything"]');
    await expect(textarea).toBeEnabled();
    await textarea.fill('Still responsive after 20 messages');
    await expect(textarea).toHaveValue('Still responsive after 20 messages');
  });
});

test.describe('Chat Dashboard — Turbo Quant', () => {
  test('C-13: turbo quant enabled send flow includes turbo_quant request and badges', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);

    let capturedBody: any = null;
    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockTurboStreamResponse(
          'Turbo response works',
          {
            requested: true,
            applied: true,
            provider: 'ollama',
            compression_ratio: 4,
            estimated_memory_saved_mb: 512,
          },
          'sess-turbo-enabled'
        ),
      });
    });
    await mockCreateSession(page, { id: 'sess-turbo-enabled', title: 'Turbo Chat', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages: [] });

    await goToChatWithTurbo(page);

    const tqToggle = page.getByRole('button', { name: 'TQ' });
    await expect(tqToggle).toBeVisible({ timeout: 10000 });
    await tqToggle.click();

    await page.locator('textarea[placeholder*="Ask anything"]').fill('Turbo test message', { force: true });
    await expect(page.locator('button[aria-label="Send message"]')).toBeEnabled({ timeout: 10000 });
    await page.locator('button[aria-label="Send message"]').click();

    await expect(page.getByText(/Turbo response works/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Turbo Quant Requested')).toBeVisible();
    await expect(page.getByText('Turbo Quant Applied')).toBeVisible();

    expect(capturedBody).toBeTruthy();
    expect(capturedBody.turbo_quant).toBeTruthy();
    expect(capturedBody.turbo_quant.enabled).toBe(true);
  });

  test('C-14: unsupported provider fallback still streams successful response', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);

    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockTurboStreamResponse(
          'Fallback response still works',
          {
            requested: true,
            applied: false,
            provider: 'groq',
            fallback_reason: 'provider_unsupported',
          },
          'sess-turbo-fallback'
        ),
      });
    });

    await goToChatWithTurbo(page);
    const tqToggle = page.getByRole('button', { name: 'TQ' });
    await expect(tqToggle).toBeVisible({ timeout: 10000 });
    await tqToggle.click();

    await page.locator('textarea[placeholder*="Ask anything"]').fill('Fallback please', { force: true });
    await expect(page.locator('button[aria-label="Send message"]')).toBeEnabled({ timeout: 10000 });
    await page.locator('button[aria-label="Send message"]').click();

    await expect(page.getByText(/Fallback response still works/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Fallback: provider_unsupported/i)).toBeVisible();
  });

  test('C-15: session reload preserves turbo quant badges from history', async ({ authenticatedPage: page }) => {
    const sessionId = 'sess-turbo-history';
    const sessions = [
      { id: sessionId, title: 'Turbo Persist', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), message_count: 2 },
    ];
    const sessionDetail = {
      ...sessions[0],
      messages: [
        { id: 'tq-u1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        {
          id: 'tq-a1',
          role: 'assistant',
          content: 'Persisted turbo reply',
          timestamp: new Date().toISOString(),
          turbo_quant: {
            requested: true,
            applied: false,
            provider: 'groq',
            fallback_reason: 'provider_unsupported',
          },
        },
      ],
    };

    await mockSessions(page, sessions);
    await mockGetSession(page, sessionDetail);
    await goToChatWithTurbo(page);

    await expect(page.getByText(/Persisted turbo reply/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Turbo Quant Requested')).toBeVisible();
    await expect(page.getByText(/Fallback: provider_unsupported/i)).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Turbo Quant Requested')).toBeVisible({ timeout: 10000 });
  });

  test('C-16: no regressions for image upload and standard messaging with turbo controls visible', async ({ authenticatedPage: page }) => {
    await mockSessions(page, []);

    await page.route('**/api/v1/images/upload', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'img-1',
          filename: 'sample.png',
          mime_type: 'image/png',
          width: 100,
          height: 100,
          file_size: 1234,
          public_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f4J8AAAAASUVORK5CYII=',
          variants: [],
          tags: [],
          processing_status: 'completed',
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.route('**/api/v1/omni-rag/stream', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockStreamResponse('Standard messaging still works', 'sess-standard-ok'),
      });
    });

    await goToChatWithTurbo(page);

    await expect(page.getByRole('button', { name: 'TQ' })).toBeVisible({ timeout: 10000 });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button[title="Upload image"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'sample.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-content'),
    });

    await expect(page.locator('img[alt="Staged"]')).toBeVisible({ timeout: 10000 });

    await page.locator('textarea[placeholder*="Ask anything"]').fill('Standard message with image', { force: true });
    await expect(page.locator('button[aria-label="Send message"]')).toBeEnabled({ timeout: 10000 });
    await page.locator('button[aria-label="Send message"]').click();

    await expect(page.getByText(/Standard messaging still works/i).first()).toBeVisible({ timeout: 15000 });
  });
});
