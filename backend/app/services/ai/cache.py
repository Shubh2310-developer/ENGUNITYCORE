import redis.asyncio as redis
import json
import hashlib
from typing import Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AICache:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    def _generate_key(self, prompt: Any) -> str:
        prompt_str = json.dumps(prompt, sort_keys=True)
        return f"ai_cache:{hashlib.md5(prompt_str.encode()).hexdigest()}"

    async def get(self, prompt: Any) -> Optional[str]:
        try:
            key = self._generate_key(prompt)
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    async def set(self, prompt: Any, response: str, expire: int = 3600):
        try:
            key = self._generate_key(prompt)
            await self.redis.set(key, response, ex=expire)
        except Exception as e:
            logger.error(f"Redis set error: {e}")

ai_cache = AICache()
