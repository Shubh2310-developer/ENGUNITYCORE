# 💻 Agent 02: Multimodal Coding Agent Team

> **Priority:** ⭐⭐⭐⭐⭐ Tier 1  
> **Effort:** 3-5 days  
> **Status:** Code Lab infrastructure complete, `code_review_agent.py` empty  
> **Framework:** LangGraph (multi-agent state machine)

---

## 1. Overview

### What It Does
A **team of four specialized coding agents** that work together to review, refactor, debug, and generate code. Each agent has a specific role but shares context through a unified state.

### Agent Team Members

| Agent | Role | Trigger |
|-------|------|---------|
| 🔍 **Code Reviewer** | Analyze code for bugs, security, performance, style | User submits code for review |
| ♻️ **Code Refactorer** | Suggest and apply improvements with explanations | After review or on-demand |
| 🐛 **Debug Agent** | Diagnose errors from output + code → suggest/auto-fix | Error detected in Code Lab |
| ⚡ **Code Generator** | Generate boilerplate, tests, docs from natural language | User describes what to build |

### Existing Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| Code Executor | `backend/app/services/code_execution/` | Sandboxed multi-language execution |
| Code API | `backend/app/api/v1/code.py` (27KB) | Full code execution endpoints |
| Terminal WS | `backend/app/api/v1/terminal.py` | WebSocket terminal |
| GitHub Integration | `backend/app/services/github/` (6 files) | Repo analysis, code fetching |
| Code Lab UI | `frontend/src/components/code-lab/` (19 files) | Full IDE-like UI |
| Groq/Gemini LLM | `backend/app/services/ai/groq_client.py`, `gemini_client.py` | LLM backbone |
| Agent Stub | `backend/app/agents/code_review_agent.py` | Empty — ready to implement |

---

## 2. Architecture

### Multi-Agent State Machine (LangGraph)

```
                    ┌─────────────────────────────────┐
                    │         USER REQUEST             │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │     ROUTING AGENT (Classifier)   │
                    │  Determines which agent(s) needed │
                    └──┬────────┬──────────┬────────┬─┘
                       │        │          │        │
              ┌────────▼──┐ ┌──▼────────┐ ┌▼──────┐ ┌▼──────────┐
              │ REVIEWER  │ │REFACTORER │ │DEBUGGER│ │GENERATOR  │
              │           │ │           │ │        │ │           │
              │• Security │ │• Clean    │ │• Error │ │• Boiler-  │
              │• Bugs     │ │  code     │ │  parse │ │  plate    │
              │• Perf     │ │• Patterns │ │• Root  │ │• Tests    │
              │• Style    │ │• SOLID    │ │  cause │ │• Docs     │
              │• Best     │ │• DRY      │ │• Fix   │ │• Scaffold │
              │  practices│ │           │ │        │ │           │
              └────┬──────┘ └─────┬─────┘ └───┬────┘ └─────┬─────┘
                   │              │            │            │
                   └──────────────┴─────┬──────┴────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  CODE EXECUTOR     │
                              │  (Validate output) │
                              └─────────┬─────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  RESPONSE MERGE    │
                              │  & PRESENTATION    │
                              └───────────────────┘
```

### Shared Agent State

```python
from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import add_messages

class CodingAgentState(TypedDict):
    """Shared state across all coding agents"""
    # Input
    user_request: str
    code_input: str
    language: str
    error_output: Optional[str]
    github_context: Optional[dict]
    
    # Routing
    selected_agents: List[str]
    current_agent: str
    
    # Agent outputs  
    review_results: Optional[dict]
    refactor_suggestions: Optional[dict]
    debug_analysis: Optional[dict]
    generated_code: Optional[str]
    
    # Execution
    execution_result: Optional[dict]
    validation_passed: bool
    
    # Final
    messages: Annotated[list, add_messages]
    final_response: Optional[str]
```

---

## 3. Data Models

### `backend/app/schemas/coding_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class CodeAgentType(str, Enum):
    REVIEWER = "reviewer"
    REFACTORER = "refactorer"
    DEBUGGER = "debugger"
    GENERATOR = "generator"

class SeverityLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class CodeIssue(BaseModel):
    """Single issue found during code review"""
    issue_id: str
    severity: SeverityLevel
    category: str  # "security", "performance", "style", "bug", "logic"
    line_start: int
    line_end: int
    description: str
    suggestion: str
    fix_code: Optional[str] = None
    reference_url: Optional[str] = None

