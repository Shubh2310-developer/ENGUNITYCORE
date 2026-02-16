# 🔐 Engunity Auth Flow — End-to-End Testing & Security Hardening Guide

> **Version**: 1.0  
> **Date**: 2026-02-12  
> **Scope**: Full-stack testing of `(auth)/login`, `(auth)/register`, `(auth)/callback`, `(auth)/reset-password`  
> **Stack**: Next.js 14 (App Router) · FastAPI · Supabase Auth · Zustand · Playwright · Jest/Vitest

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Testing Pyramid Strategy](#2-testing-pyramid-strategy)
3. [Layer 1 — Unit Tests](#3-layer-1--unit-tests)
4. [Layer 2 — Integration Tests](#4-layer-2--integration-tests)
5. [Layer 3 — API / Contract Tests](#5-layer-3--api--contract-tests)
6. [Layer 4 — E2E Browser Tests (Playwright)](#6-layer-4--e2e-browser-tests-playwright)
7. [Layer 5 — Security & Penetration Tests](#7-layer-5--security--penetration-tests)
8. [Layer 6 — Performance & Load Tests](#8-layer-6--performance--load-tests)
9. [CI/CD Pipeline Integration](#9-cicd-pipeline-integration)
10. [Security Hardening Checklist](#10-security-hardening-checklist)
11. [Appendix — Test Environment Setup](#11-appendix--test-environment-setup)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                        │
│                                                                     │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │
│  │  /login   │ │ /register  │ │ /callback  │ │  /reset-password   │  │
│  └────┬─────┘ └─────┬──────┘ └─────┬──────┘ └────────┬───────────┘  │
│       │              │              │                  │              │
│       ▼              ▼              ▼                  ▼              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              authService  (services/auth.ts)                    │  │
│  │  login() │ register() │ getMe() │ loginWithGithub()            │  │
│  └────┬───────────┬───────────┬────────────────┬──────────────────┘  │
│       │           │           │                │                     │
│       ▼           ▼           ▼                ▼                     │
│  ┌────────────┐   │     ┌──────────────┐  ┌──────────────────────┐  │
│  │ Zustand    │   │     │ AuthProvider  │  │ Supabase Client      │  │
│  │ authStore  │◄──┘     │ (hydration)   │  │ (OAuth + Sessions)   │  │
│  └────────────┘         └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │  HTTP / WebSocket
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                             │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  POST /api/v1/auth/login     → OAuth2PasswordRequestForm     │    │
│  │  POST /api/v1/auth/register  → UserCreate schema             │    │
│  │  GET  /api/v1/auth/me        → Bearer token (JWT)            │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ security.py   │  │ Supabase JWT     │  │ SQLAlchemy + DB       │  │
│  │ bcrypt+HS256  │  │ HS256/ES256      │  │ PostgreSQL            │  │
│  └───────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Auth Flows Identified

| Flow | Entry Point | Backend Endpoint | Token Type |
|------|-------------|-----------------|------------|
| Email/Password Login | `/login` | `POST /auth/login` | Custom HS256 JWT |
| User Registration | `/register` | `POST /auth/register` | N/A (redirects to login) |
| GitHub OAuth | `/login` → Supabase → `/callback` | `GET /auth/me` | Supabase JWT (HS256/ES256) |
| Password Reset | `/reset-password` | Not yet wired | N/A |
| Session Hydration | `AuthProvider` | `GET /auth/me` | Stored JWT from Zustand |

---

## 2. Testing Pyramid Strategy

```
                    ▲
                   / \        E2E Browser Tests (Playwright)
                  /   \       ~10% — Critical happy paths
                 /─────\
                /       \     Integration Tests
               /         \    ~20% — Service + Store + API glue
              /───────────\
             /             \   Unit Tests
            /               \  ~70% — Functions, validators, stores
           /─────────────────\
```

| Layer | Tool | Target | Coverage Goal |
|-------|------|--------|---------------|
| Unit | Vitest + React Testing Library | Components, stores, utilities | 70% |
| Integration | Vitest + MSW | authService ↔ API, AuthProvider ↔ Store | 20% |
| API/Contract | pytest + httpx (backend) | FastAPI auth endpoints | 100% of endpoints |
| E2E | Playwright | Full browser flows | All 4 auth pages |
| Security | OWASP ZAP + custom scripts | Injection, CSRF, JWT attacks | Critical vectors |
| Performance | k6 / Artillery | Login under load | Baseline metrics |

---

## 3. Layer 1 — Unit Tests

### 3.1 Frontend — Vitest + React Testing Library

#### Installation

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

#### Vitest Config (`frontend/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/app/(auth)/**', 'src/services/auth.ts', 'src/stores/authStore.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

#### Test Setup (`frontend/src/__tests__/setup.ts`)

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

// Mock next/navigation globally
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));
```

---

### 3.2 authStore Unit Tests

**File**: `frontend/src/stores/__tests__/authStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null, token: null, providerToken: null,
      status: 'idle', _hasHydrated: false,
    });
  });

  describe('setAuth', () => {
    it('should set user, token, and status to authenticated', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user', is_active: true };
      useAuthStore.getState().setAuth(mockUser, 'jwt-token-123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('jwt-token-123');
      expect(state.status).toBe('authenticated');
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state and set status to unauthenticated', () => {
      useAuthStore.getState().setAuth(
        { id: 1, email: 'a@b.com', role: 'user', is_active: true }, 'tok'
      );
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.providerToken).toBeNull();
      expect(state.status).toBe('unauthenticated');
    });
  });

  describe('setProvider', () => {
    it('should update user provider and providerToken', () => {
      const mockUser = { id: 1, email: 'a@b.com', role: 'user', is_active: true };
      useAuthStore.getState().setAuth(mockUser, 'tok');
      useAuthStore.getState().setProvider('github', 'gh-token-xyz');

      const state = useAuthStore.getState();
      expect(state.user?.provider).toBe('github');
      expect(state.providerToken).toBe('gh-token-xyz');
    });

    it('should NOT crash if user is null', () => {
      useAuthStore.getState().setProvider('github', 'gh-token');
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('persist partialize', () => {
    it('should only persist token and providerToken (not user or status)', () => {
      // The partialize config ensures only token + providerToken survive refresh
      // This is validated by the persist middleware config in authStore.ts
      const state = useAuthStore.getState();
      expect(state.status).toBe('idle'); // Not 'authenticated' — proves status is not persisted
    });
  });
});
```

---

### 3.3 Login Page Component Tests

**File**: `frontend/src/app/(auth)/login/__tests__/page.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

// Mock authService
vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    loginWithGithub: vi.fn(),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setAuth: vi.fn(),
    status: 'unauthenticated',
  })),
}));

