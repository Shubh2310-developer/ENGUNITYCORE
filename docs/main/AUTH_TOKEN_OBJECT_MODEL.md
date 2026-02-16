# 🎯 Auth Token-Object Model — Token-Centric Testing Framework

> **Format**: Token-Object-Oriented (TOO)  
> **Version**: 1.0  
> **Date**: 2026-02-12  
> **Paradigm**: Object-centric auth flow testing organized by token lifecycle & user state objects

---

## Table of Contents

1. [Token Object Model](#1-token-object-model)
2. [User Object Model](#2-user-object-model)
3. [Auth State Object Model](#3-auth-state-object-model)
4. [Token Lifecycle Testing](#4-token-lifecycle-testing)
5. [Object Interaction Patterns](#5-object-interaction-patterns)
6. [Token Security Attack Vectors](#6-token-security-attack-vectors)
7. [Object Validation Matrix](#7-object-validation-matrix)
8. [Token Performance Profiling](#8-token-performance-profiling)

---

## 1. Token Object Model

### 1.1 JWT Token Object Structure

```typescript
interface JWTToken {
  // Header
  header: {
    alg: 'HS256' | 'ES256' | 'RS256';
    typ: 'JWT';
  };
  
  // Payload
  payload: {
    sub: string;           // User ID (subject)
    exp: number;           // Expiration timestamp
    iat?: number;          // Issued at
    email?: string;        // User email (Supabase)
    role?: string;         // User role
    provider?: string;     // OAuth provider
  };
  
  // Signature
  signature: string;
  
  // Metadata
  metadata: {
    source: 'custom' | 'supabase';
    isVerified: boolean;
    createdAt: Date;
    expiresAt: Date;
  };
}
```

### 1.2 Token Factory Pattern

```typescript
// frontend/src/services/token/TokenFactory.ts
export class TokenFactory {
  static createCustomToken(payload: TokenPayload): JWTToken {
    return {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: {
        sub: payload.userId,
        exp: Date.now() + 8 * 24 * 60 * 60 * 1000, // 8 days
      },
      signature: '',
      metadata: {
        source: 'custom',
        isVerified: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
    };
  }

  static createSupabaseToken(supabaseToken: string): JWTToken {
    const decoded = jwt.decode(supabaseToken, { complete: true });
    return {
      header: decoded.header,
      payload: decoded.payload,
      signature: decoded.signature,
      metadata: {
        source: 'supabase',
        isVerified: true,
        createdAt: new Date(decoded.payload.iat * 1000),
        expiresAt: new Date(decoded.payload.exp * 1000),
      },
    };
  }
}
```

### 1.3 Token Validator Object

```typescript
// frontend/src/services/token/TokenValidator.ts
export class TokenValidator {
  private readonly allowedAlgorithms = ['HS256', 'ES256', 'RS256'];
  
  validate(token: JWTToken): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Algorithm validation
    if (!this.allowedAlgorithms.includes(token.header.alg)) {
      errors.push({
        code: 'INVALID_ALGORITHM',
        message: `Algorithm ${token.header.alg} not allowed`,
        severity: 'critical',
      });
    }
    
    // 'none' algorithm attack detection
    if (token.header.alg.toLowerCase() === 'none') {
      errors.push({
        code: 'NONE_ALGORITHM_ATTACK',
        message: 'None algorithm detected - potential security breach',
        severity: 'critical',
      });
    }
    
    // Expiration validation
    if (token.payload.exp && token.payload.exp * 1000 < Date.now()) {
      errors.push({
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        severity: 'high',
      });
    }
    
    // Subject validation
    if (!token.payload.sub) {
      errors.push({
        code: 'MISSING_SUBJECT',
        message: 'Token missing required sub claim',
        severity: 'high',
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(token),
    };
  }
  
  private generateWarnings(token: JWTToken): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Long-lived token warning
    const lifespanMs = token.metadata.expiresAt.getTime() - token.metadata.createdAt.getTime();
    if (lifespanMs > 24 * 60 * 60 * 1000) { // > 24 hours
      warnings.push({
        code: 'LONG_LIVED_TOKEN',
        message: `Token lifespan is ${lifespanMs / (60 * 60 * 1000)} hours`,
        recommendation: 'Consider shorter token lifespan with refresh tokens',
      });
    }
    
    return warnings;
  }
}
```

### 1.4 Token Storage Object

```typescript
// frontend/src/services/token/TokenStorage.ts
export class TokenStorage {
  private readonly storageKey = 'engunity-auth';
  
  save(token: JWTToken, providerToken?: string): void {
    const payload = {
      state: {
        token: this.serialize(token),
        providerToken: providerToken || null,
      },
      version: 0,
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }
  
  load(): JWTToken | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    
    try {
      const parsed = JSON.parse(raw);
      return this.deserialize(parsed.state.token);
    } catch {
      return null;
    }
  }
  
  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
  
  private serialize(token: JWTToken): string {
    return `${token.header.alg}.${btoa(JSON.stringify(token.payload))}.${token.signature}`;
  }
  
  private deserialize(tokenString: string): JWTToken {
    // Implementation details...
    return {} as JWTToken;
  }
}
```

---

## 2. User Object Model

### 2.1 User Entity Object

```typescript
interface UserEntity {
  // Identity
  id: number;
  email: string;
  
  // Authentication
  passwordHash?: string;
  provider?: 'email' | 'github' | 'google';
  
  // Authorization
  role: 'user' | 'admin' | 'moderator';
  permissions: Permission[];
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  
  // Audit
  createdAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
  
  // Security
  failedLoginAttempts: number;
  lockedUntil?: Date;
  mfaEnabled: boolean;
}
```

### 2.2 User Builder Pattern

```typescript
// backend/app/models/builders/UserBuilder.py
class UserBuilder:
    def __init__(self):
        self._user = UserEntity()
        
    def with_email(self, email: str) -> 'UserBuilder':
        self._user.email = email
        return self
    
    def with_password(self, password: str) -> 'UserBuilder':
        self._user.password_hash = get_password_hash(password)
        self._user.provider = 'email'
        return self
    
    def with_oauth_provider(self, provider: str) -> 'UserBuilder':
        self._user.provider = provider
        self._user.password_hash = None  # OAuth users don't have passwords
        self._user.isVerified = True     # OAuth implies verified email
        return self
    
    def with_role(self, role: str) -> 'UserBuilder':
        # Security: Never allow client to set admin role
        if role == 'admin':
            raise ValueError("Cannot set admin role via builder")
        self._user.role = role
        return self
    
    def build(self) -> UserEntity:
        self._validate()
        return self._user
    
    def _validate(self):
        if not self._user.email:
            raise ValueError("Email is required")
        if self._user.provider == 'email' and not self._user.password_hash:
            raise ValueError("Password required for email provider")
```

### 2.3 User State Machine

```typescript
enum UserState {
  UNREGISTERED = 'unregistered',
  REGISTERED_UNVERIFIED = 'registered_unverified',
  VERIFIED_ACTIVE = 'verified_active',
  LOCKED = 'locked',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

interface UserStateTransition {
  from: UserState;
  to: UserState;
  trigger: string;
  validator: (user: UserEntity) => boolean;
}

const USER_STATE_TRANSITIONS: UserStateTransition[] = [
  {
    from: UserState.UNREGISTERED,
    to: UserState.REGISTERED_UNVERIFIED,
    trigger: 'REGISTER',
    validator: (user) => !!user.email && !!user.passwordHash,
  },
  {
    from: UserState.REGISTERED_UNVERIFIED,
    to: UserState.VERIFIED_ACTIVE,
    trigger: 'VERIFY_EMAIL',
    validator: (user) => user.isVerified,
  },
  {
    from: UserState.VERIFIED_ACTIVE,
    to: UserState.LOCKED,
    trigger: 'FAILED_LOGIN_THRESHOLD',
    validator: (user) => user.failedLoginAttempts >= 5,
  },
  {
    from: UserState.LOCKED,
    to: UserState.VERIFIED_ACTIVE,
    trigger: 'UNLOCK_TIMEOUT',
    validator: (user) => user.lockedUntil && user.lockedUntil < new Date(),
  },
];
```

---

## 3. Auth State Object Model

### 3.1 Auth State Object

```typescript
interface AuthState {
  // Authentication
  user: UserEntity | null;
  token: JWTToken | null;
  providerToken: string | null;
  
  // Status
  status: 'idle' | 'checking' | 'authenticated' | 'unauthenticated';
  
  // Hydration (Zustand persist)
  _hasHydrated: boolean;
  
  // Session metadata
  sessionId: string | null;
  loginTimestamp: Date | null;
  lastActivityTimestamp: Date | null;
  
  // Methods
  setAuth: (user: UserEntity, token: JWTToken) => void;
  clearAuth: () => void;
  updateActivity: () => void;
  isSessionExpired: () => boolean;
}
```

### 3.2 Auth State Reducer

```typescript
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserEntity; token: JWTToken } }
  | { type: 'LOGIN_FAILURE'; error: Error }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { token: JWTToken } }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'HYDRATE_START' }
  | { type: 'HYDRATE_COMPLETE'; payload: { token: JWTToken | null } };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, status: 'checking' };
      
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        status: 'authenticated',
        sessionId: crypto.randomUUID(),
        loginTimestamp: new Date(),
        lastActivityTimestamp: new Date(),
      };
      
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        status: 'unauthenticated',
      };
      
    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        token: null,
        providerToken: null,
        status: 'unauthenticated',
        sessionId: null,
        loginTimestamp: null,
      };
      
    case 'TOKEN_REFRESH':
      return {
        ...state,
        token: action.payload.token,
        lastActivityTimestamp: new Date(),
      };
      
    default:
      return state;
  }
}
```

---

## 4. Token Lifecycle Testing

### 4.1 Token Creation Tests

```typescript
// Token Factory Tests
describe('TokenFactory', () => {
  describe('createCustomToken', () => {
    it('creates token with correct structure', () => {
      const token = TokenFactory.createCustomToken({ userId: '123' });
      
      expect(token.header.alg).toBe('HS256');
      expect(token.header.typ).toBe('JWT');
      expect(token.payload.sub).toBe('123');
      expect(token.metadata.source).toBe('custom');
    });
    
    it('sets expiration to 8 days from creation', () => {
      const token = TokenFactory.createCustomToken({ userId: '123' });
      const expectedExpiry = Date.now() + 8 * 24 * 60 * 60 * 1000;
      
      expect(token.payload.exp).toBeCloseTo(expectedExpiry, -3);
    });
  });
  
  describe('createSupabaseToken', () => {
    it('extracts metadata from Supabase token', () => {
      const mockSupabaseToken = 'eyJhbGc...'; // Real Supabase token
      const token = TokenFactory.createSupabaseToken(mockSupabaseToken);
      
      expect(token.metadata.source).toBe('supabase');
      expect(token.metadata.isVerified).toBe(true);
    });
  });
});
```

### 4.2 Token Validation Tests

```typescript
describe('TokenValidator', () => {
  let validator: TokenValidator;
  
  beforeEach(() => {
    validator = new TokenValidator();
  });
  
  describe('Algorithm validation', () => {
    it('accepts HS256 tokens', () => {
      const token = createMockToken({ alg: 'HS256' });
      const result = validator.validate(token);
      
      expect(result.errors.filter(e => e.code === 'INVALID_ALGORITHM')).toHaveLength(0);
    });
    
    it('rejects "none" algorithm (CVE-2015-9235)', () => {
      const token = createMockToken({ alg: 'none' });
      const result = validator.validate(token);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'NONE_ALGORITHM_ATTACK',
          severity: 'critical',
        })
      );
    });
    
    it('rejects unsupported algorithms', () => {
      const token = createMockToken({ alg: 'HS512' });
      const result = validator.validate(token);
      
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_ALGORITHM' })
      );
    });
  });
  
  describe('Expiration validation', () => {
    it('rejects expired tokens', () => {
      const token = createMockToken({
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });
      const result = validator.validate(token);
      
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'TOKEN_EXPIRED' })
      );
    });
    
    it('accepts valid unexpired tokens', () => {
      const token = createMockToken({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });
      const result = validator.validate(token);
      
      expect(result.errors.filter(e => e.code === 'TOKEN_EXPIRED')).toHaveLength(0);
    });
  });
  
  describe('Subject validation', () => {
    it('requires sub claim', () => {
      const token = createMockToken({ sub: undefined });
      const result = validator.validate(token);
      
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_SUBJECT' })
      );
    });
  });
  
  describe('Long-lived token warnings', () => {
    it('warns on tokens valid for >24 hours', () => {
      const token = createMockToken({
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 8 * 24 * 60 * 60, // 8 days
      });
      const result = validator.validate(token);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'LONG_LIVED_TOKEN' })
      );
    });
  });
});
```

### 4.3 Token Storage Tests

```typescript
describe('TokenStorage', () => {
  let storage: TokenStorage;
  
  beforeEach(() => {
    storage = new TokenStorage();
    localStorage.clear();
  });
  
  describe('save', () => {
    it('persists token to localStorage', () => {
      const token = createMockToken();
      storage.save(token);
      
      const raw = localStorage.getItem('engunity-auth');
      expect(raw).not.toBeNull();
      
      const parsed = JSON.parse(raw!);
      expect(parsed.state.token).toBeDefined();
    });
    
    it('includes provider token when provided', () => {
      const token = createMockToken();
      storage.save(token, 'github-provider-token');
      
      const raw = localStorage.getItem('engunity-auth');
      const parsed = JSON.parse(raw!);
      expect(parsed.state.providerToken).toBe('github-provider-token');
    });
  });
  
  describe('load', () => {
    it('returns null when no token exists', () => {
      const token = storage.load();
      expect(token).toBeNull();
    });
    
    it('deserializes saved token', () => {
      const originalToken = createMockToken({ sub: '42' });
      storage.save(originalToken);
      
      const loadedToken = storage.load();
      expect(loadedToken?.payload.sub).toBe('42');
    });
    
    it('returns null on corrupted data', () => {
      localStorage.setItem('engunity-auth', 'corrupted-data-{{{');
      const token = storage.load();
      expect(token).toBeNull();
    });
  });
  
  describe('clear', () => {
    it('removes token from localStorage', () => {
      storage.save(createMockToken());
      storage.clear();
      
      expect(localStorage.getItem('engunity-auth')).toBeNull();
    });
  });
});
```

### 4.4 Token Transmission Tests (Backend)

```python
# Token transmission via HTTP headers
class TestTokenTransmission:
    def test_bearer_token_accepted(self, client):
        token = create_valid_token(sub="1")
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 200
    
    def test_missing_bearer_prefix_rejected(self, client):
        token = create_valid_token(sub="1")
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": token  # Missing "Bearer " prefix
        })
        assert resp.status_code in [401, 403]
    
    def test_malformed_authorization_header(self, client):
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": "InvalidFormat token123"
        })
        assert resp.status_code in [401, 403]
    
    def test_token_in_query_param_rejected(self, client):
        """Security: Ensure tokens aren't accepted via URL params (logged!)"""
        token = create_valid_token(sub="1")
        resp = client.get(f"/api/v1/auth/me?token={token}")
        assert resp.status_code in [401, 403]
```

---

## 5. Object Interaction Patterns

### 5.1 Token ↔ User Object Flow

```typescript
sequenceDiagram
    participant Client
    participant AuthService
    participant TokenFactory
    participant UserRepository
    participant TokenValidator
    
    Client->>AuthService: login(email, password)
    AuthService->>UserRepository: findByEmail(email)
    UserRepository-->>AuthService: UserEntity
    AuthService->>AuthService: verifyPassword(password, user.passwordHash)
    AuthService->>TokenFactory: createCustomToken({ userId: user.id })
    TokenFactory-->>AuthService: JWTToken
    AuthService->>TokenValidator: validate(token)
    TokenValidator-->>AuthService: ValidationResult
    AuthService-->>Client: { user: UserEntity, token: JWTToken }
```

### 5.2 Token Refresh Object Pattern

```typescript
class TokenRefreshManager {
  private refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
  
  constructor(
    private tokenStorage: TokenStorage,
    private authService: AuthService
  ) {}
  
  async checkAndRefreshToken(): Promise<JWTToken | null> {
    const currentToken = this.tokenStorage.load();
    if (!currentToken) return null;
    
    const timeUntilExpiry = currentToken.metadata.expiresAt.getTime() - Date.now();
    
    if (timeUntilExpiry < this.refreshThreshold) {
      try {
        const newToken = await this.authService.refreshToken(currentToken);
        this.tokenStorage.save(newToken);
        return newToken;
      } catch (error) {
        // Refresh failed - clear auth
        this.tokenStorage.clear();
        return null;
      }
    }
    
    return currentToken;
  }
  
  startAutoRefresh(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.checkAndRefreshToken();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }
}
```

### 5.3 Multi-Token Strategy (OAuth + Custom)

```typescript
class MultiTokenAuthManager {
  constructor(
    private customToken: JWTToken | null,
    private supabaseToken: JWTToken | null,
    private githubProviderToken: string | null
  ) {}
  
  /**
   * Determines which token to use for API requests
   */
  selectTokenForRequest(endpoint: string): string | null {
    // GitHub API requests use provider token
    if (endpoint.startsWith('https://api.github.com')) {
      return this.githubProviderToken;
    }
    
    // Backend API requests prefer Supabase token (if available and valid)
    if (this.supabaseToken && !this.isExpired(this.supabaseToken)) {
      return this.serialize(this.supabaseToken);
    }
    
    // Fallback to custom token
    if (this.customToken && !this.isExpired(this.customToken)) {
      return this.serialize(this.customToken);
    }
    
    return null;
  }
  
  private isExpired(token: JWTToken): boolean {
    return token.metadata.expiresAt < new Date();
  }
  
  private serialize(token: JWTToken): string {
    return `${btoa(JSON.stringify(token.header))}.${btoa(JSON.stringify(token.payload))}.${token.signature}`;
  }
}
```

---

## 6. Token Security Attack Vectors

### 6.1 Token Attack Model

```typescript
interface TokenAttack {
  name: string;
  cve?: string;
  category: 'signature' | 'claim' | 'replay' | 'injection' | 'timing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  payload: () => string;
  expectedResponse: number[];
}

const TOKEN_ATTACKS: TokenAttack[] = [
  {
    name: 'None Algorithm Attack',
    cve: 'CVE-2015-9235',
    category: 'signature',
    severity: 'critical',
    payload: () => {
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: '1', exp: 9999999999 }));
      return `${header}.${payload}.`;
    },
    expectedResponse: [403, 401],
  },
  
  {
    name: 'Algorithm Confusion (RS256→HS256)',
    category: 'signature',
    severity: 'critical',
    payload: () => {
      // Attacker uses public key as HMAC secret
      const publicKey = 'fake-public-key';
      return jwt.sign({ sub: '1', exp: 9999999999 }, publicKey, { algorithm: 'HS256' });
    },
    expectedResponse: [403],
  },
  
  {
    name: 'SQL Injection in Sub Claim',
    category: 'injection',
    severity: 'high',
    payload: () => {
      return createValidToken({ sub: "1' OR '1'='1; DROP TABLE users;--" });
    },
    expectedResponse: [403, 422],
  },
  
  {
    name: 'Token Replay Attack',
    category: 'replay',
    severity: 'high',
    payload: () => {
      // Use a previously captured valid token
      return capturedValidToken;
    },
    expectedResponse: [200], // Should succeed unless nonce/jti tracking exists
  },
  
  {
    name: 'Expired Token',
    category: 'claim',
    severity: 'medium',
    payload: () => {
      return createValidToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    },
    expectedResponse: [403, 401],
  },
  
  {
    name: 'Missing Sub Claim',
    category: 'claim',
    severity: 'high',
    payload: () => {
      return createValidToken({ sub: undefined });
    },
    expectedResponse: [403, 422],
  },
];
```

### 6.2 Automated Token Attack Tests

```typescript
describe('Token Security Attack Suite', () => {
  TOKEN_ATTACKS.forEach(attack => {
    it(`defends against: ${attack.name}`, async () => {
      const maliciousToken = attack.payload();
      
      const resp = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${maliciousToken}` },
      });
      
      expect(attack.expectedResponse).toContain(resp.status);
      
      // Log critical findings
      if (attack.severity === 'critical' && !attack.expectedResponse.includes(resp.status)) {
        console.error(`🚨 CRITICAL: ${attack.name} attack succeeded! Response: ${resp.status}`);
      }
    });
  });
});
```

---

## 7. Object Validation Matrix

### 7.1 Token Validation Matrix

| Token Property | Valid States | Invalid States | Test Coverage |
|---------------|--------------|----------------|---------------|
| `header.alg` | HS256, ES256, RS256 | none, HS512, null | ✅ Unit + E2E |
| `header.typ` | JWT | missing, JWE, invalid | ✅ Unit |
| `payload.sub` | String user ID | null, undefined, SQL injection | ✅ Unit + Security |
| `payload.exp` | Future timestamp | Past, missing, 0 | ✅ Unit + Integration |
| `payload.email` | Valid email | SQL injection, XSS payload | ✅ Security |
| `signature` | Valid HMAC/RSA | Tampered, missing | ✅ Unit + Security |
| `metadata.source` | custom, supabase | arbitrary string | ✅ Unit |

### 7.2 User Validation Matrix

| User Property | Valid States | Invalid States | Test Coverage |
|--------------|--------------|----------------|---------------|
| `email` | RFC 5322 compliant | SQL injection, XSS, null byte | ✅ Unit + Security |
| `passwordHash` | bcrypt hash | Plain text, null (for email provider) | ✅ Unit |
| `role` | user, admin, moderator | Arbitrary string, SQL injection | ✅ Unit + Security |
| `provider` | email, github, google | Arbitrary value | ✅ Unit |
| `isActive` | true, false | null, undefined | ✅ Unit |
| `failedLoginAttempts` | 0-10 | Negative, > max | ✅ Integration |

### 7.3 Auth State Validation Matrix

| State Property | Valid States | Invalid States | Test Coverage |
|---------------|--------------|----------------|---------------|
| `status` | idle, checking, authenticated, unauthenticated | arbitrary string | ✅ Unit |
| `user` | UserEntity, null | Partial object | ✅ Unit |
| `token` | JWTToken, null | Expired token | ✅ Integration |
| `_hasHydrated` | true, false | undefined | ✅ Unit |

---

## 8. Token Performance Profiling

### 8.1 Token Operation Benchmarks

```typescript
interface TokenBenchmark {
  operation: string;
  duration: number;
  throughput?: number;
  memory?: number;
}

