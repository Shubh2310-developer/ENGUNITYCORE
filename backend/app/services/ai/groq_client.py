"""
Groq API Client for Engunity AI Chat Feature

This module provides an async client for interacting with Groq's LLM API.
It's designed to be used by the AI router for high-performance chat completions.

Author: Engunity AI Team
Date: 2026-01-10
"""

import os
from groq import AsyncGroq
from typing import List, Dict, Optional
from app.core.config import settings


class GroqClient:
    """
    Async client for Groq API using LLaMA 3.3 70B model.
    
    Features:
    - Async/await support for FastAPI integration
    - Automatic system prompt injection
    - Configurable temperature and max tokens
    - Error handling and retries
    
    Usage:
        client = GroqClient()
        response = await client.get_completion([
            {"role": "user", "content": "Hello!"}
        ])
    """
    
    def __init__(
        self,
        model: str = "llama-3.3-70b-versatile",
        max_tokens: int = 2048,
        temperature: float = 0.7
    ):
        """
        Initialize Groq client.

        Args:
            model: Groq model identifier
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0.0-2.0)
        """
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.clients = []
        self.current_client_index = 0

        # Load API keys from config
        api_keys = []
        if settings.GROQ_API_KEYS:
            api_keys = [k.strip() for k in settings.GROQ_API_KEYS.split(",") if k.strip()]
        elif settings.GROQ_API_KEY:
            api_keys = [settings.GROQ_API_KEY]

        if not api_keys:
            print("WARNING: No GROQ_API_KEY found. AI features will be disabled.")
        else:
            for key in api_keys:
                self.clients.append(AsyncGroq(api_key=key))
            print(f"INFO: GroqClient initialized with {len(self.clients)} API keys for rotation.")

        # System prompt for Engunity AI
        self.system_prompt = (
            "You are Engunity AI, an expert assistant specializing in:\n"
            "- Programming & Software Development\n"
            "- Engineering & System Design\n"
            "- Technical Problem Solving\n"
            "- Code Review & Best Practices\n"
            "- Algorithm Design & Optimization\n\n"
            "Provide clear, accurate, and well-structured responses. "
            "Use markdown formatting for code blocks and lists. "
            "Explain complex concepts with examples when appropriate."
        )

    def _get_next_client(self) -> AsyncGroq:
        """
        Round-robin selection of the next available Groq client.
        """
        if not self.clients:
            raise Exception("Groq AI is disabled: No API keys available.")

        client = self.clients[self.current_client_index]
        self.current_client_index = (self.current_client_index + 1) % len(self.clients)
        return client

    async def get_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None
    ) -> str:
        """
        Get chat completion from Groq API with key rotation.
        """
        if not self.clients:
            raise Exception("Groq AI is disabled: No API keys available.")

        # Try multiple clients in case of rate limits
        attempts = 0
        max_attempts = len(self.clients)
        last_error = None

        while attempts < max_attempts:
            client = self._get_next_client()
            try:
                # Inject system prompt if not present
                if not any(msg.get("role") == "system" for msg in messages):
                    messages_with_system = [
                        {"role": "system", "content": self.system_prompt},
                        *messages
                    ]
                else:
                    messages_with_system = messages

                # Use provided overrides or defaults
                temp = temperature if temperature is not None else self.temperature
                max_tok = max_tokens if max_tokens is not None else self.max_tokens
                target_model = model if model is not None else self.model

                # Call Groq API
                response = await client.chat.completions.create(
                    model=target_model,
                    messages=messages_with_system,
                    max_tokens=max_tok,
                    temperature=temp,
                    stream=False
                )

                # Extract and return content
                content = response.choices[0].message.content

                if not content:
                    raise Exception("Groq API returned empty response")

                return content

            except Exception as e:
                last_error = str(e)
                # If it's a rate limit or quota error, try next key
                if any(x in last_error.lower() for x in ["rate_limit", "quota", "429"]):
                    print(f"WARNING: Key {attempts} rate limited, rotating to next key...")
                    attempts += 1
                    continue
                else:
                    # For other errors, re-raise immediately
                    raise Exception(f"Groq API error: {last_error}")

        raise Exception(f"All {len(self.clients)} Groq API keys failed. Last error: {last_error}")

    async def get_streaming_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ):
        """
        Get streaming chat completion from Groq API with key rotation.
        Note: Rotation for streaming is handled at the start of the stream.
        """
        if not self.clients:
            raise Exception("Groq AI is disabled: No API keys available.")

        # For streaming, we pick a client and stick with it for that request
        client = self._get_next_client()

        try:
            # Inject system prompt
            if not any(msg.get("role") == "system" for msg in messages):
                messages_with_system = [
                    {"role": "system", "content": self.system_prompt},
                    *messages
                ]
            else:
                messages_with_system = messages

            temp = temperature if temperature is not None else self.temperature
            max_tok = max_tokens if max_tokens is not None else self.max_tokens

            # Stream response
            stream = await client.chat.completions.create(
                model=self.model,
                messages=messages_with_system,
                max_tokens=max_tok,
                temperature=temp,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            # Handle rate limit at start of stream
            if any(x in str(e).lower() for x in ["rate_limit", "quota", "429"]):
                 raise Exception(f"Groq streaming rate limit: {str(e)}. Try again to rotate keys.")
            raise Exception(f"Groq streaming error: {str(e)}")


# Singleton instance
groq_client = GroqClient()


# Alternative models available in Groq
GROQ_MODELS = {
    "llama-3.3-70b-versatile": {
        "name": "LLaMA 3.3 70B",
        "speed": "fast",
        "context": "8K tokens",
        "best_for": "General chat, coding, reasoning"
    },
    "llama-3.1-8b-instant": {
        "name": "LLaMA 3.1 8B",
        "speed": "very fast",
        "context": "8K tokens",
        "best_for": "Quick responses, simple queries"
    },
    "mixtral-8x7b-32768": {
        "name": "Mixtral 8x7B",
        "speed": "fast",
        "context": "32K tokens",
        "best_for": "Long context, document analysis"
    },
    "gemma2-9b-it": {
        "name": "Gemma 2 9B",
        "speed": "fast",
        "context": "8K tokens",
        "best_for": "Instruction following, coding"
    }
}
