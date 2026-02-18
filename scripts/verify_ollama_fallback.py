import asyncio
import sys
import os

# Add the project root and backend directory to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(project_root, "backend")

sys.path.append(project_root)
sys.path.append(backend_path)

from app.services.ai.groq_client import groq_client
from app.services.ai.ollama_client import ollama_client

async def test_fallback():
    print("🧪 Starting Fallback Verification Test...")

    # 1. Check if Ollama is running
    print("\n1. Checking Local Ollama status...")
    try:
        test_msg = [{"role": "user", "content": "Hi"}]
        local_resp = await ollama_client.chat_completion(test_msg)
        print(f"✅ Local Ollama is ONLINE. Response: '{local_resp[:30]}...'")
    except Exception as e:
        print(f"❌ Local Ollama is OFFLINE or Llama3.2 is not pulled. Run 'ollama pull llama3.2' first.")
        return

    # 2. Simulate Groq Failure
    print("\n2. Simulating Groq Failure & Fallback...")
    # We "break" the clients temporarily
    original_clients = groq_client.clients
    groq_client.clients = []

    try:
        response = await groq_client.get_completion([{"role": "user", "content": "Explain quantum computing in 1 sentence."}])
        print(f"✅ Fallback successful!")
        print(f"🤖 Response from GPU: {response}")
    except Exception as e:
        print(f"❌ Fallback failed: {e}")
    finally:
        # Restore clients
        groq_client.clients = original_clients

    print("\n3. Testing Streaming Fallback...")
    groq_client.clients = []
    print("Stream output: ", end="", flush=True)
    async for chunk in groq_client.get_streaming_completion([{"role": "user", "content": "Count to 3."}]):
        print(chunk, end="", flush=True)
    print("\n\n✅ Verification Complete!")
    groq_client.clients = original_clients

if __name__ == "__main__":
    asyncio.run(test_fallback())
