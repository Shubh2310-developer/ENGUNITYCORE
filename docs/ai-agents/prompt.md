# 🧠 PROJECT BRIEF: Enterprise AI LLM Gateway Platform

## Role & Context

You are a **Senior Go Engineer** and **AI Platform Architect** working on an enterprise-grade, multi-tenant AI LLM Gateway. This platform acts as a unified intelligent proxy between client applications and multiple LLM providers (OpenAI, Anthropic, Groq, Ollama). Your job is to design, implement, and iterate on this system with production-level quality, observability, and cost-efficiency as first-class concerns.

This is **not a toy project**. Every decision must reflect the mindset of a platform engineer building infrastructure that will serve thousands of tenants, handle millions of requests, and be deployed on Kubernetes in a production environment.

---

## 🎯 Project Objective

Build a **high-performance, multi-tenant AI LLM Gateway** in Go that:

1. Abstracts multiple LLM providers behind a unified API
2. Intelligently routes requests to the optimal model based on task complexity, cost, and latency
3. Reduces LLM costs by 30–70% through semantic caching
4. Provides enterprise-grade observability, security, and multi-tenancy
5. Is fully deployable on Kubernetes with autoscaling

---

## 🏗️ System Architecture Overview

The request lifecycle flows through the following layers in strict order:

```
Client Applications (Web / Mobile / API Consumers)
        ↓
API Gateway Layer  [Go — fasthttp or Gin]
        ↓
Auth & Policy Layer  [JWT / OAuth2 / SSO / RBAC]
        ↓
Request Analyzer  [Complexity scoring, fingerprinting]
        ↓
Smart Router  [Model selection engine]
        ↓
┌──────────────────────────────────────────┐
│        Provider Adapters (gRPC)          │
│  - OpenAIProvider                        │
│  - AnthropicProvider                     │
│  - GroqProvider                          │
│  - LocalOllamaProvider                   │
└──────────────────────────────────────────┘
        ↓
Response Stream Processor  [SSE / WebSocket / Chunked]
        ↓
Observability + Cost Engine  [OpenTelemetry / Prometheus]
        ↓
Storage Layer  [PostgreSQL (HA) + Redis (Cluster)]
```

Each layer is a distinct, independently deployable component. Design them with clear interface boundaries.

---

## 📐 Core Architecture Breakdown

### A. API Gateway Layer — The Edge

**Primary Responsibilities:**
- Authentication: JWT validation, OAuth2 flows, SSO integration
- Request validation and schema enforcement
- Rate limiting (per tenant, per user, per model)
- Request fingerprinting (SHA-256 normalized hash)
- Streaming proxy (SSE, WebSocket, HTTP chunked)
- Tenant identification from JWT claims

**Implementation Decisions:**
- Use `fasthttp` if raw throughput is the priority (>100k req/s)
- Use `Gin` if developer ergonomics and middleware ecosystem matter more
- Middleware chain must be ordered exactly as:
  1. Auth middleware (JWT/OAuth2 validation)
  2. Tenant resolver (extract `tenant_id` from claims)
  3. Quota checker (enforce per-tenant limits from Redis)
  4. Rate limiter (Redis token bucket algorithm)
  5. Tracing injection (OpenTelemetry span creation)

**Why This Matters:**
Enterprise clients require identity-bound usage tracking, API-level governance, and fine-grained access control. The gateway is the enforcement point for all of these.

---

### B. Smart Router — The Core Brain

This is the **primary differentiator** of the platform. Every routing decision must be justified by data.

**What It Does:**
- Classifies incoming request complexity (simple Q&A vs. deep reasoning vs. code generation)
- Selects the optimal model based on a multi-factor scoring function:
  - Cost per token
  - Expected latency
  - Reasoning capability required
  - Tenant budget remaining
- Routes to the winning provider adapter

**Routing Decision Matrix:**

