from typing import Any, List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import Document as DocumentSchema

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/", response_model=List[DocumentSchema])
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve documents for the current user.
    """
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return documents

@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
) -> Any:
    """
    Upload a document and store its metadata.
    """
    # Create a unique filename to avoid collisions
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_id}{extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # Get file size
    file_size = os.path.getsize(file_path)

    # Store in database
    db_obj = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        size=file_size
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return db_obj
