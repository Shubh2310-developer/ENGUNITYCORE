#!/bin/bash
# Quick Monitoring Commands for Backend Performance

echo "════════════════════════════════════════════════════════════"
echo "           BACKEND PERFORMANCE QUICK CHECK"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "🐳 Docker Container Status:"
docker ps --filter name=engunity-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   Container not found or Docker not running"

echo ""
echo "👥 Uvicorn Workers:"
WORKERS=$(docker exec engunity-backend ps aux 2>/dev/null | grep -c "[u]vicorn" || echo "0")
echo "   Active Workers: $WORKERS (Expected: 4)"

echo ""
echo "💾 Memory & CPU Usage:"
docker stats engunity-backend --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}" 2>/dev/null || echo "   Unable to get stats"

echo ""
echo "🔴 Redis Status:"
REDIS_STATUS=$(docker exec engunity-redis redis-cli PING 2>/dev/null || echo "FAILED")
if [ "$REDIS_STATUS" = "PONG" ]; then
    echo "   ✅ Redis is running"
    docker exec engunity-redis redis-cli INFO stats 2>/dev/null | grep -E "total_commands_processed|keyspace_hits|keyspace_misses" | sed 's/^/   /'
else
    echo "   ❌ Redis not accessible"
fi

echo ""
echo "🗄️  Database Status:"
DB_CONN=$(docker exec engunity-db psql -U user -d engunity -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='engunity';" 2>/dev/null | tr -d ' ')
if [ -n "$DB_CONN" ]; then
    echo "   Active Connections: $DB_CONN (Pool size: 20)"
else
    echo "   ❌ Database not accessible"
fi

echo ""
echo "📊 Recent Request Performance:"
docker logs --tail 100 engunity-backend 2>/dev/null | grep "X-Cache" | \
  awk 'BEGIN {hit=0; miss=0} 
       /HIT/ {hit++} 
       /MISS/ {miss++} 
       END {
         total=hit+miss
         if (total > 0) {
           rate=(hit/total)*100
           printf "   Cache Hits: %d | Misses: %d | Hit Rate: %.1f%%\n", hit, miss, rate
         } else {
           print "   No cache data available yet"
         }
       }'

echo ""
echo "❌ Recent Errors (last 5):"
ERROR_COUNT=$(docker logs --tail 1000 engunity-backend 2>/dev/null | grep -i "ERROR" | wc -l | tr -d ' ')
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "   Total errors in last 1000 lines: $ERROR_COUNT"
    docker logs --tail 1000 engunity-backend 2>/dev/null | grep -i "ERROR" | tail -5 | sed 's/^/   /'
else
    echo "   ✅ No errors found in recent logs"
fi

echo ""
echo "🚀 API Health Check:"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8001/health 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP 200)"
else
    echo "   ⚠️  API health check failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Quick check complete!"
echo ""
echo "For detailed monitoring, run:"
echo "   python backend/monitoring_dashboard.py"
echo "════════════════════════════════════════════════════════════"
