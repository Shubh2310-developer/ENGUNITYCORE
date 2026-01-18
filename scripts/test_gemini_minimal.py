
import asyncio
import httpx
import certifi
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath("backend"))

async def test_model(model):
    from app.core.config import settings
    api_key = settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Hello, are you working? Please respond with 'Yes, I am working.'"}
                ]
            }
        ]
    }

    print(f"\n--- Testing model: {model} ---")
    try:
        async with httpx.AsyncClient(verify=certifi.where(), timeout=30.0) as client:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            if response.status_code != 200:
                print(f"Response: {response.text}")
                return False

            data = response.json()
            if "candidates" in data and data["candidates"]:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                print(f"Gemini Response: {text}")
                return True
            else:
                print(f"Unexpected response structure: {data}")
                return False
    except Exception as e:
        print(f"Error: {e}")
        return False

async def main():
    models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-pro-latest"]
    for model in models:
        success = await test_model(model)
        if success:
            print(f"✅ {model} is available and working.")
        else:
            print(f"❌ {model} failed or is rate limited.")
        # Brief pause between models
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
