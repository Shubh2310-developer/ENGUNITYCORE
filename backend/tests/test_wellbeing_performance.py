import json
import time

from tests.test_wellbeing_agent import setup_wellbeing_tables, wellbeing_auth_override


def _p95_ms(samples_ms: list[float]) -> float:
    ordered = sorted(samples_ms)
    idx = int(0.95 * (len(ordered) - 1))
    return ordered[idx]


def test_check_cached_path_p95_under_120ms(client, wellbeing_auth_override):
    # Warm cache
    warm = client.get('/api/v1/wellbeing/check?period=24h')
    assert warm.status_code == 200

    samples_ms: list[float] = []
    iterations = 40
    for _ in range(iterations):
        start = time.perf_counter()
        resp = client.get('/api/v1/wellbeing/check?period=24h')
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert resp.status_code == 200
        samples_ms.append(elapsed_ms)

    assert _p95_ms(samples_ms) < 120.0


def test_check_payload_under_3kb(client, wellbeing_auth_override):
    resp = client.get('/api/v1/wellbeing/check?period=24h')
    assert resp.status_code == 200

    payload_bytes = len(json.dumps(resp.json()).encode('utf-8'))
    assert payload_bytes < 3072
