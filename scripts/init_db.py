import sys
import os

# Add the project root to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import engine, Base
from app.models.user import User

def init_db():
    print("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Successfully created tables in Supabase.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
