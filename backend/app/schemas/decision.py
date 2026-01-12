from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class OptionSchema(BaseModel):
    id: str
    label: str
    description: str
    pros: List[str] = []
    cons: List[str] = []
    estimated_effort: str = "medium"
    risk_level: str = "low"
    dismissed_reason: Optional[str] = None

class EvidenceSchema(BaseModel):
    id: str
    source_type: str
    source_id: str
    excerpt: str
    credibility: str
    added_at: datetime
    relevance_score: float

class ConstraintSchema(BaseModel):
    type: str
    description: str
    hard_limit: bool
    current_status: str

class DecisionBase(BaseModel):
    title: str
    type: str
    status: str = "tentative"
    confidence: str = "medium"
    problem_statement: str
    context: Optional[str] = None
    constraints: List[ConstraintSchema] = []
    options: List[OptionSchema] = []
    evidence: List[EvidenceSchema] = []
    tradeoffs: Dict[str, int] = {}
    revisit_rule: Optional[Dict[str, Any]] = None
    ai_flags: List[Dict[str, Any]] = []
    tags: List[str] = []
    final_decision: Optional[str] = None
    rationale: Optional[str] = None
    privacy: str = "private"

class DecisionCreate(DecisionBase):
    workspace_id: Optional[str] = "default"

class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[str] = None
    problem_statement: Optional[str] = None
    context: Optional[str] = None
    constraints: Optional[List[ConstraintSchema]] = None
    options: Optional[List[OptionSchema]] = None
    evidence: Optional[List[EvidenceSchema]] = None
    tradeoffs: Optional[Dict[str, int]] = None
    revisit_rule: Optional[Dict[str, Any]] = None
    ai_flags: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    final_decision: Optional[str] = None
    rationale: Optional[str] = None
    privacy: Optional[str] = None

class Decision(DecisionBase):
    id: str
    workspace_id: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
