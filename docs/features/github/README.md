# GitHub Repos Feature Documentation

This directory contains comprehensive documentation for the GitHub Repository Intelligence feature in Engunity.

## 📚 Documentation Files

### 1. [GITHUB_REPOS_COMPLETE_GUIDE.md](./GITHUB_REPOS_COMPLETE_GUIDE.md)
**2075 lines | Complete Implementation Guide**

The definitive guide covering everything you need to make the GitHub Repos feature fully functional end-to-end.

**Contents:**
- ✅ Architecture overview and system design
- ✅ Current implementation status and gaps
- ✅ Database setup (PostgreSQL, MongoDB, Redis)
- ✅ Complete API documentation
- ✅ Frontend implementation details
- ✅ Missing features with implementation code
- ✅ Environment configuration
- ✅ GitHub API integration guide
- ✅ Real AI analysis implementation
- ✅ Testing guide
- ✅ Deployment instructions
- ✅ Troubleshooting
- ✅ Security best practices
- ✅ Performance optimization

**Use this when:** You need detailed implementation instructions or are setting up the feature from scratch.

---

### 2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Quick Reference & Cheat Sheet**

A condensed reference guide for quick lookups and daily development.

**Contents:**
- 🚀 Quick start commands
- 📊 Current status overview
- 🗄️ Database schema reference
- 🔌 API endpoint list
- 🔧 Environment variables
- 📝 Test commands
- 🐛 Common issues & solutions
- 💡 Development tips

**Use this when:** You need quick reference during development or want to check what's implemented.

---

## 🎯 Quick Navigation

### For New Developers
1. Start with the **Overview** section in the Complete Guide
2. Follow the **Complete Setup Guide (Step-by-Step)**
3. Use **Quick Reference** for daily development

### For Implementing Missing Features
1. Check **Current Implementation Status** to see what's missing
2. Go to **Missing Features & Implementation Guide**
3. Find the specific feature and copy the implementation code
4. Follow the **Testing Guide** to verify

### For Deployment
1. Read **Deployment** section in Complete Guide
2. Follow **Production Checklist**
3. Use **Docker Production Deployment** configuration

### For Troubleshooting
1. Check **Common Issues** in Quick Reference first
2. See detailed **Troubleshooting** section in Complete Guide
3. Check application logs

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                   Port: 3000 / 3001                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     │ JWT Authentication
┌────────────────────┴────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│                      Port: 8000                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         /api/v1/githubrepos Endpoints                 │  │
│  └──────────────────────────────────────────────────────┘  │
└───────┬──────────────────┬──────────────────┬──────────────┘
        │                  │                  │
        │ PostgreSQL       │ MongoDB          │ Redis
        │ Port: 5432       │ Port: 27017      │ Port: 6379
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Repository   │  │ AI Analysis  │  │   Cache      │
│  Metadata    │  │   Results    │  │  Sessions    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Data Flow:**
1. User → Frontend → GET /githubrepos → PostgreSQL
2. User → Trigger Analysis → AI Service → MongoDB
3. User → Execute Code → Sandbox → Return Logs

---

## 🔑 Key Components

### Backend Components
| Component | Location | Purpose |
|-----------|----------|---------|
| API Endpoints | `backend/app/api/v1/githubrepos.py` | REST API routes |
| Database Model | `backend/app/models/github.py` | SQLAlchemy model |
| Schemas | `backend/app/schemas/github.py` | Pydantic validation |
| Sandbox | `backend/app/services/code_execution/sandbox.py` | Code execution |
| AI Logger | `backend/app/services/ai/logger.py` | Event logging |

### Frontend Components
| Component | Location | Purpose |
|-----------|----------|---------|
| Main Page | `frontend/src/app/(dashboard)/githubrepos/page.tsx` | UI component |
| API Service | `frontend/src/services/githubrepos.ts` | API calls |
| Styles | `frontend/src/app/(dashboard)/githubrepos/githubrepos.module.css` | CSS modules |

---

## 📊 Current Implementation Status

### ✅ Implemented (Working)
- [x] User authentication with JWT
- [x] Repository CRUD (Create, Read)
- [x] Repository listing with search/filter/sort
- [x] Repository details view
- [x] Mock AI analysis storage
- [x] Sandbox execution simulation
- [x] 6-tab UI (Overview, Code, Research, Sandbox, Security, Activity)
- [x] PostgreSQL integration
- [x] MongoDB integration
- [x] Redis infrastructure

