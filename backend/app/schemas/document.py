from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentBase(BaseModel):
    filename: str
    file_type: Optional[str] = None
    size: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
