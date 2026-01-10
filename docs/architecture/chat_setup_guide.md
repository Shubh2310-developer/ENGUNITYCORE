# Chat Feature - Implementation Checklist & Setup Guide

## 🎯 Goal
Make `/home/agentrogue/Engunity/frontend/src/app/(dashboard)/chat` **fully functional end-to-end** with databases, Groq API integration, and persistent storage.

---

## ✅ Implementation Checklist

### Phase 1: Environment Setup (15 mins)

#### Step 1.1: Configure Environment Variables

**File**: `/home/agentrogue/Engunity/.env`

```bash
# Create/update .env file in project root
cat > /home/agentrogue/Engunity/.env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres.amddbmoltlwqsrwwdyvc:Meghal0987@23@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# JWT Secret
SECRET_KEY=YC2RymwNNsvEVLtKfBnnSsNag1IrQFjQnHKOsF0V4WAC4pbdFLdQjn8aohGCfWfBqu7ey5EvT9V5X2Anuj/Z5A==
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# Supabase Configuration
SUPABASE_URL=https://amddbmoltlwqsrwwdyvc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZGRibW9sdGx3cXNyd3dkeXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzQ5MDcsImV4cCI6MjA4MzExMDkwN30.62w7IMWGQdOEgyO8gTf-EfYhfh9qnGQSpwqvpGxgGiI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZGRibW9sdGx3cXNyd3dkeXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzUzNDkwNywiZXhwIjoyMDgzMTEwOTA3fQ.keRKJ1dqpv3eBQfAw_q_WC6IAgDKSmS6Riz5TV4MCVA

# AI Configuration - ⚠️ REQUIRED: Get your key from https://console.groq.com
GROQ_API_KEY=gsk_YOUR_ACTUAL_GROQ_API_KEY_HERE

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379/0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
EOF
```

**Action Required**: 
1. Visit https://console.groq.com
2. Create free account
3. Generate API key
4. Replace `gsk_YOUR_ACTUAL_GROQ_API_KEY_HERE` with your actual key

---

#### Step 1.2: Configure Frontend Environment

**File**: `/home/agentrogue/Engunity/frontend/.env.local`

```bash
cat > /home/agentrogue/Engunity/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://amddbmoltlwqsrwwdyvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZGRibW9sdGx3cXNyd3dkeXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzQ5MDcsImV4cCI6MjA4MzExMDkwN30.62w7IMWGQdOEgyO8gTf-EfYhfh9qnGQSpwqvpGxgGiI
EOF
```

---

### Phase 2: Database Setup (10 mins)

#### Step 2.1: Verify Database Connection

```bash
cd /home/agentrogue/Engunity/backend

# Test connection
python << 'EOF'
from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("SELECT version()"))
    print(f"✅ Database connected: {result.fetchone()[0]}")
EOF
```

---

#### Step 2.2: Create Database Tables

**Create migration script**: `/home/agentrogue/Engunity/scripts/setup/init_chat_tables.py`

```python
import sys
sys.path.append('/home/agentrogue/Engunity/backend')

from sqlalchemy import create_engine, text
from app.core.config import settings

def create_chat_tables():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Create chat_sessions table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
        """))
        
        # Create chat_messages table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
                content TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
        """))
        
        conn.commit()
    
    print("✅ Chat tables created successfully!")
    print("   - chat_sessions")
    print("   - chat_messages")
    print("   - All indexes created")

if __name__ == "__main__":
    create_chat_tables()
```

**Run it**:
```bash
cd /home/agentrogue/Engunity
python scripts/setup/init_chat_tables.py
```

---

#### Step 2.3: Verify Tables Exist

```bash
python << 'EOF'
import sys
sys.path.append('/home/agentrogue/Engunity/backend')

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%chat%'
        ORDER BY table_name;
    """))
    tables = result.fetchall()
    print("✅ Chat tables found:")
    for table in tables:
        print(f"   - {table[0]}")
EOF
```

**Expected Output**:
```
✅ Chat tables found:
   - chat_messages
   - chat_sessions
```

---

### Phase 3: Backend Implementation (20 mins)

#### Step 3.1: Install Required Dependencies

```bash
cd /home/agentrogue/Engunity/backend

# Install Groq SDK
pip install groq

# Install other dependencies if missing
pip install fastapi sqlalchemy pydantic-settings python-jose python-multipart
```

