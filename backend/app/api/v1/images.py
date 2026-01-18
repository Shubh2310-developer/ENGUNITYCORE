from typing import Any, List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db, SessionLocal
from app.models.user import User
from app.models.image import Image
from app.schemas.image import ImageResponse, BatchImageAction
from app.services.ai.image_processor import image_processor
from app.services.storage.supabase import storage_service
from datetime import datetime

router = APIRouter()

@router.post("/batch")
async def batch_image_operation(
    request: BatchImageAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Perform batch operations on images (delete, tag).
    """
    images = db.query(Image).filter(
        Image.id.in_(request.image_ids),
        Image.user_id == current_user.id
    ).all()

    if not images:
        raise HTTPException(status_code=404, detail="No images found")

    if request.action == "delete":
        deleted_count = 0
        for image in images:
            try:
                # Delete original from Supabase
                await storage_service.delete_file("images", image.storage_path)
                # Delete variants
                for variant in image.variants:
                    await storage_service.delete_file("images", variant.storage_path)
                db.delete(image)
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting image {image.id}: {e}")
        db.commit()
        return {"status": "success", "message": f"Deleted {deleted_count} images"}

    elif request.action == "tag":
        if not request.tags:
            raise HTTPException(status_code=400, detail="Tags are required for tag action")

        for image in images:
            # Union of existing tags and new tags
            current_tags = set(image.tags or [])
            new_tags = set(request.tags)
            image.tags = list(current_tags.union(new_tags))
            db.add(image)
        db.commit()
        return {"status": "success", "message": f"Added tags to {len(images)} images"}

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action: {request.action}")

@router.get("/", response_model=List[ImageResponse])
async def list_images(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve images for the current user.
    """
    images = db.query(Image).filter(Image.user_id == current_user.id)\
        .order_by(Image.created_at.desc())\
        .offset(skip).limit(limit).all()

    # Generate fresh signed URLs for each image and its variants
    for img in images:
        img.public_url = await storage_service.get_file_url("images", img.storage_path)

        # Variants are refreshed in the response via relationship
        for variant in img.variants:
            variant.public_url = await storage_service.get_file_url("images", variant.storage_path)

    return images

@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get image details and fresh signed URLs.
    """
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == current_user.id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Refresh signed URL for original
    image.public_url = await storage_service.get_file_url("images", image.storage_path)

    # Refresh signed URLs for all variants
    for variant in image.variants:
        variant.public_url = await storage_service.get_file_url("images", variant.storage_path)

    return image

@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete an image and its variants from storage and database.
    """
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == current_user.id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        # Delete original from Supabase
        await storage_service.delete_file("images", image.storage_path)

        # Delete all variants from Supabase
        for variant in image.variants:
            try:
                await storage_service.delete_file("images", variant.storage_path)
            except:
                pass

        # Delete from DB (cascade handles variants)
        db.delete(image)
        db.commit()

        return {"status": "success", "message": "Image and variants deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@router.get("/search", response_model=List[ImageResponse])
async def search_images(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
) -> Any:
    """
    Search for images using natural language (semantic search).
    """
    from app.services.ai.vector_store import vector_store

    # 1. Search in vector store for image types
    results = vector_store.search(
        query=query,
        user_id=str(current_user.id),
        doc_type="image",
        k=limit
    )

    image_ids = [res["metadata"]["image_id"] for res in results if "image_id" in res["metadata"]]

    if not image_ids:
        return []

    # 2. Fetch full records from PostgreSQL
    images = db.query(Image).filter(Image.id.in_(image_ids)).all()

    # Sort them by the order returned by vector store (relevance)
    id_to_img = {str(img.id): img for img in images}
    sorted_images = []
    for img_id in image_ids:
        if img_id in id_to_img:
            img = id_to_img[img_id]
            # Refresh signed URLs
            img.public_url = await storage_service.get_file_url("images", img.storage_path)
            for variant in img.variants:
                variant.public_url = await storage_service.get_file_url("images", variant.storage_path)
            sorted_images.append(img)

    return sorted_images

@router.options("/upload")
async def upload_image_options():
    """Handle CORS preflight requests for image upload"""
    return {"status": "ok"}

@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks
) -> Any:
    """
    Tiered Image Upload:
    1. Synchronous: Validation, EXIF stripping, Original storage, DB entry (pending)
    2. Asynchronous: Thumbnails, Gemini AI analysis, OCR, Semantic Indexing
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Stage 1: Immediate Processing
        result = await image_processor.validate_and_upload(
            file=file,
            user_id=str(current_user.id)
        )

        # Save initial record to database
        db_image = Image(
            id=result["id"],
            user_id=current_user.id,
            filename=result["filename"],
            original_filename=file.filename,
            file_size=result["file_size"],
            mime_type=result["mime_type"],
            width=result["width"],
            height=result["height"],
            storage_path=result["storage_path"],
            public_url=result["public_url"],
            context="chat",
            processing_status="processing",
            created_at=datetime.utcnow()
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)

        # Stage 2: Background Heavy Processing
        background_tasks.add_task(
            image_processor.process_background_tasks,
            image_id=result["id"],
            user_id=str(current_user.id),
            base_path=result["base_path"],
            file_content=result["file_content"],
            filename=result["filename"],
            mime_type=result["mime_type"],
            db_session_factory=SessionLocal
        )

        return db_image
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
