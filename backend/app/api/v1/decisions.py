from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Response, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.decision import Decision as DecisionModel
from app.schemas.decision import Decision, DecisionCreate, DecisionUpdate, DecisionBase, AIFlagSchema
from app.services.ai.decision_ai import decision_ai_service, DecisionAnalysisError
from app.services.export.decision_export import decision_export_service
from datetime import datetime
import uuid
import json
import hashlib
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Decision])
def get_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve decisions for the current user.
    """
    decisions = db.query(DecisionModel).filter(DecisionModel.user_id == current_user.id).order_by(DecisionModel.updated_at.desc()).all()
    return decisions

@router.post("/", response_model=Decision)
async def create_decision(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    decision_in: DecisionCreate,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> Any:
    """
    Create a new decision.
    Metadata goes to Postgres, Reasoning traces go to MongoDB.
    """
    payload_hash = hashlib.sha256(
        json.dumps(decision_in.model_dump(), sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    ).hexdigest()

    if idempotency_key:
        existing = db.query(DecisionModel).filter(
            DecisionModel.user_id == current_user.id,
            DecisionModel.idempotency_key == idempotency_key,
        ).first()
        if existing:
            if existing.idempotency_payload_hash != payload_hash:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
                        "message": "Idempotency key has already been used with a different payload",
                    },
                )
            return existing

    decision_id = str(uuid.uuid4())
    decision = DecisionModel(
        **decision_in.model_dump(),
        id=decision_id,
        user_id=current_user.id,
        idempotency_key=idempotency_key,
        idempotency_payload_hash=payload_hash if idempotency_key else None,
    )

    db.add(decision)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if idempotency_key:
            existing = db.query(DecisionModel).filter(
                DecisionModel.user_id == current_user.id,
                DecisionModel.idempotency_key == idempotency_key,
            ).first()
            if existing and existing.idempotency_payload_hash == payload_hash:
                return existing
        raise
    db.refresh(decision)

    # Store initial reasoning trace in MongoDB as best-effort after Postgres commit
    if mongodb.db is not None:
        try:
            trace_data = {
                "decision_id": decision_id,
                "user_id": current_user.id,
                "event": "creation",
                "timestamp": datetime.now(),
                "reasoning_trace": "Decision initialized in the vault."
            }
            await mongodb.db.decision_traces.insert_one(trace_data)
        except Exception as exc:
            logger.warning("Decision trace persistence failed for %s: %s", decision_id, exc)

    return decision

@router.post("/analyze", response_model=List[AIFlagSchema])
async def analyze_decision(
    *,
    decision_in: DecisionBase,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Perform adversarial AI review on a decision draft.
    """
    try:
        flags = await decision_ai_service.analyze_decision(decision_in)
        return flags
    except DecisionAnalysisError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "code": exc.code,
                "message": exc.message,
                "retryable": exc.retryable,
            },
        ) from exc

