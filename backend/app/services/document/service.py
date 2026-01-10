from typing import List, Any
import os

class DocumentService:
    def __init__(self, storage_path: str = "./storage/documents"):
        self.storage_path = storage_path
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)

    async def upload_document(self, file_name: str, content: bytes) -> str:
        file_path = os.path.join(self.storage_path, file_name)
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    async def get_document_content(self, file_path: str) -> str:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        return ""

document_service = DocumentService()
