from typing import Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
import os
import uuid
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.research import ResearchPaper
from app.schemas.research import ResearchPaper as ResearchPaperSchema, ResearchPaperCreate, ResearchPaperUpdate
from app.services.storage.supabase import storage_service
from app.services.ai.vector_store import vector_store
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[ResearchPaperSchema])
def get_research_papers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve research papers for the current user.
    """
    papers = db.query(ResearchPaper).filter(ResearchPaper.user_id == current_user.id).all()
    return papers

@router.post("/upload", response_model=ResearchPaperSchema)
async def upload_research_paper(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    authors: Optional[str] = Form(None),
    abstract: Optional[str] = Form(None),
    journal: Optional[str] = Form(None),
    doi: Optional[str] = Form(None),
) -> Any:
    """
    Upload a research paper to Supabase Storage and store its metadata in Postgres.
    Also indexes the paper content in FAISS for RAG.
    """
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_id}{extension}"

    # Read file content
    content = await file.read()

    # 1. Upload to Supabase Storage
    try:
        await storage_service.upload_file(
            bucket="research",
            path=f"{current_user.id}/{safe_filename}",
            file_content=content,
            content_type=file.content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud storage error: {str(e)}")

    # 2. Index in FAISS for RAG
    try:
        # For simplicity, we assume text extraction or use a library
        # Here we just try to decode if it's text-based
        text_content = content.decode('utf-8', errors='ignore')
        if len(text_content.strip()) > 0:
            vector_store.add_texts(
                texts=[text_content],
                metadatas=[{
                    "paper_id": file_id,
                    "user_id": current_user.id,
                    "title": title or file.filename,
                    "type": "research_paper"
                }]
            )
    except Exception as e:
        print(f"FAISS indexing error: {e}")

    # 3. Store in Postgres metadata
    db_obj = ResearchPaper(
        id=file_id,
        user_id=current_user.id,
        title=title or file.filename,
        authors=authors,
        abstract=abstract,
        journal=journal,
        doi=doi,
        file_path=f"{current_user.id}/{safe_filename}",
        file_type=file.content_type
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return db_obj

@router.get("/{paper_id}", response_model=ResearchPaperSchema)
def get_research_paper(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    paper_id: str,
) -> Any:
    """
    Get a specific research paper by ID.
    """
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id, ResearchPaper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Research paper not found")
    return paper

@router.patch("/{paper_id}", response_model=ResearchPaperSchema)
def update_research_paper(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    paper_id: str,
    paper_in: ResearchPaperUpdate,
) -> Any:
    """
    Update research paper metadata.
    """
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id, ResearchPaper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Research paper not found")

    update_data = paper_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paper, field, value)

    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper

@router.delete("/{paper_id}", response_model=ResearchPaperSchema)
async def delete_research_paper(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    paper_id: str,
) -> Any:
    """
    Delete a research paper from Postgres and Supabase Storage.
    """
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id, ResearchPaper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Research paper not found")

    # Delete from Supabase Storage
    if paper.file_path:
        try:
            await storage_service.delete_file("research", paper.file_path)
        except Exception:
            pass

    db.delete(paper)
    db.commit()
    return paper
