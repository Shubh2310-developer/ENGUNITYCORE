# Complete Deployment & Optimization Guide 🚀

This guide covers all 5 steps: Deploy → Test → Fine-tune → Optimize → Monitor

---

## 📋 STEP 1: DEPLOYMENT

### Option A: Docker Deployment (Recommended)

#### Prerequisites Check
```bash
# Check Docker is installed
docker --version
docker compose version  # or docker-compose --version

# Check if containers are running
docker ps

# Check system resources
echo "CPU Cores: $(nproc)"
free -h
```

#### Deployment Steps

**1.1 Stop Current Backend (if running)**
```bash
# Using docker compose v2
docker compose stop backend

# OR using docker-compose v1
docker-compose stop backend

# OR stop all services
docker compose down
```

**1.2 Rebuild Backend with Optimizations**
```bash
# Build the optimized backend
docker compose build backend

# This will include:
# ✓ Multi-worker setup (4 workers)
# ✓ All optimized code
# ✓ New dependencies (redis async)
```

**1.3 Start Services**
```bash
# Start all services
docker compose up -d

# OR start only backend
docker compose up -d backend

# Wait for warmup (30 seconds)
echo "Waiting for services to warm up..."
sleep 30
```

**1.4 Verify Deployment**
```bash
# Check containers are running
docker ps

# Check backend logs
docker logs engunity-backend | tail -30

# Verify workers started (should see 4 workers)
docker logs engunity-backend | grep "Started server process"

# Check for AI warmup completion
docker logs engunity-backend | grep -i "warmed up\|warmup"

# Test health endpoint
curl http://localhost:8001/health
```

### Option B: Local Development Deployment

**1.1 Install Dependencies**
```bash
cd backend

# Create/activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install updated requirements
pip install -r requirements.txt
```

**1.2 Start Backend with Multiple Workers**
```bash
# Production mode (4 workers)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# OR Development mode (single worker with reload)
uvicorn app.main:app --reload --port 8000
```

**1.3 Verify Deployment**
```bash
# Check process
ps aux | grep uvicorn

# Test endpoint
curl http://localhost:8000/health
```

---

## 🧪 STEP 2: PERFORMANCE TESTING

### 2.1 Quick Manual Tests

**Test 1: Health Check Performance**
```bash
# Measure response time
time curl http://localhost:8001/health

# Should be < 100ms
```

**Test 2: Cache Verification**
```bash
# First request (cache MISS)
curl -v http://localhost:8001/health 2>&1 | grep "X-Cache"

# Second request (cache HIT)
curl -v http://localhost:8001/health 2>&1 | grep "X-Cache"

# Expected output:
# First:  X-Cache: MISS
# Second: X-Cache: HIT
```

**Test 3: Concurrent Load**
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl -s http://localhost:8001/health > /dev/null &
done
wait

echo "All requests completed"
```

### 2.2 Automated Performance Test Suite

```bash
cd backend

# Run comprehensive tests
python tmp_rovodev_performance_test.py

# Expected results:
# ✓ Response time: < 100ms
# ✓ Cache hit rate: > 70%
# ✓ Concurrent requests: > 20/sec
# ✓ All workers active
```

### 2.3 Load Testing with Apache Bench (Optional)

```bash
# Install ab (Apache Bench)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: Already included

# Run 1000 requests with 50 concurrent
ab -n 1000 -c 50 http://localhost:8001/health

# Look for:
# - Requests per second: > 100
# - Time per request: < 500ms
# - Failed requests: 0
```

### 2.4 Database Connection Pool Test

```bash
# Check active database connections
docker exec engunity-db psql -U user -d engunity -c \
  "SELECT count(*) as active_connections, state 
   FROM pg_stat_activity 
   WHERE datname = 'engunity' 
   GROUP BY state;"

# Should show connections within pool limit (20)
```

---

## 🎛️ STEP 3: FINE-TUNING CONFIGURATION

### 3.1 Determine Optimal Worker Count

**Formula:** Workers = (2 × CPU Cores) + 1

```bash
# Check CPU cores
nproc  # or: sysctl -n hw.ncpu (macOS)

