
import asyncio
import os
import sys
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine
from jose import jwt

# Add current directory to path
sys.path.append("/app")

async def test_mongodb(url):
    print(f"\n--- Testing MongoDB Connection ---")
    print(f"URL: {url[:30]}...")
    try:
        client = AsyncIOMotorClient(
            url,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsCAFile=certifi.where()
        )
        await client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")

def test_postgres(url):
    print(f"\n--- Testing Postgres Connection ---")
    print(f"URL: {url[:30]}...")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print("✅ Postgres Connection Successful!")
    except Exception as e:
        print(f"❌ Postgres Connection Failed: {e}")

def test_jwt_decode():
    print(f"\n--- Testing JWT Decoding Logic ---")
    # This simulates what happens in auth.py
    token = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImMyNGI5NWNkLWMwYzctND..." # Truncated from user logs
    try:
        header = jwt.get_unverified_header(token)
        print(f"Header: {header}")
    except Exception as e:
        print(f"❌ JWT Header Decode Failed: {e}")

async def main():
    mongodb_url = os.getenv("MONGODB_URL")
    database_url = os.getenv("DATABASE_URL")

    if mongodb_url:
        await test_mongodb(mongodb_url)
    else:
        print("MONGODB_URL not set")

    if database_url:
        test_postgres(database_url)
    else:
        print("DATABASE_URL not set")

    test_jwt_decode()

if __name__ == "__main__":
    asyncio.run(main())
