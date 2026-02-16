# 🤝 Agent 03: AI Career Consultant Agent

> **Priority:** ⭐⭐⭐⭐⭐ Tier 1 | **Effort:** 3-5 days | **Framework:** Google ADK

---

## 1. Overview

An **intelligent career coaching agent** that analyzes student skills, target roles, and market trends to provide personalized career guidance, mock interviews, resume feedback, and study plans.

**Why:** Your `jobprep` module has 352 lines of rich schemas (profiles, roles, skills, evidence) but no AI brain driving recommendations.

### Existing Infrastructure

| Component | File |
|-----------|------|
| Job Prep Schemas | `backend/app/schemas/jobprep.py` (352 lines) |
| Job Prep Service | `backend/app/services/jobprep/` |
| Job Prep API | `backend/app/api/v1/jobprep.py` (14KB) |
| Job Prep UI | `frontend/src/components/jobprep/` (8 files) |
| Web Search | `backend/app/services/rag/web_search.py` |
| Decision AI | `backend/app/services/ai/decision_ai.py` |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│            CAREER CONSULTANT AGENT                │
│                                                    │
│  ┌────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Gap        │  │ Mock         │  │ Market    │ │
│  │ Analyzer   │  │ Interviewer  │  │ Intel     │ │
│  │• Skill gaps│  │• Adaptive Q  │  │• Job trend│ │
│  │• Study plan│  │• Scoring     │  │• Salary   │ │
│  │• Milestones│  │• Feedback    │  │• Demand   │ │
│  └────────────┘  └──────────────┘  └───────────┘ │
│  ┌────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Resume     │  │ Progress     │  │ Weekly    │ │
│  │ Analyzer   │  │ Tracker      │  │ Reports   │ │
│  │• ATS score │  │• Trends      │  │• Actions  │ │
│  │• Keywords  │  │• Velocity    │  │• Motivation│ │
│  └────────────┘  └──────────────┘  └───────────┘ │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/career_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ConsultationType(str, Enum):
    GAP_ANALYSIS = "gap_analysis"
    MOCK_INTERVIEW = "mock_interview"
    RESUME_REVIEW = "resume_review"
    MARKET_RESEARCH = "market_research"
    STUDY_PLAN = "study_plan"
    WEEKLY_REPORT = "weekly_report"

class SkillGap(BaseModel):
    skill_name: str
    current_level: int = Field(ge=0, le=5)
    required_level: int = Field(ge=1, le=5)
    gap_severity: str  # "critical", "moderate", "minor"
    priority: int = Field(ge=1, le=10)
    recommended_resources: List[Dict[str, str]]
    estimated_time_hours: int
    practice_suggestions: List[str]

class StudyPlan(BaseModel):
    plan_id: str
    target_role: str
    duration_weeks: int
    weekly_schedule: List[Dict[str, Any]]
    milestones: List[Dict[str, str]]
    priority_order: List[str]

class InterviewQuestion(BaseModel):
    question_id: str
    question: str
    category: str  # "technical", "behavioral", "system_design"
    difficulty: str
    expected_topics: List[str]
    time_limit_minutes: int = 5
    follow_up_questions: List[str]

class InterviewEvaluation(BaseModel):
    question_id: str
    score: float = Field(ge=0, le=10)
    feedback: str
    strengths: List[str]
    improvements: List[str]
    model_answer: str

class MarketIntelligence(BaseModel):
    role: str
    demand_level: str
    salary_range: Dict[str, int]
    top_skills_required: List[Dict[str, Any]]
    top_companies_hiring: List[str]
    growth_trend: str
    advice: str

