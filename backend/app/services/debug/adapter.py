import asyncio
import uuid
import sys
import bdb
import io
import threading
import queue
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

class Breakpoint(BaseModel):
    id: str
    file_id: str
    line: int
    condition: Optional[str] = None
    enabled: bool = True

class StackFrame(BaseModel):
    id: str
    name: str
    file_id: str
    line: int
    column: int

class DebugSession(BaseModel):
    id: str
    project_id: str
    file_id: str
    status: str = "stopped"  # stopped, running, paused
    breakpoints: List[Breakpoint] = []
    current_frame: Optional[StackFrame] = None
    variables: Dict[str, Any] = {}
    call_stack: List[StackFrame] = []
    output: str = ""

class PythonDebugger(bdb.Bdb):
    def __init__(self, session_id: str, adapter: 'DebugAdapter'):
        super().__init__()
        self.session_id = session_id
        self.adapter = adapter
        self.ready_to_resume = threading.Event()
        self.output_buffer = io.StringIO()
        self.globals = {}
        self.locals = {}

    def user_line(self, frame):
        # Update session state with current frame
        session = self.adapter.sessions.get(self.session_id)
        if not session:
            self.set_quit()
            return

        # Check breakpoints
        filename = frame.f_code.co_filename
        lineno = frame.f_lineno

        # In a real implementation we would map the temp filename back to file_id
        # For now, we just pause on every line if stepping, or if breakpoint hit

        # Update variables
        self.locals = frame.f_locals
        self.globals = frame.f_globals

        # Convert variables to JSON-serializable format
        safe_locals = {}
        for k, v in self.locals.items():
            try:
                safe_locals[k] = str(v)
            except:
                safe_locals[k] = "<unserializable>"

        session.variables = {
            "locals": safe_locals,
            "globals": {k: str(v) for k, v in self.globals.items() if not k.startswith('__')}
        }

        session.current_frame = StackFrame(
            id=str(uuid.uuid4()),
            name=frame.f_code.co_name,
            file_id=session.file_id,
            line=lineno,
            column=1
        )

        session.status = "paused"

        # Wait for resume signal
        self.ready_to_resume.wait()
        self.ready_to_resume.clear()

        session.status = "running"

    def user_return(self, frame, return_value):
        pass

    def user_exception(self, frame, exc_info):
        pass

class DebugAdapter:
    """
    Debug Adapter Protocol implementation using Bdb for Python.
    """

    def __init__(self):
        self.sessions: Dict[str, DebugSession] = {}
        self.debuggers: Dict[str, PythonDebugger] = {}
        self.threads: Dict[str, threading.Thread] = {}

    async def start_session(self, project_id: str, file_id: str) -> DebugSession:
        """Start a new debug session"""
        session_id = str(uuid.uuid4())
        session = DebugSession(
            id=session_id,
            project_id=project_id,
            file_id=file_id,
            status="running"
        )
        self.sessions[session_id] = session

        # In a real app, we would fetch code content from DB
        # For this demo, we'll assume the code is passed or we'd fetch it here
        # Since we don't have DB access easily injected here without circular imports,
        # we will rely on a separate "exec" method or just mock the code for now.
        # But to make it "Real", we need the code.

        # For now, we'll initialize the session but wait for 'run' with code
        return session

    async def run_code(self, session_id: str, code: str):
        """Execute code with debugger"""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        debugger = PythonDebugger(session_id, self)
        self.debuggers[session_id] = debugger

        def run_target():
            try:
                debugger.run(code)
            except Exception as e:
                print(f"Debug execution error: {e}")
            finally:
                if session_id in self.sessions:
                    self.sessions[session_id].status = "stopped"

        thread = threading.Thread(target=run_target)
        self.threads[session_id] = thread
        thread.start()

    async def stop_session(self, session_id: str):
        """Stop a debug session"""
        if session_id in self.sessions:
            self.sessions[session_id].status = "stopped"
            if session_id in self.debuggers:
                self.debuggers[session_id].set_quit()
                self.debuggers[session_id].ready_to_resume.set()

    async def set_breakpoint(self, session_id: str, file_id: str, line: int, condition: Optional[str] = None) -> Breakpoint:
        """Set a breakpoint"""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        bp = Breakpoint(
            id=str(uuid.uuid4()),
            file_id=file_id,
            line=line,
            condition=condition
        )
        self.sessions[session_id].breakpoints.append(bp)

        # Update actual debugger
        if session_id in self.debuggers:
            # Bdb breakpoints are per filename, here we are using exec string
            # This is complex to map correctly without writing to file
            # For this simple implementation, we might just break on line numbers
            self.debuggers[session_id].set_break('<string>', line)

        return bp

    async def continue_execution(self, session_id: str):
        """Continue execution"""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        if session_id in self.debuggers:
            self.debuggers[session_id].set_continue()
            self.debuggers[session_id].ready_to_resume.set()

        return self.sessions[session_id]

    async def step_over(self, session_id: str):
        """Step over"""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        if session_id in self.debuggers:
            self.debuggers[session_id].set_next(self.debuggers[session_id].botframe)
            self.debuggers[session_id].ready_to_resume.set()

        return self.sessions[session_id]

    async def get_variables(self, session_id: str) -> Dict[str, Any]:
        """Get variables"""
        if session_id not in self.sessions:
            raise ValueError("Session not found")

        return self.sessions[session_id].variables

# Singleton instance
debug_adapter = DebugAdapter()
