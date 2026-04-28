"""
Performance Monitor Middleware
===============================
Pure-ASGI middleware that tracks per-route latency metrics and enforces
performance budgets using exponential moving average for p95 estimation.

Performance Budgets:
  - API p95 response time: < 500ms
  - RAM utilization:       < 65%
  - CPU utilization:       < 70%

Exposes metrics via the /api/v1/debug/perf-stats endpoint.
"""

import time
import math
import threading
from collections import defaultdict, deque
from typing import Optional
from starlette.types import ASGIApp, Scope, Receive, Send

from loguru import logger

try:
    import psutil
    _PSUTIL_AVAILABLE = True
except ImportError:
    _PSUTIL_AVAILABLE = False
    logger.warning("psutil not installed — RAM/CPU budget checks disabled. Run: pip install psutil")


# ── Performance Budgets ────────────────────────────────────────────────────────
BUDGET_P95_MS   = 500   # milliseconds
BUDGET_RAM_PCT  = 65.0  # percent
BUDGET_CPU_PCT  = 70.0  # percent

# ── Rolling window for accurate percentile estimation ─────────────────────────
WINDOW_SIZE = 200  # keep last N samples per route


class RouteStats:
    """Per-route latency statistics using a fixed-size rolling window."""

    def __init__(self):
        self._lock = threading.Lock()
        self._samples: deque[float] = deque(maxlen=WINDOW_SIZE)
        self.total_requests = 0
        self.total_errors = 0
        self.cache_hits = 0
        self.cache_misses = 0

    def record(self, latency_ms: float, is_error: bool = False, cache_hit: bool = False):
        with self._lock:
            self._samples.append(latency_ms)
            self.total_requests += 1
            if is_error:
                self.total_errors += 1
            if cache_hit:
                self.cache_hits += 1
            else:
                self.cache_misses += 1

    def _percentile(self, p: float) -> float:
        with self._lock:
            if not self._samples:
                return 0.0
            s = sorted(self._samples)
            idx = max(0, math.ceil(len(s) * p / 100) - 1)
            return round(s[idx], 2)

    @property
    def p50_ms(self) -> float:
        return self._percentile(50)

    @property
    def p95_ms(self) -> float:
        return self._percentile(95)

    @property
    def p99_ms(self) -> float:
        return self._percentile(99)

    @property
    def avg_ms(self) -> float:
        with self._lock:
            if not self._samples:
                return 0.0
            return round(sum(self._samples) / len(self._samples), 2)

    @property
    def error_rate_pct(self) -> float:
        with self._lock:
            if self.total_requests == 0:
                return 0.0
            return round(self.total_errors / self.total_requests * 100, 2)

    @property
    def cache_hit_rate_pct(self) -> float:
        with self._lock:
            total = self.cache_hits + self.cache_misses
            if total == 0:
                return 0.0
            return round(self.cache_hits / total * 100, 1)

    def to_dict(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "error_rate_pct": self.error_rate_pct,
            "cache_hit_rate_pct": self.cache_hit_rate_pct,
            "p50_ms": self.p50_ms,
            "p95_ms": self.p95_ms,
            "p99_ms": self.p99_ms,
            "avg_ms": self.avg_ms,
            "budget_p95_ok": self.p95_ms <= BUDGET_P95_MS or self.total_requests < 5,
        }


# ── Global Store ───────────────────────────────────────────────────────────────
_route_stats: dict[str, RouteStats] = defaultdict(RouteStats)
_start_time = time.time()

# Background resource checker
_last_resource_check = 0.0
_RESOURCE_CHECK_INTERVAL = 15.0  # seconds between psutil checks


