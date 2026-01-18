import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine, text
from app.core.config import settings

def debug_db():
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1]}") # Log host only for security
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # 1. Check connection
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()
            print(f"✅ Connection successful: {version[0]}")

            # 2. Check for users table
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE  table_schema = 'public'
                    AND    table_name   = 'users'
                );
            """))
            exists = result.fetchone()[0]
            print(f"📊 Table 'users' exists: {exists}")

            if exists:
                # 3. Check columns
                result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"))
                columns = result.fetchall()
                print("📋 'users' columns:")
                for col in columns:
                    print(f"   - {col[0]} ({col[1]})")

                # 4. Count users
                result = conn.execute(text("SELECT COUNT(*) FROM users"))
                count = result.fetchone()[0]
                print(f"👥 Total users: {count}")

    except Exception as e:
        print(f"❌ Database error: {str(e)}")

if __name__ == "__main__":
    debug_db()
