from fastapi import APIRouter, HTTPException, Body
from app.services.debug.adapter import debug_adapter
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class DebugStartRequest(BaseModel):
    code: str
    language: str

class BreakpointRequest(BaseModel):
    line: int
    active: bool

@router.post("/start")
async def start_debug_session(request: DebugStartRequest):
    try:
        session_id = await debug_adapter.start_session(request.code, request.language)
        return {"session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/stop")
async def stop_debug_session(session_id: str):
    await debug_adapter.stop_session(session_id)
    return {"status": "stopped"}

@router.post("/{session_id}/breakpoint")
async def set_breakpoint(session_id: str, bp: BreakpointRequest):
    try:
        await debug_adapter.set_breakpoint(session_id, bp.line, bp.active)
        return {"status": "ok", "breakpoints": (await debug_adapter.get_session_state(session_id))["breakpoints"]}
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")

@router.post("/{session_id}/continue")
async def continue_debug(session_id: str):
    try:
        await debug_adapter.continue_execution(session_id)
        return await debug_adapter.get_session_state(session_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")

@router.post("/{session_id}/step")
async def step_over(session_id: str):
    try:
        await debug_adapter.step_over(session_id)
        return await debug_adapter.get_session_state(session_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")

@router.get("/{session_id}/variables")
async def get_variables(session_id: str):
    try:
        variables = await debug_adapter.get_variables(session_id)
        return {"variables": variables}
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")