class CodeReviewResult(BaseModel):
    """Output from the Code Review Agent"""
    overall_score: float = Field(ge=0.0, le=10.0)
    summary: str
    issues: List[CodeIssue]
    strengths: List[str]
    metrics: Dict[str, Any]  # complexity, lines_of_code, etc.
    language_detected: str

class RefactorSuggestion(BaseModel):
    """Single refactoring suggestion"""
    suggestion_id: str
    category: str  # "readability", "performance", "dry", "solid", "pattern"
    title: str
    description: str
    original_code: str
    refactored_code: str
    impact: str  # "low", "medium", "high"
    explanation: str

class RefactorResult(BaseModel):
    """Output from the Refactorer Agent"""
    suggestions: List[RefactorSuggestion]
    fully_refactored_code: str
    improvement_summary: str
    estimated_improvement: str

class DebugAnalysis(BaseModel):
    """Output from the Debug Agent"""
    error_type: str
    root_cause: str
    explanation: str
    fix_suggestions: List[Dict[str, str]]
    fixed_code: Optional[str] = None
    prevention_tips: List[str]
    related_errors: List[str]

class CodeGenerationRequest(BaseModel):
    """Input for the Code Generator Agent"""
    description: str
    language: str = "python"
    include_tests: bool = True
    include_docs: bool = True
    style: str = "clean"  # "clean", "production", "minimal"
    context_code: Optional[str] = None

class CodeGenerationResult(BaseModel):
    """Output from the Code Generator Agent"""
    generated_code: str
    test_code: Optional[str] = None
    documentation: Optional[str] = None
    usage_example: str
    dependencies: List[str]
    explanation: str

class CodingAgentRequest(BaseModel):
    """Unified request for the Coding Agent Team"""
    code: Optional[str] = None
    language: str = "python"
    request_type: CodeAgentType
    description: Optional[str] = None
    error_output: Optional[str] = None
    github_repo_url: Optional[str] = None
    auto_fix: bool = False

class CodingAgentResponse(BaseModel):
    """Unified response from the Coding Agent Team"""
    agents_used: List[CodeAgentType]
    review: Optional[CodeReviewResult] = None
    refactor: Optional[RefactorResult] = None
    debug: Optional[DebugAnalysis] = None
    generation: Optional[CodeGenerationResult] = None
    execution_output: Optional[str] = None
    processing_time: float
```

---

## 4. Backend Implementation

### 4.1 Code Review Agent — `backend/app/agents/code_review_agent.py`

```python
import json
from typing import List, Dict, Any, Optional
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.schemas.coding_agent import CodeReviewResult, CodeIssue, SeverityLevel


class CodeReviewAgent:
    """
    Analyzes code for:
    - Security vulnerabilities (SQL injection, XSS, secrets)
    - Performance issues (N+1 queries, memory leaks, O(n²))
    - Bug detection (null references, race conditions, off-by-one)
    - Style/conventions (naming, structure, documentation)
    - Best practices (SOLID, DRY, error handling)
    """

    SYSTEM_PROMPT = """You are an expert code reviewer with 15+ years of experience.
Analyze the provided code and return a JSON object with this exact structure:

{
  "overall_score": 7.5,
  "summary": "Brief overall assessment",
  "issues": [
    {
      "issue_id": "issue_001",
      "severity": "warning",
      "category": "security",
      "line_start": 10,
      "line_end": 12,
      "description": "What the issue is",
      "suggestion": "How to fix it",
      "fix_code": "corrected code snippet"
    }
  ],
  "strengths": ["Good error handling", "Clean naming"],
  "metrics": {
    "complexity": "medium",
    "lines_of_code": 50,
    "estimated_bugs": 2,
    "test_coverage_suggestion": "70%"
  },
  "language_detected": "python"
}

Categories: security, performance, style, bug, logic
Severities: info, warning, error, critical
Be thorough but concise. Return ONLY valid JSON."""

    async def review(self, code: str, language: str = "auto") -> CodeReviewResult:
        """Perform comprehensive code review"""
        prompt = f"""Review this {language} code:

```{language}
{code}
```

Analyze for security, performance, bugs, style, and best practices."""

        try:
            response = await groq_client.get_completion([
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ])

            # Parse JSON response
            start = response.find('{')
            end = response.rfind('}') + 1
            data = json.loads(response[start:end])

            issues = [
                CodeIssue(
                    issue_id=issue.get("issue_id", f"issue_{i}"),
                    severity=SeverityLevel(issue.get("severity", "info")),
                    category=issue.get("category", "style"),
                    line_start=issue.get("line_start", 0),
                    line_end=issue.get("line_end", 0),
                    description=issue.get("description", ""),
                    suggestion=issue.get("suggestion", ""),
                    fix_code=issue.get("fix_code")
                )
                for i, issue in enumerate(data.get("issues", []))
            ]

            return CodeReviewResult(
                overall_score=data.get("overall_score", 5.0),
                summary=data.get("summary", "Review completed"),
                issues=issues,
                strengths=data.get("strengths", []),
                metrics=data.get("metrics", {}),
                language_detected=data.get("language_detected", language)
            )
        except Exception as e:
            logger.error(f"Code review failed: {e}")
            return CodeReviewResult(
                overall_score=0.0,
                summary=f"Review failed: {str(e)}",
                issues=[],
                strengths=[],
                metrics={},
                language_detected=language
            )


