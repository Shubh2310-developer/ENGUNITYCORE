# Chat Feature - Complete Project Structure

## 📁 Full Directory Tree

```
/home/agentrogue/Engunity/
│
├── 📂 frontend/                          # Next.js 14 Frontend
│   ├── 📂 src/
│   │   ├── 📂 app/
│   │   │   ├── 📂 (dashboard)/
│   │   │   │   ├── 📂 chat/              # ⭐ CHAT FEATURE
│   │   │   │   │   ├── page.tsx          # Main chat UI component
│   │   │   │   │   └── chat.module.css   # Chat-specific styles
│   │   │   │   ├── 📂 code/
│   │   │   │   ├── 📂 research/
│   │   │   │   └── 📂 overview/
│   │   │   ├── 📂 (auth)/
│   │   │   │   ├── 📂 login/
│   │   │   │   └── 📂 register/
│   │   │   └── layout.tsx
│   │   ├── 📂 components/
│   │   │   ├── 📂 ui/
│   │   │   ├── 📂 chat/                  # Reusable chat components
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── SessionList.tsx
│   │   │   └── 📂 shared/
│   │   ├── 📂 services/                  # ⭐ API SERVICE LAYER
│   │   │   ├── chat.ts                   # Chat API client
│   │   │   ├── document.ts               # Document upload service
│   │   │   └── auth.ts                   # Auth service
│   │   ├── 📂 stores/                    # State management
│   │   │   ├── authStore.ts              # Auth state (Zustand)
│   │   │   └── chatStore.ts              # Chat state (optional)
│   │   ├── 📂 hooks/
│   │   │   ├── useChat.ts                # Chat functionality hook
│   │   │   └── useAuth.ts                # Auth hook
│   │   ├── 📂 lib/
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   └── 📂 styles/
│   ├── 📂 public/
│   ├── .env.local                        # Frontend environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── 📂 backend/                            # FastAPI Backend
│   ├── 📂 app/
│   │   ├── main.py                        # FastAPI application entry
│   │   ├── 📂 api/
│   │   │   └── 📂 v1/
│   │   │       ├── __init__.py
│   │   │       ├── auth.py                # Authentication endpoints
│   │   │       ├── chat.py                # ⭐ CHAT API ROUTES
│   │   │       ├── documents.py           # Document management
│   │   │       └── users.py               # User management
│   │   ├── 📂 models/                     # ⭐ SQLAlchemy ORM Models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                    # User model
│   │   │   ├── chat.py                    # ChatSession, ChatMessage models
│   │   │   └── document.py                # Document model
│   │   ├── 📂 schemas/                    # ⭐ Pydantic Schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── chat.py                    # Chat request/response schemas
│   │   │   └── document.py
│   │   ├── 📂 services/                   # Business logic layer
│   │   │   ├── 📂 ai/                     # ⭐ AI SERVICE
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py              # AI request router
│   │   │   │   ├── groq_client.py         # Groq API integration
│   │   │   │   ├── phi2_local.py          # Local Phi-2 model
│   │   │   │   └── cache.py               # Response caching
│   │   │   ├── 📂 document/
│   │   │   │   ├── processor.py           # Document processing
│   │   │   │   └── embeddings.py          # Text embeddings
│   │   │   ├── 📂 storage/
│   │   │   │   └── supabase_client.py     # Supabase integration
│   │   │   └── 📂 code_execution/
│   │   ├── 📂 core/                       # Core configurations
│   │   │   ├── config.py                  # ⭐ Settings/Environment
│   │   │   ├── database.py                # ⭐ Database connection
│   │   │   ├── security.py                # Password hashing, JWT
│   │   │   └── rate_limit.py              # Rate limiting
│   │   └── 📂 utils/
│   ├── 📂 tests/
│   │   ├── test_auth.py
│   │   ├── test_chat.py                   # Chat endpoint tests
│   │   └── test_ai_router.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📂 ai-core/                            # AI/ML Pipeline (Isolated)
│   ├── 📂 llm/
│   │   ├── prompts/                       # System prompts
│   │   └── templates/                     # Prompt templates
│   ├── 📂 embeddings/
│   │   ├── generator.py                   # Embedding generation
│   │   └── cache.py
│   ├── 📂 rag/                            # RAG pipeline
│   │   ├── chunking.py                    # Document chunking
│   │   ├── retriever.py                   # Vector search
│   │   └── reranker.py                    # Result reranking
│   └── 📂 pipelines/
│       ├── chat_pipeline.py               # Chat-specific pipeline
│       └── research_pipeline.py
│
├── 📂 docs/                               # Documentation
│   ├── 📂 architecture/                   # ⭐ THIS DIRECTORY
│   │   ├── chat_implementation.md         # ⭐ Main implementation guide
│   │   ├── chat_project_structure.md      # ⭐ This file
│   │   ├── auth_integration.md
│   │   ├── rag_research.md
│   │   └── overview.md
│   ├── api.md
│   └── scaling.md
│
├── 📂 scripts/                            # DevOps scripts
│   ├── 📂 setup/
│   │   └── init_db.py                     # ⭐ Database initialization
│   ├── 📂 dev/
│   │   └── seed_data.py                   # Test data seeding
│   └── 📂 deploy/
│
├── .env                                   # ⭐ Environment variables (gitignored)
├── .env.example                           # Environment template
├── docker-compose.yml                     # ⭐ Docker orchestration
├── Makefile                               # Common commands
└── README.md                              # Project overview
```

