import pdfplumber
import docx
import io
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.ai.vector_store import vector_store

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=120,
            length_function=len,
            is_separator_regex=False,
        )

    def extract_text(self, file_content: bytes, file_type: str) -> str:
        text = ""
        if "pdf" in file_type.lower():
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        elif "word" in file_type.lower() or "docx" in file_type.lower():
            doc = docx.Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            # Fallback to plain text
            try:
                text = file_content.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
        return text

    async def process_and_index(self, file_content: bytes, file_type: str, metadata: Dict[str, Any]):
        text = self.extract_text(file_content, file_type)
        if not text.strip():
            return

        chunks = self.text_splitter.split_text(text)

        chunk_metadatas = []
        for i, chunk in enumerate(chunks):
            chunk_meta = metadata.copy()
            chunk_meta["chunk_index"] = i
            chunk_meta["text"] = chunk # Store text in metadata for retrieval
            chunk_metadatas.append(chunk_meta)

        vector_store.add_texts(chunks, chunk_metadatas)
        return len(chunks)

document_processor = DocumentProcessor()
