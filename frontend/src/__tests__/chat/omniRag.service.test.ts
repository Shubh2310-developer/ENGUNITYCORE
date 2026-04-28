import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock authStore
vi.mock('@/stores/authStore', () => ({
    useAuthStore: {
        getState: () => ({ token: 'test-token-123', user: { email: 'test@test.com' } }),
    },
}));

// Mock axios
vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

import { omniRagService } from '@/services/omniRag';

const API_URL = 'http://localhost:8000/api/v1/omni-rag';

describe('omniRagService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------
    // query
    // -------------------------------------------------------
    describe('query', () => {
        it('should send POST with correct request body and auth', async () => {
            const mockResponse = {
                data: {
                    query: 'What is ML?',
                    response: 'Machine Learning is...',
                    strategy: 'vector_rag',
                    documents: [],
                    metadata: { complexity: 'simple' },
                    latency: 1.5,
                },
            };

            (axios.post as any).mockResolvedValue(mockResponse);

            const result = await omniRagService.query({
                query: 'What is ML?',
                strategy: 'vector_rag',
            });

            expect(axios.post).toHaveBeenCalledWith(
                `${API_URL}/query`,
                { query: 'What is ML?', strategy: 'vector_rag' },
                { headers: { Authorization: 'Bearer test-token-123' } }
            );
            expect(result.strategy).toBe('vector_rag');
        });
    });

    // -------------------------------------------------------
    // uploadDocument
    // -------------------------------------------------------
    describe('uploadDocument', () => {
        it('should upload file as FormData with auth header', async () => {
            const mockDoc = {
                data: { document_id: 'doc-1', filename: 'test.pdf', chunks: 12, status: 'indexed' },
            };

            (axios.post as any).mockResolvedValue(mockDoc);

            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
            const result = await omniRagService.uploadDocument(file, 'session-1');

            expect(axios.post).toHaveBeenCalled();
            const callArgs = (axios.post as any).mock.calls[0];
            expect(callArgs[0]).toBe(`${API_URL}/documents/upload`);

            // Verify FormData has the file and session_id
            const formData = callArgs[1] as FormData;
            expect(formData.get('file')).toBeTruthy();
            expect(formData.get('session_id')).toBe('session-1');

            expect(result.chunks).toBe(12);
        });

        it('should upload without session_id', async () => {
            (axios.post as any).mockResolvedValue({
                data: { document_id: 'doc-2', filename: 'test2.pdf', chunks: 5, status: 'indexed' },
            });

            const file = new File(['content'], 'test2.pdf', { type: 'application/pdf' });
            await omniRagService.uploadDocument(file);

            const formData = (axios.post as any).mock.calls[0][1] as FormData;
            expect(formData).toBeInstanceOf(FormData);
            expect(formData.has('session_id')).toBe(false);
        });
    });

    // -------------------------------------------------------
    // getCommunities
    // -------------------------------------------------------
    describe('getCommunities', () => {
        it('should return communities list', async () => {
            const mockCommunities = {
                data: {
                    communities: [
                        { community_id: 1, summary: 'ML concepts', entity_count: 5 },
                        { community_id: 2, summary: 'Web APIs', entity_count: 3 },
                    ],
                    total: 2,
                },
            };

            (axios.get as any).mockResolvedValue(mockCommunities);

            const result = await omniRagService.getCommunities();

            expect(axios.get).toHaveBeenCalledWith(`${API_URL}/graph/communities`, {
                headers: { Authorization: 'Bearer test-token-123' },
            });
            expect(result.communities).toHaveLength(2);
            expect(result.total).toBe(2);
        });
    });

    // -------------------------------------------------------
    // rebuildGraph
    // -------------------------------------------------------
    describe('rebuildGraph', () => {
        it('should POST to rebuild endpoint', async () => {
            (axios.post as any).mockResolvedValue({
                data: { status: 'started', message: 'Graph rebuild initiated' },
            });

            const result = await omniRagService.rebuildGraph();

            expect(axios.post).toHaveBeenCalledWith(
                `${API_URL}/graph/rebuild`,
                {},
                { headers: { Authorization: 'Bearer test-token-123' } }
            );
            expect(result.status).toBe('started');
        });
    });

    // -------------------------------------------------------
    // getStats
    // -------------------------------------------------------
    describe('getStats', () => {
        it('should return document and chunk counts', async () => {
            (axios.get as any).mockResolvedValue({
                data: { documents: 15, chunks: 450 },
            });

            const result = await omniRagService.getStats();

            expect(axios.get).toHaveBeenCalledWith(`${API_URL}/stats`, {
                headers: { Authorization: 'Bearer test-token-123' },
            });
            expect(result.documents).toBe(15);
            expect(result.chunks).toBe(450);
        });
    });

    // -------------------------------------------------------
    // streamQuery — SSE parsing
    // -------------------------------------------------------
    describe('streamQuery', () => {
        it('should serialize turbo_quant in stream request body', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: {"type":"done","message_id":"m1"}\n\n'));
                    controller.close();
                },
            });

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: stream,
            });

            await omniRagService.streamQuery(
                {
                    query: 'Turbo request',
                    turbo_quant: {
                        enabled: true,
                        mode: 'auto',
                        target: 'auto',
                        variant: 'prod',
                        bit_width: 4,
                    },
                },
                () => undefined
            );

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            expect(body.turbo_quant).toEqual({
                enabled: true,
                mode: 'auto',
                target: 'auto',
                variant: 'prod',
                bit_width: 4,
            });
        });

        it('should parse SSE events and call onEvent callback', async () => {
            const events: any[] = [];
            const sseData =
                'data: {"type":"metadata","strategy":"graph_rag","confidence":0.85}\n' +
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

            await omniRagService.streamQuery(
                { query: 'What is ML?' },
                (event) => events.push(event)
            );

            expect(events).toHaveLength(4);
            expect(events[0]).toEqual({ type: 'metadata', strategy: 'graph_rag', confidence: 0.85 });
            expect(events[1]).toEqual({ type: 'content', content: 'Hello' });
            expect(events[2]).toEqual({ type: 'content', content: ' World' });
            expect(events[3]).toEqual({ type: 'done', message_id: 'm1', title: 'Chat' });
        });

        it('should call onError on HTTP error', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
            });

            let errorMsg = '';
            await omniRagService.streamQuery(
                { query: 'test' },
                () => { },
                (error) => { errorMsg = error; }
            );

            expect(errorMsg).toContain('500');
        });

        it('should call onError on network failure', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            let errorMsg = '';
            await omniRagService.streamQuery(
                { query: 'test' },
                () => { },
                (error) => { errorMsg = error; }
            );

            expect(errorMsg).toBe('Network error');
        });

        it('should handle partial SSE lines in buffer correctly', async () => {
            const events: any[] = [];
            const encoder = new TextEncoder();

            // Simulate chunked response (line split across two chunks)
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: {"type":"con'));
                    controller.enqueue(encoder.encode('tent","content":"split"}\n'));
                    controller.close();
                },
            });

            global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream });

            await omniRagService.streamQuery(
                { query: 'test' },
                (event) => events.push(event)
            );

            expect(events).toHaveLength(1);
            expect(events[0]).toEqual({ type: 'content', content: 'split' });
        });

        it('should parse turbo_quant metadata payload', async () => {
            const events: any[] = [];
            const sseData =
                'data: {"type":"metadata","session_id":"sess-1","turbo_quant":{"requested":true,"applied":false,"provider":"groq","fallback_reason":"provider_unsupported"}}\n\n' +
                'data: {"type":"done","message_id":"m1"}\n\n';

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(sseData));
                    controller.close();
                },
            });

            global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream });

            await omniRagService.streamQuery(
                { query: 'test' },
                (event) => events.push(event)
            );

            expect(events[0].type).toBe('metadata');
            expect(events[0].turbo_quant).toEqual({
                requested: true,
                applied: false,
                provider: 'groq',
                fallback_reason: 'provider_unsupported',
            });
        });
    });
});
