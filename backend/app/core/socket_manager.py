import socketio
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Create a Socket.IO server with only the allowed origin
# We need to handle CORS at the Socket.IO level since it's mounted as a sub-app
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000'],
    cors_credentials=True,
    logger=True,
    engineio_logger=True
)
sio_app = socketio.ASGIApp(sio, socketio_path='socket.io')

class SocketManager:
    """
    Wrapper around Socket.IO server to manage connections and events.
    """
    def __init__(self, server: socketio.AsyncServer):
        self.server = server

    async def emit_to_user(self, sid: str, event: str, data: Any):
        """Emit event to a specific user/session"""
        await self.server.emit(event, data, to=sid)

    async def broadcast(self, event: str, data: Any):
        """Broadcast event to all connected clients"""
        await self.server.emit(event, data)

    async def emit_to_room(self, room: str, event: str, data: Any):
        """Emit event to a specific room (e.g., project/repo)"""
        await self.server.emit(event, data, room=room)

socket_manager = SocketManager(sio)

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_established', {'message': 'Connected to Engunity Socket Server'}, to=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_repo(sid, data):
    """Join a room for a specific repository"""
    repo_id = data.get("repo_id")
    if repo_id:
        await sio.enter_room(sid, repo_id)
        logger.info(f"Client {sid} joined room: {repo_id}")
        await sio.emit('room_joined', {'room': repo_id}, to=sid)

@sio.event
async def leave_repo(sid, data):
    """Leave a room for a specific repository"""
    repo_id = data.get("repo_id")
    if repo_id:
        await sio.leave_room(sid, repo_id)
        logger.info(f"Client {sid} left room: {repo_id}")

@sio.event
async def run_command(sid, data):
    """
    Handle 'run_command' event from frontend.
    Data format: {"command": "...", "projectId": "..."}
    """
    command = data.get("command")
    project_id = data.get("projectId")

    await sio.emit('terminal_output', {
        'type': 'info',
        'message': f"Received command: {command} for project {project_id}"
    }, to=sid)

    # Simulate execution steps
    await sio.emit('terminal_output', {'type': 'build', 'message': "Preparing environment..."}, to=sid)

    if "python" in command.lower():
        await sio.emit('terminal_output', {'type': 'success', 'message': "Executing Python script..."}, to=sid)
        await sio.emit('terminal_output', {'type': 'stdout', 'message': "Output: Hello from Engunity AI!"}, to=sid)
    elif "ls" in command.lower():
         await sio.emit('terminal_output', {'type': 'stdout', 'message': "src/  tests/  package.json  README.md"}, to=sid)
    else:
        await sio.emit('terminal_output', {'type': 'stderr', 'message': f"Executing: {command}"}, to=sid)

    await sio.emit('terminal_output', {'type': 'info', 'message': "Execution completed."}, to=sid)

@sio.event
async def analysis_update(sid, data):
    """Handle analysis updates"""
    # Just echo back for now or broadcast to room
    repo_id = data.get("repo_id")
    if repo_id:
        await sio.emit('analysis_status', data, room=repo_id)

