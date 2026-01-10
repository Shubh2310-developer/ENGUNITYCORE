"""
Database Initialization Script for Engunity AI Chat Feature

This script creates all necessary database tables for the chat functionality:
- chat_sessions: Stores conversation sessions
- chat_messages: Stores individual messages

Usage:
    python scripts/setup/init_chat_tables.py
    python scripts/setup/init_chat_tables.py --reset  # Drop existing tables first

Author: Engunity AI Team
Date: 2026-01-10
"""

import sys
import argparse
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, text
from app.core.config import settings


def drop_tables(engine):
    """
    Drop existing chat tables (dangerous - use with caution).
    
    Args:
        engine: SQLAlchemy engine
    """
    print("⚠️  Dropping existing chat tables...")
    
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS chat_messages CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS chat_sessions CASCADE;"))
        conn.commit()
    
    print("✅ Tables dropped successfully")


def create_chat_tables(engine):
    """
    Create chat_sessions and chat_messages tables with proper constraints.
    
    Args:
        engine: SQLAlchemy engine
    """
    print("🚀 Creating chat tables...")
    
    with engine.connect() as conn:
        # 1. Create chat_sessions table
        print("   Creating chat_sessions table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # 2. Create indexes for chat_sessions
        print("   Creating indexes for chat_sessions...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id 
            ON chat_sessions(user_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at 
            ON chat_sessions(updated_at DESC);
        """))
        
        # 3. Create chat_messages table
        print("   Creating chat_messages table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
                content TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        
        # 4. Create indexes for chat_messages
        print("   Creating indexes for chat_messages...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id 
            ON chat_messages(session_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp 
            ON chat_messages(timestamp);
        """))
        
        conn.commit()
    
    print("✅ Chat tables created successfully!")


def verify_tables(engine):
    """
    Verify that all tables were created correctly.
    
    Args:
        engine: SQLAlchemy engine
    """
    print("\n🔍 Verifying table creation...")
    
    with engine.connect() as conn:
        # Check tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%chat%'
            ORDER BY table_name;
        """))
        
        tables = [row[0] for row in result.fetchall()]
        
        if 'chat_sessions' in tables and 'chat_messages' in tables:
            print("✅ All tables verified:")
            for table in tables:
                print(f"   ✓ {table}")
        else:
            print("❌ Missing tables!")
            print(f"   Found: {tables}")
            print("   Expected: ['chat_messages', 'chat_sessions']")
            return False
        
        # Check indexes
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename LIKE '%chat%'
            ORDER BY indexname;
        """))
        
        indexes = [row[0] for row in result.fetchall()]
        print(f"\n📊 Created {len(indexes)} indexes:")
        for idx in indexes:
            print(f"   ✓ {idx}")
        
        return True


def create_sample_data(engine):
    """
    Create sample chat session and messages for testing.
    
    Args:
        engine: SQLAlchemy engine
    """
    print("\n📝 Creating sample data...")
    
    with engine.connect() as conn:
        # Get first user ID
        result = conn.execute(text("SELECT id FROM users LIMIT 1"))
        user = result.fetchone()
        
        if not user:
            print("⚠️  No users found. Please create a user first.")
            return
        
        user_id = user[0]
        
        # Create sample session
        conn.execute(text("""
            INSERT INTO chat_sessions (id, user_id, title)
            VALUES (
                gen_random_uuid(),
                :user_id,
                'Welcome to Engunity AI'
            )
            ON CONFLICT (id) DO NOTHING;
        """), {"user_id": user_id})
        
        conn.commit()
        
        print(f"✅ Sample session created for user {user_id}")


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Initialize Engunity AI chat database tables"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop existing tables before creating new ones"
    )
    parser.add_argument(
        "--sample-data",
        action="store_true",
        help="Create sample chat data for testing"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Engunity AI - Chat Database Initialization")
    print("=" * 60)
    print(f"\n📍 Database: {settings.DATABASE_URL.split('@')[-1]}")
    print()
    
    try:
        # Create engine
        engine = create_engine(settings.DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL")
            print(f"   Version: {version.split(',')[0]}")
            print()
        
        # Drop tables if reset flag
        if args.reset:
            drop_tables(engine)
            print()
        
        # Create tables
        create_chat_tables(engine)
        
        # Verify
        success = verify_tables(engine)
        
        # Create sample data if requested
        if args.sample_data and success:
            create_sample_data(engine)
        
        print("\n" + "=" * 60)
        print("✅ Database initialization complete!")
        print("=" * 60)
        print("\n📝 Next steps:")
        print("   1. Set your GROQ_API_KEY in .env file")
        print("   2. Start the backend: uvicorn app.main:app --reload")
        print("   3. Start the frontend: npm run dev")
        print("   4. Navigate to http://localhost:3000/chat")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("   - Check your DATABASE_URL in .env file")
        print("   - Ensure PostgreSQL is running")
        print("   - Verify 'users' table exists before creating chat tables")
        sys.exit(1)


if __name__ == "__main__":
    main()
