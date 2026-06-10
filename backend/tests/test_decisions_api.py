import io
from typing import Dict

import pytest

from app.api.v1.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db
from app.main import app
from app.models.decision import Decision as DecisionModel
from app.models.user import User as UserModel
from app.services.ai.decision_ai import decision_ai_service
from app.services.ai.decision_ai import DecisionAnalysisError
from app.services.export.decision_export import decision_export_service


def _open_test_db_session():
    override = app.dependency_overrides[get_db]
    session_gen = override()
    db = next(session_gen)
    return db, session_gen


@pytest.fixture(scope="function")
def setup_decision_table(setup_database):
    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    DecisionModel.__table__.create(bind=bind, checkfirst=True)
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    yield

    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    DecisionModel.__table__.drop(bind=bind, checkfirst=True)
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass


@pytest.fixture(scope="function")
def decision_auth_override(setup_decision_table):
    db, session_gen = _open_test_db_session()

    user_a = UserModel(
        id=101,
        email="decision-a@test.com",
        password_hash="local",
        role="user",
        is_active=True,
        provider="local",
    )
    user_b = UserModel(
        id=202,
        email="decision-b@test.com",
        password_hash="local",
        role="user",
        is_active=True,
        provider="local",
    )
    db.add_all([user_a, user_b])
    db.commit()
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    active_user: Dict[str, AuthenticatedUser] = {
        "value": AuthenticatedUser(id=101, email="decision-a@test.com", role="user", is_active=True, provider="local")
    }

    def _get_user():
        return active_user["value"]

    app.dependency_overrides[get_current_user] = _get_user
    yield active_user
    app.dependency_overrides.pop(get_current_user, None)


def _create_payload(title: str = "Adopt monorepo tooling"):
    return {
        "title": title,
        "type": "Architecture",
        "status": "tentative",
        "confidence": "medium",
        "problem_statement": "Need consistent builds across teams",
        "context": "Cross-module dependency drift is increasing",
        "constraints": [],
        "options": [
            {
                "id": "opt-1",
                "label": "Adopt Turborepo",
                "description": "Use task graph caching",
                "pros": ["Faster CI"],
                "cons": ["Migration effort"],
                "estimated_effort": "medium",
                "risk_level": "low",
                "dismissed_reason": None,
            },
            {
                "id": "opt-2",
                "label": "Keep current",
                "description": "No structural changes",
                "pros": ["No migration"],
                "cons": ["Slower builds"],
                "estimated_effort": "low",
                "risk_level": "medium",
                "dismissed_reason": None,
            },
        ],
        "evidence": [],
        "tradeoffs": {"performance": 4, "cost": 3, "complexity": 3, "risk": 2, "scalability": 4, "time_to_implement": 3},
        "revisit_rule": {"trigger_type": "time_based", "trigger_value": "90 days", "notification_enabled": True},
        "ai_flags": [],
        "tags": ["platform", "build"],
        "final_decision": "Adopt Turborepo",
        "rationale": "Improves build throughput while keeping risk manageable",
        "privacy": "private",
        "workspace_id": "default",
    }