---

## 📋 Key Files Explained

### Frontend Files

#### `/frontend/src/app/(dashboard)/chat/page.tsx`
**Purpose**: Main chat interface component  
**Key Features**:
- Real-time message display with markdown rendering
- Chat session management (create, switch, delete)
- File upload integration
- Auto-scrolling message container
- Responsive sidebar with search
- Loading states and error handling

**Dependencies**:
- `@/services/chat` - API integration
- `react-markdown` - Markdown rendering
- `lucide-react` - Icons

**Lines of Code**: ~550

---

#### `/frontend/src/services/chat.ts`
**Purpose**: Chat API service layer  
**Key Features**:
- `sendMessage()` - Send user message, get AI response
- `getSessions()` - Fetch all chat sessions
- `getSession()` - Get specific session with messages
- `createSession()` - Create new chat session

**API Endpoints Used**:
```typescript
POST   /api/v1/chat/          // Send message
GET    /api/v1/chat/          // List sessions
GET    /api/v1/chat/{id}      // Get session
POST   /api/v1/chat/sessions  // Create session
```

**Lines of Code**: ~95

---

#### `/frontend/src/stores/authStore.ts`
**Purpose**: Global authentication state management  
**Technology**: Zustand  
**Stored Data**:
- User token (JWT)
- User profile
- Authentication status

**Used By**: All API service calls for Bearer token

---

### Backend Files

#### `/backend/app/api/v1/chat.py`
**Purpose**: Chat API endpoints  
**Routes Implemented**:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chat/` | List user's chat sessions | ✅ |
| POST | `/chat/sessions` | Create new session | ✅ |
| GET | `/chat/{session_id}` | Get session details | ✅ |
| POST | `/chat/` | Send message, get response | ✅ |
| DELETE | `/chat/{session_id}` | Delete session | ✅ |

**Key Logic**:
1. Validates user authentication via JWT
2. Creates/retrieves chat session
3. Stores user message in database
4. Fetches conversation history
5. Routes to AI service (Groq)
6. Stores AI response
7. Returns response to frontend

**Dependencies**:
- `app.services.ai.router` - AI completion
- `app.models.chat` - Database models
- `app.schemas.chat` - Request/response validation

**Lines of Code**: ~133

---

#### `/backend/app/models/chat.py`
**Purpose**: SQLAlchemy ORM models for chat entities  
**Models Defined**:

##### ChatSession
```python
Columns:
- id (UUID, Primary Key)
- user_id (Foreign Key → users.id)
- title (String)
- created_at (Timestamp)
- updated_at (Timestamp)

Relationships:
- user (Many-to-One with User)
- messages (One-to-Many with ChatMessage)
```

##### ChatMessage
```python
Columns:
- id (UUID, Primary Key)
- session_id (Foreign Key → chat_sessions.id)
- role (String: user|assistant|system|tool)
- content (Text)
- timestamp (Timestamp)

