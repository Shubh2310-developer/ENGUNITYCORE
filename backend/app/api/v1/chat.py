from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.chat import ChatSession
from app.schemas.chat import ChatMessageCreate, ChatMessage, ChatSession as ChatSessionSchema, ChatSessionCreate
from app.services.ai.router import ai_router
from app.services.storage.supabase import storage_service
from datetime import datetime
import uuid
import json
import asyncio

router = APIRouter()

@router.get("/", response_model=List[ChatSessionSchema])
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve chat sessions for the current user.
    """
    sessions = db.query(ChatSession)\
        .filter(ChatSession.user_id == current_user.id)\
        .order_by(ChatSession.updated_at.desc())\
        .all()

    # Enrich with message count from MongoDB
    enriched_sessions = []
    for session in sessions:
        count = 0
        if mongodb.db is not None:
            count = await mongodb.db.chat_messages.count_documents({"session_id": session.id})

        enriched_sessions.append({
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "message_count": count
        })

    return enriched_sessions

@router.post("/sessions", response_model=ChatSessionSchema)
def create_chat_session(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    session_in: ChatSessionCreate,
) -> Any:
    """
    Create a new chat session.
    """
    session = ChatSession(
        user_id=current_user.id,
        title=session_in.title or "New Conversation"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/{session_id}", response_model=ChatSessionSchema)
async def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get a specific chat session with its messages from MongoDB.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch messages from MongoDB
    messages = []
    if mongodb.db is not None:
        cursor = mongodb.db.chat_messages.find({"session_id": session_id}).sort("timestamp", 1)
        async for msg in cursor:
            # Refresh signed URLs for images if they exist
            image_urls = msg.get("image_urls", [])
            images_data = []

            image_ids = msg.get("image_ids", [])
            if image_ids:
                from app.models.image import Image
                refreshed_urls = []
                for img_id in image_ids:
                    db_img = db.query(Image).filter(Image.id == img_id).first()
                    if db_img:
                        # Refresh signed URL for original
                        original_url = await storage_service.get_file_url("images", db_img.storage_path)
                        refreshed_urls.append(original_url)

                        # Prepare full image data with variants
                        variants_data = []
                        for variant in db_img.variants:
                            variant_url = await storage_service.get_file_url("images", variant.storage_path)
                            variants_data.append({
                                "variant_type": variant.variant_type,
                                "public_url": variant_url,
                                "width": variant.width,
                                "height": variant.height,
                                "file_size": variant.file_size,
                                "format": variant.format
                            })

                        images_data.append({
                            "id": str(db_img.id),
                            "filename": db_img.filename,
                            "mime_type": db_img.mime_type,
                            "width": db_img.width,
                            "height": db_img.height,
                            "file_size": db_img.file_size,
                            "public_url": original_url,
                            "variants": variants_data,
                            "scene_description": db_img.scene_description,
                            "detected_text": db_img.detected_text,
                            "processing_status": db_img.processing_status,
                            "created_at": db_img.created_at
                        })

                if refreshed_urls:
                    image_urls = refreshed_urls

            # Prepare for response schema
            msg_data = {
                "id": str(msg.get("_id") or msg.get("id")),
                "role": msg["role"],
                "content": msg["content"],
                "image_urls": image_urls,
                "images": images_data,
                "timestamp": msg.get("timestamp") or datetime.now(),
                "retrieved_docs": msg.get("retrieved_docs", []),
                # Load all enhanced metadata fields
                "complexity": msg.get("complexity"),
                "strategy": msg.get("strategy"),
                "used_web_search": msg.get("used_web_search", False),
                "hyde_doc": msg.get("hyde_doc"),
                "confidence": msg.get("confidence"),
                "critique": msg.get("critique"),
                "multi_queries": msg.get("multi_queries", []),
                "memory_active": msg.get("memory_active", False),
                "memory_summary": msg.get("memory_summary")
            }
            messages.append(msg_data)

    # Convert session to dict and add messages
    session_data = {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "message_count": len(messages),
        "messages": messages
    }
    return session_data

@router.delete("/{session_id}")
async def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a specific chat session and its messages.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Delete messages from MongoDB
    if mongodb.db is not None:
        await mongodb.db.chat_messages.delete_many({"session_id": session_id})

    # 2. Delete session from PostgreSQL
    db.delete(session)
    db.commit()

    return {"status": "success", "message": "Session deleted"}

@router.post("/", response_model=ChatMessage)
async def send_message(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    message_in: ChatMessageCreate,
) -> Any:
    """
    Process a new message and return the assistant's response.
    """
    # 1. Get or create session
    session_id = message_in.session_id
    if not session_id:
        session = ChatSession(user_id=current_user.id, title=message_in.content[:30] + "...")
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
        "content": message_in.content,
        "image_urls": message_in.image_urls,
        "image_ids": message_in.image_ids,
        "timestamp": datetime.now()
    }

    if mongodb.db is not None:
        await mongodb.db.chat_messages.insert_one(user_msg_data)

    # 3. Build context for AI
    context, retrieved_docs, context_meta = await build_context(
        session_id=session_id,
        user_id=current_user.id,
        query=message_in.content
    )

    # 4. Generate assistant response using AI Router (which uses Groq)
    try:
        assistant_reply = await ai_router.route_request(
            context,
            user_id=current_user.id,
            session_id=session_id,
            image_urls=message_in.image_urls,
            image_ids=message_in.image_ids,
            db=db
        )
    except Exception as e:
        assistant_reply = f"I apologize, but I encountered an error: {str(e)}"

    # 5. Save assistant message to MongoDB
    assistant_msg_data = {
        "session_id": session_id,
        "user_id": current_user.id,
        "role": "assistant",
        "content": assistant_reply,
        "timestamp": datetime.now(),
        "retrieved_docs": retrieved_docs,
        **context_meta # Persist hierarchical memory metadata
    }

    if mongodb.db is not None:
        result = await mongodb.db.chat_messages.insert_one(assistant_msg_data)
        assistant_msg_data["id"] = str(result.inserted_id)
    else:
        assistant_msg_data["id"] = str(uuid.uuid4())

    # 6. Update session timestamp and title if needed
    if session.title in ["New Conversation", "New Chat"] or session.title.endswith("..."):
        try:
            session.title = await ai_router.generate_title(message_in.content)
        except Exception:
            session.title = message_in.content[:50]

    session.updated_at = datetime.now()
    db.commit()

    return assistant_msg_data


@router.post("/stream")
async def stream_message(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    message_in: ChatMessageCreate,
) -> Any:
    """
    Process a new message and stream the assistant's response via SSE.
    """
    # 1. Get or create session
    session_id = message_in.session_id
    if not session_id:
        session = ChatSession(user_id=current_user.id, title=message_in.content[:30] + "...")
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
        "content": message_in.content,
        "image_urls": message_in.image_urls,
        "image_ids": message_in.image_ids,
        "timestamp": datetime.now(),
        "status": "done"
    }

    if mongodb.db is not None:
        await mongodb.db.chat_messages.insert_one(user_msg_data)

    # 3. Build context for AI
    context, retrieved_docs, context_meta = await build_context(
        session_id=session_id,
        user_id=current_user.id,
        query=message_in.content
    )

    # 4. Define the streaming generator
    async def event_generator():
        full_content = ""
        try:
            # Yield initial metadata including retrieved docs and memory status
            yield f"data: {json.dumps({'type': 'metadata', 'session_id': session_id, 'retrieved_docs': retrieved_docs, **context_meta})}\n\n"

            async for chunk in ai_router.stream_request(
                context,
                user_id=current_user.id,
                session_id=session_id,
                image_urls=message_in.image_urls,
                image_ids=message_in.image_ids,
                db=db
            ):
                full_content += chunk
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"

            # 5. Save assistant message to MongoDB after stream finishes
            assistant_msg_data = {
                "session_id": session_id,
                "user_id": current_user.id,
                "role": "assistant",
                "content": full_content,
                "timestamp": datetime.now(),
                "status": "done",
                "retrieved_docs": retrieved_docs,
                **context_meta # Persist hierarchical memory metadata
            }

            if mongodb.db is not None:
                result = await mongodb.db.chat_messages.insert_one(assistant_msg_data)
                msg_id = str(result.inserted_id)
            else:
                msg_id = str(uuid.uuid4())

            # 6. Update session metadata in background or at the end
            # We do it here as we are in an async function
            generated_title = None
            if session.title in ["New Conversation", "New Chat"] or session.title.endswith("..."):
                try:
                    generated_title = await ai_router.generate_title(message_in.content)
                    session.title = generated_title
                except Exception:
                    session.title = message_in.content[:50]
                    generated_title = session.title

            session.updated_at = datetime.now()
            db.commit()

            # Yield final message info
            yield f"data: {json.dumps({'type': 'done', 'message_id': msg_id, 'title': generated_title})}\n\n"

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
