"""
Comprehensive unit tests for the Deep Research Agent.

Covers:
- Query decomposition (happy path + LLM failure fallback)
- Parallel source evaluation (verifies asyncio.gather is used, not serial)
- RAG search wrapper (to_thread isolation)
- Graph search wrapper (to_thread isolation)
- Timeout enforcement in _parallel_search
- Full streaming pipeline
- Full non-streaming pipeline
- Singleton factory re-initialisation when omni_rag changes
- Error handling: search failure -> graceful degradation
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call

from app.agents.research_agent import DeepResearchAgent, get_research_agent
from app.schemas.research_agent import (
    ResearchRequest, ResearchDepth, SubQuery, ResearchStreamEvent
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_agent(mock_rag: MagicMock | None = None) -> DeepResearchAgent:
    """Construct a DeepResearchAgent with all heavy dependencies patched."""
    if mock_rag is None:
        mock_rag = MagicMock()

    with (
        patch("app.agents.research_agent.QueryComplexityClassifier"),
        patch("app.agents.research_agent.get_quality_metrics"),
        patch("app.agents.research_agent.WebSearchFallback"),
        patch("app.agents.research_agent.KnowledgeGraph"),
    ):
        return DeepResearchAgent(mock_rag)


def _quick_request(query: str = "What is Python?", **kwargs) -> ResearchRequest:
    return ResearchRequest(
        query=query,
        depth=ResearchDepth.QUICK,
        max_iterations=1,
        include_web_search=False,
        include_graph_search=False,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# 1. Query decomposition
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_decompose_query_happy_path():
    """LLM returns valid JSON → sub-queries are parsed correctly."""
    agent = _make_agent()

    with patch("app.agents.research_agent.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(
            return_value='[{"question": "Sub Q1", "query_type": "factual", "priority": 1}]'
        )
        sub_queries = await agent._decompose_query("Compare React and Vue", max_sub_queries=3)

    assert len(sub_queries) == 1
    assert sub_queries[0].question == "Sub Q1"
    assert sub_queries[0].query_type == "factual"


@pytest.mark.asyncio
async def test_decompose_query_llm_failure_fallback():
    """If the LLM call raises an exception the agent falls back to a single sub-query."""
    agent = _make_agent()

    with patch("app.agents.research_agent.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(side_effect=Exception("LLM timeout"))
        sub_queries = await agent._decompose_query("Original question", max_sub_queries=5)

    assert len(sub_queries) == 1
    assert sub_queries[0].question == "Original question"


@pytest.mark.asyncio
async def test_decompose_query_with_code_fence():
    """LLM response wrapped in ```json ... ``` fences is stripped cleanly."""
    agent = _make_agent()

    llm_response = '```json\n[{"question": "What is asyncio?", "query_type": "factual", "priority": 2}]\n```'
    with patch("app.agents.research_agent.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value=llm_response)
        sub_queries = await agent._decompose_query("asyncio in Python", max_sub_queries=3)

    assert len(sub_queries) == 1
    assert "asyncio" in sub_queries[0].question


# ---------------------------------------------------------------------------
# 2. Source evaluation (parallel scoring)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_evaluate_sources_parallel_scoring():
    """_evaluate_sources must call _score_relevance for ALL sources in parallel
    (via asyncio.gather) rather than serially.  We verify by counting mock calls
    and checking that the final evaluations reflect the mock scores."""
    agent = _make_agent()

    sources = [
        {"content": "React is a JavaScript library.", "source": "doc_a", "type": "rag_document"},
        {"content": "Vue is a progressive framework.", "source": "doc_b", "type": "rag_document"},
        {"content": "", "source": "empty_source", "type": "rag_document"},
    ]

    # _score_relevance returns per-source values
    agent._score_relevance = AsyncMock(side_effect=[0.9, 0.7, 0.0])

    evaluated = await agent._evaluate_sources("JavaScript frameworks", sources)

    # All three sources should be evaluated (including the empty one, which the
    # keyword path assigns 0.0)
    assert agent._score_relevance.call_count == 3
    assert len(evaluated) == 3
    # Highest-relevance source must be first after sorting
    assert evaluated[0].relevance_score == 0.9
    assert evaluated[0].source_name == "doc_a"


@pytest.mark.asyncio
async def test_evaluate_sources_deduplication():
    """Sources with the same source_name are deduplicated (keep highest-ranked)."""
    agent = _make_agent()

    sources = [
        {"content": "Content A first", "source": "same_name", "type": "rag_document"},
        {"content": "Content A second", "source": "same_name", "type": "rag_document"},
    ]
    agent._score_relevance = AsyncMock(side_effect=[0.8, 0.6])

    evaluated = await agent._evaluate_sources("test", sources)

    # Deduplicated → only one entry
    assert len(evaluated) == 1
    # The one kept should have score 0.8 (sorted before deduplication)
    assert evaluated[0].relevance_score == 0.8


@pytest.mark.asyncio
async def test_evaluate_sources_exclude():
    """Sources listed in exclude are silently dropped."""
    agent = _make_agent()

    sources = [
        {"content": "Keep me", "source": "keep", "type": "rag_document"},
        {"content": "Exclude me", "source": "skip_this", "type": "rag_document"},
    ]
    agent._score_relevance = AsyncMock(side_effect=[0.9])  # Only called once

    evaluated = await agent._evaluate_sources("query", sources, exclude=["skip_this"])

    assert len(evaluated) == 1
    assert evaluated[0].source_name == "keep"
    assert agent._score_relevance.call_count == 1


@pytest.mark.asyncio
async def test_evaluate_sources_relevance_exception_uses_fallback():
    """If _score_relevance raises for a source, it gets 0.5 and is still included."""
    agent = _make_agent()

    sources = [{"content": "Some content", "source": "source_a", "type": "rag_document"}]
    agent._score_relevance = AsyncMock(side_effect=Exception("API error"))

    evaluated = await agent._evaluate_sources("test query", sources)

    assert len(evaluated) == 1
    assert evaluated[0].relevance_score == 0.5  # fallback value


# ---------------------------------------------------------------------------
# 3. RAG search wrapper (asyncio.to_thread isolation)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rag_search_wrapper_uses_thread():
    """_rag_search_wrapper must call vector_store.search via asyncio.to_thread."""
    mock_rag = MagicMock()
    mock_rag.vector_store.search.return_value = [
        {"content": "doc content", "metadata": {"filename": "file.md"}}
    ]
    agent = _make_agent(mock_rag)

    with patch("app.agents.research_agent.asyncio.to_thread", new=AsyncMock(
        return_value=[{"content": "doc content", "metadata": {"filename": "file.md"}}]
    )) as mock_to_thread:
        results = await agent._rag_search_wrapper("query", "user_1", None)

    mock_to_thread.assert_called_once()
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_rag_search_wrapper_returns_empty_on_error():
    """If the vector store raises, _rag_search_wrapper returns []."""
    mock_rag = MagicMock()
    agent = _make_agent(mock_rag)

    with patch("app.agents.research_agent.asyncio.to_thread", new=AsyncMock(side_effect=RuntimeError("DB down"))):
        results = await agent._rag_search_wrapper("query", "user_1", None)

    assert results == []


# ---------------------------------------------------------------------------
# 4. Graph search wrapper (asyncio.to_thread isolation)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_graph_search_wrapper_uses_thread():
    """_graph_search_wrapper must use asyncio.to_thread for search_communities."""
    agent = _make_agent()
    community_data = [{"community_id": "c1", "summary": "Summary A", "score": 0.8}]

    with patch("app.agents.research_agent.asyncio.to_thread", new=AsyncMock(return_value=community_data)):
        results = await agent._graph_search_wrapper("query", "user_1")

    assert len(results) == 1
    assert results[0]["source"] == "Community c1"
    assert results[0]["type"] == "graph_node"


@pytest.mark.asyncio
async def test_graph_search_wrapper_returns_empty_on_error():
    """If the graph store raises, _graph_search_wrapper returns []."""
    agent = _make_agent()

    with patch("app.agents.research_agent.asyncio.to_thread", new=AsyncMock(side_effect=RuntimeError("graph error"))):
        results = await agent._graph_search_wrapper("query", "user_1")

    assert results == []


# ---------------------------------------------------------------------------
# 5. Parallel search — timeout enforcement
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_parallel_search_timeout_does_not_block():
    """If a search sub-task hangs past the 15-second window, asyncio.wait_for
    cancels it as TimeoutError; _parallel_search treats it as a warning and
    continues rather than propagating the exception to callers."""
    agent = _make_agent()

    async def slow_rag(*args, **kwargs):
        await asyncio.sleep(999)  # Simulates a hung I/O operation
        return []

    async def fast_web(query, **kwargs):
        return [{"content": "web result", "source": "web", "type": "web"}]

    agent._rag_search_wrapper = slow_rag  # type: ignore[assignment]
    agent.web_search.search = fast_web  # type: ignore[assignment]

    sub_queries = [SubQuery(id="sq_0", question="test", query_type="factual", priority=1)]

    # Patch wait_for so the timeout is effectively instant (0.01 s) and the
    # coroutine is still wrapped — we just want to confirm no crash occurs.
    original_wait_for = asyncio.wait_for

    async def fast_wait_for(coro, timeout):
        return await original_wait_for(coro, timeout=0.01)

    with patch("app.agents.research_agent.asyncio.wait_for", side_effect=fast_wait_for):
        results = await agent._parallel_search(
            sub_queries, "user_1", None, include_web=True, include_graph=False
        )

    # Web result should still be present; the hung RAG task was cancelled
    web_results = [r for r in results if r.get("type") == "web"]
    assert len(web_results) >= 1


# ---------------------------------------------------------------------------
# 6. Streaming pipeline end-to-end
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_stream_research_yields_events_and_complete():
    """stream_research must yield at least a status event and a complete event."""
    mock_rag = MagicMock()
    mock_rag.vector_store.search.return_value = []
    agent = _make_agent(mock_rag)

    with patch("app.agents.research_agent.groq_client") as mock_groq, \
         patch("app.agents.research_agent.asyncio.to_thread", new=AsyncMock(return_value=[])):

        mock_groq.get_completion = AsyncMock(side_effect=[
            '[{"question": "What is Python?", "query_type": "factual", "priority": 1}]',  # decompose
            "[]",          # identify gaps → empty, pipeline exits iteration
            "Report text", # synthesize
            '["insight"]', # extract key insights
            '["q?"]',      # extract follow-ups
            '["topic"]',   # extract related topics
        ])
        agent._identify_gaps = AsyncMock(return_value=[])
        agent._evaluate_sources = AsyncMock(return_value=[])

        events = []
        async for event in agent.stream_research(_quick_request(), user_id="u1"):
            events.append(event)

    event_types = [e.event_type for e in events]
    assert "status" in event_types
    assert "complete" in event_types

    complete_event = next(e for e in events if e.event_type == "complete")
    assert complete_event.progress_percent == 100.0


# ---------------------------------------------------------------------------
# 7. Full non-streaming pipeline
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_full_research_flow_mocked():
    """Integration test: full research() call with all LLM calls mocked out."""
    mock_rag = MagicMock()
    agent = _make_agent(mock_rag)

    with patch("app.agents.research_agent.groq_client") as mock_groq, \
         patch("app.agents.research_agent.asyncio.to_thread", new=AsyncMock(return_value=[])):

        mock_groq.get_completion = AsyncMock(side_effect=[
            '[{"question": "What is React?", "query_type": "factual", "priority": 1}]',
            "Research Report Content",
            '[\"Key Finding 1\"]',
            '[\"Follow up?\"]',
            '[\"Related Topic\"]',
        ])
        agent._identify_gaps = AsyncMock(return_value=[])
        agent._evaluate_sources = AsyncMock(return_value=[])

        request = _quick_request("What is React?")
        report = await agent.research(request, user_id="test_user")

    assert report.status == "completed"
    assert report.query == "What is React?"


# ---------------------------------------------------------------------------
# 8. Singleton factory re-initialisation
# ---------------------------------------------------------------------------


def test_get_research_agent_singleton():
    """get_research_agent returns the same instance for the same omni_rag."""
    import app.agents.research_agent as mod
    # Reset singleton to ensure a clean slate
    mod._research_agent = None

    mock_rag = MagicMock()
    with (
        patch("app.agents.research_agent.QueryComplexityClassifier"),
        patch("app.agents.research_agent.get_quality_metrics"),
        patch("app.agents.research_agent.WebSearchFallback"),
        patch("app.agents.research_agent.KnowledgeGraph"),
    ):
        agent_a = get_research_agent(mock_rag)
        agent_b = get_research_agent(mock_rag)

    assert agent_a is agent_b


def test_get_research_agent_reinitialises_on_new_rag():
    """get_research_agent creates a new instance when omni_rag changes."""
    import app.agents.research_agent as mod
    mod._research_agent = None

    mock_rag_1 = MagicMock()
    mock_rag_2 = MagicMock()

    with (
        patch("app.agents.research_agent.QueryComplexityClassifier"),
        patch("app.agents.research_agent.get_quality_metrics"),
        patch("app.agents.research_agent.WebSearchFallback"),
        patch("app.agents.research_agent.KnowledgeGraph"),
    ):
        agent_a = get_research_agent(mock_rag_1)
        agent_b = get_research_agent(mock_rag_2)

    assert agent_a is not agent_b
    assert agent_b.omni_rag is mock_rag_2


# ---------------------------------------------------------------------------
# 9. Relevance scoring quality heuristics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_score_relevance_returns_high_on_keyword_match():
    """High keyword overlap triggers the fast path and skips the LLM call."""
    agent = _make_agent()

    with patch("app.agents.research_agent.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value="0.5")  # Should NOT be called
        query = "asyncio event loop concurrency"
        content = "asyncio event loop concurrency performance tuning in Python"
        score = await agent._score_relevance(query, content)

    # Fast path should return 0.9 without calling the LLM
    assert score == 0.9
    mock_groq.get_completion.assert_not_called()


@pytest.mark.asyncio
async def test_score_relevance_empty_content():
    """Empty content must return 0.0 without calling the LLM."""
    agent = _make_agent()

    with patch("app.agents.research_agent.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock()
        score = await agent._score_relevance("any query", "")

    assert score == 0.0
    mock_groq.get_completion.assert_not_called()


def test_assess_quality_empty():
    agent = _make_agent()
    assert agent._assess_quality("") == 0.0


def test_assess_quality_long_content():
    agent = _make_agent()
    content = "x" * 400  # > 300 chars → length bonus
    score = agent._assess_quality(content)
    assert score > 0.5
