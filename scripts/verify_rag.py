import requests
import json
import time
import uuid
import sys

BASE_URL = "http://localhost:8000/api/v1"
# Generate a unique email for this run
EMAIL = f"test_rag_{uuid.uuid4().hex[:8]}@example.com"
PASSWORD = "testpassword123"

def register_and_login():
    print(f"🔹 Registering user: {EMAIL}...")
    # Register
    try:
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": EMAIL,
            "password": PASSWORD,
            "full_name": "Test User"
        })
        if reg_resp.status_code not in [200, 201]:
             print(f"⚠️ Registration warning: {reg_resp.text}")
    except Exception as e:
        print(f"❌ Registration failed: {e}")

    # Login
    print("🔹 Logging in...")
    try:
        login_resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": EMAIL,
            "password": PASSWORD
        })
        
        if login_resp.status_code != 200:
            print(f"❌ Login failed: {login_resp.text}")
            sys.exit(1)
            
        token = login_resp.json()["access_token"]
        print("✅ Authenticated successfully")
        return token
    except Exception as e:
        print(f"❌ Login exception: {e}")
        sys.exit(1)

def test_deep_research(token):
    print("\n" + "="*50)
    print("🧪 Testing Mode Differentiation (Deep Research)")
    print("="*50)
    
    query = "Compare potential biosignatures on Europa vs Enceladus"
    modes = ["quick", "exhaustive"] # Testing extremes as requested
    results = {}
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    for mode in modes:
        print(f"\nRunning mode: {mode.upper()}...")
        start_time = time.time()
        
        url = f"{BASE_URL}/research/deep-research/stream"
        payload = {
            "query": query,
            "depth": mode,
            "include_web_search": True,
            "include_graph_search": True
        }
        
        token_count = 0
        source_count = 0
        full_text = ""
        
        try:
            with requests.post(url, json=payload, headers=headers, stream=True, timeout=600) as r:
                if r.status_code != 200:
                    print(f"   ❌ API Error {r.status_code}: {r.text}")
                    results[mode] = {"tokens": 0, "sources": 0, "latency": 0}
                    continue

                for line in r.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                event_type = data.get("event_type")
                                
                                if event_type == "complete":
                                    report = data.get("data", {}).get("report", {})
                                    # Handle different report structures if needed
                                    detailed = report.get("detailed_findings", [])
                                    if detailed and isinstance(detailed, list):
                                        full_text = detailed[0].get("full_report", "")
                                    else:
                                        full_text = report.get("summary", "")
                                        
                                    token_count = len(full_text.split())
                                    source_count = len(report.get("sources", []))
                                    
                                if event_type == "error":
                                    print(f"   ❌ Error event: {data}")
                                    
                            except json.JSONDecodeError:
                                pass
                                
        except Exception as e:
            print(f"   ❌ Request exception: {e}")
            
        latency = time.time() - start_time
        results[mode] = {
            "tokens": token_count,
            "sources": source_count,
            "latency": latency
        }
        print(f"   Stats: {token_count} words, {source_count} sources, {latency:.2f}s latency")

    # Verify requirements
    quick = results["quick"]
    exhaustive = results["exhaustive"]
    
    print("\n📊 Mode Verification Results:")
    
    if quick["tokens"] == 0:
        print("⚠️ Quick mode returned 0 tokens. Cannot calculate ratios.")
        return

    # Requirement: Exhaustive returns at least 3x more tokens than Quick
    token_ratio = exhaustive["tokens"] / quick["tokens"]
    print(f"   Token Ratio (Exhaustive/Quick): {token_ratio:.2f}x (Target: >3x)")
    
    # Requirement: Exhaustive returns at least 2x more sources than Quick
    source_ratio = exhaustive["sources"] / quick["sources"] if quick["sources"] > 0 else 0
    print(f"   Source Ratio (Exhaustive/Quick): {source_ratio:.2f}x (Target: >2x)")
    
    # Check for identical responses
    if quick["tokens"] == exhaustive["tokens"] and quick["sources"] == exhaustive["sources"]:
         print("⚠️ WARNING: Response metrics are identical for Quick and Exhaustive.")
    
    if token_ratio >= 3 and source_ratio >= 2:
        print("✅ Mode Differentiation PASSED")
    else:
        print("⚠️ Mode Differentiation WARNING - Ratios lower than expected.")


