from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.decision import Decision as DecisionModel
from app.schemas.decision import Decision, DecisionCreate, DecisionUpdate
from datetime import datetime
import uuid

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
) -> Any:
    """
    Create a new decision.
    Metadata goes to Postgres, Reasoning traces go to MongoDB.
    """
    decision_id = str(uuid.uuid4())
    decision = DecisionModel(
        **decision_in.model_dump(),
        id=decision_id,
        user_id=current_user.id
    )

    # Store initial reasoning trace in MongoDB if provided in the request
    if mongodb.db is not None:
        trace_data = {
            "decision_id": decision_id,
            "user_id": current_user.id,
            "event": "creation",
            "timestamp": datetime.now(),
            "reasoning_trace": "Decision initialized in the vault."
        }
        await mongodb.db.decision_traces.insert_one(trace_data)

    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision

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
        traces_cursor = mongodb.db.decision_traces.find({"decision_id": decision_id}).sort("timestamp", 1)
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
