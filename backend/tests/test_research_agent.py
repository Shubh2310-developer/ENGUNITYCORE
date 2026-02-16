import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.agents.research_agent import DeepResearchAgent
from app.schemas.research_agent import ResearchRequest, ResearchDepth, SubQuery

@pytest.mark.asyncio
async def test_decompose_query():
    """Test query decomposition into sub-questions"""
    mock_rag = MagicMock()
    
    # Patch dependencies to avoid side effects during init
    with patch('app.agents.research_agent.QueryComplexityClassifier'), \
         patch('app.agents.research_agent.get_quality_metrics'), \
         patch('app.agents.research_agent.WebSearchFallback'), \
         patch('app.agents.research_agent.KnowledgeGraph'):
        
        agent = DeepResearchAgent(mock_rag)
    
        # Mock groq_client response
    with patch('app.agents.research_agent.groq_client') as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value='[{"question": "Sub Q1", "query_type": "factual", "priority": 1}]')
        
        sub_queries = await agent._decompose_query(
            "Compare React and Vue",
            max_sub_queries=3
        )
        
        assert len(sub_queries) == 1
        assert sub_queries[0].question == "Sub Q1"

@pytest.mark.asyncio
async def test_evaluate_sources():
    """Test source evaluation scoring"""
    mock_rag = MagicMock()
    
    with patch('app.agents.research_agent.QueryComplexityClassifier'), \
         patch('app.agents.research_agent.get_quality_metrics'), \
         patch('app.agents.research_agent.WebSearchFallback'), \
         patch('app.agents.research_agent.KnowledgeGraph'):
        agent = DeepResearchAgent(mock_rag)
    
    sources = [
        {"content": "React is a JavaScript library...", "source": "docs", "type": "rag_document"},
        {"content": "", "source": "empty", "type": "rag_document"}
    ]
    
    # Mock internal scoring methods to avoid LLM calls
    agent._score_relevance = AsyncMock(side_effect=[0.9, 0.1])
    
    evaluated = await agent._evaluate_sources("React overview", sources)
    assert len(evaluated) == 2
    assert evaluated[0].relevance_score == 0.9
    assert evaluated[1].relevance_score == 0.1

@pytest.mark.asyncio
async def test_full_research_flow_mocked():
    """Integration test for the full research pipeline with mocks"""
    mock_rag = MagicMock()
    # Mock process_query to return some docs
    mock_rag.process_query = AsyncMock(return_value={
        "documents": [{"content": "React info", "metadata": {"filename": "react.md"}}],
        "response": "React is good"
    })
    
    with patch('app.agents.research_agent.QueryComplexityClassifier'), \
         patch('app.agents.research_agent.get_quality_metrics'), \
         patch('app.agents.research_agent.WebSearchFallback'), \
         patch('app.agents.research_agent.KnowledgeGraph'):
        agent = DeepResearchAgent(mock_rag)
    
    # Mock LLM calls to avoid network
    with patch('app.agents.research_agent.groq_client') as mock_groq:
        # Mock decomposition
        mock_groq.get_completion = AsyncMock(side_effect=[
            '[{"question": "What is React?", "query_type": "factual", "priority": 1}]', # Decompose
            '["Gap 1"]', # Identify gaps
            '["Refined Q"]', # Refinement queries (not used in this flow if gaps filled, but just in case)
            'Research Report Content', # Synthesize
            '["Key Finding 1"]', # Extract insights
            '["Follow up?"]', # Extract followups
            '["Related Topic"]' # Extract related
        ])
        
        # Mock gap detection to return empty list to stop iteration early
        agent._identify_gaps = AsyncMock(return_value=[])
        
        request = ResearchRequest(
            query="What is React?",
            depth=ResearchDepth.QUICK,
            max_iterations=1,
            include_web_search=False,
            include_graph_search=False
        )
        
        report = await agent.research(request, user_id="test_user")
        
        assert report.status == "completed"
        assert len(report.sources) >= 0
