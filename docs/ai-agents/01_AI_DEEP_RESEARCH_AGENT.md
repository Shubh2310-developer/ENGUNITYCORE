# 🔍 Agent 01: AI Deep Research Agent

> **Priority:** ⭐⭐⭐⭐⭐ Tier 1 — Highest Impact  
> **Effort:** 2-3 days  
> **Status:** RAG pipeline fully built, `research_agent.py` is empty — ready to implement  
> **Framework:** Google ADK or LangGraph

---

## 1. Overview

### What It Does
The AI Deep Research Agent performs **multi-step, iterative research** on complex topics. It decomposes questions, runs parallel searches across your RAG knowledge base and the web, evaluates source quality, and synthesizes comprehensive research reports with citations.

### Why Engunity Needs This
- Your `research_agent.py` is **empty** but the entire RAG infrastructure is production-ready
- Students need deep research for projects, thesis work, and exam prep
- The current RAG pipeline answers single questions — this agent handles **multi-hop, multi-step** investigations

### Existing Infrastructure It Leverages

| Component | File | Purpose |
|-----------|------|---------|
| OmniRAG Pipeline | `backend/app/services/rag/pipeline.py` (759 lines) | Core retrieval + generation |
| HyDE Engine | `backend/app/services/rag/hyde.py` | Hypothetical document embeddings |
| Recursive Reasoning | `backend/app/services/rag/recursive_agent.py` | Multi-step reasoning |
| Web Search | `backend/app/services/rag/web_search.py` | External source fallback |
| Query Classifier | `backend/app/services/rag/classifier.py` | Complexity routing |
| Reranker | `backend/app/services/rag/reranker.py` | FlashRank reranking |
| Graph Store | `backend/app/services/rag/graph_store.py` | Knowledge graph traversal |
| Quality Metrics | `backend/app/services/rag/quality_metrics.py` | Answer evaluation |
| Density Controller | `backend/app/services/rag/density_controller.py` | Information density tuning |
| Research Pipeline | `ai-core/pipelines/research_pipeline.py` | Existing research pipeline stub |
| Research API | `backend/app/api/v1/research.py` | Existing API endpoint |

---

## 2. Architecture

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    RESEARCH AGENT ORCHESTRATOR                │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │  Query    │───▶│  Decomposer  │───▶│  Parallel Search   │ │
│  │  Input    │    │  (Break into │    │  Coordinator       │ │
│  │          │    │  sub-queries)│    │                    │ │
│  └──────────┘    └──────────────┘    └────────┬───────────┘ │
│                                               │              │
│                    ┌──────────────────────────┼──────┐       │
│                    ▼                          ▼      ▼       │
│             ┌────────────┐  ┌──────────┐ ┌────────────┐     │
│             │ RAG Search │  │ Web      │ │ Graph      │     │
│             │ (OmniRAG)  │  │ Search   │ │ Traversal  │     │
│             └─────┬──────┘  └────┬─────┘ └─────┬──────┘     │
│                   │              │              │            │
│                   ▼              ▼              ▼            │
│             ┌──────────────────────────────────────────┐     │
│             │         SOURCE EVALUATOR                 │     │
│             │  • Relevance scoring                     │     │
│             │  • Source quality check                   │     │
│             │  • Contradiction detection                │     │
│             │  • Coverage gap analysis                  │     │
│             └────────────────┬─────────────────────────┘     │
│                              │                               │
│                   ┌──────────▼──────────┐                    │
│                   │  ITERATIVE REFINER  │                    │
│                   │  Need more info? ──▶│──── Loop back      │
│                   │  Gaps found?    ──▶│──── to search       │
│                   │  Sufficient?    ──▶│──── Proceed         │
│                   └──────────┬──────────┘                    │
│                              │                               │
│                   ┌──────────▼──────────┐                    │
│                   │  REPORT SYNTHESIZER │                    │
│                   │  • Structure answer  │                    │
│                   │  • Add citations     │                    │
│                   │  • Confidence score  │                    │
│                   │  • Related topics    │                    │
│                   └─────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

### Agent State Machine

```
[INIT] → [DECOMPOSE] → [SEARCH] → [EVALUATE] → [SUFFICIENT?]
                                                    │
                                          ┌─────────┼──────────┐
                                          │ NO      │          │ YES
                                          ▼         │          ▼
                                       [REFINE]     │     [SYNTHESIZE] → [DONE]
                                          │         │
                                          └─────────┘
```

---

## 3. Data Models

### New Schemas

Create `backend/app/schemas/research_agent.py`:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