class DebugAgent:
    """Diagnoses errors and suggests fixes"""

    SYSTEM_PROMPT = """You are an expert debugger. Given code and its error output,
diagnose the root cause and provide a fix. Return JSON:

{
  "error_type": "TypeError",
  "root_cause": "Explanation of why this happens",
  "explanation": "Step-by-step what went wrong",
  "fix_suggestions": [
    {"description": "Fix 1", "code": "fixed code"}
  ],
  "fixed_code": "full corrected code",
  "prevention_tips": ["Tip 1", "Tip 2"],
  "related_errors": ["Similar error 1"]
}

Return ONLY valid JSON."""

    async def debug(self, code: str, error_output: str, language: str = "python") -> Dict:
        """Diagnose an error and suggest fixes"""
        prompt = f"""Debug this {language} code:

```{language}
{code}
```

Error output:
```
{error_output}
```

Diagnose the root cause and provide a complete fix."""

        try:
            response = await groq_client.get_completion([
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ])

            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Debug analysis failed: {e}")
            return {"error_type": "Unknown", "root_cause": str(e), "fix_suggestions": []}


class CodeGeneratorAgent:
    """Generates code from natural language descriptions"""

    SYSTEM_PROMPT = """You are an expert software engineer. Generate clean, production-ready code
from the user's description. Return JSON:

{
  "generated_code": "the main code",
  "test_code": "unit tests for the code",
  "documentation": "docstring/JSDoc documentation",
  "usage_example": "how to use the code",
  "dependencies": ["dep1", "dep2"],
  "explanation": "what the code does and design decisions"
}

Follow best practices: type hints, error handling, clean naming. Return ONLY valid JSON."""

    async def generate(self, description: str, language: str, include_tests: bool = True,
                       context_code: str = None) -> Dict:
        """Generate code from description"""
        context = f"\nExisting code context:\n```{language}\n{context_code}\n```" if context_code else ""
        
        prompt = f"""Generate {language} code for:

{description}
{context}

{"Include comprehensive unit tests." if include_tests else "No tests needed."}"""

        try:
            response = await groq_client.get_completion([
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ])

            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Code generation failed: {e}")
            return {"generated_code": "", "explanation": str(e)}


class RefactorAgent:
    """Suggests and applies code refactoring"""

    SYSTEM_PROMPT = """You are a refactoring expert. Analyze code and suggest improvements.
Return JSON:

{
  "suggestions": [
    {
      "suggestion_id": "refactor_001",
      "category": "readability",
      "title": "Extract method",
      "description": "What to improve",
      "original_code": "before",
      "refactored_code": "after",
      "impact": "medium",
      "explanation": "Why this is better"
    }
  ],
  "fully_refactored_code": "complete refactored version",
  "improvement_summary": "What changed overall",
  "estimated_improvement": "~30% more readable"
}

Categories: readability, performance, dry, solid, pattern. Return ONLY valid JSON."""

    async def refactor(self, code: str, language: str = "python") -> Dict:
        """Analyze and refactor code"""
        prompt = f"""Refactor this {language} code for better quality:

```{language}
{code}
```

Suggest improvements for readability, performance, DRY, and SOLID principles."""

        try:
            response = await groq_client.get_completion([
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ])

            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Refactoring failed: {e}")
            return {"suggestions": [], "improvement_summary": str(e)}


# Singletons
code_review_agent = CodeReviewAgent()
debug_agent = DebugAgent()
code_generator_agent = CodeGeneratorAgent()
refactor_agent = RefactorAgent()
```

### 4.2 Orchestrator & API — `backend/app/api/v1/code.py` additions

```python
# Add to existing code.py router:

