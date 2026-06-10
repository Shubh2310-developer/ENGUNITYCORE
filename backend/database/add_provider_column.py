
import os
import psycopg2
from app.core.config import settings

def migrate():
    # Parse DATABASE_URL
    db_url = settings.DATABASE_URL
    print(f"Connecting to database to add 'provider' column...")

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        # Check if column exists
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='users' AND column_name='provider';
        """)

        if not cur.fetchone():
            print("Adding 'provider' column to 'users' table...")
            cur.execute("ALTER TABLE users ADD COLUMN provider VARCHAR(255) DEFAULT 'local';")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'provider' already exists.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
