import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

engine = create_engine(db_url)
with engine.connect() as connection:
    result = connection.execute(text("SELECT email, is_active FROM users"))
    print("Existing users:")
    for row in result:
        print(f"- {row[0]} (Active: {row[1]})")
