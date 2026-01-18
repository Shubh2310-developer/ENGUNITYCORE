from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.chat import ChatSession
from app.services.rag.pipeline import OmniRAGPipeline
from app.services.ai.router import ai_router
from app.services.ai.vector_store import vector_store
from app.services.ai.groq_client import groq_client
from app.services.ai.document_processor import document_processor
from datetime import datetime
import time
import uuid
import json
from loguru import logger

router = APIRouter()

# Initialize the pipeline
omni_rag_pipeline = OmniRAGPipeline(
    vector_store=vector_store,
    llm_client=groq_client
)

class OmniRAGRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    strategy: Optional[str] = None
    include_metadata: bool = True
    image_urls: Optional[List[str]] = []
    image_ids: Optional[List[str]] = []

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
        "user_id": current_user.id,
        "role": "user",
        "content": request.query,
        "image_urls": request.image_urls,
        "image_ids": request.image_ids,
        "timestamp": datetime.now()
    }
    if mongodb.db is not None:
        await mongodb.db.chat_messages.insert_one(user_msg_data)

    # 3. Build optimized context using Hierarchical Memory
    from app.services.chat.context import build_context
    history, _, context_meta = await build_context(
        session_id=session_id,
        user_id=str(current_user.id),
        query=request.query
    )

    try:
        # 4. Process through Omni-RAG
        result = await omni_rag_pipeline.process_query(
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
            "user_id": current_user.id,
            "role": "assistant",
            "content": result['response'],
            "timestamp": datetime.now(),
            "retrieved_docs": [doc['metadata'].get('filename') for doc in result.get('documents', [])],
            **rag_metadata
        }
        if mongodb.db is not None:
            await mongodb.db.chat_messages.insert_one(assistant_msg_data)

        # 6. Update session title if needed
        if session.title.endswith("..."):
            try:
                session.title = await ai_router.generate_title(request.query)
            except:
                pass
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
        entities, relationships = await omni_rag_pipeline.entity_extractor.extract_from_text(text, document_id)

        for entity in entities:
            omni_rag_pipeline.knowledge_graph.add_entity(
                entity_id=entity['id'],
                name=entity['name'],
                type=entity['type'],
                description=entity['description'],
                metadata={'user_id': user_id, 'document_id': document_id}
            )

        for rel in relationships:
            omni_rag_pipeline.knowledge_graph.add_relationship(
                source=rel['source'],
                target=rel['target'],
                relation=rel['relation'],
                description=rel['description']
            )

        # Step 2: Detect communities if graph has grown
        omni_rag_pipeline.knowledge_graph.detect_communities()

        # Step 3: Generate summaries for new or updated communities
        await omni_rag_pipeline.knowledge_graph.generate_community_summaries()

        # Step 4: Persist changes
        omni_rag_pipeline.knowledge_graph.save()
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
        user_docs_meta = [
            m for m in vector_store.metadata
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
        for comm_id, summary in omni_rag_pipeline.knowledge_graph.community_summaries.items():
            # Handle both string and int keys for communities
            lookup_id = int(comm_id) if comm_id.isdigit() else comm_id
            nodes = omni_rag_pipeline.knowledge_graph.communities.get(str(comm_id),
                    omni_rag_pipeline.knowledge_graph.communities.get(lookup_id, []))

            # Check if any node in community belongs to user
            is_user_community = False
            for node in nodes:
                entity = omni_rag_pipeline.knowledge_graph.entities.get(node)
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
        omni_rag_pipeline.knowledge_graph.detect_communities()
        await omni_rag_pipeline.knowledge_graph.generate_community_summaries()
        omni_rag_pipeline.knowledge_graph.save()
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
        "user_id": current_user.id,
        "role": "user",
        "content": request.query,
        "image_urls": request.image_urls,
        "image_ids": request.image_ids,
        "timestamp": datetime.now()
    }
    if mongodb.db is not None:
        await mongodb.db.chat_messages.insert_one(user_msg_data)

    # 3. Build optimized context using Hierarchical Memory
    from app.services.chat.context import build_context
    history, _, context_meta = await build_context(
        session_id=session_id,
        user_id=str(current_user.id),
        query=request.query
    )

    async def event_generator():
        full_response = ""
        final_metadata = {}
        final_metadata.update(context_meta) # Start with memory metadata

        try:
            # Yield session ID and memory status for frontend
            yield f"data: {json.dumps({'type': 'metadata', 'session_id': session_id, **context_meta})}\n\n"

            async for event in omni_rag_pipeline.stream_query(
                query=request.query,
                user_id=str(current_user.id),
                session_id=session_id,
                history=history,
                strategy=request.strategy,
                image_urls=request.image_urls,
                image_ids=request.image_ids,
                db=db,
                memory_summary=context_meta.get("memory_summary")
            ):
                if event['type'] == 'content':
                    full_response += event['content']
                elif event['type'] == 'metadata':
                    final_metadata.update(event)
                yield f"data: {json.dumps(event)}\n\n"

            # Save assistant message after stream ends
            # Flatten metadata for schema consistency with ChatMessage schema
            assistant_msg_data = {
                "session_id": session_id,
                "user_id": current_user.id,
                "role": "assistant",
                "content": full_response,
                "timestamp": datetime.now(),
                "retrieved_docs": final_metadata.get('retrieved_docs', []),
                **final_metadata
            }
            if mongodb.db is not None:
                res = await mongodb.db.chat_messages.insert_one(assistant_msg_data)
                msg_id = str(res.inserted_id)
            else:
                msg_id = str(uuid.uuid4())

            # Update session
            generated_title = None
            if session.title in ["New Conversation", "New Chat"] or session.title.endswith("..."):
                try:
                    generated_title = await ai_router.generate_title(request.query)
                    session.title = generated_title
                except:
                    session.title = request.query[:50]
                    generated_title = session.title
            session.updated_at = datetime.now()
            db.commit()

            yield f"data: {json.dumps({'type': 'done', 'message_id': msg_id, 'title': generated_title})}\n\n"

        except Exception as e:
            logger.error(f"Error in Omni-RAG streaming: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
