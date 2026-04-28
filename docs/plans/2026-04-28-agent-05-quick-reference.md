# Agent 05 Rollout Checklist & Quick Reference

**Audience:** DevOps, On-Call Engineer, Release Manager  
**Date:** 2026-04-28  
**Feature:** Mental Wellbeing Assistant (Analytics Dashboard Integration)

---

## 🚀 Pre-Rollout Checklist (Print This)

### Staging Validation (72 hours before)

- [ ] **Code merged** to main (`git log main | grep -i "agent-05"`)
- [ ] **All tests pass** 
  - Backend: `cd backend && pytest tests/ -v` (11/11 expected)
  - Frontend: `cd frontend && npm run test:e2e -- analytics-wellbeing.spec.ts` (4/4 expected)
- [ ] **Database migration applied** (`alembic upgrade head`)
  - Verify table exists: `SELECT COUNT(*) FROM analytics_session;`
- [ ] **Feature flags disabled** (both `WELLBEING_AGENT_ENABLED=false` and `NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED=false`)
- [ ] **Dependencies healthy**
  - PostgreSQL: `psql -c "SELECT 1;"` (no timeout)
  - Redis: `redis-cli ping` → `PONG`
  - MongoDB (optional): `mongo --eval "db.adminCommand('ping')"` → `ok: 1`
- [ ] **Monitoring deployed** (Datadog/NewRelic dashboards live; test alert)

### Production Pre-Rollout (Immediately Before Enablement)

- [ ] **Secrets rotated** (if applicable)
- [ ] **Structured logging enabled** for `app.agents.wellbeing_agent`
- [ ] **All alerts configured and tested** (p95 latency, error rate, connection pool)
- [ ] **Rollback plan tested** in staging (team validated the rollback procedure)
- [ ] **Stakeholder briefing completed** (Product, SRE, CS aware of rollout schedule)
- [ ] **On-call rotation updated** (engineers aware of new feature, know escalation path)

---

## 📋 Deployment Steps (Sequential)

### 1. Merge & Tag

```bash
git checkout main && git pull
git merge --no-ff feature/agent-05-wellbeing -m "feat(agent-05): wellbeing assistant"
git tag -a v0.5.0-wellbeing -m "Agent 05 release"
git push origin main && git push origin v0.5.0-wellbeing
```

**Validation:** CI/CD pipeline starts automatically. Wait for green status.

### 2. Deploy to Staging

```bash
# Automated by CI, or manual:
docker compose pull
docker compose -f docker-compose.yml -f docker-compose.code.yml up -d backend frontend
```

**Validation:**
```bash
curl http://localhost:8000/health | jq '.status'  # Should be "ok"
cd frontend && npm run test:e2e -- analytics-wellbeing.spec.ts  # Should pass 4/4
```

### 3. Verify Staging Deployment

```bash
# Backend health
docker compose exec backend python3 -c "from app.agents.wellbeing_agent import WellbeingAgent; print('✓ Agent imported')"

# Database
docker compose exec backend python3 -c "from sqlalchemy import text; from app.db.session import SessionLocal; \
  db = SessionLocal(); result = db.execute(text('SELECT 1 FROM analytics_session LIMIT 1')); print('✓ Table exists')"
```

### 4. Deploy to Production

**Automated (Recommended):**
- Tag pushed to main → CI runs tests → Deploys to canary nodes → Waits for approval → Rolls out to all

**Manual:**
```bash
# Connect to prod cluster
kubectl config use-context production

# Update image
kubectl set image deployment/engunity-backend \
  engunity-backend=engunity-backend:v0.5.0-wellbeing \
  -n production

# Monitor rollout
kubectl rollout status deployment/engunity-backend -n production
```

**Validation:**
```bash
# Endpoint alive
curl https://api.engunity.com/health | jq '.status'

# Check logs for errors
kubectl logs -n production -l app=engunity-backend --tail=50 | grep -i error
```

### 5. Enable Feature (Phased)

**Phase 1: Dark Launch (24h, feature flags disabled)**
- No user-facing changes yet
- Internal testing via header override (if implemented)

**Phase 2: Canary (48h, 1% of users)**
```bash
# Enable flag for 1% cohort
kubectl set env deployment/engunity-backend \
  WELLBEING_AGENT_ENABLED=true \
  WELLBEING_CANARY_PERCENTAGE=1 \
  -n production
```

**Phase 3: Early Adopters (2-3 days, 10% of users)**
```bash
kubectl set env deployment/engunity-backend \
  WELLBEING_CANARY_PERCENTAGE=10 \
  -n production
```

**Phase 4: General Availability (7 days, 100%)**
```bash
kubectl set env deployment/engunity-backend \
  WELLBEING_CANARY_PERCENTAGE=100 \
  -n production

# Or rebuild frontend with flag enabled:
NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED=true npm run build && docker compose up -d frontend
```

---

## 🎯 Key Metrics to Watch

| Metric | Healthy Range | Alert Threshold | Where to Check |
|--------|---------------|-----------------|-----------------|
| **p95 Latency** | < 120ms | > 250ms | Datadog > Networks > API |
| **Error Rate** | < 0.1% | > 1% | Prometheus or Datadog |
| **RPS (Requests/Sec)** | 10-100 | > 500 = capacity issue | Datadog > RPS |
| **User Adoption** | Gradual increase | Should correlate with rollout % | Custom dashboard |
| **DB Connections** | 10-20 active | > 30 = pool saturation | `pg_stat_activity` |
| **Redis Hit Ratio** | > 80% | < 60% = misconfiguration | Redis CLI or Datadog |

