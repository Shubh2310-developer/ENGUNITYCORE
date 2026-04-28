from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional, List, Literal
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db, SessionLocal, SessionLocal
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.chat import ChatSession
from app.services.rag.pipeline import OmniRAGPipeline
from app.services.ai.router import ai_router
from app.services.ai.turbo_quant_service import turbo_quant_service
from app.services.ai.dependencies import get_vector_store
from app.services.ai.groq_client import groq_client
from app.services.ai.document_processor import document_processor
from datetime import datetime
import time
import uuid
import json
from loguru import logger

router = APIRouter()

# Pipeline instance - will be initialized lazily on first use
_omni_rag_pipeline = None

def get_omni_rag_pipeline():
    """Lazy initialize the OmniRAG pipeline"""
    global _omni_rag_pipeline
    if _omni_rag_pipeline is None:
        _omni_rag_pipeline = OmniRAGPipeline(
            vector_store=get_vector_store(),
            llm_client=groq_client
        )
    return _omni_rag_pipeline

class TurboQuantRequestSchema(BaseModel):
    enabled: bool = False
    mode: Literal["auto", "force", "off"] = "auto"
    target: Literal["kv_cache", "embeddings", "auto"] = "auto"
    variant: Literal["mse", "prod"] = "prod"
    bit_width: Literal[2, 3, 4, 5, 6, 7, 8] = 4


class OmniRAGRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    strategy: Optional[str] = None
    include_metadata: bool = True
    image_urls: Optional[List[str]] = []
    image_ids: Optional[List[str]] = []
    turbo_quant: Optional[TurboQuantRequestSchema] = None

class OmniRAGResponse(BaseModel):
    query: str
    response: str
    strategy: str
    documents: List[dict]
    metadata: dict
    latency: float

