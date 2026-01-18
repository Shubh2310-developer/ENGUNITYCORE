import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import engine, Base
from app.models.image import Image, ImageVariant

def sync_schema():
    print(f"Syncing database schema for image models...")
    try:
        # Create all tables including image_variants if they don't exist
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created or verified successfully.")

        with engine.connect() as conn:
            # Check for columns in images table
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'images'"))
            columns = [row[0] for row in result.fetchall()]

            # Add missing columns to images table
            if 'exif_data' not in columns:
                print("➕ Adding 'exif_data' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN exif_data JSONB DEFAULT '{}'"))

            if 'processing_error' not in columns:
                print("➕ Adding 'processing_error' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN processing_error TEXT"))

            if 'tags' not in columns:
                print("➕ Adding 'tags' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN tags TEXT[] DEFAULT '{}'"))

            if 'description' not in columns:
                print("➕ Adding 'description' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN description TEXT"))

            if 'nsfw_score' not in columns:
                print("➕ Adding 'nsfw_score' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN nsfw_score FLOAT DEFAULT 0.0"))

            if 'scene_description' not in columns:
                print("➕ Adding 'scene_description' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN scene_description TEXT"))

            if 'detected_text' not in columns:
                print("➕ Adding 'detected_text' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN detected_text TEXT"))

            if 'context' not in columns:
                print("➕ Adding 'context' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN context VARCHAR(50)"))

            if 'processing_status' not in columns:
                print("➕ Adding 'processing_status' column...")
                conn.execute(text("ALTER TABLE images ADD COLUMN processing_status VARCHAR(20) DEFAULT 'pending'"))

            # Drop old thumbnails column if it exists (moved to image_variants table)
            if 'thumbnails' in columns:
                print("🗑️ Removing deprecated 'thumbnails' column from 'images' table...")
                conn.execute(text("ALTER TABLE images DROP COLUMN thumbnails"))

            conn.commit()
            print("✅ Schema sync completed.")

    except Exception as e:
        print(f"❌ Error syncing schema: {str(e)}")

if __name__ == "__main__":
    sync_schema()
