"""
Query Result Caching Decorator
Caches expensive database query results in Redis
"""
from functools import wraps
import hashlib
import json
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings
from loguru import logger

_redis_client: Optional[aioredis.Redis] = None

async def get_redis():
    """Get or create Redis client"""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("✅ Query cache Redis client initialized")
        except Exception as e:
            logger.warning(f"⚠️  Query cache Redis unavailable: {e}")
            _redis_client = None
    return _redis_client

def cache_query(ttl: int = 300, key_prefix: str = "query"):
    """
    Decorator to cache database query results in Redis
    
    Args:
        ttl: Time to live in seconds (default 5 minutes)
        key_prefix: Prefix for cache key (default "query")
    
    Usage:
        @cache_query(ttl=600)
        async def get_user_decisions(user_id: str):
            # Your query here
            pass
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            arg_str = str(args) + str(sorted(kwargs.items()))
            arg_hash = hashlib.md5(arg_str.encode()).hexdigest()
            cache_key = f"{key_prefix}:{func.__name__}:{arg_hash}"
            
            # Try to get from cache
            try:
                redis = await get_redis()
                if redis:
                    cached = await redis.get(cache_key)
                    if cached:
                        logger.debug(f"Query cache HIT: {func.__name__}")
                        return json.loads(cached)
            except Exception as e:
                logger.debug(f"Cache read error: {e}")
            
            # Execute the actual query
            logger.debug(f"Query cache MISS: {func.__name__}")
            result = await func(*args, **kwargs)
            
            # Cache the result
            try:
                redis = await get_redis()
                if redis and result is not None:
                    # Convert result to JSON (handle datetime, etc.)
                    await redis.setex(
                        cache_key,
                        ttl,
                        json.dumps(result, default=str)
                    )
                    logger.debug(f"Query result cached: {func.__name__} (TTL: {ttl}s)")
            except Exception as e:
                logger.debug(f"Cache write error: {e}")
            
            return result
        return wrapper
    return decorator

async def invalidate_cache_pattern(pattern: str):
    """
    Invalidate all cache keys matching a pattern
    
    Args:
        pattern: Redis key pattern (e.g., "query:get_user_*")
    
    Usage:
        await invalidate_cache_pattern("query:get_user_decisions:*")
    """
    try:
        redis = await get_redis()
        if redis:
            keys = []
            async for key in redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await redis.delete(*keys)
                logger.info(f"Invalidated {len(keys)} cache keys matching: {pattern}")
    except Exception as e:
        logger.warning(f"Cache invalidation error: {e}")
