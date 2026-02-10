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

# ==================== CodeFile Schemas ====================

class CodeFileBase(BaseModel):
    path: str
    name: str
    type: str  # 'file' or 'folder'
    content: Optional[str] = None
    language: Optional[str] = None
    parentId: Optional[str] = None

class CodeFileCreate(CodeFileBase):
    pass

class CodeFileUpdate(BaseModel):
    path: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None
    parentId: Optional[str] = None

class CodeFile(CodeFileBase):
    id: str
    project_id: str

    model_config = ConfigDict(from_attributes=True)
