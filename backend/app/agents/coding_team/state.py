from typing import List, Optional, Dict, Any, TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[List[Dict[str, Any]], operator.add]
    current_file: Optional[str]
    file_content: Optional[str]
    diff: Optional[str]
    review_feedback: Optional[str]
    iteration_count: int
    status: str  # "planning", "coding", "reviewing", "completed", "failed"
    task_description: str
    plan: Optional[str]