@router.post("/query", response_model=OmniRAGResponse)
async def process_omni_rag_query(
    request: OmniRAGRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process query using Omni-RAG pipeline with persistence
    """
    start_time = time.time()

    # 1. Get or create session
    session_id = request.session_id
    if not session_id:
        session = ChatSession(user_id=current_user.id, title=request.query[:30] + "...")
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    # 2. Save user message to MongoDB
    user_msg_data = {
        "session_id": session_id,
        "user_id": str(current_user.id),
        "role": "user",
        "content": request.query,
        "image_urls": request.image_urls,
        "image_ids": request.image_ids,
        "timestamp": datetime.now()
    }
    if mongodb.db is not None:
        try:
            await mongodb.db.chat_messages.insert_one(user_msg_data)
        except Exception as e:
            logger.warning(f"Failed to insert user message into MongoDB: {e}")

    # 3. Build optimized context using Hierarchical Memory
    from app.services.chat.context import build_context
    history, _, context_meta = await build_context(
        session_id=session_id,
        user_id=str(current_user.id),
        query=request.query
    )

    try:
        # 4. Process through Omni-RAG
        pipeline = get_omni_rag_pipeline()
        result = await pipeline.process_query(
            query=request.query,
            user_id=str(current_user.id),
            session_id=session_id,
            history=history,
            strategy=request.strategy,
            image_urls=request.image_urls,
            image_ids=request.image_ids,
            db=db,
            memory_summary=context_meta.get("memory_summary")
        )

        # Inject memory metadata into result
        result['metadata'].update(context_meta)

        # 5. Save assistant message
        # Flatten metadata for schema consistency with chat.py and ChatMessage schema
        rag_metadata = result.get('metadata', {})
        assistant_msg_data = {
            "session_id": session_id,
            "user_id": str(current_user.id),
            "role": "assistant",
            "content": result['response'],
            "timestamp": datetime.now(),
            "retrieved_docs": [doc['metadata'].get('filename') for doc in result.get('documents', [])],
            **rag_metadata
        }
        if mongodb.db is not None:
            try:
                await mongodb.db.chat_messages.insert_one(assistant_msg_data)
            except Exception as e:
                logger.warning(f"Failed to insert assistant message into MongoDB: {e}")

        # 6. Update session title if needed
        # Generate a smart title if it's currently a placeholder or generic
        is_generic = not session.title or session.title in ["New Conversation", "New Chat"] or session.title.endswith("...")
        if is_generic:
            try:
                generated_title = await ai_router.generate_title(request.query)
                if generated_title and len(generated_title) > 3:
                    session.title = generated_title
            except Exception as e:
                logger.warning(f"Omni-RAG title generation failed: {e}")
                if not session.title or session.title in ["New Conversation", "New Chat"]:
                    session.title = request.query[:47] + "..."

        session.updated_at = datetime.now()
        db.commit()

        latency = time.time() - start_time

        return OmniRAGResponse(
            query=request.query,
            response=result['response'],
            strategy=result['strategy'],
            documents=result['documents'] if request.include_metadata else [],
            metadata=result['metadata'],
            latency=latency
        )

    except Exception as e:
        logger.error(f"Error in Omni-RAG query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """
    Upload document and index in vector store and knowledge graph
    """
    try:
        # Generate document ID
        document_id = str(uuid.uuid4())

        # Read file content
        content = await file.read()

        # Extract text using existing document_processor
        text = document_processor.extract_text(content, file.filename)

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from document")

        # Chunk and index in vector store
        metadata = {
            'document_id': document_id,
            'user_id': str(current_user.id),
            'filename': file.filename,
            'session_id': session_id
        }

        # Index in vector store
        chunks_count = await document_processor.process_and_index(content, file.filename, metadata)

        # Build knowledge graph in background
        if background_tasks:
            background_tasks.add_task(
                build_graph_for_document,
                document_id=document_id,
                text=text,
                user_id=str(current_user.id)
            )

        return {
            'document_id': document_id,
            'filename': file.filename,
            'chunks': chunks_count,
            'status': 'indexed'
        }

    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def build_graph_for_document(document_id: str, text: str, user_id: str):
    """
    Background task to extract entities and relationships for Knowledge Graph
    and trigger community detection/summarization.
    """
    try:
        # Step 1: Extract entities and relationships
        pipeline = get_omni_rag_pipeline()
        entities, relationships = await pipeline.entity_extractor.extract_from_text(text, document_id)

        for entity in entities:
            pipeline.knowledge_graph.add_entity(
                entity_id=entity['id'],
                name=entity['name'],
                type=entity['type'],
                description=entity['description'],
                metadata={'user_id': user_id, 'document_id': document_id}
            )

        for rel in relationships:
            pipeline.knowledge_graph.add_relationship(
                source=rel['source'],
                target=rel['target'],
                relation=rel['relation'],
                description=rel['description']
            )

        # Step 2: Detect communities if graph has grown
        pipeline.knowledge_graph.detect_communities()

        # Step 3: Generate summaries for new or updated communities
        await pipeline.knowledge_graph.generate_community_summaries()

        # Step 4: Persist changes
        pipeline.knowledge_graph.save()
        logger.info(f"Updated knowledge graph and communities for document {document_id}")
    except Exception as e:
        logger.error(f"Error building graph for document {document_id}: {e}")

@router.get("/stats")
async def get_omni_rag_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get Omni-RAG statistics for user
    """
    try:
        # Filter metadata for user's documents
        vs = get_vector_store()
        user_docs_meta = [
            m for m in vs.metadata
            if str(m.get('user_id')) == str(current_user.id)
        ]

        doc_ids = set(m.get('document_id') for m in user_docs_meta if m.get('document_id'))

        return {
            'documents': len(doc_ids),
            'chunks': len(user_docs_meta)
        }

    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/communities")
async def get_graph_communities(
    current_user: User = Depends(get_current_user)
):
    """
    Get knowledge graph communities for user
    """
    try:
        # Filter communities by user
        # In this implementation, entities have user_id in metadata
        user_id_str = str(current_user.id)
        user_communities = []

        # This is a bit inefficient but works for the current schema
        pipeline = get_omni_rag_pipeline()
        for comm_id, summary in pipeline.knowledge_graph.community_summaries.items():
            # Handle both string and int keys for communities
            lookup_id = int(comm_id) if comm_id.isdigit() else comm_id
            nodes = pipeline.knowledge_graph.communities.get(str(comm_id),
                    pipeline.knowledge_graph.communities.get(lookup_id, []))

            # Check if any node in community belongs to user
            is_user_community = False
            for node in nodes:
                entity = pipeline.knowledge_graph.entities.get(node)
                if entity and entity.get('metadata', {}).get('user_id') == user_id_str:
                    is_user_community = True
                    break

            if is_user_community:
                user_communities.append({
                    'community_id': comm_id,
                    'entity_count': len(nodes),
                    'summary': summary
                })

        return {
            'communities': user_communities,
            'total': len(user_communities)
        }
    except Exception as e:
        logger.error(f"Error fetching communities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/graph/rebuild")
async def rebuild_graph(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Trigger community detection and summarization for knowledge graph
    """
    background_tasks.add_task(rebuild_user_graph_task)
    return {"status": "rebuilding", "message": "Graph rebuild started in background"}

async def rebuild_user_graph_task():
    """
    Background task to detect communities and generate summaries
    """
    try:
        pipeline = get_omni_rag_pipeline()
        pipeline.knowledge_graph.detect_communities()
        await pipeline.knowledge_graph.generate_community_summaries()
        pipeline.knowledge_graph.save()
        logger.info("Knowledge graph rebuild completed")
    except Exception as e:
        logger.error(f"Error in graph rebuild task: {e}")

@router.post("/stream")
async def stream_omni_rag_query(
    request: OmniRAGRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process query and stream response using Omni-RAG pipeline with persistence
    """
    turbo_quant_request = request.turbo_quant.model_dump() if request.turbo_quant else None

    config_error = turbo_quant_service.validate_config(turbo_quant_request)
    if config_error:
        raise HTTPException(status_code=422, detail=config_error)

    # 1. Get or create session
    session_id = request.session_id
    if not session_id:
        try:
            session = ChatSession(user_id=current_user.id, title=request.query[:30] + "...")
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create session in omni-rag/stream: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create session: {type(e).__name__}")
    else:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    # 2. Save user message to MongoDB
    user_msg_data = {
        "session_id": session_id,
        "user_id": str(current_user.id),
        "role": "user",
        "content": request.query,
        "image_urls": request.image_urls,
        "image_ids": request.image_ids,
        "timestamp": datetime.now()
    }
    # We defer MongoDB insertion until inside the event generator so we can gracefully stream errors if needed.

    # 3. Build optimized context using Hierarchical Memory
    from app.services.chat.context import build_context
    history, _, context_meta = await build_context(
        session_id=session_id,
        user_id=str(current_user.id),
        query=request.query
    )

    async def event_generator():
        # Create a dedicated session for the streaming context
        # The injected 'db' session will be closed by FastAPI as soon as the response starts
        stream_db = SessionLocal()

        full_response = ""
        final_metadata = {}
        final_metadata.update(context_meta) # Start with memory metadata
        runtime_provider = ai_router.get_provider_identity_for_strategy(request.strategy)
        turbo_quant_metadata = turbo_quant_service.evaluate_request(runtime_provider, turbo_quant_request)
        if turbo_quant_metadata:
            final_metadata["turbo_quant"] = turbo_quant_metadata

        try:
            if mongodb.db is not None:
                try:
                    await mongodb.db.chat_messages.insert_one(user_msg_data)
                except Exception as e:
                    logger.warning(f"Failed to insert user message into MongoDB: {e}")

            initial_metadata_payload = {'type': 'metadata', 'session_id': session_id, **context_meta}
            if turbo_quant_metadata:
                initial_metadata_payload['turbo_quant'] = turbo_quant_metadata

            # Yield session and runtime metadata before meaningful content
            yield f"data: {json.dumps(initial_metadata_payload)}\n\n"

            # Load the pipeline in a thread-pool executor to avoid blocking the event loop.
            # OmniRAGPipeline init loads sentence transformers which can take 30+ seconds.
            import asyncio as _asyncio
            pipeline = await _asyncio.to_thread(get_omni_rag_pipeline)
            async for event in pipeline.stream_query(
                query=request.query,
                user_id=str(current_user.id),
                session_id=session_id,
                history=history,
                strategy=request.strategy,
                image_urls=request.image_urls,
                image_ids=request.image_ids,
                db=stream_db, # Use the streaming session
                memory_summary=context_meta.get("memory_summary")
            ):
                if event['type'] == 'content':
                    full_response += event['content']
                elif event['type'] == 'metadata':
                    final_metadata.update({k: v for k, v in event.items() if k != 'turbo_quant'})
                    incoming_turbo = event.get('turbo_quant')
                    if incoming_turbo is not None:
                        merged_turbo = dict(final_metadata.get('turbo_quant') or {})
                        merged_turbo.update({k: v for k, v in incoming_turbo.items() if v is not None})
                        final_metadata['turbo_quant'] = merged_turbo
                yield f"data: {json.dumps(event)}\n\n"

            # Save assistant message after stream ends
            # Flatten metadata for schema consistency with ChatMessage schema
            assistant_msg_data = {
                "session_id": session_id,
                "user_id": str(current_user.id),
                "role": "assistant",
                "content": full_response,
                "timestamp": datetime.now(),
                "retrieved_docs": final_metadata.get('retrieved_docs', []),
                "turbo_quant": final_metadata.get('turbo_quant'),
                **final_metadata
            }
            if mongodb.db is not None:
                try:
                    res = await mongodb.db.chat_messages.insert_one(assistant_msg_data)
                    msg_id = str(res.inserted_id)
                except Exception as e:
                    logger.warning(f"Failed to insert assistant message: {e}")
                    msg_id = str(uuid.uuid4())
            else:
                msg_id = str(uuid.uuid4())

            # Update session - Re-fetch using stream_db
            chat_session = stream_db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if chat_session:
                generated_title = None
                is_generic = not chat_session.title or chat_session.title in ["New Conversation", "New Chat"] or chat_session.title.endswith("...")
                if is_generic:
                    try:
                        generated_title = await ai_router.generate_title(request.query)
                        if generated_title and len(generated_title) > 3:
                            chat_session.title = generated_title
                        else:
                            generated_title = chat_session.title or "New Chat"
                    except Exception as e:
                        logger.warning(f"Omni-RAG stream title generation failed: {e}")
                        if not chat_session.title or chat_session.title in ["New Conversation", "New Chat"]:
                            chat_session.title = request.query[:47] + "..."
                        generated_title = chat_session.title
                else:
                    generated_title = chat_session.title

                chat_session.updated_at = datetime.now()
                stream_db.commit()

                yield f"data: {json.dumps({'type': 'done', 'message_id': msg_id, 'title': generated_title})}\n\n"

        except (BrokenPipeError, IOError, GeneratorExit, ConnectionResetError) as e:
            # Client disconnected — swallow silently, no need to stream an error back
            logger.warning(f"Client disconnected during streaming: {type(e).__name__}")
        except Exception as e:
            logger.error(f"Error in Omni-RAG streaming: {str(e)}")
            try:
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            except (BrokenPipeError, IOError):
                pass  # Client already gone
        finally:
            stream_db.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
