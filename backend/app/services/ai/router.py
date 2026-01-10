from typing import List, Dict, Any
from app.services.ai.groq_client import groq_client

class AIRouter:
    async def route_request(self, messages: List[Dict[str, str]], preference: str = "performance") -> str:
        # Simple routing logic: Performance uses Groq (Llama3), Quality might use something else
        # For now, everything routes to Groq
        return await groq_client.get_completion(messages)

ai_router = AIRouter()
