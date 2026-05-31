import asyncio
from app.core.config import settings
from app.api.v1.auth import _supabase_request_json
import sys

async def main(token):
    status, payload = await _supabase_request_json("GET", "/auth/v1/user", token=token)
    print(f"Status: {status}")
    print(f"Payload: {payload}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        asyncio.run(main(sys.argv[1]))
    else:
        print("Provide token as argument")
