import os
import sys
from dotenv import load_dotenv

# Load env variables from backend/.env
load_dotenv("/home/agentrogue/projects/ENGUNITYCORE/backend/.env")

# Add backend app directory to sys.path
sys.path.append("/home/agentrogue/projects/ENGUNITYCORE/backend")

from app.core.database import SessionLocal
from app.models.user import User as UserModel

print("Querying user from Postgres...")
try:
    db = SessionLocal()
    user = db.query(UserModel).filter(UserModel.email == "shahshubh655@gmail.com").first()
    if user:
        print(f"✅ User found! ID: {user.id}, Email: {user.email}")
    else:
        print("❌ User not found.")
    db.close()
except Exception as e:
    print(f"❌ Postgres Query Failed: {e}")
