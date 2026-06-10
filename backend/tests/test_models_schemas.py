import pytest
from pydantic import ValidationError
from app.models.user import User as UserORM
from app.models.chat import ChatSession as ChatSessionORM
from app.models.code import CodeProject as CodeProjectORM
from app.models.decision import Decision as DecisionORM
from app.models.document import Document as DocumentORM
from app.models.github import GitHubRepository as GitHubRepositoryORM
from app.models.image import Image as ImageORM, ImageVariant as ImageVariantORM
from app.models.research import ResearchPaper as ResearchPaperORM

from app.schemas.user import UserCreate, User
from app.schemas.chat import ChatSessionCreate, ChatMessageCreate
from app.schemas.code import CodeProjectCreate
from app.schemas.decision import DecisionCreate, DecisionUpdate
from app.schemas.document import DocumentCreate
from app.schemas.wellbeing_agent import PomodoroSession

def test_sqlalchemy_model_attributes():
    # User model attributes
    user = UserORM(email="test@user.com", password_hash="pw", role="user")
    assert user.email == "test@user.com"
    assert user.role == "user"

    # Chat Session
    session = ChatSessionORM(title="Session 1", user_id=1)
    assert session.title == "Session 1"

    # Project
    proj = CodeProjectORM(name="Project A")
    assert proj.name == "Project A"

    # Decision
    dec = DecisionORM(title="Design choice", status="draft")
    assert dec.title == "Design choice"

def test_pydantic_schema_validation():
    # User Create valid
    uc = UserCreate(email="test@user.com", password="password123", role="user")
    assert uc.email == "test@user.com"
    assert uc.role == "user"

    # User Create invalid email
    with pytest.raises(ValidationError):
        UserCreate(email="invalid-email", password="123")

    # Chat Session Create
    csc = ChatSessionCreate(title="Chat Session")
    assert csc.title == "Chat Session"

    # Pomodoro Session
    ps = PomodoroSession(focus_minutes=25, break_minutes=5, rounds=4)
    assert ps.focus_minutes == 25
    assert ps.rounds == 4
