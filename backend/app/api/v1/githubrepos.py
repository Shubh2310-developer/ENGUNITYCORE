from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.github import GitHubRepository
from app.schemas.github import GitHubRepository as GitHubRepositorySchema, GitHubRepositoryCreate, GitHubRepositoryUpdate
from app.services.code_execution.sandbox import sandbox_simulator
from app.services.ai.logger import ai_logger
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/", response_model=List[GitHubRepositorySchema])
def get_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve GitHub repositories for the current user from Postgres.
    """
    repos = db.query(GitHubRepository).filter(GitHubRepository.user_id == current_user.id).all()
    return repos

@router.post("/", response_model=GitHubRepositorySchema)
def create_repository(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    repo_in: GitHubRepositoryCreate,
) -> Any:
    """
    Register a new GitHub repository in the metadata store.
    """
    db_obj = GitHubRepository(
        **repo_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{repo_id}")
async def get_repository_details(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve detailed information for a specific repository.
    Metadata from Postgres, AI analysis results from MongoDB.
    """
    repo = db.query(GitHubRepository).filter(GitHubRepository.id == repo_id, GitHubRepository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Fetch AI analysis from MongoDB
    analysis_results = {}
    if mongodb.db is not None:
        analysis = await mongodb.db.repo_analysis.find_one({"repo_id": repo_id}, sort=[("timestamp", -1)])
        if analysis:
            analysis_results = analysis.get("results", {})

    return {
        "metadata": repo,
        "analysis": analysis_results or {
            "status": "pending",
            "summary": "AI analysis has not been performed yet."
        }
    }

@router.post("/{repo_id}/analyze")
async def trigger_repository_analysis(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trigger a fresh AI analysis of a repository.
    Logs the event and stores (mock) analysis in MongoDB.
    """
    repo = db.query(GitHubRepository).filter(GitHubRepository.id == repo_id, GitHubRepository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # 1. Log the analysis trigger
    await ai_logger.log_event(
        event_type="repo_analysis_triggered",
        user_id=current_user.id,
        details={"repo_id": repo_id, "repo_name": repo.name}
    )

    # 2. Store a "completed" analysis in MongoDB (Mock for now)
    if mongodb.db is not None:
        mock_analysis = {
            "repo_id": repo_id,
            "timestamp": datetime.now(),
            "results": {
                "status": "completed",
                "summary": f"AI analysis of {repo.name} completed. High quality code with good documentation.",
                "quality_score": "A",
                "security_score": 95,
                "vulnerabilities": 0
            }
        }
        await mongodb.db.repo_analysis.insert_one(mock_analysis)

    return {"status": "queued", "message": "Analysis started successfully."}

@router.post("/{repo_id}/execute")
async def execute_repository_code(
    repo_id: str,
    use_gpu: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Simulate execution of repository code in a sandbox.
    """
    repo = db.query(GitHubRepository).filter(GitHubRepository.id == repo_id, GitHubRepository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    logs = await sandbox_simulator.run_example(repo.name, use_gpu=use_gpu)
    return {"status": "completed", "logs": logs}
