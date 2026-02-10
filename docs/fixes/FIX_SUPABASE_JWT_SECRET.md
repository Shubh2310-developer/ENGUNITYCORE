# 🔴 CRITICAL FIX NEEDED: Wrong Supabase JWT Secret

## ❌ The Problem

Your backend has the **WRONG** Supabase JWT secret, causing:
- ✅ Existing users CAN login (fallback to standard auth)
- ❌ New GitHub OAuth users CANNOT login (403 Forbidden)
- ❌ Supabase tokens fail signature verification

## Backend Logs Show:
```
ERROR - Supabase JWT decode failed: JWTError: Signature verification failed.
INFO - Attempting standard token validation
INFO - ✅ Standard validation success for user ID: 3
```

This means:
- Your secret doesn't match Supabase's secret
- Backend falls back to checking if user exists locally
- New OAuth users fail because they don't exist yet

---

## ✅ THE FIX (5 minutes)

### Step 1: Get the Correct JWT Secret from Supabase

1. **Open Supabase Dashboard:**
   https://supabase.com/dashboard/project/amddbmoltlwqsrwwdyvc/settings/api

2. **Scroll to "JWT Settings" section**

3. **Copy the "JWT Secret"** 
   - It's a long string
   - Might be shown as: `your-super-secret-jwt-token-with-at-least-32-characters-long`
   - DO NOT copy the anon key or service role key

4. **Note:** The secret might be in plain text or base64 encoded

---

### Step 2: Update Backend .env File

**Option A: If Secret is Plain Text**
```bash
# Edit backend/.env
SUPABASE_JWT_SECRET=your-actual-jwt-secret-from-dashboard
```

**Option B: If Secret is Base64 Encoded**
```bash
# Edit backend/.env (keep the = signs at the end)
SUPABASE_JWT_SECRET=base64-encoded-secret-with-equals-signs==
```

---

### Step 3: Restart Backend

```bash
# Kill current backend
pkill -f "uvicorn app.main"

# Start backend again
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &

# Wait for startup
sleep 5
```

---

### Step 4: Verify the Fix

```bash
# Run this verification script
cd backend && python3 << 'PYEOF'
import jwt
import base64
import os
from dotenv import load_dotenv

load_dotenv()

anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZGRibW9sdGx3cXNyd3dkeXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzQ5MDcsImV4cCI6MjA4MzExMDkwN30.62w7IMWGQdOEgyO8gTf-EfYhfh9qnGQSpwqvpGxgGiI"
secret = os.getenv("SUPABASE_JWT_SECRET")

try:
    # Try base64 decode if it looks base64
    if "=" in secret:
        decoded_secret = base64.b64decode(secret)
    else:
        decoded_secret = secret
    
    payload = jwt.decode(anon_key, decoded_secret, algorithms=["HS256"])
    print("✅ ✅ ✅ SUCCESS! Secret is CORRECT!")
    print(f"   Project: {payload.get('ref')}")
except jwt.InvalidSignatureError:
    print("❌ Still wrong. Double-check you copied the JWT Secret (not anon key)")
except Exception as e:
    print(f"❌ Error: {e}")
PYEOF
```

---

## 🎯 Expected Result After Fix

### Backend Logs Should Show:
```
INFO - get_current_user called
INFO - Using base64 decoded Supabase secret
INFO - Attempting Supabase JWT decode...
INFO - ✅ Supabase decode SUCCESS
INFO - Payload keys: ['aud', 'exp', 'iat', 'sub', 'email', 'role', ...]
INFO - Found email in token: your-email@example.com
INFO - Auto-creating user for your-email@example.com
INFO - ✅ User created successfully with ID: X
```

### Frontend Should Work:
- ✅ GitHub OAuth login succeeds
- ✅ New users auto-created
- ✅ No 403 errors
- ✅ Redirect to /githubrepos works

---

## 🔍 How to Find JWT Secret in Supabase Dashboard

### Visual Guide:

1. **Go to Project Settings:**
   Dashboard → Your Project → Settings (gear icon)

2. **Click "API" in left sidebar**

3. **Scroll down to find:**
   ```
   Project API keys
   ├── anon public (this is NOT the JWT secret)
   ├── service_role (this is NOT the JWT secret)
   
   JWT Settings
   └── JWT Secret ← THIS IS WHAT YOU NEED!
       (Click to reveal)
   ```

4. **Click to reveal the JWT Secret**

5. **Copy it (it's usually very long, 32+ characters)**

---

## 📝 Common Mistakes to Avoid

❌ **DON'T** use the anon key (starts with `eyJhbGc...`)
❌ **DON'T** use the service_role key
❌ **DON'T** add extra quotes or spaces
✅ **DO** use the JWT Secret from "JWT Settings" section
✅ **DO** keep it exactly as shown (with = signs if present)

---

## 🆘 Still Not Working?

If you still get 403 after updating:

1. **Double-check you copied the RIGHT secret:**
   - JWT Secret (NOT anon key)
   - From "JWT Settings" section
   - Includes all characters (no truncation)

2. **Verify .env file:**
   ```bash
   cd backend
   grep SUPABASE_JWT_SECRET .env
   # Should show the new secret
   ```

3. **Confirm backend restarted:**
   ```bash
   ps aux | grep uvicorn
   # Should show a running process
   ```

4. **Check backend logs:**
   ```bash
   tail -20 /tmp/backend.log
   # Should show "✅ Supabase decode SUCCESS"
   ```

---

## 🎉 After the Fix

Once you have the correct JWT secret:

1. ✅ All authentication will work perfectly
2. ✅ New users auto-created on OAuth login
3. ✅ No more 403 errors
4. ✅ GitHub OAuth flow works smoothly
5. ✅ Token validation is fast (< 0.1s)

---

## 💡 Why This Happened

The JWT secret in your `.env` file doesn't match the one Supabase is using to sign tokens. This could happen if:
- You copied from .env.example (which has a placeholder)
- You regenerated secrets in Supabase
- You copied the wrong value initially

The fix is simple: just get the correct secret from Supabase dashboard!
