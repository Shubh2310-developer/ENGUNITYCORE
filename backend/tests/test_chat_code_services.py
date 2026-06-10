import os
import pytest
import shutil
from unittest.mock import AsyncMock, MagicMock
from app.services.chat.context import build_context
from app.services.code.scanner import scan_local_workspace
from app.services.document.service import DocumentService

@pytest.mark.asyncio
async def test_build_context_no_mongo(monkeypatch):
    # Mock mongodb.db as None
    monkeypatch.setattr("app.services.chat.context.mongodb.db", None)

    # Call build_context
    messages, retrieved_docs, metadata = await build_context(
        session_id="test_session",
        user_id="test_user",
        query="test query"
    )

    assert len(messages) == 1
    assert "You are Engunity AI" in messages[0]["content"]
    assert retrieved_docs == []
    assert metadata["memory_active"] is False

@pytest.mark.asyncio
async def test_build_context_with_mongo_history(monkeypatch):
    # Mock mongodb.db and chat_messages
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = MagicMock()

    # Create dummy messages
    dummy_msgs = [
        {"role": "user", "content": "Hi", "timestamp": 1},
        {"role": "assistant", "content": "Hello", "timestamp": 2}
    ]

    # Mock cursor async iteration
    class AsyncIterator:
        def __init__(self, items):
            self.items = items
            self.idx = 0
        def __aiter__(self):
            return self
        async def __anext__(self):
            if self.idx >= len(self.items):
                raise StopAsyncIteration
            val = self.items[self.idx]
            self.idx += 1
            return val

    mock_cursor.sort.return_value.limit.return_value = AsyncIterator(dummy_msgs)
    mock_collection.find.return_value = mock_cursor
    mock_db.chat_messages = mock_collection

    monkeypatch.setattr("app.services.chat.context.mongodb.db", mock_db)

    messages, retrieved_docs, metadata = await build_context(
        session_id="test_session",
        user_id="test_user",
        query="test query"
    )

    # System prompt + 2 history messages = 3 messages total
    assert len(messages) == 3
    assert messages[1]["role"] == "assistant"
    assert messages[1]["content"] == "Hello"
    assert messages[2]["role"] == "user"
    assert messages[2]["content"] == "Hi"

def test_code_scanner_behavior():
    # Setup temporary directory structure
    temp_dir = "./temp_test_scanner"
    os.makedirs(temp_dir, exist_ok=True)
    
    sub_dir = os.path.join(temp_dir, "subdir")
    os.makedirs(sub_dir, exist_ok=True)

    # Write Python file
    py_content = """
import os
import sys

class DummyClass:
    pass

def dummy_func():
    return True
"""
    with open(os.path.join(temp_dir, "test1.py"), "w") as f:
        f.write(py_content)

    # Write JS file
    with open(os.path.join(sub_dir, "test2.js"), "w") as f:
        f.write("console.log('test');\n")

    # Run scanner
    stats = scan_local_workspace(temp_dir)

    # Cleanup temp directory
    shutil.rmtree(temp_dir)

    assert stats["files_scanned"] == 2
    assert stats["num_classes"] == 1
    assert stats["num_functions"] == 1
    assert "os" in stats["imports"]
    assert "sys" in stats["imports"]

@pytest.mark.asyncio
async def test_document_service():
    temp_storage = "./temp_test_documents"
    doc_service = DocumentService(storage_path=temp_storage)

    # Test upload
    file_name = "test_doc.txt"
    content = b"Engunity Document Service Test Content."
    file_path = await doc_service.upload_document(file_name, content)

    assert os.path.exists(file_path)

    # Test read content
    read_content = await doc_service.get_document_content(file_path)
    assert read_content == "Engunity Document Service Test Content."

    # Test non-existent file path
    empty_content = await doc_service.get_document_content("nonexistent.txt")
    assert empty_content == ""

    # Cleanup storage path
    shutil.rmtree(temp_storage)
