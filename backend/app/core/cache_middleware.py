"""
Response Caching Middleware for FastAPI
Caches GET requests using Redis with configurable TTL
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from fastapi import Request
import hashlib
import json
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings
from loguru import logger

class ResponseCacheMiddleware(BaseHTTPMiddleware):
    """
    Middleware to cache GET responses in Redis.
    Improves performance for repeated identical requests.
    """
    
    def __init__(self, app, redis_url: str = None, ttl: int = 300):
        super().__init__(app)
        self.redis_url = redis_url or settings.REDIS_URL
        self.ttl = ttl  # Cache TTL in seconds (default 5 minutes)
        self.redis_client: Optional[aioredis.Redis] = None
        self._cache_enabled = True
        
        # Paths to exclude from caching
        self.exclude_patterns = [
            "/socket.io",
            "/auth/",
            "/docs",
            "/openapi.json",
            "/health",
        ]
    
    async def setup_redis(self):
        """Initialize Redis connection lazily"""
        if self.redis_client is None:
            try:
                self.redis_client = await aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                await self.redis_client.ping()
                logger.info("✅ Response cache middleware connected to Redis")
            except Exception as e:
                logger.warning(f"⚠️  Redis cache unavailable: {e}. Caching disabled.")
                self._cache_enabled = False
                self.redis_client = None
    
    def should_cache(self, request: Request) -> bool:
        """Check if request should be cached"""
        # Only cache GET requests
        if request.method != "GET":
            return False
        
        # Skip excluded paths
        path = str(request.url.path)
        for pattern in self.exclude_patterns:
            if pattern in path:
                return False
        
        return True
    
    def generate_cache_key(self, request: Request) -> str:
        """Generate unique cache key from request"""
        # Include method, path, and query params
        key_data = f"{request.method}:{request.url.path}:{request.url.query}"
        
        # Include user info if authenticated
        auth_header = request.headers.get("authorization", "")
        if auth_header:
            # Hash the auth token to avoid storing sensitive data
            auth_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
            key_data = f"{key_data}:user:{auth_hash}"
        
        # Create cache key
        cache_key = f"response_cache:{hashlib.md5(key_data.encode()).hexdigest()}"
        return cache_key
    
    async def dispatch(self, request: Request, call_next):
        """Handle request with caching"""
        # Setup Redis on first request
        if self.redis_client is None and self._cache_enabled:
            await self.setup_redis()
        
        # Skip caching if disabled or not cacheable
        if not self._cache_enabled or not self.should_cache(request):
            return await call_next(request)
        
        # Generate cache key
        cache_key = self.generate_cache_key(request)
        
        # Try to get from cache
        try:
            cached_response = await self.redis_client.get(cache_key)
            if cached_response:
                # Parse cached response
                cached_data = json.loads(cached_response)
                logger.debug(f"Cache HIT: {request.url.path}")
                
                # Return cached response with cache header
                return Response(
                    content=cached_data["body"],
                    status_code=cached_data["status_code"],
                    headers={
                        **cached_data["headers"],
                        "X-Cache": "HIT",
                        "X-Cache-Key": cache_key[-16:]  # Last 16 chars for debugging
                    },
                    media_type=cached_data.get("media_type")
                )
        except Exception as e:
            logger.debug(f"Cache read error: {e}")
        
        # Process request
        response = await call_next(request)
        
        # Cache successful responses
        if response.status_code == 200:
            try:
                # Read response body
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                # Try to decode body - handle both text and binary content
                try:
                    body_str = body.decode("utf-8")
                except UnicodeDecodeError:
                    # If body is binary (gzipped, images, etc.), encode as base64
                    import base64
                    body_str = base64.b64encode(body).decode("utf-8")
                    logger.debug(f"Encoded binary response as base64 for caching")
                
                # Prepare cache data
                cache_data = {
                    "body": body_str,
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "media_type": response.media_type
                }
                
                # Store in cache with TTL
                await self.redis_client.setex(
                    cache_key,
                    self.ttl,
                    json.dumps(cache_data)
                )
                logger.debug(f"Cache MISS (stored): {request.url.path}")
                
                # Return response with new body
                return Response(
                    content=body,
                    status_code=response.status_code,
                    headers={
                        **dict(response.headers),
                        "X-Cache": "MISS",
                        "Cache-Control": f"private, max-age={self.ttl}"
                    },
                    media_type=response.media_type
                )
            except Exception as e:
                logger.debug(f"Cache write error: {e}")
        
        return response
    
    async def __del__(self):
        """Cleanup Redis connection"""
        if self.redis_client:
            try:
                # In newer aioredis/redis-py, we should close and then await
                # But since __del__ is not async, we should use a sync close if available
                # or just let the connection pool handle it
                pass
            except:
                pass
