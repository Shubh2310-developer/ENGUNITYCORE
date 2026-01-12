from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class CodeProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    repository_url: Optional[str] = None

class CodeProjectCreate(CodeProjectBase):
    pass

class CodeProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    repository_url: Optional[str] = None

class CodeProject(CodeProjectBase):
    id: str
    user_id: int
    storage_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
