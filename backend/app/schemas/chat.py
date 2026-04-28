from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.image import ImageResponse


class TurboQuantMetadata(BaseModel):
    requested: bool
    applied: bool
    provider: Optional[str] = None
    variant: Optional[str] = None
    bit_width: Optional[int] = None
    compression_ratio: Optional[float] = None
    estimated_memory_saved_mb: Optional[float] = None
    quality_score: Optional[float] = None
    first_token_overhead_ms: Optional[float] = None
    fallback_reason: Optional[str] = None

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
    turbo_quant: Optional[TurboQuantMetadata] = None

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
