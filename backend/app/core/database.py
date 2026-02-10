from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    # Connection pooling optimized for 8 workers (4 connections per worker)
    pool_size=32,              # Base pool size for concurrent connections
    max_overflow=16,           # Additional connections when pool is full
    pool_pre_ping=True,        # Verify connections before using
    pool_recycle=3600,         # Recycle connections after 1 hour
    pool_timeout=30,           # Wait 30s for connection from pool
    echo_pool=False            # Disable pool event logging
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# For testing with SQLite, register event to handle PostgreSQL-specific types
if 'sqlite' in str(engine.url):
    from sqlalchemy.dialects.postgresql import ARRAY
    from sqlalchemy.types import String as StringType
    
    @event.listens_for(Base.metadata, "before_create")
    def receive_before_create(target, connection, **kw):
        """Replace PostgreSQL-specific types for SQLite compatibility."""
        for table in target.tables.values():
            for column in table.columns:
                # Replace ARRAY types with TEXT
                if isinstance(column.type, ARRAY):
                    column.type = StringType()
                # Replace gen_random_uuid() server defaults
                if column.server_default is not None:
                    default_arg = str(column.server_default.arg)
                    if 'gen_random_uuid' in default_arg:
                        column.server_default = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
