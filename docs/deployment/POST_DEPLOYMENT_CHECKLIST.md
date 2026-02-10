# Post-Deployment Checklist ✅

Run these steps after the Docker build completes to verify and finalize optimizations.

---

## 1️⃣ VERIFY DEPLOYMENT (5 minutes)

### Step 1.1: Check Container Status
```bash
docker compose ps
```
**Expected:** All containers show "Up" status, especially `engunity-backend`

### Step 1.2: Verify Worker Count
```bash
docker logs engunity-backend | grep "Started server process"
```
**Expected:** 8 lines showing 8 different PIDs (8 workers)

### Step 1.3: Test API Health
```bash
curl http://localhost:8001/health
```
**Expected:** `{"status":"healthy"}` response in < 100ms

### Step 1.4: Verify Response Caching
```bash
# First request (cache MISS)
curl -v http://localhost:8001/health 2>&1 | grep "X-Cache"

# Wait 1 second
sleep 1

# Second request (cache HIT)
curl -v http://localhost:8001/health 2>&1 | grep "X-Cache"
```
**Expected:** 
- First: `X-Cache: MISS`
- Second: `X-Cache: HIT`

### Step 1.5: Run Quick Health Check
```bash
./backend/monitoring_commands.sh
```
**Expected:** All green checkmarks ✅

---

## 2️⃣ RUN PERFORMANCE TESTS (10 minutes)

### Step 2.1: Automated Test Suite
```bash
cd backend
python tmp_rovodev_performance_test.py
```

**Expected Results:**
- ✅ Average response time: < 100ms
- ✅ Cache hit rate: > 70% (after warmup)
- ✅ Concurrent requests: > 20/sec
- ✅ Zero failed requests

### Step 2.2: Manual Load Test (Optional)
```bash
# Install Apache Bench if needed
# Ubuntu: sudo apt-get install apache2-utils
# macOS: Already included

# Run 1000 requests with 50 concurrent
ab -n 1000 -c 50 http://localhost:8001/health
```

**Expected Results:**
- ✅ Requests per second: > 100
- ✅ Failed requests: 0
- ✅ Time per request: < 500ms (mean)

---

## 3️⃣ ADD DATABASE INDEXES (One-time, 2 minutes)

### Step 3.1: Apply Performance Indexes
```bash
docker exec -i engunity-db psql -U user -d engunity < backend/add_performance_indexes.sql
```

**Expected Output:**
```
CREATE INDEX
CREATE INDEX
CREATE INDEX
...
ANALYZE
```

### Step 3.2: Verify Indexes Created
```bash
docker exec -it engunity-db psql -U user -d engunity -c "\di"
```

**Expected:** List of indexes including:
- `idx_chat_sessions_user_id`
- `idx_decisions_user_id`
- `idx_documents_user_id`
- etc.

---

## 4️⃣ START MONITORING (Ongoing)

### Step 4.1: Real-Time Performance Dashboard
```bash
python backend/monitoring_dashboard.py
```

**What to Watch:**
- Response times (should stay < 100ms)
- Cache hit rate (should be > 70% after warmup)
- Error count (should be 0)
- Redis status (should be "Connected")

**Leave this running in a terminal** to monitor health.

### Step 4.2: Set Up Periodic Checks (Optional)
```bash
# Add to crontab for hourly checks
crontab -e

# Add this line:
0 * * * * /path/to/backend/monitoring_commands.sh >> /var/log/backend_health.log
```

---

## 5️⃣ FINE-TUNE (Optional, based on monitoring)

### If Memory Usage is High
**Reduce worker count:**
```dockerfile
# Edit backend/Dockerfile
CMD ["uvicorn", "app.main:app", "--workers", "6"]  # Reduce from 8

# Rebuild
docker compose build backend
docker compose up -d backend
```

### If Database Pool Exhausted
**Increase pool size:**
```python
# Edit backend/app/core/database.py
pool_size=40,        # Increase from 32
max_overflow=20,     # Increase from 16

# Restart
docker compose restart backend
```

### If Cache Hit Rate is Low
**Increase TTL:**
```python
# Edit backend/app/main.py
app.add_middleware(ResponseCacheMiddleware, ttl=600)  # 10 min instead of 5

# Restart
docker compose restart backend
```

### If Redis Memory Exceeded
**Increase Redis memory:**
```yaml
# Edit docker-compose.yml
command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru --save ""

# Restart
docker compose restart redis
```

---

## 6️⃣ DOCUMENT BASELINE (5 minutes)

### Record Initial Performance Metrics

Create a baseline document for comparison:

