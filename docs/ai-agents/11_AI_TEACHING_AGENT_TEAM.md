# 👨‍🏫 Agent 11: AI Teaching Agent Team

> **Priority:** ⭐⭐ Tier 3 | **Effort:** 6-8 days | **Framework:** CrewAI + LangGraph

---

## 1. Overview

A **multi-agent teaching system** with specialized agents for different educational roles: Instructor, Tutor, Quiz Master, and Lab Assistant. This is the flagship educational feature.

**Why:** Engunity is an education platform — an AI teaching team unlocks personalized education at scale.

### Agent Team Members

| Agent | Role | Style |
|-------|------|-------|
| 🎓 **Instructor** | Explains concepts from first principles | Socratic method, builds intuition |
| 📝 **Tutor** | Helps with specific problems, guided hints | Patient, never gives direct answers first |
| 🧩 **Quiz Master** | Generates adaptive quizzes, tracks mastery | Adjusts difficulty based on performance |
| 🔬 **Lab Assistant** | Guides hands-on coding exercises | Step-by-step with Code Lab integration |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│           AI TEACHING AGENT TEAM                  │
│                                                    │
│  ┌────────────┐    ┌──────────────┐               │
│  │ Instructor │    │ Student      │               │
│  │            │───▶│ Model        │◀──────┐       │
│  │• Explains  │    │              │       │       │
│  │• Analogies │    │• Knowledge   │       │       │
│  │• Examples  │    │• Skill level │       │       │
│  └────────────┘    │• Weaknesses  │       │       │
│                    │• Learning    │       │       │
│  ┌────────────┐    │  style pref  │  ┌────┴────┐  │
│  │ Tutor      │───▶│              │  │ Quiz    │  │
│  │            │    └──────────────┘  │ Master  │  │
│  │• Guided    │                      │         │  │
│  │  hints     │    ┌──────────────┐  │• Adaptive│  │
│  │• Step-by-  │    │ Lab          │  │  quizzes│  │
│  │  step      │    │ Assistant    │  │• Track  │  │
│  └────────────┘    │              │  │  mastery│  │
│                    │• Code tasks  │  └─────────┘  │
│                    │• Execution   │               │
│                    └──────────────┘               │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/teaching_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class TeachingMode(str, Enum):
    EXPLAIN = "explain"      # Instructor
    TUTOR = "tutor"          # Tutor
    QUIZ = "quiz"            # Quiz Master
    LAB = "lab"              # Lab Assistant

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class StudentModel(BaseModel):
    user_id: str
    knowledge_map: Dict[str, float]  # topic -> mastery (0-1)
    learning_style: str  # "visual", "verbal", "hands-on"
    difficulty_preference: DifficultyLevel
    weak_areas: List[str]
    strong_areas: List[str]

class LessonContent(BaseModel):
    topic: str
    explanation: str
    analogies: List[str]
    examples: List[Dict[str, str]]  # input, output, explanation
    key_takeaways: List[str]
    prerequisites: List[str]
    next_topics: List[str]

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    difficulty: DifficultyLevel
    topic: str
    hint: Optional[str] = None

class QuizResult(BaseModel):
    total_questions: int
    correct: int
    score_percent: float
    topic_scores: Dict[str, float]
    weak_areas: List[str]
    recommendations: List[str]

class CodingExercise(BaseModel):
    title: str
    description: str
    starter_code: str
    test_cases: List[Dict[str, str]]  # input, expected_output
    hints: List[str]
    solution: str
    difficulty: DifficultyLevel

class TeachRequest(BaseModel):
    mode: TeachingMode
    topic: str
    message: Optional[str] = None
    code: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.INTERMEDIATE
    num_questions: int = 5
```

---

## 4. Backend — `backend/app/agents/teaching_agent.py`

```python
import json
from typing import Dict, List
from loguru import logger
from app.services.ai.groq_client import groq_client

class InstructorAgent:
    async def explain(self, topic: str, student_level: str = "intermediate") -> Dict:
        prompt = f"""Explain "{topic}" for a {student_level} engineering student.
Use the Socratic method. Build intuition before formulas.
Return JSON: {{"topic": "...", "explanation": "multi-paragraph clear explanation",
"analogies": ["real-world analogy 1"], "examples": [{{"input": "...", "output": "...",
"explanation": "..."}}], "key_takeaways": ["..."], "prerequisites": ["..."],
"next_topics": ["..."]}}"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Expert CS professor. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

class TutorAgent:
    async def help(self, topic: str, question: str, student_code: str = None) -> Dict:
        code_ctx = f"\nStudent's code:\n```\n{student_code}\n```" if student_code else ""
        prompt = f"""A student asks about {topic}: {question}{code_ctx}
Don't give the answer directly. Use guided hints.
Return JSON: {{"hint": "guiding hint", "guiding_questions": ["think about..."],
"next_step": "try doing X", "explanation_if_stuck": "detailed help if needed"}}"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Patient tutor. Guide, don't give answers. JSON only."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

class QuizMasterAgent:
    async def generate_quiz(self, topic: str, difficulty: str, num: int = 5) -> List[Dict]:
        prompt = f"""Generate {num} multiple-choice quiz questions on {topic} ({difficulty}).
Return JSON array: [{{"question": "...", "options": ["A", "B", "C", "D"],
"correct_answer": 0, "explanation": "...", "difficulty": "{difficulty}",
"topic": "{topic}", "hint": "..."}}]"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Expert quiz maker. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

    async def evaluate_quiz(self, questions: List[Dict], answers: List[int]) -> Dict:
        correct = sum(1 for q, a in zip(questions, answers) if q["correct_answer"] == a)
        total = len(questions)
        weak = [q["topic"] for q, a in zip(questions, answers) if q["correct_answer"] != a]
        return {
            "total_questions": total, "correct": correct,
            "score_percent": (correct / total) * 100 if total else 0,
            "weak_areas": list(set(weak)),
            "recommendations": [f"Review: {t}" for t in set(weak)]
        }

class LabAssistantAgent:
    async def generate_exercise(self, topic: str, difficulty: str) -> Dict:
        prompt = f"""Create a coding exercise on {topic} ({difficulty}).
Return JSON: {{"title": "...", "description": "...", "starter_code": "...",
"test_cases": [{{"input": "...", "expected_output": "..."}}],
"hints": ["..."], "solution": "...", "difficulty": "{difficulty}"}}"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Coding exercise creator. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

# Singletons
instructor = InstructorAgent()
tutor = TutorAgent()
quiz_master = QuizMasterAgent()
lab_assistant = LabAssistantAgent()
```

### API — `backend/app/api/v1/teaching.py`

```python
@router.post("/teach")
async def teach(request: TeachRequest, current_user = Depends(get_current_user)):
    if request.mode == "explain":
        return await instructor.explain(request.topic, request.difficulty)
    elif request.mode == "tutor":
        return await tutor.help(request.topic, request.message, request.code)
    elif request.mode == "quiz":
        return await quiz_master.generate_quiz(request.topic, request.difficulty, request.num_questions)
    elif request.mode == "lab":
        return await lab_assistant.generate_exercise(request.topic, request.difficulty)
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/teaching_agent.py` |
| **NEW** | `backend/app/agents/teaching_agent.py` |
| **NEW** | `backend/app/api/v1/teaching.py` |
| **MODIFY** | `backend/app/main.py` — register router |
| **NEW** | `frontend/src/components/teaching/` (4 components) |
