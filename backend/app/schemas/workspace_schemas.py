"""
Research Workspace — Pydantic Schemas
Mirrors the TypeScript types in frontend/src/types/research.ts exactly.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# ─── ToolKey literal (matches frontend ToolKey union) ────────────────────────
ToolKey = Literal[
    "comparator",
    "gap",
    "assumption",
    "strength",
    "question",
    "argument",
    "resolver",
    "coherence",
    "challenger",
]


# ─── Data schemas ─────────────────────────────────────────────────────────────

class ResearchSourceSchema(BaseModel):
    title: str
    type: str
    author: str
    date: str
    relevance: str


class ResearchClusterSchema(BaseModel):
    name: str
    progress: int = Field(..., ge=0, le=100)


class GraphNodeSchema(BaseModel):
    id: int
    label: str
    top: str
    left: str
    active: bool


# ─── Tool invoke request / response ──────────────────────────────────────────

class ToolInvokeRequest(BaseModel):
    tool: ToolKey
    context: str = Field(..., description="Selected text or current draft section for analysis")
    sources: List[str] = Field(default_factory=list, description="Optional source titles to include as context")
    project_id: Optional[str] = Field(None, description="Optional workspace project ID for persistence")


class ToolInvokeResponse(BaseModel):
    tool: str
    result: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Workspace data response wrappers ────────────────────────────────────────

class WorkspaceSourcesResponse(BaseModel):
    sources: List[ResearchSourceSchema]
    project_id: Optional[str] = None


class WorkspaceClustersResponse(BaseModel):
    clusters: List[ResearchClusterSchema]
    project_id: Optional[str] = None


class WorkspaceGraphNodesResponse(BaseModel):
    nodes: List[GraphNodeSchema]
    project_id: Optional[str] = None
