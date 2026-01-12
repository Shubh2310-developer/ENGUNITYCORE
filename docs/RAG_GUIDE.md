# Engunity AI: RAG Architecture Guide

This document provides a comprehensive technical overview of the Retrieval-Augmented Generation (RAG) system implemented in Engunity AI.

## 1. High-Level Overview

The RAG system allows the Engunity AI assistant to dynamically extend its knowledge base using user-uploaded documents. Instead of relying solely on pre-trained knowledge, the system retrieves relevant context from these documents to provide accurate, cited, and grounded responses.

### Key Capabilities:
- **Multi-format Support**: PDF, DOCX, and TXT files.
- **Privacy-First**: Documents are indexed with strict `user_id` metadata filtering.
- **Session Awareness**: Documents can be linked to specific chat sessions.
- **Citation Grounding**: Every fact retrieved from a document is cited with its source.

---

## 2. The Ingestion Pipeline

When a user uploads a document, it undergoes a multi-stage ingestion process:

### Stage 1: Cloud Storage (`Supabase Storage`)
- Files are uploaded to the `documents` bucket in Supabase.
- Path structure: `/{user_id}/{unique_file_id}.{extension}`.
- **Security**: The backend uses the `SERVICE_ROLE_KEY` to manage files while keeping the storage bucket private from direct public access.

### Stage 2: Text Extraction (`DocumentProcessor`)
The system extracts raw text based on the file type:
- **PDF**: Uses `pdfplumber` to extract text page-by-page.
- **DOCX**: Uses `python-docx` to iterate through paragraphs.
- **TXT**: Standard UTF-8 decoding with error fallback.

### Stage 3: Semantic Chunking
Extracted text is broken into manageable pieces to fit LLM context windows:
- **Tool**: `RecursiveCharacterTextSplitter`.
- **Chunk Size**: 800 characters.
- **Overlap**: 120 characters (ensures context isn't lost at the boundaries).

### Stage 4: Embedding Generation
Chunks are converted into high-dimensional numerical vectors:
- **Model**: `all-MiniLM-L6-v2` (via Sentence-Transformers).
- **Dimension**: 384.

### Stage 5: Vector Indexing (`FAISS`)
- Vectors are stored in a local **FAISS** (Facebook AI Similarity Search) index.
- **Metadata**: Each vector is tagged with:
  - `document_id`
  - `user_id`
  - `filename`
  - `session_id` (optional)
- **Persistence**: The index is saved as a `.index` and `.pkl` file in `backend/storage/vector_store/` using absolute paths for reliability.

---

## 3. The Retrieval Flow

When a user sends a message in the chat:

1.  **Query Embedding**: The user's message is converted into a vector using the same `all-MiniLM-L6-v2` model.
2.  **Similarity Search**: FAISS performs a search for the top `K=5` most relevant chunks.
3.  **Metadata Filtering**: Results are filtered in real-time to ensure:
    - `meta['user_id'] == current_user.id`
    - `meta['session_id'] == current_session_id` (if applicable).
4.  **Context Construction**:
    - The retrieved chunks are formatted into a system block:
      ```text
      Relevant context from uploaded documents:
      --- [Source: filename.pdf] ---
      [Extracted chunk content...]
      ```
    - This context is prepended to the system prompt before being sent to the LLM.

---

## 4. Generation & Grounding

The system uses **Groq** (hosting LLaMA-3 or similar) for high-speed inference.

### Prompt Engineering
The AI is given strict instructions:
- Use only the provided context.
- If the answer isn't in the context, clearly state it or use general knowledge with a disclaimer.
- Always cite sources using the `[Source: filename]` format.

### Schema Enrichment
The backend returns `retrieved_docs` (a list of unique filenames) alongside the AI's response text. This allows the frontend to visualize exactly which documents were "consulted" for that specific answer.

---

## 5. Frontend Implementation

### Chat Interface
- **RAG Status Badges**: Each assistant message displays "Sources utilized" with tags for each document used.
- **Hydration Safety**: The markdown renderer is customized to handle block elements (like code snippets) within paragraph tags, ensuring a smooth Next.js rendering experience.
- **File Uploads**: Users can upload files directly in the chat input, which triggers the ingestion pipeline and automatically links the document to the active session.

---

## 6. Technical Stack Summary

| Component | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI |
| **Vector Database** | FAISS (CPU) |
| **Embeddings** | Sentence-Transformers (`all-MiniLM-L6-v2`) |
| **File Extraction** | `pdfplumber`, `python-docx` |
| **Cloud Storage** | Supabase Storage |
| **Metadata DB** | PostgreSQL (SQLAlchemy) |
| **LLM Provider** | Groq (Llama 3) |
| **Frontend** | Next.js, React, Tailwind CSS |
| **Markdown** | `react-markdown` with GFM support |

---

## 7. Troubleshooting & Maintenance

### FAISS Index Missing
The index is stored in `backend/storage/vector_store/`. If documents seem missing after a restart, ensure the backend is using the absolute path logic defined in `vector_store.py`.

### Unauthorized Uploads
Ensure the `SUPABASE_SERVICE_ROLE_KEY` is correctly set in the `.env` file. This key is required for the backend to bypass RLS and manage user files.

### Schema Mismatches
If the `documents` table fails to save, verify the database schema using the diagnostic tools. The `title` and `content` columns are mandatory for the current RAG implementation.