```bash
cat > PERFORMANCE_BASELINE.txt << 'EOF'
Backend Performance Baseline
Date: $(date)

Workers: 8
DB Pool: 32 + 16 overflow
Cache TTL: 5 minutes
Redis Memory: 1GB

Performance Metrics:
- Health check response: [YOUR TIME]ms
- Cache hit rate: [YOUR RATE]%
- Concurrent capacity: [YOUR RPS] req/s
- Error rate: [YOUR RATE]%

Test Results:
[PASTE OUTPUT FROM tmp_rovodev_performance_test.py]

Notes:
[ANY OBSERVATIONS]
EOF
```

Fill in the actual values from your tests.

---

## 7️⃣ CLEANUP (Optional)

### Remove Temporary Test Files (After Verification)
```bash
# Only remove after confirming everything works
rm backend/tmp_rovodev_performance_test.py
rm backend/tmp_rovodev_optimization_report.md
```

**Note:** Keep monitoring scripts and documentation!

---

## 📊 SUCCESS CRITERIA

Your deployment is successful if:

- [x] All containers running
- [x] 8 workers active
- [x] API responding in < 100ms
- [x] Cache working (HIT on second request)
- [x] Performance tests pass
- [x] Database indexes created
- [x] Monitoring dashboard running
- [x] Zero errors in logs

---

## 🎯 PERFORMANCE TARGETS

| Metric | Target | How to Check |
|--------|--------|--------------|
| Response Time | < 100ms | `time curl http://localhost:8001/health` |
| Cache Hit Rate | > 70% | Monitoring dashboard or `monitoring_commands.sh` |
| Throughput | > 40 req/s | Performance test suite |
| Error Rate | 0% | `docker logs engunity-backend \| grep ERROR` |
| Workers Active | 8 | `docker logs engunity-backend \| grep "Started server"` |
| DB Connections | 32-48 | Monitoring script |

---

## 🔄 ONGOING MAINTENANCE

### Daily
- Check monitoring dashboard for anomalies
- Review error logs

### Weekly
- Run performance test suite
- Check cache hit rates
- Review resource usage

### Monthly
- Analyze slow query logs
- Review and update indexes
- Check for package updates

---

## 📚 REFERENCE DOCUMENTATION

After completion, refer to:

1. **BACKEND_OPTIMIZATION_COMPLETE.md** - Full technical details
2. **QUICK_START_OPTIMIZATIONS.md** - Quick reference
3. **DEPLOYMENT_STATUS.md** - What was implemented
4. **OPTIMIZATION_SUMMARY.txt** - Executive summary

---

## ❓ TROUBLESHOOTING

### Issue: Workers not starting
```bash
# Check logs
docker logs engunity-backend

# If memory error, reduce workers
# Edit Dockerfile: --workers 6
```

### Issue: Cache not working
```bash
# Check Redis
docker logs engunity-redis
docker exec engunity-redis redis-cli PING

# Should return PONG
```

### Issue: Database errors
```bash
# Check connections
docker exec engunity-db psql -U user -d engunity -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='engunity';"

# If at limit, increase pool_size
```

### Issue: Still slow
```bash
# Check what's slow
docker logs engunity-backend | grep "completed"

# Look for patterns
# Add indexes for slow queries
```

---

## ✅ FINAL VERIFICATION COMMAND

Run this comprehensive check:

```bash
echo "=== FINAL VERIFICATION ==="
echo ""
echo "1. Containers:"
docker compose ps | grep engunity
echo ""
echo "2. Workers:"
docker logs engunity-backend 2>&1 | grep -c "Started server"
echo ""
echo "3. Health:"
curl -s http://localhost:8001/health
echo ""
echo "4. Cache:"
curl -s -v http://localhost:8001/health 2>&1 | grep "X-Cache"
sleep 1
curl -s -v http://localhost:8001/health 2>&1 | grep "X-Cache"
echo ""
echo "5. Redis:"
docker exec engunity-redis redis-cli PING
echo ""
echo "6. Database:"
docker exec engunity-db psql -U user -d engunity -t -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='engunity';"
echo ""
echo "=== VERIFICATION COMPLETE ==="
```

---

## 🎉 COMPLETION

Once all checks pass:

1. ✅ Document your baseline metrics
2. ✅ Set up monitoring alerts (optional)
3. ✅ Share performance improvements with team
4. ✅ Schedule regular health checks

**Your backend is now optimized and production-ready!**

---

**Last Updated:** 2026-01-28
**Next Review:** After 24-48 hours of running
**Contact:** Check documentation if issues arise