| Task Type | Routing Target | Rationale |
|---|---|---|
| Simple Q&A / Lookup | Small local model (Ollama) | Lowest cost, sufficient quality |
| Code generation | Code-specialized model (e.g., Codestral) | Domain-optimized |
| Deep reasoning / analysis | GPT-4 class / Claude Opus | Maximum capability |
| Retrieval-heavy / RAG | RAG-enabled pipeline | Context window + retrieval |
| High-volume batch | Groq (fastest inference) | Throughput optimization |

**Implementation Strategy:**
- Build a lightweight prompt classifier (rule-based first, ML-based optionally later)
- Implement a cost model estimator using real-time token pricing
- Maintain a performance profiling database in PostgreSQL
- Apply confidence threshold logic: if classifier confidence < 0.7, escalate to next tier
- Store all routing decisions and outcomes for continuous improvement

---

### C. Provider Abstraction Layer — Adapter Pattern

**Core Interface (Go):**

```go
type LLMProvider interface {
    Generate(ctx context.Context, req LLMRequest) (LLMResponse, error)
    Stream(ctx context.Context, req LLMRequest) (<-chan StreamChunk, error)
    GetCapabilities() ProviderCapabilities
    GetPricing() TokenPricing
    HealthCheck(ctx context.Context) error
}
```

**Implementations Required:**
- `OpenAIProvider` — GPT-4o, GPT-4-turbo, GPT-3.5
- `AnthropicProvider` — Claude Opus, Sonnet, Haiku
- `GroqProvider` — Llama3, Mixtral (ultra-fast inference)
- `LocalOllamaProvider` — Self-hosted models (cost = $0)

**Design Principles:**
- Zero vendor lock-in: swapping providers requires zero changes to business logic
- Unified error handling: all provider errors map to a canonical `LLMError` type
- Capability negotiation: router queries `GetCapabilities()` before routing
- Pricing awareness: router queries `GetPricing()` for cost estimation

---

### D. Semantic Caching — Critical Cost Reduction Layer

**Why Semantic Cache (not traditional cache):**

| Cache Type | Match Strategy | Hit Rate |
|---|---|---|
| Traditional (Redis exact) | Exact string match | ~5–10% |
| Semantic (vector similarity) | Meaning-based match | ~30–70% |

**Architecture:**

```
Incoming Prompt
      ↓
Normalize (lowercase, strip whitespace, remove metadata)
      ↓
Generate Embedding (text-embedding-3-small or local model)
      ↓
Query Redis Vector Index (cosine similarity search)
      ↓
If similarity_score > threshold (e.g., 0.92):
    → Return cached response (no LLM call)
Else:
    → Forward to Smart Router
    → Store result + embedding in cache
```

**Stack Options:**
- Redis with RediSearch vector index (recommended for simplicity)
- Redis + pgvector in PostgreSQL (recommended for analytics)

**Expected Outcome:** 30–70% cost reduction depending on traffic patterns. This is the single highest-ROI feature in the platform.

---

### E. Token Usage & Cost Engine

**This is what enterprise buyers care about most.** Every token must be accounted for.

**PostgreSQL Schema:**

```sql
CREATE TABLE usage_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    model           VARCHAR(100) NOT NULL,
    provider        VARCHAR(50) NOT NULL,
    prompt_tokens   INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_cost_usd  NUMERIC(10, 8) NOT NULL,
    latency_ms      INTEGER NOT NULL,
    cache_hit       BOOLEAN DEFAULT FALSE,
    routing_reason  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_tenant_created ON usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_usage_model ON usage_logs(model, created_at DESC);
```

**Required Aggregations:**
- Daily/weekly/monthly cost per tenant
- Cost breakdown by department (via user metadata)
- Model performance benchmarks (latency p50/p95/p99)
- Cache hit rate over time
- Budget burn rate with projected overage alerts

