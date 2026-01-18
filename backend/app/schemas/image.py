from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class ImageBase(BaseModel):
    filename: str
    mime_type: str
    width: int
    height: int
    file_size: int

class ImageCreate(ImageBase):
    pass

class ImageVariantResponse(BaseModel):
    variant_type: str
    public_url: str
    width: int
    height: int
    file_size: int
    format: str

    class Config:
        from_attributes = True

class ImageResponse(ImageBase):
    id: UUID | str
    public_url: str
    variants: List[ImageVariantResponse] = []
    scene_description: Optional[str] = None
    detected_text: Optional[str] = None
    tags: List[str] = []
    description: Optional[str] = None
    nsfw_score: float = 0.0
    processing_status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BatchImageAction(BaseModel):
    action: str # 'delete', 'tag'
    image_ids: List[str]
    tags: Optional[List[str]] = None
