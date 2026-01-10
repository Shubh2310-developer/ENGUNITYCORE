# Engunity AI - Chat Feature: Complete Implementation Guide

## Executive Summary

This document provides a **complete end-to-end implementation guide** for making the Engunity AI chat feature fully functional. As a product manager and full-stack engineer, this guide covers architecture, database design, API implementation, frontend integration, AI routing, storage, and deployment using modern technologies.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema & Setup](#database-schema--setup)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [AI Integration (Groq)](#ai-integration-groq)
7. [Storage & File Management](#storage--file-management)
8. [Authentication & Security](#authentication--security)
9. [Deployment & DevOps](#deployment--devops)
10. [Testing & Validation](#testing--validation)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Project File Structure](#project-file-structure)

---

## 🏗️ Architecture Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph Frontend
        A[Next.js 14 Chat UI] --> B[Chat Service Layer]
        B --> C[Auth Store]
    end
    
    subgraph Backend
        D[FastAPI Chat Routes] --> E[AI Router]
        D --> F[Database Layer]
        E --> G[Groq API]
        E --> H[Phi-2 Local]
        F --> I[PostgreSQL]
    end
    
    subgraph Storage
        J[Document Service] --> K[Supabase Storage]
        J --> L[Vector Store FAISS]
    end
    
    subgraph Infrastructure
        M[Redis Cache] --> D
        N[Nginx] --> A
        N --> D
    end
    
    B --> D
    D --> J
    
    style A fill:#60a5fa
    style D fill:#34d399
    style G fill:#f59e0b
    style I fill:#8b5cf6
```

### Request Flow

1. **User Input** → Frontend captures message
2. **Authentication** → JWT token validation
3. **Session Management** → Create/retrieve chat session
4. **Message Storage** → Store user message in PostgreSQL
5. **AI Routing** → Route to Groq/Phi-2 based on preference
6. **Response Generation** → LLM processes with context
7. **Response Storage** → Save assistant response
8. **UI Update** → Stream/Display response to user

---

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: Custom React components with Lucide icons
- **State Management**: Zustand (auth store)
- **Styling**: CSS Modules + TailwindCSS
- **Markdown**: ReactMarkdown + remark-gfm
- **HTTP Client**: Native Fetch API

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Authentication**: JWT (jose library)
- **CORS**: FastAPI CORS middleware

### Database & Storage
- **Primary Database**: PostgreSQL 15
- **Caching**: Redis 7
- **Vector Store**: FAISS (for RAG)
- **File Storage**: Supabase Storage
- **Session Store**: PostgreSQL

### AI & ML
- **Primary LLM**: Groq API (llama-3.3-70b-versatile)
- **Local Model**: Phi-2 (optional fallback)
- **Embeddings**: sentence-transformers
- **RAG**: FAISS + HuggingFace

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **Orchestration**: Docker Compose
- **Environment**: .env configuration

---

## 🗄️ Database Schema & Setup

### PostgreSQL Schema

#### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### 2. Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
```

#### 3. Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
```

#### 4. Documents Table (for file uploads)
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    size_bytes INTEGER,
    status VARCHAR(50) DEFAULT 'uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_session_id ON documents(session_id);
```

### Database Connection Configuration

**File**: `/backend/app/core/database.py` (already exists)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Environment Variables

**File**: `.env` (root directory)

```bash
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/engunity

# Supabase (Production)
SUPABASE_URL=https://amddbmoltlwqsrwwdyvc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
SECRET_KEY=YC2RymwNNsvEVLtKfBnnSsNag1IrQFjQnHKOsF0V4WAC4pbdFLdQjn8aohGCfWfBqu7ey5EvT9V5X2Anuj/Z5A==
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# AI Services
GROQ_API_KEY=gsk_your_groq_api_key_here
PHI2_LOCAL_PATH=/path/to/phi2/model  # Optional

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage
UPLOAD_DIR=/var/uploads
MAX_UPLOAD_SIZE_MB=10
```

### Database Initialization Script

**File**: `/scripts/init_db.py`

```python
from sqlalchemy import create_engine, text
from backend.app.core.config import settings
from backend.app.models import user, chat, document

def init_database():
    engine = create_engine(settings.DATABASE_URL)
    
    # Create all tables
    from backend.app.core.database import Base
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    init_database()
```

---

## 🔧 Backend Implementation

### 1. Configuration

**File**: `/backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Engunity AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520  # 8 days

    # Database
    DATABASE_URL: str

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # AI Services
    GROQ_API_KEY: str
    PHI2_LOCAL_PATH: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
```

### 2. Models

**File**: `/backend/app/models/chat.py` (already exists)

Enhancement:
```python
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.timestamp")

    @property
    def message_count(self):
        return len(self.messages)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system, tool
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")
```

### 3. Schemas

**File**: `/backend/app/schemas/chat.py` (already exists)

### 4. AI Router

**File**: `/backend/app/services/ai/router.py`

```python
from typing import List, Dict, Any
from app.services.ai.groq_client import groq_client
from app.core.config import settings

class AIRouter:
    async def route_request(
        self, 
        messages: List[Dict[str, str]], 
        preference: str = "performance"
    ) -> str:
        """
        Route AI requests based on preference and availability.
        
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

ai_router = AIRouter()
```

**File**: `/backend/app/services/ai/groq_client.py`

```python
import os
from groq import AsyncGroq
from typing import List, Dict
from app.core.config import settings

class GroqClient:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        self.max_tokens = 2048
        self.temperature = 0.7

    async def get_completion(self, messages: List[Dict[str, str]]) -> str:
        """
        Get completion from Groq API.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
        
        Returns:
            Generated text response
        """
        try:
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

groq_client = GroqClient()
```

### 5. Chat API Routes

**File**: `/backend/app/api/v1/chat.py` (already exists with enhancements)

Key features implemented:
- ✅ GET `/chat/` - List all sessions
- ✅ POST `/chat/sessions` - Create new session
- ✅ GET `/chat/{session_id}` - Get session with messages
- ✅ POST `/chat/` - Send message and get response
- ✅ DELETE `/chat/{session_id}` - Delete session

---

## 🎨 Frontend Implementation

### 1. Chat Service Layer

**File**: `/frontend/src/services/chat.ts` (already exists)

### 2. Chat Page Component

**File**: `/frontend/src/app/(dashboard)/chat/page.tsx` (already exists)

### 3. Environment Variables

**File**: `/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🤖 AI Integration (Groq)

### Setting Up Groq API

1. **Create Groq Account**
   - Visit: https://console.groq.com
   - Sign up for free account
   - Navigate to API Keys section

2. **Generate API Key**
   ```bash
   # Add to .env
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```

3. **Install Groq SDK**
   ```bash
   cd backend
   pip install groq
   ```

### Supported Models

| Model | Speed | Context | Best For |
|-------|-------|---------|----------|
| llama-3.3-70b-versatile | 300 tok/s | 8K | General chat |
| llama-3.1-8b-instant | 600 tok/s | 8K | Fast responses |
| mixtral-8x7b-32768 | 450 tok/s | 32K | Long context |

### Chat Context Management

```python
# In chat.py route
def build_context(history: List[ChatMessage], max_messages: int = 10):
    """Build conversation context for AI"""
    recent_messages = history[-max_messages:]
    return [
        {"role": msg.role, "content": msg.content}
        for msg in recent_messages
    ]
```

---

## 📦 Storage & File Management

### Supabase Storage Setup

**File**: `/backend/app/services/storage/supabase_client.py`

```python
from supabase import create_client, Client
from app.core.config import settings
import os

class SupabaseStorage:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        self.bucket_name = "documents"

    async def upload_file(self, file_path: str, file_name: str, user_id: int):
        """Upload file to Supabase storage"""
        with open(file_path, 'rb') as f:
            response = self.client.storage.from_(self.bucket_name).upload(
                file=f,
                path=f"{user_id}/{file_name}",
                file_options={"content-type": "application/octet-stream"}
            )
        return response

    async def get_file_url(self, file_path: str):
        """Get public URL for file"""
        return self.client.storage.from_(self.bucket_name).get_public_url(file_path)

storage_client = SupabaseStorage()
```

---

## 🔐 Authentication & Security

### JWT Token Implementation

**File**: `/backend/app/api/v1/auth.py`

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

---

## 🚀 Deployment & DevOps

### Docker Setup

**File**: `/docker-compose.yml` (already exists)

### Running the Application

```bash
# 1. Start infrastructure
docker-compose up -d db redis

# 2. Run migrations
cd backend
python scripts/init_db.py

# 3. Start backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4. Start frontend
cd frontend
npm run dev
```

### Production Deployment

```bash
# Build and run all services
docker-compose -f docker-compose.prod.yml up -d

# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## ✅ Testing & Validation

### Backend Tests

```bash
cd backend
pytest tests/test_chat.py -v
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Manual Testing Checklist

- [ ] User can create new chat session
- [ ] Messages are stored in database
- [ ] AI responses are generated correctly
- [ ] Chat history persists across sessions
- [ ] File upload works
- [ ] Authentication blocks unauthorized access
- [ ] Session switching works
- [ ] Chat deletion works

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **Performance**
   - Average response time
   - Token usage per session
   - API latency

2. **Usage**
   - Messages per user
   - Active sessions
   - Peak usage times

3. **Errors**
   - Failed AI requests
   - Database errors
   - Authentication failures

---

## 📁 Project File Structure

See [chat_project_structure.md](./chat_project_structure.md) for complete file tree and explanations.

---

## 🎯 Next Steps

1. **Immediate** (Week 1)
   - ✅ Verify all tables exist
   - ✅ Configure Groq API key
   - ✅ Test authentication flow
   - ✅ Test basic chat functionality

2. **Short-term** (Week 2-3)
   - [ ] Implement streaming responses
   - [ ] Add RAG for document context
   - [ ] Implement rate limiting
   - [ ] Add message export feature

3. **Long-term** (Month 2+)
   - [ ] Multi-modal chat (images, code)
   - [ ] Voice input/output
   - [ ] Advanced analytics dashboard
   - [ ] Team collaboration features

---

## 📞 Support & Resources

- **Groq Documentation**: https://console.groq.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs
- **PostgreSQL**: https://www.postgresql.org/docs

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-10  
**Maintained By**: Engunity AI Team
