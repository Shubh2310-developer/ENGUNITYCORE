"""
Unit tests for research_workspace_service.py
============================================
Follows the same pattern as test_research_agent.py:
  - Mock groq_client.get_completion (AsyncMock) for controlled LLM responses
  - Mock MongoDB (mongodb.db) to test data fetchers
  - Verify correct shape returned and fallback behaviour on LLM errors
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.schemas.workspace_schemas import (
    ResearchSourceSchema,
    ResearchClusterSchema,
    GraphNodeSchema,
    ToolInvokeResponse,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

MOCK_SOURCES_DOC = {
    "user_id": "u1",
    "sources": [
        {"title": "Test Paper", "type": "Paper", "author": "A. Author", "date": "2024", "relevance": "90%"}
    ],
}

MOCK_CLUSTERS_DOC = {
    "user_id": "u1",
    "clusters": [{"name": "Test Cluster", "progress": 75}],
}

MOCK_NODES_DOC = {
    "user_id": "u1",
    "graph_nodes": [{"id": 99, "label": "TestNode", "top": "50%", "left": "50%", "active": True}],
}


def _make_mock_db(find_one_return):
    """Return a MagicMock representing mongodb.db with a collection stub."""
    collection = MagicMock()
    collection.find_one = AsyncMock(return_value=find_one_return)
    db = MagicMock()
    db.research_workspaces = collection
    return db


# ─────────────────────────────────────────────────────────────────────────────
# Data fetcher tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_sources_from_mongo():
    """Should return sources from MongoDB when document exists."""
    from app.services.research_workspace_service import get_sources

    with patch("app.services.research_workspace_service.mongodb") as mock_mongo:
        mock_mongo.db = _make_mock_db(MOCK_SOURCES_DOC)
        result = await get_sources("u1")

    assert len(result) == 1
    assert isinstance(result[0], ResearchSourceSchema)
    assert result[0].title == "Test Paper"


@pytest.mark.asyncio
async def test_get_sources_fallback_on_empty_mongo():
    """Should return default fallback sources when MongoDB has no document."""
    from app.services.research_workspace_service import get_sources, _DEFAULT_SOURCES

    with patch("app.services.research_workspace_service.mongodb") as mock_mongo:
        mock_mongo.db = _make_mock_db(None)
        result = await get_sources("u1")

    assert len(result) == len(_DEFAULT_SOURCES)


@pytest.mark.asyncio
async def test_get_sources_fallback_on_mongo_error():
    """Should return default fallback sources when MongoDB raises an exception."""
    from app.services.research_workspace_service import get_sources, _DEFAULT_SOURCES

    with patch("app.services.research_workspace_service.mongodb") as mock_mongo:
        mock_mongo.db = MagicMock()
        mock_mongo.db.research_workspaces.find_one = AsyncMock(side_effect=RuntimeError("connection lost"))
        result = await get_sources("u1")

    assert len(result) == len(_DEFAULT_SOURCES)


@pytest.mark.asyncio
async def test_get_clusters_from_mongo():
    """Should return clusters from MongoDB when document exists."""
    from app.services.research_workspace_service import get_clusters

    with patch("app.services.research_workspace_service.mongodb") as mock_mongo:
        mock_mongo.db = _make_mock_db(MOCK_CLUSTERS_DOC)
        result = await get_clusters("u1")

    assert len(result) == 1
    assert isinstance(result[0], ResearchClusterSchema)
    assert result[0].name == "Test Cluster"
    assert result[0].progress == 75


@pytest.mark.asyncio
async def test_get_graph_nodes_from_mongo():
    """Should return graph nodes from MongoDB when document exists."""
    from app.services.research_workspace_service import get_graph_nodes

    with patch("app.services.research_workspace_service.mongodb") as mock_mongo:
        mock_mongo.db = _make_mock_db(MOCK_NODES_DOC)
        result = await get_graph_nodes("u1")

    assert len(result) == 1
    assert isinstance(result[0], GraphNodeSchema)
    assert result[0].label == "TestNode"
    assert result[0].active is True


# ─────────────────────────────────────────────────────────────────────────────
# AI Tool tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_run_gap_detector_success():
    """Should parse LLM JSON and return a ToolInvokeResponse containing gaps."""
    from app.services.research_workspace_service import run_gap_detector

    mock_llm_response = '[{"label": "Sparse Attention", "confidence": "High", "reason": "Not covered."}]'

    with patch("app.services.research_workspace_service.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value=mock_llm_response)
        result = await run_gap_detector("Some research context.", ["Source A"])

    assert isinstance(result, ToolInvokeResponse)
    assert result.tool == "gap"
    gaps = result.result["gaps"]
    assert len(gaps) == 1
    assert gaps[0]["label"] == "Sparse Attention"


@pytest.mark.asyncio
async def test_run_gap_detector_fallback_on_llm_error():
    """Should return fallback gaps when LLM raises an exception."""
    from app.services.research_workspace_service import run_gap_detector

    with patch("app.services.research_workspace_service.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(side_effect=RuntimeError("LLM timeout"))
        result = await run_gap_detector("Some context.", [])

    assert isinstance(result, ToolInvokeResponse)
    assert "gaps" in result.result
    # Fallback must return a non-empty list
    assert len(result.result["gaps"]) > 0


@pytest.mark.asyncio
async def test_run_method_comparator_success():
    """Should return a dict with 'methods' and 'matrix' keys from LLM."""
    from app.services.research_workspace_service import run_method_comparator

    mock_response = '{"methods":["A","B"],"parameters":["Speed"],"matrix":{"A":{"Speed":"Fast"},"B":{"Speed":"Slow"}},"lead":"A","contradiction":"None.","synthesis_insight":"A is better."}'

    with patch("app.services.research_workspace_service.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value=mock_response)
        result = await run_method_comparator("Research context.", [])

    assert result.tool == "comparator"
    assert "methods" in result.result
    assert result.result["lead"] == "A"


@pytest.mark.asyncio
async def test_run_hypothesis_challenger_fallback_on_invalid_json():
    """Should return fallback result when LLM returns non-JSON text."""
    from app.services.research_workspace_service import run_hypothesis_challenger

    with patch("app.services.research_workspace_service.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value="Sorry, I cannot help with that.")
        result = await run_hypothesis_challenger("Hypothesis context.", [])

    assert result.tool == "challenger"
    assert "empirical_support_pct" in result.result


@pytest.mark.asyncio
async def test_run_assumption_extractor_returns_list():
    """Assumption extractor should return a list of assumption objects."""
    from app.services.research_workspace_service import run_assumption_extractor

    mock_response = '[{"source": "Vaswani", "type": "Explicit", "text": "Needs TPUs."}]'

    with patch("app.services.research_workspace_service.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value=mock_response)
        result = await run_assumption_extractor("Context text.", ["Vaswani"])

    assert result.tool == "assumption"
    assert len(result.result["assumptions"]) == 1


# ─────────────────────────────────────────────────────────────────────────────
# Dispatcher test
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dispatcher_routes_all_nine_tools():
    """invoke_tool should successfully dispatch every valid tool key."""
    from app.services.research_workspace_service import invoke_tool

    valid_json_responses = {
        "gap":        '[{"label":"Gap","confidence":"High","reason":"reason"}]',
        "comparator": '{"methods":["A"],"parameters":["P"],"matrix":{"A":{"P":"v"}},"lead":"A","contradiction":"c","synthesis_insight":"s"}',
        "assumption": '[{"source":"S","type":"Explicit","text":"t"}]',
        "strength":   '[{"source":"S","strengths":["str"],"weaknesses":["wk"]}]',
        "question":   '["Q1?","Q2?"]',
        "argument":   '[{"claim":"C","support":"Strong","evidence":"Evidence"}]',
        "resolver":   '[{"conflict_id":1,"title":"T","source_a":{"name":"A","claim":"a"},"source_b":{"name":"B","claim":"b"},"resolution":"R"}]',
        "coherence":  '[{"step":1,"title":"intro","issue":null,"transition_score":0.9}]',
        "challenger": '{"main_hypothesis":"H","potential_contradiction":"C","empirical_support_pct":70,"theoretical_risk_pct":30,"stress_test_details":[]}',
    }

    for tool_key, mock_response in valid_json_responses.items():
        with patch("app.services.research_workspace_service.groq_client") as mock_groq:
            mock_groq.get_completion = AsyncMock(return_value=mock_response)
            result = await invoke_tool(tool_key, "test context", [])

        assert isinstance(result, ToolInvokeResponse), f"Expected ToolInvokeResponse for tool '{tool_key}'"
        assert result.tool == tool_key
        assert isinstance(result.generated_at, datetime)


@pytest.mark.asyncio
async def test_dispatcher_raises_on_unknown_tool():
    """invoke_tool should raise ValueError for an unrecognised tool key."""
    from app.services.research_workspace_service import invoke_tool

    with pytest.raises(ValueError, match="Unknown tool key"):
        await invoke_tool("nonexistent_tool", "ctx", [])
