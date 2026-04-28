from datetime import datetime, timedelta
from typing import Dict

import pytest

from app.agents.wellbeing_agent import WellbeingAgent
from app.api.v1.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db
from app.main import app
from app.models.analytics import AnalyticsSession
from app.models.user import User as UserModel
from tests.conftest import override_get_db


def _open_test_db_session():
    app.dependency_overrides[get_db] = override_get_db
    override = app.dependency_overrides[get_db]
    session_gen = override()
    db = next(session_gen)
    return db, session_gen


@pytest.fixture(scope="function")
def setup_wellbeing_tables(setup_database):
    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    AnalyticsSession.__table__.create(bind=bind, checkfirst=True)
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    yield

    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    AnalyticsSession.__table__.drop(bind=bind, checkfirst=True)
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass


@pytest.fixture(scope="function")
def wellbeing_auth_override(setup_wellbeing_tables):
    db, session_gen = _open_test_db_session()
    user = UserModel(
        id=602,
        email="wellbeing-user@test.com",
        password_hash="local",
        role="user",
        is_active=True,
        provider="supabase",
    )
    db.add(user)
    db.commit()
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    active_user: Dict[str, AuthenticatedUser] = {
        "value": AuthenticatedUser(id=602, email="wellbeing-user@test.com", role="user", is_active=True, provider="supabase")
    }

    def _get_user():
        return active_user["value"]

    app.dependency_overrides[get_current_user] = _get_user
    yield active_user
    app.dependency_overrides.pop(get_current_user, None)


def _create_session(user_id: int, created_at: datetime, updated_at: datetime) -> None:
    db, session_gen = _open_test_db_session()
    db.add(
        AnalyticsSession(
            user_id=user_id,
            title="Wellbeing test session",
            description="metadata only",
            created_at=created_at,
            updated_at=updated_at,
        )
    )
    db.commit()
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass


class TestWellbeingAgent:
    @pytest.mark.asyncio
    async def test_detects_marathon_and_overwork_from_user_sessions(self, setup_wellbeing_tables):
        agent = WellbeingAgent()
        now = datetime.utcnow()
        _create_session(602, now - timedelta(hours=12), now - timedelta(hours=7))
        _create_session(602, now - timedelta(hours=6), now - timedelta(hours=1))

        db, session_gen = _open_test_db_session()
        try:
            result = await agent.check_wellbeing(602, "24h", db)
        finally:
            db.close()
            try:
                next(session_gen)
            except StopIteration:
                pass

        assert result.overall_status == "concern"
        assert "marathon" in [signal.value for signal in result.signals_detected]
        assert "overwork" in [signal.value for signal in result.signals_detected]
        assert result.intervention is not None

    def test_check_requires_auth(self, client):
        resp = client.get("/api/v1/wellbeing/check")
        assert resp.status_code in (401, 403)

    def test_pomodoro_requires_auth(self, client):
        resp = client.post(
            "/api/v1/wellbeing/pomodoro",
            json={"focus_minutes": 25, "break_minutes": 5, "rounds": 1},
        )
        assert resp.status_code in (401, 403)

    def test_event_requires_auth(self, client):
        resp = client.post(
            "/api/v1/wellbeing/event",
            json={"event_type": "viewed", "context": {"page": "analytics"}},
        )
        assert resp.status_code in (401, 403)

    def test_empty_data_returns_healthy_contract(self, client, wellbeing_auth_override):
        resp = client.get("/api/v1/wellbeing/check?period=24h")
        assert resp.status_code == 200
        body = resp.json()
        assert set(body.keys()) == {
            "signals_detected",
            "overall_status",
            "stress_score",
            "intervention",
            "message",
            "tips",
        }
        assert body["signals_detected"] == []
        assert body["overall_status"] == "healthy"
        assert body["stress_score"] == 0
        assert body["intervention"] is None

    def test_invalid_period_is_rejected(self, client, wellbeing_auth_override):
        resp = client.get("/api/v1/wellbeing/check?period=90d")
        assert resp.status_code == 422

    def test_pomodoro_and_event_contracts(self, client, wellbeing_auth_override):
        pomodoro = client.post(
            "/api/v1/wellbeing/pomodoro",
            json={"focus_minutes": 25, "break_minutes": 5, "rounds": 2, "topic": "Correlation analysis"},
        )
        assert pomodoro.status_code == 200
        assert pomodoro.json() == {
            "status": "started",
            "focus_minutes": 25,
            "break_minutes": 5,
            "topic": "Correlation analysis",
        }

        event = client.post(
            "/api/v1/wellbeing/event",
            json={"event_type": "dismissed", "context": {"page": "analytics", "active_tab": "overview"}},
        )
        assert event.status_code == 200
        assert event.json() == {"ok": True}

    def test_feature_flag_disables_agent_surface(self, client, wellbeing_auth_override, monkeypatch):
        monkeypatch.setenv("WELLBEING_AGENT_ENABLED", "false")

        check = client.get("/api/v1/wellbeing/check?period=24h")
        assert check.status_code == 200
        assert check.json()["overall_status"] == "healthy"

        pomodoro = client.post(
            "/api/v1/wellbeing/pomodoro",
            json={"focus_minutes": 25, "break_minutes": 5, "rounds": 2},
        )
        assert pomodoro.status_code == 200
        assert pomodoro.json()["status"] == "disabled"

        event = client.post(
            "/api/v1/wellbeing/event",
            json={"event_type": "dismissed", "context": {"page": "analytics"}},
        )
        assert event.status_code == 200
        assert event.json() == {"ok": False}

    def test_event_rejects_oversized_context(self, client, wellbeing_auth_override):
        oversized_context = {f"k{i}": i for i in range(11)}
        resp = client.post(
            "/api/v1/wellbeing/event",
            json={"event_type": "viewed", "context": oversized_context},
        )
        assert resp.status_code == 422