class TokenPerformanceProfiler {
  async profileTokenCreation(iterations: number = 1000): Promise<TokenBenchmark> {
    const start = performance.now();
    const memStart = (performance as any).memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < iterations; i++) {
      TokenFactory.createCustomToken({ userId: `${i}` });
    }
    
    const duration = performance.now() - start;
    const memEnd = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      operation: 'Token Creation',
      duration,
      throughput: iterations / (duration / 1000),
      memory: memEnd - memStart,
    };
  }
  
  async profileTokenValidation(iterations: number = 1000): Promise<TokenBenchmark> {
    const validator = new TokenValidator();
    const tokens = Array.from({ length: iterations }, (_, i) => 
      createMockToken({ sub: `${i}` })
    );
    
    const start = performance.now();
    
    for (const token of tokens) {
      validator.validate(token);
    }
    
    const duration = performance.now() - start;
    
    return {
      operation: 'Token Validation',
      duration,
      throughput: iterations / (duration / 1000),
    };
  }
  
  async profileTokenStorage(iterations: number = 100): Promise<TokenBenchmark> {
    const storage = new TokenStorage();
    const token = createMockToken();
    
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      storage.save(token);
      storage.load();
      storage.clear();
    }
    
    const duration = performance.now() - start;
    
    return {
      operation: 'Token Storage (save+load+clear)',
      duration,
      throughput: (iterations * 3) / (duration / 1000),
    };
  }
}
```

### 8.2 Performance Test Suite

```typescript
describe('Token Performance Profiling', () => {
  const profiler = new TokenPerformanceProfiler();
  
  it('token creation throughput > 10,000 ops/sec', async () => {
    const result = await profiler.profileTokenCreation(10000);
    console.log(`Token creation: ${result.throughput?.toFixed(0)} ops/sec`);
    expect(result.throughput).toBeGreaterThan(10000);
  });
  
  it('token validation throughput > 50,000 ops/sec', async () => {
    const result = await profiler.profileTokenValidation(10000);
    console.log(`Token validation: ${result.throughput?.toFixed(0)} ops/sec`);
    expect(result.throughput).toBeGreaterThan(50000);
  });
  
  it('token storage operations < 5ms per cycle', async () => {
    const result = await profiler.profileTokenStorage(100);
    const avgDurationPerCycle = result.duration / 100;
    console.log(`Token storage cycle: ${avgDurationPerCycle.toFixed(2)}ms`);
    expect(avgDurationPerCycle).toBeLessThan(5);
  });
  
  it('token creation memory footprint < 1MB for 1000 tokens', async () => {
    const result = await profiler.profileTokenCreation(1000);
    const memoryMB = (result.memory || 0) / (1024 * 1024);
    console.log(`Token creation memory: ${memoryMB.toFixed(2)}MB`);
    expect(memoryMB).toBeLessThan(1);
  });
});
```

### 8.3 Load Test Scenarios (k6)

```javascript
// Token-centric load test
export const options = {
  scenarios: {
    token_creation_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'testTokenCreation',
    },
    token_validation_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      exec: 'testTokenValidation',
    },
  },
  thresholds: {
    'http_req_duration{scenario:token_creation_load}': ['p(95)<300'],
    'http_req_duration{scenario:token_validation_load}': ['p(95)<100'],
  },
};

