from typing import List, Dict, Any, Optional
from app.services.ai.groq_client import groq_client
from app.services.ai.cache import ai_cache
from app.services.ai.logger import ai_logger

class AIRouter:
    async def route_request(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        preference: str = "performance"
    ) -> str:
        # 1. Check Redis cache first
        cached_response = await ai_cache.get(messages)
        if cached_response:
            # Log cache hit to MongoDB
            if user_id:
                await ai_logger.log_event(
                    event_type="ai_cache_hit",
                    user_id=user_id,
                    session_id=session_id,
                    model="cache",
                    details={"messages": messages, "response": cached_response}
                )
            return cached_response

        # 2. Route to LLM (Groq for now)
        # Simple routing logic: Performance uses Groq (Llama3)
        response = await groq_client.get_completion(messages)

        # 3. Cache the response in Redis
        await ai_cache.set(messages, response)

        # 4. Log the AI interaction to MongoDB
        if user_id:
            await ai_logger.log_event(
                event_type="ai_completion",
                user_id=user_id,
                session_id=session_id,
                model="groq-llama3",
                details={"messages": messages, "response": response}
            )

        return response

    async def stream_request(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ):
        """
        Route request for streaming completion.
        Returns an async generator that yields content chunks.
        """
        full_content = ""

        async for chunk in groq_client.get_streaming_completion(messages):
            full_content += chunk
            yield chunk

        # Log completion after stream finishes
        if user_id:
            await ai_logger.log_event(
                event_type="ai_streaming_completion",
                user_id=user_id,
                session_id=session_id,
                model="groq-llama3",
                details={"messages": messages, "response": full_content}
            )

        # Optionally cache the full result
        await ai_cache.set(messages, full_content)

    async def generate_title(self, user_message: str) -> str:
        """
        Generate a concise 3-5 word title for a chat session based on the first message.
        """
        prompt = [
            {
                "role": "system",
                "content": "You are a helpful assistant that generates concise, 3-5 word titles for chat conversations. Return ONLY the title text, no quotes, no punctuation, and no extra words."
            },
            {
                "role": "user",
                "content": f"Summarize this request into a short title: {user_message}"
            }
        ]

        try:
            # Use the faster/smaller model for title generation
            title = await groq_client.get_completion(
                prompt,
                temperature=0.3,
                max_tokens=20,
                model="llama-3.1-8b-instant"
            )
            # Clean up the response just in case
            return title.strip().strip('"').strip("'").split('\n')[0][:50]
        except Exception as e:
            print(f"Error generating title: {e}")
            return user_message[:30] + "..."

ai_router = AIRouter()