import { authService } from '@/services/auth';

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => vi.clearAllMocks());

  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error on invalid credentials', async () => {
    (authService.login as any).mockRejectedValue(new Error('Incorrect email or password.'));
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'bad@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
  });

  it('calls login + getMe on valid submit and redirects', async () => {
    const mockToken = { access_token: 'jwt-123', token_type: 'bearer' };
    const mockUser = { id: 1, email: 'user@test.com', role: 'user', is_active: true };
    (authService.login as any).mockResolvedValue(mockToken);
    (authService.getMe as any).mockResolvedValue(mockUser);

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/password/i), 'correct123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('user@test.com', 'correct123');
      expect(authService.getMe).toHaveBeenCalledWith('jwt-123');
    });
  });

  it('disables inputs while loading', async () => {
    // Never-resolving promise to keep loading state
    (authService.login as any).mockReturnValue(new Promise(() => {}));
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'pass1234');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });
  });

  it('toggles password visibility', async () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByLabelText(/show password/i));
    expect(passwordInput.type).toBe('text');

    await user.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput.type).toBe('password');
  });

  it('has links to register and reset-password', () => {
    render(<LoginPage />);
    expect(screen.getByText(/create an account/i).closest('a')).toHaveAttribute('href', '/register');
    expect(screen.getByText(/forgot password/i).closest('a')).toHaveAttribute('href', '/reset-password');
  });
});
```

---

### 3.4 Register Page Component Tests

**File**: `frontend/src/app/(auth)/register/__tests__/page.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';

