import json
import redis.asyncio as redis
from typing import Optional, Any
from app.core.config import settings

class CacheService:
    def __init__(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_available = True
        except Exception as e:
            print(f"WARNING: Redis not available for caching at {settings.REDIS_URL}: {e}")
            self.redis = None
            self.redis_available = False

    async def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        if not self.redis_available or not self.redis:
            return None
        try:
            value = await self.redis.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        """Set cached value with expiration"""
        if not self.redis_available or not self.redis:
            return
        try:
            await self.redis.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            print(f"Cache set error: {e}")

    async def delete(self, key: str):
        """Delete cached value"""
        if not self.redis_available or not self.redis:
            return
        try:
            await self.redis.delete(key)
        except Exception as e:
            print(f"Cache delete error: {e}")

cache_service = CacheService()
