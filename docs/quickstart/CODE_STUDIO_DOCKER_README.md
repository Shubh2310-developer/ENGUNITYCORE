# Code Studio Standalone Docker Setup

This is a standalone, isolated Docker environment for the **Code Studio** IDE playground that runs independently without authentication.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- A valid Groq API key (for AI features)

### Setup & Run

1. **Configure your API key:**
   ```bash
   cp .env.code .env.code.local
   # Edit .env.code.local and add your GROQ_API_KEY
   ```

2. **Build and start the containers:**
   ```bash
   docker-compose --env-file .env.code.local -f docker-compose.code.yml up --build
   ```

3. **Access the IDE:**
   Open your browser to `http://localhost:3001/code`

### Stop the containers:
```bash
docker-compose -f docker-compose.code.yml down
```

## 🔧 Configuration

### Changing Ports

If ports 3001 or 8001 are already in use, edit `docker-compose.code.yml`:

**Frontend port (default 3001):**
```yaml
ports:
  - "4000:3001"  # Change 4000 to your desired port
```

**Backend port (default 8001):**
```yaml
ports:
  - "9000:8001"  # Change 9000 to your desired port
```

⚠️ **Important:** If you change the backend port, also update the `NEXT_PUBLIC_API_URL` in the frontend build args:
```yaml
args:
  - NEXT_PUBLIC_API_URL=http://localhost:9000
```

## 📦 What's Included

### Backend (port 8001)
- FastAPI server with code execution endpoints
- Multi-language runtime support:
  - Python 3.10
  - Node.js
  - C/C++ (gcc/g++)
  - Go
  - Java (OpenJDK 17)
  - Ruby
  - PHP
- AI-assisted coding features (Groq)
- No authentication required

### Frontend (port 3001)
- Next.js 14 Code Studio interface
- Monaco Editor
- Terminal emulator
- File explorer
- AI Refine panel

## 🔒 Security Notice

**This container bypasses authentication and is intended for playground/testing use only.**

- Any user with access to the ports can execute code
- Run only in trusted/internal networks or behind a firewall
- Do not expose these ports to the public internet

## 🐛 Troubleshooting

### Build fails with "disk space" error
```bash
# Clean up old Docker resources
docker system prune -a
```

### Backend fails to start
Check logs:
```bash
docker-compose -f docker-compose.code.yml logs code-backend
```

### Frontend can't connect to backend
1. Ensure both containers are running: `docker-compose -f docker-compose.code.yml ps`
2. Check network connectivity: `docker-compose -f docker-compose.code.yml exec code-frontend ping code-backend`
3. Verify the `NEXT_PUBLIC_API_URL` matches your backend configuration

### Port already in use
```bash
# Check what's using the port
lsof -i :3001
lsof -i :8001

# Either stop the conflicting service or change ports in docker-compose.code.yml
```

## 📝 Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (http://localhost:3001/code)       │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  code-frontend (Next.js - Port 3001)        │
│  - Monaco Editor                            │
│  - File Explorer                            │
│  - Terminal                                 │
└───────────────────┬─────────────────────────┘
                    │ HTTP API calls
                    ▼
┌─────────────────────────────────────────────┐
│  code-backend (FastAPI - Port 8001)         │
│  - /api/v1/code/execute-direct             │
│  - /api/v1/code/ai-assist                  │
│  - /api/v1/code/ai-chat                    │
│                                             │
│  Language Runtimes:                         │
│  Python | Node | C++ | Go | Java | Ruby | PHP│
└─────────────────────────────────────────────┘
```

## 🔄 Development Mode

To run with live reloading for development:

1. **Backend:**
   ```bash
   docker-compose -f docker-compose.code.yml up code-backend
   # In another terminal, mount your code:
   docker-compose -f docker-compose.code.yml exec code-backend bash
   ```

2. **Frontend:**
   Similar process or run locally with `npm run dev`

## 📚 Related Documentation

- Main Guide: `CODE_STUDIO_DOCKER_ISOLATION.md`
- Code Lab Architecture: `docs/features/code-lab/CODE_LAB_COMPLETE_ARCHITECTURE.md`
- API Reference: Check `/docs` endpoint when backend is running
