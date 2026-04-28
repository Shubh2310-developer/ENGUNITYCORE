from datetime import datetime
from pathlib import Path
from typing import Dict

import pytest

from app.api.v1.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db
from app.main import app
from app.models.analytics import AnalyticsDataset, DatasetStatus
from app.models.user import User as UserModel
from app.schemas.data_analysis_agent import AnalysisType, QueryPlan
from app.services.analytics.data_analysis_agent_service import data_analysis_agent_service


def _open_test_db_session():
    override = app.dependency_overrides[get_db]
    session_gen = override()
    db = next(session_gen)
    return db, session_gen


@pytest.fixture(scope="function")
def setup_analytics_tables(setup_database):
    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    AnalyticsDataset.__table__.create(bind=bind, checkfirst=True)
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    yield

    db, session_gen = _open_test_db_session()
    bind = db.get_bind()
    AnalyticsDataset.__table__.drop(bind=bind, checkfirst=True)
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass


@pytest.fixture(scope="function")
def analytics_auth_override(setup_analytics_tables):
    db, session_gen = _open_test_db_session()
    user = UserModel(
        id=501,
        email="analytics-user@test.com",
        password_hash="local",
        role="user",
        is_active=True,
        provider="local",
    )
    db.add(user)
    db.commit()
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass

    active_user: Dict[str, AuthenticatedUser] = {
        "value": AuthenticatedUser(id=501, email="analytics-user@test.com", role="user", is_active=True, provider="local")
    }

    def _get_user():
        return active_user["value"]

    app.dependency_overrides[get_current_user] = _get_user
    yield active_user
    app.dependency_overrides.pop(get_current_user, None)


def _create_dataset(user_id: int, tmp_path: Path, name: str = "demo") -> int:
    csv_path = tmp_path / f"{name}.csv"
    csv_path.write_text("category,value\nA,10\nA,20\nB,30\n", encoding="utf-8")

    db, session_gen = _open_test_db_session()
    dataset = AnalyticsDataset(
        user_id=user_id,
        name=name,
        description="test dataset",
        file_name=csv_path.name,
        file_type="csv",
        file_size=csv_path.stat().st_size,
        storage_path=str(csv_path),
        row_count=3,
        column_count=2,
        columns_info=[{"name": "category", "dtype": "object"}, {"name": "value", "dtype": "int64"}],
        status=DatasetStatus.READY,
        error_message=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    dataset_id = dataset.id
    db.close()
    try:
        next(session_gen)
    except StopIteration:
        pass
    return dataset_id


class TestAnalyticsAskAgentAPI:
    def test_requires_auth(self, client):
        resp = client.post(
            "/api/v1/analytics/ask",
            json={"query": "show summary", "dataset_id": 1, "time_range": "30d", "data_source": "analytics"},
        )
        assert resp.status_code in (401, 403)

    def test_enforces_user_scoping(self, client, analytics_auth_override, tmp_path):
        foreign_dataset_id = _create_dataset(user_id=999, tmp_path=tmp_path, name="foreign")

        resp = client.post(
            "/api/v1/analytics/ask",
            json={
                "query": "show average by category",
                "dataset_id": foreign_dataset_id,
                "time_range": "30d",
                "data_source": "analytics",
            },
        )
        assert resp.status_code == 404
        body = resp.json()["detail"]
        assert body["code"] == "DATASET_NOT_FOUND"

    def test_blocks_dangerous_query_content(self, client, analytics_auth_override, tmp_path):
        dataset_id = _create_dataset(user_id=501, tmp_path=tmp_path, name="safe")

        resp = client.post(
            "/api/v1/analytics/ask",
            json={
                "query": "run $where function over records",
                "dataset_id": dataset_id,
                "time_range": "30d",
                "data_source": "analytics",
            },
        )
        assert resp.status_code == 400
        body = resp.json()["detail"]
        assert body["code"] == "UNSAFE_QUERY"

    def test_returns_summary_chart_and_followups(self, client, analytics_auth_override, tmp_path, monkeypatch):
        dataset_id = _create_dataset(user_id=501, tmp_path=tmp_path, name="main")

        async def _mock_plan(query: str, df):
            return QueryPlan(
                analysis_type=AnalysisType.COMPARISON,
                x_field="category",
                y_field="value",
                group_by="category",
                metric="avg",
                sort="desc",
                limit=10,
                operations=["group", "aggregate", "sort", "limit"],
            )

        async def _mock_summary(query, plan, rows, insights):
            return "Category B has a higher average value than category A in this dataset."

        monkeypatch.setattr(data_analysis_agent_service, "_translate_query_to_plan", _mock_plan)
        monkeypatch.setattr(data_analysis_agent_service, "_build_summary", _mock_summary)

        resp = client.post(
            "/api/v1/analytics/ask",
            json={
                "query": "compare average value by category",
                "dataset_id": dataset_id,
                "time_range": "30d",
                "data_source": "analytics",
            },
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["analysis_type"] == "comparison"
        assert isinstance(body["summary"], str)
        assert len(body["summary"]) > 0
        assert isinstance(body["insights"], list)
        assert isinstance(body["suggested_queries"], list)
        assert body["chart"]["chart_type"] in {"bar", "line", "pie", "scatter", "heatmap", "area", "histogram", "box"}
