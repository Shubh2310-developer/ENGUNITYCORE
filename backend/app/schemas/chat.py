from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    role: Optional[str] = "user"
    session_id: Optional[str] = None

class ChatMessage(ChatMessageBase):
    id: str
    timestamp: datetime
    status: Optional[str] = "done"  # sending, streaming, done, error
    retrieved_docs: Optional[List[str]] = []

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: Optional[str] = None

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSession(ChatSessionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    messages: List[ChatMessage] = []

    class Config:
        from_attributes = True
