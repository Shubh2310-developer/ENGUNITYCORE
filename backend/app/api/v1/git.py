from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.git.repository import git_service, GitStatus, GitCommit

router = APIRouter()

class CommitRequest(BaseModel):
    message: str
    files: List[str] = ["."]

@router.post("/{project_id}/init")
async def init_repo(project_id: str):
    """Initialize a git repository"""
    try:
        # Using a dummy user_id for now as we might be in unauth context for Code Lab
        repo = git_service.get_repo(project_id, "default_user")
        repo.init()
        return {"status": "initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/status", response_model=GitStatus)
async def get_status(project_id: str):
    """Get git status"""
    try:
        repo = git_service.get_repo(project_id, "default_user")
        return repo.get_status()
    except Exception as e:
        # Return empty status on error to avoid breaking UI
        return GitStatus(
            active_branch="none",
            is_dirty=False,
            changed_files=[],
            untracked_files=[]
        )

@router.post("/{project_id}/commit")
async def commit_changes(project_id: str, request: CommitRequest):
    """Commit changes"""
    try:
        repo = git_service.get_repo(project_id, "default_user")
        repo.add(request.files)
        repo.commit(request.message)
        return {"status": "committed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/log", response_model=List[GitCommit])
async def get_log(project_id: str):
    """Get commit history"""
    try:
        repo = git_service.get_repo(project_id, "default_user")
        return repo.get_log()
    except Exception as e:
        return []