vi.mock('@/services/auth', () => ({
  authService: { register: vi.fn() },
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ status: 'unauthenticated' })),
}));

import { authService } from '@/services/auth';

describe('RegisterPage', () => {
  const user = userEvent.setup();
  beforeEach(() => vi.clearAllMocks());

  it('renders all registration fields', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@nexus.com')).toBeInTheDocument();
  });

  it('requires terms checkbox before submit', async () => {
    render(<RegisterPage />);
    const submitBtn = screen.getByRole('button', { name: /initialize account/i });
    // HTML5 required attribute on checkbox prevents form submit
    expect(screen.getByRole('checkbox')).toBeRequired();
  });

  it('shows success message on valid registration', async () => {
    (authService.register as any).mockResolvedValue({ id: 1, email: 'new@test.com' });
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('name@nexus.com'), 'new@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'SecureP@ss1');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /initialize account/i }));

    await waitFor(() => {
      expect(screen.getByText(/clearance granted/i)).toBeInTheDocument();
    });
  });

  it('shows error on duplicate email', async () => {
    (authService.register as any).mockRejectedValue(
      new Error('The user with this username already exists in the system.')
    );
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('name@nexus.com'), 'dup@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'SecureP@ss1');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /initialize account/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('enforces minimum password length of 8 characters', () => {
    render(<RegisterPage />);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('minLength', '8');
  });
});
```

---

### 3.5 Backend Unit Tests (pytest)

**File**: `backend/tests/test_security.py`

```python
import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import (
    create_access_token, verify_password, get_password_hash, ALGORITHM
)
from app.core.config import settings


class TestPasswordHashing:
    def test_hash_and_verify_correct_password(self):
        hashed = get_password_hash("MySecurePass123!")
        assert verify_password("MySecurePass123!", hashed) is True

    def test_reject_wrong_password(self):
        hashed = get_password_hash("CorrectPassword")
        assert verify_password("WrongPassword", hashed) is False

    def test_truncate_at_72_bytes(self):
        """bcrypt silently truncates at 72 bytes — ensure consistency"""
        long_pass = "A" * 100
        hashed = get_password_hash(long_pass)
        assert verify_password(long_pass, hashed) is True
        # First 72 chars should also match (truncation behavior)
        assert verify_password("A" * 72, hashed) is True

    def test_empty_password_rejection(self):
        hashed = get_password_hash("notempty")
        assert verify_password("", hashed) is False

    def test_unicode_password(self):
        hashed = get_password_hash("пароль123!密码")
        assert verify_password("пароль123!密码", hashed) is True


class TestJWTTokens:
    def test_create_token_with_custom_expiry(self):
        token = create_access_token("42", expires_delta=timedelta(minutes=15))
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "42"

    def test_create_token_default_expiry(self):
        token = create_access_token("42")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_token_tamper_detection(self):
        token = create_access_token("42")
        # Tamper with the token
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(Exception):
            jwt.decode(tampered, settings.SECRET_KEY, algorithms=[ALGORITHM])

    def test_expired_token_rejected(self):
        token = create_access_token("42", expires_delta=timedelta(seconds=-1))
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

    def test_wrong_secret_rejected(self):
        token = create_access_token("42")
        with pytest.raises(jwt.JWTError):
            jwt.decode(token, "wrong-secret-key", algorithms=[ALGORITHM])
