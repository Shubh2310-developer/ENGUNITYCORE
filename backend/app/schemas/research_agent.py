from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

class ResearchDepth(str, Enum):
    QUICK = "quick"          # Single-pass, 1-2 sources
    STANDARD = "standard"    # Multi-query, 3-5 sources
    DEEP = "deep"            # Iterative, 5-10+ sources with refinement
    EXHAUSTIVE = "exhaustive" # Full research with web + graph + multiple iterations

class ResearchStatus(str, Enum):
    PENDING = "pending"
    DECOMPOSING = "decomposing"
    SEARCHING = "searching"
    EVALUATING = "evaluating"
    REFINING = "refining"
    SYNTHESIZING = "synthesizing"
    COMPLETED = "completed"
    FAILED = "failed"

class SubQuery(BaseModel):
    """A decomposed sub-question from the main research query"""
    id: str
    question: str
    query_type: str  # "factual", "analytical", "comparative", "exploratory"
    priority: int = Field(ge=1, le=5, default=3)
    status: ResearchStatus = ResearchStatus.PENDING
    results: Optional[List[Dict[str, Any]]] = None
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)

class SourceEvaluation(BaseModel):
    """Quality evaluation of a retrieved source"""
    source_id: str
    source_name: str
    source_type: str  # "rag_document", "web", "graph_node"
    relevance_score: float = Field(ge=0.0, le=1.0)
    quality_score: float = Field(ge=0.0, le=1.0)
    freshness_score: float = Field(ge=0.0, le=1.0)
    content_snippet: str
    url: Optional[str] = None
    contradicts_other_sources: bool = False
    contradiction_details: Optional[str] = None

class ResearchIteration(BaseModel):
    """Tracks one iteration of the research loop"""
    iteration_number: int
    sub_queries_searched: List[str]
    sources_found: int
    sources_accepted: int
    coverage_gaps: List[str]
    refinement_queries: List[str]
    confidence_delta: float

class ResearchRequest(BaseModel):
    """Incoming research request"""
    query: str = Field(..., min_length=5, max_length=2000)
    depth: ResearchDepth = ResearchDepth.STANDARD
    max_iterations: int = Field(default=3, ge=1, le=10)
    include_web_search: bool = True
    include_graph_search: bool = True
    focus_areas: Optional[List[str]] = None
    exclude_sources: Optional[List[str]] = None
    output_format: str = "detailed"  # "detailed", "summary", "bullet_points"

class ResearchReport(BaseModel):
    """Final research report output"""
    id: UUID
    query: str
    depth: ResearchDepth
    status: ResearchStatus
    
    # Results
    summary: str
    detailed_findings: List[Dict[str, Any]]
    key_insights: List[str]
    
    # Sources
    sources: List[SourceEvaluation]
    total_sources_evaluated: int
    sources_accepted: int
    
    # Metadata
    iterations_performed: int
    iteration_history: List[ResearchIteration]
    overall_confidence: float = Field(ge=0.0, le=1.0)
    coverage_score: float = Field(ge=0.0, le=1.0)
    
    # Related
    related_topics: List[str]
    follow_up_questions: List[str]
    
    # Timestamps
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

class ResearchStreamEvent(BaseModel):
    """Real-time streaming event during research"""
    event_type: str  # "status", "sub_query", "source_found", "insight", "progress", "complete"
    data: Dict[str, Any]
    timestamp: datetime
    progress_percent: float = Field(ge=0.0, le=100.0)
