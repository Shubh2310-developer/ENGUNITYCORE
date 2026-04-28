import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock authStore before importing chat service
vi.mock('@/stores/authStore', () => ({
    useAuthStore: {
        getState: () => ({ token: 'test-token-123', user: { email: 'test@test.com' } }),
    },
}));

// Mock image service to avoid import side-effects
vi.mock('@/services/image', () => ({
    ImageResponse: {},
}));

import { chatService } from '@/services/chat';

const API_URL = 'http://localhost:8000/api/v1';

describe('chatService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // -------------------------------------------------------
    // getSessions
    // -------------------------------------------------------
    describe('getSessions', () => {
        it('should fetch sessions with auth header', async () => {
            const mockSessions = [
                { id: 's1', title: 'Chat 1', created_at: '2026-01-01', updated_at: '2026-01-02', messages: [] },
                { id: 's2', title: 'Chat 2', created_at: '2026-01-01', updated_at: '2026-01-02', messages: [] },
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockSessions),
            });

            const result = await chatService.getSessions();

            expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chat/`, {
                method: 'GET',
                headers: { Authorization: 'Bearer test-token-123' },
            });
            expect(result).toEqual(mockSessions);
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                text: () => Promise.resolve('internal error'),
            });

            await expect(chatService.getSessions()).rejects.toThrow('Failed to fetch chat sessions');
        });
    });

    // -------------------------------------------------------
    // getSession
    // -------------------------------------------------------
    describe('getSession', () => {
        it('should fetch a specific session by ID', async () => {
            const mockSession = {
                id: 's1',
                title: 'Test Chat',
                created_at: '2026-01-01',
                updated_at: '2026-01-02',
                messages: [
                    { id: 'm1', role: 'user', content: 'Hello', timestamp: '2026-01-01T00:00:00Z' },
                    { id: 'm2', role: 'assistant', content: 'Hi there!', timestamp: '2026-01-01T00:00:01Z' },
                ],
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockSession),
            });

            const result = await chatService.getSession('s1');

            expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chat/s1`, {
                method: 'GET',
                headers: { Authorization: 'Bearer test-token-123' },
            });
            expect(result.messages).toHaveLength(2);
            expect(result.title).toBe('Test Chat');
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

            await expect(chatService.getSession('invalid')).rejects.toThrow('Failed to fetch chat session');
        });
    });

    // -------------------------------------------------------
    // createSession
    // -------------------------------------------------------
    describe('createSession', () => {
        it('should create a new session with title', async () => {
            const mockResponse = { id: 'new-session-1', title: 'New Chat' };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await chatService.createSession('New Chat');

            expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chat/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token-123',
                },
                body: JSON.stringify({ title: 'New Chat' }),
            });
            expect(result.id).toBe('new-session-1');
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

            await expect(chatService.createSession('Fail')).rejects.toThrow('Failed to create chat session');
        });
    });

    // -------------------------------------------------------
    // deleteSession
    // -------------------------------------------------------
    describe('deleteSession', () => {
        it('should send DELETE request with auth header', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            await chatService.deleteSession('s1');

            expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chat/s1`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer test-token-123' },
            });
        });

        it('should throw on non-ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

            await expect(chatService.deleteSession('s1')).rejects.toThrow('Failed to delete chat session');
        });
    });

    // -------------------------------------------------------
    // sendMessage
    // -------------------------------------------------------
    describe('sendMessage', () => {
        it('should POST message with correct payload', async () => {
            const mockResponse = { id: 'msg-1', role: 'assistant', content: 'Response' };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await chatService.sendMessage('Hello', 'session-1', ['img-url'], ['img-id']);

            expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token-123',
                },
                body: JSON.stringify({
                    content: 'Hello',
                    session_id: 'session-1',
                    image_urls: ['img-url'],
                    image_ids: ['img-id'],
                }),
            });
            expect(result.content).toBe('Response');
        });

        it('should throw on failed message send', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

            await expect(chatService.sendMessage('test')).rejects.toThrow('Failed to send message');
        });
    });

    // -------------------------------------------------------
    // streamMessage — SSE parsing
    // -------------------------------------------------------
    describe('streamMessage', () => {
        it('should parse SSE content events correctly', async () => {
            const chunks: string[] = [];
            const sseData =
                'data: {"type":"content","content":"Hello"}\n' +
                'data: {"type":"content","content":" World"}\n' +
                'data: {"type":"done","message_id":"m1","title":"Chat"}\n';

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(sseData));
                    controller.close();
                },
            });

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: stream,
            });

            let doneMessageId = '';
            let doneTitle = '';

            await chatService.streamMessage(
                'test',
                'session-1',
                undefined,
                undefined,
                (chunk) => chunks.push(chunk),
                undefined,
                (messageId, title) => {
                    doneMessageId = messageId;
                    doneTitle = title || '';
                },
                undefined
            );

            expect(chunks).toEqual(['Hello', ' World']);
            expect(doneMessageId).toBe('m1');
            expect(doneTitle).toBe('Chat');
        });

        it('should call onMetadata with session_id', async () => {
            const sseData = 'data: {"type":"metadata","session_id":"s1","strategy":"graph_rag"}\n';
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(sseData));
                    controller.close();
                },
            });

            global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream });

            let metadata: any = null;
            await chatService.streamMessage(
                'test', 's1', undefined, undefined,
                undefined,
                (m) => { metadata = m; },
                undefined,
                undefined
            );

            expect(metadata).toEqual({ type: 'metadata', session_id: 's1', strategy: 'graph_rag' });
        });

        it('should call onError on SSE error event', async () => {
            const sseData = 'data: {"type":"error","content":"Rate limit exceeded"}\n';
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(sseData));
                    controller.close();
                },
            });

            global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream });

            let errorMsg = '';
            await chatService.streamMessage(
                'test', undefined, undefined, undefined,
                undefined, undefined, undefined,
                (error) => { errorMsg = error; }
            );

            expect(errorMsg).toBe('Rate limit exceeded');
        });

        it('should call onError when fetch fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

            let errorMsg = '';
            await chatService.streamMessage(
                'test', undefined, undefined, undefined,
                undefined, undefined, undefined,
                (error) => { errorMsg = error; }
            );

            expect(errorMsg).toBe('Failed to start stream');
        });
    });
});