### Quick Metrics Check

```bash
# Latency
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,wellbeing_check_duration_ms)' | jq '.data.result[0]'

# Error rate
curl http://localhost:9090/api/v1/query?query='rate(wellbeing_check_errors_total[5m])' | jq '.data.result[0]'

# Active users
curl http://localhost:9090/api/v1/query?query='wellbeing_users_active' | jq '.data.result[0]'
```

---

## 🚨 Troubleshooting Quick Links

| Problem | Command | Expected | Next Step |
|---------|---------|----------|-----------|
| **Endpoint 500 error** | `curl -X GET http://localhost:8000/api/v1/wellbeing/check -H "Authorization: Bearer $TOKEN"` | `{"stress_signal":"low",...}` | Check backend logs: `docker logs -f <backend-container>` |
| **Banner not showing** | Browser console: `localStorage.getItem('NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED')` | `"true"` | Rebuild frontend with env var |
| **High latency spike** | `SELECT * FROM pg_stat_statements WHERE query LIKE '%wellbeing%'` | `mean_time < 5ms` | Check database indexes: `\d analytics_session` in psql |
| **Memory leak (browser)** | Chrome DevTools > Memory > Heap snapshot | Stable < 15MB | Check useEffect cleanups in WellbeingBanner.tsx |

---

## ⏸️ Emergency Rollback (< 1 minute)

If you need to stop the feature **immediately**:

```bash
# Option 1: Feature flag off (no code change, no redeploy)
kubectl set env deployment/engunity-backend \
  WELLBEING_AGENT_ENABLED=false \
  -n production

# Option 2: Revert image to prior version
kubectl set image deployment/engunity-backend \
  engunity-backend=engunity-backend:v0.4.9 \
  -n production

# Option 3: Git revert + redeploy
git revert -m 1 abc1234 --no-edit  # (replace abc1234 with merge commit SHA)
git push origin main  # CI/CD auto-redeploys
```

**Verify rollback:**
```bash
# Call endpoint; should get 451 (feature disabled) or 404 (endpoint gone)
curl -i https://api.engunity.com/api/v1/wellbeing/check -H "Authorization: Bearer $TOKEN"

# Check analytics page still works
curl -s https://app.engunity.com/analytics | grep "analytics" | wc -l  # Should be > 0
```

---

## 📞 Escalation Path

| Issue | On-Call | Escalate To | Time |
|-------|---------|-------------|------|
| **Endpoint 500, restarting doesn't help** | Debug logs, check DB | Backend Lead + 5min | 15min |
| **High error rate (> 1%)** | Check Prometheus, disable flag if needed | Team Lead + On-Call | 30min |
| **Database connection exhaustion** | Scale Postgres or restart backend | Database Engineer + SRE | 45min |
| **Entire feature unavailable** | Rollback immediately (see above) | VP Eng (if coordinated rollback needed) | 5min rollback decision |

**Slack escalation template:**
```
@on-call [P1] Wellbeing feature experiencing issues:
- Error rate: X%
- Latency: Xms
- Affected users: ~X
- Current status: [investigating / mitigating / rolled back]
- ETA: Xmin
```

---

## 📊 Daily Monitoring (During Rollout)

**Every 6 hours for first 48 hours:**

```bash
# Check deployment status
kubectl get deployment engunity-backend -n production

# Check pod health
kubectl get pods -n production -l app=engunity-backend

# Sample logs (last 50 lines)
kubectl logs -n production deployment/engunity-backend --tail=50 | tail -20

# Check error rate
curl 'http://localhost:9090/api/v1/query?query=rate(wellbeing_check_errors_total[5m])' | jq '.data.result[0].value[1]'
# Should be < 0.001 (0.1%)
```

**Daily summary (report to team):**
- Rollout phase (canary %, GA %, etc.)
- Error rate trend (stable, increasing, decreasing)
- Latency trend (p95 value)
- User adoption (% of traffic hitting feature)
- Any issues logged or resolved

---

## 🔍 Quick Diagnostics Command

```bash
#!/bin/bash
echo "=== Agent 05 Health Check ==="
echo ""
echo "1. Backend health:"
curl -s http://localhost:8000/health | jq '.status'
echo ""
echo "2. Database connection:"
docker compose exec -T backend python3 -c "from app.db.session import SessionLocal; db = SessionLocal(); print('✓ DB OK')" 2>&1
echo ""
echo "3. Wellbeing agent importable:"
docker compose exec -T backend python3 -c "from app.agents.wellbeing_agent import WellbeingAgent; print('✓ Agent OK')" 2>&1
echo ""
echo "4. Frontend build includes feature flag:"
cd frontend && grep "NEXT_PUBLIC_WELLBEING" .env.local || echo "✗ Flag not found"
echo ""
echo "5. Feature flags in production:"
kubectl get env deployment/engunity-backend -n production | grep WELLBEING || echo "Flags not found (use kubectl describe)"
echo ""
echo "=== End Health Check ==="
```

Save as `check-wellbeing.sh` and run before rollout:
```bash
bash check-wellbeing.sh
```

---

## 📚 Reference Documents

- **Full Ops Guide:** [2026-04-28-agent-05-operations-guide.md](2026-04-28-agent-05-operations-guide.md)
- **Execution Report:** [2026-04-26-agent-05-six-phase-execution-report.md](2026-04-26-agent-05-six-phase-execution-report.md)
- **Release Handoff:** [2026-04-26-agent-05-release-handoff.md](2026-04-26-agent-05-release-handoff.md)

---

**Print this checklist. Good luck with the rollout! 🚀**
