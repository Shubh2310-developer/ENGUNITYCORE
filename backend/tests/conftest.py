"""
Shared test fixtures for backend auth tests.
Uses SQLite in-memory database for isolation.
Only creates the 'users' table to avoid PostgreSQL-specific types (e.g. ARRAY in images).
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db, Base
from app.models.user import User as UserModel
from app.models.code import CodeProject as ProjectModel, CodeFile as FileModel

# Use in-memory SQLite for tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=False)
def setup_database():
    """Create necessary tables (SQLite-compatible) before each test and drop after."""
    UserModel.__table__.create(bind=engine, checkfirst=True)
    ProjectModel.__table__.create(bind=engine, checkfirst=True)
    FileModel.__table__.create(bind=engine, checkfirst=True)
    yield
    FileModel.__table__.drop(bind=engine, checkfirst=True)
    ProjectModel.__table__.drop(bind=engine, checkfirst=True)
    UserModel.__table__.drop(bind=engine, checkfirst=True)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def client(setup_database):
    """Synchronous test client for FastAPI. Depends on setup_database."""
    with TestClient(app) as c:
        yield c
