from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from ultralytics import YOLO
import numpy as np
from typing import Dict, List, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class MultiModalVisionProcessor:
    """
    Complete multi-modal vision processing (ChatGPT/Gemini level)
    
    Components:
    1. CLIP - Semantic image understanding
    2. PaddleOCR - Text extraction with layout
    3. YOLO - Object detection
    4. Gemini - High-level VLM reasoning (existing)
    """
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Initializing multi-modal vision on {self.device}")
        
        # 1. CLIP for semantic embeddings
        self.clip_model = CLIPModel.from_pretrained(
            "openai/clip-vit-large-patch14"
        ).to(self.device)
        self.clip_processor = CLIPProcessor.from_pretrained(
            "openai/clip-vit-large-patch14"
        )
        
        # 2. PaddleOCR for text extraction
        try:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                use_gpu=(self.device == "cuda"),
                show_log=False
            )
        except ImportError:
            logger.warning("PaddleOCR not available. OCR features disabled.")
            self.ocr = None
        
        # 3. YOLO for object detection (keep existing)
        try:
            self.yolo = YOLO('yolov8n.pt')  # Using nano model for speed
        except Exception as e:
            logger.warning(f"YOLO initialization failed: {e}")
            self.yolo = None
        
        # 4. Gemini client (existing, for VLM reasoning)
        try:
            from app.services.ai.gemini_client import gemini_client
            self.vlm = gemini_client
        except ImportError:
            logger.warning("Gemini client not available")
            self.vlm = None
        
        logger.info("✅ Vision models loaded")
    
    async def process_image(
        self, 
        image_path: str, 
        query: Optional[str] = None
    ) -> Dict:
        """
        Complete multi-modal processing pipeline
        
        Returns structured data combining all modalities:
        - CLIP embeddings for image search
        - OCR text with layout information
        - Detected objects with bounding boxes
        - High-level semantic description
        - Spatial layout for grounding queries
        """
        image = Image.open(image_path).convert("RGB")
        
        # Process all modalities in parallel for speed
        results = await asyncio.gather(
            self._get_clip_embedding(image),
            self._extract_ocr_with_layout(image),
            self._detect_objects(image),
            self._get_vlm_description(image_path, query)
        )
        
        clip_embedding, ocr_data, objects, vlm_description = results
        
        # Fuse all modalities into structured output
        return {
            # For vector search
            'image_embedding': clip_embedding,
            
            # Text content from image
            'ocr_text': self._format_ocr_text(ocr_data),
            'ocr_structured': ocr_data,
            
            # Objects detected
            'objects': objects,
            'object_summary': self._summarize_objects(objects),
            
            # High-level understanding
            'description': vlm_description,
            
            # Combined searchable text
            'searchable_text': self._create_searchable_text(
                ocr_data, objects, vlm_description
            ),
            
            # Spatial layout for grounding
            'spatial_layout': self._analyze_layout(
                ocr_data, objects, image.size
            )
        }
    
    async def _get_clip_embedding(self, image: Image.Image) -> np.ndarray:
        """Get semantic image embedding using CLIP"""
        inputs = self.clip_processor(
            images=image, 
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            image_features = self.clip_model.get_image_features(**inputs)
            # Normalize for cosine similarity
            image_features = image_features / image_features.norm(
                dim=-1, keepdim=True
            )
        
        return image_features.cpu().numpy()[0]
    
    async def _extract_ocr_with_layout(
        self, 
        image: Image.Image
    ) -> List[Dict]:
        """
        Extract text with precise layout information
        Enables spatial queries like "what's in the top-right?"
        """
        if not self.ocr:
            return []
            
        result = self.ocr.ocr(np.array(image), cls=True)
        
        if not result or not result[0]:
            return []
        
        structured_text = []
        image_width, image_height = image.size
        
        for line in result[0]:
            bbox, (text, confidence) = line
            
            # Convert bbox to usable format
            x_coords = [point[0] for point in bbox]
            y_coords = [point[1] for point in bbox]
            
            x_min, x_max = min(x_coords), max(x_coords)
            y_min, y_max = min(y_coords), max(y_coords)
            
            # Classify position
            position = self._classify_position(
                x_min, y_min, x_max, y_max,
                image_width, image_height
            )
            
            structured_text.append({
                'text': text,
                'confidence': float(confidence),
                'bbox': {
                    'x_min': x_min,
                    'y_min': y_min,
                    'x_max': x_max,
                    'y_max': y_max
                },
                'position': position,
                'size': self._classify_text_size(
                    y_max - y_min, image_height
                )
            })
        
        # Sort by reading order (top to bottom, left to right)
        structured_text.sort(
            key=lambda x: (x['bbox']['y_min'], x['bbox']['x_min'])
        )
        
        return structured_text
    
    def _classify_position(
        self, 
        x_min, y_min, x_max, y_max, 
        img_w, img_h
    ) -> str:
        """Classify text position: 'top-left', 'center', etc."""
        center_x = (x_min + x_max) / 2
        center_y = (y_min + y_max) / 2
        
        # Divide image into 3x3 grid
        col = (
            "left" if center_x < img_w/3 
            else "center" if center_x < 2*img_w/3 
            else "right"
        )
        row = (
            "top" if center_y < img_h/3 
            else "middle" if center_y < 2*img_h/3 
            else "bottom"
        )
        
        if row == "middle" and col == "center":
            return "center"
        return f"{row}-{col}"
    
    def _classify_text_size(self, height, img_height) -> str:
        """Classify text as heading, normal, or small"""
        ratio = height / img_height
        if ratio > 0.05:
            return "heading"
        elif ratio > 0.02:
            return "normal"
        else:
            return "small"
    
    async def _detect_objects(self, image: Image.Image) -> List[Dict]:
        """
        Detect objects and their locations
        Enables queries like "show me the person in the image"
        """
        if not self.yolo:
            return []
            
        results = self.yolo(image, verbose=False)
        
        objects = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                objects.append({
                    'class': r.names[int(box.cls[0])],
                    'confidence': float(box.conf[0]),
                    'bbox': {
                        'x_min': x1,
                        'y_min': y1,
                        'x_max': x2,
                        'y_max': y2
                    },
                    'center': {
                        'x': (x1 + x2) / 2,
                        'y': (y1 + y2) / 2
                    }
                })
        
        # Sort by confidence
        objects.sort(key=lambda x: x['confidence'], reverse=True)
        
        return objects
    
    async def _get_vlm_description(
        self, 
        image_path: str, 
        query: Optional[str]
    ) -> str:
        """Use existing Gemini VLM for high-level understanding"""
        if not self.vlm:
            return "VLM description not available"
            
        try:
            # Get Gemini description
            prompt = query or "Describe this image in detail, including any text, objects, and their spatial relationships."
            description = await self.vlm.analyze_image(image_path, prompt)
            return description
        except Exception as e:
            logger.error(f"VLM description failed: {e}")
            return "Description unavailable"
    
    def _format_ocr_text(self, ocr_data: List[Dict]) -> str:
        """Convert OCR data to readable text"""
        return " ".join([item['text'] for item in ocr_data])
    
    def _summarize_objects(self, objects: List[Dict]) -> str:
        """Create natural language summary of objects"""
        if not objects:
            return "No objects detected"
        
        # Count objects by class
        counts = {}
        for obj in objects:
            cls = obj['class']
            counts[cls] = counts.get(cls, 0) + 1
        
        # Create summary
        parts = [
            f"{count} {cls}{'s' if count > 1 else ''}" 
            for cls, count in counts.items()
        ]
        
        return "Contains: " + ", ".join(parts)
    
    def _create_searchable_text(
        self, 
        ocr_data: List[Dict], 
        objects: List[Dict], 
        description: str
    ) -> str:
        """
        Combine all text sources for embedding
        This is what gets embedded and searched
        """
        parts = []
        
        # Add description (most important)
        parts.append(f"Image Description: {description}")
        
        # Add object information
        if objects:
            object_text = self._summarize_objects(objects)
            parts.append(object_text)
        
        # Add OCR text
        if ocr_data:
            ocr_text = self._format_ocr_text(ocr_data)
            parts.append(f"Text in image: {ocr_text}")
        
        return "\n".join(parts)
    
    def _analyze_layout(
        self, 
        ocr_data: List[Dict], 
        objects: List[Dict], 
        image_size: tuple
    ) -> Dict:
        """
        Analyze spatial layout for grounding queries
        Example: "What's in the top-right corner?"
        """
        width, height = image_size
        
        layout = {
            'top-left': {'text': [], 'objects': []},
            'top-center': {'text': [], 'objects': []},
            'top-right': {'text': [], 'objects': []},
            'middle-left': {'text': [], 'objects': []},
            'center': {'text': [], 'objects': []},
            'middle-right': {'text': [], 'objects': []},
            'bottom-left': {'text': [], 'objects': []},
            'bottom-center': {'text': [], 'objects': []},
            'bottom-right': {'text': [], 'objects': []},
        }
        
        # Place OCR text in regions
        for item in ocr_data:
            layout[item['position']]['text'].append(item['text'])
        
        # Place objects in regions
        for obj in objects:
            center_x, center_y = obj['center']['x'], obj['center']['y']
            position = self._classify_position(
                center_x, center_y, center_x, center_y, width, height
            )
            layout[position]['objects'].append(obj['class'])
        
        return layout
    
    async def answer_spatial_query(
        self, 
        query: str, 
        image_path: str
    ) -> str:
        """
        Answer queries about specific image regions
        Example: "What's in the top-right of the image?"
        """
        result = await self.process_image(image_path)
        layout = result['spatial_layout']
        
        # Parse spatial query
        region_map = {
            'top-left': 'top-left',
            'top left': 'top-left',
            'top-right': 'top-right',
            'top right': 'top-right',
            'top-center': 'top-center',
            'top center': 'top-center',
            'bottom-left': 'bottom-left',
            'bottom left': 'bottom-left',
            'bottom-right': 'bottom-right',
            'bottom right': 'bottom-right',
            'center': 'center',
            'middle': 'center'
        }
        
        for key, region in region_map.items():
            if key in query.lower():
                region_data = layout[region]
                answer = f"In the {region} region:\n"
                
                if region_data['text']:
                    answer += f"Text: {', '.join(region_data['text'])}\n"
                
                if region_data['objects']:
                    answer += f"Objects: {', '.join(set(region_data['objects']))}"
                
                return answer if region_data['text'] or region_data['objects'] else f"Nothing detected in the {region} region"
        
        # If no spatial query, return general description
        return result['description']


# Create singleton instance
vision_processor = None

def get_vision_processor():
    """Lazy initialization of vision processor"""
    global vision_processor
    if vision_processor is None:
        vision_processor = MultiModalVisionProcessor()
    return vision_processor


# Backward compatibility
class ImageProcessorService:
    """Alias for backward compatibility"""
    def __init__(self):
        self.processor = get_vision_processor()
    
    async def process_image(self, image_path: str, query: str = None):
        return await self.processor.process_image(image_path, query)
