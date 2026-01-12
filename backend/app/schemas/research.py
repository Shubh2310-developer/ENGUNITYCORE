from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ResearchPaperBase(BaseModel):
    title: str
    authors: Optional[str] = None
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal: Optional[str] = None
    doi: Optional[str] = None

class ResearchPaperCreate(ResearchPaperBase):
    pass

class ResearchPaperUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal: Optional[str] = None
    doi: Optional[str] = None

class ResearchPaper(ResearchPaperBase):
    id: str
    user_id: int
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
