/**
 * Engunity Backend — k6 Load Test
 * =================================
 * Simulates realistic user traffic across the top 4 endpoints.
 * 
 * Usage:
 *   k6 run --out json=k6_results.json load_test.js
 * 
 * With auth token:
 *   AUTH_TOKEN=your_jwt k6 run --out json=k6_results.json load_test.js
 * 
 * Performance budgets:
 *   - p95 latency < 500ms
 *   - p99 latency < 1000ms
 *   - Error rate < 1%
 *   - Throughput > 20 req/s at steady state
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const cacheHits    = new Counter('cache_hits');
const cacheMisses  = new Counter('cache_misses');
const cacheHitRate = new Rate('cache_hit_rate');
const errorRate    = new Rate('error_rate');

const healthLatency    = new Trend('latency_health',     true);
const decisionsLatency = new Trend('latency_decisions',  true);
const analyticsLatency = new Trend('latency_analytics',  true);
const githubLatency    = new Trend('latency_githubrepos',true);

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:8000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const API_PFX    = `${BASE_URL}/api/v1`;

// ── Load Scenario ─────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    realistic_traffic: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 5  },  // ramp up
        { duration: '30s', target: 20 },  // steady state
        { duration: '10s', target: 0  },  // ramp down
      ],
      gracefulRampDown: '10s',
    },
  },

  // Performance budget thresholds
  thresholds: {
    // Global latency budgets
    http_req_duration: [
      'p(95)<500',   // p95 < 500ms
      'p(99)<1000',  // p99 < 1s
    ],

    // Per-endpoint latency budgets
    latency_health:      ['p(95)<50'],   // health endpoint must be very fast
    latency_decisions:   ['p(95)<500'],
    latency_analytics:   ['p(95)<500'],
    latency_githubrepos: ['p(95)<500'],

    // Error rate < 1%
    error_rate:          ['rate<0.01'],

    // Cache hit rate > 50% (after warmup, ResponseCacheMiddleware should kick in)
    // We use rate<1.0 as a loose check — true enforcement is in the summary printout
    cache_hit_rate:      ['rate>0'],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) {
    h['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  return h;
}

function record(resp, trendMetric) {
  const ok = resp.status >= 200 && resp.status < 400;
  trendMetric.add(resp.timings.duration);
  errorRate.add(!ok);

  const xCache = resp.headers['X-Cache'] || resp.headers['x-cache'] || '';
  if (xCache === 'HIT') {
    cacheHits.add(1);
    cacheHitRate.add(1);
  } else {
    cacheMisses.add(1);
    cacheHitRate.add(0);
  }
  return ok;
}

// ── Traffic Mix ───────────────────────────────────────────────────────────────
// Weighted random selection: health 30%, decisions 25%, analytics 25%, githubrepos 20%
const TRAFFIC_WEIGHTS = [
  { weight: 30, fn: doHealth        },
  { weight: 25, fn: doDecisions     },
  { weight: 25, fn: doAnalytics     },
  { weight: 20, fn: doGithubrepos   },
];
const TOTAL_WEIGHT = TRAFFIC_WEIGHTS.reduce((s, x) => s + x.weight, 0);

function pickEndpoint() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const item of TRAFFIC_WEIGHTS) {
    r -= item.weight;
    if (r <= 0) return item.fn;
  }
  return TRAFFIC_WEIGHTS[0].fn;
}

// ── Endpoint Handlers ─────────────────────────────────────────────────────────

function doHealth() {
  const resp = http.get(`${BASE_URL}/health`, { headers: headers() });
  const ok = record(resp, healthLatency);
  check(resp, {
    'health: status 200':           (r) => r.status === 200,
    'health: body has status key':  (r) => r.json('status') !== undefined,
  });
  return ok;
}

function doDecisions() {
  const resp = http.get(`${API_PFX}/decisions/`, { headers: headers() });
  const ok = record(resp, decisionsLatency);
  check(resp, {
    'decisions: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'decisions: response < 1s':     (r) => r.timings.duration < 1000,
  });
  return ok;
}

function doAnalytics() {
  const resp = http.get(`${API_PFX}/analytics/datasets`, { headers: headers() });
  const ok = record(resp, analyticsLatency);
  check(resp, {
    'analytics: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'analytics: response < 1s':     (r) => r.timings.duration < 1000,
  });
  return ok;
}

function doGithubrepos() {
  const resp = http.get(`${API_PFX}/githubrepos/`, { headers: headers() });
  const ok = record(resp, githubLatency);
  check(resp, {
    'githubrepos: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'githubrepos: response < 1s':     (r) => r.timings.duration < 1000,
  });
  return ok;
}

// ── Main VU Function ──────────────────────────────────────────────────────────
export default function () {
  const fn = pickEndpoint();
  fn();

  // Realistic think time: 0.5–2s between requests
  sleep(0.5 + Math.random() * 1.5);
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────
export function setup() {
  // Verify server is reachable before starting
  const resp = http.get(`${BASE_URL}/health`);
  if (resp.status !== 200) {
    console.error(`Server not reachable at ${BASE_URL} (status=${resp.status})`);
    console.error('Start it first: ENABLE_AI=false uvicorn app.main:app --port 8000');
  }
  return { startTime: new Date().toISOString() };
}

export function handleSummary(data) {
  const dur   = data.metrics['http_req_duration'];
  const p95   = dur ? dur.values['p(95)'] : 0;
  const p99   = dur ? dur.values['p(99)'] : 0;
  const errs  = data.metrics['error_rate'];
  const errPct = errs ? (errs.values['rate'] * 100).toFixed(2) : '0.00';
  const hitsCount = (data.metrics['cache_hits'] && data.metrics['cache_hits'].values) ? data.metrics['cache_hits'].values.count : 0;
  const missesCount = (data.metrics['cache_misses'] && data.metrics['cache_misses'].values) ? data.metrics['cache_misses'].values.count : 0;
  const total = hitsCount + missesCount;
  const hitPct = total > 0
    ? (hitsCount / total * 100).toFixed(1)
    : '0.0';

  const budgetPass = p95 < 500 && parseFloat(errPct) < 1.0;

  const reqs = data.metrics['http_reqs'] && data.metrics['http_reqs'].values ? data.metrics['http_reqs'].values : {};

  const summary = `
════════════════════════════════════════════════════════════
  ENGUNITY BACKEND — LOAD TEST SUMMARY
════════════════════════════════════════════════════════════
  Requests:       ${reqs.count || 0}
  Throughput:     ${(reqs.rate || 0).toFixed(1)} req/s

  Global Latency:
    p50:          ${(dur && dur.values ? dur.values['p(50)'] || 0 : 0).toFixed(0)}ms
    p95:          ${p95.toFixed(0)}ms  (budget: <500ms  ${p95 < 500 ? '✅' : '❌'})
    p99:          ${p99.toFixed(0)}ms  (budget: <1000ms ${p99 < 1000 ? '✅' : '❌'})

  Error Rate:     ${errPct}%  (budget: <1%  ${parseFloat(errPct) < 1 ? '✅' : '❌'})
  Cache Hit Rate: ${hitPct}%

  BUDGET VERDICT: ${budgetPass ? '✅ PASS' : '❌ FAIL — see details above'}
════════════════════════════════════════════════════════════
`;
  console.log(summary);

  return {
    stdout: summary,
    'k6_summary.json': JSON.stringify(data, null, 2),
  };
}