Relationships:
- session (Many-to-One with ChatSession)
```

**Lines of Code**: ~29

---

#### `/backend/app/schemas/chat.py`
**Purpose**: Pydantic schemas for request/response validation  
**Schemas Defined**:

- `ChatMessageBase` - Base message structure
- `ChatMessageCreate` - Create message request
- `ChatMessage` - Message response with ID and timestamp
- `ChatSessionCreate` - Create session request
- `ChatSession` - Session response with messages array

**Lines of Code**: ~33

---

#### `/backend/app/services/ai/router.py`
**Purpose**: Route AI requests to appropriate LLM provider  
**Routing Logic**:
- `performance` → Groq API (fast, cloud)
- `quality` → Phi-2 Local (privacy, custom)
- Fallback → Groq if local unavailable

**Method**:
```python
async def route_request(
    messages: List[Dict[str, str]], 
    preference: str = "performance"
) -> str
```

**Lines of Code**: ~11 (expandable)

---

#### `/backend/app/services/ai/groq_client.py`
**Purpose**: Groq API integration  
**Model Used**: `llama-3.3-70b-versatile`  
**Configuration**:
- Max tokens: 2048
- Temperature: 0.7
- Streaming: Disabled (can enable)

**Method**:
```python
async def get_completion(
    messages: List[Dict[str, str]]
) -> str
```

**Error Handling**: Wraps Groq SDK exceptions

**Lines of Code**: ~30 (estimated)

---

#### `/backend/app/core/database.py`
**Purpose**: SQLAlchemy engine and session management  
**Configuration**:
- Connection pooling enabled
- Pool size: 10
- Max overflow: 20
- Pre-ping enabled (connection health check)

**Provides**:
- `engine` - SQLAlchemy engine
- `SessionLocal` - Session factory
- `Base` - Declarative base for models
- `get_db()` - Dependency injection for routes

**Lines of Code**: ~21

---

#### `/backend/app/core/config.py`
**Purpose**: Centralized configuration management  
**Technology**: Pydantic Settings  
**Environment Variables Loaded**:
- Database URL
- JWT secret key
- Groq API key
- Supabase credentials
- Redis URL
- CORS origins

**Auto-loads from**: `.env` file

**Lines of Code**: ~28

---

### Database Tables

#### `users` Table
```sql
Stores user accounts
Columns: id, username, email, hashed_password, full_name, is_active, created_at
Indexes: email, username
```

#### `chat_sessions` Table
```sql
Stores chat conversation sessions
Columns: id (UUID), user_id, title, created_at, updated_at
Indexes: user_id, updated_at
Cascade: DELETE on user deletion
```

#### `chat_messages` Table
```sql
Stores individual messages in conversations
Columns: id (UUID), session_id, role, content, timestamp
Indexes: session_id, timestamp
Cascade: DELETE on session deletion
```

#### `documents` Table
```sql
Stores uploaded files
Columns: id (UUID), user_id, session_id, filename, file_path, size_bytes, created_at
Indexes: user_id, session_id
```

---

## 🔄 Data Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ 1. Types message
       ▼
┌─────────────────────────────────┐
│  Frontend (Next.js)             │
│  - page.tsx captures input      │
│  - chat.ts sends POST request   │
└──────────┬──────────────────────┘
           │ 2. HTTP POST /chat/
           │    with JWT token
           ▼
┌─────────────────────────────────┐
│  Backend (FastAPI)              │
│  - auth.py validates JWT        │
│  - chat.py route handler        │
└──────────┬──────────────────────┘
           │ 3. Store user message
           ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  - INSERT into chat_messages    │
│  - UPDATE chat_sessions         │
└──────────┬──────────────────────┘
           │ 4. Fetch history
           ▼
┌─────────────────────────────────┐
│  AI Router                      │
│  - router.py routes request     │
│  - groq_client.py calls API     │
└──────────┬──────────────────────┘
           │ 5. External API call
           ▼
┌─────────────────────────────────┐
│  Groq API (External)            │
│  - LLaMA 3.3 70B model          │
│  - Returns completion           │
└──────────┬──────────────────────┘
           │ 6. AI response
           ▼
┌─────────────────────────────────┐
│  Backend (FastAPI)              │
│  - Store assistant message      │
└──────────┬──────────────────────┘
           │ 7. Return response JSON
           ▼
┌─────────────────────────────────┐
│  Frontend (Next.js)             │
│  - Render markdown response     │
│  - Update UI state              │
└──────────┬──────────────────────┘
           │ 8. Display to user
           ▼
┌─────────────┐
│   User      │
│ (sees reply)│
└─────────────┘
```

