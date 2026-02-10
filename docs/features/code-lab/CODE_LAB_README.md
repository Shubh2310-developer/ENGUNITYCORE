# Code Lab Architecture Documentation

## 📚 Documentation Overview

This directory contains complete end-to-end documentation for the **Engunity AI Code Lab** (Code Studio) feature - a full-stack, production-ready IDE module.

---

## 📖 Available Documents

### 1. **CODE_LAB_COMPLETE_ARCHITECTURE.md** (1,427 lines)
**The definitive guide** - Everything you need to implement Code Lab from scratch.

**Contents:**
- ✅ Complete architecture overview with diagrams
- ✅ Frontend structure (React/Next.js/Monaco/XTerm)
- ✅ Backend architecture (FastAPI/PostgreSQL/Supabase)
- ✅ Database schemas and SQLAlchemy models
- ✅ All API endpoints with examples
- ✅ AI integration (Groq, FAISS vector store)
- ✅ Environment configuration
- ✅ Step-by-step implementation guide
- ✅ Docker/Kubernetes deployment
- ✅ Security considerations
- ✅ Performance optimization
- ✅ Troubleshooting guide

**Best for:** Full-stack developers implementing the feature, architects reviewing the design, new team members onboarding.

---

### 2. **CODE_LAB_QUICK_REFERENCE.md** 
**Quick reference guide** - Fast lookup for common tasks and patterns.

**Contents:**
- ⚡ Quick start commands
- 🎯 Key technologies summary
- 🔑 Essential API endpoints
- ⌨️ Keyboard shortcuts
- 🛠️ Common tasks (add file types, AI actions, etc.)
- 🐛 Quick debugging tips
- 📦 Dependencies list
- 🚨 Error solutions

**Best for:** Daily development, quick lookups, debugging sessions, code reviews.

---

### 3. **code.md** (Existing)
**Original architecture notes** - Initial design concepts and patterns.

---

## 🎯 Which Document Should I Read?

| Your Role | Start With | Then Read |
|-----------|------------|-----------|
| **New Developer** | Quick Reference → Complete Architecture | All sections |
| **Full Stack Engineer** | Complete Architecture | Implementation Guide |
| **Frontend Developer** | Complete Architecture (Frontend section) | Component details |
| **Backend Developer** | Complete Architecture (Backend section) | API endpoints |
| **DevOps Engineer** | Complete Architecture (Deployment section) | Docker/K8s configs |
| **Quick Lookup** | Quick Reference | Specific sections as needed |

---

## 🏗️ Architecture at a Glance

```
┌────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js + Monaco + XTerm + Zustand)         │
│  • File Explorer   • Code Editor   • Terminal          │
│  • AI Panel       • Command Palette                    │
└────────────────────────────────────────────────────────┘
                         ↕ REST API
┌────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI + PostgreSQL + Supabase + FAISS)     │
│  • Project Management  • File CRUD  • AI Services      │
│  • Code Execution     • Vector Search                  │
└────────────────────────────────────────────────────────┘
                         ↕ Data Layer
┌────────────────────────────────────────────────────────┐
│  DATA (PostgreSQL + Supabase Storage + FAISS Index)    │
│  • code_projects table  • code_files table             │
│  • Bucket storage      • Vector embeddings             │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone <your-repo>
cd Engunity

# 2. Setup environment
cp .env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit with your API keys

# 3. Start services
docker-compose up -d

# 4. Access Code Lab
# Open: http://localhost:3000/code
```

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~5,000+ |
| **Frontend Components** | 12 major components |
| **Backend Endpoints** | 11 REST endpoints |
| **Database Tables** | 2 main tables |
| **Dependencies** | 30+ packages |
| **Documentation Lines** | 1,427+ lines |
| **Features** | 20+ implemented |

---

## 🎨 Key Features Implemented

### ✅ Core IDE Features
- Monaco Editor integration (VSCode core)
- Hierarchical file/folder system
- Integrated terminal (XTerm.js)
- Syntax highlighting for 100+ languages
- Auto-save with debouncing
- Command palette (Cmd+P)
- Multiple file tabs
- File breadcrumbs

### ✅ AI-Powered Features
- Code refinement suggestions
- Context-aware assistance
- Semantic code search (FAISS)
- Security scanning (planned)
- Performance profiling (planned)

### ✅ Backend Infrastructure
- REST API with FastAPI
- PostgreSQL for metadata
- Supabase for file storage
- FAISS vector search
- JWT authentication
- Rate limiting
- CORS configuration