# Examples:
# 2 cores → 5 workers
# 4 cores → 9 workers
# 8 cores → 17 workers
```

**Adjust Workers:**
```dockerfile
# backend/Dockerfile
# Change this line based on your CPU:
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "5"]
```

### 3.2 Optimize Database Pool Size

**Formula:** pool_size = 2-4 per worker

```python
# backend/app/core/database.py

# For 4 workers:
pool_size=20,        # 5 per worker
max_overflow=10,

# For 8 workers (high traffic):
pool_size=32,        # 4 per worker
max_overflow=16,

# For 2 workers (low memory):
pool_size=10,        # 5 per worker
max_overflow=5,
```

### 3.3 Memory-Based Tuning

```bash
# Check memory usage per worker
docker stats engunity-backend --no-stream

# Each worker typically uses: 500MB - 1GB
```

**Low Memory System (< 4GB):**
```dockerfile
# backend/Dockerfile
CMD ["uvicorn", "app.main:app", "--workers", "2"]
```

```python
# backend/app/core/database.py
pool_size=10,
max_overflow=5,
```

**High Memory System (> 16GB):**
```dockerfile
# backend/Dockerfile
CMD ["uvicorn", "app.main:app", "--workers", "8"]
```

```python
# backend/app/core/database.py
pool_size=32,
max_overflow=16,
```

### 3.4 Cache TTL Optimization

```python
# backend/app/main.py

# For mostly static data (analytics, reports):
app.add_middleware(ResponseCacheMiddleware, ttl=600)  # 10 minutes

# For frequently changing data (chat, live updates):
app.add_middleware(ResponseCacheMiddleware, ttl=60)   # 1 minute

# Default (balanced):
app.add_middleware(ResponseCacheMiddleware, ttl=300)  # 5 minutes
```

### 3.5 Redis Configuration

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
  # Adjust maxmemory based on available RAM
```

---

## 🚀 STEP 4: ADDITIONAL OPTIMIZATIONS

### 4.1 Database Query Optimization

**Create Indexes for Common Queries**

```sql
-- Connect to database
docker exec -it engunity-db psql -U user -d engunity

-- Add indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Add indexes for decisions
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions USING GIN(tags);

-- Add indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Verify indexes
\di
```

**Save as Migration Script:**
```bash
cat > backend/add_performance_indexes.sql << 'EOF'
-- Performance Indexes for Optimized Queries

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Decision indexes
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions USING GIN(tags);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

ANALYZE;
EOF

# Apply indexes
docker exec -i engunity-db psql -U user -d engunity < backend/add_performance_indexes.sql
```

### 4.2 Query Result Caching

Create a decorator for expensive queries:

```python
# backend/app/core/query_cache.py
from functools import wraps
import hashlib
import json
import redis.asyncio as aioredis
from app.core.config import settings
from loguru import logger

redis_client = None

async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = await aioredis.from_url(settings.REDIS_URL)
    return redis_client

def cache_query(ttl: int = 300):
    """Decorator to cache database query results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"query:{func.__name__}:{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"
            
            try:
                redis = await get_redis()
                cached = await redis.get(cache_key)
                if cached:
                    logger.debug(f"Query cache HIT: {func.__name__}")
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
            
            # Execute query
            result = await func(*args, **kwargs)
            
            # Cache result
            try:
                redis = await get_redis()
                await redis.setex(cache_key, ttl, json.dumps(result, default=str))
            except Exception as e:
                logger.warning(f"Cache write error: {e}")
            
            return result
        return wrapper
    return decorator
```

**Usage Example:**
```python
from app.core.query_cache import cache_query

@cache_query(ttl=600)  # Cache for 10 minutes
async def get_user_decisions(user_id: str, limit: int = 50):
    # Your expensive query here
    pass
```

### 4.3 Enable GZip Compression

```python
# backend/app/main.py
from fastapi.middleware.gzip import GZipMiddleware

# Add after other middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 4.4 Static File CDN Setup (for production)

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing settings ...
    CDN_URL: Optional[str] = None  # e.g., "https://cdn.yoursite.com"
    ENABLE_CDN: bool = False
```

### 4.5 Background Task Queue Optimization

```python
# backend/app/core/celery_config.py (if using Celery)
from celery import Celery

celery_app = Celery(
    "engunity",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Optimize Celery settings
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)
```

---