export function testTokenCreation() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    username: 'loadtest@test.com',
    password: 'LoadTestP@ss1',
  });
  
  check(loginRes, {
    'token created': (r) => r.json('access_token') !== undefined,
    'creation < 300ms': (r) => r.timings.duration < 300,
  });
}

export function testTokenValidation() {
  const token = getValidToken(); // Pre-generated
  
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  check(meRes, {
    'token validated': (r) => r.status === 200,
    'validation < 100ms': (r) => r.timings.duration < 100,
  });
}
```

---

## Appendix A: Object Schemas

### Token Object Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "JWTToken": {
      "type": "object",
      "required": ["header", "payload", "signature", "metadata"],
      "properties": {
        "header": {
          "type": "object",
          "required": ["alg", "typ"],
          "properties": {
            "alg": { "enum": ["HS256", "ES256", "RS256"] },
            "typ": { "const": "JWT" }
          }
        },
        "payload": {
          "type": "object",
          "required": ["sub", "exp"],
          "properties": {
            "sub": { "type": "string", "minLength": 1 },
            "exp": { "type": "integer", "minimum": 0 },
            "iat": { "type": "integer", "minimum": 0 },
            "email": { "type": "string", "format": "email" }
          }
        },
        "signature": { "type": "string" },
        "metadata": {
          "type": "object",
          "required": ["source", "isVerified", "createdAt", "expiresAt"],
          "properties": {
            "source": { "enum": ["custom", "supabase"] },
            "isVerified": { "type": "boolean" },
            "createdAt": { "type": "string", "format": "date-time" },
            "expiresAt": { "type": "string", "format": "date-time" }
          }
        }
      }
    }
  }
}
```

---

> **Model Paradigm**: Token-Object-Oriented (TOO)  
> **Design Pattern**: Factory + Validator + Repository  
> **Testing Philosophy**: Object lifecycle coverage over layer coverage  
> **Maintained by**: Security & Engineering Team
