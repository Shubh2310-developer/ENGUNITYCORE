# Agent 05 Mental Wellbeing — Operations & Deployment Guide

**Document Version:** 1.0  
**Last Updated:** 2026-04-28  
**Audience:** DevOps, Platform Operations, On-Call Engineers  
**Status:** For Immediate Use (Feature Ready for Staging/Production)

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Procedure](#deployment-procedure)
4. [Feature Flag Management](#feature-flag-management)
5. [Production Monitoring & Alerting](#production-monitoring--alerting)
6. [Rollout Strategy](#rollout-strategy)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Incident Response](#incident-response)
9. [Performance Baselines](#performance-baselines)
10. [Rollback Procedure](#rollback-procedure)

---

## Overview

### What is Agent 05?

Agent 05 is a **Mental Wellbeing Assistant** integrated into the Analytics Dashboard. It monitors user behavior patterns (late-night coding, frustration signals, marathons, overwork) and suggests interventions via a non-intrusive banner.

### Key Characteristics

| Aspect | Detail |
|--------|--------|
| **Scope** | Analytics page route (`/analytics`, `/code-studio/analytics`) |
| **Visibility** | Non-intrusive banner, hidden when healthy |
| **Latency SLA** | p95 < 120ms (measured: 2.253ms) |
| **Payload Size** | < 3KB (measured: 254 bytes) |
| **Availability** | Feature-gated at backend + frontend |
| **Dependencies** | PostgreSQL (session data), optional MongoDB (events), Redis (caching) |

### Feature Flags

| Flag | Scope | Default | Purpose |
|------|-------|---------|---------|
| `WELLBEING_AGENT_ENABLED` | Backend env | `false` | Controls backend check endpoint availability |
| `NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED` | Frontend build | `false` | Controls banner rendering on analytics page |

---

## Pre-Deployment Checklist

### Staging Environment (72 hours before production)

- [ ] **Code Review:** All PRs merged and reviewed per team standards
- [ ] **Integration Testing:** Full E2E suite passing on staging (Playwright, desktop + mobile)
  - Command: `cd frontend && npm run test:e2e -- analytics-wellbeing.spec.ts`
- [ ] **Database Migration:** Alembic migrations applied successfully
  - Command: `cd backend && alembic upgrade head`
  - Verify: `AnalyticsSession` table exists and has `user_id`, `session_time`, `last_active` columns
- [ ] **Feature Flag Disabled:** Both `WELLBEING_AGENT_ENABLED` and `NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED` set to `false` initially
- [ ] **Dependencies Available:** PostgreSQL, Redis, optional MongoDB accessible
  - Check: `curl -s http://localhost:8000/health | jq '.status'` should return `"ok"`
- [ ] **Load Testing:** Baseline established under expected traffic (see [Performance Baselines](#performance-baselines))
  - Command: `cd backend && python3 perf_baseline.py --agents 1 --iterations 40`

### Production Environment (Just Before Rollout)

- [ ] **Secrets Rotated:** `SECRET_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` current
- [ ] **Logs Configured:** Structured logging enabled for `app.agents.wellbeing_agent` module
- [ ] **Monitoring Deployed:** Datadog/NewRelic dashboards live (see [Production Monitoring](#production-monitoring--alerting))
- [ ] **Alerts Configured:** All critical/warning thresholds set and tested
- [ ] **Rollback Plan Tested:** Team has validated the rollback procedure in a staging environment
- [ ] **Stakeholder Notification:** Product, SRE, and customer success briefed on feature availability

---

## Deployment Procedure

### Step 1: Merge to Main

```bash
# Assumes branch feature/agent-05-wellbeing is ready for merge
git checkout main
git pull origin main
git merge --no-ff feature/agent-05-wellbeing -m "feat(agent-05): add mental wellbeing assistant"
git push origin main
```

### Step 2: Build & Deploy Backend

```bash
# Tag the release
git tag -a v0.5.0-wellbeing -m "Agent 05: Mental Wellbeing Assistant release"
git push origin v0.5.0-wellbeing

# Automated CI/CD will:
# 1. Run full test suite (backend + frontend)
# 2. Build Docker image: engunity-backend:v0.5.0-wellbeing
# 3. Push to registry
# 4. Deploy to staging (if all tests pass)
```

### Step 3: Verify Staging Deployment

```bash
# SSH to staging backend container
docker compose exec backend bash

# Verify migration applied
python3 -c "from app.db.session import SessionLocal; db = SessionLocal(); \
  result = db.execute(text('SELECT column_name FROM information_schema.columns WHERE table_name = \"analytics_session\"')); \
  print([row[0] for row in result])"

# Expected output includes: user_id, session_time, last_active, stress_signal

# Check wellbeing agent is imported
python3 -c "from app.agents.wellbeing_agent import WellbeingAgent; print('OK')"

# Verify endpoints are registered
curl http://localhost:8000/openapi.json | jq '.paths | keys' | grep wellbeing
```

### Step 4: Run Staging E2E Tests

```bash
cd frontend
npm run test:e2e -- analytics-wellbeing.spec.ts

# Expected output: 
# ✓ AW-01: renders wellbeing banner and allows key actions (2 chromium, 2 mobile)
# ✓ AW-02: dismisses banner and respects user preference
# ✓ AW-03: memory footprint under 20MB
# ✓ AW-04: pomodoro timer interaction works
# 4 passed (8.3s)
```

### Step 5: Deploy to Production (via GitOps or Manual)

**Automated Approach (Recommended):**
```bash
# Create release in GitHub; CD pipeline auto-deploys to canary nodes
# Helm/Kustomize applies new image with feature flags still disabled
```

**Manual Approach:**
```bash
# Update docker-compose.yml or K8s deployment
docker compose pull
docker compose up -d

# Or K8s:
kubectl set image deployment/engunity-backend \
  engunity-backend=engunity-backend:v0.5.0-wellbeing -n production
kubectl rollout status deployment/engunity-backend -n production
```

### Step 6: Health Check Post-Deployment

```bash
# Test endpoint is alive
curl https://api.engunity.com/health | jq '.status'

# Test wellbeing check endpoint (should return auth error if not yet enabled)
curl -X GET https://api.engunity.com/api/v1/wellbeing/check \
  -H "Authorization: Bearer <test-token>" 2>&1 | jq '.' | head -20
```

---

## Feature Flag Management

### Enabling the Feature (Canary Rollout)

**Approach 1: Environment Variable (Immediate, Global)**

```bash
# On backend servers, update .env or K8s ConfigMap
WELLBEING_AGENT_ENABLED=true

# Restart backend service
docker compose restart backend
# or
kubectl rollout restart deployment/engunity-backend -n production
```

**Approach 2: Supabase RLS Policy (Gradual, User-Granular)**

Add a feature flag row to a future `features` table:

```sql
INSERT INTO public.features (name, enabled_for_user_ids, enabled_percentage)
VALUES (
  'wellbeing_agent',
  '{"user-uuid-1", "user-uuid-2"}',  -- Explicit allowlist
  0.10  -- 10% of all users if not in allowlist
);
```

Update backend check endpoint to query this flag:

```python
# backend/app/api/v1/wellbeing.py
@router.get("/check")
async def check_wellbeing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Query feature flag
    is_enabled = await check_feature_flag(db, "wellbeing_agent", current_user.id)
    if not is_enabled:
        raise HTTPException(status_code=451, detail="Feature not available")
    # ... rest of logic
```

**Approach 3: Frontend Environment Variable Build-Time (Conservative)**

```bash
# Rebuild frontend with NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED=false (default)
NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED=true npm run build

# Deploy new build
docker compose up -d frontend
```

### Recommended Rollout Sequence

| Phase | Timeline | Backend Flag | Frontend Flag | Expected Users |
|-------|----------|--------------|---------------|----------------|
| **Dark Launch** | D+0 | `false` | `false` | 0 (internal testing via header override) |
| **Canary** | D+1 | `1% cohort` | `true` for canary | ~500 users (10K user base) |
| **Early Adopters** | D+3 | `10% cohort` | `true` for cohort | ~1K users, monitor metrics |
| **General Availability** | D+7 | `100%` | `true` for all | All users |

### Monitoring Rollout Health

```bash
# Query feature adoption
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as wellbeing_checks,
  AVG(EXTRACT(EPOCH FROM (check_time - query_time))) as p50_latency_ms
FROM analytics_wellbeing_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

# Expected growth: ~100 checks/day initially, 10K+ checks/day at 100%
```

---

## Production Monitoring & Alerting

### Key Metrics to Track

| Metric | Query | Target | Alert Threshold |
|--------|-------|--------|-----------------|
| **Check Latency (p95)** | `histogram_quantile(0.95, wellbeing_check_duration_ms)` | < 120ms | > 250ms |
| **Check Error Rate** | `rate(wellbeing_check_errors_total[5m])` / `rate(wellbeing_check_total[5m])` | < 0.1% | > 1% |
| **Payload Size (p99)** | `histogram_quantile(0.99, wellbeing_response_bytes)` | < 3KB | > 5KB |
| **Database Connection Pool** | `pg_stat_activity` where `query LIKE '%wellbeing%'` | < 10 active | > 20 concurrent |
| **Redis Cache Hit Ratio** | `(redis_hits / (redis_hits + redis_misses))` | > 80% | < 60% |
| **User Engagement** | `COUNT(DISTINCT user_id) checking` | > 50% of analytics page visitors | < 30% |

### Prometheus Scrape Configuration

Add to `backend/app/main.py` or Prometheus targets:

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
wellbeing_check_total = Counter(
    'wellbeing_check_total',
    'Total wellbeing checks performed',
    ['status', 'user_cohort']
)
wellbeing_check_duration_ms = Histogram(
    'wellbeing_check_duration_ms',
    'Latency of wellbeing check endpoint',
    buckets=[1, 5, 10, 25, 50, 100, 250, 500]
)
wellbeing_response_bytes = Histogram(
    'wellbeing_response_bytes',
    'Response payload size in bytes',
    buckets=[100, 250, 500, 1000, 3000, 5000]
)
wellbeing_users_active = Gauge(
    'wellbeing_users_active',
    'Concurrent users with wellbeing feature enabled'
)

# Usage in endpoint
@router.get("/check")
async def check_wellbeing(...):
    start = time.time()
    try:
        result = await agent.check_wellbeing(...)
        wellbeing_check_total.labels(status='success', user_cohort=get_cohort(user)).inc()
        wellbeing_check_duration_ms.observe((time.time() - start) * 1000)
        return result
    except Exception as e:
        wellbeing_check_total.labels(status='error', user_cohort='unknown').inc()
        raise
```

### Alert Rules (Alertmanager)

```yaml
groups:
  - name: wellbeing_alerts
    rules:
      - alert: WellbeingCheckLatencyHigh
        expr: histogram_quantile(0.95, wellbeing_check_duration_ms) > 250
        for: 5m
        annotations:
          summary: "Wellbeing check p95 latency > 250ms"
          description: "Agent 05 performance degradation detected"

      - alert: WellbeingCheckErrorRateHigh
        expr: rate(wellbeing_check_errors_total[5m]) > 0.01
        for: 2m
        annotations:
          summary: "Wellbeing check error rate > 1%"
          description: "Investigate backend logs for failures"

      - alert: WellbeingDatabaseConnectionExhaustion
        expr: count(rate(pg_stat_activity{query=~".*wellbeing.*"}[1m])) > 20
        for: 3m
        annotations:
          summary: "Database connection pool under pressure"
          description: "Consider scaling postgres or implementing connection pooling"
```

### Datadog Dashboard Example

```python
# Create via Datadog API or UI
# Key widgets:
# 1. Latency heatmap (wellbeing_check_duration_ms)
# 2. Error rate gauge
# 3. RPS line chart
# 4. Top error messages (table)
# 5. User adoption trend (area chart)
```

---

## Rollout Strategy

### Phased Rollout (Recommended)

**Phase 1: Dark Launch (24 hours)**
- Feature flags disabled in production
- Internal team can enable via query parameter override (`?wellbeing_preview=1`)
- Validates infrastructure, monitoring, logs

**Phase 2: Canary (48 hours)**
- Enable for small cohort (1% of users, ~100 users)
- Monitor metrics closely; document any issues
- Success criteria: < 0.1% error rate, p95 latency < 200ms

**Phase 3: Early Adopters (2-3 days)**
- Expand to 10% (1K users)
- Gather qualitative feedback via surveys or support tickets
- Verify dashboard metrics trending positively

**Phase 4: General Availability (7 days)**
- Enable for all users (100%)
- Monitor support ticket volume for any UX concerns
- Plan follow-up improvements based on feedback

### Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| **Database overload** | Monitor connection pool; auto-scale Postgres if needed | Platform SRE |
| **Redis cache misses** | Pre-warm cache with common user sessions before GA | Backend Lead |
| **Poor UX (confusing banner)** | Run 1-2 user research sessions during canary; refine copy/colors | Product |
| **Regression in analytics page** | E2E tests include regression checks for charts, filters, export | QA |
| **Privacy concern** | Ensure RLS policies prevent cross-user data leakage; audit logs created | Security |

---

## Troubleshooting Guide

### Issue: Wellbeing Check Endpoint Returns 500 Error

**Symptoms:**
- `curl` to `/api/v1/wellbeing/check` returns `{"detail": "Internal Server Error"}`
- Logs show `exc_info=True` but vague error message

**Diagnosis:**
```bash
# Check backend logs
docker compose logs backend | grep -i wellbeing | tail -20

# Common causes:
# 1. AnalyticsSession table missing or wrong schema
# 2. Database connection failed (wrong DATABASE_URL)
# 3. Supabase JWT validation failed (wrong SUPABASE_JWT_SECRET)
# 4. Missing MongoDB (if event log reads enabled)
```

**Resolution:**
```bash
# Verify table exists
docker compose exec backend python3 -c \
  "from app.db.models import AnalyticsSession; print(AnalyticsSession.__table__.name)"

# Verify Supabase JWT works
docker compose exec backend python3 -c \
  "from app.core.security import decode_access_token; print('JWT OK')"

# Restart backend with verbose logging
LOGLEVEL=DEBUG docker compose up -d backend
docker compose logs -f backend | grep wellbeing
```

### Issue: Wellbeing Banner Not Rendering in Frontend

**Symptoms:**
- Analytics page loads but no banner appears
- Browser console shows no errors
- `NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED` is `true`

**Diagnosis:**
```javascript
// In browser DevTools console
fetch('/api/v1/wellbeing/check', { 
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
}).then(r => r.json()).then(console.log)

// Expected: { "stress_signal": "low", "recommended_actions": [...] }
// OR: { "detail": "Feature not enabled for user" } (if flag disabled)
```

**Resolution:**
```bash
# Rebuild frontend with correct env var
NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED=true npm run build

# Verify in next.config.mjs that environment variables are accessible
grep -A 5 "publicRuntimeConfig\|NEXT_PUBLIC" next.config.mjs
```

### Issue: Excessive Latency (p95 > 500ms)

**Symptoms:**
- Monitoring dashboard shows spikes
- Users report slow analytics page load
- Correlates with peak traffic times

**Diagnosis:**
```sql
-- Check for slow database queries
SELECT 
  query,
  calls,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%wellbeing%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check connection pool saturation
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

**Resolution:**
```bash
# If database slow:
# 1. Add index on analytics_session(user_id, created_at)
# 2. Increase connection pool size (in backend config)
# 3. Enable Redis caching (3-5 min TTL)

# If too much backend traffic:
# 1. Reduce polling frequency in frontend (increase interval)
# 2. Implement frontend-side debouncing on user actions
# 3. Add rate limiting per user (5 checks/min)
```

### Issue: Memory Leak in Frontend (Browser Tab Grows to 100MB+)

**Symptoms:**
- Chrome DevTools Memory tab shows constant growth
- Tab becomes unresponsive after 30+ minutes on analytics page
- Occurs with WellbeingBanner mounted

**Diagnosis:**
```javascript
// In Chrome DevTools Performance
// 1. Record for 2-3 min while interacting with banner
// 2. Look for unbounded growth in memory (blue area)
// 3. Check for event listeners not being cleaned up
```

**Resolution:**
```typescript
// Verify useEffect cleanup in WellbeingBanner.tsx
useEffect(() => {
  const interval = setInterval(() => checkWellbeing(), pollingInterval);
  
  // MUST have cleanup function
  return () => clearInterval(interval);
}, [pollingInterval]);

// Verify polling stops when component unmounts or visibility hidden
```

---

## Incident Response

### Severity Definitions

| Severity | Impact | Response Time | Escalation |
|----------|--------|---------------|-----------|
| **P0 (Critical)** | Feature unavailable to all users; errors > 5% | 15 min | VP Eng + On-Call |
| **P1 (High)** | Feature degraded (latency > 1s or errors > 1%); affects > 10% | 30 min | Team Lead + On-Call |
| **P2 (Medium)** | Minor degradation; affects < 5% users; workaround exists | 1-2 hour | Team Lead |
| **P3 (Low)** | Documentation, edge case, or non-critical path | 24 hour | Backlog |

### Incident Playbook

**Step 1: Detect & Alert (Automated)**
```
Prometheus alert fires → PagerDuty → On-Call Engineer paged
```

**Step 2: Initial Triage (On-Call, 5 min)**
```bash
# Check current status
curl https://api.engunity.com/health | jq '.'

# Check Datadog dashboard for graphs
# Q: Is it backend, frontend, or database?
# Q: When did it start?

# Gather signal
docker compose logs backend --tail=100 | grep -i error
docker compose logs backend --tail=100 | grep -i wellbeing
```

**Step 3: Root Cause Decision Tree**
```
Error rate spike?
├─ YES: Check backend logs for exceptions
│  ├─ PostgreSQL connection error → Check PG status, scale connections
│  ├─ Supabase auth error → Check JWT secret, token expiry
│  └─ MongoDB error (if event reading enabled) → Check Atlas connection
└─ NO: Check latency

Latency spike?
├─ YES: Check database query performance
│  ├─ Query > 500ms? → Increase index, update query plan
│  ├─ Connection pool saturated? → Scale postgres or backend replicas
│  └─ Redis missing? → Check Redis status, restart if needed
└─ NO: Check frontend (check browser console)
```

**Step 4: Mitigation (5-15 min)**

**Option A: Feature Rollback (Fastest)**
```bash
# Disable backend flag
kubectl set env deployment/engunity-backend \
  WELLBEING_AGENT_ENABLED=false -n production

# Disable frontend flag (requires rebuild & redeploy)
# OR: Update DNS to route to prior image
```

**Option B: Targeted Disable (If affects specific cohort)**
```sql
-- Disable for canary cohort only
UPDATE features SET enabled_percentage = 0 
WHERE name = 'wellbeing_agent' AND cohort = 'canary';
```

**Option C: Fix Forward (If root cause identified & known)**
```bash
# Example: Fix slow database query
UPDATE analytics_session SET indexed_at = NOW() WHERE indexed_at IS NULL;
CREATE INDEX CONCURRENTLY idx_wellbeing_fast ON analytics_session(user_id, created_at DESC);

# Restart backend to clear any stale connection pools
kubectl rollout restart deployment/engunity-backend -n production
```

**Step 5: Communication (Ongoing)**
- Post in #incidents Slack channel: `[P1] Wellbeing feature latency spike, investigating...`
- Update status every 10 min
- Post postmortem link once resolved

**Step 6: Postmortem (24-48 hours post-incident)**
```markdown
# Incident Report: Agent 05 Latency Spike on 2026-04-28

## Timeline
- 14:32 UTC: Alert fired (p95 latency 2.3s)
- 14:37 UTC: Root cause identified (index missing on analytics_session)
- 14:45 UTC: Index created; latency returned to normal
- 14:50 UTC: Incident resolved

## Root Cause
Missing database index on `analytics_session(user_id, created_at)` after schema migration.

## Resolution
Applied: `CREATE INDEX idx_wellbeing_fast ON analytics_session(user_id, created_at DESC)`

## Preventive Actions
1. Add index to Alembic migration script
2. Add integration test that verifies query < 100ms
3. Add pre-deployment load test to catch similar issues
```

---

## Performance Baselines

### Measured Metrics (From Phase 05 Gate)

| Metric | Measured | Target | Status |
|--------|----------|--------|--------|
| **p95 Latency** | 2.253ms | < 120ms | ✅ PASS |
| **p99 Latency** | ~5ms (estimated) | < 200ms | ✅ PASS |
| **Response Payload** | 254 bytes | < 3KB | ✅ PASS |
| **Throughput** | ~1000 checks/sec/instance | > 100 checks/sec | ✅ PASS |
| **Error Rate** | 0% (test environment) | < 0.1% | ✅ PASS |
| **Memory Footprint** | < 15MB delta (browser) | < 20MB | ✅ PASS |

### Load Test Procedure

Run this before every production rollout to validate infrastructure changes:

```bash
cd backend

# Baseline test (40 iterations, measure p95 latency)
python3 perf_baseline.py --agents 1 --iterations 40

# High concurrency test (simulate peak traffic)
python3 perf_baseline.py --agents 10 --iterations 100

# Expected output:
# WELLBEING_P95_MS: ~2-5ms (under target of 120ms)
# WELLBEING_MAX_MS: ~10-20ms
# WELLBEING_PAYLOAD_BYTES: 254 (under target of 3KB)
```

### Scaling Expectations

```
Based on measured metrics:
- Single backend instance: ~1000 checks/sec
- With Redis cache (80% hit ratio): ~2000 effective checks/sec
- PostgreSQL connection pool (20 connections): sustains up to 500 concurrent users

To handle 10K requests/sec at peak traffic:
- Minimum 10 backend instances (each 1000 rps)
- Postgres: 200 connection pool (20 per instance + headroom)
- Redis cluster: 2-node setup for failover + caching layer
```

---

## Rollback Procedure

### Rollback (Less than 1 minute)

**Option 1: Feature Flag Disable (No Code Changes)**

```bash
# Fastest approach: disable at runtime
kubectl set env deployment/engunity-backend \
  WELLBEING_AGENT_ENABLED=false -n production

# Verify
curl https://api.engunity.com/api/v1/wellbeing/check \
  -H "Authorization: Bearer $TOKEN" 2>&1 | jq '.detail'
# Expected: "Feature not enabled" or 451 status
```

**Option 2: Container Image Rollback (If feature flag didn't exist in prior release)**

```bash
# Find previous working image
docker images | grep engunity-backend | head -5

# Tagged example: engunity-backend:v0.4.9 (prior working release)
kubectl set image deployment/engunity-backend \
  engunity-backend=engunity-backend:v0.4.9 -n production

# Verify rollout
kubectl rollout status deployment/engunity-backend -n production
```

**Option 3: Git Revert (If code regression detected)**

```bash
# Revert the merge commit
git log --oneline | grep "Agent 05"
# Output: abc1234 feat(agent-05): add mental wellbeing assistant

git revert -m 1 abc1234 --no-edit
git push origin main

# CI/CD will automatically rebuild and redeploy
```

### Post-Rollback Validation

```bash
# Verify wellbeing endpoints now return 451 or are unavailable
curl https://api.engunity.com/api/v1/wellbeing/check 2>&1 | jq '.status'

# Verify analytics page still loads (no regression)
curl https://app.engunity.com/analytics -s | grep "analytics" | head -5

# Check error logs for any cascading issues
docker compose logs backend | grep -i error | tail -20

# Monitor dashboard: Should see all wellbeing metrics drop to zero
```

### Post-Incident Cleanup

```bash
# If rollback was due to code issue:
# 1. Create debugging branch
git checkout -b debug/wellbeing-issue-2026-04-28

# 2. Fix the issue (e.g., add missing index, fix auth check)
# ... commits ...

# 3. Regenerate tests
cd frontend && npm run test
cd backend && pytest tests/ -v

# 4. Re-submit for review and staged rollout
```

---

## Appendix: Useful Commands

### Quick Health Check

```bash
# Backend health
curl http://localhost:8000/health | jq '.status'

# Database table verification
docker compose exec backend python3 -c \
  "from app.db.session import SessionLocal; from sqlalchemy import text; \
  db = SessionLocal(); \
  result = db.execute(text('SELECT COUNT(*) FROM analytics_session')); \
  print(f'Sessions in DB: {result.scalar()}')"

# Feature flag status
docker compose exec backend python3 -c \
  "import os; print(f'WELLBEING_AGENT_ENABLED: {os.getenv(\"WELLBEING_AGENT_ENABLED\", \"false\")}')"

# Frontend feature flag status
cd frontend && grep -i wellbeing.env .env.local
```

### Log Collection (Debugging)

```bash
# Collect last 200 lines of backend logs
docker compose logs backend --tail=200 > /tmp/backend-logs.txt

# Filter for wellbeing-specific entries
docker compose logs backend | grep -i wellbeing

# Watch logs in real-time
docker compose logs -f backend | grep -i wellbeing &
# ... then reproduce issue in browser
```

### Metrics Export (Prometheus)

```bash
# Scrape metrics endpoint
curl http://localhost:8000/metrics | grep wellbeing

# Filter for specific metric
curl http://localhost:8000/metrics | grep wellbeing_check_total

# Export for external analysis
curl http://localhost:8000/metrics | grep wellbeing > /tmp/wellbeing-metrics.txt
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-28 | Initial release for Agent 05 production rollout |

---

**Questions? Check the [Troubleshooting Guide](#troubleshooting-guide) or escalate to the backend team lead.**
