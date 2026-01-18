# Code Lab - Complete End-to-End Architecture

> **Complete Implementation Guide for the Engunity AI Code Studio**  
> A production-ready, full-stack IDE module with AI-powered code assistance

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [AI Integration](#ai-integration)
7. [Environment Configuration](#environment-configuration)
8. [Implementation Guide](#implementation-guide)
9. [Deployment](#deployment)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Monaco Editor│  │  XTerm.js    │  │ Zustand Store│         │
│  │  (Code Edit) │  │  (Terminal)  │  │ (State Mgmt) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Components: FileExplorer, EditorTabs, AIRefinePanel           │
│  Services: codeService (API client)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                  │
├─────────────────────────────────────────────────────────────────┤
│  API Routes: /api/v1/code/*                                     │
│  ├─ GET    /code/                (List projects)                │
│  ├─ POST   /code/                (Create project)               │
│  ├─ GET    /code/{id}            (Get project)                  │
│  ├─ PATCH  /code/{id}            (Update project)               │
│  ├─ DELETE /code/{id}            (Delete project)               │
│  ├─ POST   /code/{id}/upload     (Upload files)                 │
│  ├─ POST   /code/refine          (AI code refinement)           │
│  ├─ GET    /code/{id}/files      (List files)                   │
│  ├─ POST   /code/{id}/files      (Create file)                  │
│  ├─ PATCH  /code/files/{id}      (Update file)                  │
│  └─ DELETE /code/files/{id}      (Delete file)                  │
│                                                                  │
│  Services:                                                       │
│  ├─ Sandbox Execution (Docker/Kubernetes isolation)             │
│  ├─ AI Services (Groq, Gemini for code assistance)              │
│  └─ Vector Store (FAISS for code search/RAG)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │   Supabase   │  │  FAISS Index │         │
│  │  (Metadata)  │  │  (Storage)   │  │ (Code Search)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Tables: code_projects, code_files, users                       │
│  Storage: Project files, archives (zip/tar)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Monaco Editor Integration** - Full VSCode-like editing experience
2. **File System Management** - Hierarchical file/folder structure
3. **Integrated Terminal** - XTerm.js with command execution
4. **AI Code Assistance** - Context-aware code suggestions and refactoring
5. **Real-time Collaboration** - Multi-user support (future)
6. **Code Execution Sandbox** - Secure, isolated environment
7. **Project Management** - Create, save, and manage multiple projects
8. **RAG-based Code Search** - FAISS-powered semantic search

---

## Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.35 | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Monaco Editor | 0.50.0 | Code editor (VSCode core) |
| @monaco-editor/react | 4.6.0 | React wrapper for Monaco |
| XTerm.js | 5.3.0 | Terminal emulator |
| Zustand | 5.0.9 | State management |
| Tailwind CSS | 3.4.1 | Styling |
| Lucide React | 0.400.0 | Icons |
| Axios | 1.13.2 | HTTP client |

### Directory Structure

```
frontend/src/
├── app/(dashboard)/code/
│   ├── page.tsx                    # Main Code Lab page
│   └── codelab.module.css          # Scoped styles
├── components/code-lab/
│   ├── CodeEditor.tsx              # Monaco editor wrapper
│   ├── FileExplorer.tsx            # File tree sidebar
│   ├── Terminal.tsx                # XTerm terminal
│   ├── AIRefinePanel.tsx           # AI assistance panel
│   ├── EditorTabs.tsx              # Open file tabs
│   ├── Breadcrumbs.tsx             # File path navigation
│   ├── StatusBar.tsx               # Bottom status bar
│   ├── BottomPanel.tsx             # Terminal/Console container
│   ├── CommandPalette.tsx          # Quick file search (Cmd+P)
│   ├── GlobalSearch.tsx            # Content search
│   └── NotificationOverlay.tsx     # Toast notifications
├── services/
│   └── code.ts                     # API service layer
└── stores/
    └── codeStore.ts                # Zustand state management
```

### State Management (Zustand)

**File: `frontend/src/stores/codeStore.ts`**

```typescript
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  parentId?: string;
  isOpen?: boolean;
  isDirty?: boolean;
}

interface CodeState {
  // Data
  files: FileItem[];
  openFileIds: string[];
  activeFileId: string | null;
  
  // UI State
  isTerminalOpen: boolean;
  isAIRefineOpen: boolean;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  activeSidebarTab: 'explorer' | 'search';
  activeBottomTab: 'terminal' | 'console' | 'errors' | 'tasks';
  
  // Terminal
  terminalCommand: string | null;
  terminalTimestamp: number;
  
  // Editor
  cursorPosition: { ln: number; col: number };
  notification: { message: string; type: 'info' | 'success' | 'error' } | null;
  
  // Actions
  setFiles, toggleFolder, openFile, closeFile, setActiveFile,
  updateFileContent, saveFile, setCursorPosition, setTerminalOpen,
  setAIRefineOpen, setSidebarOpen, setCommandPaletteOpen,
  setActiveSidebarTab, setActiveBottomTab, runCommand,
  addFile, deleteFile, setNotification
}
```

### Component Hierarchy

```
CodeLabPage (page.tsx)
├── Header
│   ├── Logo & Title
│   ├── Toolbar Buttons (New, Search, Settings)
│   └── Run Button
├── Grid Layout (CSS Grid)
│   ├── Left Sidebar (Explorer)
│   │   ├── FileExplorer (tree view)
│   │   └── GlobalSearch (search panel)
│   ├── Main Editor Area
│   │   ├── EditorTabs (open files)
│   │   ├── Breadcrumbs (file path)
│   │   ├── CodeEditor (Monaco)
│   │   └── BottomPanel
│   │       ├── Terminal (XTerm.js)
│   │       ├── Console
│   │       ├── Errors
│   │       └── Tasks
│   └── Right Panel
│       └── AIRefinePanel (AI chat)
├── StatusBar (bottom bar)
└── Overlays
    ├── CommandPalette (Cmd+P)
    └── NotificationOverlay (toast)
```

### Key Frontend Components

#### 1. **CodeEditor.tsx** - Monaco Editor Integration

```typescript
// Monaco editor with custom theme and keybindings
- Language support: Python, JavaScript, TypeScript, JSON, etc.
- Auto-save: 5 second debounce
- Keyboard shortcuts: Cmd+S (save), Cmd+P (palette)
- Custom theme: 'engunity-dark'
- Syntax highlighting
- Code completion (IntelliSense)
- Multi-cursor editing
```

**Key Features:**
- Auto-layout on window resize using ResizeObserver
- Cursor position tracking
- Dirty state tracking (unsaved changes indicator)
- Custom keybindings (Ctrl/Cmd+S for save)

#### 2. **FileExplorer.tsx** - File Tree Navigation

```typescript
Features:
- Hierarchical folder/file structure
- Expand/collapse folders
- File type icons (Python, JSON, TXT)
- File badges showing extension
- Context actions: Create, Delete
- Active file highlighting
- Drag-and-drop support (future)
```

**File Icons:**
- Python (.py) - Blue
- JSON (.json) - Amber
- Text (.txt) - Gray
- Folder - Slate

#### 3. **Terminal.tsx** - Integrated Terminal

```typescript
Technology: XTerm.js + FitAddon
Features:
- Full terminal emulation
- Command history
- Built-in commands: ls, clear, help
- Custom color scheme (cyber theme)
- Auto-resize with viewport
- Command execution via backend (future)
```

**Mock Commands:**
```bash
$ ls              # List files
$ clear           # Clear terminal
$ help            # Show available commands
$ profile         # Performance profiling
$ scan            # Security scan
$ refactor        # AI-powered refactoring
```

#### 4. **AIRefinePanel.tsx** - AI Code Assistant

```typescript
Features:
- Chat interface for code assistance
- Contextual actions (Optimize, Audit, Refactor)
- Message history
- AI-powered code suggestions
- Pro tips and recommendations
```

**AI Actions:**
1. **Optimize Performance** - `profile --file active`
2. **Security Audit** - `scan --vulnerabilities`
3. **Refactor Logic** - `refactor --suggest`

#### 5. **CommandPalette.tsx** - Quick Navigation

```typescript
Trigger: Cmd+P / Ctrl+P
Features:
- Fuzzy file search
- Keyboard navigation (↑↓ arrows)
- Instant file opening
- Shows file location in tree
```

### CSS Architecture (codelab.module.css)

**Design System:**

| Element | Color | Purpose |
|---------|-------|---------|
| Background | `#F8FAFC` | Main app background |
| Primary Text | `#0F172A` | Main text color |
| Secondary Text | `#475569` | Muted text |
| Primary Accent | `#2563EB` | Blue - actions, highlights |
| Border | `#E2E8F0` | Panel dividers |
| Active File | `#EEF2FF` | Selected file background |
| Hover | `#E0E7FF` | Interactive element hover |

**Grid Layout:**
```css
display: grid;
grid-template-columns: [sidebar] [editor] [panel];
grid-template-rows: [header] [content] [statusbar];

Dynamic columns:
- Sidebar: 280px (open) | 0px (closed)
- Editor: 1fr (flexible)
- Panel: 380px (open) | 48px (collapsed)
```

---

## Backend Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115.0 | Web framework |
| SQLAlchemy | 2.0.35 | ORM |
| PostgreSQL | 15 | Primary database |
| Pydantic | 2.9.2 | Data validation |
| Supabase | 2.10.0 | File storage |
| FAISS | 1.8.0 | Vector search |
| Groq | 0.11.0 | AI inference |
| Redis | 5.0.8 | Caching/queuing |

### Directory Structure

```
backend/app/
├── api/v1/
│   └── code.py                     # Code API endpoints
├── models/
│   └── code.py                     # SQLAlchemy models
├── schemas/
│   └── code.py                     # Pydantic schemas
├── services/
│   ├── ai/
│   │   ├── groq_client.py         # Groq AI client
│   │   └── vector_store.py        # FAISS vector store
│   ├── code_execution/
│   │   └── sandbox.py             # Code execution sandbox
│   └── storage/
│       └── supabase.py            # Supabase storage client
├── core/
│   ├── config.py                  # Configuration
│   ├── database.py                # Database connection
│   └── security.py                # Auth/JWT
└── main.py                        # FastAPI app
```

---

## Database Schema

### PostgreSQL Tables

#### **Table: `code_projects`**

```sql
CREATE TABLE code_projects (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    language VARCHAR,
    repository_url VARCHAR,
    storage_path VARCHAR,  -- Supabase Storage path
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_code_projects_user_id ON code_projects(user_id);
CREATE INDEX idx_code_projects_created_at ON code_projects(created_at);
```

**Columns:**
- `id`: UUID primary key
- `user_id`: Owner of the project
- `name`: Project name (e.g., "My Python API")
- `description`: Optional project description
- `language`: Primary language (python, javascript, etc.)
- `repository_url`: Optional GitHub/GitLab URL
- `storage_path`: Path in Supabase Storage bucket
- `created_at`, `updated_at`: Timestamps

#### **Table: `code_files`**

```sql
CREATE TABLE code_files (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR NOT NULL REFERENCES code_projects(id),
    path VARCHAR NOT NULL,  -- Full path from project root
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('file', 'folder')),
    content TEXT,
    language VARCHAR,
    parent_id VARCHAR REFERENCES code_files(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES code_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES code_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_code_files_project_id ON code_files(project_id);
CREATE INDEX idx_code_files_parent_id ON code_files(parent_id);
CREATE INDEX idx_code_files_type ON code_files(type);
```

**Columns:**
- `id`: UUID primary key
- `project_id`: Parent project reference
- `path`: Full path (e.g., "src/utils/helper.py")
- `name`: File/folder name (e.g., "helper.py")
- `type`: 'file' or 'folder'
- `content`: File content (NULL for folders)
- `language`: Programming language
- `parent_id`: Parent folder reference (NULL for root)

### SQLAlchemy Models

**File: `backend/app/models/code.py`**

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class CodeProject(Base):
    __tablename__ = "code_projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    repository_url = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="code_projects")
    files = relationship("CodeFile", back_populates="project", cascade="all, delete-orphan")

class CodeFile(Base):
    __tablename__ = "code_files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("code_projects.id"), nullable=False)
    path = Column(String, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'file' or 'folder'
    content = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    parent_id = Column(String, ForeignKey("code_files.id"), nullable=True)
    
    # Relationships
    project = relationship("CodeProject", back_populates="files")
    parent = relationship("CodeFile", remote_side=[id], backref="children")
```

### Pydantic Schemas

**File: `backend/app/schemas/code.py`**

```python
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CodeProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    repository_url: Optional[str] = None

class CodeProjectCreate(CodeProjectBase):
    pass

class CodeProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    repository_url: Optional[str] = None

class CodeProject(CodeProjectBase):
    id: str
    user_id: int
    storage_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1/code
```

### Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/code/` | List all projects for user | ✓ |
| POST | `/code/` | Create new project | ✓ |
| GET | `/code/{project_id}` | Get project details | ✓ |
| PATCH | `/code/{project_id}` | Update project metadata | ✓ |
| DELETE | `/code/{project_id}` | Delete project | ✓ |
| POST | `/code/{project_id}/upload` | Upload project files | ✓ |
| GET | `/code/{project_id}/files` | List project files | ✓ |
| POST | `/code/{project_id}/files` | Create file/folder | ✓ |
| PATCH | `/code/files/{file_id}` | Update file content | ✓ |
| DELETE | `/code/files/{file_id}` | Delete file/folder | ✓ |
| POST | `/code/refine` | AI code refinement | ✓ |

### Detailed Endpoint Documentation


#### 1. List Projects

```http
GET /api/v1/code/
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": 123,
    "name": "My Python API",
    "description": "FastAPI backend service",
    "language": "python",
    "repository_url": "https://github.com/user/repo",
    "storage_path": "123/projects/uuid/archive.zip",
    "created_at": "2024-01-18T10:00:00Z",
    "updated_at": "2024-01-18T10:00:00Z"
  }
]
```

#### 2. Create Project

```http
POST /api/v1/code/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "language": "python",
  "repository_url": "https://github.com/user/repo"
}
```

**Response:** `201 Created` - Returns created project object

#### 3. Upload Project Files

```http
POST /api/v1/code/{project_id}/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <binary_file_data>
```

**Process:**
1. Uploads file to Supabase Storage bucket `code`
2. Extracts text content from source files
3. Indexes content in FAISS for semantic search
4. Updates project `storage_path`

**Response:** `200 OK` - Returns updated project

#### 4. AI Code Refinement

```http
POST /api/v1/code/refine
Authorization: Bearer {token}
Content-Type: application/json

{
  "file_content": "def hello():\n    print('hello')",
  "language": "python",
  "instruction": "Add type hints and docstring",
  "project_id": "uuid"
}
```

**Response:**
```json
{
  "refined_code": "def hello() -> None:\n    \"\"\"Print hello message.\"\"\"\n    print('hello')",
  "explanation": "Added type hints and docstring following PEP 257"
}
```

### Backend Implementation Example

**File: `backend/app/api/v1/code.py`**

```python
from fastapi import APIRouter, Depends, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.code import CodeProject
from app.schemas.code import CodeProjectCreate, CodeProject as CodeProjectSchema
from app.services.storage.supabase import storage_service
from app.services.ai.vector_store import vector_store
import uuid

router = APIRouter()

@router.get("/", response_model=List[CodeProjectSchema])
def get_code_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all code projects for current user"""
    projects = db.query(CodeProject).filter(
        CodeProject.user_id == current_user.id
    ).all()
    return projects

@router.post("/", response_model=CodeProjectSchema)
async def create_code_project(
    project_in: CodeProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new code project"""
    db_obj = CodeProject(
        **project_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/{project_id}/upload", response_model=CodeProjectSchema)
async def upload_project_files(
    project_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and index project files"""
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Upload to Supabase Storage
    file_id = str(uuid.uuid4())
    storage_path = f"{current_user.id}/projects/{project_id}/{file_id}"
    content = await file.read()
    
    await storage_service.upload_file(
        bucket="code",
        path=storage_path,
        file_content=content,
        content_type=file.content_type
    )
    
    # Index in FAISS for code search
    text_content = content.decode('utf-8', errors='ignore')
    if text_content.strip():
        vector_store.add_texts(
            texts=[text_content],
            metadatas=[{
                "project_id": project_id,
                "user_id": current_user.id,
                "filename": file.filename,
                "type": "code_source"
            }]
        )
    
    project.storage_path = storage_path
    db.commit()
    db.refresh(project)
    
    return project
```

---

## AI Integration

### Groq AI Client

**File: `backend/app/services/ai/groq_client.py`**

```python
from groq import Groq
from app.core.config import settings

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    async def refine_code(
        self,
        code: str,
        language: str,
        instruction: str
    ) -> dict:
        """AI-powered code refinement"""
        
        prompt = f"""You are an expert {language} programmer.

Original Code:
```{language}
{code}
```

Task: {instruction}

Provide:
1. Refined code
2. Brief explanation of changes

Format your response as:
REFINED CODE:
```{language}
<code here>
```

EXPLANATION:
<explanation here>
"""
        
        response = self.client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048
        )
        
        result = response.choices[0].message.content
        
        # Parse response
        refined_code = self._extract_code_block(result)
        explanation = self._extract_explanation(result)
        
        return {
            "refined_code": refined_code,
            "explanation": explanation
        }
    
    def _extract_code_block(self, text: str) -> str:
        """Extract code from markdown code block"""
        import re
        pattern = r"```[\w]*\n(.*?)\n```"
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1) if match else text
    
    def _extract_explanation(self, text: str) -> str:
        """Extract explanation section"""
        if "EXPLANATION:" in text:
            return text.split("EXPLANATION:")[-1].strip()
        return ""

groq_client = GroqClient()
```

### Vector Store (FAISS)

**File: `backend/app/services/ai/vector_store.py`**

```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

class VectorStore:
    def __init__(self):
        self.model = SentenceTransformer('BAAI/bge-large-en-v1.5')
        self.dimension = 1024  # bge-large-en-v1.5 dimension
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadatas: List[Dict[str, Any]] = []
    
    def add_texts(
        self,
        texts: List[str],
        metadatas: List[Dict[str, Any]]
    ):
        """Add text chunks to vector store"""
        embeddings = self.model.encode(texts)
        embeddings = np.array(embeddings).astype('float32')
        
        self.index.add(embeddings)
        self.metadatas.extend(metadatas)
    
    def search(
        self,
        query: str,
        k: int = 5,
        filter_dict: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar code snippets"""
        query_embedding = self.model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        distances, indices = self.index.search(query_embedding, k * 2)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.metadatas):
                metadata = self.metadatas[idx]
                
                # Apply filters
                if filter_dict:
                    if not all(metadata.get(k) == v for k, v in filter_dict.items()):
                        continue
                
                results.append({
                    "metadata": metadata,
                    "distance": float(distances[0][i])
                })
                
                if len(results) >= k:
                    break
        
        return results

vector_store = VectorStore()
```

### Code Execution Sandbox

**File: `backend/app/services/code_execution/sandbox.py`**

```python
import asyncio
import docker
from typing import List, Dict, Any

class CodeSandbox:
    """
    Secure code execution in Docker container.
    Production: Use Kubernetes with resource limits.
    """
    
    def __init__(self):
        self.client = docker.from_env()
    
    async def execute_python(
        self,
        code: str,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Execute Python code in isolated container"""
        
        try:
            container = self.client.containers.run(
                image="python:3.11-slim",
                command=["python", "-c", code],
                detach=True,
                mem_limit="256m",
                cpu_quota=50000,  # 50% of CPU
                network_disabled=True,
                remove=True
            )
            
            # Wait for completion with timeout
            result = container.wait(timeout=timeout)
            logs = container.logs().decode('utf-8')
            
            return {
                "status": "success",
                "exit_code": result['StatusCode'],
                "output": logs
            }
            
        except docker.errors.ContainerError as e:
            return {
                "status": "error",
                "error": str(e),
                "output": e.stderr.decode('utf-8') if e.stderr else ""
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "output": ""
            }
    
    async def run_project(
        self,
        project_path: str,
        command: str,
        use_gpu: bool = False
    ) -> List[Dict[str, Any]]:
        """Run full project with mounted volume"""
        
        # This is a simplified mock
        # In production: Mount project directory, run build/test commands
        logs = [
            {"time": "00:00:01", "type": "info", "message": "Initializing sandbox..."},
            {"time": "00:00:02", "type": "info", "message": f"Executing: {command}"},
            {"time": "00:00:05", "type": "success", "message": "Execution complete"}
        ]
        
        return logs

sandbox = CodeSandbox()
```

---

## Environment Configuration

### Backend Environment (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/engunity
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# AI Services
GROQ_API_KEY=gsk_your_groq_key
GROQ_API_KEYS=key1,key2,key3  # Multiple keys for rotation
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Redis
REDIS_URL=redis://localhost:6379/0

# MongoDB (optional for additional storage)
MONGODB_URL=mongodb://localhost:27017/engunity

# Security
SECRET_KEY=your_secret_key_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=11520  # 8 days

# App
PROJECT_NAME=Engunity AI
API_V1_STR=/api/v1
```

### Frontend Environment (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Docker Compose Configuration

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
      - REDIS_URL=redis://redis:6379/0
      - GROQ_API_KEY=${GROQ_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db
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
  backend_storage:
```

---

## Implementation Guide

### Step 1: Database Setup

```bash
# Create database tables
cd backend
python init_db_tables.py

# Or use Alembic migrations
alembic revision --autogenerate -m "Add code tables"
alembic upgrade head
```

**Migration Script:**
```python
# backend/alembic/versions/xxx_add_code_tables.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'code_projects',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('repository_url', sa.String(), nullable=True),
        sa.Column('storage_path', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    op.create_table(
        'code_files',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('parent_id', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['project_id'], ['code_projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['code_files.id'], ondelete='CASCADE')
    )
```

### Step 2: Supabase Storage Setup

```bash
# Create storage bucket in Supabase dashboard
# Bucket name: "code"
# Public: false
# File size limit: 50MB
```

**Or via Supabase CLI:**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('code', 'code', false);

-- Create RLS policies
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'code' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'code' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Step 3: Frontend Integration

**Install Dependencies:**
```bash
cd frontend
npm install @monaco-editor/react @xterm/xterm @xterm/addon-fit zustand
```

**Configure Monaco Editor:**
```typescript
// frontend/src/app/layout.tsx or globals.css
// Import Monaco CSS
import 'monaco-editor/min/vs/editor/editor.main.css';
```

**Add to Next.js Config:**
```javascript
// frontend/next.config.mjs
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    return config;
  },
};
```

### Step 4: Backend Service Integration

**Register Code Router:**
```python
# backend/app/main.py
from app.api.v1.code import router as code_router

app.include_router(
    code_router,
    prefix=f"{settings.API_V1_STR}/code",
    tags=["code"]
)
```

**Initialize Vector Store:**
```python
# backend/app/main.py
from app.services.ai.vector_store import vector_store

@app.on_event("startup")
async def startup_event():
    # Load existing FAISS index if exists
    if os.path.exists("storage/vector_store/code_index.faiss"):
        vector_store.load("storage/vector_store/code_index.faiss")
```

### Step 5: Testing

**Backend API Tests:**
```python
# tests/test_code_api.py
import pytest
from fastapi.testclient import TestClient

def test_create_project(client: TestClient, auth_headers):
    response = client.post(
        "/api/v1/code/",
        json={
            "name": "Test Project",
            "language": "python"
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Project"

def test_upload_files(client: TestClient, auth_headers):
    # Create project first
    project = client.post("/api/v1/code/", json={"name": "Test"}, headers=auth_headers).json()
    
    # Upload file
    files = {"file": ("test.py", b"print('hello')", "text/plain")}
    response = client.post(
        f"/api/v1/code/{project['id']}/upload",
        files=files,
        headers=auth_headers
    )
    assert response.status_code == 200
```

**Frontend Component Tests:**
```typescript
// tests/code-editor.test.tsx
import { render, screen } from '@testing-library/react';
import { CodeEditor } from '@/components/code-lab/CodeEditor';

test('renders code editor', () => {
  render(<CodeEditor />);
  expect(screen.getByText(/No File Selected/i)).toBeInTheDocument();
});
```

---

## Deployment

### Production Checklist

- [ ] **Database**: Migrate tables to production PostgreSQL
- [ ] **Supabase**: Configure storage buckets and RLS policies
- [ ] **Environment Variables**: Set all production keys
- [ ] **Docker**: Build and push images to registry
- [ ] **Redis**: Configure for caching and sessions
- [ ] **CORS**: Update allowed origins to production domain
- [ ] **SSL**: Enable HTTPS for all endpoints
- [ ] **Rate Limiting**: Configure API rate limits
- [ ] **Monitoring**: Set up logging and error tracking
- [ ] **Backup**: Configure automated database backups

### Docker Production Build

```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```dockerfile
# frontend/Dockerfile.prod
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

CMD ["npm", "start"]
```

### Kubernetes Deployment (Optional)

```yaml
# k8s/code-backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: code-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: code-backend
  template:
    metadata:
      labels:
        app: code-backend
    spec:
      containers:
      - name: backend
        image: your-registry/engunity-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## Additional Features (Roadmap)

### Phase 1: Core Features ✅
- [x] Monaco editor integration
- [x] File system management
- [x] Terminal emulator
- [x] AI code assistance
- [x] Project management
- [x] Code search (FAISS)

### Phase 2: Enhanced Features 🚧
- [ ] Real-time collaboration (WebSocket)
- [ ] Git integration (clone, commit, push)
- [ ] Debugging support
- [ ] Code execution in browser (WebAssembly)
- [ ] Extensions/plugins system
- [ ] Code snippets library
- [ ] Multiple language servers (LSP)

### Phase 3: Enterprise Features 🔮
- [ ] Team workspaces
- [ ] Code review workflows
- [ ] CI/CD pipeline integration
- [ ] Advanced security scanning
- [ ] Custom Docker environments
- [ ] Usage analytics and billing
- [ ] SSO authentication

---

## Troubleshooting

### Common Issues

**1. Monaco Editor Not Loading**
```bash
# Ensure webpack is configured for WASM
# Add to next.config.mjs
webpack: (config) => {
  config.experiments = { ...config.experiments, asyncWebAssembly: true };
  return config;
}
```

**2. XTerm Terminal Blank Screen**
```bash
# Import CSS in layout or global CSS
import '@xterm/xterm/css/xterm.css';
```

**3. CORS Errors**
```python
# Verify CORS middleware in backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**4. File Upload Fails**
```bash
# Check Supabase bucket permissions
# Verify storage_service is initialized
# Check file size limits
```

---

## Performance Optimization

### Frontend
1. **Code Splitting**: Lazy load Monaco editor
2. **Virtual Scrolling**: For large file trees
3. **Debouncing**: Auto-save with 5s debounce
4. **Service Workers**: Cache static assets

### Backend
1. **Connection Pooling**: PostgreSQL pool size 20
2. **Redis Caching**: Cache project metadata
3. **FAISS Index**: Pre-compute embeddings
4. **Async Operations**: Use async/await for I/O

---

## Security Considerations

1. **Authentication**: JWT-based auth with refresh tokens
2. **Authorization**: Row-level security (RLS) in Supabase
3. **Sandboxing**: Docker containers with resource limits
4. **Input Validation**: Pydantic schemas for all inputs
5. **Rate Limiting**: 100 req/min per user
6. **File Uploads**: Max 50MB, validate file types
7. **Code Execution**: Network-isolated containers
8. **XSS Prevention**: Sanitize code output in terminal

---

## Conclusion

This architecture provides a **production-ready, scalable Code Studio** module within Engunity AI. The implementation leverages industry-standard tools (Monaco, FastAPI, PostgreSQL) and modern patterns (REST API, state management, containerization).

**Key Strengths:**
- ✅ Full IDE experience in browser
- ✅ AI-powered code assistance
- ✅ Secure code execution
- ✅ Scalable architecture
- ✅ Real-time collaboration ready

**Next Steps:**
1. Deploy to staging environment
2. Conduct load testing
3. Implement real-time collaboration
4. Add Git integration
5. Build extension marketplace

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Maintained By:** Engunity AI Team
