# 🧬 Agent 09: AI Self-Evolving Agent

> **Priority:** ⭐⭐ Tier 3 | **Effort:** 5-7 days | **Framework:** LangGraph + Custom

---

## 1. Overview

A meta-agent that monitors its own performance, collects user feedback, and iteratively improves its prompts, strategies, and configurations. Self-improving AI within the platform.

**Why:** All other agents benefit from continuous improvement. This agent creates the feedback loop.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│           SELF-EVOLVING AGENT                     │
│                                                    │
│  ┌────────────┐    ┌──────────────┐               │
│  │ Performance│    │ Prompt       │               │
│  │ Monitor    │───▶│ Optimizer    │               │
│  │            │    │              │               │
│  │• Latency   │    │• A/B test    │               │
│  │• Accuracy  │    │  prompts     │               │
│  │• User      │    │• Optimize    │               │
│  │  ratings   │    │  tokens      │               │
│  │• Error rate│    │• Tune        │               │
│  └────────────┘    │  temperature │               │
│                    └──────────────┘               │
│  ┌────────────┐    ┌──────────────┐               │
│  │ Feedback   │    │ Strategy     │               │
│  │ Collector  │───▶│ Evolver      │               │
│  │            │    │              │               │
│  │• Thumbs    │    │• Switch LLM  │               │
│  │  up/down   │    │• Add context │               │
│  │• Comments  │    │• Chain of    │               │
│  │• Usage     │    │  thought     │               │
│  └────────────┘    └──────────────┘               │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/self_evolving.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class FeedbackType(str, Enum):
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    RATING = "rating"
    COMMENT = "comment"

class AgentPerformanceLog(BaseModel):
    agent_name: str
    request_id: str
    latency_ms: float
    token_count: int
    success: bool
    user_feedback: Optional[FeedbackType] = None
    feedback_comment: Optional[str] = None
    prompt_version: str
    timestamp: datetime

class PromptVariant(BaseModel):
    variant_id: str
    agent_name: str
    prompt_text: str
    version: str
    performance_score: float = 0
    total_uses: int = 0
    positive_feedback_rate: float = 0
    avg_latency_ms: float = 0
    is_active: bool = True
    created_at: datetime

class EvolutionReport(BaseModel):
    report_id: str
    period: str
    agents_analyzed: List[str]
    improvements: List[Dict[str, Any]]
    recommendations: List[Dict[str, str]]
    prompt_changes: List[Dict[str, str]]
    overall_improvement_percent: float
```

---

## 4. Backend — `backend/app/agents/self_evolving_agent.py`

```python
import json, uuid
from datetime import datetime, timedelta
from typing import Dict, List
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.core.mongodb import get_database

class SelfEvolvingAgent:
    async def log_performance(self, agent_name: str, request_id: str,
                               latency_ms: float, success: bool, token_count: int):
        db = get_database()
        await db.agent_performance.insert_one({
            "agent_name": agent_name, "request_id": request_id,
            "latency_ms": latency_ms, "success": success, "token_count": token_count,
            "timestamp": datetime.utcnow()
        })

    async def record_feedback(self, request_id: str, feedback_type: str, comment: str = None):
        db = get_database()
        await db.agent_performance.update_one(
            {"request_id": request_id},
            {"$set": {"user_feedback": feedback_type, "feedback_comment": comment}}
        )

    async def analyze_performance(self, agent_name: str, days: int = 7) -> Dict:
        db = get_database()
        since = datetime.utcnow() - timedelta(days=days)
        logs = await db.agent_performance.find({
            "agent_name": agent_name, "timestamp": {"$gte": since}
        }).to_list(1000)

        if not logs:
            return {"message": "No performance data available"}

        total = len(logs)
        successes = sum(1 for l in logs if l.get("success"))
        avg_latency = sum(l.get("latency_ms", 0) for l in logs) / total
        positive = sum(1 for l in logs if l.get("user_feedback") == "thumbs_up")
        negative = sum(1 for l in logs if l.get("user_feedback") == "thumbs_down")

        return {
            "agent_name": agent_name,
            "period_days": days,
            "total_requests": total,
            "success_rate": successes / total,
            "avg_latency_ms": avg_latency,
            "positive_feedback": positive,
            "negative_feedback": negative,
            "satisfaction_rate": positive / (positive + negative) if (positive + negative) > 0 else None
        }

    async def optimize_prompt(self, agent_name: str, current_prompt: str,
                               performance_data: Dict) -> Dict:
        prompt = f"""Optimize this AI agent prompt based on performance data.

Agent: {agent_name}
Current prompt: {current_prompt[:2000]}
Performance: {json.dumps(performance_data)}

Suggest an improved prompt that:
1. Addresses failures (success rate: {performance_data.get('success_rate', 0):.0%})
2. Reduces token usage if possible
3. Improves user satisfaction

Return JSON: {{"optimized_prompt": "...", "changes_made": ["..."],
"expected_improvement": "...", "a_b_test_plan": "..."}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Prompt engineering expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def generate_evolution_report(self, days: int = 7) -> Dict:
        db = get_database()
        agent_names = await db.agent_performance.distinct("agent_name")
        analyses = {}
        for name in agent_names:
            analyses[name] = await self.analyze_performance(name, days)

        prompt = f"""Generate an evolution report for these AI agents.
Performance data: {json.dumps(analyses, default=str)[:3000]}

Return JSON: {{"agents_analyzed": [...], "improvements": [...],
"recommendations": [...], "overall_improvement_percent": 0}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "AI operations expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        data = json.loads(response[response.find('{'):response.rfind('}')+1])
        data["report_id"] = str(uuid.uuid4())
        data["period"] = f"{days}d"
        return data

self_evolving_agent = SelfEvolvingAgent()
```

### API — `backend/app/api/v1/agent_meta.py`

```python
@router.post("/feedback")
async def submit_feedback(request_id: str, feedback_type: str, comment: str = None):
    await self_evolving_agent.record_feedback(request_id, feedback_type, comment)

@router.get("/performance/{agent_name}")
async def get_performance(agent_name: str, days: int = 7):
    return await self_evolving_agent.analyze_performance(agent_name, days)

@router.get("/evolution-report")
async def evolution_report(days: int = 7):
    return await self_evolving_agent.generate_evolution_report(days)
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/self_evolving.py` |
| **NEW** | `backend/app/agents/self_evolving_agent.py` |
| **NEW** | `backend/app/api/v1/agent_meta.py` |
| **MODIFY** | `backend/app/main.py` — register router |
| **NEW** | `frontend/src/components/admin/AgentPerformance.tsx` |
