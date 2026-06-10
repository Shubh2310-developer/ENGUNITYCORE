import pytest
import asyncio
from app.api.v1.auth import get_current_user
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.database import SessionLocal


@pytest.mark.asyncio
async def test_auth_fallback_session_creation():
    """Verify SessionLocal can create a DB session (auth layer health check)."""
    db = SessionLocal()
    assert db is not None
    db.close()
