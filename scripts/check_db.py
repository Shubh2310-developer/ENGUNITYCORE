import os
import sys
from sqlalchemy import create_engine, inspect

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.config import settings

def check_tables():
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1]}") # Hide credentials
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")

    if "users" in tables:
        print("SUCCESS: 'users' table exists.")
    else:
        print("FAILURE: 'users' table is missing.")

if __name__ == "__main__":
    check_tables()
