# Engunity AI

AI-powered engineering platform with intelligent chat (Groq LLaMA 3.3), RAG research, code execution, and interview prep tools.  
Enterprise SaaS built on Next.js 14, FastAPI, PostgreSQL, with multi-LLM routing and blockchain provenance.

---

## Overview

Engunity AI is a comprehensive platform designed for developers and engineering teams, providing AI-assisted tools for coding, research, technical interview preparation, and data analysis. The platform leverages state-of-the-art language models, retrieval-augmented generation (RAG), and secure code execution environments to deliver intelligent assistance across the software development lifecycle.

### Core Capabilities

- **Neural Chat Interface**: Real-time conversational AI powered by Groq's LLaMA 3.3 70B model with context-aware responses
- **Document Intelligence**: RAG-enhanced research tools with FAISS vector storage for semantic search and retrieval
- **Code Laboratory**: Sandboxed code execution environment with multi-language support
- **Technical Interview Prep**: Structured interview question banks, coding challenges, and GitHub repository analysis
- **Data Analytics**: Advanced data analysis with AI-generated insights, custom visualizations, and predictive modeling
- **Blockchain Verification**: Immutable provenance tracking for critical operations and data integrity

---

## Architecture

### Technology Stack

**Frontend**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- State Management: Zustand
- Styling: CSS Modules, TailwindCSS
- UI Components: Custom React components

**Backend**
- Framework: FastAPI (Python 3.10+)
- ORM: SQLAlchemy 2.0
- Validation: Pydantic v2
- Authentication: JWT (JSON Web Tokens)
- API Documentation: OpenAPI/Swagger

**Data Layer**
- Primary Database: PostgreSQL 15
- Caching: Redis 7
- Vector Store: FAISS
- Object Storage: Supabase Storage

**AI/ML**
- Primary LLM: Groq API (LLaMA 3.3 70B)
- Local Model: Phi-2 (optional)
- Embeddings: sentence-transformers
- RAG Pipeline: Custom implementation with FAISS

**Infrastructure**
- Containerization: Docker, Docker Compose
- Reverse Proxy: Nginx
- Orchestration: Kubernetes-ready

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│                   (Next.js Frontend)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                         │
│                   (FastAPI Routes)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │   AI     │  │ Document │  │   Code   │
    │ Services │  │ Services │  │ Execution│
    └──────────┘  └──────────┘  └──────────┘
            │           │           │
            └───────────┼───────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │   Data Persistence   │
            │ (PostgreSQL + Redis) │
            └──────────────────────┘
```

---

## Project Structure

```
engunity-ai/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Route handlers and pages
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API integration layer
│   │   ├── stores/       # State management
│   │   └── lib/          # Utilities and helpers
│   └── public/           # Static assets
│
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # REST API endpoints
│   │   ├── services/    # Business logic layer
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Request/response schemas
│   │   └── core/        # Configuration and utilities
│   └── tests/           # Unit and integration tests
│
├── ai-core/             # AI/ML pipeline
│   ├── llm/            # Language model interfaces
│   ├── rag/            # Retrieval-augmented generation
│   ├── embeddings/     # Vector embeddings
│   └── pipelines/      # Processing pipelines
│
├── blockchain/          # Smart contracts (optional)
│   ├── contracts/      # Solidity contracts
│   ├── scripts/        # Deployment scripts
│   └── test/           # Contract tests
│
├── docs/               # Documentation
│   └── architecture/   # Technical documentation
│
├── scripts/            # Automation scripts
│   └── setup/          # Installation scripts
│
└── infra/              # Infrastructure configuration
    ├── nginx/          # Reverse proxy config
    └── monitoring/     # Observability setup
```

---

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- Python 3.10 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher (optional)
- Groq API key ([obtain here](https://console.groq.com))

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/engunity-ai.git
cd engunity-ai
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and provide the following:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/engunity

# AI Services
GROQ_API_KEY=your_groq_api_key_here

# JWT Secret
SECRET_KEY=your_secret_key_here

# Supabase (for storage)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**3. Initialize database**

```bash
python scripts/setup/init_chat_tables.py
```

**4. Install dependencies**

Backend:
```bash
cd backend
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

**5. Start development servers**

Backend:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

## Features

### Chat Interface

