# GitHub OAuth redirect_uri Fix

## Problem Identified

**Error:** "The redirect_uri is not associated with this application"

**Root Cause:** The `redirect_uri` being sent doesn't match what's configured in your GitHub OAuth App settings.

## Current Situation

Your `.env` files show:
```
SUPABASE_URL=https://amddbmoltlwqsrwwdyvc.supabase.co
```

But the browser URL shows:
```
https://amdbmoltlwqsrwwdyvc.supabase.co
```

Notice: `amddbmoltlwqsrwwdyvc` vs `amdbmoltlwqsrwwdyvc` (double 'd' vs single 'd')

## Solution: Update GitHub OAuth App

You need to add the correct callback URL to your GitHub OAuth App settings.

### Step 1: Go to GitHub OAuth App Settings

1. Go to: https://github.com/settings/developers
2. Click on "OAuth Apps"
3. Click on your "Engunity" app (or whatever you named it)

### Step 2: Update Authorization callback URL

**You need to add this EXACT URL:**
```
https://amddbmoltlwqsrwwdyvc.supabase.co/auth/v1/callback
```

**Current setting should be changed to match the URL in your .env file.**

### Step 3: Verify Your Supabase Project Reference

Let's make sure we have the correct Supabase URL:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (it will be like `https://xxxxx.supabase.co`)

### Step 4: Update Your .env Files

Once you confirm the correct Supabase URL, update both:

**Backend `.env`:**
```bash
SUPABASE_URL=https://[YOUR_CORRECT_PROJECT_REF].supabase.co
SUPABASE_AUTH_CALLBACK_URL=https://[YOUR_CORRECT_PROJECT_REF].supabase.co/auth/v1/callback
```

**Frontend `frontend/.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_CORRECT_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=https://[YOUR_CORRECT_PROJECT_REF].supabase.co/auth/v1/callback
```

### Step 5: Restart Servers

```bash
# Backend
pkill -f uvicorn
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# Frontend
pkill -f "next dev"
cd frontend
npm run dev
```

## Quick Fix Guide

### Option A: If Supabase URL is Correct in .env

**Just update GitHub OAuth App:**

1. Go to: https://github.com/settings/developers → OAuth Apps → Your App
2. Set **Authorization callback URL** to:
   ```
   https://amddbmoltlwqsrwwdyvc.supabase.co/auth/v1/callback
   ```
3. Click **Update application**
4. Try logging in again

### Option B: If .env Has Wrong URL

**Update .env files with correct Supabase URL:**

1. Get correct URL from Supabase dashboard
2. Update `.env` and `frontend/.env.local`
3. Update GitHub OAuth App callback URL to match
4. Restart servers

## Common Mistakes

❌ **Wrong:** `http://localhost:3000/auth/callback`  
✅ **Correct:** `https://[project-ref].supabase.co/auth/v1/callback`

❌ **Wrong:** Missing `/auth/v1/callback` path  
✅ **Correct:** Must include full path

❌ **Wrong:** HTTP instead of HTTPS  
✅ **Correct:** Must use HTTPS

❌ **Wrong:** Trailing slash  
✅ **Correct:** No trailing slash

## Expected GitHub OAuth App Configuration

```
Application name: Engunity
Homepage URL: http://localhost:3000
Authorization callback URL: https://amddbmoltlwqsrwwdyvc.supabase.co/auth/v1/callback
```

For production, you can add multiple callback URLs (one per line):
```
https://amddbmoltlwqsrwwdyvc.supabase.co/auth/v1/callback
https://yourdomain.com/auth/callback
```

## Testing After Fix

1. Clear browser cache/cookies for localhost:3000
2. Go to http://localhost:3000/login
3. Click "Continue with GitHub"
4. Should redirect to GitHub authorization page
5. After authorizing, should redirect back successfully

## Still Not Working?

### Check 1: Verify Supabase GitHub Provider Settings

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **GitHub**
3. Verify:
   - Provider is **enabled** (toggle ON)
   - **Client ID** matches your GitHub OAuth App
   - **Client Secret** matches your GitHub OAuth App

### Check 2: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for any error messages
4. Share them if you need more help

### Check 3: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try logging in again
4. Look for the `/authorize` request
5. Check the `redirect_uri` parameter

## Need to Create New GitHub OAuth App?

If you need to start fresh:

1. Go to: https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Engunity
   - **Homepage URL:** http://localhost:3000
   - **Authorization callback URL:** https://amddbmoltlwqsrwwdyvc.supabase.co/auth/v1/callback
4. Click **Register application**
5. Copy the **Client ID**
6. Generate and copy **Client Secret**
7. Add both to Supabase → Authentication → Providers → GitHub

---

**Next Step:** Update your GitHub OAuth App callback URL and try again!
