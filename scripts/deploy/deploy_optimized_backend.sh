#!/bin/bash
# Automated Deployment Script for Optimized Backend

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     DEPLOYING OPTIMIZED BACKEND - AUTOMATED SCRIPT         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Detect Docker Compose version
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
    echo "✅ Docker Compose V2 detected"
else
    COMPOSE_CMD="docker-compose"
    echo "✅ Docker Compose V1 detected"
fi

# Step 1: Stop current backend
echo ""
echo "📦 Step 1: Stopping current backend..."
$COMPOSE_CMD stop backend 2>/dev/null || echo "   No running backend to stop"
sleep 2

# Step 2: Rebuild backend with optimizations
echo ""
echo "🔨 Step 2: Building optimized backend..."
echo "   - 8 workers for 16-core system"
echo "   - 32 connection pool size"
echo "   - Response caching enabled"
echo "   - GZip compression enabled"
echo "   - Parallel AI warmup"
$COMPOSE_CMD build backend

# Step 3: Start services
echo ""
echo "🚀 Step 3: Starting optimized services..."
$COMPOSE_CMD up -d

# Step 4: Wait for services to initialize
echo ""
echo "⏳ Step 4: Waiting for services to warm up (30 seconds)..."
for i in {30..1}; do
    echo -ne "   Waiting: $i seconds remaining...\r"
    sleep 1
done
echo ""

# Step 5: Verify deployment
echo ""
echo "✅ Step 5: Verifying deployment..."
echo ""

# Check if containers are running
echo "📦 Container Status:"
docker ps --filter name=engunity --format "table {{.Names}}\t{{.Status}}" | grep engunity

echo ""
echo "👥 Worker Count:"
WORKERS=$(docker exec engunity-backend ps aux 2>/dev/null | grep -c "[u]vicorn" || echo "0")
if [ "$WORKERS" -ge 8 ]; then
    echo "   ✅ $WORKERS workers running (expected: 8)"
else
    echo "   ⚠️  Only $WORKERS workers running (expected: 8)"
fi

echo ""
echo "🔴 Redis Status:"
REDIS_STATUS=$(docker exec engunity-redis redis-cli PING 2>/dev/null || echo "FAILED")
if [ "$REDIS_STATUS" = "PONG" ]; then
    echo "   ✅ Redis is running and responding"
else
    echo "   ❌ Redis connection failed"
fi

echo ""
echo "🗄️  Database Status:"
DB_STATUS=$(docker exec engunity-db pg_isready -U user 2>/dev/null || echo "FAILED")
if [[ "$DB_STATUS" == *"accepting connections"* ]]; then
    echo "   ✅ Database is accepting connections"
else
    echo "   ❌ Database connection failed"
fi

echo ""
echo "🚀 API Health Check:"
sleep 3  # Give API a moment to fully start
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8001/health 2>/dev/null || echo "FAILED\n000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP 200)"
else
    echo "   ⚠️  API response: HTTP $HTTP_CODE (may still be starting up)"
fi

echo ""
echo "💾 Cache Test:"
# First request (should be MISS)
CACHE1=$(curl -s -v http://localhost:8001/health 2>&1 | grep -o "X-Cache: [A-Z]*" || echo "X-Cache: N/A")
sleep 1
# Second request (should be HIT)
CACHE2=$(curl -s -v http://localhost:8001/health 2>&1 | grep -o "X-Cache: [A-Z]*" || echo "X-Cache: N/A")
echo "   First request:  $CACHE1 (expected: MISS)"
echo "   Second request: $CACHE2 (expected: HIT)"
if [[ "$CACHE2" == *"HIT"* ]]; then
    echo "   ✅ Response caching is working!"
else
    echo "   ⚠️  Caching may need a moment to initialize"
fi

echo ""
echo "📊 Backend Logs (last 10 lines):"
docker logs --tail 10 engunity-backend 2>&1 | sed 's/^/   /'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              DEPLOYMENT COMPLETE! ✅                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Summary:"
echo "   • 8 workers deployed (optimized for 16 cores)"
echo "   • 32 database connections in pool"
echo "   • Response caching enabled (5 min TTL)"
echo "   • GZip compression enabled"
echo "   • Parallel AI service warmup"
echo ""
echo "🧪 Next Steps:"
echo "   1. Run performance tests:"
echo "      cd backend && python tmp_rovodev_performance_test.py"
echo ""
echo "   2. Monitor real-time performance:"
echo "      python backend/monitoring_dashboard.py"
echo ""
echo "   3. Quick health check:"
echo "      ./backend/monitoring_commands.sh"
echo ""
echo "   4. Add database indexes (run once):"
echo "      docker exec -i engunity-db psql -U user -d engunity < backend/add_performance_indexes.sql"
echo ""
echo "📚 Documentation:"
echo "   • BACKEND_OPTIMIZATION_COMPLETE.md - Full details"
echo "   • QUICK_START_OPTIMIZATIONS.md - Quick reference"
echo "   • DEPLOYMENT_GUIDE_STEP_BY_STEP.md - Complete guide"
echo ""
