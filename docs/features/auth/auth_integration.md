# Authentication Integration Architecture: End-to-End Implementation Plan

This document outlines the research and design for integrating the authentication system into the Aura Pro platform, pivoting from the current design standards to a functional, secure engineering environment.

## 1. Current State Assessment
- **Backend:** Foundation is present in `backend/security/auth.py` (JWT/Bcrypt) and `backend/models/user.py`. Missing API routes and service orchestration.
- **Frontend:** Placeholder buttons exists in `Navbar.tsx` and `HeroSection.tsx`. An empty `(auth)` route group is available in `src/app/(auth)`.
- **Infrastructure:** Planned support for both traditional Email/Password and Web3/DID authentication.

## 2. Frontend Integration (Next.js)

### 2.1 Route Structure
Implement the following pages within the `src/app/(auth)` group:
- `/login`: The primary entry point.
- `/register`: For new account creation.
- `/reset-password`: Account recovery.

### 2.2 Auth State Management
Create a `useAuth` hook and `AuthProvider` using React Context (or a lightweight store like `zustand` which is already in dependencies) to:
- Track current user status.
- Handle token persistence (Secure HTTP-only cookies or encrypted LocalStorage for non-sensitive data).
- Manage login/logout actions.

### 2.3 Redirection Logic
- **Landing Page:** Update action buttons in `Navbar.tsx` and `HeroSection.tsx` to link to `/login`.
- **Protected Routes:** Use Next.js Middleware to intercept requests to `/(dashboard)` and redirect unauthenticated users to `/login`.
- **Post-Login:** Successful authentication should redirect users to the primary dashboard (`/research` or `/chat`).

## 3. Backend Integration (FastAPI)

### 3.1 Authentication Routes
Implement `backend/api/auth.py` with the following endpoints:
- `POST /auth/register`: Validate email uniqueness using `User` model, hash password using `get_password_hash`, and create user record.
- `POST /auth/login`: Verify credentials via `verify_password`, generate JWT using `create_access_token`, and return set-cookie header.
- `POST /auth/logout`: Invalidate session/clear cookies on the client side.
- `GET /auth/me`: Return current user profile based on JWT verification.

### 3.2 Security Middleware
- **JWT Verification:** Implement a dependency (`get_current_user`) in `backend/security/auth.py` that decodes the token and retrieves the `User` from the database.
- **CORS Configuration:** Ensure `main.py` is configured with `CORSMiddleware` to allow requests from the frontend domain with `allow_credentials=True`.

## 4. End-to-End Flow Diagram

1. **User Action:** User clicks "Get Started" or "Access Workspace" on the landing page.
2. **Frontend Routing:** Next.js `Link` component navigates to `/login`.
3. **Authentication:**
   - User enters credentials.
   - Frontend calls `POST /auth/login` via `axios` or `fetch`.
4. **Backend Processing:**
   - Backend validates user against Database via SQLAlchemy.
   - Backend issues a signed JWT using `python-jose`.
   - Backend returns JWT in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie to prevent XSS/CSRF.
5. **State Update:** Frontend updates `AuthContext` (React Context) or `zustand` store with user data.
6. **Redirection:** Frontend redirects user to `/(dashboard)/overview` or the last intended destination.

## 5. Blockchain / DID Integration Points
To align with the "Security by Provenance" vision:
- **Web3 Login:** Integrate `wagmi` and `viem` on the `/login` page to allow "Sign-In with Ethereum" (SIWE).
- **Identity Resolver:** Backend should use the existing `IdentityProvider` interface to verify the signature of the DID claim during the login process.

## 6. Aura Pro Design Standards Compliance
The login page must adhere to the professional, high-density standards:
- **Background:** Void (`#08090C`).
- **Forms:** `aura-card` styling with `rgba(255, 255, 255, 0.08)` borders.
- **Typography:** `Inter` for all interface elements.
- **Motion:** Smooth 300ms transitions for interactions.
