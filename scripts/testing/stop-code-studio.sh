#!/bin/bash

# Stop Code Studio Standalone Docker containers

# Detect Docker Compose version
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Error: Docker Compose not found"
    exit 1
fi

echo "Stopping Code Studio containers..."
$DOCKER_COMPOSE -f docker-compose.code.yml down

echo ""
echo "✓ Code Studio stopped"
echo ""
echo "To start again, run: ./setup-code-studio.sh"
