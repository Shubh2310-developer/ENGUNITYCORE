# Code Lab - Quick Reference Guide

## 🚀 Quick Start Commands

### Start Development Environment
```bash
# Using Docker Compose
docker-compose up -d

# Or manually
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000/code
- **Backend API**: http://localhost:8000/api/v1/code
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure at a Glance

```
Engunity/
├── frontend/src/
│   ├── app/(dashboard)/code/page.tsx          # Main Code Lab page
│   ├── components/code-lab/                   # All UI components
│   ├── services/code.ts                       # API client
│   └── stores/codeStore.ts                    # State management
│
├── backend/app/
│   ├── api/v1/code.py                        # REST endpoints
│   ├── models/code.py                        # Database models
│   ├── schemas/code.py                       # Validation schemas
│   └── services/
│       ├── ai/groq_client.py                 # AI integration
│       ├── ai/vector_store.py                # FAISS search
│       └── code_execution/sandbox.py         # Code runner
│
└── docs/architecture/
    └── CODE_LAB_COMPLETE_ARCHITECTURE.md     # Full documentation
```

---

## 🎯 Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Editor** | Monaco Editor | VSCode-like code editing |
| **Terminal** | XTerm.js | Full terminal emulation |
| **State** | Zustand | Global state management |
| **Backend** | FastAPI | REST API framework |
| **Database** | PostgreSQL | Metadata storage |
| **Storage** | Supabase | File storage |
| **Search** | FAISS | Semantic code search |
| **AI** | Groq/Gemini | Code assistance |

---

## 🔑 Essential API Endpoints

```bash
# List projects
GET /api/v1/code/

# Create project
POST /api/v1/code/
Body: {"name": "Project Name", "language": "python"}

# Upload files
POST /api/v1/code/{project_id}/upload
Body: multipart/form-data with 'file' field

# AI code refinement
POST /api/v1/code/refine
Body: {
  "file_content": "code here",
  "language": "python",
  "instruction": "Add type hints"
}

# File operations
GET    /api/v1/code/{project_id}/files
POST   /api/v1/code/{project_id}/files
PATCH  /api/v1/code/files/{file_id}
DELETE /api/v1/code/files/{file_id}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + P` | Open command palette (file search) |
| `Cmd/Ctrl + S` | Save current file |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + Shift + F` | Global search |
| `Esc` | Close command palette |

---

## 🎨 Component Quick Reference

### Main Components

```typescript
// CodeEditor - Monaco editor wrapper
<CodeEditor />
// Features: Auto-save, syntax highlighting, IntelliSense

// FileExplorer - File tree
<FileExplorer />
// Features: Hierarchical structure, CRUD operations

// Terminal - Integrated terminal
<Terminal />
// Features: Command execution, XTerm.js

// AIRefinePanel - AI assistant
<AIRefinePanel />
// Features: Chat interface, code suggestions

// CommandPalette - Quick navigation
<CommandPalette />
// Trigger: Cmd+P, fuzzy search
```

---

## 🗄️ Database Schema Quick View

### code_projects
```sql
id              VARCHAR (PK)
user_id         INTEGER (FK -> users.id)
name            VARCHAR
description     TEXT
language        VARCHAR
repository_url  VARCHAR
storage_path    VARCHAR
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### code_files
```sql
id              VARCHAR (PK)
project_id      VARCHAR (FK -> code_projects.id)
path            VARCHAR
name            VARCHAR
type            VARCHAR ('file' | 'folder')
content         TEXT
language        VARCHAR
parent_id       VARCHAR (FK -> code_files.id)
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/engunity
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
GROQ_API_KEY=gsk_your_key
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your_secret_key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🛠️ Common Tasks

### Add a New File Type Icon
```typescript
// frontend/src/components/code-lab/FileExplorer.tsx
const FileIcon = ({ name, type }) => {
  const ext = name.split('.').pop();
  switch (ext) {
    case 'rs': return <FileCode className="text-orange-500" />;
    case 'go': return <FileCode className="text-blue-500" />;
    // Add more...
  }
}
```

### Add New AI Action
```typescript
// frontend/src/components/code-lab/AIRefinePanel.tsx
const suggestions = [
  { icon: Zap, label: 'Your Action', command: 'your-command' },
  // Add to array
];
```

### Create Custom Terminal Command
```typescript
// frontend/src/components/code-lab/Terminal.tsx
term.onData(data => {
  if (command === 'mycmd') {
    term.writeln('\r\nCustom output here');
  }
});
```

---

## 📊 State Management Structure

```typescript
// Zustand Store (codeStore.ts)
{
  // Data
  files: FileItem[],
  openFileIds: string[],
  activeFileId: string | null,
  
  // UI State
  isTerminalOpen: boolean,
  isAIRefineOpen: boolean,
  isSidebarOpen: boolean,
  
  // Actions
  openFile(id),
  closeFile(id),
  updateFileContent(id, content),
  saveFile(id),
  runCommand(command)
}
```

---

## 🐛 Quick Debugging

### Backend Issues
```bash
# Check database connection
python -c "from app.core.database import engine; print(engine.url)"

# Test API endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/code/

# View logs
docker-compose logs -f backend
```

### Frontend Issues
```bash
# Clear Next.js cache
rm -rf .next

# Check API connection
curl http://localhost:8000/health

# Console debugging
// In browser console
localStorage.getItem('auth-storage')
```

---

## 📦 Dependencies

### Frontend Package.json Essentials
```json
{
  "@monaco-editor/react": "^4.6.0",
  "@xterm/xterm": "^5.3.0",
  "@xterm/addon-fit": "^0.10.0",
  "zustand": "^5.0.9",
  "next": "^14.2.35",
  "react": "^18"
}
```

### Backend Requirements.txt Essentials
```txt
fastapi==0.115.0
uvicorn[standard]==0.31.0
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
groq==0.11.0
faiss-cpu==1.8.0
sentence-transformers==3.1.1
supabase==2.10.0
```

---

## 🚨 Error Solutions

### "Monaco editor not loading"
```javascript
// next.config.mjs
webpack: (config) => {
  config.experiments = { asyncWebAssembly: true };
  return config;
}
```

### "CORS error from backend"
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### "File upload fails"
```bash
# Check Supabase bucket exists and has correct policies
# Verify SUPABASE_SERVICE_ROLE_KEY is set
# Check file size < 50MB
```

---

## 📈 Performance Tips

1. **Lazy Load Monaco**: Only load when code page is accessed
2. **Debounce Auto-save**: Current setting is 5 seconds
3. **Virtual Scrolling**: For file trees with 1000+ files
4. **Redis Caching**: Cache project metadata (5 min TTL)
5. **FAISS Indexing**: Batch embeddings in groups of 100

---

## 🔗 Important Links

- **Full Architecture Doc**: `docs/architecture/CODE_LAB_COMPLETE_ARCHITECTURE.md`
- **API Documentation**: http://localhost:8000/docs (when running)
- **Monaco Editor Docs**: https://microsoft.github.io/monaco-editor/
- **XTerm.js Docs**: https://xtermjs.org/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## 💡 Pro Tips

1. Use `Cmd+P` for lightning-fast file navigation
2. AI Refine works best with specific instructions
3. Terminal supports ANSI color codes
4. File tree supports nested folders (unlimited depth)
5. Auto-save triggers after 5 seconds of inactivity
6. All state is managed centrally in Zustand store
7. Monaco editor supports 100+ programming languages

---

**For detailed information, see: CODE_LAB_COMPLETE_ARCHITECTURE.md**
