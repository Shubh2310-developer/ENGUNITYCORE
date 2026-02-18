from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.agents.coding_team.workflow import create_coding_team_graph
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter()

class CodingTaskRequest(BaseModel):
    task: str

class CodingTaskResponse(BaseModel):
    status: str
    result: Optional[str] = None
    messages: List[Dict[str, Any]] = []
    file_content: Optional[str] = None
    file_path: Optional[str] = None

@router.post("/run", response_model=CodingTaskResponse)
async def run_coding_team(
    request: CodingTaskRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Trigger the Coding Team agents to execute a task.
    """
    try:
        # Initialize the graph
        graph = create_coding_team_graph()

        # Initial state
        initial_state = {
            "task_description": request.task,
            "messages": [],
            "iteration_count": 0,
            "status": "planning"
        }

        # Run the graph
        # invoke returns the final state
        final_state = await graph.ainvoke(initial_state)

        return {
            "status": final_state.get("status", "unknown"),
            "result": final_state.get("review_feedback", "No feedback"),
            "messages": final_state.get("messages", []),
            "file_content": final_state.get("file_content"),
            "file_path": final_state.get("current_file")
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Coding team execution failed: {str(e)}")
