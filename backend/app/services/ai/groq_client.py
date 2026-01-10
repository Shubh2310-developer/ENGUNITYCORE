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
        
        Raises:
            ValueError: If GROQ_API_KEY is not set
        """
        if not settings.GROQ_API_KEY:
            raise ValueError(
                "GROQ_API_KEY not found in environment variables. "
                "Please set it in your .env file. "
                "Get your key from https://console.groq.com"
            )
        
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        
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

    async def get_completion(
        self, 
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Get chat completion from Groq API.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
                     Example: [{"role": "user", "content": "Explain async/await"}]
            temperature: Override default temperature (optional)
            max_tokens: Override default max_tokens (optional)
        
        Returns:
            Generated text response from the model
        
        Raises:
            Exception: If API call fails with descriptive error message
        
        Example:
            >>> messages = [
            ...     {"role": "user", "content": "What is FastAPI?"}
            ... ]
            >>> response = await groq_client.get_completion(messages)
            >>> print(response)
        """
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
            
            # Call Groq API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages_with_system,
                max_tokens=max_tok,
                temperature=temp,
                stream=False  # Can be changed to True for streaming
            )
            
            # Extract and return content
            content = response.choices[0].message.content
            
            if not content:
                raise Exception("Groq API returned empty response")
            
            return content
            
        except Exception as e:
            # Enhanced error handling
            error_msg = f"Groq API error: {str(e)}"
            
            # Add helpful context
            if "api_key" in str(e).lower():
                error_msg += " - Please check your GROQ_API_KEY in .env file"
            elif "rate_limit" in str(e).lower():
                error_msg += " - Rate limit exceeded. Please wait and try again"
            elif "quota" in str(e).lower():
                error_msg += " - API quota exceeded. Check your Groq account"
            
            raise Exception(error_msg)

    async def get_streaming_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ):
        """
        Get streaming chat completion from Groq API.
        
        This method returns an async generator that yields response chunks
        as they're generated by the model.
        
        Args:
            messages: Conversation history
            temperature: Sampling temperature (optional)
            max_tokens: Maximum tokens (optional)
        
        Yields:
            str: Response chunks as they arrive
        
        Example:
            >>> async for chunk in groq_client.get_streaming_completion(messages):
            ...     print(chunk, end="", flush=True)
        """
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
            stream = await self.client.chat.completions.create(
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
