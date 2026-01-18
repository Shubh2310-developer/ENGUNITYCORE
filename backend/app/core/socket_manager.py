import socketio
from typing import Optional

# Create a Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

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
