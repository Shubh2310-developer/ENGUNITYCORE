import pytest
from app.services.code.scanner import scan_local_workspace
from app.services.ai.decision_ai import decision_ai_service, _local_memory_cache
from app.schemas.decision import DecisionBase

def test_ast_workspace_scanner():
    """Verify scanner handles real local files and compiles appropriate AST counts."""
    # Scan current backend directory
    res = scan_local_workspace("/home/agentrogue/projects/ENGUNITYCORE/backend")
    assert "files_scanned" in res
    assert "total_lines" in res
    assert "num_classes" in res
    assert "num_functions" in res
    assert "imports" in res
    assert isinstance(res["imports"], list)
    assert res["files_scanned"] > 0
    assert res["total_lines"] > 0

@pytest.mark.asyncio
async def test_decision_ai_caching():
    """Verify deterministic caching avoids redundant AI provider requests."""
    decision_payload = DecisionBase(
        title="Test Caching Decision",
        type="Code",
        status="tentative",
        problem_statement="Should we implement caching on decision objects?",
        context="Should we implement caching?",
        confidence="medium",
        options=[],
        evidence=[],
        constraints=[],
        tags=[]
    )
    
    # Pre-populate mock cache key to ensure immediate HIT without triggering live API
    import hashlib
    import json
    payload_bytes = json.dumps(decision_payload.model_dump(), sort_keys=True, default=str).encode('utf-8')
    cache_key = f"decision_ai_cache:{hashlib.sha256(payload_bytes).hexdigest()}"
    
    mock_flags = [
        {
            "id": "flag_test_001",
            "flag_type": "bias_detected",
            "severity": "info",
            "message": "Cached mock response for verification.",
            "suggested_action": "Proceed with testing.",
            "dismissed": False
        }
    ]
    _local_memory_cache[cache_key] = mock_flags
    
    # This should trigger Cache HIT and return our mock_flags
    flags = await decision_ai_service.analyze_decision(decision_payload)
    assert flags == mock_flags
