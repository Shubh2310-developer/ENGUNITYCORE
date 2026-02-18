import httpx
import json
from typing import AsyncGenerator, Optional, List, Dict, Any
from loguru import logger

class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=300.0)

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3.2",
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> str:
        """Standard blocking chat completion"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature
                    }
                }
            )
            response.raise_for_status()
            return response.json()["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama completion error: {e}")
            raise

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3.2",
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion"""
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature
                    }
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if "message" in data:
                        yield data["message"]["content"]
                    if data.get("done"):
                        break
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            raise

ollama_client = OllamaClient()
