from typing import List, Dict, Optional, Any
import asyncio
from loguru import logger
from .hyde import HyDEEngine
from .reranker import FlashRankReranker
from .classifier import QueryComplexityClassifier
from .web_search import WebSearchFallback
from .evaluator import RetrievalEvaluator, CRAGPipeline, SelfCritique
from .graph_store import KnowledgeGraph
from .extractor import EntityExtractor
from .rewriter import QueryRewriter
from .answer_schema import get_schema_prompt, validate_answer_structure, AnswerComplexity
from .refiner import get_answer_refiner
from .density_controller import DensityController
from .language_optimizer import get_language_optimizer
from .quality_metrics import get_quality_metrics, get_quality_logger

class OmniRAGPipeline:
    """
    Orchestrates the advanced RAG pipeline
    """

    def __init__(
        self,
        vector_store,
        llm_client,
        web_search_api_key: str = None
    ):
        self.vector_store = vector_store
        self.llm_client = llm_client
        self.embedder = vector_store.model

        self.hyde_engine = HyDEEngine(llm_client, self.embedder)
        self.reranker = FlashRankReranker()
        self.complexity_classifier = QueryComplexityClassifier()
        self.knowledge_graph = KnowledgeGraph(llm_client=llm_client)
        self.entity_extractor = EntityExtractor(llm_client)

        self.evaluator = RetrievalEvaluator(llm_client=llm_client)
        self.web_search = WebSearchFallback(api_key=web_search_api_key)
        self.crag_pipeline = CRAGPipeline(self.evaluator, self.web_search)
        self.self_critique = SelfCritique(llm_client)
        self.query_rewriter = QueryRewriter(llm_client)
        
        # Text Quality Upgrades
        self.refiner = get_answer_refiner(llm_client)
        self.density_controller = DensityController()
        self.language_optimizer = get_language_optimizer()
        self.quality_metrics = get_quality_metrics()
        self.quality_logger = get_quality_logger()

    async def process_query(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        strategy: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        image_ids: Optional[List[str]] = None,
        db = None,
        memory_summary: Optional[str] = None,
        use_memory: bool = True
    ) -> Dict:
        """
        Process query through the advanced pipeline with memory integration
        """
        # 0. Memory Recall (If enabled and user_id provided)
        memory_context = ""
        user_profile = {}
        
        if use_memory and user_id:
            try:
                from app.services.memory.system import memory_system
                
                # Get relevant memories
                memories = await memory_system.recall(user_id, query, limit=3)
                if memories:
                    memory_texts = [m.get('memory', '') for m in memories if m.get('memory')]
                    if memory_texts:
                        memory_context = "Previous relevant context:\n" + "\n".join(memory_texts)
                        logger.info(f"Retrieved {len(memory_texts)} relevant memories")
                
                # Get user profile for personalization
                user_profile = await memory_system.get_user_profile(user_id)
            except Exception as e:
                logger.warning(f"Memory recall failed: {e}")
        
        # Combine with provided memory_summary
        if memory_summary:
            if memory_context:
                memory_context = f"{memory_context}\n\nSession Summary:\n{memory_summary}"
            else:
                memory_context = f"Session Summary:\n{memory_summary}"
        
        # 0.1 Visual Perception (If images present)
        visual_context = ""
        if image_urls or image_ids:
            from app.services.ai.image_processor import image_processor
            visual_context = await image_processor.get_visual_context(
                image_urls=image_urls,
                image_ids=image_ids,
                db=db
            )
            if visual_context:
                logger.info(f"Generated visual context using helper")

        # 0.2 Query Re-writing (Context Optimization with memory)
        # Enhanced query with memory context for better retrieval
        enhanced_query = query
        if memory_context:
            enhanced_query = f"{memory_context}\n\nCurrent question: {query}"
        
        optimized_query = await self.query_rewriter.rewrite(enhanced_query, history)

        # 0.2 Multi-Query Generation (ChatGPT/Gemini style for better coverage)
        queries = await self._generate_multi_queries(optimized_query)

        if visual_context:
            llm_query = f"{visual_context}\n\nUser Question: {optimized_query}"
        else:
            llm_query = optimized_query

        # 1. Strategy Selection (Adaptive or Explicit)
        if strategy:
            complexity = "SIMPLE" if strategy == "direct_generation" else ("MULTI_HOP" if strategy == "graph_rag" else "SINGLE_HOP")
            logger.info(f"Using explicit strategy: {strategy} (mapped to complexity: {complexity})")
        else:
            complexity = self.complexity_classifier.predict_complexity(optimized_query)
            logger.info(f"Query complexity (adaptive): {complexity}")

        messages = history or []
        if not any(msg.get("role") == "user" and msg.get("content") == query for msg in messages):
             messages.append({"role": "user", "content": query})

        if complexity == "SIMPLE":
            # Direct generation
            messages = history or []
            if visual_context:
                messages.append({"role": "user", "content": llm_query})
            elif not any(msg.get("role") == "user" and msg.get("content") == query for msg in messages):
                 messages.append({"role": "user", "content": query})

            response = await self.llm_client.get_completion(messages)
            return {
                "query": query,
                "strategy": "direct_generation",
                "response": response,
                "documents": [],
                "metadata": {"complexity": complexity}
            }

        # 2. Execution path
        if complexity == "MULTI_HOP":
            return await self._graph_rag_flow(optimized_query, user_id, session_id, history, visual_context=visual_context)

        # 3. SINGLE_HOP flow with Hybrid Search and Multi-Query Fusion
        all_retrieved_docs = []
        for q in queries:
            # HyDE transformation for each query
            hyde_result = await self.hyde_engine.transform_query(q)

            # Hybrid search retrieval
            results = self.vector_store.search(
                query=hyde_result['hypothetical_document'],
                user_id=user_id,
                session_id=session_id,
                k=20,
                alpha=0.6 # Favor semantic but include keyword
            )
            all_retrieved_docs.extend(results)

        # 4. Deduplicate and Rerank
        unique_docs = self._deduplicate_docs(all_retrieved_docs)

        reranked_results = self.reranker.rerank(
            query=optimized_query,
            documents=unique_docs,
            top_k=10
        )

        # 5. CRAG evaluation and correction
        crag_result = await self.crag_pipeline.retrieve_with_correction(
            query=optimized_query,
            retrieved_docs=reranked_results
        )

        final_docs = crag_result['documents']

        # 6. Contextual Compression (Refining results to reduce noise)
        compressed_docs = await self._compress_all_contexts(optimized_query, final_docs[:5])
        context_text = "\n\n".join(compressed_docs)

        # 7. Generate final response with Text Quality Upgrades
        
        # Get schema prompt based on complexity
        schema_instructions = get_schema_prompt(AnswerComplexity(complexity))
        
        system_prompt = f"""You are Engunity AI, an advanced multimodal assistant.

{schema_instructions}

CRITICAL RULES:
- Start with a direct, concise answer (≤2 sentences)
- Then explain in structured sections with headings
- Avoid filler phrases ("sure", "let's explore", "it's important to note")
- Prefer bullets over paragraphs when listing concepts
- End with concrete next steps or recommendations
- NEVER start with "Let me explain" or similar preambles
- Use declarative statements, not exploratory language

[HIERARCHICAL MEMORY SUMMARY]
{memory_summary if memory_summary else "No previous context summary available."}

Visual Information from provided images:
{visual_context if visual_context else "No images provided for this turn."}

Context from Documents:
{context_text}

Instructions:
1. Always cite your sources using [Source: filename].
2. If you are describing an image, be specific and use the 'Visual Information' provided above.
3. If the answer is not in the context, use your general knowledge but mention it.
"""

        final_messages = [{"role": "system", "content": system_prompt}]
        if history:
            final_messages.extend([m for m in history if m.get("role") != "system"])
        else:
            final_messages.append({"role": "user", "content": query})

        # STAGE A: Draft Generation (Fast, Factual)
        draft_response = await self.llm_client.get_completion(final_messages, temperature=0.3)
        
        # Validate draft structure
        validation = validate_answer_structure(draft_response, AnswerComplexity(complexity))
        
        # Analyze density and language quality
        density_analysis = self.density_controller.analyze_density(draft_response)
        llm_language_detected = self.language_optimizer.detect_llm_language(draft_response)
        naturalness_score = self.language_optimizer.score_naturalness(draft_response)
        
        logger.info(
            f"Draft quality: Structure={validation['overall_structure_score']:.2f}, "
            f"Density={density_analysis['density_score']:.2f}, "
            f"Naturalness={naturalness_score:.2f}"
        )
        
        # STAGE B: Refinement (Clarity-focused)
        refinement_result = await self.refiner.refine(
            draft_answer=draft_response,
            complexity=complexity,
            validation_scores=validation['scores']
        )
        
        # Use refined version if applied
        response = refinement_result['refined_answer']
        
        # Log refinement metrics
        if refinement_result['refinement_applied']:
            improvements = refinement_result['improvements']
            logger.info(
                f"Answer refined: "
                f"{improvements['words_removed']} words removed, "
                f"{improvements['filler_phrases_removed']} filler phrases removed"
            )
        
        # 7. Self-Critique / Reflection
        critique_result = await self.self_critique.critique(query, response, final_docs)
        logger.info(f"Self-critique confidence: {critique_result['confidence']}")

        # 8. Store interaction in memory (if enabled)
        if use_memory and user_id:
            try:
                from app.services.memory.system import memory_system
                await memory_system.remember(
                    user_id=user_id,
                    message=query,
                    response=response,
                    metadata={
                        'sources': [d.get('metadata', {}).get('filename', 'Unknown') for d in final_docs[:3]],
                        'strategy': 'vector_rag',
                        'confidence': critique_result['confidence']
                    }
                )
                logger.info(f"Stored interaction in memory for user {user_id}")
            except Exception as e:
                logger.warning(f"Memory storage failed: {e}")

        # 9. Calculate Overall Quality Metrics
        overall_quality = self.quality_metrics.calculate_overall_quality(
            structure_score=validation['overall_structure_score'],
            density_score=density_analysis['density_score'],
            naturalness_score=naturalness_score,
            confidence=critique_result['confidence'],
            complexity=complexity
        )
        
        # Log quality metrics
        self.quality_metrics.log_generation_quality(
            query=query,
            response=response,
            quality_data=overall_quality,
            refinement_data=refinement_result if refinement_result['refinement_applied'] else None
        )
        
        # Prepare metadata with quality scores
        metadata = {
            "complexity": complexity,
            "retrieval_quality": crag_result['retrieval_quality'],
            "used_web_search": crag_result['used_web_search'],
            "confidence": critique_result['confidence'],
            "critique": critique_result['critique'],
            "multi_queries": queries,
            "context_compressed": len(compressed_docs) > 0,
            "memory_used": bool(memory_context),
            "user_preferences": user_profile.get('preferences', [])[:2] if user_profile else [],
            # Text Quality Metrics
            "structure_score": validation['overall_structure_score'],
            "density_score": density_analysis['density_score'],
            "naturalness_score": naturalness_score,
            "overall_quality_score": overall_quality['overall_score'],
            "quality_tier": overall_quality['quality_tier'],
            "refinement_applied": refinement_result['refinement_applied'],
            "refinement_improvements": refinement_result.get('improvements', {})
        }
        
        # Log to quality logger
        self.quality_logger.log_interaction(query, response, metadata)
        
        return {
            "query": query,
            "strategy": "vector_rag",
            "response": response,
            "documents": final_docs[:5],
            "metadata": metadata
        }

    async def _generate_multi_queries(self, query: str) -> List[str]:
        """Generate multiple search queries and a 'step-back' abstraction to improve retrieval"""
        prompt = [
            {"role": "system", "content": "You are an AI assistant that improves retrieval by generating search variations. Return exactly 4 lines:\nLine 1-3: Diverse variations of the user's search intent.\nLine 4: A broader, more abstract 'step-back' version of the query to capture high-level concepts.\nNo numbering, just the queries."},
            {"role": "user", "content": f"Query: {query}"}
        ]
        try:
            res = await self.llm_client.get_completion(prompt, max_tokens=150, temperature=0.6)
            queries = [q.strip() for q in res.split('\n') if q.strip()][:4]
            if not queries:
                return [query]
            return queries
        except:
            return [query]

    def _deduplicate_docs(self, docs: List[Dict]) -> List[Dict]:
        seen = set()
        deduped = []
        for doc in docs:
            # Use content hash or some ID for deduplication
            content = doc.get('content', '')
            if content not in seen:
                seen.add(content)
                deduped.append(doc)
        return deduped

    async def _compress_context(self, query: str, document: str) -> str:
        """Refine document content to only relevant parts for the query"""
        prompt = [
            {"role": "system", "content": "Extract only the parts of the document that are relevant to answering the query. Keep original wording. If the entire document is relevant, return it as is. If none is relevant, return an empty string."},
            {"role": "user", "content": f"Query: {query}\n\nDocument: {document}\n\nRelevant Excerpts:"}
        ]
        try:
            res = await self.llm_client.get_completion(prompt, max_tokens=300, temperature=0.1)
            return res.strip()
        except:
            return document[:1000]

    async def _compress_all_contexts(self, query: str, docs: List[Dict]) -> List[str]:
        """Compress multiple documents in parallel"""
        tasks = [self._compress_context(query, doc['content']) for doc in docs]
        compressed = await asyncio.gather(*tasks)
        return [c for c in compressed if c]

    async def _graph_rag_flow(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str],
        history: Optional[List[Dict[str, str]]],
        visual_context: str = "",
        memory_summary: Optional[str] = None
    ) -> Dict:
        """
        Multi-hop queries: GraphRAG + Vector search + Map-Reduce
        """
        # ... rest of method
        # Search relevant communities
        relevant_communities = self.knowledge_graph.search_communities(query, embedder=self.embedder, top_k=3, user_id=user_id)

        # HyDE + Vector Search
        hyde_result = await self.hyde_engine.transform_query(query)
        vector_results = self.vector_store.search(
            query=hyde_result['hypothetical_document'],
            user_id=user_id,
            session_id=session_id,
            k=10
        )

        # Step 1: MAP Phase - Generate partial answers from each source
        map_tasks = []

        # Partial answers from communities
        for comm in relevant_communities:
            map_tasks.append(self._generate_partial_answer(query, comm['summary'], f"Community {comm['community_id']}"))

        # Partial answers from specific documents
        for doc in vector_results[:5]:
            map_tasks.append(self._generate_partial_answer(query, doc['content'], doc['metadata'].get('filename', 'Unknown')))

        partial_answers = list(await asyncio.gather(*map_tasks))

        # Add visual context and memory summary as sources if present
        if visual_context:
            partial_answers.append(f"Visual Information from provided images: {visual_context}")

        if memory_summary:
            partial_answers.append(f"Hierarchical Memory (Previous Context Summary): {memory_summary}")

        # Step 2: REDUCE Phase - Synthesize into final response
        reduce_prompt = f"""You are synthesizing multiple partial answers, previous context memory, and visual information into a comprehensive response for a complex query.
Original Question: {query}

Contextual Information:
{chr(10).join([f"{i+1}. {ans}" for i, ans in enumerate(partial_answers)])}

Instructions:
1. Identify common themes across partial answers, previous memory, and visual descriptions
2. Resolve any contradictions
3. Synthesize into a coherent, comprehensive answer
4. Maintain citations from original sources using [Source: name], [Memory Summary], or [Visual Description]

Comprehensive Answer:"""

        response = await self.llm_client.get_completion(
            [{"role": "system", "content": "You are a specialized synthesizer for multi-hop reasoning."},
             {"role": "user", "content": reduce_prompt}],
            temperature=0.3
        )

        # Step 3: Self-Critique
        critique_result = await self.self_critique.critique(query, response, vector_results)
        logger.info(f"GraphRAG self-critique confidence: {critique_result['confidence']}")

        return {
            "query": query,
            "strategy": "graph_rag",
            "response": response,
            "documents": vector_results[:5],
            "metadata": {
                "complexity": "MULTI_HOP",
                "communities_used": len(relevant_communities),
                "partial_answers_count": len(partial_answers),
                "map_reduce_used": True,
                "confidence": critique_result['confidence'],
                "critique": critique_result['critique']
            }
        }

    async def _generate_partial_answer(self, query: str, content: str, source_name: str) -> str:
        """Generate a partial answer from a single source for Map-Reduce"""
        prompt = f"""Based ONLY on the following source, provide a concise partial answer to the question.
Source: {source_name}
Content: {content[:1500]}

Question: {query}

Partial Answer (cite source):"""

        try:
            return await self.llm_client.get_completion(
                [{"role": "system", "content": "Generate a concise partial answer based on provided context."},
                 {"role": "user", "content": prompt}],
                max_tokens=250,
                temperature=0.2
            )
        except Exception as e:
            logger.error(f"Error generating partial answer for {source_name}: {e}")
            return f"Could not extract info from {source_name}"

    async def stream_query(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        strategy: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        image_ids: Optional[List[str]] = None,
        db = None,
        memory_summary: Optional[str] = None
    ):
        """
        Stream query response through the advanced pipeline
        """
        # 0. Visual Perception (If images present)
        visual_context = ""
        if image_urls or image_ids:
            from app.services.ai.image_processor import image_processor
            if not any(event.get("type") == "content" for event in []): # Just a trick to yield if we were in a generator
                 yield {"type": "content", "content": "🔍 *Analyzing images...*\n\n"}

            visual_context = await image_processor.get_visual_context(
                image_urls=image_urls,
                image_ids=image_ids,
                db=db
            )
            if visual_context:
                logger.info(f"Generated visual context using helper for streaming")

        # 0.1 Query Re-writing
        optimized_query = await self.query_rewriter.rewrite(query, history)
        if visual_context:
            llm_query = f"{visual_context}\n\nUser Question: {optimized_query}"
        else:
            llm_query = optimized_query

        # 1. Strategy Selection
        if strategy:
            complexity = "SIMPLE" if strategy == "direct_generation" else ("MULTI_HOP" if strategy == "graph_rag" else "SINGLE_HOP")
            logger.info(f"Using explicit strategy for stream: {strategy} (mapped to complexity: {complexity})")
        else:
            complexity = self.complexity_classifier.predict_complexity(optimized_query)

        yield {"type": "metadata", "complexity": complexity}

        messages = history or []
        if not any(msg.get("role") == "user" and msg.get("content") == query for msg in messages):
             messages.append({"role": "user", "content": query})

        if complexity == "SIMPLE":
            messages = history or []
            if visual_context:
                messages.append({"role": "user", "content": llm_query})
            elif not any(msg.get("role") == "user" and msg.get("content") == query for msg in messages):
                 messages.append({"role": "user", "content": query})

            async for chunk in self.llm_client.get_streaming_completion(messages):
                yield {"type": "content", "content": chunk}
            yield {"type": "done", "strategy": "direct_generation"}
            return

        if complexity == "MULTI_HOP":
            # GraphRAG Stream Flow
            hyde_result = await self.hyde_engine.transform_query(optimized_query)
            yield {"type": "metadata", "hyde_doc": hyde_result['hypothetical_document']}

            relevant_communities = self.knowledge_graph.search_communities(optimized_query, embedder=self.embedder, top_k=3, user_id=user_id)
            vector_results = self.vector_store.search(
                query=hyde_result['hypothetical_document'],
                user_id=user_id,
                session_id=session_id,
                k=10
            )

            # Step 1: MAP Phase
            map_tasks = []
            for comm in relevant_communities:
                map_tasks.append(self._generate_partial_answer(optimized_query, comm['summary'], f"Community {comm['community_id']}"))
            for doc in vector_results[:5]:
                map_tasks.append(self._generate_partial_answer(optimized_query, doc['content'], doc['metadata'].get('filename', 'Unknown')))

            partial_answers = list(await asyncio.gather(*map_tasks))

            # Add visual context and memory summary to synthesis
            if visual_context:
                partial_answers.append(f"Visual Information from provided images: {visual_context}")

            if memory_summary:
                partial_answers.append(f"Hierarchical Memory (Previous Context Summary): {memory_summary}")

            yield {
                "type": "metadata",
                "strategy": "graph_rag",
                "partial_answers_count": len(partial_answers),
                "retrieved_docs": [doc['metadata'].get('filename') for doc in vector_results[:5]]
            }

            # Step 2: REDUCE Phase (Streaming the final synthesis)
            reduce_prompt = f"""You are synthesizing multiple partial answers, previous context memory, and visual information into a comprehensive response for a complex query.
Original Question: {optimized_query}

Contextual Information:
{chr(10).join([f"{i+1}. {ans}" for i, ans in enumerate(partial_answers)])}

Instructions:
1. Identify common themes across partial answers, previous memory, and visual descriptions
2. Resolve any contradictions
3. Synthesize into a coherent, comprehensive answer
4. Maintain citations from original sources using [Source: name], [Memory Summary], or [Visual Description]

Comprehensive Answer:"""

            final_messages = [
                {"role": "system", "content": "You are a specialized synthesizer for multi-hop reasoning."},
                {"role": "user", "content": reduce_prompt}
            ]

            full_response = ""
            async for chunk in self.llm_client.get_streaming_completion(final_messages, temperature=0.3):
                full_response += chunk
                yield {"type": "content", "content": chunk}

            # Step 3: Self-Critique
            critique_result = await self.self_critique.critique(optimized_query, full_response, vector_results)
            yield {
                "type": "metadata",
                "confidence": critique_result['confidence'],
                "critique": critique_result['critique']
            }

            yield {"type": "done", "strategy": "graph_rag"}
            return

        # SINGLE_HOP flow with Hybrid Search and Multi-Query Fusion
        all_retrieved_docs = []
        queries = await self._generate_multi_queries(optimized_query)

        yield {"type": "metadata", "multi_queries": queries}

        for q in queries:
            hyde_result = await self.hyde_engine.transform_query(q)
            results = self.vector_store.search(
                query=hyde_result['hypothetical_document'],
                user_id=user_id,
                session_id=session_id,
                k=20,
                alpha=0.6
            )
            all_retrieved_docs.extend(results)

        unique_docs = self._deduplicate_docs(all_retrieved_docs)
        reranked_results = self.reranker.rerank(query=optimized_query, documents=unique_docs, top_k=10)

        crag_result = await self.crag_pipeline.retrieve_with_correction(optimized_query, reranked_results)
        final_docs = crag_result['documents']
        retrieved_doc_names = [doc['metadata'].get('filename') for doc in final_docs[:5]]

        # 6. Contextual Compression (Refining streaming context)
        compressed_docs = await self._compress_all_contexts(optimized_query, final_docs[:5])
        context_text = "\n\n".join(compressed_docs)

        yield {
            "type": "metadata",
            "strategy": "vector_rag",
            "retrieval_quality": crag_result['retrieval_quality'],
            "used_web_search": crag_result['used_web_search'],
            "retrieved_docs": retrieved_doc_names,
            "context_compressed": len(compressed_docs) > 0
        }

        system_prompt = f"""You are Engunity AI, an advanced multimodal assistant.
Use the following retrieved context from documents, hierarchical memory summary of previous context, and visual descriptions from images to answer the user's question accurately.

[HIERARCHICAL MEMORY SUMMARY]
{memory_summary if memory_summary else "No previous context summary available."}

Visual Information from provided images:
{visual_context if visual_context else "No images provided for this turn."}

Context from Documents:
{context_text}

Instructions:
1. Always cite your sources using [Source: filename].
2. If you are describing an image, be specific and use the 'Visual Information' provided above.
3. If the answer is not in the context, use your general knowledge but mention it.
"""

        final_messages = [{"role": "system", "content": system_prompt}]
        if history:
            final_messages.extend([m for m in history if m.get("role") != "system"])
        else:
            final_messages.append({"role": "user", "content": query})

        full_response = ""
        async for chunk in self.llm_client.get_streaming_completion(final_messages, temperature=0.3):
            full_response += chunk
            yield {"type": "content", "content": chunk}

        # Self-Critique
        critique_result = await self.self_critique.critique(optimized_query, full_response, final_docs)
        yield {
            "type": "metadata",
            "confidence": critique_result['confidence'],
            "critique": critique_result['critique']
        }

        yield {"type": "done", "strategy": "vector_rag"}
