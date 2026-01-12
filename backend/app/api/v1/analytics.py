from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.document import Document
from app.models.decision import Decision
from app.models.research import ResearchPaper
from app.models.code import CodeProject

router = APIRouter()

@router.get("/")
async def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve analytics dashboard for the current user.
    Aggregates data from Postgres (metadata) and MongoDB (AI logs).
    """
    # 1. Fetch metadata counts from Postgres
    doc_count = db.query(Document).filter(Document.user_id == current_user.id).count()
    decision_count = db.query(Decision).filter(Decision.user_id == current_user.id).count()
    research_count = db.query(ResearchPaper).filter(ResearchPaper.user_id == current_user.id).count()
    code_count = db.query(CodeProject).filter(CodeProject.user_id == current_user.id).count()

    # 2. Fetch AI event counts from MongoDB
    ai_stats = {
        "total_completions": 0,
        "cache_hits": 0,
        "total_tokens_estimated": 0
    }

    if mongodb.db is not None:
        ai_stats["total_completions"] = await mongodb.db.ai_logs.count_documents({
            "user_id": current_user.id,
            "event_type": "ai_completion"
        })
        ai_stats["cache_hits"] = await mongodb.db.ai_logs.count_documents({
            "user_id": current_user.id,
            "event_type": "ai_cache_hit"
        })

    return {
        "user_email": current_user.email,
        "postgres_stats": {
            "documents": doc_count,
            "decisions": decision_count,
            "research_papers": research_count,
            "code_projects": code_count
        },
        "mongodb_stats": ai_stats,
        "summary": f"Dashboard for {current_user.email} with {doc_count} docs and {ai_stats['total_completions']} AI interactions."
    }
