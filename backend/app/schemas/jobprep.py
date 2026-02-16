from pydantic import BaseModel, Field, HttpUrl, field_validator, validator
from typing import List, Optional, Any, Dict
from datetime import datetime
from uuid import UUID
from decimal import Decimal
import re

# --- Profile ---
class JobPrepProfileBase(BaseModel):
    current_status: Optional[str] = Field(None, max_length=100)
    target_timeline: Optional[str] = Field(None, max_length=100)
    experience_level: Optional[str] = Field(None, max_length=50)
    preferred_companies: List[str] = Field(default_factory=list, max_length=20)
    work_authorization: Optional[str] = Field(None, max_length=100)
    remote_preference: Optional[str] = Field(None, max_length=50)
    industry_focus: Optional[str] = Field(None, max_length=100)
    salary_expectation_min: Optional[int] = Field(None, ge=0)
    salary_expectation_max: Optional[int] = Field(None, ge=0)
    timezone: Optional[str] = Field(None, max_length=50)
    learning_style: Optional[str] = Field(None, max_length=50)
    notifications_enabled: bool = True

    @validator('preferred_companies')
    def validate_companies(cls, v):
        if v and len(v) > 20:
            raise ValueError('Maximum 20 preferred companies allowed')
        return [company[:200] for company in v]  # Limit each company name

class JobPrepProfileCreate(JobPrepProfileBase):
    pass

class JobPrepProfileUpdate(JobPrepProfileBase):
    overall_readiness_score: Optional[int] = None
    placement_mode_enabled: Optional[bool] = None

class JobPrepProfile(JobPrepProfileBase):
    id: UUID
    user_id: int
    overall_readiness_score: int
    last_assessment_date: Optional[datetime] = None
    placement_mode_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Target Role ---
class JobPrepTargetRoleBase(BaseModel):
    role_title: str = Field(..., min_length=1, max_length=200)
    role_category: Optional[str] = Field(None, max_length=100)
    seniority_level: Optional[str] = Field(None, max_length=50)
    market_demand: Optional[str] = Field(None, max_length=50)
    market_demand_description: Optional[str] = Field(None, max_length=2000)
    salary_range_min: Optional[int] = Field(None, ge=0, le=10000000)
    salary_range_max: Optional[int] = Field(None, ge=0, le=10000000)
    suggested_salary_range: Optional[str] = Field(None, max_length=100)
    required_skills: List[str] = Field(default_factory=list, max_length=50)
    nice_to_have_skills: List[str] = Field(default_factory=list, max_length=50)
    typical_interview_rounds: List[str] = Field(default_factory=list, max_length=20)
    preparation_focus_areas: List[str] = Field(default_factory=list, max_length=30)
    role_curriculum: Optional[List[Dict[str, Any]]] = None
    company_type_variant: Optional[str] = Field(None, max_length=100)
    interview_pattern: Optional[Dict[str, Any]] = None
    is_primary: bool = False
    is_active: bool = True

    @validator('role_title')
    def validate_role_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Role title cannot be empty')
        # Sanitize HTML tags
        v = re.sub(r'<[^>]+>', '', v)
        return v.strip()[:200]

    @validator('required_skills', 'nice_to_have_skills', 'preparation_focus_areas')
    def validate_skill_lists(cls, v):
        if v and len(v) > 50:
            raise ValueError('Maximum 50 items allowed in list')
        return [item[:100] for item in v]  # Limit each item

class JobPrepTargetRoleCreate(JobPrepTargetRoleBase):
    pass

class JobPrepTargetRoleUpdate(JobPrepTargetRoleBase):
    role_title: Optional[str] = None
    readiness_score: Optional[int] = None
    confidence_level: Optional[str] = None

class JobPrepTargetRole(JobPrepTargetRoleBase):
    id: UUID
    profile_id: UUID
    readiness_score: int
    confidence_level: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Skill ---