**Update requirements.txt**:
```bash
cat >> requirements.txt << 'EOF'
groq>=0.4.0
fastapi>=0.109.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
python-multipart>=0.0.6
psycopg2-binary>=2.9.9
EOF
```

---

#### Step 3.2: Create Groq Client

**File**: `/home/agentrogue/Engunity/backend/app/services/ai/groq_client.py`

```python
import os
from groq import AsyncGroq
from typing import List, Dict
from app.core.config import settings

class GroqClient:
    """
    Groq API client for LLM completions.
    Uses LLaMA 3.3 70B model for high-quality responses.
    """
    
    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        self.max_tokens = 2048
        self.temperature = 0.7

    async def get_completion(self, messages: List[Dict[str, str]]) -> str:
        """
        Get chat completion from Groq API.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
                     Example: [{"role": "user", "content": "Hello"}]
        
        Returns:
            Generated text response from the model
        
        Raises:
            Exception: If API call fails
        """
        try:
            # Add system message if not present
            if not any(msg.get("role") == "system" for msg in messages):
                messages.insert(0, {
                    "role": "system",
                    "content": "You are Engunity AI, a helpful assistant specializing in programming, engineering, and technical problem-solving. Provide clear, accurate, and well-structured responses."
                })
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                stream=False
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Groq API error: {str(e)}")

# Singleton instance
groq_client = GroqClient()
```

---

#### Step 3.3: Update AI Router

**File**: `/home/agentrogue/Engunity/backend/app/services/ai/router.py`

```python
from typing import List, Dict, Any
from app.services.ai.groq_client import groq_client
from app.core.config import settings

class AIRouter:
    """
    Routes AI requests to appropriate LLM provider.
    Currently supports Groq (primary) and Phi-2 (optional fallback).
    """
    
    async def route_request(
        self, 
        messages: List[Dict[str, str]], 
        preference: str = "performance"
    ) -> str:
        """
        Route AI request to appropriate model.
        
        Args:
            messages: Conversation history
            preference: 'performance' (Groq) or 'quality' (Local/Custom)
        
        Returns:
            Generated response string
        """
        try:
            if preference == "performance":
                # Use Groq for fast, cloud-based inference
                return await groq_client.get_completion(messages)
            elif preference == "quality" and settings.PHI2_LOCAL_PATH:
                # Use local Phi-2 for privacy/custom models
                from app.services.ai.phi2_local import phi2_client
                return await phi2_client.get_completion(messages)
            else:
                # Fallback to Groq
                return await groq_client.get_completion(messages)
        except Exception as e:
            raise Exception(f"AI routing failed: {str(e)}")

# Singleton instance
ai_router = AIRouter()
```

---

#### Step 3.4: Verify Backend Files

```bash
# Check all required files exist
cd /home/agentrogue/Engunity/backend

# Should all exist:
ls -la app/api/v1/chat.py
ls -la app/models/chat.py
ls -la app/schemas/chat.py
ls -la app/services/ai/router.py
ls -la app/services/ai/groq_client.py
ls -la app/core/config.py
ls -la app/core/database.py
```

---

### Phase 4: Frontend Implementation (5 mins)

#### Step 4.1: Install Frontend Dependencies

```bash
cd /home/agentrogue/Engunity/frontend

npm install
# Specific packages if missing:
npm install react-markdown remark-gfm lucide-react zustand
```

---

#### Step 4.2: Verify Frontend Files

```bash
cd /home/agentrogue/Engunity/frontend

# Should exist:
ls -la src/app/\(dashboard\)/chat/page.tsx
ls -la src/app/\(dashboard\)/chat/chat.module.css
ls -la src/services/chat.ts
ls -la src/stores/authStore.ts
```

---

### Phase 5: Testing (15 mins)

#### Step 5.1: Start Backend

```bash
cd /home/agentrogue/Engunity/backend

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Verify**: Open http://localhost:8000/docs (Swagger UI)

---

#### Step 5.2: Start Frontend

```bash
cd /home/agentrogue/Engunity/frontend

# Start Next.js development server
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

---

#### Step 5.3: Test Authentication

1. Navigate to http://localhost:3000
2. Login with existing credentials
3. Verify JWT token is stored in authStore

---

#### Step 5.4: Test Chat Functionality

**Manual Test Checklist**:

