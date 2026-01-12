from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    title: str
    type: str = "note"
    status: str = "draft"
    content: Optional[str] = None
    filename: Optional[str] = None
    file_type: Optional[str] = None
    size: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    content: Optional[str] = None

class Document(DocumentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    links: List['DocumentLink'] = []

    class Config:
        from_attributes = True

class ThinkingTraceBase(BaseModel):
    event_type: str
    event: str
    details: Optional[str] = None

class ThinkingTraceCreate(ThinkingTraceBase):
    document_id: str

class ThinkingTrace(ThinkingTraceBase):
    id: str
    document_id: str
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentLinkBase(BaseModel):
    target_type: str
    target_id: str
    title: Optional[str] = None
    context: Optional[str] = None

class DocumentLinkCreate(DocumentLinkBase):
    document_id: str

class DocumentLink(DocumentLinkBase):
    id: str
    document_id: str
    created_at: datetime

    class Config:
        from_attributes = True
