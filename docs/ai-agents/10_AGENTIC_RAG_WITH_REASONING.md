# 🧠 Agent 10: Agentic RAG with Reasoning

> **Priority:** ⭐⭐ Tier 3 | **Effort:** 3-4 days | **Framework:** LangGraph

---

## 1. Overview

Enhances the existing OmniRAG pipeline with **chain-of-thought reasoning**, **self-reflection**, and **adaptive retrieval** — the agent thinks about whether it has enough info before answering.

**Why:** Your OmniRAG pipeline (759 lines!) is production-ready. This agent adds a reasoning layer on top.

### Key Enhancement Over OmniRAG

| Feature | Current OmniRAG | Agentic RAG |
|---------|----------------|-------------|
| Retrieval | One-shot fetch | Iterative: fetch → evaluate → fetch more |
| Reasoning | Direct answer | Chain-of-thought + self-critique |
| Confidence | Implicit | Explicit confidence scoring + hallucination check |
| Fallback | Web search | Dynamic strategy switching |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│            AGENTIC RAG WITH REASONING             │
│                                                    │
│  Query → ┌───────────┐                             │
│          │ Reasoner  │ "Do I have enough to answer?"│
│          └─────┬─────┘                             │
│                │ No → Retrieve more                │
│                │ Yes → Generate answer             │
│          ┌─────▼─────┐                             │
│          │ Retriever │ OmniRAG + adaptive strategy │
│          └─────┬─────┘                             │
│          ┌─────▼─────┐                             │
│          │ Self-     │ Check for hallucinations,   │
│          │ Critic    │ verify claims against sources│
│          └─────┬─────┘                             │
│          ┌─────▼─────┐                             │
│          │ Confidence│ Score 0-1, cite sources     │
│          │ Scorer    │                              │
│          └───────────┘                             │
└──────────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/agentic_rag.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class ReasoningStep(BaseModel):
    step: int
    thought: str
    action: str  # "retrieve", "evaluate", "answer", "clarify"
    result: Optional[str] = None

class SourceVerification(BaseModel):
    claim: str
    source: str
    verified: bool
    confidence: float

class AgenticRAGResponse(BaseModel):
    query: str
    answer: str
    reasoning_chain: List[ReasoningStep]
    confidence: float = Field(ge=0, le=1)
    sources_used: List[Dict[str, str]]
    source_verifications: List[SourceVerification]
    retrieval_iterations: int
    hallucination_check: bool  # True = passed
    thinking_time_ms: float

class AgenticRAGRequest(BaseModel):
    query: str
    require_sources: bool = True
    max_iterations: int = 3
    min_confidence: float = 0.7
```

---

## 4. Backend — `backend/app/agents/agentic_rag_agent.py`

```python
import json, time
from typing import Dict, List
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.services.rag.pipeline import OmniRAGPipeline

class AgenticRAGAgent:
    def __init__(self):
        self.rag = OmniRAGPipeline()

    async def query(self, query: str, user_id: str, max_iterations: int = 3,
                    min_confidence: float = 0.7) -> Dict:
        start = time.time()
        reasoning_chain = []
        all_sources = []
        iteration = 0
        confidence = 0

        while iteration < max_iterations and confidence < min_confidence:
            iteration += 1

            # Step 1: Reason about what we need
            reasoning = await self._reason(query, reasoning_chain, all_sources)
            reasoning_chain.append(reasoning)

            if reasoning["action"] == "answer":
                break

            # Step 2: Retrieve
            results = await self.rag.process_query(query=reasoning.get("sub_query", query),
                                                    user_id=user_id)
            all_sources.extend(results.get("sources", []))
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "thought": f"Retrieved {len(results.get('sources', []))} sources",
                "action": "evaluate",
                "result": results.get("response", "")[:500]
            })

            # Step 3: Evaluate sufficiency
            confidence = await self._evaluate_confidence(query, all_sources, results)

        # Step 4: Generate final answer with self-critique
        answer = await self._generate_answer(query, reasoning_chain, all_sources)
        verifications = await self._verify_claims(answer, all_sources)
        hallucination_ok = all(v.get("verified", False) for v in verifications)

        return {
            "query": query,
            "answer": answer,
            "reasoning_chain": reasoning_chain,
            "confidence": confidence,
            "sources_used": all_sources[:10],
            "source_verifications": verifications,
            "retrieval_iterations": iteration,
            "hallucination_check": hallucination_ok,
            "thinking_time_ms": (time.time() - start) * 1000
        }

    async def _reason(self, query, chain, sources) -> Dict:
        context = f"Previous steps: {json.dumps(chain[-3:], default=str)}" if chain else "First step"
        prompt = f"""Think step-by-step about answering: {query}
{context}
Sources so far: {len(sources)}

Decide: Do you have enough information to answer confidently?
Return JSON: {{"step": {len(chain)+1}, "thought": "...",
"action": "retrieve|answer|clarify", "sub_query": "specific query if retrieving"}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Careful reasoner. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def _evaluate_confidence(self, query, sources, results) -> float:
        prompt = f"""Rate confidence (0.0-1.0) in answering: {query}
Based on {len(sources)} sources. Latest result: {str(results)[:500]}
Return JSON: {{"confidence": 0.85, "reason": "..."}}"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        data = json.loads(response[response.find('{'):response.rfind('}')+1])
        return data.get("confidence", 0.5)

    async def _generate_answer(self, query, chain, sources) -> str:
        context = json.dumps(chain, default=str)[:3000]
        prompt = f"""Based on this reasoning chain, generate a comprehensive answer.
Query: {query}
Reasoning: {context}
Cite sources where possible."""
        return await groq_client.get_completion([
            {"role": "system", "content": "Thorough, accurate answerer."},
            {"role": "user", "content": prompt}
        ])

    async def _verify_claims(self, answer, sources) -> List[Dict]:
        prompt = f"""Extract key claims from this answer and verify against sources.
Answer: {answer[:2000]}
Sources: {json.dumps(sources[:5], default=str)[:1000]}
Return JSON array: [{{"claim": "...", "source": "...", "verified": true, "confidence": 0.9}}]"""
        response = await groq_client.get_completion([
            {"role": "system", "content": "Fact checker. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

agentic_rag_agent = AgenticRAGAgent()
```

---

## 5. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/agentic_rag.py` |
| **NEW** | `backend/app/agents/agentic_rag_agent.py` |
| **MODIFY** | `backend/app/api/v1/research.py` — add `/agentic-query` |
| **NEW** | `frontend/src/components/research/AgenticRAGPanel.tsx` |
