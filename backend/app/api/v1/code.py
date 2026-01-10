from typing import Any
from fastapi import APIRouter, Depends
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_code_projects(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve code projects for the current user.
    """
    return {"message": f"Hello {current_user.email}, these are your code projects.", "projects": []}