class JobPrepSkillBase(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=200)
    skill_category: str = Field(..., min_length=1, max_length=100)
    skill_subcategory: Optional[str] = Field(None, max_length=100)
    target_level: Optional[int] = Field(None, ge=1, le=5)
    is_critical: bool = False

    @validator('skill_name', 'skill_category')
    def sanitize_strings(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        # Remove HTML tags
        v = re.sub(r'<[^>]+>', '', v)
        return v.strip()[:200]

class JobPrepSkillCreate(JobPrepSkillBase):
    pass

class JobPrepSkillUpdate(JobPrepSkillBase):
    skill_name: Optional[str] = Field(None, max_length=200)
    skill_category: Optional[str] = Field(None, max_length=100)
    current_level: Optional[int] = Field(None, ge=0, le=5)
    evidence_count: Optional[int] = Field(None, ge=0, le=1000)
    evidence_target: Optional[int] = Field(None, ge=0, le=100)
    evidence_strength: Optional[Decimal] = None
    quality_score: Optional[Decimal] = None
    practice_attempts: Optional[int] = Field(None, ge=0, le=10000)
    is_gap: Optional[bool] = None

class JobPrepSkill(JobPrepSkillBase):
    id: UUID
    profile_id: UUID
    current_level: int
    evidence_count: int
    evidence_target: Optional[int] = None
    evidence_strength: Decimal
    practice_attempts: int
    last_practiced_at: Optional[datetime] = None
    is_gap: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Skill Evidence ---
class JobPrepSkillEvidenceBase(BaseModel):
    evidence_type: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = Field(None, max_length=2000)
    source_url: Optional[str] = Field(None, max_length=500)
    source_type: Optional[str] = Field(None, max_length=50)
    impact_level: Optional[str] = Field(None, max_length=50)
    evidence_metadata: Optional[Dict[str, Any]] = None

    @validator('title', 'description')
    def sanitize_text(cls, v):
        if v:
            # Remove HTML tags and scripts
            v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
            v = re.sub(r'<[^>]+>', '', v)
            return v.strip()
        return v

    @validator('source_url')
    def validate_url(cls, v):
        if v and v.strip():
            if not re.match(r'https?://', v):
                raise ValueError('URL must start with http:// or https://')
        return v

class JobPrepSkillEvidenceCreate(JobPrepSkillEvidenceBase):
    # skill_id is NOT here - it comes from the URL path parameter
    pass

class JobPrepSkillEvidence(JobPrepSkillEvidenceBase):
    id: UUID
    skill_id: UUID
    profile_id: UUID
    verified: bool
    verification_method: Optional[str] = None
    relevance_score: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Project ---
class JobPrepProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = Field(None, max_length=10000)
    project_type: Optional[str] = Field(None, max_length=50)
    github_url: Optional[str] = Field(None, max_length=500)
    live_demo_url: Optional[str] = Field(None, max_length=500)
    tech_stack: List[str] = Field(default_factory=list, max_length=100)
    key_features: List[str] = Field(default_factory=list, max_length=50)
    challenges_solved: List[str] = Field(default_factory=list, max_length=50)
    is_featured: bool = False
    is_complete: bool = True
    completion_date: Optional[datetime] = None

    @validator('title', 'description')
    def sanitize_text(cls, v):
        if v:
            # Remove HTML tags and scripts
            v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
            v = re.sub(r'<[^>]+>', '', v)
            return v.strip()
        return v

    @validator('github_url', 'live_demo_url')
    def validate_urls(cls, v):
        if v and v.strip():
            # Basic URL validation
            if not re.match(r'https?://', v):
                raise ValueError('URL must start with http:// or https://')
        return v

    @validator('tech_stack', 'key_features', 'challenges_solved')
    def validate_lists(cls, v):
        if v and len(v) > 100:
            raise ValueError('Maximum 100 items allowed')
        return [item[:200] for item in v]

class JobPrepProjectCreate(JobPrepProjectBase):
    pass

class JobPrepProjectUpdate(JobPrepProjectBase):
    title: Optional[str] = None
    lines_of_code: Optional[int] = None
    commit_count: Optional[int] = None
    complexity_score: Optional[Decimal] = None
    innovation_score: Optional[Decimal] = None
    interview_value_score: Optional[Decimal] = None
    talking_points: Optional[List[str]] = None
    impact_metrics: Optional[Dict[str, Any]] = None

class JobPrepProject(JobPrepProjectBase):
    id: UUID
    profile_id: UUID
    lines_of_code: Optional[int] = None
    commit_count: Optional[int] = None
    complexity_score: Optional[Decimal] = None
    innovation_score: Optional[Decimal] = None
    interview_value_score: Optional[Decimal] = None
    talking_points: Optional[List[str]] = None
    impact_metrics: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Simulation ---
class JobPrepInterviewSimulationBase(BaseModel):
    simulation_type: str
    difficulty_level: str
    company_style: Optional[str] = None
    persona_style: Optional[str] = None
    interview_rounds: Optional[List[Dict[str, Any]]] = None
    target_role_id: Optional[UUID] = None
    placement_mode: bool = False

class JobPrepInterviewSimulationCreate(JobPrepInterviewSimulationBase):
    pass

class JobPrepInterviewSimulationUpdate(BaseModel):
    duration_minutes: Optional[int] = None
    completed_at: Optional[datetime] = None
    overall_score: Optional[int] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    problem_solving_score: Optional[int] = None
    hiring_decision: Optional[str] = None
    interviewer_feedback: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    improvement_recommendations: Optional[List[str]] = None

class JobPrepInterviewSimulation(JobPrepInterviewSimulationBase):
    id: UUID
    profile_id: UUID
    started_at: datetime
    completed_at: Optional[datetime] = None
    overall_score: Optional[int] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    problem_solving_score: Optional[int] = None
    hiring_decision: Optional[str] = None
    interviewer_feedback: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    improvement_recommendations: Optional[List[str]] = None
    session_document_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Evaluation ---
class JobPrepPracticeEvaluate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    user_answer: str = Field(..., min_length=1, max_length=50000)
    practice_type: str = Field("conceptual", max_length=50)
    difficulty: str = Field("medium", max_length=50)

    @validator('topic', 'user_answer')
    def sanitize_input(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        # Remove scripts and iframe tags for security
        v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
        v = re.sub(r'<iframe[^>]*>.*?</iframe>', '', v, flags=re.DOTALL | re.IGNORECASE)
        return v.strip()

class JobPrepInterviewEvaluate(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    user_response: str = Field(..., min_length=1, max_length=50000)

    @validator('question', 'user_response')
    def sanitize_input(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or whitespace only')
        # Remove scripts and iframe tags for security
        v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
        v = re.sub(r'<iframe[^>]*>.*?</iframe>', '', v, flags=re.DOTALL | re.IGNORECASE)
        return v.strip()

# --- Readiness Assessment ---
class JobPrepReadinessAssessment(BaseModel):
    id: UUID
    profile_id: UUID
    target_role_id: Optional[UUID] = None
    overall_readiness_score: int
    readiness_level: Optional[str] = None
    technical_skills_score: Optional[int] = None
    communication_skills_score: Optional[int] = None
    problem_solving_score: Optional[int] = None
    domain_knowledge_score: Optional[int] = None
    critical_gaps: List[str] = []
    recommended_actions: List[str] = []
    estimated_time_to_ready_days: Optional[int] = None
    interview_success_probability: Optional[Decimal] = None
    assessment_type: str
    assessed_at: datetime

    class Config:
        from_attributes = True