---

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Editor**: Monaco Editor 0.50.0
- **Terminal**: XTerm.js 5.3.0
- **State**: Zustand 5.0.9
- **Styling**: Tailwind CSS 3.4.1
- **Language**: TypeScript 5.x

### Backend
- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0.35
- **Storage**: Supabase 2.10.0
- **AI**: Groq 0.11.0, Gemini
- **Search**: FAISS 1.8.0
- **Cache**: Redis 5.0.8

---

## 📁 File Locations

```
docs/architecture/
├── CODE_LAB_COMPLETE_ARCHITECTURE.md    # Main documentation (THIS!)
├── CODE_LAB_QUICK_REFERENCE.md          # Quick reference guide
├── CODE_LAB_README.md                   # This file
└── code.md                              # Original notes

frontend/src/
├── app/(dashboard)/code/
│   ├── page.tsx                         # Main Code Lab page
│   └── codelab.module.css               # Scoped styles
├── components/code-lab/                 # 12 UI components
├── services/code.ts                     # API service
└── stores/codeStore.ts                  # State management

backend/app/
├── api/v1/code.py                       # REST endpoints
├── models/code.py                       # DB models
├── schemas/code.py                      # Validation
└── services/                            # Business logic
    ├── ai/
    ├── code_execution/
    └── storage/
```

---

## 🎓 Learning Path

### For New Developers
1. **Day 1**: Read Quick Reference + Setup local environment
2. **Day 2**: Read Complete Architecture (Frontend section)
3. **Day 3**: Read Complete Architecture (Backend section)
4. **Day 4**: Explore codebase with documentation open
5. **Day 5**: Make your first contribution!

### For Experienced Developers
1. **Hour 1**: Quick Reference + Architecture Overview
2. **Hour 2**: Deep dive into your focus area (Frontend/Backend)
3. **Hour 3**: Setup and run locally
4. **Hour 4**: Start coding!

---

## 🤝 Contributing

When adding new features:
1. **Update Documentation**: Keep CODE_LAB_COMPLETE_ARCHITECTURE.md in sync
2. **Add to Quick Reference**: If it's commonly used
3. **Code Comments**: Follow existing patterns
4. **Tests**: Write tests for new features
5. **PR Description**: Reference relevant doc sections

---

## 🔗 External Resources

### Tools & Libraries
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [XTerm.js](https://xtermjs.org/) - Terminal emulator
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [FAISS](https://github.com/facebookresearch/faiss) - Vector search

### Related Docs
- [Main Architecture](../architecture.md) - Overall Engunity architecture
- [Chat Architecture](./chat_architecture.md) - Chat feature docs
- [RAG Guide](../RAG_GUIDE.md) - RAG implementation

---

## ❓ FAQ

**Q: Can I use this in production?**  
A: Yes! The architecture is production-ready. Ensure you follow the security and deployment checklist.

**Q: What's the difference between the two main docs?**  
A: Complete Architecture (1,427 lines) is comprehensive. Quick Reference is for daily use.

**Q: How do I add a new programming language?**  
A: Monaco supports 100+ languages by default. Just set the `language` prop correctly.

**Q: Can this handle large projects?**  
A: Yes, with optimizations: virtual scrolling for file trees, lazy loading, code splitting.

**Q: Is real-time collaboration supported?**  
A: Not yet. It's in Phase 2 roadmap (WebSocket-based).

**Q: How secure is code execution?**  
A: Docker containers with network isolation, resource limits, and no persistent storage.

---

## 📞 Support

- **Documentation Issues**: Check troubleshooting section in Complete Architecture
- **Bug Reports**: Create an issue with [BUG] prefix
- **Feature Requests**: Create an issue with [FEATURE] prefix
- **Questions**: Check FAQ first, then ask the team

---

## 📝 Document Maintenance

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial complete documentation |
| - | - | - |

**Maintained By**: Engunity AI Development Team  
**Last Updated**: January 18, 2026  
**Next Review**: March 2026

---

## 🎉 Ready to Build?

1. Choose your entry point:
   - 📘 Full implementation? → **CODE_LAB_COMPLETE_ARCHITECTURE.md**
   - ⚡ Quick reference? → **CODE_LAB_QUICK_REFERENCE.md**

2. Set up your environment (5 minutes)
3. Start coding!

**Happy Coding! 🚀**