class ResumeAnalysis(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    ats_compatibility: float = Field(ge=0, le=100)
    strengths: List[str]
    weaknesses: List[str]
    missing_keywords: List[str]
    content_suggestions: List[Dict[str, str]]

class WeeklyReport(BaseModel):
    report_date: datetime
    summary: str
    skills_improved: List[Dict[str, Any]]
    skills_stagnant: List[str]
    readiness_delta: float
    next_week_priorities: List[str]
    motivational_note: str
    suggested_actions: List[Dict[str, str]]

class CareerConsultRequest(BaseModel):
    consultation_type: ConsultationType
    message: Optional[str] = None
    target_role_id: Optional[str] = None
    resume_file_url: Optional[str] = None
    interview_answer: Optional[str] = None

class CareerConsultResponse(BaseModel):
    consultation_type: ConsultationType
    gap_analysis: Optional[List[SkillGap]] = None
    study_plan: Optional[StudyPlan] = None
    market_intelligence: Optional[MarketIntelligence] = None
    resume_analysis: Optional[ResumeAnalysis] = None
    weekly_report: Optional[WeeklyReport] = None
    processing_time: float = 0
```

---

## 4. Backend — `backend/app/agents/career_consultant_agent.py`

```python
import json, uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.services.rag.web_search import WebSearchFallback

class CareerConsultantAgent:
    def __init__(self):
        self.web_search = WebSearchFallback()

    async def analyze_skill_gaps(self, profile, target_role, skills) -> List:
        prompt = f"""Analyze skill gaps. Profile: {json.dumps(profile, default=str)[:500]}
Target: {json.dumps(target_role, default=str)[:500]}
Skills: {json.dumps(skills, default=str)[:1000]}
Return JSON array of gaps with: skill_name, current_level(0-5), required_level(1-5),
gap_severity, priority(1-10), recommended_resources, estimated_time_hours, practice_suggestions."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Expert career coach. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

    async def generate_study_plan(self, gaps, target_role, weeks=12) -> Dict:
        prompt = f"""Create {weeks}-week study plan for {target_role}.
Gaps: {json.dumps([{{'skill': g.skill_name, 'priority': g.priority}} for g in gaps])}
Return JSON with: plan_id, target_role, duration_weeks, weekly_schedule, milestones, priority_order."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Expert education planner. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def start_mock_interview(self, target_role, difficulty="medium", num=5) -> List:
        prompt = f"""Generate {num} realistic interview questions for {target_role} ({difficulty}).
Return JSON array with: question_id, question, category, difficulty, expected_topics,
time_limit_minutes, follow_up_questions."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Experienced tech interviewer. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

    async def evaluate_answer(self, question, answer, target_role) -> Dict:
        prompt = f"""Evaluate interview answer for {target_role}.
Q: {question.question} | Expected: {question.expected_topics}
Answer: {answer}
Return JSON: question_id, score(0-10), feedback, strengths, improvements, model_answer."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Fair interviewer. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def research_market(self, role, location="global") -> Dict:
        search_results = await self.web_search.search(f"{role} job market 2026 salary {location}")
        prompt = f"""Market intelligence for {role} ({location}).
Context: {json.dumps(search_results[:3], default=str)}
Return JSON: role, demand_level, salary_range(min/median/max), top_skills_required,
top_companies_hiring, growth_trend, advice."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Career market analyst. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def analyze_resume(self, resume_text, target_role) -> Dict:
        prompt = f"""Analyze resume for {target_role}.
Resume: {resume_text[:3000]}
Return JSON: overall_score(0-100), ats_compatibility(0-100), strengths, weaknesses,
missing_keywords, content_suggestions, tailored_tips."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Resume expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def generate_weekly_report(self, profile, skills, target_role) -> Dict:
        prompt = f"""Weekly progress report. Target: {target_role}
Profile: {json.dumps(profile, default=str)[:500]}
Skills: {json.dumps(skills, default=str)[:1000]}
Return JSON: report_date, summary, skills_improved, skills_stagnant, readiness_delta,
next_week_priorities, motivational_note, suggested_actions."""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Encouraging career coach. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

career_consultant = CareerConsultantAgent()
```

### API — Add to `backend/app/api/v1/jobprep.py`

```python
@router.post("/consult")
async def career_consultation(request: CareerConsultRequest, current_user = Depends(get_current_user)):
    profile = await get_user_profile(current_user.id, db)
    skills = await get_user_skills(current_user.id, db)
    target_role = await get_target_role(request.target_role_id, db)

    if request.consultation_type == "gap_analysis":
        return await career_consultant.analyze_skill_gaps(profile, target_role, skills)
    elif request.consultation_type == "study_plan":
        gaps = await career_consultant.analyze_skill_gaps(profile, target_role, skills)
        return await career_consultant.generate_study_plan(gaps, target_role["role_title"])
    elif request.consultation_type == "mock_interview":
        return await career_consultant.start_mock_interview(target_role["role_title"])
    elif request.consultation_type == "market_research":
        return await career_consultant.research_market(target_role["role_title"])
    elif request.consultation_type == "resume_review":
        text = await extract_resume_text(request.resume_file_url)
        return await career_consultant.analyze_resume(text, target_role["role_title"])
    elif request.consultation_type == "weekly_report":
        return await career_consultant.generate_weekly_report(profile, skills, target_role["role_title"])
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/career_agent.py` |
| **NEW** | `backend/app/agents/career_consultant_agent.py` |
| **MODIFY** | `backend/app/api/v1/jobprep.py` — add `/consult` |
| **NEW** | `frontend/src/components/jobprep/CareerConsultant.tsx` |
| **NEW** | `tests/test_career_consultant.py` |
