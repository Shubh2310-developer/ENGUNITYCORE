import pytest
from unittest.mock import patch, MagicMock
import os
import shutil
import time

@pytest.mark.asyncio
async def test_execute_code_direct(client):
    """
    Test the direct code execution flow.
    Endpoint: POST /api/v1/code/execute-direct
    """
    payload = {
        "code": "print('Hello from Engunity!')",
        "language": "python",
        "filename": "test_script.py"
    }
    response = client.post("/api/v1/code/execute-direct", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "stdout" in data
    assert "Hello from Engunity!" in data["stdout"]
    assert data["success"] is True

@pytest.mark.asyncio
async def test_execute_code_with_stdin(client):
    """
    Test code execution with stdin input.
    """
    payload = {
        "code": "name = input(); print(f'Hello {name}')",
        "language": "python",
        "stdin_data": "Claude"
    }
    response = client.post("/api/v1/code/execute-direct", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "Hello Claude" in data["stdout"]

@pytest.mark.asyncio
async def test_ai_assist_flow(client):
    """
    Test the AI Assist flow by mocking Groq client.
    Endpoint: POST /api/v1/code/ai-assist
    """
    mock_response = "### Optimized Code\n```python\nprint('optimized')\n```"

    # Mocking the get_completion method of the singleton groq_client used in the router
    with patch("app.services.ai.groq_client.groq_client.get_completion", return_value=mock_response):
        payload = {
            "code": "print('slow code')",
            "language": "python",
            "action": "optimize",
            "filename": "slow.py"
        }
        response = client.post("/api/v1/code/ai-assist", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "optimize"
        assert "response" in data
        assert "improved_code" in data
        assert data["improved_code"] == "print('optimized')"
        assert data["language"] == "python"

@pytest.mark.asyncio
async def test_git_flow(client):
    """
    Test the Git flow: Initialize a repo and check status.
    Bypasses cache with unique query parameters.
    """
    # Use a unique project ID to avoid collisions
    project_id = f"test_proj_{os.urandom(4).hex()}"
    # The GitService uses /tmp/engunity_projects/{project_id} based on repository.py
    base_path = f"/tmp/engunity_projects/{project_id}"

    try:
        # 1. Initialize the repository
        init_response = client.post(f"/api/v1/git/{project_id}/init")
        assert init_response.status_code == 200
        assert init_response.json()["status"] == "initialized"

        # Verify .git directory exists
        assert os.path.exists(os.path.join(base_path, ".git"))

        # 2. Create an untracked file
        untracked_file = "new_file.txt"
        with open(os.path.join(base_path, untracked_file), "w") as f:
            f.write("Some content")

        # 3. Check status - use unique query param to bypass cache
        status_response = client.get(f"/api/v1/git/{project_id}/status?t=1")
        assert status_response.status_code == 200
        status_data = status_response.json()

        assert status_data["is_dirty"] is True
        assert untracked_file in status_data["untracked_files"]

        # 4. Commit the file
        commit_payload = {
            "message": "Initial commit",
            "files": [untracked_file]
        }
        commit_response = client.post(f"/api/v1/git/{project_id}/commit", json=commit_payload)
        assert commit_response.status_code == 200
        assert commit_response.json()["status"] == "committed"

        # 5. Check status again - use another unique query param to bypass cache
        status_response_2 = client.get(f"/api/v1/git/{project_id}/status?t=2")
        status_data_2 = status_response_2.json()
        assert untracked_file not in status_data_2["untracked_files"]

    finally:
        # Cleanup temporary repository
        if os.path.exists(base_path):
            shutil.rmtree(base_path)

@pytest.mark.asyncio
async def test_git_log_flow(client):
    """
    Test the Git log flow.
    Endpoint: GET /api/v1/git/{project_id}/log
    """
    project_id = f"log_proj_{os.urandom(4).hex()}"
    base_path = f"/tmp/engunity_projects/{project_id}"

    try:
        # Initialize
        client.post(f"/api/v1/git/{project_id}/init")

        # Create and commit a file
        file_name = "history.txt"
        with open(os.path.join(base_path, file_name), "w") as f:
            f.write("v1")

        client.post(f"/api/v1/git/{project_id}/commit", json={
            "message": "First commit",
            "files": [file_name]
        })

        # Get log
        response = client.get(f"/api/v1/git/{project_id}/log")
        assert response.status_code == 200
        log_data = response.json()

        assert len(log_data) >= 1
        assert log_data[0]["message"] == "First commit"
        assert "hexsha" in log_data[0]

    finally:
        if os.path.exists(base_path):
            shutil.rmtree(base_path)

@pytest.mark.asyncio
async def test_debug_flow_start_stop(client):
    """
    Test the Debug flow: Start and Stop a session.
    Endpoints: POST /api/v1/debug/start, POST /api/v1/debug/{session_id}/stop
    """
    payload = {
        "project_id": "test_debug",
        "file_id": "main.py",
        "code": "import time\ntime.sleep(1)\nprint('debug')",
        "language": "python"
    }

    # Start session
    response = client.post("/api/v1/debug/start", json=payload)
    assert response.status_code == 200, f"Start failed: {response.text}"
    data = response.json()
    assert "id" in data
    session_id = data["id"]

    # Brief wait to ensure the session is active
    time.sleep(0.2)

    # Stop session
    stop_response = client.post(f"/api/v1/debug/{session_id}/stop")
    assert stop_response.status_code == 200, f"Stop failed: {stop_response.text}"
    assert stop_response.json()["status"] == "stopped"

@pytest.mark.asyncio
async def test_debug_advanced_flow(client):
    """
    Test advanced debugging: breakpoints and variables.
    Endpoints: /{session_id}/breakpoint, /{session_id}/variables
    """
    payload = {
        "project_id": "advanced_debug",
        "file_id": "main.py",
        "code": "a = 10\nb = 20\nc = a + b\nprint(c)",
        "language": "python"
    }

    # 1. Start session
    start_resp = client.post("/api/v1/debug/start", json=payload)
    session_id = start_resp.json()["id"]

    # 2. Set breakpoint
    bp_payload = {
        "file_id": "main.py",
        "line": 3
    }
    bp_resp = client.post(f"/api/v1/debug/{session_id}/breakpoint", json=bp_payload)
    assert bp_resp.status_code == 200
    assert bp_resp.json()["line"] == 3

    # 3. Get variables
    var_resp = client.post(f"/api/v1/debug/{session_id}/variables")
    assert var_resp.status_code == 200
    assert "variables" in var_resp.json()

    # Cleanup
    client.post(f"/api/v1/debug/{session_id}/stop")

@pytest.mark.asyncio
async def test_authenticated_code_execution_journey(client):
    """
    Test a full authenticated journey:
    1. Register/Login
    2. Create Project
    3. Create File
    4. Execute Code
    """
    # 1. Register and Login
    email = f"dev_{os.urandom(4).hex()}@engunity.com"
    password = "SecurePassword123!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "role": "user"
    })

    login_resp = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": password
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Project
    project_payload = {
        "name": "Integration Test Project",
        "description": "Testing full flow",
        "language": "python"
    }
    proj_resp = client.post("/api/v1/code/", json=project_payload, headers=headers)
    assert proj_resp.status_code == 200
    project_id = proj_resp.json()["id"]

    # 3. Create File
    file_payload = {
        "path": "main.py",
        "name": "main.py",
        "type": "file",
        "content": "print('Authenticated execution success')",
        "language": "python"
    }
    file_resp = client.post(f"/api/v1/code/{project_id}/files", json=file_payload, headers=headers)
    assert file_resp.status_code == 200
    file_id = file_resp.json()["id"]

    # 4. Execute Code
    exec_resp = client.post(
        f"/api/v1/code/{project_id}/execute?file_id={file_id}",
        headers=headers
    )

    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert "Authenticated execution success" in exec_data["stdout"]
    assert exec_data["success"] is True

def test_terminal_websocket_flow(client):
    """
    Test the Terminal WebSocket flow.
    Endpoint: /ws/terminal/{project_id}
    """
    project_id = "test_terminal_proj"

    # TestClient supports websocket_connect
    with client.websocket_connect(f"/ws/terminal/{project_id}") as websocket:
        # The terminal service starts a shell and sends initial output (prompt)
        # We'll send a simple command. \r simulates hitting enter.
        websocket.send_text("echo 'Terminal Integration Test'\r")

        # We expect to see our echo output eventually
        found = False
        # We give it a few chunks of output to find our message
        for _ in range(15):
            try:
                data = websocket.receive_text()
                if "Terminal Integration Test" in data:
                    found = True
                    break
            except:
                break

        assert found is True

@pytest.mark.asyncio
async def test_code_search_flow(client):
    """
    Test semantic code search by mocking the vector store.
    Endpoint: POST /api/v1/code/{project_id}/search
    """
    # 1. Register/Login to get auth
    email = f"search_{os.urandom(4).hex()}@test.com"
    strong_password = "SecurePassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": strong_password, "role": "user"})
    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": strong_password})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Project
    proj_resp = client.post("/api/v1/code/", json={"name": "Search Project"}, headers=headers)
    project_id = proj_resp.json()["id"]

    # 3. Mock vector store
    mock_doc = MagicMock()
    mock_doc.page_content = "def hello_world(): print('hi')"
    mock_doc.metadata = {"filename": "hello.py"}
    mock_doc.score = 0.95

    mock_vs = MagicMock()
    mock_vs.similarity_search.return_value = [mock_doc]

    with patch("app.api.v1.code.get_vector_store", return_value=mock_vs):
        response = client.post(
            f"/api/v1/code/{project_id}/search?query=hello",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "hello"
        assert len(data["results"]) == 1
        assert data["results"][0]["content"] == "def hello_world(): print('hi')"
@pytest.mark.asyncio
async def test_code_dashboard_file_persistence(client):
    """
    Test the lifecycle of a code file (create, update, fetch).
    Ensures that file saving persistence is fully operational on the backend.
    """
    # 1. Register and login
    email = f"persist_{os.urandom(4).hex()}@engunity.com"
    password = "SecurePassword123!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "role": "user"
    })

    login_resp = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": password
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a project
    project_payload = {
        "name": "Persistence Test Project",
        "description": "A project for testing file persistence."
    }
    project_resp = client.post("/api/v1/code/", json=project_payload, headers=headers)
    assert project_resp.status_code == 200
    project_data = project_resp.json()
    project_id = project_data["id"]

    # 3. Create a file
    file_payload = {
        "name": "test_persistence.py",
        "path": "src/test_persistence.py",
        "type": "file",
        "content": "print('initial')",
        "language": "python"
    }
    file_resp = client.post(f"/api/v1/code/{project_id}/files", json=file_payload, headers=headers)
    assert file_resp.status_code == 200
    file_data = file_resp.json()
    file_id = file_data["id"]

    # 4. Update the file (simulate Ctrl+S save)
    update_payload = {
        "content": "print('updated and persisted')"
    }
    update_resp = client.patch(f"/api/v1/code/{project_id}/files/{file_id}", json=update_payload, headers=headers)
    assert update_resp.status_code == 200

    # 5. Fetch the file to ensure the data was actually saved to the backend database
    fetch_resp = client.get(f"/api/v1/code/{project_id}/files/{file_id}", headers=headers)
    assert fetch_resp.status_code == 200
    fetch_data = fetch_resp.json()

    assert fetch_data["content"] == "print('updated and persisted')"


