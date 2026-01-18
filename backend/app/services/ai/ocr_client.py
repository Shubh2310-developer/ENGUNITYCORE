import easyocr
import numpy as np
from PIL import Image
import io
import base64
import torch
import gc
import os
import certifi
from typing import List, Optional
from app.services.ai.logger import ai_logger

class OCRClient:
    """
    Dedicated OCR client using EasyOCR.
    Optimized for extracting text (especially code) from images.
    Uses GPU if available.
    """

    def __init__(self, languages: List[str] = ["en"]):
        self.languages = languages
        self.reader = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Ensure SSL certificates are found for model downloads
        os.environ['SSL_CERT_FILE'] = certifi.where()

    def _load_reader(self):
        if self.reader is not None:
            return

        print(f"Loading EasyOCR reader on {self.device}...")
        # gpu=True will use CUDA if available
        self.reader = easyocr.Reader(self.languages, gpu=(self.device == "cuda"))
        print("EasyOCR reader loaded successfully.")

    def extract_text(self, image_data: str) -> str:
        """
        Extracts text from a base64 encoded image or image bytes.
        """
        self._load_reader()

        try:
            # Decode base64 if necessary
            if isinstance(image_data, str):
                if "," in image_data:
                    image_data = image_data.split(",")[1]
                img_bytes = base64.b64decode(image_data)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            else:
                img = Image.open(io.BytesIO(image_data)).convert("RGB")

            # Convert PIL Image to numpy array for EasyOCR
            img_np = np.array(img)

            # Perform OCR
            results = self.reader.readtext(img_np, detail=0)

            # Clear CUDA cache if using GPU
            if self.device == "cuda":
                torch.cuda.empty_cache()
                gc.collect()

            return "\n".join(results)

        except Exception as e:
            print(f"OCR Error: {e}")
            return ""

# Singleton instance
ocr_client = OCRClient()
