#!/usr/bin/env python3
"""
Engunity Backend Performance Baseline Profiler
================================================
Captures RAM/CPU baseline, then profiles the top 3 endpoints under simulated
load using tracemalloc and psutil. Outputs baseline_metrics.json.

Usage:
    # Terminal 1 — start server
    ENABLE_AI=false uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1

    # Terminal 2 — run profiler (needs server running)
    python perf_baseline.py
"""

import json
import os
import sys
import time
import tracemalloc
import threading
import traceback
from datetime import datetime
from pathlib import Path

try:
    import psutil
except ImportError:
    print("ERROR: psutil not installed. Run: pip install psutil")
    sys.exit(1)

try:
    import httpx
except ImportError:
    print("WARNING: httpx not installed. Run: pip install httpx")
    httpx = None

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
OUTPUT_FILE = Path(__file__).parent / "baseline_metrics.json"
AUTH_TOKEN = os.getenv("TEST_AUTH_TOKEN", "")  # Bearer token for protected routes

ENDPOINTS = [
    ("GET", "/health",                            0.0),  # (method, path, auth_required)
    ("GET", "/api/v1/decisions/",                 1.0),
    ("GET", "/api/v1/analytics/datasets",         1.0),
    ("GET", "/api/v1/githubrepos/",               1.0),
]

WARMUP_REQUESTS = 3
PROFILE_REQUESTS = 15   # per endpoint


# ──────────────────────────────────────────────────────────────────────────────
# Memory sampling (background thread)
# ──────────────────────────────────────────────────────────────────────────────
class MemorySampler:
    def __init__(self, pid: int, interval: float = 0.5):
        self.pid = pid
        self.interval = interval
        self.samples: list[float] = []
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)

    def start(self):
        self._thread.start()

    def stop(self):
        self._stop.set()
        self._thread.join(timeout=5)

    def _run(self):
        try:
            proc = psutil.Process(self.pid)
            while not self._stop.is_set():
                self.samples.append(proc.memory_info().rss / 1024 / 1024)  # MB
                self._stop.wait(self.interval)
        except psutil.NoSuchProcess:
            pass

    @property
    def peak_mb(self) -> float:
        return max(self.samples) if self.samples else 0.0

    @property
    def avg_mb(self) -> float:
        return sum(self.samples) / len(self.samples) if self.samples else 0.0


