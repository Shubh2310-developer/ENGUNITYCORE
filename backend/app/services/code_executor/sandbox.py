import sys
import io
import contextlib
import traceback
import multiprocessing
from typing import Dict, Any, Callable, Optional
import time

class SecureSandbox:
    """
    A secure(ish) sandbox for executing AI-generated Python code.
    Maintains state between executions (REPL behavior).
    """
    def __init__(self, context: Optional[str] = None, max_execution_time: int = 5):
        self.locals: Dict[str, Any] = {}
        if context is not None:
            self.locals['context'] = context

        self.max_execution_time = max_execution_time

        # Whitelist safe builtins
        self.safe_builtins = {
            'print': print,
            'len': len,
            'range': range,
            'enumerate': enumerate,
            'str': str,
            'int': int,
            'float': float,
            'list': list,
            'dict': dict,
            'set': set,
            'tuple': tuple,
            'bool': bool,
            'sum': sum,
            'min': min,
            'max': max,
            'abs': abs,
            'round': round,
            'sorted': sorted,
            'reversed': reversed,
            'zip': zip,
            'map': map,
            'filter': filter,
            'any': any,
            'all': all,
            'isinstance': isinstance,
            'type': type,
            'hasattr': hasattr,
            'getattr': getattr,
            'setattr': setattr,
            # Import is tricky, we might want to restrict it or pre-import standard libs
        }

        # Pre-import common safe libraries
        import re
        import json
        import math
        import random
        import datetime

        self.locals['re'] = re
        self.locals['json'] = json
        self.locals['math'] = math
        self.locals['random'] = random
        self.locals['datetime'] = datetime

        # In a real sandbox, we would remove __builtins__ completely or use RestrictedPython
        # For this prototype, we'll shadow the dangerous ones
        self.locals['__builtins__'] = self.safe_builtins

    def register_tool(self, name: str, func: Callable):
        """Register a function that the code can call (e.g., llm_query)"""
        self.locals[name] = func

    def execute(self, code: str) -> str:
        """
        Execute code in the sandbox and return stdout/stderr.
        Captures output and handles exceptions.
        """
        output_buffer = io.StringIO()

        try:
            # We use contextlib to capture stdout
            with contextlib.redirect_stdout(output_buffer):
                with contextlib.redirect_stderr(output_buffer):
                    # Executing in self.locals allows state persistence
                    exec(code, self.locals, self.locals)

            result = output_buffer.getvalue()
            if not result.strip():
                result = "[Code executed successfully with no output]"
            return result

        except Exception:
            # Return the traceback so the AI can fix its code
            return output_buffer.getvalue() + "\n" + traceback.format_exc()

    def get_variable(self, name: str) -> Any:
        """Retrieve a variable from the sandbox state"""
        return self.locals.get(name)
