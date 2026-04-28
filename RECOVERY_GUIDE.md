# 🚨 ENGUNITYCORE FULL PROJECT RECOVERY GUIDE
> **Date Generated:** 2026-03-18 | **Reason:** OS failure — all gitignored files lost  
> **Purpose:** Step-by-step, ordered instructions to fully restore the ENGUNITYCORE project from scratch.

---

## 📋 TABLE OF CONTENTS

1. [What Was Lost — Complete Inventory](#1-what-was-lost--complete-inventory)
2. [Phase 1 — Git Repository Recovery](#phase-1--git-repository-recovery)
3. [Phase 2 — Environment & Secret Files Recovery](#phase-2--environment--secret-files-recovery)
4. [Phase 3 — Backend Python Environment Recovery](#phase-3--backend-python-environment-recovery)
5. [Phase 4 — Frontend Node.js Recovery](#phase-4--frontend-nodejs-recovery)
6. [Phase 5 — AI Models & Vector Stores Recovery](#phase-5--ai-models--vector-stores-recovery)
7. [Phase 6 — Database Recovery (PostgreSQL + MongoDB + Redis)](#phase-6--database-recovery-postgresql--mongodb--redis)
8. [Phase 7 — Blockchain Dependencies Recovery](#phase-7--blockchain-dependencies-recovery)
9. [Phase 8 — Infrastructure & Docker Recovery](#phase-8--infrastructure--docker-recovery)
10. [Phase 9 — Start & Verify Everything](#phase-9--start--verify-everything)
11. [Summary of ALL Files to Recreate](#summary-of-all-files-to-recreate)

---

## 1. What Was Lost — Complete Inventory

> All files and directories listed below were **gitignored** and therefore **NOT on GitHub**. They were deleted when the OS failed.

### 🔐 Secrets & Environment Files (CRITICAL)
| File | Location | Description |
|------|----------|-------------|
| `.env` | `/ENGUNITYCORE/` | Root-level app env (Supabase, DB, AI keys, Redis, GitHub) |
| `.env.local` | `/ENGUNITYCORE/` | Local overrides |
| `.env.production` | `/ENGUNITYCORE/` | Production env values |
| `.env.development` | `/ENGUNITYCORE/` | Development env values |
| `.env.*.local` | `/ENGUNITYCORE/` | All other local env variants |
| `*.env` | Any directory | Any additional env files |
| `*.key` | Any directory | Private key files |
| `*.pem` | Any directory | Certificate files  |
| `*.p12`, `*.pfx` | Any directory | Certificate stores |
| `secrets/` | Any directory | Secrets directory |
| `credentials/` | Any directory | Credentials directory |
| `*.secret` | Any directory | Secret files |
| `*.credentials` | Any directory | Credential files |

### 🐍 Python Backend — Lost Runtime Files
| File / Directory | Location |
|-----------------|----------|
| `venv/` or `.venv/` | `/ENGUNITYCORE/backend/` |
| `env/` | `/ENGUNITYCORE/backend/` |
| `__pycache__/` | All Python dirs |
| `*.pyc`, `*.pyo`, `*.pyd` | All Python dirs |
| `.pytest_cache/` | `/ENGUNITYCORE/backend/` |
| `htmlcov/` | `/ENGUNITYCORE/backend/` |
| `.coverage` | `/ENGUNITYCORE/backend/` |
| `*.egg-info/` | `/ENGUNITYCORE/backend/` |
| `.mypy_cache/` | `/ENGUNITYCORE/backend/` |

### 🌐 Frontend — Lost Node.js Files
| File / Directory | Location |
|-----------------|----------|
| `node_modules/` | `/ENGUNITYCORE/frontend/` |
| `.next/` | `/ENGUNITYCORE/frontend/` |
| `out/` | `/ENGUNITYCORE/frontend/` |
| `dist/` | `/ENGUNITYCORE/frontend/` |
| `.turbo` | `/ENGUNITYCORE/frontend/` |
| `coverage/` | `/ENGUNITYCORE/frontend/` |
| `storybook-static/` | `/ENGUNITYCORE/frontend/` |
| `package-lock.json` | `/ENGUNITYCORE/frontend/` |

### 🤖 AI / ML Models & Data (CRITICAL — Large files)
| File / Directory | Description |
|-----------------|-------------|
| `models/` | All AI model weights directory |
| `checkpoints/` | Training checkpoints |
| `saved_models/` | Saved TensorFlow/PyTorch models |
| `faiss_index/` | FAISS vector index (RAG) |
| `embeddings/` | Pre-computed embeddings |
| `data/` | Training/inference data |
| `datasets/` | Dataset files |
| `*.h5`, `*.hdf5` | Keras/HDF5 model files |
| `*.pkl`, `*.pickle` | Pickled Python objects |
| `*.joblib` | Scikit-learn models |
| `*.pt`, `*.pth` | PyTorch model files |
| `*.onnx` | ONNX model files |
| `*.pb` | TensorFlow protobuf models |
| `*.tflite` | TensorFlow Lite models |
| `*.ckpt` | Checkpoint files |
| `*.npy`, `*.npz` | NumPy array files |
| `*.csv`, `*.json`, `*.jsonl`, `*.parquet` | Data files (in data dirs) |
| `*.index` | Vector index files |

### ⛓️ Blockchain — Lost Build Artifacts
| File / Directory | Location |
|-----------------|----------|
| `node_modules/` | `/ENGUNITYCORE/blockchain/` |
| `cache/` | `/ENGUNITYCORE/blockchain/` |
| `artifacts/` | Build artifacts |
| `typechain/`, `typechain-types/` | Generated TypeScript types |
| `coverage/`, `coverage.json` | Test coverage |
| `deployments/` | Contract deployment data |
| `.gas-snapshot` | Gas usage snapshots |
| `cache-*.json` | Hardhat cache files |

### 🗄️ Database Files
| File / Directory | Description |
|-----------------|-------------|
| `*.db`, `*.sqlite`, `*.sqlite3` | SQLite databases |
| `db.sqlite3`, `db.sqlite3-journal` | Django-style SQLite |
| `dump.rdb` | Redis dump file |
| `*.sql.backup` | PostgreSQL backup files |

### 📦 Docker
| File | Description |
|------|-------------|
| `docker-compose.override.yml` | Local Docker overrides |
| `.docker/` | Docker-specific local configs |

### 🗂️ Misc Build & Generated
| File / Directory | Description |
|-----------------|-------------|
| `logs/`, `log/`, `*.log*` | All log files |
| `tmp/`, `temp/` | Temp files |
| `.supabase/` | Supabase local instance |
| `uploads/`, `user_uploads/`, `media/` | Uploaded files |
| `.monitoring/` | Monitoring config |
| `backup/`, `backups/` | Backup directories |
| `*.env.backup`, `*.bak.env` | Environment backups |
| `.planning/` | Planning documents |
| `.gemini` | Gemini AI tool files |
| `.opencode.json` | OpenCode config |
| `.mcp.json` | MCP server config |

---

## Phase 1 — Git Repository Recovery

> **Status:** The Git repo itself (committed files) should be intact if you cloned from GitHub. Do this first.

### Step 1.1 — Verify Git Status
```bash
cd /home/agentrogue/projects/ENGUNITYCORE
git status
git log --oneline -10
```

### Step 1.2 — If the Repo Was Lost, Re-clone
```bash
# Replace with your actual GitHub URL
git clone https://github.com/YOUR_USERNAME/ENGUNITYCORE.git /home/agentrogue/projects/ENGUNITYCORE
cd /home/agentrogue/projects/ENGUNITYCORE
```

### Step 1.3 — Verify All Tracked Files Are Present
```bash
# Check for missing tracked files
git ls-files --deleted

# If any show up, restore them:
git checkout HEAD -- <filename>
```

### Step 1.4 — Check .gitignore Is In Place
```bash
cat .gitignore | head -20
# Should show "CRITICAL: Secrets & API Keys" section
```

---

## Phase 2 — Environment & Secret Files Recovery

> ⚠️ **MOST CRITICAL PHASE** — Without `.env` the app cannot connect to ANY service.

### Step 2.1 — Locate Your Original Keys/Secrets

Check all of the following backup sources **BEFORE creating new keys**:

- [ ] **Password Managers**: Bitwarden, 1Password, LastPass, etc.
- [ ] **Browser History/Saved Passwords** (for Supabase dashboard logins)
- [ ] **Email Inbox**: Search for "Groq API Key", "Supabase", "MongoDB Atlas", "GitHub Token"
- [ ] **Supabase Dashboard** → `https://app.supabase.com` → Your project → Settings → API
- [ ] **Groq Console** → `https://console.groq.com` → API Keys
- [ ] **Google AI Studio** → `https://aistudio.google.com` → API Keys (GEMINI_API_KEY)
- [ ] **OpenRouter** → `https://openrouter.ai/account/keys`
- [ ] **MongoDB Atlas** → `https://cloud.mongodb.com` → Database → Connect
- [ ] **GitHub Settings** → `https://github.com/settings/tokens`
- [ ] **Another machine** that had this project open (laptop, work PC, VM)
- [ ] **Cloud drives**: Google Drive, Dropbox, OneDrive (you may have backed up `.env` manually)
- [ ] **Terminal history on a different device** (`~/.bash_history`, `~/.zsh_history`)

### Step 2.2 — Create Root `.env` File

```bash
cd /home/agentrogue/projects/ENGUNITYCORE
cp .env.example .env
nano .env   # or: code .env
```

Fill in each variable using the values you found above. Here is the **complete list** of required variables:

```dotenv
# ==========================================
# Supabase Configuration (Required)
# ==========================================
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...   # From Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your_jwt_secret_here_base64_encoded
SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/callback

# ==========================================
# Database (Required)
# ==========================================
DATABASE_URL=postgresql://user:password@localhost:5432/engunity
# OR use Supabase DB URL from dashboard (Settings > Database > URI)

# ==========================================
# Application (Required)
# ==========================================
SECRET_KEY=generate_a_32+_char_random_string_here
PROJECT_NAME="Engunity AI"
API_V1_STR="/api/v1"

# ==========================================
# AI Services (Required — pick at least one)
# ==========================================
GROQ_API_KEY=gsk_...
GROQ_API_KEYS=key1,key2,key3   # For load-balanced rotation
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...

# AI Service Toggle
ENABLE_AI=true   # Set to false for non-AI development

# ==========================================
# MongoDB (Required)
# ==========================================
MONGODB_URL=mongodb://localhost:27017
# OR Atlas: mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=engunity

# ==========================================
# Redis (Optional — defaults to localhost)
# ==========================================
REDIS_URL=redis://localhost:6379/0

# ==========================================
# GitHub (Optional)
# ==========================================
GITHUB_TOKEN=ghp_...

# ==========================================
# Frontend (Next.js Public Variables)
# ==========================================
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/callback
```

### Step 2.3 — Generate a New SECRET_KEY (if you don't have the original)
```bash
# Python method (use in backend)
python3 -c "import secrets; print(secrets.token_hex(32))"

# Or OpenSSL
openssl rand -hex 32
```

### Step 2.4 — Create Backend AI Env File
```bash
# Backend-specific env that controls AI loading
cp backend/.env.example.ai backend/.env
# Contents are already minimal — just set ENABLE_AI=true for production
```

### Step 2.5 — Create Frontend `.env.local`
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/frontend
# Create frontend-specific local overrides
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL=http://localhost:3000/callback
EOF
```

---

## Phase 3 — Backend Python Environment Recovery

### Step 3.1 — Install Python (if lost)
```bash
# Check Python version
python3 --version   # Should be 3.10+ (project uses torch 2.4.1)

# If missing, install pyenv or use system Python
sudo apt-get update && sudo apt-get install python3.11 python3.11-venv python3-pip -y
```

### Step 3.2 — Create Virtual Environment
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/backend

# Create venv
python3 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip wheel setuptools
```

### Step 3.3 — Install All Backend Dependencies

> ⚠️ **Warning:** The backend requirements include PyTorch (`torch==2.4.1`), EasyOCR, Ultralytics (YOLO), and FAISS — these are large downloads (several GB).

```bash
# Install from requirements.txt (full install)
pip install -r requirements.txt

# If torch install fails (CUDA/CPU issues), install separately:
# For CPU-only:
pip install torch==2.4.1 torchvision==0.19.1 --index-url https://download.pytorch.org/whl/cpu

# For CUDA (if you have GPU):
pip install torch==2.4.1 torchvision==0.19.1 --index-url https://download.pytorch.org/whl/cu121

# Then install the rest:
pip install -r requirements.txt --ignore-installed torch torchvision
```

**Complete list of backend packages from `requirements.txt`:**

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.0 | Web framework |
| `uvicorn[standard]` | 0.31.0 | ASGI server |
| `pydantic[email]` | 2.9.2 | Data validation |
| `pydantic-settings` | 2.5.2 | Settings management |
| `sqlalchemy` | 2.0.35 | ORM |
| `psycopg2-binary` | 2.9.9 | PostgreSQL driver |
| `alembic` | 1.13.3 | DB migrations |
| `python-jose[cryptography]` | 3.3.0 | JWT handling |
| `passlib[bcrypt]` | 1.7.4 | Password hashing |
| `python-multipart` | 0.0.9 | Form data |
| `celery` | 5.4.0 | Task queue |
| `redis` | 5.0.8 | Redis client |
| `groq` | 0.11.0 | Groq LLM API |
| `httpx` | 0.27.2 | Async HTTP |
| `python-dotenv` | 1.0.1 | Env loading |
| `slowapi` | 0.1.9 | Rate limiting |
| `loguru` | 0.7.2 | Logging |
| `motor` | 3.6.0 | Async MongoDB |
| `faiss-cpu` | 1.8.0.post1 | Vector search |
| `sentence-transformers` | 3.1.1 | Embeddings |
| `rank-bm25` | 0.2.2 | BM25 retrieval |
| `langchain-experimental` | ≥0.3.0 | LangChain tools |
| `ultralytics` | 8.4.5 | YOLO/object detection |
| `supabase` | 2.10.0 | Supabase client |
| `pdfplumber` | 0.11.4 | PDF parsing |
| `python-docx` | 1.1.2 | DOCX parsing |
| `langchain-text-splitters` | ≥0.3.0 | Text chunking |
| `Pillow` | 10.1.0 | Image processing |
| `python-magic` | 0.4.27 | File type detection |
| `easyocr` | 1.7.1 | OCR |
| `numpy` | 1.26.4 | Numerical computing |
| `opencv-python` | 4.8.1.78 | Computer vision |
| `torch` | 2.4.1 | Deep learning |
| `torchvision` | 0.19.1 | Vision models |
| `pandas` | 2.1.4 | Data processing |
| `scikit-learn` | 1.3.2 | ML utilities |
| `openpyxl` | 3.1.2 | Excel files |
| `xlrd` | 2.0.1 | Excel reading |
| `PyGithub` | 2.8.1 | GitHub API |
| `python-socketio` | 5.16.0 | WebSocket |
| `python-engineio` | 4.13.0 | Socket engine |
| `pytest` | 9.0.2 | Testing |
| `pytest-asyncio` | 1.3.0 | Async tests |
| `python-louvain` | 0.16 | Graph community detection |
| `networkx` | ≥2.5 | Graph analysis |
| `dnspython` | 2.7.0 | DNS utilities |
| `debugpy` | 1.8.0 | Remote debugging |

### Step 3.4 — Run Database Migrations
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/backend

# Make sure .env is configured with DATABASE_URL first
source venv/bin/activate

# Run Alembic migrations
alembic upgrade head

# OR manually apply the performance indexes SQL
psql $DATABASE_URL -f add_performance_indexes.sql
psql $DATABASE_URL -f alembic_migration_analytics.sql
```

### Step 3.5 — Verify Backend Can Start
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/backend
source venv/bin/activate

# Test with AI disabled first (faster)
ENABLE_AI=false uvicorn app.main:app --reload --port 8000

# Once verified, enable AI
ENABLE_AI=true uvicorn app.main:app --reload --port 8000
```

---

## Phase 4 — Frontend Node.js Recovery

### Step 4.1 — Install Node.js (if lost)
```bash
# Check
node --version   # Should be 18+ LTS

# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Or via apt:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 4.2 — Install Frontend Dependencies
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/frontend

# Install all node_modules (~500MB+)
npm install

# Also check for vitest (testing framework)
# vitest.config.ts is present — install if missing
npm install -D vitest
```

**Frontend project uses:**
- **Framework:** Next.js (config in `next.config.mjs`)
- **Styling:** Tailwind CSS (`tailwind.config.js`, `postcss.config.js`)
- **Testing:** Vitest (`vitest.config.ts`)
- **E2E Testing:** Playwright (`playwright.config.ts`)
- **Language:** TypeScript

### Step 4.3 — Install Playwright Browsers (E2E Testing)
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/frontend
npx playwright install
```

### Step 4.4 — Verify Frontend Starts
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/frontend
npm run dev
# Should be available at http://localhost:3000
```

---

## Phase 5 — AI Models & Vector Stores Recovery

> ⚠️ **IMPORTANT:** These are large binary files (~GB each) that were never in Git.

### Step 5.1 — Sentence Transformers (Embeddings Model)

The RAG system in `ai-core/rag/` uses `sentence-transformers`. The model downloads automatically on first use, but you can pre-download:

```bash
cd /home/agentrogue/projects/ENGUNITYCORE/backend
source venv/bin/activate

# Pre-download the embedding model (commonly used)
python3 -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
print('Embedding model ready')
"
```

### Step 5.2 — FAISS Vector Index Recovery

The FAISS index (`faiss_index/`) was ignored. You need to **rebuild it** from your documents:

```bash
# Check what rebuild scripts exist
ls scripts/
python3 scripts/debug_rag.py      # To verify RAG setup
python3 scripts/verify_rag.py     # Full RAG verification
python3 scripts/test_vector_store.py   # Test vector store
```

If the FAIss index is fully lost, re-ingest your documents through the API:
```bash
# Once backend is running:
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/your/document.pdf"
```

### Step 5.3 — YOLO / Ultralytics Models

Ultralytics auto-downloads YOLO weights on first inference. The model is saved to `~/.ultralytics/` NOT the project folder. It should still be there unless the home dir was wiped.

```bash
# Check if YOLO model exists
ls ~/.ultralytics/assets/ 2>/dev/null || echo "YOLO model needs to be re-downloaded"

# Force re-download by running inference once:
python3 -c "from ultralytics import YOLO; model = YOLO('yolov8n.pt'); print('YOLO ready')"
```

### Step 5.4 — EasyOCR Models

EasyOCR downloads models to `~/.EasyOCR/`. Check:
```bash
ls ~/.EasyOCR/model/ 2>/dev/null || echo "EasyOCR models need to be re-downloaded"

# Re-download if needed:
python3 -c "import easyocr; reader = easyocr.Reader(['en']); print('EasyOCR ready')"
```

### Step 5.5 — Custom Model Checkpoints (`models/`, `checkpoints/`, `saved_models/`)

If you had custom-trained models:
- [ ] Check if they were backed up to cloud storage (S3, Google Drive, Supabase Storage)
- [ ] Check if they were saved to any other machine
- [ ] Check Supabase Storage buckets for uploaded model files
- [ ] If lost — you will need to **retrain** from scratch using your training scripts

---

## Phase 6 — Database Recovery (PostgreSQL + MongoDB + Redis)

### Step 6.1 — PostgreSQL Recovery

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database (if lost)
sudo -u postgres psql
  CREATE USER engunity_user WITH PASSWORD 'your_password';
  CREATE DATABASE engunity OWNER engunity_user;
  GRANT ALL PRIVILEGES ON DATABASE engunity TO engunity_user;
  \q

# Run migrations to recreate schema
cd /home/agentrogue/projects/ENGUNITYCORE/backend
source venv/bin/activate
alembic upgrade head

# Apply additional SQL scripts
psql "postgresql://engunity_user:your_password@localhost:5432/engunity" \
  -f add_performance_indexes.sql
psql "postgresql://engunity_user:your_password@localhost:5432/engunity" \
  -f alembic_migration_analytics.sql
psql "postgresql://engunity_user:your_password@localhost:5432/engunity" \
  -f supabase_rls_fix.sql
```

### Step 6.2 — MongoDB Recovery

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Install if missing
sudo apt-get install -y mongodb-org   # or mongodb

# Start
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify connection
mongosh "mongodb://localhost:27017/engunity"

# OR if using Atlas, your data should still be in the cloud cloud:
# Update MONGODB_URL in .env to your Atlas connection string
```

### Step 6.3 — Redis Recovery

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Install if missing
sudo apt-get install -y redis-server

# Start
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping   # Should return: PONG
```

### Step 6.4 — Supabase Local (if using local Supabase)

If you were using Supabase in the cloud (recommended), your data is **safe** — just reconfigure the `.env` keys.

If you were using local Supabase (`supabase start`):
```bash
# Re-initialize Supabase local
npm install -g supabase
supabase init
supabase start

# Re-apply RLS and schema fixes
psql $(supabase status | grep DB URL | awk '{print $3}') -f supabase_rls_fix.sql
```

---

## Phase 7 — Blockchain Dependencies Recovery

### Step 7.1 — Install Blockchain Node Modules
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/blockchain
npm install

# This will restore:
# - node_modules/ (Hardhat and related packages)
# - Re-generates typechain types after compilation
```

### Step 7.2 — Recompile Contracts
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/blockchain

# Compile contracts (regenerates artifacts/ and typechain-types/)
npx hardhat compile

# Verify contracts are present
ls contracts/
```

### Step 7.3 — Contract Deployment Data (`deployments/`)

> ⚠️ The `deployments/` folder (contract addresses on testnets/mainnet) was **gitignored and lost**.

- [ ] Check your email/notes for contract addresses
- [ ] Check the blockchain explorer (Etherscan, BaseScan, etc.) for your deployer wallet
- [ ] If testnet, you can simply redeploy: `npx hardhat deploy --network <network>`
- [ ] If mainnet, check your deployer wallet history on Etherscan

---

## Phase 8 — Infrastructure & Docker Recovery

### Step 8.1 — Rebuild Docker Images
```bash
cd /home/agentrogue/projects/ENGUNITYCORE

# Backend container
docker build -f Dockerfile.code-backend -t engunity-backend:latest .

# Frontend container
docker build -f Dockerfile.code-frontend -t engunity-frontend:latest .

# Standard Dockerfiles
docker build -f backend/Dockerfile -t engunity-backend-prod:latest ./backend
docker build -f frontend/Dockerfile -t engunity-frontend-prod:latest ./frontend
```

### Step 8.2 — Start with Docker Compose
```bash
cd /home/agentrogue/projects/ENGUNITYCORE

# Create .env first (Phase 2), then:
docker-compose up -d

# For code execution variant:
docker-compose -f docker-compose.code.yml up -d
```

### Step 8.3 — Restore docker-compose.override.yml (Local Dev)

This file was gitignored. Recreate if you need local overrides:
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  backend:
    environment:
      - DEBUG=true
      - ENABLE_AI=false
    volumes:
      - ./backend:/app  # Hot reload
  frontend:
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/app  # Hot reload
```

### Step 8.4 — Restore Monitoring Configs
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/infra/monitoring

# Check what monitoring scripts exist
ls infra/

# The monitoring_dashboard.py in backend has dashboards:
python3 backend/monitoring_dashboard.py
```

---

## Phase 9 — Start & Verify Everything

### Step 9.1 — Start All Services (Development)
```bash
cd /home/agentrogue/projects/ENGUNITYCORE

# Terminal 1: PostgreSQL
sudo systemctl start postgresql

# Terminal 2: MongoDB
sudo systemctl start mongod

# Terminal 3: Redis
sudo systemctl start redis-server

# Terminal 4: Backend
cd backend && source venv/bin/activate
ENABLE_AI=true uvicorn app.main:app --reload --port 8000

# Terminal 5: Frontend
cd frontend && npm run dev
```

### Step 9.2 — OR Start with Docker (Easier)
```bash
cd /home/agentrogue/projects/ENGUNITYCORE
docker-compose up -d
```

### Step 9.3 — Verify Health Endpoints
```bash
# Backend health check
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/docs   # Swagger UI

# Frontend
curl http://localhost:3000

# Run backend verification scripts
cd backend && source venv/bin/activate
python3 check_users.py
python3 diagnose_connections.py
```

### Step 9.4 — Run Tests
```bash
# Backend tests
cd /home/agentrogue/projects/ENGUNITYCORE/backend
source venv/bin/activate
pytest tests/ -v

# Frontend unit tests
cd /home/agentrogue/projects/ENGUNITYCORE/frontend
npm run test   # vitest

# Frontend E2E tests
npx playwright test

# Coding team integration test
python3 /home/agentrogue/projects/ENGUNITYCORE/test_coding_team.py
```

### Step 9.5 — Verify RAG System
```bash
cd /home/agentrogue/projects/ENGUNITYCORE/backend
source venv/bin/activate

python3 ../scripts/verify_rag.py
python3 ../scripts/test_vector_store.py
python3 ../scripts/debug_rag.py
```

---

## Summary of ALL Files to Recreate

### ✅ Recoverable from GitHub (already safe)
- All `*.py`, `*.ts`, `*.tsx`, `*.js` source code
- `requirements.txt`, `package.json`
- `Dockerfile`, `docker-compose.yml`, `docker-compose.code.yml`
- All `*.md` documentation in `docs/`
- All SQL files (`*.sql`)
- Config files: `.eslintrc.json`, `tailwind.config.js`, `vitest.config.ts`, etc.
- `.env.example`, `.env.example.ai` (templates only, no real secrets)
- `.gitignore`, `.dockerignore`, `Makefile`

### ❌ Must Recreate / Recover Manually

| Priority | What | Action |
|----------|------|--------|
| 🔴 CRITICAL | `.env` (root) | Phase 2 |
| 🔴 CRITICAL | `backend/.env` | Phase 2 |
| 🔴 CRITICAL | `frontend/.env.local` | Phase 2 |
| 🔴 CRITICAL | `venv/` (Python virtual env) | Phase 3 |
| 🔴 CRITICAL | `frontend/node_modules/` | Phase 4 |
| 🔴 CRITICAL | `blockchain/node_modules/` | Phase 7 |
| 🟠 HIGH | `faiss_index/` (vector store) | Phase 5 |
| 🟠 HIGH | PostgreSQL schema (DB) | Phase 6 |
| 🟠 HIGH | MongoDB data | Phase 6 |
| 🟡 MEDIUM | `models/`, `checkpoints/` | Phase 5 |
| 🟡 MEDIUM | `blockchain/artifacts/` | Phase 7 |
| 🟡 MEDIUM | `blockchain/deployments/` | Phase 7 |
| 🟢 LOW | `docker-compose.override.yml` | Phase 8 |
| 🟢 LOW | `.monitoring/` | Phase 8 |
| 🟢 LOW | Log files, temp files | Not needed |

---

## 🔐 API Keys Quick Reference — Where to Get Them

| Variable | Service | URL |
|----------|---------|-----|
| `SUPABASE_URL` + all Supabase keys | Supabase | https://app.supabase.com → Settings → API |
| `DATABASE_URL` | Supabase DB / Local PG | https://app.supabase.com → Settings → Database |
| `GROQ_API_KEY` | Groq | https://console.groq.com/keys |
| `GEMINI_API_KEY` | Google AI Studio | https://aistudio.google.com/apikey |
| `OPENROUTER_API_KEY` | OpenRouter | https://openrouter.ai/account/keys |
| `MONGODB_URL` | MongoDB Atlas | https://cloud.mongodb.com → Connect |
| `GITHUB_TOKEN` | GitHub | https://github.com/settings/tokens |
| `SECRET_KEY` | Generate locally | `python3 -c "import secrets; print(secrets.token_hex(32))"` |

---

> **Recovery Estimated Time:**
> - Phase 1 (Git check): ~10 min
> - Phase 2 (Secrets): ~30–60 min (depends on key recovery)
> - Phase 3 (Python env): ~20–40 min (large deps to download)
> - Phase 4 (Frontend): ~10–20 min
> - Phase 5 (AI Models): ~30–120 min (model downloads)
> - Phase 6 (Databases): ~20–30 min
> - Phase 7 (Blockchain): ~10–15 min
> - Phase 8 (Docker): ~15–20 min
> - Phase 9 (Verify): ~15–30 min
>
> **Total Expected Time: 2–6 hours** depending on network speed and key retrieval difficulty.

---

*Generated by Antigravity (gsd-codebase-mapper + senior-fullstack) on 2026-03-18*  
*Project: ENGUNITYCORE | Reason: OS failure recovery guide*
