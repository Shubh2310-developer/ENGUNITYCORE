import uuid
from typing import Dict, Any, List, Optional
import asyncio

class DebugSession:
    def __init__(self, session_id: str, code: str, language: str):
        self.session_id = session_id
        self.code = code
        self.language = language
        self.status = "initialized" # initialized, running, paused, stopped
        self.breakpoints: List[int] = []
        self.current_line = 0
        self.variables: Dict[str, Any] = {}
        self.call_stack: List[Dict[str, Any]] = []

class DebugAdapter:
    def __init__(self):
        self.sessions: Dict[str, DebugSession] = {}

    async def start_session(self, code: str, language: str) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = DebugSession(session_id, code, language)
        # In a real implementation, we would start a subprocess with a debugger (e.g. debugpy for python)
        # For Phase 2 MVP, we simulate the session state
        return session_id

    async def stop_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

    async def set_breakpoint(self, session_id: str, line: int, active: bool):
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        session = self.sessions[session_id]
        if active:
            if line not in session.breakpoints:
                session.breakpoints.append(line)
        else:
            if line in session.breakpoints:
                session.breakpoints.remove(line)

    async def continue_execution(self, session_id: str):
        if session_id not in self.sessions:
            raise ValueError("Session not found")
        session = self.sessions[session_id]
        session.status = "running"

        # Simulate moving to next breakpoint or end of file
        # This is placeholder logic for the MVP
        # In reality, this would communicate with the debug adapter via DAP
        lines = session.code.split('\n')
        total_lines = len(lines)

        start_line = session.current_line + 1
        found_breakpoint = False

        for i in range(start_line, total_lines + 1):
            if i in session.breakpoints:
                session.current_line = i
                session.status = "paused"
                found_breakpoint = True
                break

        if not found_breakpoint:
            session.current_line = total_lines
            session.status = "stopped"

    async def step_over(self, session_id: str):
        if session_id not in self.sessions:
            raise ValueError("Session not found")
        session = self.sessions[session_id]

        lines = session.code.split('\n')
        if session.current_line < len(lines):
            session.current_line += 1
            session.status = "paused"
        else:
            session.status = "stopped"

    async def get_variables(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        # Mock variables for MVP
        return {
            "locals": {
                "i": session.current_line,
                "result": session.current_line * 2,
                "status": session.status
            },
            "globals": {
                "__name__": "__main__"
            }
        }

    async def get_session_state(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            raise ValueError("Session not found")
        session = self.sessions[session_id]
        return {
            "session_id": session.session_id,
            "status": session.status,
            "current_line": session.current_line,
            "breakpoints": session.breakpoints
        }

debug_adapter = DebugAdapter()
