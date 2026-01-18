import pdfplumber
import docx
import io
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from app.services.ai.vector_store import vector_store
from app.services.ai.ocr_client import ocr_client

class SentenceTransformerWrapper:
    def __init__(self, model):
        self.model = model
    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()
    def embed_query(self, text):
        return self.model.encode([text])[0].tolist()

class DocumentProcessor:
    def __init__(self):
        # Fallback recursive splitter
        self.recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=120,
            length_function=len,
            is_separator_regex=False,
        )

        # Advanced Semantic Chunker (State-of-the-art)
        # It uses the same embedding model as vector_store for consistency
        self.semantic_splitter = SemanticChunker(
            SentenceTransformerWrapper(vector_store.model),
            breakpoint_threshold_type="percentile"
        )

    def extract_text(self, file_content: bytes, file_name: str) -> str:
        text = ""
        file_ext = file_name.split('.')[-1].lower() if '.' in file_name else ""

        if file_ext == "pdf":
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                    else:
                        # Attempt OCR on empty pages (scanned)
                        try:
                            # Convert page to image for OCR
                            page_image = page.to_image().original
                            img_byte_arr = io.BytesIO()
                            page_image.save(img_byte_arr, format='PNG')
                            ocr_text = ocr_client.extract_text(img_byte_arr.getvalue())
                            if ocr_text:
                                text += "[OCR]: " + ocr_text + "\n"
                        except Exception as e:
                            print(f"OCR Error on PDF page: {e}")

        elif file_ext in ["docx", "doc"]:
            doc = docx.Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif file_ext in ["png", "jpg", "jpeg", "webp"]:
            # Direct OCR for image files
            text = ocr_client.extract_text(file_content)
        else:
            # Fallback to plain text
            try:
                text = file_content.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
        return text

    async def process_and_index(self, file_content: bytes, file_name: str, metadata: Dict[str, Any], use_semantic: bool = True):
        text = self.extract_text(file_content, file_name)
        if not text.strip():
            return 0

        if use_semantic:
            try:
                # Semantic chunking provides much better context preservation
                chunks = self.semantic_splitter.split_text(text)
            except Exception as e:
                print(f"Semantic chunking failed: {e}, falling back to recursive")
                chunks = self.recursive_splitter.split_text(text)
        else:
            chunks = self.recursive_splitter.split_text(text)

        chunk_metadatas = []
        for i, chunk in enumerate(chunks):
            chunk_meta = metadata.copy()
            chunk_meta["chunk_index"] = i
            chunk_meta["text"] = chunk # Store text in metadata for retrieval
            chunk_metadatas.append(chunk_meta)

        vector_store.add_texts(chunks, chunk_metadatas)
        return len(chunks)

document_processor = DocumentProcessor()