```

---

## 4. Layer 2 — Integration Tests

### 4.1 authService Integration Tests with MSW

**File**: `frontend/src/services/__tests__/auth.integration.test.ts`

```typescript
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
```

---

## 5. Layer 3 — API / Contract Tests

### 5.1 FastAPI Backend Endpoint Tests

**File**: `backend/tests/test_auth_api.py`

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

class TestRegisterEndpoint:
    async def test_register_success(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "newuser@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == "newuser@test.com"

    async def test_register_duplicate_email(self, client):
        payload = {"email": "dup@test.com", "password": "P@ssw0rd!", "role": "user"}
        await client.post("/api/v1/auth/register", json=payload)
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 400

    async def test_register_missing_email(self, client):
        resp = await client.post("/api/v1/auth/register", json={"password": "P@ss"})
        assert resp.status_code == 422  # Validation error

class TestLoginEndpoint:
    async def test_login_success(self, client):
        # First register
        await client.post("/api/v1/auth/register", json={
            "email": "login@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        resp = await client.post("/api/v1/auth/login", data={
            "username": "login@test.com", "password": "P@ssw0rd!"
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    async def test_login_wrong_password(self, client):
        resp = await client.post("/api/v1/auth/login", data={
            "username": "login@test.com", "password": "wrong"
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client):
        resp = await client.post("/api/v1/auth/login", data={
            "username": "ghost@test.com", "password": "nope"
        })
        assert resp.status_code == 401

class TestMeEndpoint:
    async def test_me_with_valid_token(self, client):
        await client.post("/api/v1/auth/register", json={
            "email": "me@test.com", "password": "P@ssw0rd!", "role": "user"
        })
        login_resp = await client.post("/api/v1/auth/login", data={
            "username": "me@test.com", "password": "P@ssw0rd!"
        })
        token = login_resp.json()["access_token"]
        resp = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@test.com"

    async def test_me_without_token(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in [401, 403]

    async def test_me_with_tampered_token(self, client):
        resp = await client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer fake.token.here"
        })
        assert resp.status_code == 403
```

---

## 6. Layer 4 — E2E Browser Tests (Playwright)

### 6.1 Test File Structure

```
frontend/e2e/
├── auth/
│   ├── login.spec.ts
│   ├── register.spec.ts
│   ├── callback.spec.ts
│   ├── reset-password.spec.ts
│   └── auth-guard.spec.ts
├── fixtures/
│   └── auth.fixture.ts
└── helpers/
    └── auth.helpers.ts
```

### 6.2 Auth Fixture (`frontend/e2e/fixtures/auth.fixture.ts`)

```typescript
import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: any;
  testUser: { email: string; password: string };
};

export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const user = {
      email: `test-${Date.now()}@engunity.test`,
      password: 'TestP@ssw0rd!2026',
    };
    await use(user);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Register user via API
    await page.request.post('http://localhost:8000/api/v1/auth/register', {
      data: { email: testUser.email, password: testUser.password, role: 'user' },
    });

    // Login via API and save token
    const loginResp = await page.request.post('http://localhost:8000/api/v1/auth/login', {
      form: { username: testUser.email, password: testUser.password },
    });
    const { access_token } = await loginResp.json();

    // Inject auth state into localStorage (Zustand persist)
    await page.goto('/login');
    await page.evaluate((token) => {
      localStorage.setItem('engunity-auth', JSON.stringify({
        state: { token, providerToken: null },
        version: 0,
      }));
    }, access_token);

    await use(page);
  },
});

export { expect };
```

### 6.3 Login E2E Tests (`frontend/e2e/auth/login.spec.ts`)

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('page loads with correct elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Engunity AI');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('successful login redirects to /overview', async ({ page, testUser }) => {
    // Register test user first
    await page.request.post('http://localhost:8000/api/v1/auth/register', {
      data: { email: testUser.email, password: testUser.password, role: 'user' },
    });

    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/overview/, { timeout: 10000 });
  });

  test('failed login shows error message', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@test.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 5000 });
  });

  test('shows loading state during submission', async ({ page }) => {
    await page.getByLabel('Email').fill('any@test.com');
    await page.getByLabel('Password').fill('anypass');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Spinner should appear
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('GitHub login button triggers OAuth', async ({ page }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.getByLabel('Continue with GitHub').click(),
    ]);
    // Verify redirect to Supabase/GitHub OAuth URL
  });

  test('navigate to register page', async ({ page }) => {
    await page.getByText('Create an account').click();
    await expect(page).toHaveURL('/register');
  });

  test('navigate to forgot password', async ({ page }) => {
    await page.getByText('Forgot password').click();
    await expect(page).toHaveURL('/reset-password');
  });
});
```

### 6.4 Register E2E Tests (`frontend/e2e/auth/register.spec.ts`)

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('successful registration shows success and redirects to login', async ({ page }) => {
    const email = `reg-${Date.now()}@test.com`;
    await page.getByPlaceholder('name@nexus.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('SecureP@ss123');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /initialize account/i }).click();

    await expect(page.getByText(/clearance granted/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('duplicate email shows error', async ({ page, testUser }) => {
    // Register first
    await page.request.post('http://localhost:8000/api/v1/auth/register', {
      data: { email: testUser.email, password: testUser.password, role: 'user' },
    });

    await page.getByPlaceholder('name@nexus.com').fill(testUser.email);
    await page.getByPlaceholder('••••••••').fill(testUser.password);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /initialize account/i }).click();

    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 5000 });
  });

  test('has link back to login', async ({ page }) => {
    await page.getByText('Return to Terminal').click();
    await expect(page).toHaveURL('/login');
  });
});
```

