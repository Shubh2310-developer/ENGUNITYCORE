import asyncio
import time
from app.services.ai.groq_client import groq_client

async def main():
    # Force vLLM fallback by removing primary clients
    groq_client.clients.clear() 
    
    messages = [{"role": "user", "content": "Explain gravity in 10 words."}]
    
    start = time.time()
    response = await groq_client.get_completion(messages)
    end = time.time()
    
    print("\n--- vLLM FALLBACK RESPONSE ---")
    print(response)
    print(f"Time taken: {end - start:.2f}s")
    print("----------------\n")

if __name__ == "__main__":
    asyncio.run(main())
