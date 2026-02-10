from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.debug.adapter import debug_adapter, DebugSession

router = APIRouter()

class StartDebugRequest(BaseModel):
    project_id: str = "default"
    file_id: str = "temp"
    code: str
    language: str = "python"

class BreakpointRequest(BaseModel):
    file_id: str
    line: int
    condition: Optional[str] = None

@router.post("/start", response_model=DebugSession)
async def start_debug_session(request: StartDebugRequest):
    """Start a new debugging session"""
    try:
        session = await debug_adapter.start_session(request.project_id, request.file_id)
        # Immediately start running the code
        if request.language == "python":
            await debug_adapter.run_code(session.id, request.code)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/stop")
async def stop_debug_session(session_id: str):
    """Stop a debugging session"""
    try:
        await debug_adapter.stop_session(session_id)
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/breakpoint")
async def set_breakpoint(session_id: str, request: BreakpointRequest):
    """Set a breakpoint"""
    try:
        bp = await debug_adapter.set_breakpoint(
            session_id,
            request.file_id,
            request.line,
            request.condition
        )
        return bp
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/continue")
async def continue_execution(session_id: str):
    """Continue execution"""
    try:
        session = await debug_adapter.continue_execution(session_id)
        return session
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/step")
async def step_over(session_id: str):
    """Step over"""
    try:
        session = await debug_adapter.step_over(session_id)
        return session
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/variables")
async def get_variables(session_id: str):
    """Get current variables"""
    try:
        variables = await debug_adapter.get_variables(session_id)
        return {"variables": variables}
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
