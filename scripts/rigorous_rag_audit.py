import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = f"rigorous_audit_{int(time.time())}@example.com"
PASSWORD = "testpassword123"

def run_rigorous_audit():
    # Setup
    print(f"🔹 Registering user {EMAIL}...")
    requests.post(f"{BASE_URL}/auth/register", json={"email": EMAIL, "password": PASSWORD, "full_name": "Rigorous Auditor"})
    login_resp = requests.post(f"{BASE_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    queries = [
        "How has the architectural design of large language models evolved from GPT-1 to the latest transformer-based architectures in 2024?",
        "Compare the scalability strategies of Kubernetes vs Nomad for distributed systems at scale.",
        "What are the security implications of using zero-knowledge proofs in modern decentralized finance (DeFi) systems?",
        "Explain the historical development and current state of quantum-resistant cryptographic standards.",
        "How do edge computing architectures handle real-time data processing in large-scale IoT sensor networks?"
    ]

    modes = ["quick", "standard", "deep", "exhaustive"]
    aggregate_results = {mode: {"words": [], "sources": [], "latency": []} for mode in modes}

    print(f"🚀 Starting Rigorous 5-Query Benchmark...")

    for i, query in enumerate(queries):
        print(f"\n--- Query {i+1}: '{query[:50]}...' ---")

        for mode in modes:
            print(f"   Testing Mode: {mode.upper()}...", end="", flush=True)
            start_time = time.time()

            try:
                resp = requests.post(
                    f"{BASE_URL}/research/deep-research",
                    json={
                        "query": query,
                        "depth": mode,
                        "include_web_search": True,
                        "max_iterations": 2 if mode == "exhaustive" else 1
                    },
                    headers=headers,
                    timeout=900
                )

                latency = time.time() - start_time

                if resp.status_code == 200:
                    data = resp.json()
                    report = data.get("detailed_findings", [{}])[0].get("full_report", "")
                    word_count = len(report.split())
                    source_count = len(data.get("sources", []))

                    aggregate_results[mode]["words"].append(word_count)
                    aggregate_results[mode]["sources"].append(source_count)
                    aggregate_results[mode]["latency"].append(latency)
                    print(f" ✅ ({word_count} words, {source_count} sources in {latency:.1f}s)")
                else:
                    print(f" ❌ (Failed: {resp.status_code})")
            except Exception as e:
                print(f" ❌ (Exception: {e})")

    print("\n" + "="*60)
    print("📊 AGGREGATE RIGOROUS AUDIT RESULTS (Averages)")
    print("="*60)
    print(f"{'Mode':<12} | {'Avg Words':<10} | {'Avg Sources':<12} | {'Avg Latency':<12}")
    print("-" * 55)

    avg_quick_words = 0
    avg_quick_sources = 0
    avg_exh_words = 0
    avg_exh_sources = 0

    for mode in modes:
        avg_words = sum(aggregate_results[mode]["words"]) / len(aggregate_results[mode]["words"]) if aggregate_results[mode]["words"] else 0
        avg_sources = sum(aggregate_results[mode]["sources"]) / len(aggregate_results[mode]["sources"]) if aggregate_results[mode]["sources"] else 0
        avg_latency = sum(aggregate_results[mode]["latency"]) / len(aggregate_results[mode]["latency"]) if aggregate_results[mode]["latency"] else 0

        print(f"{mode.upper():<12} | {avg_words:<10.1f} | {avg_sources:<12.1f} | {avg_latency:<12.1f}s")

        if mode == "quick":
            avg_quick_words = avg_words
            avg_quick_sources = avg_sources
        if mode == "exhaustive":
            avg_exh_words = avg_words
            avg_exh_sources = avg_sources

    if avg_quick_words > 0:
        word_ratio = avg_exh_words / avg_quick_words
        source_ratio = avg_exh_sources / avg_quick_sources if avg_quick_sources > 0 else 0
        print(f"\nExhaustive/Quick Word Ratio: {word_ratio:.2f}x (Target: >3x)")
        print(f"Exhaustive/Quick Source Ratio: {source_ratio:.2f}x (Target: >2x)")

if __name__ == "__main__":
    run_rigorous_audit()
