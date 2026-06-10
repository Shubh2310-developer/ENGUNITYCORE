import urllib.request as urlrequest
import urllib.error as urlerror
import json
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load env variables from backend/.env
load_dotenv("/home/agentrogue/projects/ENGUNITYCORE/backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
database_url = os.getenv("DATABASE_URL")

print(f"SUPABASE_URL: {url}")
print(f"DATABASE_URL: {database_url[:50]}...")

# Test Postgres connection
print("Connecting to Postgres database...")
try:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        print("✅ Postgres Connection Successful!")
except Exception as e:
    print(f"❌ Postgres Connection Failed: {e}")
