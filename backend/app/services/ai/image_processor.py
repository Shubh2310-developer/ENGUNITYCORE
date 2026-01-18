import io
import uuid
import magic
import base64
import asyncio
from datetime import datetime
from PIL import Image
from fastapi import UploadFile
from app.services.storage.supabase import storage_service
from app.services.ai.vector_store import vector_store
from app.core.config import settings
from typing import List, Dict, Any, Optional
from ultralytics import YOLO
import numpy as np

class ImageProcessorService:
    """
    Handles image transformations, optimizations, and metadata extraction
    """

    SUPPORTED_FORMATS = {
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
        'image/webp': 'WEBP',
        'image/gif': 'GIF'
    }

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit for now

    THUMBNAIL_SIZES = {
        'small': (150, 150),
        'medium': (300, 300),
        'large': (600, 600),
    }

    def __init__(self):
        # Initialize YOLOv8 for object detection (SOTA FREE)
        try:
            self.yolo = YOLO('yolov8n.pt') # Use nano for speed and low VRAM
        except Exception as e:
            print(f"Failed to load YOLO model: {e}")
            self.yolo = None

    async def validate_and_upload(
        self,
        file: UploadFile,
        user_id: str,
        bucket: str = "images"
    ) -> Dict[str, Any]:
        """
        Stage 1: Fast Synchronous Validation and Initial Upload
        """
        content = await file.read()
        file_size = len(content)

        if file_size > self.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds limit of {self.MAX_FILE_SIZE // (1024*1024)}MB")

        # Validate MIME type using magic bytes
        mime_type = magic.from_buffer(content, mime=True)
        if mime_type not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported image format: {mime_type}")

        # Open image to get dimensions and verify
        try:
            img = Image.open(io.BytesIO(content))

            # Privacy: Strip EXIF data
            data = list(img.getdata())
            img_clean = Image.new(img.mode, img.size)
            img_clean.putdata(data)

            if mime_type in ['image/jpeg', 'image/png']:
                buffer = io.BytesIO()
                img_clean.save(buffer, format=self.SUPPORTED_FORMATS[mime_type])
                content = buffer.getvalue()
                img = img_clean

            width, height = img.size
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")

        image_id = str(uuid.uuid4())
        file_ext = mime_type.split('/')[-1]
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")

        base_path = f"users/{user_id}/images/chat/{year}/{month}"
        storage_path = f"{base_path}/original/{image_id}.{file_ext}"

        # Upload original
        await storage_service.upload_file(
            bucket=bucket,
            path=storage_path,
            file_content=content,
            content_type=mime_type
        )

        public_url = await storage_service.get_file_url(bucket, storage_path)

        return {
            "id": image_id,
            "filename": file.filename,
            "mime_type": mime_type,
            "width": width,
            "height": height,
            "file_size": file_size,
            "storage_path": storage_path,
            "public_url": public_url,
            "base_path": base_path,
            "file_content": content # Keep for background processing
        }

    async def process_background_tasks(
        self,
        image_id: str,
        user_id: str,
        base_path: str,
        file_content: bytes,
        filename: str,
        mime_type: str,
        db_session_factory, # Factory to get fresh DB session in background
        bucket: str = "images"
    ):
        """
        Stage 2: Heavy Asynchronous Processing (Thumbnails, AI, Indexing)
        """
        from app.models.image import Image as ImageModel, ImageVariant
        from app.services.ai.gemini_client import gemini_client
        from app.services.ai.ocr_client import ocr_client

        db = db_session_factory()
        try:
            img = Image.open(io.BytesIO(file_content))

            # 1. Generate and save thumbnails
            for size_name, size in self.THUMBNAIL_SIZES.items():
                try:
                    thumb_content = self._generate_thumbnail(img, size, "WEBP")
                    thumb_path = f"{base_path}/thumbnails/{size_name}/{image_id}.webp"

                    await storage_service.upload_file(
                        bucket=bucket,
                        path=thumb_path,
                        file_content=thumb_content,
                        content_type="image/webp"
                    )

                    # Create variant record
                    variant = ImageVariant(
                        image_id=image_id,
                        variant_type=f"thumbnail_{size_name}",
                        storage_path=thumb_path,
                        file_size=len(thumb_content),
                        width=size[0],
                        height=size[1],
                        format="WEBP"
                    )
                    db.add(variant)
                except Exception as e:
                    print(f"Failed to process {size_name} thumbnail for {image_id}: {e}")

            # 2. AI Scene Description (Gemini)
            scene_description = None
            try:
                base64_image = base64.b64encode(file_content).decode('utf-8')
                scene_description = await gemini_client.describe_image(base64_image)
            except Exception as e:
                print(f"Gemini Analysis failed for {image_id}: {e}")

            # 3. Object Detection (YOLOv8)
            detected_objects = []
            if self.yolo:
                try:
                    results = self.yolo(img, verbose=False)
                    for r in results:
                        for box in r.boxes:
                            cls = r.names[int(box.cls[0])]
                            conf = float(box.conf[0])
                            bbox = box.xyxy[0].tolist()
                            detected_objects.append({
                                "label": cls,
                                "confidence": conf,
                                "bbox": bbox
                            })
                except Exception as e:
                    print(f"Object detection failed: {e}")

            # 4. OCR Extraction
            detected_text = None
            try:
                detected_text = ocr_client.extract_text(file_content)
            except Exception as e:
                print(f"OCR Extraction failed for {image_id}: {e}")

            # 5. Spatial Grounding / Layout Analysis
            layout_summary = self._generate_layout_summary(detected_objects, img.size)

            # 6. Update Main Image Record
            image_record = db.query(ImageModel).filter(ImageModel.id == image_id).first()
            if image_record:
                image_record.scene_description = scene_description
                image_record.detected_text = detected_text
                # Enhancing tags with detected objects
                obj_tags = list(set([obj["label"] for obj in detected_objects if obj["confidence"] > 0.4]))
                image_record.tags = list(set((image_record.tags or []) + obj_tags))
                image_record.processing_status = "completed"
                # Store objects and layout in metadata if possible or just use in description
                db.add(image_record)

            # 7. Semantic Indexing (Enhanced with Objects and Layout)
            try:
                obj_str = ", ".join([f"{obj['label']} ({int(obj['confidence']*100)}%)" for obj in detected_objects[:10]])
                indexing_text = f"Image description: {scene_description or ''}\n"
                if obj_str:
                    indexing_text += f"Detected objects: {obj_str}\n"
                if layout_summary:
                    indexing_text += f"Spatial Layout: {layout_summary}\n"
                if detected_text:
                    indexing_text += f"Extracted text: {detected_text}"

                if indexing_text.strip():
                    public_url = await storage_service.get_file_url(bucket, image_record.storage_path)
                    vector_store.add_texts(
                        texts=[indexing_text],
                        metadatas=[{
                            "type": "image",
                            "image_id": image_id,
                            "user_id": str(user_id),
                            "filename": filename,
                            "public_url": public_url,
                            "text": indexing_text
                        }]
                    )
            except Exception as e:
                print(f"Indexing failed for {image_id}: {e}")

            db.commit()
            print(f"✅ Background processing completed for image {image_id}")

        except Exception as e:
            print(f"❌ Critical error in background processing for {image_id}: {e}")
            db.rollback()
            # Update status to failed
            image_record = db.query(ImageModel).filter(ImageModel.id == image_id).first()
            if image_record:
                image_record.processing_status = "failed"
                image_record.processing_error = str(e)
                db.add(image_record)
                db.commit()
        finally:
            db.close()

    def _generate_layout_summary(self, objects: List[Dict], img_size: tuple) -> str:
        if not objects:
            return ""

        width, height = img_size
        regions = {
            "top": [], "bottom": [], "left": [], "right": [], "center": []
        }

        for obj in objects:
            if obj["confidence"] < 0.4: continue
            x1, y1, x2, y2 = obj["bbox"]
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2

            label = obj["label"]
            if cy < height / 3: regions["top"].append(label)
            elif cy > 2 * height / 3: regions["bottom"].append(label)

            if cx < width / 3: regions["left"].append(label)
            elif cx > 2 * width / 3: regions["right"].append(label)

            if width/3 < cx < 2*width/3 and height/3 < cy < 2*height/3:
                regions["center"].append(label)

        summary = []
        for reg, labels in regions.items():
            if labels:
                summary.append(f"In the {reg}: {', '.join(list(set(labels)))}")

        return ". ".join(summary)

    def _generate_thumbnail(self, img: Image.Image, size: tuple, format_name: str) -> bytes:
        """
        Generate a thumbnail for the image
        """
        thumb = img.copy()
        thumb.thumbnail(size)
        img_byte_arr = io.BytesIO()
        thumb.save(img_byte_arr, format=format_name)
        return img_byte_arr.getvalue()

    async def get_visual_context(
        self,
        image_urls: Optional[List[str]] = None,
        image_ids: Optional[List[str]] = None,
        db = None
    ) -> str:
        """
        Fetch or generate visual descriptions for a set of images.
        Prioritizes existing descriptions and metadata in the DB.
        """
        visual_blocks = []
        urls_to_process = []

        # 1. Check database for existing descriptions if IDs provided
        if image_ids and db:
            from app.models.image import Image as ImageModel
            for img_id in image_ids:
                try:
                    db_image = db.query(ImageModel).filter(ImageModel.id == img_id).first()
                    if db_image:
                        tags_str = f" [Tags: {', '.join(db_image.tags)}]" if db_image.tags else ""
                        safety_str = " (NSFW Flag)" if (hasattr(db_image, 'nsfw_score') and db_image.nsfw_score and db_image.nsfw_score > 0.8) else ""

                        content = []
                        if db_image.scene_description:
                            content.append(f"Description: {db_image.scene_description}")
                        if db_image.detected_text:
                            content.append(f"Extracted Text: {db_image.detected_text}")

                        visual_blocks.append(f"Image ({db_image.filename}){tags_str}{safety_str}: {' | '.join(content)}")
                    else:
                        # Refresh signed URL to ensure Gemini can access it if needed
                        # Note: storage_service might need refresh for non-db images too
                        pass
                except Exception as e:
                    print(f"Error fetching image {img_id} from DB for context: {e}")

        # 2. Add raw URLs provided in the request
        if image_urls:
            urls_to_process.extend(image_urls)

        # 3. Generate descriptions for missing ones
        if urls_to_process:
            from app.services.ai.gemini_client import gemini_client
            # Deduplicate URLs
            unique_urls = list(set(urls_to_process))

            # Serialize requests to avoid 429 Too Many Requests
            for url in unique_urls:
                try:
                    desc = await gemini_client.describe_image(url)
                    if desc:
                        visual_blocks.append(f"Image {len(visual_blocks) + 1}: {desc}")
                except Exception as e:
                    print(f"Error generating description for {url}: {e}")

        if not visual_blocks:
            return ""

        return "\n\n".join([f"[Visual Context {i+1}]: {block}" for i, block in enumerate(visual_blocks)])

image_processor = ImageProcessorService()
