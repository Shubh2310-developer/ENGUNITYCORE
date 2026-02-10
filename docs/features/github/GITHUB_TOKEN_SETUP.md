# GitHub Token Setup Guide

## Why You Need a GitHub Token

Without a token, GitHub API limits you to **60 requests per hour**.  
With a token, you get **5,000 requests per hour** - that's **83x more**!

---

## Step 1: Create GitHub Personal Access Token

### 1.1 Navigate to GitHub Settings
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

### 1.2 Generate New Token
1. Click **"Generate new token"** → **"Generate new token (classic)"**
2. Give it a descriptive name: `Engunity GitHub Repos Integration`
3. Set expiration: Choose based on your needs (30, 60, 90 days, or No expiration)

### 1.3 Select Scopes (Permissions)
Check these boxes:

**Required:**
- ✅ `repo` - Full control of private repositories
  - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

**Recommended:**
- ✅ `read:user` - Read user profile data
- ✅ `user:email` - Access user email addresses

**Optional (for advanced features):**
- ✅ `read:org` - Read org and team membership
- ✅ `workflow` - Update GitHub Action workflows

### 1.4 Generate Token
1. Scroll to bottom
2. Click **"Generate token"**
3. **IMPORTANT:** Copy the token immediately!
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You won't be able to see it again!

---

## Step 2: Add Token to Your .env File

### 2.1 Open .env file
```bash
nano .env
# or
code .env
# or
vim .env
```

### 2.2 Add the token
```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_actual_token_here
```

Example:
```bash
GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno
```

### 2.3 Verify it's working
```bash
cd backend
python3 -c "
from app.core.config import settings
from app.services.github.client import github_client

print(f'GitHub Token configured: {bool(settings.GITHUB_TOKEN)}')

if settings.GITHUB_TOKEN:
    try:
        # Test the token
        user = github_client.client.get_user()
        rate_limit = github_client.client.get_rate_limit()
        print(f'✅ Token is valid!')
        print(f'   Authenticated as: {user.login}')
        print(f'   Rate limit: {rate_limit.core.remaining}/{rate_limit.core.limit} requests remaining')
    except Exception as e:
        print(f'❌ Token error: {e}')
else:
    print('⚠️  No token configured - using public API (60 req/hour)')
"
```

---

## Step 3: Restart Backend Server

```bash
# Stop the current server
pkill -f uvicorn

# Start with new configuration
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Token Security Best Practices

### ✅ DO:
- Store token in `.env` file (which is in `.gitignore`)
- Use tokens with minimal required scopes
- Set expiration dates for tokens
- Rotate tokens regularly
- Use different tokens for dev/staging/production

### ❌ DON'T:
- Commit tokens to git repositories
- Share tokens in chat/email
- Use personal tokens in production (use GitHub Apps instead)
- Give `admin:org` or `delete_repo` scopes unless absolutely needed

---

## Troubleshooting

### Error: "Bad credentials"
**Solution:** Token is invalid or expired. Generate a new one.

### Error: "Resource not found"
**Solution:** Token doesn't have required scopes. Add `repo` scope.

### Error: "Rate limit exceeded"
**Solution:** Even with a token, you hit 5000/hour. Wait for reset or use multiple tokens with rotation.

### Error: "Token not loaded"
**Solution:** 
```bash
# Check if .env is in the right location
ls -la .env

# Verify it's loaded
cd backend
python3 -c "from app.core.config import settings; print(settings.GITHUB_TOKEN)"
```

---

## Rate Limit Monitoring

### Check Current Rate Limit
```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/rate_limit
```

### In Python
```python
from app.services.github.client import github_client

rate = github_client.client.get_rate_limit()
print(f"Core: {rate.core.remaining}/{rate.core.limit}")
print(f"Search: {rate.search.remaining}/{rate.search.limit}")
print(f"Reset time: {rate.core.reset}")
```

---

## Advanced: Token Rotation

For high-volume applications, use multiple tokens:

### .env Configuration
```bash
# Single token
GITHUB_TOKEN=ghp_token1

# OR multiple tokens (comma-separated)
GITHUB_TOKENS=ghp_token1,ghp_token2,ghp_token3
```

### Implementation (if needed)
```python
# backend/app/services/github/client.py
import random

class GitHubClient:
    def __init__(self):
        tokens = settings.GITHUB_TOKENS.split(',') if settings.GITHUB_TOKENS else []
        if tokens:
            # Round-robin or random selection
            self.token = random.choice(tokens).strip()
        else:
            self.token = settings.GITHUB_TOKEN
```

---

## What You Get With Token

| Feature | Without Token | With Token |
|---------|---------------|------------|
| Rate Limit | 60/hour | 5,000/hour |
| Private Repos | ❌ No | ✅ Yes |
| Organization Repos | ❌ No | ✅ Yes |
| Detailed Metadata | Limited | Full |
| Repository Search | Limited | Enhanced |

---

## Next Steps

After adding the token:
1. ✅ Restart backend server
2. ✅ Test by importing a repository
3. ✅ Monitor rate limits in logs
4. 🔐 Continue to Supabase setup for OAuth

---

**Status:** 🟢 Ready to use once token is added!