## 📊 STEP 5: MONITORING & ANALYSIS

### 5.1 Create Monitoring Script

```python
# backend/monitoring_dashboard.py
#!/usr/bin/env python3
"""
Real-time Backend Performance Monitor
"""
import asyncio
import httpx
import time
from datetime import datetime
import redis.asyncio as aioredis
from collections import deque

class PerformanceMonitor:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.response_times = deque(maxlen=100)
        self.cache_hits = 0
        self.cache_misses = 0
        self.error_count = 0
        
    async def check_health(self):
        """Monitor health endpoint"""
        try:
            start = time.time()
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health", timeout=5.0)
            
            elapsed = time.time() - start
            self.response_times.append(elapsed * 1000)  # ms
            
            # Check cache header
            if response.headers.get("X-Cache") == "HIT":
                self.cache_hits += 1
            else:
                self.cache_misses += 1
            
            return True, elapsed * 1000
        except Exception as e:
            self.error_count += 1
            return False, 0
    
    async def get_redis_stats(self):
        """Get Redis statistics"""
        try:
            redis = await aioredis.from_url("redis://localhost:6379")
            info = await redis.info()
            await redis.close()
            
            return {
                "memory_used": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands": info.get("total_commands_processed", 0),
            }
        except:
            return {"error": "Redis not available"}
    
    def get_stats(self):
        """Calculate statistics"""
        if not self.response_times:
            return {}
        
        times = list(self.response_times)
        cache_total = self.cache_hits + self.cache_misses
        cache_rate = (self.cache_hits / cache_total * 100) if cache_total > 0 else 0
        
        return {
            "avg_response_time": sum(times) / len(times),
            "min_response_time": min(times),
            "max_response_time": max(times),
            "cache_hit_rate": cache_rate,
            "error_count": self.error_count,
        }
    
    async def run(self, interval=5):
        """Run monitoring loop"""
        print("🔍 Backend Performance Monitor")
        print("=" * 60)
        print("Monitoring: " + self.base_url)
        print("=" * 60)
        print()
        
        while True:
            # Check health
            success, response_time = await self.check_health()
            
            # Get stats
            stats = self.get_stats()
            redis_stats = await self.get_redis_stats()
            
            # Clear screen (optional)
            print("\033[2J\033[H", end="")
            
            # Display dashboard
            print("╔════════════════════════════════════════════════════════════╗")
            print("║         BACKEND PERFORMANCE DASHBOARD                      ║")
            print("╚════════════════════════════════════════════════════════════╝")
            print()
            print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"🌐 Endpoint: {self.base_url}/health")
            print()
            
            if stats:
                print("📊 RESPONSE TIMES")
                print(f"   Average: {stats['avg_response_time']:.2f}ms")
                print(f"   Min: {stats['min_response_time']:.2f}ms")
                print(f"   Max: {stats['max_response_time']:.2f}ms")
                print()
                
                print("💾 CACHE STATISTICS")
                print(f"   Hit Rate: {stats['cache_hit_rate']:.1f}%")
                print(f"   Hits: {self.cache_hits}")
                print(f"   Misses: {self.cache_misses}")
                print()
            
            print("🔴 REDIS STATUS")
            for key, value in redis_stats.items():
                print(f"   {key}: {value}")
            print()
            
            print(f"❌ Errors: {self.error_count}")
            print()
            print("Press Ctrl+C to stop...")
            
            await asyncio.sleep(interval)

if __name__ == "__main__":
    monitor = PerformanceMonitor()
    try:
        asyncio.run(monitor.run(interval=3))
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped.")
```

**Run Monitor:**
```bash
cd backend
python monitoring_dashboard.py
```

### 5.2 Docker Stats Monitoring

```bash
# Monitor container resources
docker stats engunity-backend --no-stream

# Continuous monitoring
watch -n 2 "docker stats engunity-backend --no-stream"
```

### 5.3 Application Logs Analysis

```bash
# View real-time logs
docker logs -f engunity-backend

# Filter for performance issues
docker logs engunity-backend | grep -E "(ERROR|WARNING|slow)"

# Count errors in last hour
docker logs --since 1h engunity-backend | grep ERROR | wc -l

# Analyze response times
docker logs engunity-backend | grep "completed" | tail -100
```

