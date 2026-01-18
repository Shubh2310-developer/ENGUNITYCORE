import base64
import httpx
import certifi
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings
from loguru import logger

class GeminiClient:
    """
    Client for Gemini 2.0 Flash API to handle visual perception.
    Used as the first stage in the multimodal pipeline.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = "gemini-flash-latest"
        # Use v1beta for Gemini models to ensure multimodal support and latest features
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    async def describe_image(self, image_source: str) -> Optional[str]:
        """
        Describe the image using Gemini 2.0 Flash.
        image_source can be a base64 string or a URL.
        Strictly follows the 'perception-only' rule.
        Includes exponential backoff for 429 errors.
        Returns None if analysis fails.
        """
        if not self.api_key:
            logger.error("Gemini API key not found")
            return None

        image_data = ""
        mime_type = "image/jpeg"

        if image_source.startswith("http"):
            # Fetch image from URL
            try:
                async with httpx.AsyncClient(verify=certifi.where()) as client:
                    response = await client.get(image_source)
                    response.raise_for_status()
                    image_bytes = response.content
                    image_data = base64.b64encode(image_bytes).decode("utf-8")
                    mime_type = response.headers.get("content-type", "image/jpeg")
            except Exception as e:
                logger.error(f"Error fetching image from URL: {e}")
                return None
        else:
            if "," in image_source:
                image_data = image_source.split(",")[1]
            else:
                image_data = image_source

        # Enhanced perception prompt for better RAG context
        prompt = (
            "Analyze this image in detail for a RAG (Retrieval-Augmented Generation) system. "
            "1. Describe the main subject, setting, and composition. "
            "2. Extract ALL visible text verbatim, preserving line breaks if possible. "
            "3. Identify any charts, diagrams, or technical elements and describe their content. "
            "4. Mention colors, textures, and specific objects if relevant. "
            "Do not interpret, infer, or provide subjective opinions. Do not answer questions. "
            "Be objective and thorough."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": image_data
                            }
                        }
                    ]
                }
            ]
        }

        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(verify=certifi.where(), timeout=60.0) as client:
                    response = await client.post(self.url, json=payload)

                    if response.status_code == 429:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Gemini API rate limited (429). Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue

                    response.raise_for_status()
                    data = response.json()

                    if "candidates" in data and data["candidates"]:
                        content = data["candidates"][0].get("content", {})
                        parts = content.get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()

                    logger.warning(f"Gemini API returned unexpected structure: {data}")
                    return None

            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Error calling Gemini API after {max_retries} attempts: {e}")
                    return None

                delay = base_delay * (2 ** attempt)
                logger.warning(f"Gemini API error: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)

        return None

    async def get_completion(self, messages: List[Dict[str, Any]]) -> str:
        """
        Wrapper to match the interface expected by AIRouter.
        Extracts images from messages and gets descriptions.
        """
        descriptions = []

        # AIRouter sends perception_prompt with images in content list
        for msg in messages:
            if isinstance(msg.get("content"), list):
                for item in msg["content"]:
                    if item.get("type") == "image_url":
                        img_url = item["image_url"]["url"]
                        desc = await self.describe_image(img_url)
                        if desc:
                            descriptions.append(desc)

        return "\n\n".join(descriptions) if descriptions else "No images to describe."

# Singleton instance
gemini_client = GeminiClient()
