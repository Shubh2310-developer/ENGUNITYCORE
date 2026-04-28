from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from types import SimpleNamespace
from typing import Any, Dict, List

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.main import app
from app.models.chat import ChatSession
from app.models.user import User


class FakeInsertResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class FakeCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self.docs = docs
        self._idx = 0

    def sort(self, key: str, direction: int):
        reverse = direction == -1
        self.docs.sort(key=lambda item: item.get(key, datetime.utcnow()), reverse=reverse)
        return self

    def __aiter__(self):
        self._idx = 0
        return self

    async def __anext__(self):
        if self._idx >= len(self.docs):
            raise StopAsyncIteration
        value = self.docs[self._idx]
        self._idx += 1
        return value


class FakeChatMessagesCollection:
    def __init__(self):
        self.docs: List[Dict[str, Any]] = []

    async def insert_one(self, document: Dict[str, Any]):
        copy_doc = dict(document)
        doc_id = str(len(self.docs) + 1)
        copy_doc["_id"] = doc_id
        self.docs.append(copy_doc)
        return FakeInsertResult(doc_id)

    def find(self, query: Dict[str, Any]):
        session_id = query.get("session_id")
        matched = [d for d in self.docs if d.get("session_id") == session_id]
        return FakeCursor(matched)


class FakeMongoDB:
    def __init__(self):
        self.chat_messages = FakeChatMessagesCollection()


@dataclass
class FakeCurrentUser:
    id: int
    email: str = "test@engunity.com"


class FakePipeline:
    async def stream_query(self, **kwargs):
        yield {
            "type": "metadata",
            "strategy": kwargs.get("strategy") or "vector_rag",
            "retrieved_docs": [],
        }
        yield {"type": "content", "content": "Turbo quant response."}
        yield {"type": "done", "strategy": kwargs.get("strategy") or "vector_rag"}


def _parse_sse_events(stream_text: str) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    for line in stream_text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("data: "):
            continue
        payload = stripped[6:]
        events.append(json.loads(payload))
    return events


@pytest.fixture
def turbo_client(monkeypatch):
    test_db_url = "sqlite:///./test_turbo_quant_integration.db"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    User.__table__.create(bind=engine, checkfirst=True)
    ChatSession.__table__.create(bind=engine, checkfirst=True)

    db = TestingSessionLocal()
    user = User(
        id=1,
        email="test@engunity.com",
        password_hash="test",
        role="user",
        is_active=True,
        provider="local",
    )
    db.merge(user)
    db.commit()
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    async def override_current_user():
        return FakeCurrentUser(id=1)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user

    from app.core.mongodb import mongodb

    original_mongo = mongodb.db
    mongodb.db = FakeMongoDB()

    async def fake_build_context(session_id: str, user_id: str, query: str):
        return [], [], {}

    monkeypatch.setattr("app.services.chat.context.build_context", fake_build_context)
    monkeypatch.setattr("app.api.v1.omni_rag.get_omni_rag_pipeline", lambda: FakePipeline())

    with TestClient(app) as client:
        yield client, mongodb

    mongodb.db = original_mongo
    app.dependency_overrides.clear()

    ChatSession.__table__.drop(bind=engine, checkfirst=True)
    User.__table__.drop(bind=engine, checkfirst=True)


def test_stream_without_turbo_quant_keeps_contract(turbo_client, monkeypatch):
    client, _ = turbo_client
    monkeypatch.setattr("app.api.v1.omni_rag.ai_router.get_provider_identity_for_strategy", lambda strategy: "groq")

    response = client.post(
        "/api/v1/omni-rag/stream",
        json={"query": "hello"},
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    events = _parse_sse_events(response.text)
    assert events[0]["type"] == "metadata"
    assert "turbo_quant" not in events[0]
    assert any(event["type"] == "content" for event in events)
    assert any(event["type"] == "done" for event in events)


def test_stream_with_turbo_quant_unsupported_provider_falls_back(turbo_client, monkeypatch):
    client, _ = turbo_client
    monkeypatch.setattr("app.api.v1.omni_rag.ai_router.get_provider_identity_for_strategy", lambda strategy: "groq")
    monkeypatch.setattr("app.services.ai.turbo_quant_service.settings.ENABLE_TURBO_QUANT_CHAT", True)

    response = client.post(
        "/api/v1/omni-rag/stream",
        json={
            "query": "hello",
            "turbo_quant": {
                "enabled": True,
                "mode": "auto",
                "target": "auto",
                "variant": "prod",
                "bit_width": 4,
            },
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    events = _parse_sse_events(response.text)
    first_metadata = events[0]
    assert first_metadata["type"] == "metadata"
    assert first_metadata["turbo_quant"] == {
        "requested": True,
        "applied": False,
        "provider": "groq",
        "fallback_reason": "provider_unsupported",
    }


def test_stream_with_turbo_quant_supported_provider_can_apply(turbo_client, monkeypatch):
    client, _ = turbo_client
    monkeypatch.setattr("app.api.v1.omni_rag.ai_router.get_provider_identity_for_strategy", lambda strategy: "ollama")
    monkeypatch.setattr("app.services.ai.turbo_quant_service.settings.ENABLE_TURBO_QUANT_CHAT", True)

    response = client.post(
        "/api/v1/omni-rag/stream",
        json={
            "query": "hello",
            "turbo_quant": {
                "enabled": True,
                "mode": "auto",
                "target": "auto",
                "variant": "prod",
                "bit_width": 4,
            },
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    events = _parse_sse_events(response.text)
    first_metadata = events[0]
    assert first_metadata["turbo_quant"]["requested"] is True
    assert first_metadata["turbo_quant"]["applied"] is True
    assert first_metadata["turbo_quant"]["provider"] == "ollama"


def test_history_returns_persisted_turbo_quant_metadata(turbo_client, monkeypatch):
    client, _ = turbo_client
    monkeypatch.setattr("app.api.v1.omni_rag.ai_router.get_provider_identity_for_strategy", lambda strategy: "groq")
    monkeypatch.setattr("app.services.ai.turbo_quant_service.settings.ENABLE_TURBO_QUANT_CHAT", True)

    stream_response = client.post(
        "/api/v1/omni-rag/stream",
        json={
            "query": "persist test",
            "turbo_quant": {
                "enabled": True,
                "mode": "auto",
                "target": "auto",
                "variant": "prod",
                "bit_width": 4,
            },
        },
        headers={"Authorization": "Bearer test-token"},
    )
    assert stream_response.status_code == 200

    events = _parse_sse_events(stream_response.text)
    session_id = events[0]["session_id"]

    history_response = client.get(
        f"/api/v1/chat/{session_id}",
        headers={"Authorization": "Bearer test-token"},
    )
    assert history_response.status_code == 200
    payload = history_response.json()
    assistant_messages = [m for m in payload["messages"] if m.get("role") == "assistant"]
    assert assistant_messages
    assert assistant_messages[-1]["turbo_quant"] == {
        "requested": True,
        "applied": False,
        "provider": "groq",
        "fallback_reason": "provider_unsupported",
        "variant": None,
        "bit_width": None,
        "compression_ratio": None,
        "estimated_memory_saved_mb": None,
        "quality_score": None,
        "first_token_overhead_ms": None,
    }