### 5.4 Database Performance Monitoring

```sql
-- Connect to database
docker exec -it engunity-db psql -U user -d engunity

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check connection pool usage
SELECT 
    count(*) as connections,
    state,
    wait_event_type
FROM pg_stat_activity
WHERE datname = 'engunity'
GROUP BY state, wait_event_type;
```

### 5.5 Create Monitoring Dashboard Script

```bash
cat > backend/monitoring_commands.sh << 'EOF'
#!/bin/bash
# Quick Monitoring Commands

echo "════════════════════════════════════════════════════════════"
echo "           BACKEND PERFORMANCE QUICK CHECK"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "🐳 Docker Container Status:"
docker ps --filter name=engunity-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "👥 Uvicorn Workers:"
docker exec engunity-backend ps aux | grep uvicorn | grep -v grep | wc -l
echo "   (Should be 4)"

echo ""
echo "💾 Memory Usage:"
docker stats engunity-backend --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"

echo ""
echo "🔴 Redis Status:"
docker exec engunity-redis redis-cli PING 2>/dev/null || echo "Redis not accessible"

echo ""
echo "🗄️  Database Connections:"
docker exec engunity-db psql -U user -d engunity -t -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='engunity';" 2>/dev/null || echo "Database not accessible"

echo ""
echo "📊 Cache Hit Rate (last 100 requests):"
docker logs --tail 100 engunity-backend 2>/dev/null | grep "X-Cache" | \
  awk '{if(/HIT/) hit++; if(/MISS/) miss++} END {
    total=hit+miss; 
    rate=total>0 ? (hit/total)*100 : 0; 
    printf "   Hits: %d | Misses: %d | Rate: %.1f%%\n", hit, miss, rate
  }'

echo ""
echo "❌ Recent Errors:"
docker logs --tail 1000 engunity-backend 2>/dev/null | grep -i error | tail -5

echo ""
echo "════════════════════════════════════════════════════════════"
EOF

chmod +x backend/monitoring_commands.sh
```

**Run Quick Monitoring:**
```bash
./backend/monitoring_commands.sh
```

### 5.6 Grafana + Prometheus Setup (Advanced)

**Add to docker-compose.yml:**
```yaml
services:
  # ... existing services ...

  prometheus:
    image: prom/prometheus:latest
    container_name: engunity-prometheus
    volumes:
      - ./infra/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    container_name: engunity-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

volumes:
  prometheus_data:
  grafana_data:
```

---

## ✅ DEPLOYMENT COMPLETION CHECKLIST

### Post-Deployment Verification

- [ ] All workers started (4 workers visible in logs)
- [ ] Health endpoint responding (< 100ms)
- [ ] Cache working (X-Cache: HIT on second request)
- [ ] Redis connected and responding
- [ ] Database connection pool active
- [ ] AI services warmed up
- [ ] No errors in logs
- [ ] Performance tests passing

### Monitoring Setup

- [ ] Monitoring script created and tested
- [ ] Docker stats accessible
- [ ] Database indexes created
- [ ] Redis cache monitored
- [ ] Log analysis tools ready

### Configuration Tuning

- [ ] Worker count optimized for CPU cores
- [ ] Database pool sized appropriately
- [ ] Cache TTL configured for data patterns
- [ ] Memory usage within limits

---

## 🎯 Expected Results

After completing all 5 steps, you should see:

✅ **3-4x throughput improvement**
✅ **60% faster startup time**
✅ **80-90% faster repeated queries**
✅ **40-60% better concurrent handling**
✅ **Zero connection pool errors**
✅ **High cache hit rates (>70%)**
✅ **Sub-100ms response times**

---

## 📞 Troubleshooting Guide

### Issue: Workers not starting
**Check:** `docker logs engunity-backend`
**Fix:** Reduce worker count or increase memory

### Issue: Cache not working
**Check:** `docker logs engunity-redis`
**Fix:** Ensure Redis container is running

### Issue: Slow queries
**Check:** Database logs and run `EXPLAIN ANALYZE`
**Fix:** Add missing indexes from Step 4.1

### Issue: Memory exhaustion
**Check:** `docker stats`
**Fix:** Reduce workers or increase container memory limit

---

**This completes the full deployment and optimization process!** 🎉
