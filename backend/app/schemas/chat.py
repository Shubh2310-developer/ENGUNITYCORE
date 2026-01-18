from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.image import ImageResponse

class ChatMessageBase(BaseModel):
    role: str
    content: str
    image_urls: Optional[List[str]] = []
    image_ids: Optional[List[str]] = []
    images: Optional[List[ImageResponse]] = []

class ChatMessageCreate(ChatMessageBase):
    role: Optional[str] = "user"
    session_id: Optional[str] = None

class ChatMessage(ChatMessageBase):
    id: str
    timestamp: datetime
    status: Optional[str] = "done"  # sending, streaming, done, error
    retrieved_docs: Optional[List[str]] = []
    complexity: Optional[str] = None
    strategy: Optional[str] = None
    used_web_search: Optional[bool] = False
    hyde_doc: Optional[str] = None
    confidence: Optional[float] = None
    critique: Optional[str] = None
    multi_queries: Optional[List[str]] = []
    memory_active: Optional[bool] = False
    memory_summary: Optional[str] = None

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
