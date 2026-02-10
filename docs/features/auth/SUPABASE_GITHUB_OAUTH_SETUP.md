# Supabase GitHub OAuth Setup Guide

## Overview

This guide will help you set up GitHub OAuth authentication using Supabase, enabling users to log in with their GitHub accounts and automatically access their repositories.

---

## Prerequisites

- ✅ GitHub account
- ✅ Supabase account (free tier works!)
- ✅ Your application running locally or deployed

---

## Step 1: Create Supabase Project

### 1.1 Sign up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or email

### 1.2 Create New Project
1. Click **"New Project"**
2. Choose an organization (or create one)
3. Fill in project details:
   - **Name:** `engunity` (or your app name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

### 1.3 Get Project Keys
Once created, go to **Settings** → **API**:
- Copy **Project URL** (e.g., `https://abcdefghijk.supabase.co`)
- Copy **anon/public** key
- Copy **service_role** key (keep this secret!)

---

## Step 2: Create GitHub OAuth App

### 2.1 Register OAuth Application
1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **"OAuth Apps"** → **"New OAuth App"**

### 2.2 Fill in Application Details
```
Application name: Engunity (or your app name)
Homepage URL: http://localhost:3000
                (or your production URL: https://yourdomain.com)

Authorization callback URL: 
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback

Application description: AI-powered repository analysis platform
```

**Important:** The callback URL format is:
```
https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
```
Get `YOUR_PROJECT_REF` from your Supabase project URL.

### 2.3 Generate Client Secret
1. Click **"Register application"**
2. You'll see your **Client ID** (looks like: `Iv1.a1b2c3d4e5f6g7h8`)
3. Click **"Generate a new client secret"**
4. Copy the **Client Secret** immediately (you won't see it again!)

---

## Step 3: Configure Supabase GitHub Provider

### 3.1 Enable GitHub Provider
1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** in the list
3. Toggle it **ON**

### 3.2 Add GitHub Credentials
```
Client ID: [paste from GitHub OAuth app]
Client Secret: [paste from GitHub OAuth app]
```

### 3.3 Configure Scopes (Optional)
Add these scopes for full functionality:
```
user:email,read:user,repo
```

### 3.4 Save Configuration
Click **"Save"**

---

## Step 4: Get Supabase JWT Secret

### 4.1 Navigate to Settings
1. In Supabase Dashboard: **Settings** → **API**
2. Scroll to **JWT Settings**
3. Copy the **JWT Secret** (looks like a long random string)

---

## Step 5: Configure Your Application

### 5.1 Update .env File
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-secret-never-share-this
SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

### 5.2 Update Frontend Environment Variables
Create/update `frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

---

## Step 6: Update Authentication Service

The auth service already has GitHub OAuth support! Verify it's configured:

### 6.1 Check Frontend Auth Service
File: `frontend/src/services/auth.ts`

```typescript
async loginWithGithub() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const callbackUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL || 
                       `${window.location.origin}/auth/callback`;

  window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(callbackUrl)}`;
}
```

### 6.2 Verify Callback Handler
File: `frontend/src/app/(auth)/callback/page.tsx`

This should already be implemented. It:
1. Receives the auth callback from Supabase
2. Extracts the JWT token
3. Stores user info and provider token
4. Redirects to the dashboard

---

## Step 7: Configure Database for OAuth Users

### 7.1 Add Provider Column (Already Done!)
The `users` table already has a `provider` column:
```sql
provider VARCHAR NULL -- 'local', 'github', etc.
```

### 7.2 Verify Auto-Creation Logic
File: `backend/app/api/v1/auth.py`

The `get_current_user` function already handles OAuth users:
```python
# Auto-create user for OAuth logins if they don't exist
if not user:
    user = UserModel(
        email=email,
        password_hash="oauth_placeholder",
        role="user",
        is_active=True,
        provider="github"
    )
    db.add(user)
    db.commit()
```

---

## Step 8: Test the OAuth Flow

### 8.1 Restart Servers
```bash
# Backend
pkill -f uvicorn
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# Frontend
cd frontend
npm run dev
```

### 8.2 Test Login Flow
1. Navigate to `http://localhost:3000/login`
2. Click **"Continue with GitHub"** button
3. You'll be redirected to GitHub
4. Authorize the application
5. You'll be redirected back to your app
6. Check that you're logged in

### 8.3 Verify Token Storage
Open browser DevTools → Application → Local Storage:
```json
{
  "engunity-auth": {
    "state": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "providerToken": "gho_...",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "provider": "github"
      }
    }
  }
}
```

### 8.4 Test Repository Access
1. Navigate to `/githubrepos`
2. You should see your GitHub repositories automatically
3. Click any repo to import it

---

## Step 9: Production Configuration

### 9.1 Update GitHub OAuth App
1. Go back to your GitHub OAuth app settings
2. Add production callback URL:
```
https://yourdomain.com/auth/callback
```

### 9.2 Update Supabase Redirect URLs
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 9.3 Update Environment Variables
Production `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_AUTH_CALLBACK_URL=https://yourdomain.com/auth/callback
```

---

## Troubleshooting

### Issue: "Invalid redirect URI"
**Solution:** 
1. Check GitHub OAuth app callback URL matches Supabase URL exactly
2. Format: `https://[project-ref].supabase.co/auth/v1/callback`

### Issue: "Provider not found"
**Solution:** 
1. Verify GitHub provider is enabled in Supabase
2. Check Client ID and Secret are correct
3. Make sure you saved the configuration

### Issue: "User not created in database"
**Solution:**
1. Check backend logs for errors
2. Verify `SUPABASE_JWT_SECRET` matches Supabase dashboard
3. Ensure database connection is working

### Issue: "Token not stored"
**Solution:**
1. Check browser console for errors
2. Verify callback page is handling the response correctly
3. Check Zustand store configuration

### Issue: "Cannot access repositories"
**Solution:**
1. Verify `providerToken` is stored (it's the GitHub OAuth token)
2. Check that scopes include `repo` and `read:user`
3. Test with public repositories first

---

## Security Checklist

### ✅ DO:
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (never expose to frontend)
- Use `SUPABASE_ANON_KEY` in frontend (it's safe to expose)
- Enable Row Level Security (RLS) in Supabase
- Validate tokens on backend
- Use HTTPS in production

### ❌ DON'T:
- Commit secrets to git
- Share service role key
- Disable RLS in production
- Trust frontend tokens without backend validation

---

## Architecture Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Click "Login with GitHub"
       ▼
┌─────────────────────────────────────┐
│   Frontend (Next.js)                │
│   - Redirects to Supabase           │
└──────┬──────────────────────────────┘
       │ 2. OAuth redirect
       ▼
┌─────────────────────────────────────┐
│   Supabase Auth                     │
│   - Handles OAuth flow              │
└──────┬──────────────────────────────┘
       │ 3. GitHub authorization
       ▼
┌─────────────────────────────────────┐
│   GitHub OAuth                      │
│   - User authorizes app             │
└──────┬──────────────────────────────┘
       │ 4. Callback with code
       ▼
┌─────────────────────────────────────┐
│   Supabase Auth                     │
│   - Exchanges code for token        │
│   - Creates JWT                     │
└──────┬──────────────────────────────┘
       │ 5. Redirect to callback
       ▼
┌─────────────────────────────────────┐
│   Frontend Callback Handler         │
│   - Extracts tokens                 │
│   - Stores in Zustand               │
└──────┬──────────────────────────────┘
       │ 6. API calls with JWT
       ▼
┌─────────────────────────────────────┐
│   Backend (FastAPI)                 │
│   - Validates JWT                   │
│   - Creates/finds user              │
│   - Sets provider="github"          │
└──────┬──────────────────────────────┘
       │ 7. GitHub API calls
       ▼
┌─────────────────────────────────────┐
│   GitHub API (via providerToken)    │
│   - Fetches user repositories       │
│   - Accesses private repos          │
└─────────────────────────────────────┘
```

---

## Testing Checklist

After setup, verify:

- [ ] User can click "Login with GitHub"
- [ ] Redirects to GitHub authorization page
- [ ] After authorization, redirects back to app
- [ ] User is logged in (check local storage)
- [ ] User record created in database with `provider='github'`
- [ ] Navigate to `/githubrepos` shows user's GitHub repos
- [ ] Can import repositories
- [ ] `providerToken` is stored and used for GitHub API calls
- [ ] Private repositories are accessible (if scopes granted)
- [ ] Logout works correctly
- [ ] Can log back in with GitHub

---

## Rate Limits & Quotas

### Supabase Free Tier Limits
- **Auth users:** 50,000 MAU (Monthly Active Users)
- **Database:** 500 MB
- **Storage:** 1 GB
- **Bandwidth:** 2 GB

### GitHub OAuth Rate Limits
- **With user token:** 5,000 requests/hour per user
- **Multiple users:** Each user has separate rate limit

---

## Advanced: Store GitHub Token

To make GitHub API calls on behalf of users, you need to store their GitHub access token.

### Option 1: Store in Database (Recommended)
Add column to users table:
```sql
ALTER TABLE users ADD COLUMN github_access_token TEXT;
```

Update on successful OAuth:
```python
# backend/app/api/v1/auth.py
user.github_access_token = provider_token
db.commit()
```

### Option 2: Store in Session/Cache
Use Redis to temporarily store tokens:
```python
await redis.set(f"github_token:{user.id}", provider_token, ex=3600)
```

---

## Next Steps

After completing setup:
1. ✅ Test the OAuth flow end-to-end
2. ✅ Verify repository access
3. ✅ Configure Row Level Security in Supabase
4. 🔧 Continue to pytest fixes

---

**Status:** 🟢 Ready for GitHub OAuth setup!
