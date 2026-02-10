# Use Python 3.10 slim as base
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/app

# Install system dependencies for OpenCV, FAISS, and Postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libpq-dev \
    curl \
    libmagic1 \
    libmagic-dev \
    file \
    ca-certificates \
    iputils-ping \
    dnsutils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Update CA certificates for MongoDB Atlas SSL connectivity
RUN update-ca-certificates

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for uploads and storage
RUN mkdir -p storage uploads

# Expose port 8000
EXPOSE 8000

# Command to run the application
# Using 1 worker for stability in constrained environments
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--timeout-keep-alive", "65", "--backlog", "2048"]
