import redis.asyncio as redis
from supabase import create_client, Client
from app.core.config import settings
import os
import json

class SupabaseStorage:
    def __init__(self):
        self.supabase: Client = None
        # Use SERVICE_ROLE_KEY if available to bypass RLS in the backend
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if settings.SUPABASE_URL and key:
            self.supabase = create_client(settings.SUPABASE_URL, key)

        # Initialize Redis for URL caching
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_available = True
        except Exception as e:
            print(f"WARNING: Redis not available at {settings.REDIS_URL}: {e}")
            self.redis = None
            self.redis_available = False

    async def upload_file(self, bucket: str, path: str, file_content: bytes, content_type: str):
        if not self.supabase:
            raise Exception("Supabase not configured")

        # Ensure bucket exists
        try:
            self.supabase.storage.get_bucket(bucket)
        except Exception:
            try:
                self.supabase.storage.create_bucket(bucket, options={"public": True})
            except Exception as e:
                print(f"Error creating bucket {bucket}: {e}")

        return self.supabase.storage.from_(bucket).upload(
            path=path,
            file=file_content,
            file_options={"content-type": content_type}
        )

    async def get_file_url(self, bucket: str, path: str, signed: bool = True, expires_in: int = 3600):
        if not self.supabase:
            raise Exception("Supabase not configured")

        if signed:
            # Check Redis cache first
            cache_key = f"img_url:{bucket}:{path}"
            if self.redis_available:
                try:
                    cached_url = await self.redis.get(cache_key)
                    if cached_url:
                        return cached_url
                except Exception as e:
                    print(f"WARNING: Redis error during get: {e}")
                    self.redis_available = False

            # Generate a signed URL for secure access
            res = self.supabase.storage.from_(bucket).create_signed_url(path, expires_in)

            url = None
            if isinstance(res, dict) and "signedURL" in res:
                url = res["signedURL"]
            else:
                url = res # Depending on version, it might return the string directly

            # Cache the URL in Redis with a TTL slightly less than the signed expiry
            if url and self.redis_available:
                try:
                    await self.redis.set(cache_key, url, ex=expires_in - 60)
                except Exception as e:
                    print(f"WARNING: Redis error during set: {e}")
                    self.redis_available = False

            return url

        return self.supabase.storage.from_(bucket).get_public_url(path)

    async def delete_file(self, bucket: str, path: str):
        if not self.supabase:
            raise Exception("Supabase not configured")

        # Invalidate cache
        if self.redis_available:
            try:
                cache_key = f"img_url:{bucket}:{path}"
                await self.redis.delete(cache_key)
            except Exception as e:
                print(f"WARNING: Redis error during delete: {e}")
                self.redis_available = False

        return self.supabase.storage.from_(bucket).remove([path])

storage_service = SupabaseStorage()