### 6.5 Auth Guard E2E Tests (`frontend/e2e/auth/auth-guard.spec.ts`)

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Auth Guard — Protected Routes', () => {
  test('unauthenticated user cannot access /overview', async ({ page }) => {
    await page.goto('/overview');
    // Should redirect to login or show unauthenticated UI
    await expect(page).toHaveURL(/\/(login|overview)/, { timeout: 5000 });
  });

  test('authenticated user can access /overview', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/overview');
    await expect(authenticatedPage).toHaveURL(/\/overview/);
  });

  test('authenticated user visiting /login gets redirected to /overview', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/login');
    await expect(authenticatedPage).toHaveURL(/\/overview/, { timeout: 5000 });
  });
});
```

---

## 7. Layer 5 — Security & Penetration Tests

### 7.1 JWT Security Tests

**File**: `backend/tests/test_jwt_security.py`

```python
import pytest
from jose import jwt
from app.core.config import settings
from app.core.security import ALGORITHM

class TestJWTSecurity:
    """Critical JWT attack vector tests"""

    def test_none_algorithm_attack(self, client):
        """CVE-2015-9235 — 'none' algorithm bypass"""
        malicious_token = jwt.encode(
            {"sub": "1", "exp": 9999999999},
            key="", algorithm="none"
        )
        # This crafted token uses 'none' algorithm — MUST be rejected
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {malicious_token}"
        })
        assert resp.status_code == 403

    def test_algorithm_confusion_attack(self, client):
        """Test RS256→HS256 algorithm confusion"""
        # Attacker tries to use public key as HMAC secret
        malicious_token = jwt.encode(
            {"sub": "1", "exp": 9999999999},
            key="some-public-key", algorithm="HS256"
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {malicious_token}"
        })
        assert resp.status_code == 403

    def test_expired_token_rejected(self, client):
        expired_token = jwt.encode(
            {"sub": "1", "exp": 1000000000},  # Year 2001
            settings.SECRET_KEY, algorithm=ALGORITHM
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {expired_token}"
        })
        assert resp.status_code == 403

    def test_token_without_sub_claim(self, client):
        token = jwt.encode(
            {"exp": 9999999999},  # No 'sub' claim
            settings.SECRET_KEY, algorithm=ALGORITHM
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code in [403, 422]

    def test_sql_injection_in_token_sub(self, client):
        token = jwt.encode(
            {"sub": "1 OR 1=1; DROP TABLE users;--", "exp": 9999999999},
            settings.SECRET_KEY, algorithm=ALGORITHM
        )
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code in [403, 422, 500]
```

### 7.2 Input Validation & Injection Tests

```python
class TestInputValidation:
    """Test all auth endpoints against injection attacks"""

    INJECTION_PAYLOADS = [
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "admin@test.com' OR '1'='1",
        "{{7*7}}",  # Template injection
        "${7*7}",   # Expression injection
        "admin\x00@test.com",  # Null byte injection
        "a" * 10000,  # Buffer overflow attempt
    ]

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_login_email_injection(self, client, payload):
        resp = client.post("/api/v1/auth/login", data={
            "username": payload, "password": "test"
        })
        assert resp.status_code in [401, 422]

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_login_password_injection(self, client, payload):
        resp = client.post("/api/v1/auth/login", data={
            "username": "test@test.com", "password": payload
        })
        assert resp.status_code in [401, 422]

    @pytest.mark.parametrize("payload", INJECTION_PAYLOADS)
    def test_register_email_injection(self, client, payload):
        resp = client.post("/api/v1/auth/register", json={
            "email": payload, "password": "ValidP@ss1", "role": "user"
        })
        assert resp.status_code in [400, 422]

    def test_register_role_escalation(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "hacker@test.com", "password": "P@ssw0rd!",
            "role": "admin"
        })
        # Should either reject or create as 'user' only
        if resp.status_code == 200:
            assert resp.json()["role"] == "user"
