import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.agents.coding_team.workflow import create_coding_team_graph, should_continue
from app.agents.coding_team.nodes import team_lead_node, coder_node, reviewer_node
from app.agents.coding_team.state import AgentState

@pytest.mark.asyncio
async def test_team_lead_node_without_file():
    state = {
        "messages": [],
        "task_description": "Create a file named hello.py that prints hello",
        "iteration_count": 0,
        "review_feedback": "",
        "current_file": None,
        "file_content": None,
        "diff": None,
        "plan": None,
        "status": "planning"
    }

    mock_response = '{"target_file": "hello.py", "instructions": "Print hello world"}'
    with patch("app.agents.coding_team.nodes.groq_client") as mock_groq, \
         patch("app.agents.coding_team.nodes.rag_search_code") as mock_rag_search:
        
        mock_rag_search.invoke.return_value = "No results found"
        mock_groq.get_completion = AsyncMock(return_value=mock_response)
        
        res = await team_lead_node(state)
        assert res["current_file"] == "hello.py"
        assert res["plan"] == "Print hello world"
        assert res["status"] == "coding"

@pytest.mark.asyncio
async def test_coder_node():
    state = {
        "messages": [],
        "task_description": "Create a file named hello.py that prints hello",
        "iteration_count": 0,
        "review_feedback": "",
        "current_file": "hello.py",
        "file_content": None,
        "diff": None,
        "plan": "Print hello world",
        "status": "coding"
    }

    mock_code = "```python\nprint('hello')\n```"
    with patch("app.agents.coding_team.nodes.groq_client") as mock_groq, \
         patch("app.agents.coding_team.nodes.read_file") as mock_read, \
         patch("app.agents.coding_team.nodes.write_file") as mock_write:
        
        mock_read.invoke.return_value = "Error reading file"
        mock_groq.get_completion = AsyncMock(return_value=mock_code)
        mock_write.invoke.return_value = "Successfully wrote"
        
        res = await coder_node(state)
        assert res["file_content"] == "print('hello')"
        assert res["status"] == "reviewing"
        mock_write.invoke.assert_called_once_with({"file_path": "hello.py", "content": "print('hello')"})

@pytest.mark.asyncio
async def test_reviewer_node_approved():
    state = {
        "messages": [],
        "task_description": "Create a file named hello.py that prints hello",
        "iteration_count": 0,
        "review_feedback": "",
        "current_file": "hello.py",
        "file_content": "print('hello')",
        "diff": None,
        "plan": "Print hello world",
        "status": "reviewing"
    }

    with patch("app.agents.coding_team.nodes.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value="APPROVED: The code is perfect.")
        
        res = await reviewer_node(state)
        assert res["status"] == "completed"
        assert res["review_feedback"] == "Looks good!"

@pytest.mark.asyncio
async def test_reviewer_node_rejected():
    state = {
        "messages": [],
        "task_description": "Create a file named hello.py that prints hello",
        "iteration_count": 0,
        "review_feedback": "",
        "current_file": "hello.py",
        "file_content": "print('hello')",
        "diff": None,
        "plan": "Print hello world",
        "status": "reviewing"
    }

    with patch("app.agents.coding_team.nodes.groq_client") as mock_groq:
        mock_groq.get_completion = AsyncMock(return_value="REJECTED: missing docstring")
        
        res = await reviewer_node(state)
        assert res["status"] == "planning"
        assert "REJECTED" in res["review_feedback"]
        assert res["iteration_count"] == 1

def test_should_continue():
    assert should_continue({"status": "completed"}) == "end"
    assert should_continue({"status": "planning"}) == "team_lead"

def test_create_coding_team_graph():
    graph = create_coding_team_graph()
    assert graph is not None
