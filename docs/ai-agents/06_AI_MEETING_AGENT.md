# 📋 Agent 06: AI Meeting Agent

> **Priority:** ⭐⭐⭐ Tier 2 | **Effort:** 3-4 days | **Framework:** OpenAI Agents SDK

---

## 1. Overview

An AI meeting assistant that helps engineering students and teams run efficient study sessions, project standups, and group discussions. It transcribes, summarizes, generates action items, and integrates with Decision Vault for bias-free decisions.

**Why:** Your chat infrastructure + Decision Vault create a natural foundation for meeting intelligence.

### Existing Infrastructure

| Component | File |
|-----------|------|
| Chat Service | `backend/app/services/chat/` (3 files) |
| Chat API | `backend/app/api/v1/chat.py` (14KB) |
| Decision AI | `backend/app/services/ai/decision_ai.py` |
| Decision Vault | `backend/app/api/v1/decisions.py` |
| Memory Service | `backend/app/services/memory/` |

---

## 2. Architecture

```
┌──────────────────────────────────────────────┐
│            AI MEETING AGENT                   │
│                                                │
│  ┌───────────┐   ┌─────────────┐              │
│  │ Meeting   │──▶│ Summarizer  │──▶ Summary   │
│  │ Capture   │   └─────────────┘              │
│  │ (Chat/    │   ┌─────────────┐              │
│  │  Notes/   │──▶│ Action Item │──▶ Tasks     │
│  │  Audio)   │   │ Extractor   │              │
│  └───────────┘   └─────────────┘              │
│                  ┌─────────────┐              │
│                  │ Decision    │──▶ Decision  │
│                  │ Analyzer    │   Vault      │
│                  └─────────────┘              │
│                  ┌─────────────┐              │
│                  │ Follow-up   │──▶ Emails/   │
│                  │ Generator   │   Reminders  │
│                  └─────────────┘              │
└──────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/meeting_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class MeetingType(str, Enum):
    STUDY_SESSION = "study_session"
    PROJECT_STANDUP = "project_standup"
    GROUP_DISCUSSION = "group_discussion"
    BRAINSTORM = "brainstorm"
    REVIEW = "review"

class ActionItem(BaseModel):
    action_id: str
    assignee: Optional[str] = None
    description: str
    priority: str  # "high", "medium", "low"
    deadline: Optional[str] = None
    status: str = "pending"

class MeetingDecision(BaseModel):
    decision: str
    context: str
    alternatives_considered: List[str]
    bias_flags: List[Dict[str, str]]  # From Decision AI

class MeetingSummary(BaseModel):
    meeting_id: str
    meeting_type: MeetingType
    title: str
    date: datetime
    duration_minutes: int
    participants: List[str]
    summary: str
    key_points: List[str]
    action_items: List[ActionItem]
    decisions: List[MeetingDecision]
    follow_up_date: Optional[str] = None
    next_steps: List[str]

class MeetingRequest(BaseModel):
    meeting_type: MeetingType
    transcript: Optional[str] = None
    notes: Optional[str] = None
    chat_session_id: Optional[str] = None
    participants: List[str] = []
```

---

## 4. Backend — `backend/app/agents/meeting_agent.py`

```python
import json, uuid
from datetime import datetime
from typing import Dict, List, Optional
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.services.ai.decision_ai import DecisionAIService

class MeetingAgent:
    def __init__(self):
        self.decision_ai = DecisionAIService()

    async def process_meeting(self, transcript: str, meeting_type: str,
                               participants: List[str] = []) -> Dict:
        """Process meeting transcript into structured summary"""
        
        # Parallel extraction
        summary = await self._generate_summary(transcript, meeting_type)
        actions = await self._extract_action_items(transcript, participants)
        decisions = await self._extract_decisions(transcript)
        next_steps = await self._generate_next_steps(transcript, actions)
        
        # Run bias check on decisions
        for decision in decisions:
            flags = await self._check_decision_bias(decision)
            decision["bias_flags"] = flags
        
        return {
            "meeting_id": str(uuid.uuid4()),
            "meeting_type": meeting_type,
            "title": summary.get("title", "Untitled Meeting"),
            "date": datetime.utcnow().isoformat(),
            "participants": participants,
            "summary": summary.get("summary", ""),
            "key_points": summary.get("key_points", []),
            "action_items": actions,
            "decisions": decisions,
            "next_steps": next_steps
        }

    async def _generate_summary(self, transcript: str, meeting_type: str) -> Dict:
        prompt = f"""Summarize this {meeting_type} meeting transcript.
Transcript: {transcript[:4000]}
Return JSON: {{"title": "...", "summary": "2-3 paragraphs", "key_points": ["..."],
"duration_estimate_minutes": 30}}"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Meeting summarizer. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def _extract_action_items(self, transcript: str, participants: List) -> List:
        prompt = f"""Extract action items from this meeting.
Transcript: {transcript[:3000]}
Participants: {participants}
Return JSON array: [{{"action_id": "a1", "assignee": "name", "description": "...",
"priority": "high|medium|low", "deadline": "if mentioned"}}]"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Project manager. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

    async def _extract_decisions(self, transcript: str) -> List:
        prompt = f"""Extract decisions made in this meeting.
Transcript: {transcript[:3000]}
Return JSON array: [{{"decision": "...", "context": "...",
"alternatives_considered": ["..."]}}]"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Decision analyst. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

    async def _check_decision_bias(self, decision: Dict) -> List:
        """Use existing Decision AI to check for bias"""
        try:
            from app.schemas.decision import DecisionBase
            d = DecisionBase(
                title=decision.get("decision", ""),
                description=decision.get("context", ""),
                options=decision.get("alternatives_considered", [])
            )
            flags = await self.decision_ai.analyze_decision(d)
            return flags
        except Exception:
            return []

    async def _generate_next_steps(self, transcript: str, actions: List) -> List[str]:
        prompt = f"""Based on actions: {json.dumps(actions[:5])}
Generate 3-5 concrete next steps. Return JSON array of strings."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

meeting_agent = MeetingAgent()
```

### API — `backend/app/api/v1/meeting.py`

```python
from fastapi import APIRouter, Depends
from app.agents.meeting_agent import meeting_agent
from app.schemas.meeting_agent import MeetingRequest

router = APIRouter(prefix="/api/v1/meeting", tags=["meeting"])

@router.post("/process")
async def process_meeting(request: MeetingRequest, current_user = Depends(get_current_user)):
    transcript = request.transcript or request.notes or ""
    return await meeting_agent.process_meeting(
        transcript, request.meeting_type, request.participants
    )
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/meeting_agent.py` |
| **NEW** | `backend/app/agents/meeting_agent.py` |
| **NEW** | `backend/app/api/v1/meeting.py` |
| **MODIFY** | `backend/app/main.py` — register meeting router |
| **NEW** | `frontend/src/components/meeting/MeetingSummary.tsx` |