**Exposure Surfaces:**
- Internal admin dashboard (React or Grafana)
- Grafana dashboards with Prometheus metrics
- REST API for tenant self-service cost queries

---

### F. Streaming Support

**Why This Is Non-Negotiable:**
Modern AI applications require token-by-token streaming for chat-like UX. Buffering full responses is unacceptable for latency-sensitive use cases.

**Supported Protocols:**
- **SSE (Server-Sent Events)** — Default for web clients
- **WebSockets** — For bidirectional or long-lived connections
- **HTTP Chunked Transfer** — For legacy clients

**Internal Implementation:**
- Use Go channels (`chan StreamChunk`) for internal streaming pipelines
- Use gRPC server-side streaming between internal services
- Implement backpressure: if consumer is slow, apply flow control rather than dropping chunks

---

## 🔥 Advanced Features (Senior-Level Differentiators)

### 1. Request Fingerprinting

**Problem:** Users slightly modify prompts to bypass the cache (intentionally or not).

**Solution:**
```
Raw Prompt → Normalize → SHA-256 Hash → fingerprint_hash
Raw Prompt → Embed → embedding_vector
```

Store both. Use `fingerprint_hash` for exact-match fast path, `embedding_vector` for semantic fallback. This prevents cache abuse and improves hit rates.

---

### 2. AI Cost Optimization Engine (Dynamic Policy)

**Trigger Conditions:**
- Monthly budget utilization > 80%
- Traffic spike detected (>2x baseline in 5-minute window)
- Specific provider latency degradation

**Automated Actions:**
- Downgrade routing tier (e.g., GPT-4 → GPT-3.5 → Groq)
- Increase semantic cache similarity threshold (be more aggressive about cache hits)
- Reduce `max_tokens` cap for non-critical requests
- Alert tenant admin via webhook

**Required Components:**
- Budget tracker (real-time, Redis-backed)
- Policy engine (rule-based, configurable per tenant)
- Real-time monitoring feed (Prometheus → alerting rules)

---

### 3. Multi-Tenant Architecture

**Isolation Requirements:**

| Resource | Isolation Mechanism |
|---|---|
| Data | Row-level security (PostgreSQL RLS) |
| Cache | Redis key prefixing (`tenant:{id}:cache:*`) |
| Rate limits | Per-tenant token bucket in Redis |
| Billing | Separate cost aggregation per `tenant_id` |
| Models | Optional dedicated model pools per enterprise client |

**JWT Claim Structure:**
```json
{
  "sub": "user_id",
  "tenant_id": "org_uuid",
  "roles": ["admin", "developer"],
  "quota": { "monthly_tokens": 10000000 },
  "exp": 1234567890
}
```

---

### 4. Circuit Breaker + Backpressure

**Problem:** LLM provider failure → cascading system failure.

**State Machine:**
```
CLOSED (normal) → [failure threshold exceeded] → OPEN (reject all)
OPEN → [timeout elapsed] → HALF-OPEN (probe one request)
HALF-OPEN → [success] → CLOSED
HALF-OPEN → [failure] → OPEN
```

**Implementation in Go:**
- Use `context` timeouts for all provider calls
- Implement the state machine with atomic state transitions
- Retry with exponential backoff + jitter (max 3 retries)
- Fallback provider: if primary fails, route to secondary
- Return `HTTP 429` with `Retry-After` header when queue is full
- Adaptive throttling: reduce incoming rate before hitting circuit breaker

---

### 5. Observability (Production Non-Negotiable)

**OpenTelemetry Trace Structure:**
```
[Span] HTTP Request Received
  └─ [Span] Auth & Tenant Resolution
  └─ [Span] Request Fingerprinting
  └─ [Span] Semantic Cache Lookup
  └─ [Span] Smart Router Decision
  └─ [Span] Provider API Call
       └─ [Span] Streaming Response
  └─ [Span] Cache Store
  └─ [Span] Usage Log Write
```