Conversational AI with context retention, markdown formatting, code syntax highlighting, and session management. Supports file uploads for document-based conversations.

**Key Features:**
- Multi-session management
- Message history persistence
- Markdown and code rendering
- File upload support
- Real-time responses

### Research Tools

Document analysis powered by RAG technology for semantic search, information extraction, and intelligent summarization.

**Key Features:**
- Document upload and processing
- Vector-based semantic search
- Multi-document analysis
- Citation tracking
- Export to various formats

### Code Laboratory

Secure, sandboxed environment for code execution with support for multiple programming languages.

**Key Features:**
- Multi-language support (Python, JavaScript, etc.)
- Isolated execution environment
- Real-time output streaming
- Error handling and debugging
- Code snippet library

### Analytics Platform

Data analysis with AI-driven insights, custom visualizations, and statistical modeling.

**Key Features:**
- CSV/Excel file processing
- Automated statistical analysis
- Custom chart generation
- Correlation detection
- Predictive modeling
- PDF report export

### Interview Preparation

Comprehensive technical interview preparation with curated question banks and GitHub repository analysis.

**Key Features:**
- Categorized question database
- Difficulty-based filtering
- Code submission and review
- GitHub repository insights
- Progress tracking

---

## API Documentation

### Authentication

All API endpoints require JWT authentication. Obtain a token via the `/api/v1/auth/login` endpoint.

**Request:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Chat Endpoints

**Get all chat sessions:**
```
GET /api/v1/chat/
Authorization: Bearer {token}
```

**Send a message:**
```
POST /api/v1/chat/
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Your message here",
  "session_id": "optional-session-id"
}
```

Complete API documentation is available at `/docs` when running the development server.

---

## Configuration

### Database Configuration

The application uses PostgreSQL for primary data storage. Configure the connection string in `.env`:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

### AI Model Configuration

Configure AI model preferences in `/backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    GROQ_API_KEY: str
    PHI2_LOCAL_PATH: Optional[str] = None  # For local model
```

### Storage Configuration

Supabase is used for file storage. Configure in `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Deployment

### Docker Deployment

**1. Build and start services:**

```bash
docker-compose up -d
```

**2. Initialize database:**

```bash
docker-compose exec backend python scripts/setup/init_chat_tables.py
```

**3. Access application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Production Deployment

For production deployment, consider:

- Use environment-specific configuration files
- Enable HTTPS with SSL certificates
- Configure CORS for your domain
- Set up database backups
- Implement rate limiting
- Configure monitoring and logging
- Use a process manager (e.g., PM2, Supervisor)
- Set up a reverse proxy (Nginx, Caddy)

---

## Development

### Code Style

**Python:**
- Follow PEP 8 guidelines
- Use type hints
- Maximum line length: 100 characters

**TypeScript:**
- Follow ESLint configuration
- Use functional components
- Prefer composition over inheritance

### Testing

**Backend tests:**
```bash
cd backend
pytest tests/ -v
```

**Frontend tests:**
```bash
cd frontend
npm run test
```

### Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## Security

### API Key Management

Never commit API keys or sensitive credentials to version control. Use environment variables for all secrets.

### Database Security

- Use strong passwords for database connections
- Enable SSL for database connections in production
- Regularly update and patch database software
- Implement role-based access control

### Code Execution Security

The code execution environment uses sandboxing to prevent malicious code execution. However, always review submitted code before execution in production environments.

---

## Performance

### Optimization Strategies

- Redis caching for frequently accessed data
- Database query optimization with indexes
- Lazy loading for large datasets
- Request debouncing on frontend
- Response pagination for large result sets

### Monitoring

Key metrics to monitor:

- API response times
- Database query performance
- LLM token usage
- Error rates
- User session duration

---

## License

Proprietary. All rights reserved.

---

## Support

For technical support or feature requests, please open an issue in the GitHub repository.

**Documentation:** `/docs/architecture/`  
**API Reference:** `/docs` (when server is running)

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org) - React framework
- [FastAPI](https://fastapi.tiangolo.com) - Python web framework
- [Groq](https://groq.com) - AI inference platform
- [PostgreSQL](https://www.postgresql.org) - Database system
- [Supabase](https://supabase.com) - Backend platform

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Maintained by:** Engunity AI Team