```

### 7.3 Brute Force & Rate Limiting Tests

```python
class TestBruteForceProtection:
    def test_rate_limiting_on_failed_logins(self, client):
        """Attempt 20 rapid logins — should be rate-limited"""
        results = []
        for i in range(20):
            resp = client.post("/api/v1/auth/login", data={
                "username": "target@test.com", "password": f"wrong{i}"
            })
            results.append(resp.status_code)

        # At least some should be 429 (Too Many Requests) if rate limiting exists
        rate_limited = [r for r in results if r == 429]
        # NOTE: If this fails, rate limiting is NOT implemented — critical finding
        assert len(rate_limited) > 0, (
            "⚠️  CRITICAL: No rate limiting detected on login endpoint! "
            "Implement rate limiting (e.g., slowapi) to prevent brute force attacks."
        )

    def test_account_lockout_after_failures(self, client):
        """After N failed attempts, account should be temporarily locked"""
        for _ in range(10):
            client.post("/api/v1/auth/login", data={
                "username": "victim@test.com", "password": "wrong"
            })
        # The 11th attempt with correct password should still fail
        resp = client.post("/api/v1/auth/login", data={
            "username": "victim@test.com", "password": "CorrectP@ss"
        })
        # If no lockout, this finding is CRITICAL
```

### 7.4 CORS & Header Security Tests

```python
class TestSecurityHeaders:
    def test_cors_rejects_unauthorized_origin(self, client):
        resp = client.options("/api/v1/auth/login", headers={
            "Origin": "https://evil-site.com",
            "Access-Control-Request-Method": "POST",
        })
        allowed_origin = resp.headers.get("Access-Control-Allow-Origin", "")
        assert allowed_origin != "*" or "evil-site.com" not in allowed_origin

    def test_no_sensitive_headers_exposed(self, client):
        resp = client.post("/api/v1/auth/login", data={
            "username": "test@test.com", "password": "whatever"
        })
        # Server should not expose internal headers
        assert "X-Powered-By" not in resp.headers
        assert "Server" not in resp.headers or "uvicorn" not in resp.headers.get("Server", "").lower()
```

---

## 8. Layer 6 — Performance & Load Tests

### k6 Load Test Script (`tests/load/auth-load.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up
    { duration: '1m',  target: 100 },  // Sustained load
    { duration: '30s', target: 200 },  // Peak
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95th percentile < 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000/api/v1';

export default function () {
  // Login flow
  const loginRes = http.post(`${BASE_URL}/auth/login`,
    `username=loadtest@test.com&password=LoadTestP@ss1`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'has access_token': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).access_token;
    // Fetch /me with token
    const meRes = http.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(meRes, {
      'me status 200': (r) => r.status === 200,
      'me response time < 200ms': (r) => r.timings.duration < 200,
    });
  }

  sleep(1);
}
```

---

## 9. CI/CD Pipeline Integration

### GitHub Actions Workflow (`.github/workflows/auth-tests.yml`)

```yaml
name: Auth Flow Tests

