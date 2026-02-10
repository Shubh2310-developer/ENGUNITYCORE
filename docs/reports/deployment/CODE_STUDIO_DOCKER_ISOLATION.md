# Code Studio: Isolated Docker Container Guide

This document provides a detailed technical specification for creating a standalone, end-to-end Dockerized environment for the **Code Studio** page. This configuration allows you to run the IDE playground independently of the main Engunity platform, without requiring authentication, and on custom ports.

## 1. Architecture Overview

The Code Studio is uniquely designed to support a "Playground Mode" using specific backend endpoints that bypass the standard JWT authentication layer.

*   **Frontend**: Next.js 14 (App Router)
    *   **Main Page**: `frontend/src/app/(dashboard)/code/page.tsx`
    *   **State Management**: `frontend/src/stores/codeStore.ts` (Zustand)
*   **Backend**: FastAPI
    *   **Router**: `backend/app/api/v1/code.py`
    *   **Sandbox**: `backend/app/services/code_execution/sandbox.py`
    *   **AI Service**: `backend/app/services/ai/groq_client.py`

### Why it works without login:
The frontend implementation of `handleRunProject` in [page.tsx](frontend/src/app/(dashboard)/code/page.tsx) directly calls the following endpoints:
- `POST /api/v1/code/execute-direct`: Designed for raw execution without DB persistence.
- `POST /api/v1/code/ai-assist`: Designed for AI refactoring.
- `POST /api/v1/code/ai-chat`: Designed for the coding assistant.

These endpoints do **not** use the `get_current_user` dependency, making them ideal for an isolated container.

---

## 2. Backend Docker Configuration

The backend requires a "Heavy" Docker image because it must contain the runtimes for all supported languages (Python, Node, C++, Go, etc.).

### `Dockerfile.code-backend`
```dockerfile
# Use a Python base image
FROM python:3.10-slim

# Install system dependencies and multiple language runtimes
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    gcc \
    g++ \
    make \
    nodejs \
    npm \
    golang-go \
    openjdk-17-jdk \
    ruby \
    php-cli \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the necessary source code for the backend
COPY backend/app ./app
COPY backend/main.py .

# Environment Variables
ENV PYTHONPATH=/app
ENV PORT=8001
ENV ENABLE_AI=True

# Expose the custom port
EXPOSE 8001

# Run the backend focusing on the code router
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 3. Frontend Docker Configuration

The frontend needs to be built with a specific `NEXT_PUBLIC_API_URL` pointing to the isolated backend.

### `Dockerfile.code-frontend`
```dockerfile
# Build Stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY frontend/ ./

# Set Environment Variable for the build
ARG NEXT_PUBLIC_API_URL=http://localhost:8001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN npm run build

# Production Stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the custom port
EXPOSE 3001
ENV PORT=3001

# Start the application
CMD ["node", "server.js"]
```

---

## 4. Orchestration with Docker Compose

Use `docker-compose.yml` to link the services together. This file allows you to easily change port numbers.

### `docker-compose.code.yml`
```yaml
version: '3.8'

services:
  code-backend:
    build:
      context: .
      dockerfile: Dockerfile.code-backend
    ports:
      - "8001:8001" # Host:Container
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - CORS_ORIGINS=http://localhost:3001
    restart: always

  code-frontend:
    build:
      context: .
      dockerfile: Dockerfile.code-frontend
      args:
        - NEXT_PUBLIC_API_URL=http://localhost:8001
    ports:
      - "3001:3001" # Host:Container
    depends_on:
      - code-backend
    restart: always
```

---

## 5. Deployment Instructions

### Prerequisites
- Ensure you have a valid `GROQ_API_KEY` for the AI Refine panel to work.
- Docker and Docker Compose installed.

### Step-by-Step Execution
1.  **Place the files**: Create the three files above in your project root (`/home/agentrogue/Engunity/`).
2.  **Configure Environment**:
    ```bash
    export GROQ_API_KEY=your_key_here
    ```
3.  **Build and Run**:
    ```bash
    docker-compose -f docker-compose.code.yml up --build
    ```
4.  **Access the IDE**:
    Open your browser and navigate to `http://localhost:3001/code`.

### Troubleshooting Port Conflicts
If port `3001` or `8001` is already in use, simply modify the `ports` mapping in `docker-compose.code.yml`:
- To change the frontend port to `4000`: ` "4000:3001" `
- To change the backend port to `9000`: ` "9000:8001" ` (Ensure you update the `NEXT_PUBLIC_API_URL` arg accordingly).

## 6. Security Note
This isolated container is intended for **Playground/Testing** use only. Since it bypasses the login system, any user with access to the port can execute code on the container's host. Ensure this is run in a firewalled or internal environment.
