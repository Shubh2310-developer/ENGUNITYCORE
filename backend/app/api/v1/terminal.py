from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from app.api.v1.auth import get_current_user
from app.models.user import User
import asyncio
import pty
import os
import struct
import fcntl
import termios
import signal
import logging
from typing import Dict

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class TerminalSession:
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.master = None
        self.slave = None
        self.process = None

    async def start(self):
        """Start terminal session"""
        # Create pseudo-terminal
        self.master, self.slave = pty.openpty()

        # Set terminal size (default 24 rows, 80 cols)
        size = struct.pack('HHHH', 24, 80, 0, 0)
        fcntl.ioctl(self.slave, termios.TIOCSWINSZ, size)

        # Start shell
        # Use a login shell to load profile
        shell = os.environ.get('SHELL', '/bin/bash')

        try:
            self.process = await asyncio.create_subprocess_exec(
                shell,
                stdin=self.slave,
                stdout=self.slave,
                stderr=self.slave,
                preexec_fn=os.setsid  # Create new session group
            )

            logger.info(f"Started terminal session {self.session_id} with PID {self.process.pid}")

            # Start read/write tasks
            await asyncio.gather(
                self._read_output(),
                self._read_input()
            )
        except Exception as e:
            logger.error(f"Failed to start terminal process: {e}")
            raise

    async def _read_output(self):
        """Read terminal output and send to client"""
        loop = asyncio.get_event_loop()

        while True:
            try:
                # Read from master PTY
                # We use run_in_executor because os.read is blocking
                data = await loop.run_in_executor(None, os.read, self.master, 4096)

                if data:
                    try:
                        # Send text data
                        await self.websocket.send_text(data.decode('utf-8', errors='replace'))
                    except Exception as e:
                        logger.error(f"WebSocket send error: {e}")
                        break
                else:
                    logger.info(f"Terminal session {self.session_id} output closed")
                    break

            except OSError as e:
                if e.errno == 5: # Input/output error, happens when PTY closes
                    break
                logger.error(f"PTY read error: {e}")
                break
            except Exception as e:
                logger.error(f"Output loop error: {e}")
                break

    async def _read_input(self):
        """Read from client and send to terminal"""
        try:
            while True:
                data = await self.websocket.receive_text()

                # Check for resize command or other control messages if we implement them
                # For now, treat all text as input to the shell
                if data.startswith('__resize__:'):
                    try:
                        _, rows, cols = data.split(':')
                        await self.resize(int(rows), int(cols))
                    except ValueError:
                        pass
                    continue

                if self.master:
                    os.write(self.master, data.encode())

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {self.session_id}")
        except Exception as e:
            logger.error(f"Input loop error: {e}")

    async def resize(self, rows: int, cols: int):
        """Resize terminal"""
        if self.master:
            try:
                size = struct.pack('HHHH', rows, cols, 0, 0)
                fcntl.ioctl(self.master, termios.TIOCSWINSZ, size)
                logger.debug(f"Resized terminal {self.session_id} to {rows}x{cols}")
            except Exception as e:
                logger.error(f"Resize error: {e}")

    async def cleanup(self):
        """Cleanup terminal session"""
        logger.info(f"Cleaning up terminal session {self.session_id}")

        if self.process:
            try:
                # Kill the process group
                if self.process.pid:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
                    # Give it a moment to terminate gracefully
                    try:
                        await asyncio.wait_for(self.process.wait(), timeout=1.0)
                    except asyncio.TimeoutError:
                        os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
            except Exception as e:
                logger.error(f"Process cleanup error: {e}")

        if self.master:
            try:
                os.close(self.master)
            except:
                pass
        if self.slave:
            try:
                os.close(self.slave)
            except:
                pass

# Store active sessions
active_sessions: Dict[str, TerminalSession] = {}

@router.websocket("/{project_id}")
async def terminal_endpoint(
    websocket: WebSocket,
    project_id: str,
    # Note: WebSocket endpoints cannot use Header dependencies directly in the same way as HTTP
    # Usually we pass token via query param or handle auth inside the websocket handler
    # For now, we'll verify the user inside the connection flow if token is sent
):
    await websocket.accept()

    # In a real app, you would validate the token sent in the initial message or query param
    # For now, we proceed assuming the connection is authorized for this MVP phase
    # You might want to extract the token from query params: websocket.query_params.get("token")

    session_id = f"{project_id}_{id(websocket)}"
    session = TerminalSession(websocket, session_id)
    active_sessions[session_id] = session

    try:
        await session.start()
    except Exception as e:
        logger.error(f"Terminal error: {e}")
        try:
            await websocket.send_text(f"\r\nError starting terminal: {str(e)}\r\n")
            await websocket.close()
        except:
            pass
    finally:
        await session.cleanup()
        if session_id in active_sessions:
            del active_sessions[session_id]