def test_omni_rag_strategies(token):
    print("\n" + "="*50)
    print("🧪 Testing RAG Method Integrity (Omni-RAG)")
    print("="*50)
    
    query = "How do microservices communicate?"
    # Map to what the backend expects in 'strategy' field
    strategies = ["vector_rag", "graph_rag", "adaptive"]
    
    headers = {"Authorization": f"Bearer {token}"}

    for strategy in strategies:
        print(f"\nRunning strategy: {strategy}...")
        start_time = time.time()
        
        url = f"{BASE_URL}/omni-rag/stream"
        payload = {
            "query": query,
            # For adaptive, we send None or 'adaptive' depending on API
            "strategy": None if strategy == "adaptive" else strategy,
            "include_metadata": True
        }
        
        metadata_captured = {}
        content_len = 0
        
        try:
            with requests.post(url, json=payload, headers=headers, stream=True, timeout=300) as r:
                if r.status_code != 200:
                    print(f"   ❌ API Error {r.status_code}: {r.text}")
                    continue

                for line in r.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                msg_type = data.get("type")
                                
                                if msg_type == "metadata":
                                    metadata_captured.update(data)
                                elif msg_type == "content":
                                    content_len += len(data.get("content", ""))
                                    
                            except:
                                pass
                                
        except Exception as e:
            print(f"   ❌ Request exception: {e}")
            continue
            
        latency = time.time() - start_time
        print(f"   Latency: {latency:.2f}s")
        print(f"   Response length: {content_len} chars")
        
        # Verifications
        if strategy == "graph_rag":
            # Check for graph specific metadata
            # backend/app/api/v1/omni_rag.py: yield {"type": "metadata", "strategy": "graph_rag", ...}
            actual_strategy = metadata_captured.get("strategy")
            communities = metadata_captured.get("communities_used", 0)
            
            print(f"   Graph verification: Strategy={actual_strategy}, Communities={communities}")
            
            if actual_strategy == "graph_rag": 
                print("   ✅ Graph RAG strategy confirmed")
            else: 
                print("   ❌ Graph RAG strategy mismatch")
            
        elif strategy == "adaptive":
            complexity = metadata_captured.get("complexity")
            print(f"   Adaptive classification: {complexity}")
            if complexity: 
                print("   ✅ Adaptive routing worked")
            else: 
                print("   ❌ Adaptive routing failed to classify")

def test_grounding(token):
    print("\n" + "="*50)
    print("🧪 Testing Context Grounding (Negative Test)")
    print("="*50)
    
    # Specific negative test query about fake event
    query = "What is the specific color of the Xylophone Base discovered on Mars in 2024?"
    print(f"Query: {query}")
    
    url = f"{BASE_URL}/omni-rag/stream"
    payload = {"query": query, "strategy": "vector_rag"}
    headers = {"Authorization": f"Bearer {token}"}
    
    response_text = ""
    metadata = {}
    
    try:
        with requests.post(url, json=payload, headers=headers, stream=True, timeout=300) as r:
            for line in r.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "content":
                                response_text += data.get("content", "")
                            elif data.get("type") == "metadata":
                                metadata.update(data)
                        except: pass
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return

    confidence = metadata.get("confidence")
    print(f"Response prefix: {response_text[:100]}...")
    print(f"Confidence: {confidence}")
    
    # We expect keywords indicating lack of knowledge
    refusal_keywords = ["don't know", "do not have", "no information", "cannot find", "sorry", "unclear", "no mention"]
    is_refusal = any(k in response_text.lower() for k in refusal_keywords)
    
    # Also check confidence if available (should be low)
    low_confidence = confidence is not None and confidence < 0.5
    
    if is_refusal or low_confidence:
        print("✅ Grounding PASSED (System refused or low confidence)")
    else:
        print("⚠️ Grounding WARNING (System attempted to answer or high confidence)")

def main():
    try:
        token = register_and_login()
        if not token:
             print("Failed to get token")
             return
             
        test_deep_research(token)
        test_omni_rag_strategies(token)
        test_grounding(token)
    except KeyboardInterrupt:
        print("\nAborted by user")
    except Exception as e:
        print(f"\n❌ FATAL: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