### ⚠️ Partially Implemented (Needs Work)
- [ ] AI Analysis (currently mocked, needs real implementation)
- [ ] Code Intelligence (file tree needs GitHub API)
- [ ] Security Audit (needs real scanning)
- [ ] Research Mapping (needs implementation)

### ❌ Not Implemented (Missing)
- [ ] GitHub API import endpoint
- [ ] AI tool execution endpoint
- [ ] Bulk analysis endpoint
- [ ] Update repository endpoint
- [ ] Delete repository endpoint
- [ ] Real code analysis
- [ ] Repository cloning
- [ ] WebSocket real-time updates

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+

### Quick Setup (5 minutes)

```bash
# 1. Start databases
docker-compose up -d db mongo redis

# 2. Setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python ../init_db_tables.py

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start backend
uvicorn app.main:app --reload

# 5. Setup frontend (new terminal)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
npm run dev

# 6. Access application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Create Test User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

---

## 📖 How to Use This Documentation

### Scenario 1: Setting Up from Scratch
1. Read **Overview** section in Complete Guide
2. Follow **Database Setup** instructions
3. Complete **Step-by-Step Setup Guide**
4. Test using **Testing Guide**

### Scenario 2: Implementing GitHub Import
1. Go to **Missing Features & Implementation Guide**
2. Find "POST /api/v1/githubrepos/import"
3. Copy the implementation code
4. Follow **GitHub API Integration** section
5. Test with real GitHub repos

### Scenario 3: Adding Real AI Analysis
1. Go to **Real AI Analysis Implementation**
2. Create `backend/app/services/github/analyzer.py`
3. Update the analyze endpoint
4. Configure GROQ_API_KEY
5. Test analysis endpoint

### Scenario 4: Daily Development
1. Use **Quick Reference** for common commands
2. Check **API Endpoints** table for available routes
3. Refer to **Common Issues** for troubleshooting

---

## 🔧 Environment Variables Required

### Minimum Required
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/engunity
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=your_groq_key
SECRET_KEY=your_secret_key
```

### For Full Functionality
```bash
# Add GitHub integration
GITHUB_TOKEN=ghp_your_github_token

# Add file storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key

# Add more AI options
GEMINI_API_KEY=your_gemini_key
```

---

## 📞 Support

### Getting Help
1. **Check the guides** - Most questions are answered in the Complete Guide
2. **Use Quick Reference** - For quick lookups and common issues
3. **Interactive API docs** - http://localhost:8000/docs for testing
4. **Check logs** - Backend console and `backend/logs/app.log`

### Debugging Tools
- **PostgreSQL**: `psql -U user -d engunity`
- **MongoDB**: `mongosh` to inspect collections
- **Redis**: `redis-cli` to check cache
- **API**: http://localhost:8000/docs (Swagger UI)

---

## 🎯 Next Steps

### Priority 1 (Essential Features)
1. Implement GitHub import endpoint
2. Add AI tool execution endpoint
3. Add bulk analysis endpoint

### Priority 2 (Enhanced Features)
4. Implement real AI analysis with Groq
5. Add research paper mapping
6. Add real security scanning

### Priority 3 (Advanced Features)
7. Add repository cloning to Supabase
8. Implement WebSocket updates
9. Add advanced caching strategies

---

## 📄 Related Documentation

- **Main Architecture**: `../architecture.md`
- **API Reference**: `../api.md`
- **Code Lab**: `../architecture/CODE_LAB_COMPLETE_ARCHITECTURE.md`
- **Analytics**: `../Analytics/ANALYTICS_QUICKSTART.md`

---

## 📝 Version History

- **v1.0** (Jan 22, 2026) - Initial comprehensive documentation
  - Complete implementation guide (2075 lines)
  - Quick reference guide
  - Full API documentation
  - Step-by-step setup instructions
  - Missing features implementation code

---

## ✨ Features at a Glance

| Feature | Status | Location |
|---------|--------|----------|
| Repository List | ✅ Working | Frontend + Backend |
| Repository Details | ✅ Working | Frontend + Backend |
| AI Analysis | ⚠️ Mocked | Backend (needs real impl) |
| Code Execution | ⚠️ Simulated | Backend (sandbox) |
| GitHub Import | ❌ Missing | Needs implementation |
| AI Tools | ❌ Missing | Needs implementation |
| Bulk Analysis | ❌ Missing | Needs implementation |
| Research Mapping | ❌ Missing | Needs implementation |
| Security Scan | ⚠️ Basic | Needs enhancement |

---

**Ready to start? Open the [Complete Guide](./GITHUB_REPOS_COMPLETE_GUIDE.md) and begin with the Overview section!**