class ResearchDepth(str, Enum):
    QUICK = "quick"          # Single-pass, 1-2 sources
    STANDARD = "standard"    # Multi-query, 3-5 sources
    DEEP = "deep"            # Iterative, 5-10+ sources with refinement
    EXHAUSTIVE = "exhaustive" # Full research with web + graph + multiple iterations

class ResearchStatus(str, Enum):
    PENDING = "pending"
    DECOMPOSING = "decomposing"
    SEARCHING = "searching"
    EVALUATING = "evaluating"
    REFINING = "refining"
    SYNTHESIZING = "synthesizing"
    COMPLETED = "completed"
    FAILED = "failed"

class SubQuery(BaseModel):
    """A decomposed sub-question from the main research query"""
    id: str
    question: str
    query_type: str  # "factual", "analytical", "comparative", "exploratory"
    priority: int = Field(ge=1, le=5, default=3)
    status: ResearchStatus = ResearchStatus.PENDING
    results: Optional[List[Dict[str, Any]]] = None
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)

class SourceEvaluation(BaseModel):
    """Quality evaluation of a retrieved source"""
    source_id: str
    source_name: str
    source_type: str  # "rag_document", "web", "graph_node"
    relevance_score: float = Field(ge=0.0, le=1.0)
    quality_score: float = Field(ge=0.0, le=1.0)
    freshness_score: float = Field(ge=0.0, le=1.0)
    content_snippet: str
    url: Optional[str] = None
    contradicts_other_sources: bool = False
    contradiction_details: Optional[str] = None

class ResearchIteration(BaseModel):
    """Tracks one iteration of the research loop"""
    iteration_number: int
    sub_queries_searched: List[str]
    sources_found: int
    sources_accepted: int
    coverage_gaps: List[str]
    refinement_queries: List[str]
    confidence_delta: float

class ResearchRequest(BaseModel):
    """Incoming research request"""
    query: str = Field(..., min_length=5, max_length=2000)
    depth: ResearchDepth = ResearchDepth.STANDARD
    max_iterations: int = Field(default=3, ge=1, le=10)
    include_web_search: bool = True
    include_graph_search: bool = True
    focus_areas: Optional[List[str]] = None
    exclude_sources: Optional[List[str]] = None
    output_format: str = "detailed"  # "detailed", "summary", "bullet_points"

class ResearchReport(BaseModel):
    """Final research report output"""
    id: UUID
    query: str
    depth: ResearchDepth
    status: ResearchStatus
    
    # Results
    summary: str
    detailed_findings: List[Dict[str, Any]]
    key_insights: List[str]
    
    # Sources
    sources: List[SourceEvaluation]
    total_sources_evaluated: int
    sources_accepted: int
    
    # Metadata
    iterations_performed: int
    iteration_history: List[ResearchIteration]
    overall_confidence: float = Field(ge=0.0, le=1.0)
    coverage_score: float = Field(ge=0.0, le=1.0)
    
    # Related
    related_topics: List[str]
    follow_up_questions: List[str]
    
    # Timestamps
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

class ResearchStreamEvent(BaseModel):
    """Real-time streaming event during research"""
    event_type: str  # "status", "sub_query", "source_found", "insight", "progress", "complete"
    data: Dict[str, Any]
    timestamp: datetime
    progress_percent: float = Field(ge=0.0, le=100.0)
```

---

## 4. Backend Implementation

### 4.1 Core Agent — `backend/app/agents/research_agent.py`

```python
import asyncio
import uuid
from typing import List, Dict, Optional, Any, AsyncGenerator
from datetime import datetime
from loguru import logger

from app.services.rag.pipeline import OmniRAGPipeline
from app.services.rag.web_search import WebSearchFallback
from app.services.rag.graph_store import GraphStore
from app.services.rag.classifier import QueryComplexityClassifier
from app.services.rag.quality_metrics import get_quality_metrics
from app.services.rag.reranker import FlashRankReranker
from app.services.ai.gemini_client import gemini_client
from app.services.ai.groq_client import groq_client
from app.schemas.research_agent import (
    ResearchRequest, ResearchReport, SubQuery, SourceEvaluation,
    ResearchIteration, ResearchStatus, ResearchDepth, ResearchStreamEvent
)


