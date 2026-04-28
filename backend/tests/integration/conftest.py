"""
Integration test fixtures for code dashboard flow tests.

Keeps the `client` fixture discoverable when pytest is run directly from
`backend/tests/integration` (for example: `pytest test_code_dashboard_flow.py`).
"""

import pathlib
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Use environment variables for secrets; they should be set by pytest or test runner
# NEVER use hardcoded secrets in code
os.environ.setdefault("SECRET_KEY", os.getenv("TEST_SECRET_KEY", "pytest-generated-secret"))
os.environ.setdefault("DATABASE_URL", os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db"))

from app.core.database import Base, get_db
from app.main import app
from app.models.code import CodeFile as FileModel
from app.models.code import CodeProject as ProjectModel
from app.models.user import User as UserModel


SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=False)
def setup_database():
    """Create SQLite-compatible tables for each test."""
    FileModel.__table__.drop(bind=engine, checkfirst=True)
    ProjectModel.__table__.drop(bind=engine, checkfirst=True)
    UserModel.__table__.drop(bind=engine, checkfirst=True)
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
    """Synchronous FastAPI test client."""
    with TestClient(app) as c:
        yield c