---

## 🛠️ Technology Stack Summary

| Layer | Technology | File Location |
|-------|-----------|---------------|
| **Frontend Framework** | Next.js 14 (App Router) | `/frontend/src/app` |
| **Frontend Language** | TypeScript | `*.tsx`, `*.ts` |
| **State Management** | Zustand | `/frontend/src/stores` |
| **API Client** | Fetch API | `/frontend/src/services` |
| **UI Styling** | CSS Modules | `/frontend/src/app/(dashboard)/chat/chat.module.css` |
| **Backend Framework** | FastAPI | `/backend/app/main.py` |
| **Backend Language** | Python 3.10+ | `*.py` |
| **ORM** | SQLAlchemy 2.0 | `/backend/app/models` |
| **Validation** | Pydantic v2 | `/backend/app/schemas` |
| **Database** | PostgreSQL 15 | Via Docker or Supabase |
| **Caching** | Redis 7 | Via Docker |
| **AI Provider** | Groq (LLaMA 3.3) | `/backend/app/services/ai/groq_client.py` |
| **Authentication** | JWT (jose) | `/backend/app/api/v1/auth.py` |
| **File Storage** | Supabase Storage | `/backend/app/services/storage` |
| **Containerization** | Docker Compose | `/docker-compose.yml` |

---

## 📊 File Size & Complexity Metrics

| Component | Files | Total Lines | Complexity |
|-----------|-------|-------------|------------|
| Frontend Chat UI | 2 | ~600 | Medium |
| Frontend Services | 3 | ~200 | Low |
| Backend API Routes | 1 | ~133 | Medium |
| Backend Models | 1 | ~29 | Low |
| Backend AI Service | 2 | ~50 | Low |
| Database Schema | 4 tables | ~100 SQL | Low |
| Documentation | 2 | ~1000 | N/A |

**Total Project Size**: ~2,100 lines of functional code (excluding dependencies)

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
cd frontend && npm install
cd backend && pip install -r requirements.txt

# 2. Setup database
docker-compose up -d db redis
python scripts/init_db.py

# 3. Configure environment
cp .env.example .env
# Edit .env with your Groq API key

# 4. Run development servers
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend && npm run dev

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/docs
```

---

## 📝 File Modification Checklist

To make chat fully functional, verify these files:

### Must Exist ✅
- [x] `/frontend/src/app/(dashboard)/chat/page.tsx`
- [x] `/frontend/src/services/chat.ts`
- [x] `/backend/app/api/v1/chat.py`
- [x] `/backend/app/models/chat.py`
- [x] `/backend/app/schemas/chat.py`
- [x] `/backend/app/services/ai/router.py`
- [x] `/backend/app/core/database.py`
- [x] `/backend/app/core/config.py`

### Must Create 🆕
- [ ] `/backend/app/services/ai/groq_client.py` (if missing)
- [ ] `/scripts/init_db.py` (database setup)
- [ ] `/.env` (with Groq API key)
- [ ] `/frontend/.env.local` (with API URL)

### Must Configure ⚙️
- [ ] Groq API key in `.env`
- [ ] Database URL in `.env`
- [ ] Frontend API URL in `.env.local`
- [ ] Create PostgreSQL tables via migration

---

## 🎯 Critical Integration Points

### 1. Authentication Flow
```
Frontend Auth Token → Backend JWT Validation → Database User Lookup
```
**Files**: `authStore.ts` → `auth.py` → `database.py`

### 2. Message Flow
```
User Input → API Call → DB Storage → AI Router → Groq API → DB Storage → UI Update
```
**Files**: `page.tsx` → `chat.ts` → `chat.py` → `router.py` → `groq_client.py`

### 3. Session Management
```
Create Session → Store in DB → Load Messages → Switch Sessions
```
**Files**: `page.tsx` → `chat.py` → `chat.py` (models)

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-01-10  
**Maintained By**: Engunity AI Team