from app.agents.code_review_agent import (
    code_review_agent, debug_agent, code_generator_agent, refactor_agent
)
from app.schemas.coding_agent import CodingAgentRequest, CodingAgentResponse, CodeAgentType

@router.post("/agent/analyze", response_model=CodingAgentResponse)
async def coding_agent_analyze(
    request: CodingAgentRequest,
    current_user = Depends(get_current_user)
):
    """Unified coding agent endpoint — routes to the right agent(s)"""
    import time
    start = time.time()
    response = CodingAgentResponse(agents_used=[], processing_time=0)

    if request.request_type == CodeAgentType.REVIEWER:
        result = await code_review_agent.review(request.code, request.language)
        response.review = result
        response.agents_used.append(CodeAgentType.REVIEWER)

    elif request.request_type == CodeAgentType.DEBUGGER:
        result = await debug_agent.debug(request.code, request.error_output or "", request.language)
        response.debug = result
        response.agents_used.append(CodeAgentType.DEBUGGER)

    elif request.request_type == CodeAgentType.GENERATOR:
        result = await code_generator_agent.generate(
            request.description or "", request.language, context_code=request.code
        )
        response.generation = result
        response.agents_used.append(CodeAgentType.GENERATOR)

    elif request.request_type == CodeAgentType.REFACTORER:
        result = await refactor_agent.refactor(request.code, request.language)
        response.refactor = result
        response.agents_used.append(CodeAgentType.REFACTORER)

    response.processing_time = time.time() - start
    return response
```

---

## 5. Frontend Integration

### Component: `frontend/src/components/code-lab/AgentPanel.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import styles from './AgentPanel.module.css';

interface AgentPanelProps {
  code: string;
  language: string;
  errorOutput?: string;
}

export default function AgentPanel({ code, language, errorOutput }: AgentPanelProps) {
  const [activeAgent, setActiveAgent] = useState<string>('reviewer');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const agents = [
    { id: 'reviewer', icon: '🔍', label: 'Review' },
    { id: 'refactorer', icon: '♻️', label: 'Refactor' },
    { id: 'debugger', icon: '🐛', label: 'Debug' },
    { id: 'generator', icon: '⚡', label: 'Generate' },
  ];

  const runAgent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/code/agent/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          code,
          language,
          request_type: activeAgent,
          error_output: errorOutput,
        }),
      });
      setResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.agentTabs}>
        {agents.map(a => (
          <button
            key={a.id}
            className={`${styles.tab} ${activeAgent === a.id ? styles.active : ''}`}
            onClick={() => { setActiveAgent(a.id); setResult(null); }}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>
      
      <button onClick={runAgent} disabled={loading} className={styles.runBtn}>
        {loading ? '⏳ Analyzing...' : `Run ${agents.find(a => a.id === activeAgent)?.label}`}
      </button>

      {result?.review && (
        <div className={styles.reviewResult}>
          <div className={styles.scoreCircle}>
            <span>{result.review.overall_score}/10</span>
          </div>
          <p>{result.review.summary}</p>
          {result.review.issues.map((issue: any, i: number) => (
            <div key={i} className={`${styles.issue} ${styles[issue.severity]}`}>
              <span className={styles.badge}>{issue.severity}</span>
              <strong>Line {issue.line_start}: {issue.category}</strong>
              <p>{issue.description}</p>
              <pre>{issue.fix_code}</pre>
            </div>
          ))}
        </div>
      )}
      
      {/* Similar render blocks for refactor, debug, generation results */}
    </div>
  );
}
```

---

## 6. Testing Plan

```bash
# Unit tests
pytest tests/test_coding_agents.py -v

# Integration: Review
curl -X POST http://localhost:8000/api/v1/code/agent/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "def foo(x):\n  return x + 1", "language": "python", "request_type": "reviewer"}'

# Integration: Debug
curl -X POST http://localhost:8000/api/v1/code/agent/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1/0)", "language": "python", "request_type": "debugger", "error_output": "ZeroDivisionError"}'
```

---

## 7. File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `backend/app/agents/code_review_agent.py` | CodeReviewAgent, DebugAgent, RefactorAgent, CodeGeneratorAgent |
| **NEW** | `backend/app/schemas/coding_agent.py` | All Pydantic schemas |
| **MODIFY** | `backend/app/api/v1/code.py` | Add `/agent/analyze` endpoint |
| **NEW** | `frontend/src/components/code-lab/AgentPanel.tsx` | Agent UI panel |
| **NEW** | `frontend/src/components/code-lab/AgentPanel.module.css` | Styles |
| **NEW** | `tests/test_coding_agents.py` | Unit tests |
