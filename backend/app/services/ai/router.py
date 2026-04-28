from typing import List, Dict, Any, Optional
from app.services.ai.groq_client import groq_client
from app.services.ai.ollama_client import ollama_client
from app.services.ai.cache import ai_cache
from app.services.ai.logger import ai_logger

class AIRouter:
    def get_provider_identity_for_strategy(self, strategy: Optional[str] = None) -> str:
        if getattr(groq_client, "clients", None):
            return "groq"
        return "ollama"

    async def route_request(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        preference: str = "performance",
        image_urls: Optional[List[str]] = None,
        image_ids: Optional[List[str]] = None,
        db = None
    ) -> str:
        # 0. Visual Perception
        visual_context = ""
        if image_urls or image_ids:
            from app.services.ai.image_processor import image_processor
            visual_context = await image_processor.get_visual_context(
                image_urls=image_urls,
                image_ids=image_ids,
                db=db
            )

        if visual_context:
            # Prepend visual context to the last user message
            if messages and messages[-1]["role"] == "user":
                messages[-1]["content"] = f"{visual_context}\n\nUser Question: {messages[-1]['content']}"

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

        # 2. Route to LLM (Groq with Ollama Fallback)
        try:
            # Primary: Groq (Llama3)
            response = await groq_client.get_completion(messages)
            model_used = "groq-llama3"
        except Exception as e:
            from loguru import logger
            logger.warning(f"Groq primary failed, falling back to local Ollama: {e}")
            # Fallback: Local Ollama
            try:
                response = await ollama_client.chat_completion(messages)
                model_used = "local-ollama-llama3.2"
            except Exception as ollama_err:
                logger.error(f"Both Groq and Ollama failed: {ollama_err}")
                raise

        # 3. Cache the response in Redis
        await ai_cache.set(messages, response)

        # 4. Log the AI interaction to MongoDB
        if user_id:
            await ai_logger.log_event(
                event_type="ai_completion",
                user_id=user_id,
                session_id=session_id,
                model=model_used,
                details={"messages": messages, "response": response}
            )

        return response

    async def stream_request(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        image_urls: Optional[List[str]] = None,
        image_ids: Optional[List[str]] = None,
        db = None
    ):
        """
        Route request for streaming completion.
        Returns an async generator that yields content chunks.
        """
        # 0. Visual Perception
        visual_context = ""
        if image_urls or image_ids:
            from app.services.ai.image_processor import image_processor
            yield "🔍 *Analyzing images...*\n\n"
            visual_context = await image_processor.get_visual_context(
                image_urls=image_urls,
                image_ids=image_ids,
                db=db
            )

        if visual_context:
            # Prepend visual context to the last user message
            if messages and messages[-1]["role"] == "user":
                messages[-1]["content"] = f"{visual_context}\n\nUser Question: {messages[-1]['content']}"

        full_content = ""
        model_used = "groq-llama3"

        try:
            async for chunk in groq_client.get_streaming_completion(messages):
                full_content += chunk
                yield chunk
        except Exception as e:
            from loguru import logger
            logger.warning(f"Groq streaming failed, falling back to local Ollama: {e}")
            model_used = "local-ollama-llama3.2"
            yield "⚠️ *Connection to Cloud AI lost. Switching to Local Engine...*\n\n"

            try:
                async for chunk in ollama_client.stream_chat(messages):
                    full_content += chunk
                    yield chunk
            except Exception as ollama_err:
                logger.error(f"Streaming fallback failed: {ollama_err}")
                yield "\n\n❌ *Error: Both Cloud and Local AI engines are unavailable.*"

        # Log completion after stream finishes
        if user_id:
            await ai_logger.log_event(
                event_type="ai_streaming_completion",
                user_id=user_id,
                session_id=session_id,
                model=model_used,
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
            # Try Groq first
            title = await groq_client.get_completion(
                prompt,
                temperature=0.3,
                max_tokens=20,
                model="llama-3.1-8b-instant"
            )
        except Exception:
            try:
                # Fallback to local Ollama
                title = await ollama_client.chat_completion(prompt)
            except Exception:
                return user_message[:30] + "..."

        # Clean up the response just in case
        return title.strip().strip('"').strip("'").split('\n')[0][:50]

ai_router = AIRouter()
