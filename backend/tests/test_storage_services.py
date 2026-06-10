import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.storage.supabase import SupabaseStorage

@pytest.mark.asyncio
async def test_supabase_storage_operations(monkeypatch):
    # Mock Redis client
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None  # Cache miss
    mock_redis.set.return_value = True

    # Mock Supabase client structures
    mock_supabase = MagicMock()
    
    mock_bucket_client = MagicMock()
    mock_bucket_client.upload.return_value = {"path": "test_path"}
    mock_bucket_client.create_signed_url.return_value = {"signedURL": "https://signed.url/test_path"}
    mock_bucket_client.get_public_url.return_value = "https://public.url/test_path"
    mock_bucket_client.remove.return_value = [{"name": "test_path"}]

    mock_storage = MagicMock()
    mock_storage.get_bucket.return_value = True
    mock_storage.from_.return_value = mock_bucket_client

    mock_supabase.storage = mock_storage

    # Instantiate storage and inject mocks
    storage = SupabaseStorage()
    storage.supabase = mock_supabase
    storage.redis = mock_redis
    storage.redis_available = True

    # Test Upload
    upload_res = await storage.upload_file("test-bucket", "test_path", b"content", "text/plain")
    assert upload_res == {"path": "test_path"}
    mock_storage.from_.assert_called_with("test-bucket")
    mock_bucket_client.upload.assert_called_once_with(
        path="test_path",
        file=b"content",
        file_options={"content-type": "text/plain"}
    )

    # Test Get File URL (Signed, cache miss)
    url = await storage.get_file_url("test-bucket", "test_path", signed=True)
    assert url == "https://signed.url/test_path"
    mock_redis.get.assert_called_once_with("img_url:test-bucket:test_path")
    mock_bucket_client.create_signed_url.assert_called_once_with("test_path", 3600)
    mock_redis.set.assert_called_once_with(
        "img_url:test-bucket:test_path",
        "https://signed.url/test_path",
        ex=3540
    )

    # Test Get File URL (Signed, cache hit)
    mock_redis.get.reset_mock()
    mock_bucket_client.create_signed_url.reset_mock()
    mock_redis.get.return_value = "https://cached.url/test_path"
    
    url_cached = await storage.get_file_url("test-bucket", "test_path", signed=True)
    assert url_cached == "https://cached.url/test_path"
    mock_redis.get.assert_called_once()
    mock_bucket_client.create_signed_url.assert_not_called()

    # Test Get File URL (Public)
    public_url = await storage.get_file_url("test-bucket", "test_path", signed=False)
    assert public_url == "https://public.url/test_path"
    mock_bucket_client.get_public_url.assert_called_once_with("test_path")

    # Test Delete File (Should invalidate cache)
    delete_res = await storage.delete_file("test-bucket", "test_path")
    assert delete_res == [{"name": "test_path"}]
    mock_redis.delete.assert_called_once_with("img_url:test-bucket:test_path")
    mock_bucket_client.remove.assert_called_once_with(["test_path"])
