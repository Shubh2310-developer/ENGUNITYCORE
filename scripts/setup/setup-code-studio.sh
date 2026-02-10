#!/bin/bash

# Code Studio Standalone Docker Setup Script
# This script helps you quickly set up and run the Code Studio in an isolated Docker environment

set -e

echo "================================================"
echo "Code Studio Standalone Docker Setup"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed (v1 or v2)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker and Docker Compose are installed ($DOCKER_COMPOSE)"
echo ""

# Check if .env.code.local exists
if [ ! -f .env.code.local ]; then
    echo "📝 Creating .env.code.local configuration file..."
    cp .env.code .env.code.local
    
    echo ""
    echo "⚠️  IMPORTANT: You need to set your GROQ_API_KEY in .env.code.local"
    echo ""
    read -p "Do you have a Groq API key ready? (y/n): " has_key
    
    if [ "$has_key" = "y" ] || [ "$has_key" = "Y" ]; then
        read -p "Enter your Groq API key: " api_key
        sed -i "s/your_groq_api_key_here/$api_key/" .env.code.local
        echo "✓ API key configured"
    else
        echo ""
        echo "Please get a Groq API key from: https://console.groq.com/keys"
        echo "Then edit .env.code.local and add your key before running this script again."
        exit 1
    fi
else
    echo "✓ Configuration file .env.code.local exists"
fi

echo ""
echo "================================================"
echo "Building and starting Code Studio containers..."
echo "================================================"
echo ""
echo "This may take several minutes on the first run..."
echo ""

# Build and start the containers
$DOCKER_COMPOSE --env-file .env.code.local -f docker-compose.code.yml up --build -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if containers are running
backend_status=$($DOCKER_COMPOSE -f docker-compose.code.yml ps -q code-backend 2>/dev/null)
frontend_status=$($DOCKER_COMPOSE -f docker-compose.code.yml ps -q code-frontend 2>/dev/null)

if [ -n "$backend_status" ] && [ -n "$frontend_status" ]; then
    echo ""
    echo "================================================"
    echo "✅ Code Studio is now running!"
    echo "================================================"
    echo ""
    echo "🌐 Frontend: http://localhost:3001/code"
    echo "🔧 Backend API: http://localhost:8001/docs"
    echo ""
    echo "To view logs:"
    echo "  $DOCKER_COMPOSE -f docker-compose.code.yml logs -f"
    echo ""
    echo "To stop the containers:"
    echo "  $DOCKER_COMPOSE -f docker-compose.code.yml down"
    echo ""
    echo "⚠️  Security Note: This runs without authentication."
    echo "   Only use in trusted/internal networks."
    echo ""
else
    echo ""
    echo "❌ Error: Containers failed to start properly"
    echo "Check logs with: $DOCKER_COMPOSE -f docker-compose.code.yml logs"
    exit 1
fi
