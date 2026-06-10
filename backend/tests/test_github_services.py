import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.github.analyzer import GitHubAnalyzer

@pytest.mark.asyncio
async def test_github_analyzer(monkeypatch):
    # Mock github_client methods
    mock_github = MagicMock()
    mock_github.get_repository_info.return_value = {
        "stars": 150,
        "description": "A cool test repository",
        "license": "MIT"
    }
    mock_github.get_file_tree.return_value = [
        {"name": "main.py", "type": "file"},
        {"name": "README.md", "type": "file"},
        {"name": "utils.py", "type": "file"}
    ]
    mock_github.get_file_content.return_value = "import sys\npassword = '123'\neval('foo')"

    monkeypatch.setattr("app.services.github.analyzer.github_client", mock_github)

    # Mock groq_client
    mock_groq = AsyncMock()
    mock_groq.get_completion.return_value = """
{
  "summary": "This is a dummy test repo",
  "modules": [
    {"name": "main.py", "description": "Entry point"}
  ],
  "architecture": "MVC",
  "quality_notes": "Good clean code"
}
"""
    monkeypatch.setattr("app.services.github.analyzer.groq_client", mock_groq)

    import json
    monkeypatch.setattr("app.services.github.analyzer.json", json, raising=False)

    # Instantiate and run analyzer
    analyzer = GitHubAnalyzer()
    res = await analyzer.analyze_repository("test_owner", "test_repo")

    # Assert outcomes
    assert res["status"] == "completed"
    assert res["quality_score"] in ["A+", "A", "B+", "B", "C"]
    assert res["security_score"] < 100 # because of hardcoded password and eval
    assert res["vulnerabilities"] == 2 # eval in both priority files
    assert res["code_intelligence"]["architecture"] == "MVC"
