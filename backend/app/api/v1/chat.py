from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage as ChatMessageModel
from app.schemas.chat import ChatMessageCreate, ChatMessage, ChatSession as ChatSessionSchema, ChatSessionCreate
from app.services.ai.router import ai_router
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/", response_model=List[ChatSessionSchema])
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve chat sessions for the current user.
    """
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    return sessions

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
def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get a specific chat session with its messages.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

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

    # 2. Store user message
    user_msg = ChatMessageModel(
        session_id=session_id,
        role="user",
        content=message_in.content
    )
    db.add(user_msg)
    db.commit() # Commit user message first

    # 3. Fetch session history for context
    history = db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id
    ).order_by(ChatMessageModel.timestamp.asc()).all()

    # Format messages for AI router
    ai_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
    ]

    # 4. Generate assistant response using AI Router
    try:
        assistant_content = await ai_router.route_request(ai_messages)
    except Exception as e:
        print(f"AI Router error: {e}")
        assistant_content = "I apologize, but I encountered an error while processing your request. My neural link is experiencing interference."

    assistant_msg = ChatMessageModel(
        session_id=session_id,
        role="assistant",
        content=assistant_content
    )
    db.add(assistant_msg)

    # Update session title if it was default
    if session.title == "New Conversation" or session.title.endswith("..."):
        session.title = message_in.content[:50]

    # Update session timestamp
    session.updated_at = datetime.now()

    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
