from supabase import create_client, Client
from app.core.config import settings
import os

class SupabaseStorage:
    def __init__(self):
        self.supabase: Client = None
        # Use SERVICE_ROLE_KEY if available to bypass RLS in the backend
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if settings.SUPABASE_URL and key:
            self.supabase = create_client(settings.SUPABASE_URL, key)

    async def upload_file(self, bucket: str, path: str, file_content: bytes, content_type: str):
        if not self.supabase:
            raise Exception("Supabase not configured")

        return self.supabase.storage.from_(bucket).upload(
            path=path,
            file=file_content,
            file_options={"content-type": content_type}
        )

    async def get_file_url(self, bucket: str, path: str):
        if not self.supabase:
            raise Exception("Supabase not configured")

        return self.supabase.storage.from_(bucket).get_public_url(path)

    async def delete_file(self, bucket: str, path: str):
        if not self.supabase:
            raise Exception("Supabase not configured")

        return self.supabase.storage.from_(bucket).remove([path])

storage_service = SupabaseStorage()