def _check_resource_budgets() -> dict:
    """Snapshot RAM + CPU and emit warnings if budgets exceeded."""
    global _last_resource_check

    now = time.time()
    if not _PSUTIL_AVAILABLE:
        return {}

    if now - _last_resource_check < _RESOURCE_CHECK_INTERVAL:
        return {}
    _last_resource_check = now

    try:
        vm = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=None)
        ram_pct = vm.percent

        result = {
            "ram_total_gb": round(vm.total / 1024**3, 2),
            "ram_used_gb": round(vm.used / 1024**3, 2),
            "ram_available_gb": round(vm.available / 1024**3, 2),
            "ram_percent": ram_pct,
            "cpu_percent": cpu,
        }

        if ram_pct > 80:
            logger.critical(
                f"🔴 RAM CRITICAL: {ram_pct:.1f}% > 80% — system under severe memory pressure"
            )
        elif ram_pct > BUDGET_RAM_PCT:
            logger.warning(
                f"⚠️  RAM budget exceeded: {ram_pct:.1f}% > {BUDGET_RAM_PCT}% budget"
            )

        if cpu > BUDGET_CPU_PCT:
            logger.warning(
                f"⚠️  CPU budget exceeded: {cpu:.1f}% > {BUDGET_CPU_PCT}% budget"
            )

        return result
    except Exception as e:
        logger.debug(f"Resource check error: {e}")
        return {}


def get_all_stats() -> dict:
    """Return a serialisable snapshot of all route stats + system resources."""
    uptime_s = round(time.time() - _start_time, 0)
    routes = {route: stats.to_dict() for route, stats in sorted(_route_stats.items())}
    budget_violations = [
        route for route, s in _route_stats.items()
        if s.total_requests >= 5 and s.p95_ms > BUDGET_P95_MS
    ]

    return {
        "uptime_seconds": uptime_s,
        "budgets": {
            "p95_ms": BUDGET_P95_MS,
            "ram_percent": BUDGET_RAM_PCT,
            "cpu_percent": BUDGET_CPU_PCT,
        },
        "budget_violations": budget_violations,
        "system": _check_resource_budgets(),
        "routes": routes,
    }


# ── Middleware ─────────────────────────────────────────────────────────────────
class PerformanceMonitorMiddleware:
    """
    Pure-ASGI performance monitoring middleware.

    - Measures wall-clock request latency per route
    - Logs WARNING when a request exceeds the p95 budget (500ms)
    - Periodically checks RAM + CPU against budgets
    - Zero overhead on non-HTTP scopes (WebSocket, lifespan, etc.)
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Periodic resource budget check (non-blocking)
        _check_resource_budgets()

        # Build a human-readable route key: "GET /api/v1/decisions/"
        method = scope.get("method", "GET")
        path   = scope.get("path", "/")
        route_key = f"{method} {path}"

        # Track status code + cache header
        _status_code: list[int] = [200]
        _cache_header: list[str] = [""]

        t0 = time.perf_counter()

        async def capture_send(message) -> None:
            if message["type"] == "http.response.start":
                _status_code[0] = message.get("status", 200)
                raw_headers = dict(message.get("headers", []))
                _cache_header[0] = raw_headers.get(b"x-cache", b"").decode()
            await send(message)

        try:
            await self.app(scope, receive, capture_send)
        finally:
            latency_ms = (time.perf_counter() - t0) * 1000
            is_error   = _status_code[0] >= 400
            cache_hit  = _cache_header[0].upper() == "HIT"

            _route_stats[route_key].record(latency_ms, is_error=is_error, cache_hit=cache_hit)

            # Budget-breach logging
            if latency_ms > BUDGET_P95_MS:
                logger.warning(
                    f"⚠️  SLOW REQUEST: {route_key} took {latency_ms:.0f}ms "
                    f"(budget: {BUDGET_P95_MS}ms) status={_status_code[0]}"
                )
            elif latency_ms > BUDGET_P95_MS * 0.8:
                # Approaching budget — debug level
                logger.debug(
                    f"🐢 Approaching budget: {route_key} {latency_ms:.0f}ms "
                    f"(threshold: {BUDGET_P95_MS}ms)"
                )
