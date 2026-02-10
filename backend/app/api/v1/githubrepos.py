from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks, Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.core.socket_manager import sio
from app.core.rate_limit import limiter
from app.core.security_utils import sanitize_code_output
from app.models.user import User
from app.models.github import GitHubRepository
from app.schemas.github import (
    GitHubRepository as GitHubRepositorySchema,
    GitHubRepositoryCreate,
    GitHubRepositoryUpdate,
    GitHubRepositoryImport,
    GitHubBulkAnalyze
)
from app.services.code_execution.sandbox import sandbox_simulator
from app.services.ai.logger import ai_logger
from app.services.github.client import github_client, GitHubClient
from app.services.github.analyzer import analyzer
from app.services.github.cloner import cloner
from app.services.github.research_mapper import research_mapper
from app.services.github.cache import cache_service
from datetime import datetime
import uuid
import logging
import time

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[GitHubRepositorySchema])
def get_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve GitHub repositories for the current user from Postgres.
    """
    start_time = time.time()
    logger.info(f"[GET /githubrepos] Request from user_id={current_user.id}, email={current_user.email}")
    
    try:
        repos = db.query(GitHubRepository).filter(GitHubRepository.user_id == current_user.id).all()
        elapsed = time.time() - start_time
        logger.info(f"[GET /githubrepos] ✅ Found {len(repos)} repositories in {elapsed:.2f}s")
        return repos
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"[GET /githubrepos] ❌ Error after {elapsed:.2f}s: {str(e)}")
        raise

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

@router.get("/user-repos")
async def get_user_github_repositories(
    github_token: Optional[str] = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Fetch all repositories for the user directly from GitHub.
    """
    start_time = time.time()
    logger.info(f"[GET /user-repos] Request from user_id={current_user.id}, has_token={bool(github_token)}")
    
    try:
        # If no token provided, we can't fetch from GitHub unless we have one stored
        # For now, we expect the frontend to pass the provider token if available
        client = GitHubClient(github_token) if github_token else github_client
        repos = client.get_user_repositories()
        elapsed = time.time() - start_time
        logger.info(f"[GET /user-repos] ✅ Fetched {len(repos)} repos from GitHub in {elapsed:.2f}s")
        return repos
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"[GET /user-repos] ❌ Error after {elapsed:.2f}s: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{repo_id}")
async def get_repository_details(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve detailed information for a specific repository.
    Uses Redis cache for performance optimization.
    """
    start_time = time.time()
    logger.info(f"[GET /githubrepos/{repo_id}] Request from user_id={current_user.id}")
    
    # 1. Check cache first
    cache_key = f"repo_details:{repo_id}"
    cached_data = await cache_service.get(cache_key)
    if cached_data:
        elapsed = time.time() - start_time
        logger.info(f"[GET /githubrepos/{repo_id}] ✅ Cache hit in {elapsed:.2f}s")
        return cached_data

    repo = db.query(GitHubRepository).filter(GitHubRepository.id == repo_id, GitHubRepository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Fetch AI analysis from MongoDB
    analysis_results = {}
    activity_data = {}
    if mongodb.db is not None:
        analysis = await mongodb.db.repo_analysis.find_one({"repo_id": repo_id}, sort=[("timestamp", -1)])
        if analysis:
            analysis_results = analysis.get("results", {})

        activity = await mongodb.db.repo_activity.find_one({"repo_id": repo_id})
        if activity:
            # Clean up MongoDB _id
            activity.pop("_id", None)
            activity_data = activity

    result = {
        "metadata": jsonable_encoder(repo),
        "analysis": analysis_results or {
            "status": "pending",
            "summary": "AI analysis has not been performed yet."
        },
        "activity": activity_data
    }

    # 2. Store in cache (1 hour expiry)
    await cache_service.set(cache_key, result, expire=3600)
    
    elapsed = time.time() - start_time
    logger.info(f"[GET /githubrepos/{repo_id}] ✅ Details fetched in {elapsed:.2f}s")
    return result

async def perform_comprehensive_analysis(repo_id: str, owner: str, name: str, repo_url: str, language: str, user_id: int):
    """
    Background task for deep repository analysis.
    Uses Socket.IO rooms for targeted updates.
    """
    try:
        # 1. Update status: Cloning
        await sio.emit("analysis_status", {"repo_id": repo_id, "status": "cloning", "progress": 20}, room=repo_id)

        # Clone to Supabase
        storage_path = await cloner.clone_and_store(repo_url, repo_id)

        # 2. Update status: AI Analysis
        await sio.emit("analysis_status", {"repo_id": repo_id, "status": "analyzing", "progress": 40}, room=repo_id)

        # Perform real AI analysis
        analysis_results = await analyzer.analyze_repository(owner, name)

        # 3. Update status: Research Mapping
        await sio.emit("analysis_status", {"repo_id": repo_id, "status": "mapping", "progress": 70}, room=repo_id)

        # Map to research papers
        papers = await research_mapper.map_to_papers(
            {"name": name, "owner": owner, "description": analysis_results.get("summary", ""), "language": language or "Unknown", "topics": []},
            analysis_results.get("code_intelligence", {})
        )
        analysis_results["research_papers"] = papers
        analysis_results["storage_path"] = storage_path

        # 4. Store in MongoDB
        if mongodb.db is not None:
            analysis_doc = {
                "repo_id": repo_id,
                "timestamp": datetime.now(),
                "results": analysis_results
            }
            await mongodb.db.repo_analysis.insert_one(analysis_doc)

        # 5. Update PostgreSQL quality score
        # We need a new session here since it's a background task
        from app.core.database import SessionLocal
        with SessionLocal() as db:
            repo = db.query(GitHubRepository).filter(GitHubRepository.id == repo_id).first()
            if repo:
                repo.quality_score = analysis_results.get("quality_score", "B")
                db.commit()

        # 6. Invalidate cache
        await cache_service.delete(f"repo_details:{repo_id}")

        # 7. Final status: Completed
        await sio.emit("analysis_status", {"repo_id": repo_id, "status": "completed", "progress": 100})

    except Exception as e:
        print(f"Analysis failed for {repo_id}: {str(e)}")
        await sio.emit("analysis_status", {"repo_id": repo_id, "status": "error", "message": str(e)})

@router.post("/{repo_id}/analyze")
@limiter.limit("5/minute")
async def trigger_repository_analysis(
    request: Request,
    repo_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trigger a real AI analysis of a repository in the background.
    """
    logger.info(f"[POST /githubrepos/{repo_id}/analyze] Request from user_id={current_user.id}")
    
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        logger.warning(f"[POST /githubrepos/{repo_id}/analyze] Repository not found")
        raise HTTPException(status_code=404, detail="Repository not found")

    # Log the analysis trigger
    await ai_logger.log_event(
        event_type="repo_analysis_triggered",
        user_id=current_user.id,
        details={"repo_id": repo_id, "repo_name": repo.name}
    )

    # Queue background task
    background_tasks.add_task(
        perform_comprehensive_analysis,
        repo_id,
        repo.owner,
        repo.name,
        repo.repository_url,
        repo.language,
        current_user.id
    )
    
    logger.info(f"[POST /githubrepos/{repo_id}/analyze] ✅ Analysis queued for {repo.name}")
    return {"status": "queued", "message": "Comprehensive analysis started in the background."}

@router.post("/{repo_id}/execute")
@limiter.limit("10/minute")
async def execute_repository_code(
    repo_id: str,
    request: Request,
    use_gpu: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Simulate execution of repository code in a sandbox.
    Outputs are sanitized for safe frontend display.
    """
    repo = db.query(GitHubRepository).filter(GitHubRepository.id == repo_id, GitHubRepository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    raw_logs = await sandbox_simulator.run_example(repo.name, use_gpu=use_gpu)

    # Sanitize logs for production safety
    sanitized_logs = [
        {**log, "message": sanitize_code_output(log["message"])}
        for log in raw_logs
    ]

    return {"status": "completed", "logs": sanitized_logs}

@router.post("/import")
@limiter.limit("10/minute")
async def import_repository(
    repo_import: GitHubRepositoryImport,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Import repository from GitHub by fetching metadata from GitHub API.
    """
    try:
        # Initialize client with user's token if provided
        client = GitHubClient(repo_import.github_token) if repo_import.github_token else github_client

        # Fetch repo info from GitHub
        repo_info = client.get_repository_info(repo_import.owner, repo_import.repo_name)

        # Check if already exists
        existing = db.query(GitHubRepository).filter(
            GitHubRepository.repository_url == repo_info["repository_url"],
            GitHubRepository.user_id == current_user.id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Repository already imported")

        # Create new repository record
        # Note: we need to handle fields that might not be in the model but are in repo_info
        model_fields = {k: v for k, v in repo_info.items() if k in GitHubRepository.__table__.columns.keys()}
        db_obj = GitHubRepository(**model_fields, user_id=current_user.id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return jsonable_encoder(db_obj)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{repo_id}/ai-tool")
@limiter.limit("20/minute")
async def run_ai_tool(
    repo_id: str,
    tool_type: str,  # Query parameter: explain, trace, bottleneck, dead_code
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Run specific AI analysis tools on repository code.
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Mock responses based on tool type
    tool_responses = {
        "explain": {
            "title": "Code Explanation",
            "content": f"This repository ({repo.name}) implements a comprehensive {repo.language} solution with modular architecture. Key components include core models, data processing pipelines, and utility functions."
        },
        "trace": {
            "title": "Execution Trace",
            "content": f"Traced execution flow: Entry point → Data loading → Model initialization → Training loop → Evaluation. Average execution time: 450ms. No bottlenecks detected."
        },
        "bottleneck": {
            "title": "Performance Audit",
            "content": "Identified 2 potential bottlenecks: 1) Data loading in main.py:45 (IO-bound), 2) Matrix multiplication in model.py:120 (CPU-bound). Recommendations: Use async IO, leverage GPU acceleration."
        },
        "dead_code": {
            "title": "Dead Code Analysis",
            "content": "Found 3 unused functions: utils.py:helper_old(), deprecated.py:legacy_transform(), test_old.py:* (entire file). Removing these would reduce codebase by ~15%."
        }
    }

    result = tool_responses.get(tool_type, {
        "title": "Unknown Tool",
        "content": "Tool type not recognized."
    })

    # Log the tool execution
    await ai_logger.log_event(
        event_type="ai_tool_executed",
        user_id=current_user.id,
        details={"repo_id": repo_id, "tool_type": tool_type}
    )

    return {"result": result}

@router.post("/bulk/analyze")
@limiter.limit("2/minute")
async def bulk_trigger_analysis(
    bulk_in: GitHubBulkAnalyze,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trigger analysis for multiple repositories in bulk.
    """
    results = []
    for repo_id in bulk_in.repo_ids:
        repo = db.query(GitHubRepository).filter(
            GitHubRepository.id == repo_id,
            GitHubRepository.user_id == current_user.id
        ).first()

        if not repo:
            results.append({"repo_id": repo_id, "status": "error", "message": "Not found"})
            continue

        # Trigger analysis in background
        background_tasks.add_task(
            perform_comprehensive_analysis,
            repo_id,
            repo.owner,
            repo.name,
            repo.repository_url,
            repo.language,
            current_user.id
        )

        # Log the bulk analysis trigger
        await ai_logger.log_event(
            event_type="bulk_analysis_triggered",
            user_id=current_user.id,
            details={"repo_id": repo_id, "repo_name": repo.name}
        )

        results.append({"repo_id": repo_id, "status": "queued", "message": "Analysis queued"})

    return {"results": results, "total": len(bulk_in.repo_ids), "queued": len([r for r in results if r["status"] == "queued"])}

@router.put("/{repo_id}", response_model=GitHubRepositorySchema)
async def update_repository(
    repo_id: str,
    repo_in: GitHubRepositoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update repository metadata"""
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Update fields
    update_data = repo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(repo, field, value)

    db.commit()
    db.refresh(repo)

    # Invalidate cache
    await cache_service.delete(f"repo_details:{repo_id}")

    return repo

@router.delete("/{repo_id}")
async def delete_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete repository and associated analysis data"""
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Delete from PostgreSQL
    db.delete(repo)
    db.commit()

    # Delete from MongoDB (analysis data)
    if mongodb.db is not None:
        await mongodb.db.repo_analysis.delete_many({"repo_id": repo_id})

    # Invalidate cache
    await cache_service.delete(f"repo_details:{repo_id}")

    return {"message": "Repository deleted successfully"}

@router.post("/{repo_id}/sync")
@limiter.limit("10/minute")
async def sync_repository(
    repo_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Sync repository metadata and activity pulse from GitHub.
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    try:
        # Fetch latest info from GitHub
        repo_info = github_client.get_repository_info(repo.owner, repo.name)
        commits = github_client.get_recent_commits(repo.owner, repo.name)

        # Update metadata fields
        for key, value in repo_info.items():
            if hasattr(repo, key):
                setattr(repo, key, value)

        db.commit()
        db.refresh(repo)

        # Update activity pulse in MongoDB if possible
        if mongodb.db is not None:
            await mongodb.db.repo_activity.update_one(
                {"repo_id": repo_id},
                {"$set": {
                    "last_sync": datetime.now(),
                    "recent_commits": commits
                }},
                upsert=True
            )

        # Invalidate cache
        await cache_service.delete(f"repo_details:{repo_id}")

        return jsonable_encoder({"status": "success", "message": "Metadata and activity synchronized.", "metadata": repo})

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sync failed: {str(e)}")

from app.services.storage.supabase import storage_service

@router.get("/{repo_id}/download")
@limiter.limit("10/minute")
async def get_repository_download_url(
    repo_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Generate a secure signed URL for downloading the archived repository source.
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # The storage path is typically {repo_id}/source.tar.gz as implemented in Cloner
    path = f"{repo_id}/source.tar.gz"

    try:
        url = await storage_service.get_file_url(
            bucket="repositories",
            path=path,
            signed=True,
            expires_in=300 # 5 minutes
        )

        if not url:
            raise HTTPException(status_code=404, detail="Repository archive not found in storage. Trigger analysis to generate it.")

        return {"download_url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{repo_id}/files/content")
@limiter.limit("30/minute")
async def get_repo_file_content(
    repo_id: str,
    path: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Fetch content of a specific file from the GitHub repository.
    """
    repo = db.query(GitHubRepository).filter(
        GitHubRepository.id == repo_id,
        GitHubRepository.user_id == current_user.id
    ).first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    try:
        content = github_client.get_file_content(repo.owner, repo.name, path)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found or binary file")

        return {"content": content, "path": path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