@router.get("/{decision_id}", response_model=Decision)
async def get_decision(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get a specific decision with its reasoning traces from MongoDB.
    """
    decision = db.query(DecisionModel).filter(
        DecisionModel.id == decision_id,
        DecisionModel.user_id == current_user.id
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Fetch reasoning traces from MongoDB
    if mongodb.db is not None:
        traces_cursor = mongodb.db.decision_traces.find({"decision_id": decision_id, "user_id": current_user.id}).sort("timestamp", 1)
        traces = await traces_cursor.to_list(length=100)
        # We can attach these to a separate field or return them in a detailed view
        # For now, we'll just ensure they are retrievable

    return decision

@router.patch("/{decision_id}", response_model=Decision)
def update_decision(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    decision_in: DecisionUpdate = Body(...),
) -> Any:
    """
    Update a decision.
    """
    decision = db.query(DecisionModel).filter(
        DecisionModel.id == decision_id,
        DecisionModel.user_id == current_user.id
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    update_data = decision_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(decision, field, value)

    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision

@router.get("/{decision_id}/export/json")
def export_decision_json(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Export decision as JSON file.
    """
    decision = db.query(DecisionModel).filter(
        DecisionModel.id == decision_id,
        DecisionModel.user_id == current_user.id
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Convert to dict
    decision_dict = {
        "id": decision.id,
        "title": decision.title,
        "type": decision.type,
        "status": decision.status,
        "confidence": decision.confidence,
        "problem_statement": decision.problem_statement,
        "context": decision.context,
        "constraints": decision.constraints,
        "options": decision.options,
        "evidence": decision.evidence,
        "tradeoffs": decision.tradeoffs,
        "ai_flags": decision.ai_flags,
        "final_decision": decision.final_decision,
        "rationale": decision.rationale,
        "tags": decision.tags,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }
    
    json_content = decision_export_service.export_to_json(decision_dict)
    
    filename = f"decision_{decision.title.replace(' ', '_')[:30]}.json"
    return Response(
        content=json_content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{decision_id}/export/adr")
def export_decision_adr(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Export decision as Architecture Decision Record (Markdown).
    """
    decision = db.query(DecisionModel).filter(
        DecisionModel.id == decision_id,
        DecisionModel.user_id == current_user.id
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Convert to dict
    decision_dict = {
        "id": decision.id,
        "title": decision.title,
        "type": decision.type,
        "status": decision.status,
        "confidence": decision.confidence,
        "problem_statement": decision.problem_statement,
        "context": decision.context,
        "constraints": decision.constraints,
        "options": decision.options,
        "evidence": decision.evidence,
        "tradeoffs": decision.tradeoffs,
        "ai_flags": decision.ai_flags,
        "final_decision": decision.final_decision,
        "rationale": decision.rationale,
        "tags": decision.tags,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }
    
    adr_content = decision_export_service.export_to_adr(decision_dict)
    
    filename = f"ADR_{decision.title.replace(' ', '_')[:30]}.md"
    return Response(
        content=adr_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{decision_id}/export/star")
def export_decision_star(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Export decision as STAR format (for interviews).
    """
    decision = db.query(DecisionModel).filter(
        DecisionModel.id == decision_id,
        DecisionModel.user_id == current_user.id
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Convert to dict
    decision_dict = {
        "id": decision.id,
        "title": decision.title,
        "type": decision.type,
        "status": decision.status,
        "confidence": decision.confidence,
        "problem_statement": decision.problem_statement,
        "context": decision.context,
        "constraints": decision.constraints,
        "options": decision.options,
        "evidence": decision.evidence,
        "tradeoffs": decision.tradeoffs,
        "ai_flags": decision.ai_flags,
        "final_decision": decision.final_decision,
        "rationale": decision.rationale,
        "tags": decision.tags,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }
    
    star_content = decision_export_service.export_to_star(decision_dict)
    
    filename = f"STAR_{decision.title.replace(' ', '_')[:30]}.md"
    return Response(
        content=star_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{decision_id}/export/pdf")
def export_decision_pdf(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Export decision as PDF.
    """
    decision = db.query(DecisionModel).filter(
        DecisionModel.id == decision_id,
        DecisionModel.user_id == current_user.id
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Convert to dict
    decision_dict = {
        "id": decision.id,
        "title": decision.title,
        "type": decision.type,
        "status": decision.status,
        "confidence": decision.confidence,
        "problem_statement": decision.problem_statement,
        "context": decision.context,
        "constraints": decision.constraints,
        "options": decision.options,
        "evidence": decision.evidence,
        "tradeoffs": decision.tradeoffs,
        "ai_flags": decision.ai_flags,
        "final_decision": decision.final_decision,
        "rationale": decision.rationale,
        "tags": decision.tags,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at
    }
    
    pdf_buffer = decision_export_service.export_to_pdf(decision_dict)
    
    if pdf_buffer is None:
        raise HTTPException(status_code=500, detail="PDF generation not available (reportlab not installed)")
    
    filename = f"Decision_{decision.title.replace(' ', '_')[:30]}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