- [ ] Navigate to `/chat` page
- [ ] UI loads without errors
- [ ] Chat history sidebar is visible
- [ ] Can click "New Chat" button
- [ ] Can type message in input field
- [ ] Can send message (Enter key)
- [ ] Loading indicator appears
- [ ] AI response is received
- [ ] AI response renders as markdown
- [ ] Message is saved to database
- [ ] Can switch between chat sessions
- [ ] Can search chat history
- [ ] Can delete chat session
- [ ] Can upload file (if implemented)

---

#### Step 5.5: Database Verification

```bash
# Check if messages were saved
python << 'EOF'
import sys
sys.path.append('/home/agentrogue/Engunity/backend')

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    # Count sessions
    sessions = conn.execute(text("SELECT COUNT(*) FROM chat_sessions")).fetchone()[0]
    print(f"✅ Total chat sessions: {sessions}")
    
    # Count messages
    messages = conn.execute(text("SELECT COUNT(*) FROM chat_messages")).fetchone()[0]
    print(f"✅ Total messages: {messages}")
    
    # Recent sessions
    result = conn.execute(text("""
        SELECT id, title, created_at 
        FROM chat_sessions 
        ORDER BY created_at DESC 
        LIMIT 5
    """))
    print("\n📋 Recent sessions:")
    for row in result:
        print(f"   {row[0][:8]}... | {row[1]} | {row[2]}")
EOF
```

---

### Phase 6: Monitoring & Debugging (Ongoing)

#### Backend Logs

```bash
# In backend terminal, watch for:
INFO:     POST /api/v1/chat/ - 200 OK        # Successful message
ERROR:    Groq API error: ...                 # API issues
INFO:     GET /api/v1/chat/ - 200 OK         # Session list
```

---

#### Frontend Console

Open browser DevTools (F12), check Console tab for:
```javascript
// Success
✅ Message sent successfully
✅ Session loaded: {id: "...", title: "..."}

// Errors
❌ Failed to send message: Network error
❌ Unauthorized: Invalid token
```

---

#### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **No Groq API Key** | `ValueError: GROQ_API_KEY not found` | Add key to `.env` file |
| **Database Connection Failed** | `OperationalError: could not connect` | Check `DATABASE_URL` in `.env` |
| **CORS Error** | `Access-Control-Allow-Origin` error | Add frontend URL to `BACKEND_CORS_ORIGINS` |
| **401 Unauthorized** | API returns 401 | Login again, check JWT token |
| **Tables Don't Exist** | `relation "chat_sessions" does not exist` | Run `init_chat_tables.py` script |
| **Empty Responses** | AI returns empty string | Check Groq API credits/quota |

---

## 🚀 Production Deployment

### Using Docker Compose

```bash
cd /home/agentrogue/Engunity

# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

### Environment Variables for Production

```bash
# .env.production
DATABASE_URL=postgresql://user:pass@db:5432/engunity
GROQ_API_KEY=gsk_production_key_here
REDIS_URL=redis://redis:6379/0
NEXT_PUBLIC_API_URL=https://api.engunity.com/api/v1
```

---

## 📊 Success Metrics

After setup, you should have:

✅ Backend running on http://localhost:8000  
✅ Frontend running on http://localhost:3000  
✅ Database tables created (2 tables)  
✅ Groq API responding with completions  
✅ Messages persisting across sessions  
✅ Authentication working  
✅ Chat history loading correctly  
✅ No console errors  

---

## 📞 Quick Reference

### Start Development

```bash
# Terminal 1 - Backend
cd /home/agentrogue/Engunity/backend
source venv/bin/activate  # if using venv
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd /home/agentrogue/Engunity/frontend
npm run dev
```

### Stop Services

```bash
# Ctrl+C in each terminal
# Or with Docker:
docker-compose down
```

### Reset Database

```bash
# Drop and recreate tables
python /home/agentrogue/Engunity/scripts/setup/init_chat_tables.py --reset
```

---

## 🎯 Next Features to Implement

1. **Streaming Responses** - Real-time token streaming from Groq
2. **RAG Integration** - Document context for chat
3. **Message Export** - Download chat history as PDF/Markdown
4. **Voice Input** - Speech-to-text integration
5. **Code Execution** - Run code snippets in chat
6. **Multi-modal** - Image understanding via Groq vision models

---

**Setup Time**: ~60 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: Basic knowledge of TypeScript, Python, SQL

**Support**: Refer to [chat_implementation.md](./chat_implementation.md) for detailed documentation.
