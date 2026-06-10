import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get DB URL from environment - NEVER use hardcoded database credentials
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Please configure it in your .env file before running migrations."
    )

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Checking for created_at column...")
    try:
        conn.execute(text("ALTER TABLE code_files ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        print("Success: Added created_at")
    except Exception as e:
        print(f"Skipping: {e}")
        
    print("Checking for updated_at column...")
    try:
        conn.execute(text("ALTER TABLE code_files ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        print("Success: Added updated_at")
    except Exception as e:
        print(f"Skipping: {e}")
    
    conn.commit()
    print("Migration complete.")
