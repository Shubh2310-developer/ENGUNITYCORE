# 🧠 Agent 05: AI Mental Wellbeing Agent

> **Priority:** ⭐⭐⭐⭐ Tier 2 | **Effort:** 2-3 days | **Framework:** OpenAI Agents SDK or Google ADK

---

## 1. Overview

Detects burnout patterns from usage data, provides gentle check-ins, stress management tips, and study break reminders. Engineering students face high stress — your platform already has the signals.

**Why:** You track usage patterns, skill progress, practice attempts, and session durations in `analytics`. These are perfect burnout detection signals.

### Existing Infrastructure

| Component | File |
|-----------|------|
| Analytics | `backend/app/services/analytics/` + `api/v1/analytics_complete.py` |
| Memory | `backend/app/services/memory/` |
| Chat | `backend/app/services/chat/` |
| MongoDB | `backend/app/core/mongodb.py` |

---

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│         MENTAL WELLBEING AGENT               │
│                                               │
│  ┌─────────────┐    ┌──────────────────┐     │
│  │ Pattern     │    │ Intervention     │     │
│  │ Detector    │───▶│ Engine           │     │
│  │             │    │                  │     │
│  │• Late-night │    │• Break reminders │     │
│  │  sessions   │    │• Encouragement   │     │
│  │• Declining  │    │• Study tips      │     │
│  │  engagement │    │• Streak rewards  │     │
│  │• Long       │    │• Focus sessions  │     │
│  │  marathons  │    │• Cool-down       │     │
│  │• Error      │    │  suggestions     │     │
│  │  frustration│    │                  │     │
│  └─────────────┘    └──────────────────┘     │
└─────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/wellbeing_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class WellbeingSignal(str, Enum):
    LATE_NIGHT = "late_night"       # Active after midnight
    MARATHON = "marathon"           # 4+ hour continuous session
    DECLINING = "declining"         # Less activity over time
    FRUSTRATION = "frustration"     # High error rate, rapid retries
    STREAK_BREAK = "streak_break"   # Broke learning streak
    OVERWORK = "overwork"           # 10+ hours in a day

class InterventionType(str, Enum):
    BREAK_REMINDER = "break_reminder"
    ENCOURAGEMENT = "encouragement"
    STUDY_TIP = "study_tip"
    FOCUS_SESSION = "focus_session"
    COOLDOWN = "cooldown"
    CELEBRATION = "celebration"

class WellbeingCheck(BaseModel):
    signals_detected: List[WellbeingSignal]
    overall_status: str  # "healthy", "caution", "concern"
    stress_score: float = Field(ge=0, le=10)
    intervention: Optional[Dict] = None
    message: str
    tips: List[str]

class WellbeingAnalyticsRequest(BaseModel):
    check_period: str = "24h"  # 24h, 7d, 30d

class PomodoroSession(BaseModel):
    focus_minutes: int = 25
    break_minutes: int = 5
    rounds: int = 4
    topic: Optional[str] = None
```

---

## 4. Backend — `backend/app/agents/wellbeing_agent.py`

```python
import json
from datetime import datetime, timedelta
from typing import Dict, List
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.core.mongodb import get_database

