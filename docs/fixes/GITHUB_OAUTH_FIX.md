# GitHub OAuth Login Fix

## Problem
When clicking "Continue with GitHub" button in the githubrepos page, the application was redirecting to a landing page instead of initiating the GitHub OAuth flow.

## Root Cause
1. The Supabase client library (`@supabase/supabase-js`) was not installed
2. The `loginWithGithub()` function was manually constructing an OAuth URL instead of using the proper Supabase client
3. The callback page was manually parsing URL parameters instead of using Supabase's session management
4. Missing environment variables in `.env.local`

## Changes Made

### 1. Installed Supabase Client Library
```bash
npm install @supabase/supabase-js
```

### 2. Created Supabase Client Configuration
**File:** `frontend/src/lib/supabase.ts`
- Created a properly configured Supabase client with auto-refresh and session persistence

### 3. Fixed `loginWithGithub()` Function
**File:** `frontend/src/services/auth.ts`
- Replaced manual URL construction with `supabase.auth.signInWithOAuth()`
- Added proper GitHub scopes: `repo read:user`
- Proper error handling

### 4. Updated Callback Page
**File:** `frontend/src/app/(auth)/callback/page.tsx`
- Now uses `supabase.auth.getSession()` to properly get the session
- Correctly extracts the `provider_token` for GitHub API access
- Better error handling and user experience

## Required Environment Variables

You need to update your `frontend/.env.local` file with the following:

```bash
# Frontend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://amddbmoltlwqsrwwdyvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# IMPORTANT: This should point to YOUR application's callback page, NOT Supabase's URL
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/callback
```

### Where to Find Your Supabase Anon Key:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the `anon` / `public` key

### Fix the Callback URL:
The callback URL in `.env.local` is currently:
```
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=https://amddbmoltlwqsrwwdyvc.supabase.co/auth/v1/callback
```

It should be:
```
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/callback
```

Or for production:
```
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=https://yourdomain.com/callback
```

## Supabase Dashboard Configuration

You also need to configure the callback URL in your Supabase dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication > URL Configuration**
4. Add to **Redirect URLs**:
   - `http://localhost:3000/callback` (for development)
   - `https://yourdomain.com/callback` (for production)

## Testing the Fix

1. Update your `.env.local` file with the correct values
2. Restart the Next.js development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Navigate to the GitHub Repos page
4. Click "Continue with GitHub"
5. You should now be redirected to GitHub's OAuth page
6. After authorizing, you'll be redirected back to `/callback` and then to `/githubrepos`

## Summary of Files Changed

1. ✅ `frontend/package.json` - Added @supabase/supabase-js dependency
2. ✅ `frontend/src/lib/supabase.ts` - Created (new file)
3. ✅ `frontend/src/services/auth.ts` - Fixed loginWithGithub() function
4. ✅ `frontend/src/app/(auth)/callback/page.tsx` - Updated to use Supabase session
5. ⚠️  `frontend/.env.local` - **YOU NEED TO UPDATE THIS MANUALLY**

## Next Steps

1. **Add the missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your `.env.local` file**
2. **Fix the `NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL` to point to your app, not Supabase**
3. **Configure the redirect URLs in your Supabase dashboard**
4. **Restart your frontend server**
5. **Test the GitHub OAuth flow**