**Prometheus Metrics (Required):**
```
llm_gateway_requests_total{tenant, model, provider, status}
llm_gateway_request_duration_seconds{tenant, model, provider} (histogram)
llm_gateway_cache_hits_total{tenant}
llm_gateway_cache_misses_total{tenant}
llm_gateway_tokens_total{tenant, model, type="prompt|completion"}
llm_gateway_cost_usd_total{tenant, model}
llm_gateway_circuit_breaker_state{provider}
llm_gateway_routing_decisions_total{from_tier, to_tier, reason}
```

---

## ☸️ Kubernetes Deployment Architecture

**Deployments:**

| Component | Replicas | HPA Trigger | Resource Limits |
|---|---|---|---|
| API Gateway | 3–20 | CPU > 70%, RPS > 1000 | 500m CPU, 512Mi RAM |
| Smart Router | 2–10 | CPU > 60%, Queue depth | 1 CPU, 1Gi RAM |
| Provider Adapters | 2–8 per provider | Request rate | 250m CPU, 256Mi RAM |
| Cost Engine | 1–3 | CPU | 500m CPU, 512Mi RAM |

**Infrastructure:**
- Redis Cluster (3 nodes minimum, with Sentinel)
- PostgreSQL HA (primary + 2 replicas, with PgBouncer)
- Prometheus + Grafana (monitoring namespace)
- Optional: KEDA for event-driven autoscaling based on queue depth

**Networking:**
- Internal service communication: gRPC over mTLS
- External client communication: HTTPS only (TLS 1.3)
- Ingress: NGINX or Traefik with rate limiting annotations

---

## 🔐 Security Architecture

| Layer | Mechanism |
|---|---|
| Authentication | OAuth2 / SSO (OIDC), JWT (RS256) |
| Authorization | RBAC with tenant-scoped roles |
| API Access | API key support (hashed, stored in DB) |
| Audit | Immutable audit log for all admin actions |
| Prompt Safety | Prompt injection detection middleware |
| Input Control | Max input size enforcement (configurable per tenant) |
| Network | WAF integration (Cloudflare / AWS WAF) |
| Secrets | Kubernetes Secrets + external secrets operator |

---

## 📊 Success Metrics & Acceptance Criteria

The platform is considered production-ready when:

- [ ] P99 gateway latency < 50ms (excluding LLM call time)
- [ ] Semantic cache hit rate > 30% under realistic traffic
- [ ] Zero data leakage between tenants (verified by security audit)
- [ ] Circuit breaker correctly isolates provider failures within 5 seconds
- [ ] All Prometheus metrics are emitting correctly
- [ ] Load test: 10,000 concurrent requests without degradation
- [ ] Cost reduction of ≥30% vs. direct provider calls (measured over 7-day period)
- [ ] Kubernetes HPA scales correctly under synthetic load

---

## 📁 Expected Deliverables

When implementing any component, produce:

1. **Go source code** with idiomatic error handling, context propagation, and structured logging (`slog` or `zap`)
2. **Unit tests** with ≥80% coverage for all business logic
3. **Integration tests** for provider adapters (using mock servers)
4. **PostgreSQL migrations** (versioned, using `golang-migrate`)
5. **Kubernetes YAML manifests** (Deployment, Service, HPA, ConfigMap, Secret)
6. **Prometheus alert rules** for critical failure scenarios
7. **Architecture decision records (ADRs)** for non-obvious design choices
8. **Benchmark results** for any performance-critical path

---

## 🧭 Guiding Principles

When making any implementation decision, apply these principles in order:

1. **Correctness first** — The system must never lose a request or corrupt data
2. **Observability second** — If you can't measure it, you can't improve it
3. **Performance third** — Optimize only after correctness and observability are in place
4. **Cost awareness always** — Every design choice has a cost implication; make it explicit

> This is not a side project. This is a **mini AI infrastructure platform** — treat it with the engineering rigor of a production system serving enterprise clients.