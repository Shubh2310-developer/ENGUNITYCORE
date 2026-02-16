# 🔄 Agent 08: AI Research Planner & Executor

> **Priority:** ⭐⭐⭐ Tier 2 | **Effort:** 4-6 days | **Framework:** Google ADK + LangGraph

---

## 1. Overview

A long-running research agent that plans multi-step research projects, breaks them into phases, executes them over days/weeks, and tracks progress. Builds on Agent 01 (Deep Research) for execution.

**Why:** Agent 01 handles single queries; this agent orchestrates multi-query, multi-day research campaigns.

### Existing Infrastructure

| Component | File |
|-----------|------|
| OmniRAG Pipeline | `backend/app/services/rag/pipeline.py` |
| Web Search | `backend/app/services/rag/web_search.py` |
| Research API | `backend/app/api/v1/research.py` |
| Planner Stub | `backend/app/agents/planner_agent.py` (empty) |
| Memory | `backend/app/services/memory/` |
| Document Processing | `backend/app/services/documents/` |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│        RESEARCH PLANNER & EXECUTOR                │
│                                                    │
│  ┌────────────┐                                    │
│  │ Plan       │ Break topic into sub-questions,   │
│  │ Generator  │ define phases, estimate time       │
│  └─────┬──────┘                                    │
│        │                                           │
│  ┌─────▼──────┐                                    │
│  │ Phase      │ Execute each phase using          │
│  │ Executor   │ Deep Research Agent (Agent 01)     │
│  └─────┬──────┘                                    │
│        │                                           │
│  ┌─────▼──────┐                                    │
│  │ Synthesizer│ Merge phase results,              │
│  │            │ identify gaps, iterate             │
│  └─────┬──────┘                                    │
│        │                                           │
│  ┌─────▼──────┐                                    │
│  │ Report     │ Generate final research paper     │
│  │ Generator  │ with citations and confidence     │
│  └────────────┘                                    │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/research_planner.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PlanStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class ResearchPhase(BaseModel):
    phase_id: str
    title: str
    description: str
    sub_queries: List[str]
    estimated_hours: float
    status: PlanStatus = PlanStatus.DRAFT
    results: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ResearchPlan(BaseModel):
    plan_id: str
    topic: str
    objective: str
    phases: List[ResearchPhase]
    total_estimated_hours: float
    status: PlanStatus = PlanStatus.DRAFT
    created_at: datetime
    progress_percent: float = 0

class ResearchPlanRequest(BaseModel):
    topic: str
    depth: str = "comprehensive"  # "quick", "moderate", "comprehensive"
    max_phases: int = 5
    focus_areas: Optional[List[str]] = None

class ResearchPlanResponse(BaseModel):
    plan: ResearchPlan
    recommended_timeline: str
    estimated_total_sources: int
```

---

## 4. Backend — `backend/app/agents/planner_agent.py`

```python
import json, uuid
from datetime import datetime
from typing import Dict, List, Optional
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.services.rag.pipeline import OmniRAGPipeline

class ResearchPlannerAgent:
    def __init__(self):
        self.rag = OmniRAGPipeline()

    async def create_plan(self, topic: str, depth: str = "comprehensive",
                          max_phases: int = 5, focus_areas: List[str] = None) -> Dict:
        prompt = f"""Create a research plan for: {topic}
Depth: {depth} | Max phases: {max_phases}
Focus areas: {focus_areas or 'auto-determine'}

Return JSON:
{{
  "plan_id": "plan_{uuid.uuid4().hex[:8]}",
  "topic": "{topic}",
  "objective": "Clear research objective",
  "phases": [
    {{
      "phase_id": "p1",
      "title": "Phase title",
      "description": "What this phase investigates",
      "sub_queries": ["specific search query 1", "query 2"],
      "estimated_hours": 2
    }}
  ],
  "total_estimated_hours": 10
}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Research methodology expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        data = json.loads(response[response.find('{'):response.rfind('}')+1])
        data["status"] = "draft"
        data["created_at"] = datetime.utcnow().isoformat()
        data["progress_percent"] = 0
        return data

    async def execute_phase(self, phase: Dict, user_id: str) -> Dict:
        """Execute a single research phase using OmniRAG"""
        results = {}
        for query in phase.get("sub_queries", []):
            try:
                result = await self.rag.process_query(
                    query=query, user_id=user_id, strategy="deep"
                )
                results[query] = {
                    "answer": result.get("response", ""),
                    "sources": result.get("sources", []),
                    "confidence": result.get("confidence", 0)
                }
            except Exception as e:
                results[query] = {"error": str(e)}
        
        phase["results"] = results
        phase["status"] = "completed"
        phase["completed_at"] = datetime.utcnow().isoformat()
        return phase

    async def synthesize_results(self, plan: Dict) -> Dict:
        """Synthesize all phase results into a coherent report"""
        all_results = []
        for phase in plan.get("phases", []):
            if phase.get("results"):
                all_results.append({
                    "phase": phase["title"],
                    "findings": phase["results"]
                })
        
        prompt = f"""Synthesize these research findings into a comprehensive report.
Topic: {plan['topic']}
Findings: {json.dumps(all_results, default=str)[:5000]}

Return JSON:
{{
  "executive_summary": "...",
  "key_findings": ["..."],
  "detailed_sections": [{{"title": "...", "content": "...", "sources": ["..."]}}],
  "gaps_identified": ["Areas needing more research"],
  "confidence_score": 0.85,
  "recommendations": ["..."]
}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Research synthesizer. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

planner_agent = ResearchPlannerAgent()
```

### API — Modify `backend/app/api/v1/research.py`

```python
@router.post("/plan")
async def create_research_plan(request: ResearchPlanRequest, current_user = Depends(get_current_user)):
    return await planner_agent.create_plan(request.topic, request.depth, request.max_phases)

@router.post("/plan/{plan_id}/execute/{phase_id}")
async def execute_phase(plan_id: str, phase_id: str, current_user = Depends(get_current_user)):
    # Fetch plan from DB, find phase, execute
    plan = await get_plan_from_db(plan_id)
    phase = next(p for p in plan["phases"] if p["phase_id"] == phase_id)
    return await planner_agent.execute_phase(phase, str(current_user.id))

@router.post("/plan/{plan_id}/synthesize")
async def synthesize_plan(plan_id: str, current_user = Depends(get_current_user)):
    plan = await get_plan_from_db(plan_id)
    return await planner_agent.synthesize_results(plan)
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **MODIFY** | `backend/app/agents/planner_agent.py` — implement from empty |
| **NEW** | `backend/app/schemas/research_planner.py` |
| **MODIFY** | `backend/app/api/v1/research.py` — add plan endpoints |
| **NEW** | `frontend/src/components/research/ResearchPlanner.tsx` |
