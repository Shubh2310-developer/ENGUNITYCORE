from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class GitHubRepositoryBase(BaseModel):
    name: str
    owner: str
    description: Optional[str] = None
    language: Optional[str] = None
    lang_color: Optional[str] = None
    stars: int = 0
    forks: int = 0
    visibility: str = "Public"
    last_updated: Optional[str] = None
    quality_score: Optional[str] = None
    repository_url: Optional[str] = None

class GitHubRepositoryCreate(GitHubRepositoryBase):
    pass

class GitHubRepositoryUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    lang_color: Optional[str] = None
    stars: Optional[int] = None
    forks: Optional[int] = None
    visibility: Optional[str] = None
    last_updated: Optional[str] = None
    quality_score: Optional[str] = None
    repository_url: Optional[str] = None

class GitHubRepository(GitHubRepositoryBase):
    id: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