class WellbeingAgent:
    SIGNAL_THRESHOLDS = {
        "late_night_hour": 23,       # After 11 PM
        "marathon_hours": 4,         # 4+ hour session
        "overwork_hours": 10,        # 10+ hours/day
        "frustration_error_rate": 0.7,  # 70%+ errors in last 10 actions
    }

    async def check_wellbeing(self, user_id: str, period: str = "24h") -> Dict:
        """Run comprehensive wellbeing check"""
        signals = await self._detect_signals(user_id, period)
        stress_score = self._calculate_stress(signals)
        status = "healthy" if stress_score < 3 else "caution" if stress_score < 6 else "concern"
        
        intervention = None
        if stress_score > 4:
            intervention = await self._generate_intervention(signals, stress_score)
        
        message = await self._generate_message(signals, stress_score, status)
        tips = await self._get_tips(signals)
        
        return {
            "signals_detected": signals,
            "overall_status": status,
            "stress_score": stress_score,
            "intervention": intervention,
            "message": message,
            "tips": tips
        }

    async def _detect_signals(self, user_id: str, period: str) -> List[str]:
        db = get_database()
        signals = []
        
        hours = {"24h": 24, "7d": 168, "30d": 720}.get(period, 24)
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # Check for late-night activity
        late_sessions = await db.analytics_events.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": since},
            "$expr": {"$gte": [{"$hour": "$created_at"}, self.SIGNAL_THRESHOLDS["late_night_hour"]]}
        })
        if late_sessions > 3:
            signals.append("late_night")
        
        # Check for marathon sessions (4+ hours continuous)
        # Check for high error rates (frustration)
        # Check for declining engagement
        
        return signals

    def _calculate_stress(self, signals: List[str]) -> float:
        weights = {"late_night": 2, "marathon": 3, "overwork": 4, "frustration": 3, 
                   "declining": 1, "streak_break": 1}
        return min(10, sum(weights.get(s, 1) for s in signals))

    async def _generate_intervention(self, signals, stress) -> Dict:
        if "overwork" in signals or "marathon" in signals:
            return {"type": "break_reminder", "message": "You've been working hard! Take a 15-min break 🌿",
                    "action": "start_break_timer", "duration": 15}
        if "frustration" in signals:
            return {"type": "cooldown", "message": "Stuck? Try explaining the problem out loud 🗣️",
                    "action": "suggest_rubber_duck", "tip": "Sometimes stepping away helps"}
        if "late_night" in signals:
            return {"type": "encouragement", "message": "Great dedication! But good sleep = better code 😴",
                    "action": "suggest_sleep", "tip": "Studies show 8h sleep improves problem-solving by 40%"}
        return {"type": "encouragement", "message": "Keep going, you're doing great! 💪"}

    async def _generate_message(self, signals, stress, status) -> str:
        if status == "healthy":
            return "You're maintaining a healthy study rhythm! Keep it up! 🌟"
        prompt = f"Generate a caring, brief wellbeing message for a student showing: {signals}. Stress: {stress}/10."
        return await groq_client.get_completion([
            {"role": "system", "content": "Caring mentor. Brief, warm, actionable."},
            {"role": "user", "content": prompt}
        ])

    async def _get_tips(self, signals) -> List[str]:
        tips_db = {
            "late_night": ["Set a 'study curfew' — your brain learns better after sleep",
                          "Try morning coding sessions, many devs report 2x productivity"],
            "marathon": ["Use the Pomodoro Technique: 25 min focus + 5 min break",
                        "Stand up and stretch every 45 minutes"],
            "frustration": ["Rubber duck debugging: explain your code to a rubber duck",
                           "Take a walk, come back with fresh eyes"],
            "overwork": ["Quality > quantity: 4 focused hours beat 10 distracted hours",
                        "Schedule rest days — top athletes do, and so should you"],
        }
        result = []
        for signal in signals:
            result.extend(tips_db.get(signal, ["Stay hydrated and take breaks! 💧"]))
        return result[:5]

wellbeing_agent = WellbeingAgent()
```

### API — Add to main or create new router

```python
@router.get("/wellbeing/check")
async def wellbeing_check(period: str = "24h", current_user = Depends(get_current_user)):
    return await wellbeing_agent.check_wellbeing(str(current_user.id), period)

@router.post("/wellbeing/pomodoro")
async def start_pomodoro(session: PomodoroSession, current_user = Depends(get_current_user)):
    return {"status": "started", "focus_minutes": session.focus_minutes,
            "break_minutes": session.break_minutes, "topic": session.topic}
```

---

## 5. Frontend — Notification Banner + Widget

```tsx
// frontend/src/components/shared/WellbeingWidget.tsx
'use client';
import React, { useEffect, useState } from 'react';

export default function WellbeingWidget() {
  const [check, setCheck] = useState<any>(null);

  useEffect(() => {
    const checkWellbeing = async () => {
      const res = await fetch('/api/v1/wellbeing/check', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCheck(await res.json());
    };
    checkWellbeing();
    const interval = setInterval(checkWellbeing, 30 * 60 * 1000); // Every 30 min
    return () => clearInterval(interval);
  }, []);

  if (!check || check.overall_status === 'healthy') return null;

  return (
    <div className={`wellbeing-banner ${check.overall_status}`}>
      <span>{check.intervention?.message || check.message}</span>
      {check.intervention?.action === 'start_break_timer' && (
        <button onClick={() => alert('Break timer started!')}>⏱️ Start Break</button>
      )}
    </div>
  );
}
```

---

## 6. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/wellbeing_agent.py` |
| **NEW** | `backend/app/agents/wellbeing_agent.py` |
| **NEW** | `backend/app/api/v1/wellbeing.py` |
| **MODIFY** | `backend/app/main.py` — register router |
| **NEW** | `frontend/src/components/shared/WellbeingWidget.tsx` |
| **MODIFY** | `frontend/src/app/(dashboard)/layout.tsx` — add widget |