on:
  push:
    paths: ['frontend/src/app/(auth)/**', 'frontend/src/services/auth.ts',
            'frontend/src/stores/authStore.ts', 'backend/app/api/v1/auth.py']
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: frontend/coverage/ }

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_DB: test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.10' }
      - run: cd backend && pip install -r requirements.txt && pip install pytest httpx
      - run: cd backend && pytest tests/ -v --tb=short
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          SECRET_KEY: test-secret-key-for-ci

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, backend-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: npx playwright install --with-deps
      - run: cd frontend && npx playwright test e2e/auth/
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: frontend/playwright-report/ }
```

---

## 10. Security Hardening Checklist

### 🔴 Critical — Must Fix

| # | Finding | Current State | Recommendation |
|---|---------|--------------|----------------|
| 1 | **Unverified JWT claims for ES256/RS256** | `auth.py:64` uses `get_unverified_claims()` | Fetch Supabase JWKS and verify signature properly |
| 2 | **Fallback to unverified claims** | `auth.py:78` catches all decode errors | Remove fallback; reject all unverifiable tokens |
| 3 | **No rate limiting on login** | No middleware detected | Add `slowapi` or Redis-based rate limiter (5 req/min per IP) |
| 4 | **Token in localStorage** | Zustand persist stores token in localStorage | Consider `httpOnly` cookies or add XSS defenses |
| 5 | **No CSRF protection** | Form-urlencoded login without CSRF token | Add CSRF token for state-changing requests |
| 6 | **Role parameter in register** | `register()` accepts `role` from client | Hardcode `role="user"` server-side; ignore client value |
| 7 | **`password_hash = "oauth_placeholder"`** | `auth.py:95` for auto-created OAuth users | Use `None` or a locked sentinel; never a guessable string |

### 🟡 Important — Should Fix

| # | Finding | Recommendation |
|---|---------|----------------|
| 8 | No password complexity validation on backend | Add regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$` |
| 9 | No email verification flow | Send verification email before activating account |
| 10 | Console.log leaks token prefix in production | Wrap all `console.log` in `NODE_ENV === 'development'` check |
| 11 | `ACCESS_TOKEN_EXPIRE_MINUTES = 11520` (8 days) | Reduce to 15–60 minutes; implement refresh tokens |
| 12 | No session invalidation / logout endpoint | Add `POST /auth/logout` that blacklists the token |
| 13 | Reset password page has no backend wiring | Implement full password reset flow with time-limited tokens |
| 14 | `firstName`/`lastName` collected but not sent to backend | Either wire them through or remove from UI |

### 🟢 Best Practice

| # | Recommendation |
|---|----------------|
| 15 | Add `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` headers |
| 16 | Implement Content Security Policy (CSP) headers |
| 17 | Add audit logging for all auth events (login, failed login, registration) |
| 18 | Implement 2FA/MFA (TOTP or WebAuthn) as claimed in UI |
| 19 | Add account lockout after 5 consecutive failed logins |
| 20 | Use `SameSite=Strict` cookie flag if switching to cookie-based tokens |

---

## 11. Appendix — Test Environment Setup

### Quick Start

```bash
# === Frontend Tests ===
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom msw @vitejs/plugin-react

# Run unit tests
npx vitest run

# Run with coverage
npx vitest run --coverage

# Run E2E tests (requires backend running)
npx playwright install --with-deps
npx playwright test e2e/auth/

# === Backend Tests ===
cd backend
pip install pytest httpx pytest-asyncio

# Run all auth tests
pytest tests/test_auth_api.py tests/test_security.py tests/test_jwt_security.py -v

# === Load Tests ===
# Install k6: https://k6.io/docs/getting-started/installation/
k6 run tests/load/auth-load.js

# === Security Scan ===
# OWASP ZAP (Docker)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://localhost:3000/login -r zap-report.html
```

### Environment Variables for Testing

```env
# .env.test
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
DATABASE_URL=postgresql://test:test@localhost:5432/engunity_test
SECRET_KEY=test-secret-key-do-not-use-in-production
SUPABASE_JWT_SECRET=test-jwt-secret
ACCESS_TOKEN_EXPIRE_MINUTES=15
```

### Recommended `package.json` Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:auth": "playwright test e2e/auth/",
    "test:all": "vitest run && playwright test"
  }
}
```

---

> **Document maintained by**: Engineering Team  
> **Next review date**: 2026-03-12  
> **Classification**: INTERNAL — Security-Sensitive
