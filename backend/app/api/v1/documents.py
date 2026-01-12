from typing import Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
import os
import uuid
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentLink
from app.schemas.document import Document as DocumentSchema, DocumentCreate, DocumentUpdate, ThinkingTrace as ThinkingTraceSchema, ThinkingTraceCreate, DocumentLink as DocumentLinkSchema, DocumentLinkCreate
from app.services.storage.supabase import storage_service
from app.services.ai.vector_store import vector_store
from app.services.ai.document_processor import document_processor
from app.core.mongodb import mongodb
from datetime import datetime

router = APIRouter()

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

@router.post("/", response_model=DocumentSchema)
def create_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_in: DocumentCreate,
) -> Any:
    """
    Create a new document.
    """
    db_obj = Document(
        **document_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{document_id}/links", response_model=List[DocumentLinkSchema])
def get_document_links(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
) -> Any:
    """
    Get all links for a specific document.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    links = db.query(DocumentLink).filter(DocumentLink.document_id == document_id).all()
    return links

@router.post("/{document_id}/links", response_model=DocumentLinkSchema)
def create_document_link(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
    link_in: DocumentLinkCreate,
) -> Any:
    """
    Create a new link for a document.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db_obj = DocumentLink(
        **link_in.model_dump()
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/links/{link_id}", response_model=DocumentLinkSchema)
def delete_document_link(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    link_id: str,
) -> Any:
    """
    Delete a document link.
    """
    link = db.query(DocumentLink).join(Document).filter(
        DocumentLink.id == link_id,
        Document.user_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()
    return link

@router.get("/{document_id}", response_model=DocumentSchema)
def get_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
) -> Any:
    """
    Get a specific document by ID.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.patch("/{document_id}", response_model=DocumentSchema)
def update_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
    document_in: DocumentUpdate,
) -> Any:
    """
    Update a document.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = document_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)

    db.add(document)
    db.commit()
    db.refresh(document)
    return document

@router.delete("/{document_id}", response_model=DocumentSchema)
async def delete_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
) -> Any:
    """
    Delete a document from Postgres and Supabase Storage.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from Supabase Storage
    if document.file_path:
        try:
            await storage_service.delete_file("documents", document.file_path)
        except Exception:
            pass

    # Delete from FAISS vector store
    try:
        vector_store.delete_document(document_id)
    except Exception as e:
        print(f"FAISS deletion error: {e}")

    db.delete(document)
    db.commit()
    return document

@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    type: str = Form("note"),
    session_id: Optional[str] = Form(None),
) -> Any:
    """
    Upload a document to Supabase Storage and store its metadata in Postgres.
    Also indexes the document in FAISS for RAG.
    If session_id is provided, links the document to that chat session.
    """
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_id}{extension}"

    # Read file content
    content = await file.read()

    # 1. Upload to Supabase Storage
    try:
        await storage_service.upload_file(
            bucket="documents",
            path=f"{current_user.id}/{safe_filename}",
            file_content=content,
            content_type=file.content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud storage error: {str(e)}")

    # 2. Index in FAISS for RAG
    try:
        await document_processor.process_and_index(
            file_content=content,
            file_type=file.content_type or extension,
            metadata={
                "document_id": file_id,
                "user_id": current_user.id,
                "title": title or file.filename,
                "filename": file.filename,
                "session_id": session_id # Tag chunks with session_id if available
            }
        )
    except Exception as e:
        print(f"FAISS indexing error: {e}")

    # 3. Store in Postgres metadata
    db_obj = Document(
        id=file_id,
        user_id=current_user.id,
        title=title or file.filename,
        type=type,
        status="draft",
        filename=file.filename,
        file_path=f"{current_user.id}/{safe_filename}",
        file_type=file.content_type,
        size=len(content)
    )
    db.add(db_obj)

    # 4. Create link to chat session if provided
    if session_id:
        link = DocumentLink(
            document_id=file_id,
            target_type="chat",
            target_id=session_id,
            title=f"Chat upload: {file.filename}"
        )
        db.add(link)

    db.commit()
    db.refresh(db_obj)

    return db_obj

@router.get("/{document_id}/trace", response_model=List[ThinkingTraceSchema])
async def get_document_trace(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
) -> Any:
    """
    Get the thinking trace for a specific document from MongoDB.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if mongodb.db is not None:
        traces_cursor = mongodb.db.thinking_traces.find({"document_id": document_id}).sort("created_at", -1)
        traces = await traces_cursor.to_list(length=100)
        return traces

    return []

@router.post("/{document_id}/trace", response_model=ThinkingTraceSchema)
async def create_trace_entry(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    document_id: str,
    trace_in: ThinkingTraceCreate,
) -> Any:
    """
    Create a new thinking trace entry for a document in MongoDB.
    """
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    trace_data = {
        "id": str(uuid.uuid4()),
        "document_id": document_id,
        "user_id": current_user.id,
        "event_type": trace_in.event_type,
        "event": trace_in.event,
        "details": trace_in.details,
        "created_at": datetime.now()
    }

    if mongodb.db is not None:
        await mongodb.db.thinking_traces.insert_one(trace_data)

    return trace_data
