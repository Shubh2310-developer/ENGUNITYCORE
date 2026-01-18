import redis.asyncio as redis
import json
import hashlib
from typing import Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AICache:
    def __init__(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_available = True
        except Exception as e:
            logger.warning(f"Redis cache not available at {settings.REDIS_URL}: {e}")
            self.redis = None
            self.redis_available = False

    def _generate_key(self, prompt: Any) -> str:
        prompt_str = json.dumps(prompt, sort_keys=True)
        return f"ai_cache:{hashlib.md5(prompt_str.encode()).hexdigest()}"

    async def get(self, prompt: Any) -> Optional[str]:
        if not self.redis_available:
            return None
        try:
            key = self._generate_key(prompt)
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            self.redis_available = False
            return None

    async def set(self, prompt: Any, response: str, expire: int = 3600):
        if not self.redis_available:
            return
        try:
            key = self._generate_key(prompt)
            await self.redis.set(key, response, ex=expire)
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            self.redis_available = False

ai_cache = AICache()
