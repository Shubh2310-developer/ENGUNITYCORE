# GitHub Repos Feature - Quick Reference

## 🚀 Quick Start

### Start Development Environment

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points
- Frontend: http://localhost:3000/githubrepos
- Backend API: http://localhost:8000/api/v1
- API Docs: http://localhost:8000/docs

---

## 📊 Current Status

### ✅ Completed Features (100%)
- **Real GitHub Import**: Import repositories via owner/name with full metadata.
- **AI Intelligence**: Real analysis using Groq (Llama 3.1 70B) for code & security.
- **Research Mapping**: Automated linking of code implementations to arXiv papers.
- **Production Storage**: Repository cloning and archiving to Supabase Storage.
- **Performance**: Redis-based caching for repository details and metadata.
- **Real-time Updates**: Socket.IO integration for analysis progress tracking.
- **Full CRUD**: Lifecycle management including Sync, Update, and Delete.

---

## 🔌 API Endpoints (Production Ready)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/v1/githubrepos/` | List user repositories | - |
| POST | `/api/v1/githubrepos/import` | Import from GitHub API | 10/min |
| GET | `/api/v1/githubrepos/{id}` | Details + Analysis (Cached) | - |
| POST | `/api/v1/githubrepos/{id}/analyze` | Trigger Deep Analysis | 5/min |
| POST | `/api/v1/githubrepos/{id}/sync` | Sync GitHub metadata | 10/min |
| POST | `/api/v1/githubrepos/{id}/ai-tool` | Run targeted AI tool | 20/min |
| POST | `/api/v1/githubrepos/bulk/analyze` | Bulk trigger analysis | 2/min |
| POST | `/api/v1/githubrepos/{id}/execute` | Sandbox execution | 10/min |
| DELETE | `/api/v1/githubrepos/{id}` | Remove repo & data | - |

---

## 🔧 Environment Variables

### Required (.env)
```bash
DATABASE_URL=postgresql://...
MONGODB_URL=mongodb+srv://...
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=gsk_...
GITHUB_TOKEN=ghp_...
SECRET_KEY=...
```

---

## 📝 Usage Guide

1. **Import**: Click the **+** button in the sidebar to import by owner/repo.
2. **Analyze**: Use **Trigger Intelligence Analysis** for deep background analysis.
3. **Tools**: In the **Code Intelligence** tab, use tools like `Explain` or `Audit`.
4. **Research**: View academic connections in the **Research Mapping** tab.
5. **Sync**: Use the **Sync** button in the header to refresh GitHub metadata.

---

## 🧪 Testing

Run automated tests:
```bash
cd backend
pytest tests/test_githubrepos.py
```

---

**Status:** PRODUCTION READY ✅
**Version:** 1.0.0