class DeepResearchAgent:
    """
    Multi-step iterative research agent.
    
    Pipeline:
    1. DECOMPOSE: Break complex query into sub-questions
    2. SEARCH: Parallel search across RAG + Web + Graph
    3. EVALUATE: Score and filter sources
    4. REFINE: Identify gaps, generate follow-up queries
    5. SYNTHESIZE: Compile final research report
    """

    def __init__(self, omni_rag: OmniRAGPipeline):
        self.omni_rag = omni_rag
        self.classifier = QueryComplexityClassifier()
        self.quality_metrics = get_quality_metrics()
        self.web_search = WebSearchFallback()
        self.graph_store = GraphStore()
        
        # Configuration per depth level
        self.depth_config = {
            ResearchDepth.QUICK: {"max_sub_queries": 2, "max_iterations": 1, "min_sources": 2},
            ResearchDepth.STANDARD: {"max_sub_queries": 5, "max_iterations": 3, "min_sources": 4},
            ResearchDepth.DEEP: {"max_sub_queries": 8, "max_iterations": 5, "min_sources": 7},
            ResearchDepth.EXHAUSTIVE: {"max_sub_queries": 12, "max_iterations": 8, "min_sources": 10},
        }

    async def research(
        self, 
        request: ResearchRequest,
        user_id: str,
        session_id: Optional[str] = None
    ) -> ResearchReport:
        """Execute full research pipeline (non-streaming)"""
        report_id = uuid.uuid4()
        started_at = datetime.utcnow()
        config = self.depth_config[request.depth]
        
        try:
            # Step 1: Decompose
            sub_queries = await self._decompose_query(
                request.query, 
                config["max_sub_queries"],
                request.focus_areas
            )
            
            all_sources = []
            iteration_history = []
            
            # Step 2-4: Iterative Search + Evaluate + Refine
            for iteration in range(min(request.max_iterations, config["max_iterations"])):
                # Search
                iteration_sources = await self._parallel_search(
                    sub_queries, user_id, session_id,
                    include_web=request.include_web_search,
                    include_graph=request.include_graph_search
                )
                
                # Evaluate
                evaluated = await self._evaluate_sources(
                    request.query, iteration_sources, request.exclude_sources
                )
                all_sources.extend([s for s in evaluated if s.relevance_score > 0.4])
                
                # Check coverage
                gaps = await self._identify_gaps(
                    request.query, sub_queries, all_sources
                )
                
                iteration_record = ResearchIteration(
                    iteration_number=iteration + 1,
                    sub_queries_searched=[sq.question for sq in sub_queries],
                    sources_found=len(iteration_sources),
                    sources_accepted=len([s for s in evaluated if s.relevance_score > 0.4]),
                    coverage_gaps=gaps,
                    refinement_queries=[],
                    confidence_delta=0.0
                )
                
                # Sufficient coverage?
                if len(gaps) == 0 or len(all_sources) >= config["min_sources"]:
                    iteration_history.append(iteration_record)
                    break
                
                # Refine: generate new sub-queries for gaps
                refinement_queries = await self._generate_refinement_queries(gaps)
                sub_queries = [SubQuery(id=f"refine_{i}", question=q, query_type="exploratory") 
                              for i, q in enumerate(refinement_queries)]
                iteration_record.refinement_queries = refinement_queries
                iteration_history.append(iteration_record)
            
            # Step 5: Synthesize
            report = await self._synthesize_report(
                report_id, request, all_sources, iteration_history, started_at
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Research agent error: {e}")
            raise

    async def stream_research(
        self,
        request: ResearchRequest,
        user_id: str,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[ResearchStreamEvent, None]:
        """Execute research with real-time streaming updates"""
        config = self.depth_config[request.depth]
        started_at = datetime.utcnow()
        
        yield ResearchStreamEvent(
            event_type="status",
            data={"message": "Analyzing research query...", "phase": "decompose"},
            timestamp=datetime.utcnow(),
            progress_percent=5.0
        )
        
        # Decompose
        sub_queries = await self._decompose_query(
            request.query, config["max_sub_queries"], request.focus_areas
        )
        
        yield ResearchStreamEvent(
            event_type="sub_query",
            data={
                "message": f"Identified {len(sub_queries)} research angles",
                "sub_queries": [sq.question for sq in sub_queries]
            },
            timestamp=datetime.utcnow(),
            progress_percent=15.0
        )
        
        all_sources = []
        iteration_history = []
        total_iterations = min(request.max_iterations, config["max_iterations"])
        
        for iteration in range(total_iterations):
            progress_base = 15 + (iteration / total_iterations) * 60
            
            yield ResearchStreamEvent(
                event_type="status",
                data={
                    "message": f"Searching (iteration {iteration + 1}/{total_iterations})...",
                    "phase": "searching"
                },
                timestamp=datetime.utcnow(),
                progress_percent=progress_base
            )
            
            # Search
            iteration_sources = await self._parallel_search(
                sub_queries, user_id, session_id,
                include_web=request.include_web_search,
                include_graph=request.include_graph_search
            )
            
            for source in iteration_sources[:3]:  # Stream top 3 discoveries
                yield ResearchStreamEvent(
                    event_type="source_found",
                    data={
                        "source_name": source.get("source", "Unknown"),
                        "snippet": source.get("content", "")[:200]
                    },
                    timestamp=datetime.utcnow(),
                    progress_percent=progress_base + 10
                )
            
            # Evaluate
            evaluated = await self._evaluate_sources(
                request.query, iteration_sources, request.exclude_sources
            )
            accepted = [s for s in evaluated if s.relevance_score > 0.4]
            all_sources.extend(accepted)
            
            # Gaps
            gaps = await self._identify_gaps(request.query, sub_queries, all_sources)
            
            iteration_record = ResearchIteration(
                iteration_number=iteration + 1,
                sub_queries_searched=[sq.question for sq in sub_queries],
                sources_found=len(iteration_sources),
                sources_accepted=len(accepted),
                coverage_gaps=gaps,
                refinement_queries=[],
                confidence_delta=0.0
            )
            
            if len(gaps) == 0 or len(all_sources) >= config["min_sources"]:
                iteration_history.append(iteration_record)
                break
            
            refinement_queries = await self._generate_refinement_queries(gaps)
            sub_queries = [SubQuery(id=f"refine_{i}", question=q, query_type="exploratory")
                          for i, q in enumerate(refinement_queries)]
            iteration_record.refinement_queries = refinement_queries
            iteration_history.append(iteration_record)
            
            yield ResearchStreamEvent(
                event_type="status",
                data={
                    "message": f"Found gaps: {', '.join(gaps[:3])}. Refining...",
                    "phase": "refining"
                },
                timestamp=datetime.utcnow(),
                progress_percent=progress_base + 15
            )
        
        yield ResearchStreamEvent(
            event_type="status",
            data={"message": "Synthesizing research report...", "phase": "synthesizing"},
            timestamp=datetime.utcnow(),
            progress_percent=80.0
        )
        
        report = await self._synthesize_report(
            uuid.uuid4(), request, all_sources, iteration_history, started_at
        )
        
        yield ResearchStreamEvent(
            event_type="complete",
            data={"report": report.model_dump(mode="json")},
            timestamp=datetime.utcnow(),
            progress_percent=100.0
        )

    # ─── Internal Methods ──────────────────────────────────────

    async def _decompose_query(
        self, 
        query: str, 
        max_sub_queries: int,
        focus_areas: Optional[List[str]] = None
    ) -> List[SubQuery]:
        """Break a complex research query into sub-questions"""
        focus_hint = ""
        if focus_areas:
            focus_hint = f"\nFocus areas to prioritize: {', '.join(focus_areas)}"
        
        prompt = f"""Decompose this research query into {max_sub_queries} specific sub-questions.
        
Query: "{query}"
{focus_hint}

For each sub-question, classify its type:
- "factual": Requires specific facts or data
- "analytical": Requires analysis or comparison
- "comparative": Compares multiple options/approaches
- "exploratory": Open-ended exploration

Return as JSON array:
[{{"question": "...", "query_type": "...", "priority": 1-5}}]

Return ONLY the JSON array, no other text."""

        response = await groq_client.get_completion([
            {"role": "system", "content": "You are a research decomposition expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        
        import json
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            parsed = json.loads(response[start:end])
            return [
                SubQuery(id=f"sq_{i}", **item) 
                for i, item in enumerate(parsed[:max_sub_queries])
            ]
        except (json.JSONDecodeError, ValueError):
            # Fallback: use original query as single sub-query
            return [SubQuery(id="sq_0", question=query, query_type="exploratory", priority=5)]

    async def _parallel_search(
        self,
        sub_queries: List[SubQuery],
        user_id: str,
        session_id: Optional[str],
        include_web: bool = True,
        include_graph: bool = True
    ) -> List[Dict[str, Any]]:
        """Search across all sources in parallel for all sub-queries"""
        all_results = []
        
        search_tasks = []
        for sq in sub_queries:
            # RAG search (always)
            search_tasks.append(
                self.omni_rag.process_query(
                    query=sq.question,
                    user_id=user_id,
                    session_id=session_id,
                    use_memory=False
                )
            )
            
            # Web search (optional)
            if include_web:
                search_tasks.append(
                    self.web_search.search(sq.question)
                )
            
            # Graph traversal (optional)
            if include_graph:
                search_tasks.append(
                    self.graph_store.query_graph(sq.question)
                )
        
        results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                logger.warning(f"Search task failed: {result}")
                continue
            if isinstance(result, dict):
                all_results.append(result)
            elif isinstance(result, list):
                all_results.extend(result)
        
        return all_results

    async def _evaluate_sources(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        exclude: Optional[List[str]] = None
    ) -> List[SourceEvaluation]:
        """Score and filter sources for relevance and quality"""
        evaluations = []
        
        for i, source in enumerate(sources):
            content = source.get("content", source.get("answer", ""))
            source_name = source.get("source", source.get("title", f"Source_{i}"))
            
            if exclude and source_name in exclude:
                continue
            
            # Use quality metrics for scoring
            relevance = await self._score_relevance(query, content)
            quality = self._assess_quality(content)
            
            evaluations.append(SourceEvaluation(
                source_id=f"src_{i}",
                source_name=source_name,
                source_type=source.get("type", "rag_document"),
                relevance_score=relevance,
                quality_score=quality,
                freshness_score=0.8,  # Default; enhance with metadata
                content_snippet=content[:500],
                url=source.get("url")
            ))
        
        # Sort by combined score
        evaluations.sort(
            key=lambda e: (e.relevance_score * 0.6 + e.quality_score * 0.4),
            reverse=True
        )
        
        return evaluations

    async def _score_relevance(self, query: str, content: str) -> float:
        """Score how relevant content is to the query"""
        if not content.strip():
            return 0.0
        
        prompt = f"""Rate the relevance of this content to the query on a scale of 0.0 to 1.0.

Query: "{query}"
Content: "{content[:1000]}"

Return ONLY a single float number between 0.0 and 1.0."""

        try:
            response = await groq_client.get_completion([
                {"role": "user", "content": prompt}
            ])
            score = float(response.strip())
            return max(0.0, min(1.0, score))
        except (ValueError, Exception):
            return 0.5

    def _assess_quality(self, content: str) -> float:
        """Heuristic quality assessment of content"""
        if not content:
            return 0.0
        
        score = 0.5
        
        # Length bonus
        if len(content) > 200:
            score += 0.1
        if len(content) > 500:
            score += 0.1
        
        # Structure bonus (has sections, lists)
        if any(marker in content for marker in ["##", "- ", "1.", "•"]):
            score += 0.1
        
        # Code/data bonus
        if "```" in content or any(kw in content.lower() for kw in ["example", "figure", "table"]):
            score += 0.1
        
        return min(1.0, score)

    async def _identify_gaps(
        self,
        query: str,
        sub_queries: List[SubQuery],
        sources: List[SourceEvaluation]
    ) -> List[str]:
        """Identify what's still missing from the research"""
        covered_content = "\n".join([s.content_snippet for s in sources[:10]])
        questions_asked = "\n".join([sq.question for sq in sub_queries])
        
        prompt = f"""Given this research query and what's been found so far, identify 
knowledge gaps — what important aspects are NOT yet covered?

Original Query: "{query}"
Sub-questions asked: {questions_asked}
Content found so far (snippets): {covered_content[:3000]}

Return as JSON array of gap descriptions:
["gap 1 description", "gap 2 description", ...]

If coverage is sufficient, return an empty array: []
Return ONLY the JSON array."""

        try:
            response = await groq_client.get_completion([
                {"role": "user", "content": prompt}
            ])
            import json
            start = response.find('[')
            end = response.rfind(']') + 1
            return json.loads(response[start:end])
        except Exception:
            return []

    async def _generate_refinement_queries(self, gaps: List[str]) -> List[str]:
        """Generate new search queries to fill identified gaps"""
        return [f"Explain in detail: {gap}" for gap in gaps[:5]]

    async def _synthesize_report(
        self,
        report_id,
        request: ResearchRequest,
        sources: List[SourceEvaluation],
        iterations: List[ResearchIteration],
        started_at: datetime
    ) -> ResearchReport:
        """Compile all findings into a structured research report"""
        
        source_content = "\n\n---\n\n".join([
            f"[Source: {s.source_name}] (Relevance: {s.relevance_score:.2f})\n{s.content_snippet}"
            for s in sources[:15]
        ])
        
        format_instructions = {
            "detailed": "Provide a comprehensive, well-structured research report with sections, subsections, and detailed explanations.",
            "summary": "Provide a concise executive summary (3-5 paragraphs).",
            "bullet_points": "Provide key findings as organized bullet points."
        }
        
        prompt = f"""Synthesize a research report from these sources.

Research Question: "{request.query}"
Format: {format_instructions.get(request.output_format, format_instructions["detailed"])}

Sources:
{source_content}

Your report must include:
1. Executive Summary (2-3 sentences)
2. Key Findings (with source citations like [Source: name])
3. Analysis and Insights
4. Limitations/Caveats
5. Suggested Follow-up Questions (3-5)
6. Related Topics to Explore (3-5)"""

        report_text = await groq_client.get_completion([
            {"role": "system", "content": "You are an expert research analyst. Create well-structured, cited reports."},
            {"role": "user", "content": prompt}
        ])
        
        completed_at = datetime.utcnow()
        
        # Extract insights and follow-ups
        key_insights = await self._extract_list(report_text, "key findings")
        follow_ups = await self._extract_list(report_text, "follow-up questions")
        related = await self._extract_list(report_text, "related topics")
        
        return ResearchReport(
            id=report_id,
            query=request.query,
            depth=request.depth,
            status=ResearchStatus.COMPLETED,
            summary=report_text[:500],
            detailed_findings=[{"full_report": report_text}],
            key_insights=key_insights[:5],
            sources=sources,
            total_sources_evaluated=len(sources),
            sources_accepted=len([s for s in sources if s.relevance_score > 0.4]),
            iterations_performed=len(iterations),
            iteration_history=iterations,
            overall_confidence=self._calculate_confidence(sources, iterations),
            coverage_score=self._calculate_coverage(sources),
            related_topics=related[:5],
            follow_up_questions=follow_ups[:5],
            started_at=started_at,
            completed_at=completed_at,
            duration_seconds=(completed_at - started_at).total_seconds()
        )

    async def _extract_list(self, text: str, category: str) -> List[str]:
        """Extract a list of items from report text"""
        prompt = f"""Extract the {category} from this text as a JSON array of strings.
Text: {text[:2000]}
Return ONLY a JSON array like ["item1", "item2"]. If none found, return []."""
        
        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}])
            import json
            start = response.find('[')
            end = response.rfind(']') + 1
            return json.loads(response[start:end])
        except Exception:
            return []

    def _calculate_confidence(self, sources, iterations) -> float:
        """Calculate overall research confidence score"""
        if not sources:
            return 0.0
        avg_relevance = sum(s.relevance_score for s in sources) / len(sources)
        source_count_factor = min(1.0, len(sources) / 5)
        return round(avg_relevance * 0.6 + source_count_factor * 0.4, 2)

    def _calculate_coverage(self, sources) -> float:
        """Calculate topic coverage score"""
        if not sources:
            return 0.0
        unique_types = len(set(s.source_type for s in sources))
        type_diversity = min(1.0, unique_types / 3)
        source_quality = sum(s.quality_score for s in sources) / len(sources)
        return round(type_diversity * 0.4 + source_quality * 0.6, 2)


# Singleton factory
_research_agent = None

def get_research_agent(omni_rag: OmniRAGPipeline) -> DeepResearchAgent:
    global _research_agent
    if _research_agent is None:
        _research_agent = DeepResearchAgent(omni_rag)
    return _research_agent
```

### 4.2 API Endpoint — Update `backend/app/api/v1/research.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.research_agent import ResearchRequest, ResearchReport, ResearchStreamEvent
from app.agents.research_agent import get_research_agent
from app.core.service_registry import services
from app.api.v1.auth import get_current_user
import json

router = APIRouter()

@router.post("/deep-research", response_model=ResearchReport)
async def deep_research(
    request: ResearchRequest,
    current_user = Depends(get_current_user)
):
    """Execute deep research on a topic"""
    omni_rag = services.get_omni_rag()
    agent = get_research_agent(omni_rag)
    
    try:
        report = await agent.research(
            request=request,
            user_id=str(current_user.id)
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")

@router.post("/deep-research/stream")
async def stream_deep_research(
    request: ResearchRequest,
    current_user = Depends(get_current_user)
):
    """Stream deep research progress in real-time"""
    omni_rag = services.get_omni_rag()
    agent = get_research_agent(omni_rag)
    
    async def event_generator():
        async for event in agent.stream_research(
            request=request,
            user_id=str(current_user.id)
        ):
            yield f"data: {event.model_dump_json()}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

---

## 5. Frontend Implementation

### 5.1 Service — `frontend/src/services/research.ts`

```typescript
import { API_BASE } from './config';

export interface ResearchRequest {
  query: string;
  depth: 'quick' | 'standard' | 'deep' | 'exhaustive';
  max_iterations?: number;
  include_web_search?: boolean;
  include_graph_search?: boolean;
  focus_areas?: string[];
  output_format?: 'detailed' | 'summary' | 'bullet_points';
}

export interface ResearchStreamEvent {
  event_type: 'status' | 'sub_query' | 'source_found' | 'insight' | 'progress' | 'complete';
  data: Record<string, any>;
  timestamp: string;
  progress_percent: number;
}

export interface ResearchReport {
  id: string;
  query: string;
  summary: string;
  detailed_findings: Array<{ full_report: string }>;
  key_insights: string[];
  sources: SourceEvaluation[];
  overall_confidence: number;
  coverage_score: number;
  related_topics: string[];
  follow_up_questions: string[];
  duration_seconds: number;
}

export interface SourceEvaluation {
  source_id: string;
  source_name: string;
  source_type: string;
  relevance_score: number;
  quality_score: number;
  content_snippet: string;
  url?: string;
}

export async function startDeepResearch(
  request: ResearchRequest,
  token: string,
  onEvent: (event: ResearchStreamEvent) => void,
  onComplete: (report: ResearchReport) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/research/deep-research/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event: ResearchStreamEvent = JSON.parse(line.slice(6));
          onEvent(event);
          
          if (event.event_type === 'complete') {
            onComplete(event.data.report);
          }
        }
      }
    }
  } catch (err: any) {
    onError(err.message);
  }
}
```

### 5.2 React Component — `frontend/src/components/research/DeepResearchPanel.tsx`

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { startDeepResearch, ResearchRequest, ResearchStreamEvent, ResearchReport } from '@/services/research';
import styles from './DeepResearch.module.css';

export default function DeepResearchPanel() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep' | 'exhaustive'>('standard');
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [events, setEvents] = useState<ResearchStreamEvent[]>([]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsResearching(true);
    setProgress(0);
    setEvents([]);
    setReport(null);
    setError(null);

    const request: ResearchRequest = {
      query,
      depth,
      include_web_search: true,
      include_graph_search: true,
      output_format: 'detailed',
    };

    await startDeepResearch(
      request,
      localStorage.getItem('token') || '',
      (event) => {
        setProgress(event.progress_percent);
        setStatusMessage(event.data.message || '');
        setEvents(prev => [...prev, event]);
      },
      (report) => {
        setReport(report);
        setIsResearching(false);
      },
      (err) => {
        setError(err);
        setIsResearching(false);
      }
    );
  }, [query, depth]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🔍 Deep Research Agent</h2>
        <p>Multi-step iterative research with source evaluation</p>
      </div>

      {/* Query Input */}
      <div className={styles.inputSection}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What would you like to research? (e.g., 'Compare React vs Vue for large-scale applications')"
          className={styles.queryInput}
          rows={3}
        />
        
        <div className={styles.controls}>
          <select value={depth} onChange={(e) => setDepth(e.target.value as any)} className={styles.depthSelect}>
            <option value="quick">⚡ Quick (1-2 sources)</option>
            <option value="standard">📖 Standard (3-5 sources)</option>
            <option value="deep">🔬 Deep (5-10 sources)</option>
            <option value="exhaustive">🧠 Exhaustive (10+ sources)</option>
          </select>
          
          <button onClick={handleResearch} disabled={isResearching || !query.trim()} className={styles.researchBtn}>
            {isResearching ? '🔄 Researching...' : '🚀 Start Research'}
          </button>
        </div>
      </div>

      {/* Progress */}
      {isResearching && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.statusText}>{statusMessage}</p>
          
          <div className={styles.eventLog}>
            {events.map((event, i) => (
              <div key={i} className={styles.eventItem}>
                <span className={styles.eventType}>{event.event_type}</span>
                <span>{event.data.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>❌ {error}</div>}

      {/* Report */}
      {report && (
        <div className={styles.report}>
          <div className={styles.reportHeader}>
            <h3>📋 Research Report</h3>
            <div className={styles.reportMeta}>
              <span>Confidence: {(report.overall_confidence * 100).toFixed(0)}%</span>
              <span>Sources: {report.sources.length}</span>
              <span>Duration: {report.duration_seconds?.toFixed(1)}s</span>
            </div>
          </div>
          
          <div className={styles.reportBody}>
            {report.detailed_findings.map((f, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: f.full_report.replace(/\n/g, '<br/>') }} />
            ))}
          </div>
          
          <div className={styles.reportSources}>
            <h4>📚 Sources ({report.sources.length})</h4>
            {report.sources.map((s, i) => (
              <div key={i} className={styles.sourceCard}>
                <strong>{s.source_name}</strong>
                <span className={styles.relevanceBadge}>{(s.relevance_score * 100).toFixed(0)}% relevant</span>
                <p>{s.content_snippet.slice(0, 200)}...</p>
              </div>
            ))}
          </div>
          
          <div className={styles.followUps}>
            <h4>🔮 Follow-up Questions</h4>
            {report.follow_up_questions.map((q, i) => (
              <button key={i} onClick={() => setQuery(q)} className={styles.followUpBtn}>{q}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Database Schema

### MongoDB Collection: `research_reports`

```javascript
{
  _id: ObjectId,
  user_id: String,
  query: String,
  depth: String,
  status: String,
  summary: String,
  detailed_findings: Array,
  key_insights: Array,
  sources: [{
    source_id: String,
    source_name: String,
    source_type: String,
    relevance_score: Number,
    quality_score: Number,
    content_snippet: String,
    url: String
  }],
  overall_confidence: Number,
  coverage_score: Number,
  related_topics: Array,
  follow_up_questions: Array,
  iterations_performed: Number,
  duration_seconds: Number,
  created_at: ISODate,
  updated_at: ISODate
}
```

### Index recommendations:
```javascript
db.research_reports.createIndex({ user_id: 1, created_at: -1 });
db.research_reports.createIndex({ query: "text" });
```

---

## 7. Testing Plan

### Unit Tests

```python
# tests/test_research_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.agents.research_agent import DeepResearchAgent
from app.schemas.research_agent import ResearchRequest, ResearchDepth

@pytest.mark.asyncio
async def test_decompose_query():
    """Test query decomposition into sub-questions"""
    mock_rag = MagicMock()
    agent = DeepResearchAgent(mock_rag)
    
    sub_queries = await agent._decompose_query(
        "Compare React and Vue for enterprise applications",
        max_sub_queries=3
    )
    
    assert len(sub_queries) <= 3
    assert all(sq.question for sq in sub_queries)

@pytest.mark.asyncio
async def test_evaluate_sources():
    """Test source evaluation scoring"""
    mock_rag = MagicMock()
    agent = DeepResearchAgent(mock_rag)
    
    sources = [
        {"content": "React is a JavaScript library...", "source": "docs"},
        {"content": "", "source": "empty"}
    ]
    
    evaluated = await agent._evaluate_sources("React overview", sources)
    assert evaluated[0].relevance_score > evaluated[1].relevance_score

@pytest.mark.asyncio
async def test_full_research_pipeline():
    """Integration test for the full research pipeline"""
    # Mock OmniRAG
    mock_rag = MagicMock()
    mock_rag.process_query = AsyncMock(return_value={
        "answer": "React is a popular framework...",
        "content": "React uses virtual DOM...",
        "source": "react_docs"
    })
    
    agent = DeepResearchAgent(mock_rag)
    
    request = ResearchRequest(
        query="What is React?",
        depth=ResearchDepth.QUICK,
        max_iterations=1,
        include_web_search=False,
        include_graph_search=False
    )
    
    report = await agent.research(request, user_id="test_user")
    
    assert report.status == "completed"
    assert report.overall_confidence > 0
```

### E2E Test Commands

```bash
# Run unit tests
cd backend && python -m pytest tests/test_research_agent.py -v

# Test API endpoint
curl -X POST http://localhost:8000/api/v1/research/deep-research \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain microservices architecture", "depth": "standard"}'

# Test streaming
curl -X POST http://localhost:8000/api/v1/research/deep-research/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare SQL and NoSQL databases", "depth": "deep"}'
```

---

## 8. Configuration

### Environment Variables

```bash
# .env additions
RESEARCH_MAX_ITERATIONS=5
RESEARCH_DEFAULT_DEPTH=standard
RESEARCH_ENABLE_WEB_SEARCH=true
RESEARCH_SOURCE_MIN_RELEVANCE=0.4
RESEARCH_MAX_SOURCES_PER_ITERATION=10
```

### Rate Limiting

```python
# In api/v1/research.py
@router.post("/deep-research")
@limiter.limit("10/minute")  # Prevent abuse — research is expensive
async def deep_research(request: Request, ...):
    ...
```

---

## 9. File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `backend/app/schemas/research_agent.py` | All Pydantic schemas for the research agent |
| **MODIFY** | `backend/app/agents/research_agent.py` | Full agent implementation (currently empty) |
| **MODIFY** | `backend/app/api/v1/research.py` | Add deep-research endpoints |
| **NEW** | `frontend/src/services/research.ts` | Frontend API service with SSE streaming |
| **NEW** | `frontend/src/components/research/DeepResearchPanel.tsx` | React UI component |
| **NEW** | `frontend/src/components/research/DeepResearch.module.css` | Component styles |
| **MODIFY** | `frontend/src/app/(dashboard)/research/page.tsx` | Integrate DeepResearchPanel |
| **NEW** | `tests/test_research_agent.py` | Unit and integration tests |
