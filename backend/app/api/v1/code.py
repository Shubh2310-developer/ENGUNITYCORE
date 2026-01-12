from typing import Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
import os
import uuid
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.code import CodeProject
from app.schemas.code import CodeProject as CodeProjectSchema, CodeProjectCreate, CodeProjectUpdate
from app.services.storage.supabase import storage_service
from app.services.ai.vector_store import vector_store
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[CodeProjectSchema])
def get_code_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve code projects for the current user.
    """
    projects = db.query(CodeProject).filter(CodeProject.user_id == current_user.id).all()
    return projects

@router.post("/", response_model=CodeProjectSchema)
async def create_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_in: CodeProjectCreate,
) -> Any:
    """
    Create a new code project.
    """
    db_obj = CodeProject(
        **project_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/{project_id}/upload", response_model=CodeProjectSchema)
async def upload_project_files(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file: UploadFile = File(...),
) -> Any:
    """
    Upload project files (e.g., zip, source files) to Supabase Storage.
    Also indexes file content in FAISS for code search/RAG.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")

    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_id}{extension}"

    # Read file content
    content = await file.read()

    # 1. Upload to Supabase Storage
    try:
        storage_path = f"{current_user.id}/projects/{project_id}/{safe_filename}"
        await storage_service.upload_file(
            bucket="code",
            path=storage_path,
            file_content=content,
            content_type=file.content_type
        )
        project.storage_path = storage_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud storage error: {str(e)}")

    # 2. Index in FAISS for RAG
    try:
        # For simplicity, we assume text extraction or use a library for source code
        text_content = content.decode('utf-8', errors='ignore')
        if len(text_content.strip()) > 0:
            vector_store.add_texts(
                texts=[text_content],
                metadatas=[{
                    "project_id": project_id,
                    "user_id": current_user.id,
                    "filename": file.filename,
                    "type": "code_source"
                }]
            )
    except Exception as e:
        print(f"FAISS indexing error: {e}")

    db.add(project)
    db.commit()
    db.refresh(project)

    return project

@router.get("/{project_id}", response_model=CodeProjectSchema)
def get_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
) -> Any:
    """
    Get a specific code project by ID.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    return project

@router.patch("/{project_id}", response_model=CodeProjectSchema)
def update_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    project_in: CodeProjectUpdate,
) -> Any:
    """
    Update code project metadata.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", response_model=CodeProjectSchema)
async def delete_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
) -> Any:
    """
    Delete a code project from Postgres and Supabase Storage.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")

    # Delete from Supabase Storage (would need to list and delete all files in project folder)
    if project.storage_path:
        try:
            await storage_service.delete_file("code", project.storage_path)
        except Exception:
            pass

    db.delete(project)
    db.commit()
    return project