class TestDecisionsAPI:
    def test_create_and_list_decisions(self, client, decision_auth_override):
        create_resp = client.post("/api/v1/decisions/", json=_create_payload())
        assert create_resp.status_code == 200
        created = create_resp.json()
        assert created["title"] == "Adopt monorepo tooling"
        assert created["user_id"] == 101

        list_resp = client.get("/api/v1/decisions/")
        assert list_resp.status_code == 200
        listed = list_resp.json()
        assert len(listed) == 1
        assert listed[0]["id"] == created["id"]

    def test_created_by_populated_from_email(self, client, decision_auth_override):
        """
        POST /decisions/ and GET /decisions/ must both include created_by
        equal to the authenticated user's email — not a hardcoded placeholder.
        """
        create_resp = client.post("/api/v1/decisions/", json=_create_payload("Author email test"))
        assert create_resp.status_code == 200
        created = create_resp.json()
        # created_by must match the stub user's email (set in decision_auth_override)
        assert created.get("created_by") == "decision-a@test.com", (
            f"Expected created_by='decision-a@test.com', got {created.get('created_by')!r}"
        )

        list_resp = client.get("/api/v1/decisions/")
        assert list_resp.status_code == 200
        items = list_resp.json()
        assert any(d["created_by"] == "decision-a@test.com" for d in items), (
            "created_by not present or incorrect in list response"
        )

    def test_get_and_patch_decision(self, client, decision_auth_override):
        create_resp = client.post("/api/v1/decisions/", json=_create_payload("Decision for patch"))
        decision_id = create_resp.json()["id"]

        get_resp = client.get(f"/api/v1/decisions/{decision_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "Decision for patch"

        patch_resp = client.patch(
            f"/api/v1/decisions/{decision_id}",
            json={"status": "confirmed", "confidence": "high", "rationale": "Validated after pilot"},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == "confirmed"
        assert patch_resp.json()["confidence"] == "high"

    def test_decision_ownership_boundary(self, client, decision_auth_override):
        create_resp = client.post("/api/v1/decisions/", json=_create_payload("Ownership test"))
        decision_id = create_resp.json()["id"]

        decision_auth_override["value"] = AuthenticatedUser(
            id=202,
            email="decision-b@test.com",
            role="user",
            is_active=True,
            provider="local",
        )

        denied = client.get(f"/api/v1/decisions/{decision_id}")
        assert denied.status_code == 404

        denied_update = client.patch(f"/api/v1/decisions/{decision_id}", json={"status": "deprecated"})
        assert denied_update.status_code == 404

    def test_analyze_decision_contract(self, client, decision_auth_override, monkeypatch):
        async def _mock_analyze(_decision_in):
            return [
                {
                    "id": "flag-1",
                    "flag_type": "weak_evidence",
                    "severity": "warning",
                    "message": "Evidence is too thin",
                    "suggested_action": "Collect one more primary source",
                    "dismissed": False,
                }
            ]

        monkeypatch.setattr(decision_ai_service, "analyze_decision", _mock_analyze)

        resp = client.post("/api/v1/decisions/analyze", json=_create_payload("Analyze test"))
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert body[0]["flag_type"] == "weak_evidence"

    def test_analyze_decision_failure_contract(self, client, decision_auth_override, monkeypatch):
        async def _mock_analyze_fail(_decision_in):
            raise DecisionAnalysisError("AI_PROVIDER_ERROR", "upstream unavailable", retryable=True)

        monkeypatch.setattr(decision_ai_service, "analyze_decision", _mock_analyze_fail)

        resp = client.post("/api/v1/decisions/analyze", json=_create_payload("Analyze fail test"))
        assert resp.status_code == 502
        detail = resp.json()["detail"]
        assert detail["code"] == "AI_PROVIDER_ERROR"
        assert detail["retryable"] is True

    def test_create_idempotency_replay_and_conflict(self, client, decision_auth_override):
        payload = _create_payload("Idempotent create")
        headers = {"Idempotency-Key": "idem-1"}

        first = client.post("/api/v1/decisions/", json=payload, headers=headers)
        second = client.post("/api/v1/decisions/", json=payload, headers=headers)
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["id"] == second.json()["id"]

        changed = _create_payload("Idempotent create")
        changed["rationale"] = "changed payload"
        conflict = client.post("/api/v1/decisions/", json=changed, headers=headers)
        assert conflict.status_code == 409
        assert conflict.json()["detail"]["code"] == "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD"

    def test_create_succeeds_when_mongo_trace_fails(self, client, decision_auth_override, monkeypatch):
        class _TraceCursor:
            def sort(self, *_args, **_kwargs):
                return self

            async def to_list(self, length=100):
                return []

        class _FailingTraces:
            async def insert_one(self, _doc):
                raise RuntimeError("mongo down")

            def find(self, *_args, **_kwargs):
                return _TraceCursor()

        class _MongoDb:
            decision_traces = _FailingTraces()

        class _MongoProxy:
            db = _MongoDb()

        from app.api.v1 import decisions as decisions_module

        monkeypatch.setattr(decisions_module, "mongodb", _MongoProxy())

        resp = client.post("/api/v1/decisions/", json=_create_payload("Mongo down tolerance"))
        assert resp.status_code == 200
        decision_id = resp.json()["id"]

        get_resp = client.get(f"/api/v1/decisions/{decision_id}")
        assert get_resp.status_code == 200

    def test_schema_validation_rejects_invalid_privacy(self, client, decision_auth_override):
        payload = _create_payload("Invalid privacy")
        payload["privacy"] = "team-only"
        resp = client.post("/api/v1/decisions/", json=payload)
        assert resp.status_code == 422

    def test_export_endpoints_and_pdf_failure_mode(self, client, decision_auth_override, monkeypatch):
        create_resp = client.post("/api/v1/decisions/", json=_create_payload("Export me"))
        decision_id = create_resp.json()["id"]

        json_export = client.get(f"/api/v1/decisions/{decision_id}/export/json")
        assert json_export.status_code == 200
        assert "application/json" in json_export.headers.get("content-type", "")
        assert "attachment; filename=" in json_export.headers.get("content-disposition", "")

        adr_export = client.get(f"/api/v1/decisions/{decision_id}/export/adr")
        assert adr_export.status_code == 200
        assert "text/markdown" in adr_export.headers.get("content-type", "")

        star_export = client.get(f"/api/v1/decisions/{decision_id}/export/star")
        assert star_export.status_code == 200
        assert "text/markdown" in star_export.headers.get("content-type", "")

        monkeypatch.setattr(decision_export_service, "export_to_pdf", lambda _decision: None)
        pdf_unavailable = client.get(f"/api/v1/decisions/{decision_id}/export/pdf")
        assert pdf_unavailable.status_code == 500

        monkeypatch.setattr(decision_export_service, "export_to_pdf", lambda _decision: io.BytesIO(b"%PDF-1.4\n%mock"))
        pdf_ok = client.get(f"/api/v1/decisions/{decision_id}/export/pdf")
        assert pdf_ok.status_code == 200
        assert "application/pdf" in pdf_ok.headers.get("content-type", "")

    def test_export_adr_final_decision_stored_as_label(self, client, decision_auth_override):
        """
        Frontend stores final_decision as the option label string (not option id).
        The export service must find the chosen option by label when id lookup fails.
        """
        payload = _create_payload("Label-based final decision")
        # Override final_decision to use the option label (as the frontend does)
        payload["final_decision"] = "Adopt Turborepo"  # matches opt-1's label, not id

        create_resp = client.post("/api/v1/decisions/", json=payload)
        assert create_resp.status_code == 200
        decision_id = create_resp.json()["id"]

        adr_resp = client.get(f"/api/v1/decisions/{decision_id}/export/adr")
        assert adr_resp.status_code == 200
        adr_text = adr_resp.text
        # The export should find and render the chosen option by label
        assert "Adopt Turborepo" in adr_text

        star_resp = client.get(f"/api/v1/decisions/{decision_id}/export/star")
        assert star_resp.status_code == 200
        star_text = star_resp.text
        assert "Adopt Turborepo" in star_text

    def test_export_adr_missing_final_decision_option_graceful(self, client, decision_auth_override):
        """
        If final_decision references neither a valid id nor a valid label,
        exports should not crash — they should render a fallback.
        """
        payload = _create_payload("Orphaned final decision")
        payload["final_decision"] = "option-that-does-not-exist"

        create_resp = client.post("/api/v1/decisions/", json=payload)
        assert create_resp.status_code == 200
        decision_id = create_resp.json()["id"]

        adr_resp = client.get(f"/api/v1/decisions/{decision_id}/export/adr")
        assert adr_resp.status_code == 200
        # Should still render a decision section with fallback text
        assert "Decision" in adr_resp.text

    def test_analyze_decision_invalid_schema_from_ai(self, client, decision_auth_override, monkeypatch):
        """
        When the AI provider returns a response with a valid JSON array but
        flags that fail AIFlagSchema validation, the endpoint must return 502
        with code AI_RESPONSE_SCHEMA_INVALID.
        """
        from app.services.ai.decision_ai import DecisionAnalysisError as DAE

        async def _mock_analyze_invalid_schema(_decision_in):
            raise DAE("AI_RESPONSE_SCHEMA_INVALID", "malformed flag returned", retryable=False)

        monkeypatch.setattr(decision_ai_service, "analyze_decision", _mock_analyze_invalid_schema)

        resp = client.post("/api/v1/decisions/analyze", json=_create_payload("Schema invalid test"))
        assert resp.status_code == 502
        detail = resp.json()["detail"]
        assert detail["code"] == "AI_RESPONSE_SCHEMA_INVALID"
        assert detail["retryable"] is False

    def test_title_too_short_rejected(self, client, decision_auth_override):
        """Schema must reject titles shorter than 3 characters."""
        payload = _create_payload()
        payload["title"] = "AB"
        resp = client.post("/api/v1/decisions/", json=payload)
        assert resp.status_code == 422

    def test_list_empty_for_new_user(self, client, decision_auth_override):
        """GET /decisions/ returns an empty list for a user with no decisions, not a 404."""
        resp = client.get("/api/v1/decisions/")
        assert resp.status_code == 200
        assert resp.json() == []

