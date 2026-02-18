import asyncio
import uuid
from typing import List, Dict, Optional, Any, AsyncGenerator
from datetime import datetime
from loguru import logger
import json

from app.services.rag.pipeline import OmniRAGPipeline
from app.services.rag.web_search import WebSearchFallback
from app.services.rag.graph_store import KnowledgeGraph
from app.services.rag.classifier import QueryComplexityClassifier
from app.services.rag.quality_metrics import get_quality_metrics
from app.services.rag.reranker import FlashRankReranker
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
        self.graph_store = KnowledgeGraph()
        
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
            iterations_to_run = min(request.max_iterations, config["max_iterations"])
            
            for iteration in range(iterations_to_run):
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
                # Keep good sources
                accepted_sources = [s for s in evaluated if s.relevance_score > 0.4]
                all_sources.extend(accepted_sources)
                
                # Check coverage
                gaps = await self._identify_gaps(
                    request.query, sub_queries, all_sources
                )
                
                iteration_record = ResearchIteration(
                    iteration_number=iteration + 1,
                    sub_queries_searched=[sq.question for sq in sub_queries],
                    sources_found=len(iteration_sources),
                    sources_accepted=len(accepted_sources),
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
                sub_queries = [SubQuery(id=f"refine_{iteration}_{i}", question=q, query_type="exploratory") 
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
        total_max_iterations = min(request.max_iterations, config["max_iterations"])
        
        for iteration in range(total_max_iterations):
            progress_base = 15 + (float(iteration) / total_max_iterations) * 60.0
            
            yield ResearchStreamEvent(
                event_type="status",
                data={
                    "message": f"Searching (iteration {iteration + 1}/{total_max_iterations})...",
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
            
            yield ResearchStreamEvent(
                event_type="status",
                data={
                    "message": f"DEBUG: Found {len(iteration_sources)} raw sources",
                    "phase": "searching_debug"
                },
                timestamp=datetime.utcnow(),
                progress_percent=progress_base + 2
            )
            for source in iteration_sources[:3]:  # Stream top 3 discoveries
                content_preview = source.get("content", "")
                if not content_preview:
                    content_preview = source.get("answer", "")
                
                yield ResearchStreamEvent(
                    event_type="source_found",
                    data={
                        "message": f"Found source: {source.get('source', 'Unknown')}",
                        "source_name": source.get("source", "Unknown"),
                        "snippet": content_preview[:200]
                    },
                    timestamp=datetime.utcnow(),
                    progress_percent=progress_base + 5
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
            sub_queries = [SubQuery(id=f"refine_{iteration}_{i}", question=q, query_type="exploratory")
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
                progress_percent=progress_base + 10
            )
        
        yield ResearchStreamEvent(
            event_type="status",
            data={"message": "Synthesizing research report...", "phase": "synthesizing"},
            timestamp=datetime.utcnow(),
            progress_percent=85.0
        )
        
        report = await self._synthesize_report(
            uuid.uuid4(), request, all_sources, iteration_history, started_at
        )
        
        yield ResearchStreamEvent(
            event_type="complete",
            data={"message": "Research completed", "report": report.model_dump(mode="json")},
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

        try:
            response = await groq_client.get_completion([
                {"role": "system", "content": "You are a research decomposition expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ])
            
            # Simple parsing attempt
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            
            parsed = json.loads(response_clean)
            return [
                SubQuery(id=f"sq_{i}", **item) 
                for i, item in enumerate(parsed[:max_sub_queries])
            ]
        except Exception as e:
            logger.warning(f"Decomposition failed, using fallback: {e}")
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
            # Using process_query from OmniRAGPipeline
            search_tasks.append(
                self.omni_rag.process_query(
                    query=sq.question,
                    user_id=user_id,
                    session_id=session_id,
                    use_memory=False,
                    strategy="vector_rag" # Explicitly use vector RAG to avoid recursive loops
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
                    # Wrap graph search to match task interface if needed
                    self._graph_search_wrapper(sq.question, user_id)
                )
        
        results = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                logger.warning(f"Search task failed: {result}")
                continue
            
            # Handle RAG result structure
            if isinstance(result, dict) and "documents" in result:
                # This is likely from process_query
                docs = result.get("documents", [])
                for d in docs:
                    # Normalize RAG docs
                    all_results.append({
                        "content": d.get("content", ""),
                        "source": d.get("metadata", {}).get("filename", "Internal Doc"),
                        "type": "rag_document",
                        "url": None,
                        "metadata": d.get("metadata", {})
                    })
            
            # Handle Web Search result structure (List[Dict])
            elif isinstance(result, list):
                # Could be web search results or graph results
                for item in result:
                     all_results.append(item)
            
            # Handle single dictionary result (rare but possible)
            elif isinstance(result, dict):
                 all_results.append(result)
        
        return all_results

    async def _graph_search_wrapper(self, query: str, user_id: str) -> List[Dict]:
        """Wrapper to call graph store and normalize output"""
        try:
             # Search communities using keyword fallback as we don't have embedder locally easily accessible 
             # without accessing omni_rag's embedder, which is standard.
             # Ideally pass omni_rag.embedder if exposed.
             communities = self.graph_store.search_communities(
                 query, 
                 embedder=self.omni_rag.vector_store.model, 
                 top_k=3, 
                 user_id=user_id
             )
             results = []
             for comm in communities:
                 results.append({
                     "content": comm.get("summary", ""),
                     "source": f"Community {comm.get('community_id')}",
                     "type": "graph_node",
                     "metadata": {"score": comm.get("score")}
                 })
             return results
        except Exception as e:
            logger.error(f"Graph search wrapper error: {e}")
            return []

    async def _evaluate_sources(
        self,
        query: str,
        sources: List[Dict[str, Any]],
        exclude: Optional[List[str]] = None
    ) -> List[SourceEvaluation]:
        """Score and filter sources for relevance and quality"""
        evaluations = []
        
        for i, source in enumerate(sources):
            # Extract content robustly
            content = source.get("content", "")
            if not content:
                content = source.get("snippet", "") # Web search often has snippet
                
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
                content_snippet=content[:800],
                url=source.get("url") or source.get("metadata", {}).get("url")
            ))
        
        # Sort by combined score
        evaluations.sort(
            key=lambda e: (e.relevance_score * 0.7 + e.quality_score * 0.3),
            reverse=True
        )
        
        # Remove duplicates based on content similarity or names?
        # For now, unique by source_name
        unique_evaluations = []
        seen_names = set()
        for e in evaluations:
            if e.source_name not in seen_names:
                seen_names.add(e.source_name)
                unique_evaluations.append(e)
                
        return unique_evaluations

    async def _score_relevance(self, query: str, content: str) -> float:
        """Score how relevant content is to the query"""
        if not content.strip():
            return 0.0
        if len(content) < 50:
            return 0.2
        
        # Fast path check: Keywords
        query_terms = set(query.lower().split())
        content_lower = content.lower()
        term_matches = sum(1 for term in query_terms if term in content_lower)
        keyword_score = term_matches / len(query_terms) if query_terms else 0
        
        # If very high keyword match, return high score without LLM
        if keyword_score > 0.8:
            return 0.9
            
        prompt = f"""Rate the relevance of this content to the query on a scale of 0.0 to 1.0.
Query: "{query}"
Content: "{content[:600]}"
Return ONLY a single float number between 0.0 and 1.0."""

        try:
            response = await groq_client.get_completion([
                {"role": "user", "content": prompt}
            ], max_tokens=10)
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
        if len(content) > 300:
            score += 0.2
        
        # Structure bonus (has sections, lists)
        if any(marker in content for marker in ["##", "- ", "1.", "•"]):
            score += 0.1
        
        # Code/data bonus
        if "```" in content or any(kw in content.lower() for kw in ["average", "percent", "figure", "table", "conclusion"]):
            score += 0.2
        
        return min(1.0, score)

    async def _identify_gaps(
        self,
        query: str,
        sub_queries: List[SubQuery],
        sources: List[SourceEvaluation]
    ) -> List[str]:
        """Identify what's still missing from the research"""
        if not sources:
            return ["No sources found yet."]
            
        covered_content = "\n".join([f"- {s.content_snippet}" for s in sources[:8]])
        questions_asked = "\n".join([sq.question for sq in sub_queries])
        
        prompt = f"""Given this research query and the snippets found so far, identify 
missing knowledge or coverage gaps. What important aspects are NOT yet covered?

Original Query: "{query}"
Sub-questions already asked: 
{questions_asked}

Content found so far:
{covered_content[:2000]}

Return as JSON array of strings:
["gap 1 description", "gap 2 description", ...]
If coverage is sufficient, return [].
Return ONLY the JSON array."""

        try:
            response = await groq_client.get_completion([
                {"role": "user", "content": prompt}
            ])
            # Cleaning
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            
            return json.loads(response_clean)
        except Exception:
            return []

    async def _generate_refinement_queries(self, gaps: List[str]) -> List[str]:
        """Generate new search queries to fill identified gaps"""
        if not gaps:
            return []
        
        # Simple heuristic mapping first
        queries = [f"{gap}" for gap in gaps[:3]]
        return queries

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
            "detailed": "Provide a comprehensive, well-structured research report with sections (Introduction, Findings, Analysis, Conclusion), using markdown.",
            "summary": "Provide a concise executive summary (3-5 paragraphs).",
            "bullet_points": "Provide key findings as organized bullet points."
        }

        depth_constraints = ""
        if request.depth == ResearchDepth.QUICK:
            depth_constraints = "Keep the report brief and concise (around 300-500 words). Use only the most relevant 2-3 sources."
        elif request.depth == ResearchDepth.EXHAUSTIVE:
            depth_constraints = "Provide an EXHAUSTIVE and extremely detailed report (at least 1500-2000 words). You MUST use and cite ALL provided sources. Elaborate on every minor detail and connection."

        prompt = f"""Synthesize a research report from these sources.
{depth_constraints}

Research Question: "{request.query}"
Target Format: {format_instructions.get(request.output_format, format_instructions["detailed"])}

Sources:
{source_content}

Your report must include:
1. Executive Summary
2. Key Findings (Cite sources as [Source: name])
3. Detailed Analysis
4. Limitations/Caveats
5. Suggested Follow-up Questions
6. Related Topics

Write clearly and professionally."""

        report_text = await groq_client.get_completion([
            {"role": "system", "content": "You are an expert research analyst. Create well-structured, cited reports."},
            {"role": "user", "content": prompt}
        ])
        
        completed_at = datetime.utcnow()
        
        # Extract lists using simple regex or split heuristic to avoid more LLM calls if possible,
        # but for quality we use specific extraction prompts
        key_insights = await self._extract_list(report_text, "key findings (short bullet points)")
        follow_ups = await self._extract_list(report_text, "follow-up questions")
        related = await self._extract_list(report_text, "related topics")
        
        return ResearchReport(
            id=report_id,
            query=request.query,
            depth=request.depth,
            status=ResearchStatus.COMPLETED,
            summary=report_text[:1000] + "...", # Store full text in detailed_findings usually
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
        prompt = f"""Extract the {category} from this text.
Text: {text[:3000]}...

Return valid JSON array of strings: ["item1", "item2"]"""
        
        try:
            response = await groq_client.get_completion([{"role": "user", "content": prompt}], max_tokens=300)
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            return json.loads(response_clean)
        except Exception:
            return []

    def _calculate_confidence(self, sources, iterations) -> float:
        """Calculate overall research confidence score"""
        if not sources:
            return 0.0
        avg_relevance = sum(s.relevance_score for s in sources) / len(sources)
        source_count_factor = min(1.0, len(sources) / 5.0)
        return round(avg_relevance * 0.7 + source_count_factor * 0.3, 2)

    def _calculate_coverage(self, sources) -> float:
        """Calculate topic coverage score"""
        if not sources:
            return 0.0
        unique_types = len(set(s.source_type for s in sources))
        type_diversity = min(1.0, unique_types / 3.0)
        source_quality = sum(s.quality_score for s in sources) / len(sources)
        return round(type_diversity * 0.4 + source_quality * 0.6, 2)


# Singleton factory
_research_agent = None

def get_research_agent(omni_rag: OmniRAGPipeline) -> DeepResearchAgent:
    global _research_agent
    if _research_agent is None:
        _research_agent = DeepResearchAgent(omni_rag)
    return _research_agent
