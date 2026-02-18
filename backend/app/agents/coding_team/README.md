# Coding Team Agent

This module implements a multi-agent coding team using LangGraph. It consists of three specialized agents working together to complete coding tasks.

## Architecture

The workflow follows a hierarchical structure:

1.  **Team Lead (Orchestrator)**
    *   **Role**: Plans the task, finds relevant files using RAG/Tools, and delegates work.
    *   **Tools**: `list_files`, `rag_search_code` (connected to OmniRAG).
    *   **Output**: Selects a target file and provides specific instructions.

2.  **Coder (Worker)**
    *   **Role**: Implements the requested changes.
    *   **Tools**: `read_file`, `write_file`.
    *   **Output**: Modifies the file and produces a diff.

3.  **Reviewer (Quality Control)**
    *   **Role**: Reviews the code for syntax, logic, and requirements.
    *   **Output**: "APPROVED" or "REJECTED" with feedback.
    *   **Flow**:
        *   If **APPROVED**: Workflow ends.
        *   If **REJECTED**: Workflow loops back to Team Lead/Coder with feedback.

## Usage

### Direct Graph Usage

```python
from app.agents.coding_team.workflow import create_coding_team_graph

# Initialize
graph = create_coding_team_graph()

# Run
initial_state = {
    "task_description": "Fix the login button color",
    "iteration_count": 0,
    "messages": []
}

async for event in graph.astream(initial_state):
    print(event)
```

### API Usage

The coding team is exposed via a REST API endpoint:

**POST** `/api/v1/coding-team/run`

```json
{
  "task": "Update the login button to be blue"
}
```

Response:
```json
{
  "status": "completed",
  "result": "Looks good!",
  "messages": [...],
  "file_content": "..."
}
```

## State Management

The `AgentState` tracks:
- `task_description`: The original user request.
- `current_file`: The file currently being modified.
- `file_content`: The content of the file.
- `review_feedback`: Feedback from the reviewer.
- `status`: Current workflow status.
- `messages`: Chat history.
- `iteration_count`: Tracks loops to prevent infinite cycles.

## Directory Structure

- `state.py`: TypedDict definition of the graph state.
- `nodes.py`: Implementation of the agent logic (Team Lead, Coder, Reviewer).
- `tools.py`: File system and search tools.
- `workflow.py`: LangGraph definitions (Nodes and Edges).
