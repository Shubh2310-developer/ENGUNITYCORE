from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.services.git.repository import git_service
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter()

class CommitRequest(BaseModel):
    message: str
    files: Optional[List[str]] = None

class BranchRequest(BaseModel):
    name: str

@router.post("/{project_id}/init")
async def init_repo(project_id: str, current_user: User = Depends(get_current_user)):
    try:
        return git_service.init_repo(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/status")
async def get_status(project_id: str, current_user: User = Depends(get_current_user)):
    result = git_service.get_status(project_id)
    if "error" in result:
        # If repo doesn't exist, we might want to return a specific code or just the error
        if result["error"] == "Repository not found":
             raise HTTPException(status_code=404, detail="Repository not found")
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/{project_id}/commit")
async def commit_changes(
    project_id: str,
    request: CommitRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Use user's name and email from auth token/user record
        author_name = current_user.full_name or current_user.email.split('@')[0]
        author_email = current_user.email

        return git_service.commit(
            project_id,
            request.message,
            author_name,
            author_email,
            request.files
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/history")
async def get_history(project_id: str, limit: int = 10, current_user: User = Depends(get_current_user)):
    return git_service.get_history(project_id, limit)
