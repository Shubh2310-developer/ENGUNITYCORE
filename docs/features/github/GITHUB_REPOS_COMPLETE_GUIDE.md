# GitHub Repository Intelligence - Complete Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Current Implementation Status](#current-implementation-status)
4. [Database Setup](#database-setup)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Missing Features & Implementation Guide](#missing-features--implementation-guide)
8. [Environment Configuration](#environment-configuration)
9. [API Documentation](#api-documentation)
10. [Testing Guide](#testing-guide)
11. [Deployment](#deployment)

---

## Overview

The GitHub Repository Intelligence feature provides a comprehensive platform for managing, analyzing, and executing GitHub repositories with AI-powered insights. It combines:

- **PostgreSQL** for repository metadata storage
- **MongoDB** for AI analysis results and logs
- **Supabase** for file storage (optional for cloned repos)
- **Redis** for caching
- **AI Services** (Groq/Gemini) for code analysis

### Key Features

✅ **Currently Implemented:**
- Repository listing and metadata storage
- Basic repository details view
- AI analysis triggering (mock)
- Sandbox execution simulation
- Frontend UI with multiple tabs (Overview, Code, Research, Sandbox, Security, Activity)

❌ **Missing/To Be Implemented:**
- GitHub API integration for real data fetching
- Bulk analysis endpoint
- AI tool execution endpoint (`/ai-tool`)
- Real GitHub OAuth integration
- Repository import/sync functionality
- Real code analysis (currently mocked)
- Research paper mapping
- Security audit integration

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Repo Library │  │ Code Viewer  │  │ AI Analysis Panel    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ API Calls (JWT Auth)
┌────────────────────────────┴────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Endpoints (/api/v1/githubrepos)          │  │
│  └────────┬─────────────────────────────────────────┬────────┘  │
│           │                                         │             │
│  ┌────────┴─────────┐                    ┌─────────┴────────┐   │
│  │  GitHub Service   │                    │  AI Analysis     │   │
│  │  - Clone repos    │                    │  - Code review   │   │
│  │  - Fetch metadata │                    │  - Security scan │   │
│  │  - Sync updates   │                    │  - Research map  │   │
│  └────────┬─────────┘                    └─────────┬────────┘   │
└───────────┼──────────────────────────────────────┼─────────────┘
            │                                       │
    ┌───────┴────────┐                    ┌────────┴─────────┐
    │   PostgreSQL    │                    │     MongoDB      │
    │  - Repo metadata│                    │  - AI analysis   │
    │  - User data    │                    │  - Logs          │
    └─────────────────┘                    └──────────────────┘
            
    ┌──────────────────┐                   ┌──────────────────┐
    │    Supabase      │                   │      Redis       │
    │  - File storage  │                   │  - Cache         │
    │  - Repo clones   │                   │  - Sessions      │
    └──────────────────┘                   └──────────────────┘
```

### Data Flow

1. **Repository Registration:**
   ```
   User Input → Frontend → POST /githubrepos → PostgreSQL
   ```

2. **Repository Analysis:**
   ```
   Trigger Analysis → Backend → AI Service → MongoDB (results)
   ```

3. **Code Execution:**
   ```
   Execute → Sandbox Simulator → Return Logs
   ```

---

## Current Implementation Status

### ✅ Implemented Components

#### Backend (FastAPI)

**File:** `backend/app/api/v1/githubrepos.py`

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/` | GET | ✅ Working | List all repositories for current user |
| `/` | POST | ✅ Working | Create/register new repository |
| `/{repo_id}` | GET | ✅ Working | Get repository details + AI analysis |
| `/{repo_id}/analyze` | POST | ✅ Mocked | Trigger AI analysis (stores mock data) |
| `/{repo_id}/execute` | POST | ✅ Simulated | Execute code in sandbox |

**Database Models:**

**File:** `backend/app/models/github.py`

```python
class GitHubRepository(Base):
    __tablename__ = "github_repositories"
    
    id = Column(String, primary_key=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    description = Column(Text)
    language = Column(String)
    lang_color = Column(String)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    visibility = Column(String, default="Public")
    last_updated = Column(String)
    quality_score = Column(String)
    repository_url = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

**MongoDB Collections:**
- `repo_analysis` - Stores AI analysis results
- `ai_logs` - Stores event logs

#### Frontend (Next.js + React)

**File:** `frontend/src/app/(dashboard)/githubrepos/page.tsx`

**Features:**
- ✅ Repository list with search/filter
- ✅ Multi-tab interface (6 tabs)
- ✅ Bulk selection UI
- ✅ Code viewer with file tree
- ✅ Sandbox execution UI
- ✅ Mock data visualization

**Service File:** `frontend/src/services/githubrepos.ts`

```typescript
githubService.getRepositories(token)
githubService.getRepositoryDetails(token, repoId)
githubService.triggerAnalysis(token, repoId)
githubService.executeRepository(token, repoId, useGpu)
githubService.bulkTriggerAnalysis(token, repoIds) // ⚠️ Not implemented in backend
githubService.runAiTool(token, repoId, toolType) // ⚠️ Not implemented in backend
```

---


## Database Setup

### PostgreSQL Schema

The `github_repositories` table is automatically created by SQLAlchemy migrations.

**Migration Script:** `init_db_tables.py`

```bash
# Run this to create all tables including github_repositories
python init_db_tables.py
```

**Table Structure:**

```sql
CREATE TABLE github_repositories (
    id VARCHAR PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR NOT NULL,
    owner VARCHAR NOT NULL,
    description TEXT,
    language VARCHAR,
    lang_color VARCHAR,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    visibility VARCHAR DEFAULT 'Public',
    last_updated VARCHAR,
    quality_score VARCHAR,
    repository_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_github_repos_user_id ON github_repositories(user_id);
CREATE INDEX idx_github_repos_owner ON github_repositories(owner);
```

### MongoDB Collections

**Collection: `repo_analysis`**

```json
{
  "_id": "ObjectId(...)",
  "repo_id": "uuid-string",
  "timestamp": "2024-01-22T10:00:00Z",
  "results": {
    "status": "completed",
    "summary": "AI analysis summary",
    "quality_score": "A",
    "security_score": 95,
    "vulnerabilities": 0,
    "code_intelligence": {
      "key_modules": [
        {"name": "transformer.py", "description": "Core model"}
      ],
      "file_tree": [
        {"name": "src", "type": "dir", "children": []}
      ]
    },
    "security_audit": {
      "vulnerabilities": 0,
      "secrets": "None",
      "maintenance": "High",
      "warnings": []
    },
    "research_papers": [],
    "activity_metrics": {
      "commit_history": [40, 70, 45, 90],
      "latest_commit": {"message": "Update README", "time": "2 hours ago"},
      "contributors": 5,
      "engagement_trend": "+12%"
    }
  }
}
```

**Collection: `ai_logs`**

```json
{
  "_id": "ObjectId(...)",
  "id": "uuid-string",
  "timestamp": "2024-01-22T10:00:00Z",
  "event_type": "repo_analysis_triggered",
  "user_id": 1,
  "session_id": "session-uuid",
  "model": "groq/llama-3.1-70b",
  "details": {
    "repo_id": "uuid",
    "repo_name": "my-repo"
  }
}
```

---

## Backend Implementation

### Current Backend Structure

```
backend/app/
├── api/v1/
│   └── githubrepos.py          # Main API endpoints
├── models/
│   └── github.py               # SQLAlchemy model
├── schemas/
│   └── github.py               # Pydantic schemas
├── services/
│   ├── ai/
│   │   └── logger.py           # AI event logging
│   └── code_execution/
│       └── sandbox.py          # Sandbox simulator
├── core/
│   ├── database.py             # PostgreSQL connection
│   ├── mongodb.py              # MongoDB connection
│   └── config.py               # Settings
```

### Existing Endpoints Details

#### 1. GET `/api/v1/githubrepos/`

**Purpose:** List all repositories for the current user

**Request:**
```bash
curl -X GET http://localhost:8000/api/v1/githubrepos/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "user_id": 1,
    "name": "transformer-hub",
    "owner": "johndoe",
    "description": "Production transformer implementations",
    "language": "Python",
    "lang_color": "#3572A5",
    "stars": 245,
    "forks": 42,
    "visibility": "Public",
    "last_updated": "2024-01-22",
    "quality_score": "A+",
    "repository_url": "https://github.com/johndoe/transformer-hub",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-22T10:00:00Z"
  }
]
```

#### 2. POST `/api/v1/githubrepos/`

**Purpose:** Register a new repository

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/githubrepos/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-awesome-repo",
    "owner": "username",
    "description": "My awesome project",
    "language": "Python",
    "lang_color": "#3572A5",
    "stars": 0,
    "forks": 0,
    "visibility": "Public",
    "repository_url": "https://github.com/username/my-awesome-repo"
  }'
```

#### 3. GET `/api/v1/githubrepos/{repo_id}`

**Purpose:** Get detailed repository information including AI analysis

#### 4. POST `/api/v1/githubrepos/{repo_id}/analyze`

**Purpose:** Trigger AI analysis of repository (currently stores mock data in MongoDB)

#### 5. POST `/api/v1/githubrepos/{repo_id}/execute`

**Purpose:** Execute repository code in sandbox (simulated)

---


## Missing Features & Implementation Guide

### ❌ Missing Backend Endpoints

The frontend expects these endpoints that are **NOT** currently implemented:

#### 1. POST `/api/v1/githubrepos/bulk/analyze`

**Purpose:** Trigger analysis for multiple repositories at once

**Implementation:**

```python
# Add to backend/app/api/v1/githubrepos.py

@router.post("/bulk/analyze")
async def bulk_trigger_analysis(
    repo_ids: List[str] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trigger analysis for multiple repositories in bulk.
    """
    results = []
    for repo_id in repo_ids:
        repo = db.query(GitHubRepository).filter(
            GitHubRepository.id == repo_id,
            GitHubRepository.user_id == current_user.id
        ).first()
        
        if not repo:
            results.append({"repo_id": repo_id, "status": "error", "message": "Not found"})
            continue
        
        # Trigger analysis (use background task in production)
        await ai_logger.log_event(
            event_type="bulk_analysis_triggered",
            user_id=current_user.id,
            details={"repo_id": repo_id, "repo_name": repo.name}
        )
        
        results.append({"repo_id": repo_id, "status": "queued", "message": "Analysis queued"})
    
    return {"results": results, "total": len(repo_ids), "queued": len([r for r in results if r["status"] == "queued"])}
```

#### 2. POST `/api/v1/githubrepos/{repo_id}/ai-tool`

**Purpose:** Run specific AI tools on repository code

**Implementation:**

```python
# Add to backend/app/api/v1/githubrepos.py

@router.post("/{repo_id}/ai-tool")
async def run_ai_tool(
    repo_id: str,
    tool_type: str,  # Query parameter: explain, trace, bottleneck, dead_code
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Run specific AI analysis tools on repository code.
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Mock responses based on tool type
    tool_responses = {
        "explain": {
            "title": "Code Explanation",
            "content": f"This repository ({repo.name}) implements a comprehensive {repo.language} solution with modular architecture. Key components include core models, data processing pipelines, and utility functions."
        },
        "trace": {
            "title": "Execution Trace",
            "content": f"Traced execution flow: Entry point → Data loading → Model initialization → Training loop → Evaluation. Average execution time: 450ms. No bottlenecks detected."
        },
        "bottleneck": {
            "title": "Performance Audit",
            "content": "Identified 2 potential bottlenecks: 1) Data loading in main.py:45 (IO-bound), 2) Matrix multiplication in model.py:120 (CPU-bound). Recommendations: Use async IO, leverage GPU acceleration."
        },
        "dead_code": {
            "title": "Dead Code Analysis",
            "content": "Found 3 unused functions: utils.py:helper_old(), deprecated.py:legacy_transform(), test_old.py:* (entire file). Removing these would reduce codebase by ~15%."
        }
    }
    
    result = tool_responses.get(tool_type, {
        "title": "Unknown Tool",
        "content": "Tool type not recognized."
    })
    
    # Log the tool execution
    await ai_logger.log_event(
        event_type="ai_tool_executed",
        user_id=current_user.id,
        details={"repo_id": repo_id, "tool_type": tool_type}
    )
    
    return {"result": result}
```

#### 3. POST `/api/v1/githubrepos/import`

**Purpose:** Import repository from GitHub using GitHub API

**Implementation:**

```python
# First, install PyGithub
# pip install PyGithub

# Add to backend/app/services/github/client.py (new file)

from github import Github, GithubException
from typing import Optional, Dict, Any

class GitHubClient:
    def __init__(self, access_token: Optional[str] = None):
        """Initialize GitHub client with personal access token"""
        self.client = Github(access_token) if access_token else Github()
    
    def get_repository_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Fetch repository information from GitHub API"""
        try:
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            
            return {
                "name": repo.name,
                "owner": owner,
                "description": repo.description or "",
                "language": repo.language or "Unknown",
                "lang_color": self._get_language_color(repo.language),
                "stars": repo.stargazers_count,
                "forks": repo.forks_count,
                "visibility": "Private" if repo.private else "Public",
                "last_updated": repo.updated_at.isoformat(),
                "repository_url": repo.html_url,
                "default_branch": repo.default_branch,
                "topics": repo.get_topics(),
                "license": repo.license.name if repo.license else None,
            }
        except GithubException as e:
            raise Exception(f"GitHub API error: {e.data.get('message', str(e))}")
    
    def _get_language_color(self, language: Optional[str]) -> str:
        """Return color code for programming language"""
        colors = {
            "Python": "#3572A5",
            "JavaScript": "#f1e05a",
            "TypeScript": "#2b7489",
            "Java": "#b07219",
            "Go": "#00ADD8",
            "Rust": "#dea584",
            "C++": "#f34b7d",
            "C": "#555555",
            "Ruby": "#701516",
            "PHP": "#4F5D95",
        }
        return colors.get(language or "Unknown", "#808080")

github_client = GitHubClient()
```

**Add endpoint to githubrepos.py:**

```python
from app.services.github.client import github_client

@router.post("/import")
async def import_repository(
    owner: str = Body(...),
    repo_name: str = Body(...),
    github_token: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Import repository from GitHub by fetching metadata from GitHub API.
    """
    try:
        # Initialize client with user's token if provided
        client = GitHubClient(github_token) if github_token else github_client
        
        # Fetch repo info from GitHub
        repo_info = client.get_repository_info(owner, repo_name)
        
        # Check if already exists
        existing = db.query(GitHubRepository).filter(
            GitHubRepository.repository_url == repo_info["repository_url"],
            GitHubRepository.user_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Repository already imported")
        
        # Create new repository record
        db_obj = GitHubRepository(**repo_info, user_id=current_user.id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        return db_obj
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

#### 4. PUT `/api/v1/githubrepos/{repo_id}`

**Purpose:** Update repository metadata

```python
@router.put("/{repo_id}", response_model=GitHubRepositorySchema)
def update_repository(
    repo_id: str,
    repo_in: GitHubRepositoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update repository metadata"""
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Update fields
    update_data = repo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(repo, field, value)
    
    db.commit()
    db.refresh(repo)
    return repo
```

#### 5. DELETE `/api/v1/githubrepos/{repo_id}`

**Purpose:** Delete repository

```python
@router.delete("/{repo_id}")
def delete_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete repository and associated analysis data"""
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Delete from PostgreSQL
    db.delete(repo)
    db.commit()
    
    # Delete from MongoDB (analysis data)
    if mongodb.db is not None:
        await mongodb.db.repo_analysis.delete_many({"repo_id": repo_id})
    
    return {"message": "Repository deleted successfully"}
```

---

## Frontend Implementation

### Current Frontend Structure

```
frontend/src/app/(dashboard)/githubrepos/
├── page.tsx                    # Main component (931 lines)
└── githubrepos.module.css      # Styles

frontend/src/services/
└── githubrepos.ts              # API service layer
```

### Frontend Features

#### Tabs Overview

1. **Overview Tab** - Repository metadata and statistics
2. **Code Intelligence Tab** - File explorer, code viewer, AI tools
3. **Research Mapping Tab** - Link to academic papers
4. **Execution Sandbox Tab** - Run code in isolated environment
5. **Security & Quality Tab** - Security audit results
6. **Activity & Insights Tab** - Commit history, contributors

#### Key Frontend Functions

**State Management:**
```typescript
const [repos, setRepos] = useState<Repository[]>([])
const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
const [repoDetails, setRepoDetails] = useState<any>(null)
const [sandboxLogs, setSandboxLogs] = useState<any[]>([])
const [aiAnalysis, setAiAnalysis] = useState<{title: string, content: string} | null>(null)
```

**Data Fetching:**
```typescript
useEffect(() => {
  const fetchRepos = async () => {
    const data = await githubService.getRepositories(token)
    setRepos(data)
  }
  fetchRepos()
}, [token])
```

---


## Environment Configuration

### Required Environment Variables

Create a `.env` file in the backend directory with these variables:

```bash
# Backend .env file

# ============================================
# Core Application
# ============================================
PROJECT_NAME=Engunity AI
API_V1_STR=/api/v1
SECRET_KEY=your-super-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=11520  # 8 days

# ============================================
# PostgreSQL Database (REQUIRED)
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/engunity

# ============================================
# MongoDB (REQUIRED for AI analysis storage)
# ============================================
MONGODB_URL=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=engunity

# ============================================
# Redis (REQUIRED for caching)
# ============================================
REDIS_URL=redis://localhost:6379/0

# ============================================
# Supabase (OPTIONAL - for file storage)
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# ============================================
# AI Services (REQUIRED for AI features)
# ============================================
# Groq API (recommended - fast and free tier available)
GROQ_API_KEY=gsk_your_groq_api_key_here
# OR use multiple keys for rotation:
# GROQ_API_KEYS=key1,key2,key3

# Google Gemini (optional)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter (optional)
OPENROUTER_API_KEY=your_openrouter_key_here

# ============================================
# GitHub Integration (REQUIRED for import feature)
# ============================================
GITHUB_TOKEN=ghp_your_github_personal_access_token
# Get token from: https://github.com/settings/tokens
# Required scopes: repo, read:user
```

### Frontend Environment Variables

Create `.env.local` in the frontend directory:

```bash
# Frontend .env.local file

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Docker Compose Configuration

Update `docker-compose.yml` to include MongoDB:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=engunity
    ports:
      - "5432:5432"

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=engunity

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
      - backend_storage:/app/storage
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/engunity
      - MONGODB_URL=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379/0
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    ports:
      - "8000:8000"
    depends_on:
      - db
      - mongo
      - redis

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend

volumes:
  postgres_data:
  mongo_data:
  backend_storage:
```

---

## Complete Setup Guide (Step-by-Step)

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+
- Git

### Step 1: Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install additional dependencies for GitHub integration
pip install PyGithub
```

### Step 2: Setup Databases

**PostgreSQL:**
```bash
# Create database
psql -U postgres
CREATE DATABASE engunity;
\q

# Initialize tables
cd ..
python init_db_tables.py
```

**MongoDB:**
```bash
# Start MongoDB (if not running)
mongod --dbpath /path/to/data/db

# MongoDB collections are created automatically
```

**Redis:**
```bash
# Start Redis (if not running)
redis-server

# Verify connection
redis-cli ping
# Should return: PONG
```

### Step 3: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

**Minimum required variables:**
- `DATABASE_URL`
- `MONGODB_URL`
- `REDIS_URL`
- `GROQ_API_KEY` (or other AI service key)

### Step 4: Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should now be running at `http://localhost:8000`

### Step 5: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

### Step 4: Update Frontend Service

Update `frontend/src/services/githubrepos.ts` to add the import function:

```typescript
async importRepository(token: string, owner: string, repoName: string, githubToken?: string) {
  const response = await fetch(`${API_URL}/githubrepos/import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      owner, 
      repo_name: repoName,
      github_token: githubToken 
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to import repository');
  }

  return response.json();
}
```

---

## Real AI Analysis Implementation

### Using Groq for Code Analysis

Create `backend/app/services/github/analyzer.py`:

```python
import os
from typing import Dict, Any, List
from groq import Groq
from app.services.github.client import github_client

class GitHubAnalyzer:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-70b-versatile"
    
    async def analyze_repository(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Perform comprehensive AI analysis of repository"""
        
        # Get repository info
        repo_info = github_client.get_repository_info(owner, repo_name)
        file_tree = github_client.get_file_tree(owner, repo_name)
        
        # Analyze main files
        main_files = self._find_important_files(file_tree)
        code_analysis = await self._analyze_code_structure(owner, repo_name, main_files)
        
        # Security audit
        security_results = await self._security_audit(owner, repo_name, main_files)
        
        # Quality assessment
        quality_score = self._calculate_quality_score(repo_info, code_analysis)
        
        return {
            "status": "completed",
            "summary": code_analysis.get("summary", ""),
            "quality_score": quality_score,
            "security_score": security_results["score"],
            "vulnerabilities": security_results["vulnerabilities"],
            "code_intelligence": {
                "key_modules": code_analysis.get("modules", []),
                "file_tree": file_tree,
                "architecture": code_analysis.get("architecture", ""),
            },
            "security_audit": security_results,
            "activity_metrics": {
                "commit_history": [],
                "latest_commit": {},
                "contributors": repo_info.get("watchers", 0),
                "engagement_trend": "+0%"
            }
        }
    
    def _find_important_files(self, file_tree: List[Dict]) -> List[str]:
        """Identify key files for analysis"""
        important = []
        priority_files = ['main.py', 'app.py', '__init__.py', 'index.js', 'main.ts', 'README.md']
        
        def traverse(items, path=""):
            for item in items:
                full_path = f"{path}/{item['name']}" if path else item['name']
                if item['type'] == 'file' and item['name'] in priority_files:
                    important.append(full_path)
                elif item['type'] == 'dir' and 'children' in item:
                    traverse(item['children'], full_path)
        
        traverse(file_tree)
        return important[:5]  # Limit to 5 files
    
    async def _analyze_code_structure(self, owner: str, repo_name: str, files: List[str]) -> Dict[str, Any]:
        """Analyze code structure using AI"""
        
        # Get file contents
        code_samples = []
        for file_path in files:
            content = github_client.get_file_content(owner, repo_name, file_path)
            if content:
                code_samples.append(f"File: {file_path}\n```\n{content[:1000]}\n```")
        
        prompt = f"""Analyze this repository's code structure and provide:
1. A brief summary of what this project does
2. Key modules and their purposes
3. Architecture pattern used
4. Code quality observations

Code samples:
{chr(10).join(code_samples)}

Respond in JSON format:
{{
  "summary": "brief description",
  "modules": [
    {{"name": "module_name", "description": "what it does"}}
  ],
  "architecture": "architecture pattern",
  "quality_notes": "quality observations"
}}
"""
        
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1000
            )
            
            import json
            result = json.loads(completion.choices[0].message.content)
            return result
        except Exception as e:
            return {
                "summary": "Analysis in progress",
                "modules": [],
                "architecture": "Unknown",
                "quality_notes": str(e)
            }
    
    async def _security_audit(self, owner: str, repo_name: str, files: List[str]) -> Dict[str, Any]:
        """Perform security audit"""
        
        warnings = []
        vulnerability_count = 0
        
        # Check for common security issues
        for file_path in files:
            content = github_client.get_file_content(owner, repo_name, file_path)
            if content:
                # Check for hardcoded secrets
                if 'password' in content.lower() or 'api_key' in content.lower():
                    warnings.append({
                        "issue": f"Potential hardcoded secret in {file_path}",
                        "risk": "Medium"
                    })
                
                # Check for eval() usage
                if 'eval(' in content:
                    warnings.append({
                        "issue": f"Dangerous eval() usage in {file_path}",
                        "risk": "High"
                    })
                    vulnerability_count += 1
        
        score = max(0, 100 - (vulnerability_count * 20) - (len(warnings) * 5))
        
        return {
            "vulnerabilities": vulnerability_count,
            "secrets": "None" if not any('secret' in w['issue'].lower() for w in warnings) else "Found",
            "maintenance": "High",
            "warnings": warnings,
            "score": score
        }
    
    def _calculate_quality_score(self, repo_info: Dict, code_analysis: Dict) -> str:
        """Calculate quality score based on various factors"""
        score = 0
        
        # Stars factor
        stars = repo_info.get('stars', 0)
        if stars > 1000:
            score += 30
        elif stars > 100:
            score += 20
        elif stars > 10:
            score += 10
        
        # Documentation factor
        if repo_info.get('description'):
            score += 10
        
        # Has license
        if repo_info.get('license'):
            score += 10
        
        # Recent activity
        score += 20
        
        # Code quality
        if code_analysis.get('architecture'):
            score += 15
        
        # Module organization
        score += len(code_analysis.get('modules', [])) * 5
        
        # Convert to letter grade
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B+"
        elif score >= 60:
            return "B"
        else:
            return "C"

analyzer = GitHubAnalyzer()
```

### Update Analyze Endpoint

Update `backend/app/api/v1/githubrepos.py`:

```python
from app.services.github.analyzer import analyzer

@router.post("/{repo_id}/analyze")
async def trigger_repository_analysis(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trigger a real AI analysis of a repository.
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Log the analysis trigger
    await ai_logger.log_event(
        event_type="repo_analysis_triggered",
        user_id=current_user.id,
        details={"repo_id": repo_id, "repo_name": repo.name}
    )
    
    try:
        # Perform real AI analysis
        analysis_results = await analyzer.analyze_repository(repo.owner, repo.name)
        
        # Store analysis in MongoDB
        if mongodb.db is not None:
            analysis_doc = {
                "repo_id": repo_id,
                "timestamp": datetime.now(),
                "results": analysis_results
            }
            await mongodb.db.repo_analysis.insert_one(analysis_doc)
        
        # Update quality score in PostgreSQL
        repo.quality_score = analysis_results["quality_score"]
        db.commit()
        
        return {"status": "completed", "message": "Analysis completed successfully."}
        
    except Exception as e:
        return {"status": "error", "message": f"Analysis failed: {str(e)}"}
```

---

## API Documentation

### Complete API Reference

#### Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

#### Endpoints Summary

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/v1/githubrepos/` | List all repositories | ✅ Implemented |
| POST | `/api/v1/githubrepos/` | Create repository | ✅ Implemented |
| POST | `/api/v1/githubrepos/import` | Import from GitHub | ⚠️ Needs implementation |
| GET | `/api/v1/githubrepos/{id}` | Get repository details | ✅ Implemented |
| PUT | `/api/v1/githubrepos/{id}` | Update repository | ⚠️ Needs implementation |
| DELETE | `/api/v1/githubrepos/{id}` | Delete repository | ⚠️ Needs implementation |
| POST | `/api/v1/githubrepos/{id}/analyze` | Trigger AI analysis | ✅ Implemented (mock) |
| POST | `/api/v1/githubrepos/{id}/execute` | Execute in sandbox | ✅ Implemented (simulated) |
| POST | `/api/v1/githubrepos/{id}/ai-tool` | Run AI tool | ⚠️ Needs implementation |
| POST | `/api/v1/githubrepos/bulk/analyze` | Bulk analysis | ⚠️ Needs implementation |

---

## Testing Guide

### Manual Testing

#### 1. Test Repository Creation

```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpassword123" | jq -r '.access_token')

# Create repository
curl -X POST http://localhost:8000/api/v1/githubrepos/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-transformer",
    "owner": "testuser",
    "description": "Transformer implementation",
    "language": "Python",
    "lang_color": "#3572A5",
    "stars": 150,
    "forks": 30,
    "visibility": "Public",
    "repository_url": "https://github.com/testuser/test-transformer"
  }' | jq
```

#### 2. Test Repository Listing

```bash
curl -X GET http://localhost:8000/api/v1/githubrepos/ \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 3. Test Analysis Trigger

```bash
REPO_ID="<repo-id-from-previous-response>"

curl -X POST "http://localhost:8000/api/v1/githubrepos/$REPO_ID/analyze" \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 4. Test Get Details

```bash
curl -X GET "http://localhost:8000/api/v1/githubrepos/$REPO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 5. Test Sandbox Execution

```bash
curl -X POST "http://localhost:8000/api/v1/githubrepos/$REPO_ID/execute?use_gpu=true" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Frontend Testing

1. **Login to application**
   - Navigate to `http://localhost:3000/login`
   - Use test credentials

2. **Navigate to GitHub Repos**
   - Click on "GitHub Repos" in sidebar
   - Should see list of repositories

3. **Test Search and Filter**
   - Type in search box
   - Select language filter
   - Change sort order

4. **Test Repository Details**
   - Click on a repository
   - Check all 6 tabs load correctly

5. **Test Bulk Selection**
   - Select multiple repositories
   - Click "Analyze All"

6. **Test Code Viewer**
   - Go to "Code Intelligence" tab
   - Click on different files
   - Test AI tools

7. **Test Sandbox**
   - Go to "Execution Sandbox" tab
   - Toggle GPU
   - Click "Run Example"

### Automated Testing

Create `backend/tests/test_githubrepos.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def test_token(db_session):
    """Create test user and return token"""
    user = User(email="test@test.com", password_hash="hashed", role="user")
    db_session.add(user)
    db_session.commit()
    return create_access_token(user.id)

def test_list_repositories(test_token):
    """Test GET /githubrepos/"""
    response = client.get(
        "/api/v1/githubrepos/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_repository(test_token):
    """Test POST /githubrepos/"""
    repo_data = {
        "name": "test-repo",
        "owner": "testuser",
        "description": "Test",
        "language": "Python",
        "lang_color": "#3572A5",
        "stars": 0,
        "forks": 0,
        "visibility": "Public",
        "repository_url": "https://github.com/test/repo"
    }
    response = client.post(
        "/api/v1/githubrepos/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=repo_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test-repo"
    assert "id" in data

def test_get_repository_details(test_token, created_repo_id):
    """Test GET /githubrepos/{id}"""
    response = client.get(
        f"/api/v1/githubrepos/{created_repo_id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert "analysis" in data

def test_trigger_analysis(test_token, created_repo_id):
    """Test POST /githubrepos/{id}/analyze"""
    response = client.post(
        f"/api/v1/githubrepos/{created_repo_id}/analyze",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["queued", "completed"]
```


---

## Deployment

### Production Checklist

- [ ] Set strong `SECRET_KEY` in environment
- [ ] Use production-grade PostgreSQL database
- [ ] Configure MongoDB Atlas for production
- [ ] Set up Redis with persistence
- [ ] Configure Supabase buckets with proper RLS
- [ ] Add rate limiting to API endpoints
- [ ] Enable CORS for specific origins only
- [ ] Set up SSL/TLS certificates
- [ ] Configure GitHub OAuth for production
- [ ] Set up monitoring and logging
- [ ] Configure backups for databases
- [ ] Add error tracking (Sentry)

### Docker Production Deployment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    restart: always
    networks:
      - engunity-network

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    restart: always
    networks:
      - engunity-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    restart: always
    networks:
      - engunity-network

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - MONGODB_URL=mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    restart: always
    depends_on:
      - db
      - mongo
      - redis
    networks:
      - engunity-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
    restart: always
    depends_on:
      - backend
    networks:
      - engunity-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infra/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: always
    networks:
      - engunity-network

volumes:
  postgres_data:
  mongo_data:

networks:
  engunity-network:
    driver: bridge
```

### Environment Variables for Production

```bash
# Production .env
POSTGRES_USER=engunity_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=engunity_prod

MONGO_USERNAME=engunity_mongo
MONGO_PASSWORD=<strong-password>

REDIS_PASSWORD=<strong-password>

SECRET_KEY=<generate-with-openssl-rand-hex-32>

GROQ_API_KEY=<your-production-key>
GITHUB_TOKEN=<your-production-token>

API_URL=https://api.yourdomain.com/api/v1
```

---

## Troubleshooting

### Common Issues

#### 1. "Repository not found" Error

**Cause:** Repository doesn't exist or user doesn't have permission

**Solution:**
- Verify repository belongs to current user
- Check repository ID is correct
- Ensure user is authenticated

#### 2. MongoDB Connection Fails

**Cause:** MongoDB not running or wrong connection string

**Solution:**
```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Verify connection string format
# mongodb://localhost:27017 for local
# mongodb+srv://user:pass@cluster.mongodb.net/ for Atlas
```

#### 3. GitHub API Rate Limit

**Cause:** Too many requests to GitHub API without authentication

**Solution:**
- Add `GITHUB_TOKEN` to environment variables
- Use authenticated requests (60 req/hour → 5000 req/hour)

#### 4. Analysis Returns Mock Data

**Cause:** Real AI analysis not implemented

**Solution:**
- Follow "Real AI Analysis Implementation" section above
- Install PyGithub and Groq dependencies
- Set `GROQ_API_KEY` in environment

#### 5. Frontend Can't Connect to Backend

**Cause:** Wrong API URL or CORS issues

**Solution:**
```bash
# Check NEXT_PUBLIC_API_URL in frontend/.env.local
echo $NEXT_PUBLIC_API_URL

# Should be: http://localhost:8000/api/v1 for development

# Check backend CORS settings in backend/app/main.py
# Ensure frontend URL is in allow_origins
```

#### 6. "Table doesn't exist" Error

**Cause:** Database not initialized

**Solution:**
```bash
# Run database initialization
python init_db_tables.py

# Or manually create tables
psql -U user -d engunity -f backend/schema.sql
```

---

## Performance Optimization

### Database Indexing

Add these indexes for better performance:

```sql
-- PostgreSQL indexes
CREATE INDEX idx_repos_user_language ON github_repositories(user_id, language);
CREATE INDEX idx_repos_created_at ON github_repositories(created_at DESC);
CREATE INDEX idx_repos_stars ON github_repositories(stars DESC);

-- MongoDB indexes
db.repo_analysis.createIndex({"repo_id": 1, "timestamp": -1})
db.ai_logs.createIndex({"user_id": 1, "timestamp": -1})
db.ai_logs.createIndex({"event_type": 1, "timestamp": -1})
```

### Caching Strategy

Implement Redis caching for frequently accessed data:

```python
# backend/app/services/github/cache.py

import json
import redis.asyncio as redis
from typing import Optional, Any
from app.core.config import settings

class CacheService:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        value = await self.redis.get(key)
        return json.loads(value) if value else None
    
    async def set(self, key: str, value: Any, expire: int = 3600):
        """Set cached value with expiration"""
        await self.redis.set(key, json.dumps(value), ex=expire)
    
    async def delete(self, key: str):
        """Delete cached value"""
        await self.redis.delete(key)

cache = CacheService()

# Usage in endpoints
@router.get("/{repo_id}")
async def get_repository_details(repo_id: str, ...):
    # Check cache first
    cached = await cache.get(f"repo:{repo_id}")
    if cached:
        return cached
    
    # Fetch from database
    result = {...}
    
    # Cache for 1 hour
    await cache.set(f"repo:{repo_id}", result, expire=3600)
    return result
```

### Background Tasks

Use FastAPI background tasks for long-running operations:

```python
from fastapi import BackgroundTasks

async def perform_analysis_background(repo_id: str, user_id: int):
    """Background task for repository analysis"""
    # Perform expensive AI analysis
    results = await analyzer.analyze_repository(owner, repo_name)
    
    # Store in MongoDB
    await mongodb.db.repo_analysis.insert_one({
        "repo_id": repo_id,
        "timestamp": datetime.now(),
        "results": results
    })

@router.post("/{repo_id}/analyze")
async def trigger_repository_analysis(
    repo_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Queue background task
    background_tasks.add_task(perform_analysis_background, repo_id, current_user.id)
    
    return {"status": "queued", "message": "Analysis started"}
```

---

## Advanced Features

### 1. Real-time Updates with WebSockets

Implement WebSocket for real-time analysis updates:

```python
# backend/app/api/v1/githubrepos.py

from fastapi import WebSocket
from app.core.socket_manager import socket_manager

@router.websocket("/{repo_id}/analysis/ws")
async def analysis_websocket(
    websocket: WebSocket,
    repo_id: str,
    token: str,
):
    await websocket.accept()
    
    try:
        # Perform analysis and send updates
        await websocket.send_json({"status": "started", "progress": 0})
        
        # ... analysis steps ...
        
        await websocket.send_json({"status": "analyzing", "progress": 50})
        
        # ... more analysis ...
        
        await websocket.send_json({"status": "completed", "progress": 100})
        
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})
    finally:
        await websocket.close()
```

### 2. Clone Repository to Supabase

Store cloned repositories in Supabase for offline analysis:

```python
# backend/app/services/github/cloner.py

import subprocess
import tempfile
import shutil
from pathlib import Path
from app.services.storage.supabase import storage_service

class RepoCloner:
    async def clone_and_store(self, repo_url: str, repo_id: str) -> str:
        """Clone repository and upload to Supabase"""
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Clone repository
            subprocess.run(
                ["git", "clone", "--depth", "1", repo_url, tmpdir],
                check=True,
                capture_output=True
            )
            
            # Create tar archive
            archive_path = f"/tmp/{repo_id}.tar.gz"
            shutil.make_archive(archive_path.replace('.tar.gz', ''), 'gztar', tmpdir)
            
            # Upload to Supabase
            with open(archive_path, 'rb') as f:
                await storage_service.upload_file(
                    bucket="repositories",
                    path=f"{repo_id}/source.tar.gz",
                    file_content=f.read(),
                    content_type="application/gzip"
                )
            
            return f"{repo_id}/source.tar.gz"

cloner = RepoCloner()
```

### 3. Research Paper Mapping

Automatically map code to research papers:

```python
# backend/app/services/github/research_mapper.py

class ResearchMapper:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    async def map_to_papers(self, repo_info: Dict, code_analysis: Dict) -> List[Dict]:
        """Map repository implementation to research papers"""
        
        prompt = f"""Given this repository:
Name: {repo_info['name']}
Description: {repo_info['description']}
Language: {repo_info['language']}
Topics: {', '.join(repo_info.get('topics', []))}

Key modules: {', '.join([m['name'] for m in code_analysis.get('modules', [])])}

Suggest 3-5 relevant research papers (with arXiv IDs if available) that this implementation might be based on or related to.

Respond in JSON format:
{{
  "papers": [
    {{
      "title": "Paper title",
      "arxiv_id": "2301.12345",
      "authors": "Author names",
      "year": 2023,
      "relevance": "Why this paper is relevant",
      "mappings": [
        {{"file": "model.py", "line": 45, "symbol": "TransformerBlock"}}
      ]
    }}
  ]
}}
"""
        
        try:
            completion = self.client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            result = json.loads(completion.choices[0].message.content)
            return result.get("papers", [])
        except:
            return []

research_mapper = ResearchMapper()
```

---

## Security Best Practices

### 1. Input Validation

Always validate user inputs:

```python
from pydantic import validator

class GitHubRepositoryCreate(BaseModel):
    name: str
    owner: str
    repository_url: str
    
    @validator('repository_url')
    def validate_github_url(cls, v):
        if not v.startswith('https://github.com/'):
            raise ValueError('Must be a valid GitHub URL')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) > 100:
            raise ValueError('Name too long')
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Invalid repository name')
        return v
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```python
# backend/app/core/rate_limit.py

from fastapi import Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# In main.py
from app.core.rate_limit import limiter
app.state.limiter = limiter

# In endpoints
@router.post("/{repo_id}/analyze")
@limiter.limit("5/minute")
async def trigger_repository_analysis(
    request: Request,
    repo_id: str,
    ...
):
    ...
```

### 3. Sanitize Code Output

Never execute untrusted code directly:

```python
def sanitize_code_output(output: str) -> str:
    """Remove potentially dangerous content from code output"""
    # Remove ANSI escape codes
    import re
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    cleaned = ansi_escape.sub('', output)
    
    # Truncate if too long
    max_length = 10000
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length] + "\n... (truncated)"
    
    return cleaned
```

---

## Monitoring and Logging

### Application Logging

```python
# backend/app/core/logging_config.py

import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('logs/app.log')
        ]
    )

logger = logging.getLogger(__name__)
```

### Performance Monitoring

```python
# Add to endpoints
import time

@router.get("/")
async def get_repositories(...):
    start_time = time.time()
    
    repos = db.query(GitHubRepository).filter(...).all()
    
    duration = time.time() - start_time
    logger.info(f"Repository list fetched in {duration:.3f}s")
    
    return repos
```

---

## Summary

### What Works Now ✅

1. ✅ User authentication with JWT
2. ✅ Repository registration (manual)
3. ✅ Repository listing with search/filter
4. ✅ Basic repository details view
5. ✅ Mock AI analysis storage
6. ✅ Sandbox execution simulation
7. ✅ Full-featured frontend UI with 6 tabs
8. ✅ PostgreSQL + MongoDB integration
9. ✅ Redis caching infrastructure

### What Needs Implementation ⚠️

1. ⚠️ GitHub API integration for importing repos
2. ⚠️ Real AI analysis using Groq/Gemini
3. ⚠️ Bulk analysis endpoint
4. ⚠️ AI tool execution endpoint
5. ⚠️ Research paper mapping
6. ⚠️ Real security scanning
7. ⚠️ Repository cloning to Supabase
8. ⚠️ WebSocket real-time updates
9. ⚠️ Update/Delete repository endpoints

### Quick Implementation Priority

**Priority 1 (Essential):**
1. GitHub API integration (`/import` endpoint)
2. AI tool endpoint (`/ai-tool`)
3. Bulk analysis endpoint (`/bulk/analyze`)

**Priority 2 (Enhanced Features):**
4. Real AI analysis with Groq
5. Research paper mapping
6. Security scanning

**Priority 3 (Advanced):**
7. Repository cloning
8. WebSocket updates
9. Advanced caching

---

## Support and Resources

### Documentation Links

- **FastAPI**: https://fastapi.tiangolo.com/
- **Next.js**: https://nextjs.org/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **MongoDB**: https://www.mongodb.com/docs/
- **PyGithub**: https://pygithub.readthedocs.io/
- **Groq API**: https://console.groq.com/docs/

### Getting Help

- Check logs in `backend/logs/app.log`
- Use FastAPI interactive docs: `http://localhost:8000/docs`
- MongoDB shell: `mongosh` for debugging
- PostgreSQL shell: `psql` for database inspection

### Contributing

When adding new features:
1. Update database models if needed
2. Add API endpoint to `githubrepos.py`
3. Update schemas in `schemas/github.py`
4. Add frontend service function
5. Update this documentation
6. Write tests

---

**Last Updated:** January 22, 2026

**Document Version:** 1.0

**Status:** Complete Implementation Guide

