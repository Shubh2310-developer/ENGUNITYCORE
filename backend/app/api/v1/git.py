from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.v1.auth import get_current_user, AuthenticatedUser

from app.services.git.repository import git_service, GitStatus, GitCommit

router = APIRouter()

class CommitRequest(BaseModel):
    message: str
    files: List[str] = ["."]

@router.post("/{project_id}/init")
async def init_repo(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Initialize a git repository"""
    try:
        repo = git_service.get_repo(project_id, str(current_user.id))
        repo.init()
        return {"status": "initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/status", response_model=GitStatus)
async def get_status(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get git status"""
    try:
        repo = git_service.get_repo(project_id, str(current_user.id))
        return repo.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{project_id}/commit")
async def commit_changes(
    project_id: str,
    request: CommitRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Commit changes"""
    try:
        repo = git_service.get_repo(project_id, str(current_user.id))
        repo.add(request.files)
        repo.commit(request.message)
        return {"status": "committed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/log", response_model=List[GitCommit])
async def get_log(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get commit history"""
    try:
        repo = git_service.get_repo(project_id, str(current_user.id))
        return repo.get_log()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