@pytest.mark.asyncio
async def test_code_dashboard_file_hierarchy_persistence(client):
    """
    Verify folder/file hierarchy persistence via parentId in code_files.
    """
    email = f"hier_{os.urandom(4).hex()}@engunity.com"
    password = "SecurePassword123!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "role": "user"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": password
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    project_resp = client.post("/api/v1/code/", json={"name": "Hierarchy Project"}, headers=headers)
    assert project_resp.status_code == 200
    project_id = project_resp.json()["id"]

    folder_resp = client.post(
        f"/api/v1/code/{project_id}/files",
        json={
            "path": "src",
            "name": "src",
            "type": "folder",
            "content": "",
            "language": "plaintext"
        },
        headers=headers,
    )
    assert folder_resp.status_code == 200
    folder_id = folder_resp.json()["id"]

    child_resp = client.post(
        f"/api/v1/code/{project_id}/files",
        json={
            "path": "src/main.py",
            "name": "main.py",
            "type": "file",
            "content": "print('nested')",
            "language": "python",
            "parentId": folder_id,
        },
        headers=headers,
    )
    assert child_resp.status_code == 200
    child_id = child_resp.json()["id"]

    files_resp = client.get(f"/api/v1/code/{project_id}/files", headers=headers)
    assert files_resp.status_code == 200
    files = files_resp.json()
    child = next(f for f in files if f["id"] == child_id)
    assert child["parentId"] == folder_id


def test_terminal_websocket_repeated_interactions(client):
    """
    Verify websocket stability under repeated command/resize interactions.
    """
    project_id = f"test_terminal_repeat_{os.urandom(4).hex()}"
    with client.websocket_connect(f"/ws/terminal/{project_id}") as websocket:
        commands = ["echo 'Run-1'\r", "echo 'Run-2'\r", "echo 'Debug-3'\r"]
        for cmd in commands:
            websocket.send_text(cmd)

        websocket.send_text("__resize__:30:100")
        websocket.send_text("__resize__:24:80")

        received = ""
        for _ in range(40):
            try:
                chunk = websocket.receive_text()
                received += chunk
                if "Run-1" in received and "Run-2" in received and "Debug-3" in received:
                    break
            except Exception:
                break

        assert "Run-1" in received
        assert "Run-2" in received
        assert "Debug-3" in received