# ──────────────────────────────────────────────────────────────────────────────
# HTTP helpers
# ──────────────────────────────────────────────────────────────────────────────
def build_headers() -> dict:
    h = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        h["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return h


def probe_endpoint(client: "httpx.Client", method: str, path: str) -> dict:
    """Fire one request and return timing + status info."""
    url = f"{BASE_URL}{path}"
    t0 = time.perf_counter()
    try:
        resp = client.request(method, url, headers=build_headers(), timeout=30.0)
        latency_ms = (time.perf_counter() - t0) * 1000
        return {
            "status": resp.status_code,
            "latency_ms": round(latency_ms, 2),
            "cache": resp.headers.get("X-Cache", "NONE"),
            "size_bytes": len(resp.content),
        }
    except Exception as exc:
        return {
            "status": 0,
            "latency_ms": (time.perf_counter() - t0) * 1000,
            "error": str(exc),
        }


def percentile(data: list[float], p: float) -> float:
    if not data:
        return 0.0
    s = sorted(data)
    idx = max(0, int(len(s) * p / 100) - 1)
    return round(s[idx], 2)


# ──────────────────────────────────────────────────────────────────────────────
# System snapshot
# ──────────────────────────────────────────────────────────────────────────────
def system_snapshot() -> dict:
    vm = psutil.virtual_memory()
    return {
        "ram_total_gb": round(vm.total / 1024**3, 2),
        "ram_used_gb": round(vm.used / 1024**3, 2),
        "ram_available_gb": round(vm.available / 1024**3, 2),
        "ram_percent": vm.percent,
        "cpu_percent": psutil.cpu_percent(interval=1),
        "cpu_count": psutil.cpu_count(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ──────────────────────────────────────────────────────────────────────────────
# Find the uvicorn/python process serving the backend
# ──────────────────────────────────────────────────────────────────────────────
def find_server_pid(port: int = 8000) -> int | None:
    for conn in psutil.net_connections(kind="tcp"):
        if conn.laddr.port == port and conn.status == "LISTEN":
            return conn.pid
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
    if httpx is None:
        print("httpx required. Run: pip install httpx")
        sys.exit(1)

    print("=" * 60)
    print("  Engunity Backend — Performance Baseline Profiler")
    print("=" * 60)

    # 1. System baseline (before any load)
    print("\n📊 Capturing system baseline...")
    baseline_system = system_snapshot()
    print(f"   RAM: {baseline_system['ram_used_gb']}GB / {baseline_system['ram_total_gb']}GB "
          f"({baseline_system['ram_percent']}%)")
    print(f"   CPU: {baseline_system['cpu_percent']}%")

    # 2. Locate server process for memory sampling
    server_pid = find_server_pid(8000)
    if server_pid:
        print(f"   Backend PID: {server_pid}")
        try:
            proc = psutil.Process(server_pid)
            server_rss_start_mb = proc.memory_info().rss / 1024 / 1024
            print(f"   Backend RSS at start: {server_rss_start_mb:.1f} MB")
        except Exception:
            server_rss_start_mb = 0.0
    else:
        print("   ⚠️  Backend server not found on :8000 — RAM sampling will be system-wide only")
        server_rss_start_mb = 0.0

    # 3. Check server is reachable
    print(f"\n🔌 Checking server at {BASE_URL}/health ...")
    with httpx.Client(follow_redirects=True) as client:
        try:
            r = client.get(f"{BASE_URL}/health", timeout=5)
            print(f"   ✅ Server healthy — HTTP {r.status_code}")
        except Exception as e:
            print(f"   ❌ Server unreachable: {e}")
            print("   Start it first: ENABLE_AI=false uvicorn app.main:app --port 8000")
            sys.exit(1)

    # 4. Profile each endpoint
    results = {}
    tracemalloc.start()

    with httpx.Client(follow_redirects=True) as client:
        for method, path, _ in ENDPOINTS:
            print(f"\n🔥 Probing {method} {path}  (warmup={WARMUP_REQUESTS}, samples={PROFILE_REQUESTS})")

            # Warmup
            for _ in range(WARMUP_REQUESTS):
                probe_endpoint(client, method, path)

            # Profile
            sampler = MemorySampler(server_pid or os.getpid(), interval=0.2)
            sampler.start()

            latencies = []
            statuses = []
            cache_hits = 0
            snap_before = tracemalloc.take_snapshot()

            for i in range(PROFILE_REQUESTS):
                r = probe_endpoint(client, method, path)
                latencies.append(r.get("latency_ms", 0))
                statuses.append(r.get("status", 0))
                if r.get("cache") == "HIT":
                    cache_hits += 1
                if i == 0:
                    print(f"   Sample 1: {r.get('latency_ms', 0):.0f}ms  status={r.get('status')}  "
                          f"cache={r.get('cache', 'NONE')}")

            snap_after = tracemalloc.take_snapshot()
            sampler.stop()

            # Top memory diff
            top_stats = snap_after.compare_to(snap_before, "lineno")[:5]
            mem_diff_kb = sum(s.size_diff for s in top_stats) / 1024

            results[path] = {
                "method": method,
                "requests": PROFILE_REQUESTS,
                "p50_ms": percentile(latencies, 50),
                "p75_ms": percentile(latencies, 75),
                "p95_ms": percentile(latencies, 95),
                "p99_ms": percentile(latencies, 99),
                "min_ms": round(min(latencies), 2) if latencies else 0,
                "max_ms": round(max(latencies), 2) if latencies else 0,
                "error_rate": round(sum(1 for s in statuses if s >= 400) / len(statuses) * 100, 1),
                "cache_hit_rate": round(cache_hits / PROFILE_REQUESTS * 100, 1),
                "server_ram_peak_mb": round(sampler.peak_mb, 1),
                "server_ram_avg_mb": round(sampler.avg_mb, 1),
                "tracemalloc_diff_kb": round(mem_diff_kb, 2),
            }

            print(f"   p50={results[path]['p50_ms']}ms  "
                  f"p95={results[path]['p95_ms']}ms  "
                  f"p99={results[path]['p99_ms']}ms  "
                  f"cache={results[path]['cache_hit_rate']}%  "
                  f"RAM_peak={results[path]['server_ram_peak_mb']}MB")

    tracemalloc.stop()

    # 5. Post-load snapshot
    post_system = system_snapshot()

    # 6. Assemble report
    report = {
        "profiled_at": baseline_system["timestamp"],
        "base_url": BASE_URL,
        "python_version": sys.version,
        "server_pid": server_pid,
        "server_rss_start_mb": round(server_rss_start_mb, 1),
        "system_before": baseline_system,
        "system_after": post_system,
        "endpoints": results,
        "summary": {
            "worst_p95_ms": max(v["p95_ms"] for v in results.values()),
            "best_p95_ms": min(v["p95_ms"] for v in results.values()),
            "system_ram_percent_start": baseline_system["ram_percent"],
            "system_ram_percent_end": post_system["ram_percent"],
            "budget_p95_ms": 500,
            "budget_ram_percent": 65,
            "budget_cpu_percent": 70,
        },
    }

    # 7. Write output
    with open(OUTPUT_FILE, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 60)
    print("  BASELINE SUMMARY")
    print("=" * 60)
    print(f"  RAM start:    {baseline_system['ram_percent']}%")
    print(f"  RAM end:      {post_system['ram_percent']}%")
    print(f"  CPU after:    {post_system['cpu_percent']}%")
    print(f"  Worst p95:    {report['summary']['worst_p95_ms']}ms  (budget: 500ms)")
    print(f"  Report saved: {OUTPUT_FILE}")

    # 8. Budget check
    failures = []
    for path, m in results.items():
        if m["p95_ms"] > 500:
            failures.append(f"  ❌ {path}: p95={m['p95_ms']}ms > 500ms budget")
    if post_system["ram_percent"] > 65:
        failures.append(f"  ❌ RAM {post_system['ram_percent']}% > 65% budget")
    if post_system["cpu_percent"] > 70:
        failures.append(f"  ❌ CPU {post_system['cpu_percent']}% > 70% budget")

    if failures:
        print("\n⚠️  BUDGET VIOLATIONS:")
        for f in failures:
            print(f)
    else:
        print("\n✅ All performance budgets met!")

    return report


if __name__ == "__main__":
    main()
