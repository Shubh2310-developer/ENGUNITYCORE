# 🏗️ Agent 07: AI System Architect Agent

> **Priority:** ⭐⭐⭐ Tier 2 | **Effort:** 4-5 days | **Framework:** LangGraph

---

## 1. Overview

An AI agent that helps students design system architectures from requirements. It generates architecture diagrams, evaluates trade-offs, suggests design patterns, and reviews existing designs for scalability, reliability, and security.

**Why:** System design is a critical engineering skill and top interview topic. No existing Engunity feature covers this.

### Existing Infrastructure

| Component | File |
|-----------|------|
| Code Lab | `backend/app/services/code_execution/` |
| GitHub Integration | `backend/app/services/github/` |
| OmniRAG (knowledge) | `backend/app/services/rag/pipeline.py` |
| Document Processing | `backend/app/services/documents/` |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│           SYSTEM ARCHITECT AGENT                  │
│                                                    │
│  User: "Design a URL shortener for 10M users"    │
│              │                                     │
│     ┌────────▼────────┐                            │
│     │ Requirements    │ Parse functional +         │
│     │ Analyzer        │ non-functional reqs        │
│     └────────┬────────┘                            │
│     ┌────────▼────────┐                            │
│     │ Architecture    │ Component diagram,         │
│     │ Generator       │ data flow, API design      │
│     └────────┬────────┘                            │
│     ┌────────▼────────┐                            │
│     │ Trade-off       │ Evaluate alternatives,     │
│     │ Analyzer        │ compare approaches         │
│     └────────┬────────┘                            │
│     ┌────────▼────────┐                            │
│     │ Diagram         │ Mermaid.js diagrams        │
│     │ Generator       │ for visual output          │
│     └────────┬────────┘                            │
│     ┌────────▼────────┐                            │
│     │ Pattern         │ Suggest microservices,     │
│     │ Recommender     │ event-driven, etc.         │
│     └─────────────────┘                            │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/architect_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class DesignRequestType(str, Enum):
    DESIGN_FROM_SCRATCH = "design_from_scratch"
    REVIEW_EXISTING = "review_existing"
    COMPARE_APPROACHES = "compare_approaches"
    SCALE_ANALYSIS = "scale_analysis"

class SystemComponent(BaseModel):
    name: str
    type: str  # "service", "database", "cache", "queue", "cdn", "lb"
    technology: str  # e.g., "PostgreSQL", "Redis", "Kafka"
    description: str
    responsibilities: List[str]
    connections: List[str]  # Other component names

class DesignPattern(BaseModel):
    name: str  # "microservices", "event-driven", "cqrs", "saga"
    rationale: str
    pros: List[str]
    cons: List[str]
    when_to_use: str

class ScalabilityAnalysis(BaseModel):
    current_capacity: str
    bottlenecks: List[str]
    recommendations: List[Dict[str, str]]
    estimated_capacity_after: str

class ArchitectureDesign(BaseModel):
    title: str
    requirements: Dict[str, List[str]]  # functional, non_functional
    components: List[SystemComponent]
    patterns: List[DesignPattern]
    mermaid_diagram: str  # Mermaid.js code
    api_design: List[Dict[str, str]]  # endpoint, method, description
    data_models: List[Dict[str, Any]]
    trade_offs: List[Dict[str, str]]
    scalability: ScalabilityAnalysis
    estimated_cost: Optional[str] = None

class ArchitectRequest(BaseModel):
    request_type: DesignRequestType
    description: str
    scale: Optional[str] = "medium"  # "small", "medium", "large", "massive"
    constraints: Optional[List[str]] = None
    existing_design: Optional[str] = None
```

---

## 4. Backend — `backend/app/agents/architect_agent.py`

```python
import json
from typing import Dict, List, Optional
from loguru import logger
from app.services.ai.groq_client import groq_client

class SystemArchitectAgent:
    async def design_system(self, description: str, scale: str = "medium",
                            constraints: List[str] = None) -> Dict:
        prompt = f"""Design a system architecture for:
{description}

Scale: {scale} | Constraints: {constraints or 'none'}

Return JSON:
{{
  "title": "System name",
  "requirements": {{
    "functional": ["req1"],
    "non_functional": ["scalability", "availability"]
  }},
  "components": [
    {{"name": "API Gateway", "type": "service", "technology": "Kong/Nginx",
      "description": "...", "responsibilities": ["..."], "connections": ["Service A"]}}
  ],
  "patterns": [
    {{"name": "microservices", "rationale": "...", "pros": ["..."], "cons": ["..."],
      "when_to_use": "..."}}
  ],
  "mermaid_diagram": "graph TD\\n  A[Client] --> B[API Gateway]\\n...",
  "api_design": [
    {{"endpoint": "/api/v1/...", "method": "POST", "description": "..."}}
  ],
  "data_models": [{{"entity": "User", "fields": {{"id": "UUID", "name": "string"}}}}],
  "trade_offs": [{{"decision": "SQL vs NoSQL", "choice": "PostgreSQL", "reason": "..."}}],
  "scalability": {{
    "current_capacity": "10K req/s",
    "bottlenecks": ["DB writes"],
    "recommendations": [{{"action": "Add read replicas", "impact": "3x reads"}}],
    "estimated_capacity_after": "50K req/s"
  }}
}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Senior system architect at FAANG. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        start = response.find('{')
        end = response.rfind('}') + 1
        return json.loads(response[start:end])

    async def review_design(self, existing_design: str) -> Dict:
        prompt = f"""Review this system design:
{existing_design[:4000]}

Return JSON: {{"score": 8, "strengths": [...], "weaknesses": [...],
"suggestions": [...], "security_issues": [...], "scalability_issues": [...]}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Architecture reviewer. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def compare_approaches(self, description: str, approaches: List[str]) -> Dict:
        prompt = f"""Compare these architectural approaches for: {description}
Approaches: {approaches}

Return JSON: {{"comparison_table": [{{"approach": "...", "pros": [...], "cons": [...],
"complexity": "low/medium/high", "cost": "low/medium/high", "recommended": true}}],
"winner": "...", "reasoning": "..."}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Architecture consultant. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

architect_agent = SystemArchitectAgent()
```

### API — `backend/app/api/v1/architect.py`

```python
from fastapi import APIRouter, Depends
router = APIRouter(prefix="/api/v1/architect", tags=["architect"])

@router.post("/design")
async def design_system(request: ArchitectRequest, current_user = Depends(get_current_user)):
    if request.request_type == "design_from_scratch":
        return await architect_agent.design_system(request.description, request.scale)
    elif request.request_type == "review_existing":
        return await architect_agent.review_design(request.existing_design)
    elif request.request_type == "compare_approaches":
        return await architect_agent.compare_approaches(request.description, request.constraints)
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/architect_agent.py` |
| **NEW** | `backend/app/agents/architect_agent.py` |
| **NEW** | `backend/app/api/v1/architect.py` |
| **MODIFY** | `backend/app/main.py` — register router |
| **NEW** | `frontend/src/components/architect/SystemDesigner.tsx` |
