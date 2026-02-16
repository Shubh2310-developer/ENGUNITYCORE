import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { authService } from '../auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const server = setupServer(
    // Login handler
    http.post(`${API}/auth/login`, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        if (params.get('username') === 'valid@test.com' && params.get('password') === 'correct') {
            return HttpResponse.json({ access_token: 'mock-jwt-token', token_type: 'bearer' });
        }
        return HttpResponse.json({ detail: 'Incorrect email or password' }, { status: 401 });
    }),

    // Register handler
    http.post(`${API}/auth/register`, async ({ request }) => {
        const body = await request.json() as any;
        if (body.email === 'existing@test.com') {
            return HttpResponse.json(
                { detail: 'The user with this username already exists in the system.' },
                { status: 400 }
            );
        }
        return HttpResponse.json({ id: 1, email: body.email, role: 'user', is_active: true });
    }),

    // Get Me handler
    http.get(`${API}/auth/me`, ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer valid-token') {
            return HttpResponse.json({ id: 1, email: 'me@test.com', role: 'user', is_active: true });
        }
        return HttpResponse.json({ detail: 'Not authenticated' }, { status: 403 });
    })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('authService integration', () => {
    it('login returns token on valid credentials', async () => {
        const result = await authService.login('valid@test.com', 'correct');
        expect(result.access_token).toBe('mock-jwt-token');
    });

    it('login throws on invalid credentials', async () => {
        await expect(authService.login('bad@test.com', 'wrong'))
            .rejects.toThrow('Incorrect email or password');
    });

    it('register succeeds for new user', async () => {
        const result = await authService.register('new@test.com', 'Password1!');
        expect(result.email).toBe('new@test.com');
    });

    it('register fails for existing user', async () => {
        await expect(authService.register('existing@test.com', 'pass'))
            .rejects.toThrow('already exists');
    });

    it('getMe returns user data with valid token', async () => {
        const result = await authService.getMe('valid-token');
        expect(result.email).toBe('me@test.com');
    });

    it('getMe throws with invalid token', async () => {
        await expect(authService.getMe('expired-token'))
            .rejects.toThrow();
    });
});
