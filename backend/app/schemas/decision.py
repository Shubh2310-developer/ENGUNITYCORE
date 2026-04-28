from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

DecisionType = Literal["Architecture", "Research", "Code", "Product", "Career", "Compliance"]
DecisionStatus = Literal["tentative", "confirmed", "revisited", "deprecated"]
DecisionConfidence = Literal["low", "medium", "high"]
DecisionPrivacy = Literal["private", "team", "workspace", "public"]
EffortLevel = Literal["low", "medium", "high"]
RiskLevel = Literal["low", "medium", "high"]
EvidenceSourceType = Literal["chat", "document", "code_run", "external_url", "research_paper"]
EvidenceCredibility = Literal["primary", "secondary", "anecdotal"]
ConstraintType = Literal["budget", "time", "technical", "policy", "team_capacity"]
FlagSeverity = Literal["info", "warning", "critical"]
FlagType = Literal[
    "missing_option",
    "weak_evidence",
    "bias_detected",
    "contradiction",
    "sunk_cost_fallacy",
    "anchoring_bias",
    "availability_bias",
    "groupthink",
    "optimism_bias",
    "status_quo_bias",
    "recency_bias",
    "bandwagon_effect",
]


class AIFlagSchema(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    flag_type: FlagType
    severity: FlagSeverity
    message: str = Field(min_length=1, max_length=500)
    suggested_action: str = Field(min_length=1, max_length=500)
    dismissed: bool = False

class OptionSchema(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    label: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    estimated_effort: EffortLevel = "medium"
    risk_level: RiskLevel = "low"
    dismissed_reason: Optional[str] = None

class EvidenceSchema(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    source_type: EvidenceSourceType
    source_id: str = Field(min_length=1, max_length=200)
    excerpt: str = Field(min_length=1, max_length=5000)
    credibility: EvidenceCredibility
    added_at: str  # Changed from datetime to str for JSON serialization
    relevance_score: float = Field(ge=0, le=1)

class ConstraintSchema(BaseModel):
    type: ConstraintType
    description: str = Field(min_length=1, max_length=500)
    hard_limit: bool
    current_status: str = Field(min_length=1, max_length=120)

class DecisionBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    type: DecisionType
    status: DecisionStatus = "tentative"
    confidence: DecisionConfidence = "medium"
    problem_statement: str = Field(min_length=5, max_length=4000)
    context: Optional[str] = None
    constraints: List[ConstraintSchema] = Field(default_factory=list)
    options: List[OptionSchema] = Field(default_factory=list)
    evidence: List[EvidenceSchema] = Field(default_factory=list)
    tradeoffs: Dict[str, int] = Field(default_factory=dict)
    revisit_rule: Optional[Dict[str, Any]] = None
    ai_flags: List[AIFlagSchema] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    final_decision: Optional[str] = None
    rationale: Optional[str] = None
    privacy: DecisionPrivacy = "private"

    @field_validator("tradeoffs")
    @classmethod
    def validate_tradeoffs(cls, value: Dict[str, int]) -> Dict[str, int]:
        allowed_keys = {
            "performance",
            "cost",
            "complexity",
            "risk",
            "scalability",
            "time_to_implement",
        }
        for key, score in value.items():
            if key not in allowed_keys:
                raise ValueError(f"Invalid tradeoff key: {key}")
            if not isinstance(score, int) or score < 1 or score > 5:
                raise ValueError(f"Tradeoff '{key}' must be an integer between 1 and 5")
        return value

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: List[str]) -> List[str]:
        sanitized = []
        for tag in value:
            cleaned = tag.strip()
            if cleaned:
                sanitized.append(cleaned[:64])
        return sanitized[:30]

class DecisionCreate(DecisionBase):
    workspace_id: Optional[str] = "default"

class DecisionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    type: Optional[DecisionType] = None
    status: Optional[DecisionStatus] = None
    confidence: Optional[DecisionConfidence] = None
    problem_statement: Optional[str] = Field(default=None, min_length=5, max_length=4000)
    context: Optional[str] = None
    constraints: Optional[List[ConstraintSchema]] = None
    options: Optional[List[OptionSchema]] = None
    evidence: Optional[List[EvidenceSchema]] = None
    tradeoffs: Optional[Dict[str, int]] = None
    revisit_rule: Optional[Dict[str, Any]] = None
    ai_flags: Optional[List[AIFlagSchema]] = None
    tags: Optional[List[str]] = None
    final_decision: Optional[str] = None
    rationale: Optional[str] = None
    privacy: Optional[DecisionPrivacy] = None

class Decision(DecisionBase):
    id: str
    workspace_id: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
