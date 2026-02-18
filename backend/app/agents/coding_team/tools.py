import os
from typing import Optional
from langchain_core.tools import tool
# Mocking the RAG implementation as requested if not directly callable
# In a real scenario, this would import from app.services.rag...

@tool
def read_file(file_path: str) -> str:
    """Reads the content of a file."""
    try:
        if not os.path.isabs(file_path):
            # strict absolute path or relative to root
             file_path = os.path.abspath(file_path)

        with open(file_path, 'r') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

@tool
def write_file(file_path: str, content: str) -> str:
    """Writes content to a file. Overwrites if exists."""
    try:
        if not os.path.isabs(file_path):
             file_path = os.path.abspath(file_path)

        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            f.write(content)
        return f"Successfully wrote to {file_path}"
    except Exception as e:
        return f"Error writing file: {str(e)}"

@tool
def list_files(directory: str = ".") -> str:
    """Lists files in a directory."""
    try:
        files = []
        for root, _, filenames in os.walk(directory):
            for filename in filenames:
                files.append(os.path.join(root, filename))
            if len(files) > 50: # Limit for safety
                break
        return "\n".join(files[:50])
    except Exception as e:
        return f"Error listing files: {str(e)}"

from app.core.service_registry import services

@tool
def rag_search_code(query: str) -> str:
    """
    Searches the codebase for relevant code snippets using semantic search.
    Useful for finding where specific functionality is implemented.
    """
    try:
        # Check if AI is enabled
        if not services.is_ai_enabled():
            return "AI services are disabled. Cannot perform semantic search."

        # Get vector store (lazy load)
        vector_store = services.get_vector_store()

        # Perform search
        # We assume 'code_source' or similar type, or just search everything
        results = vector_store.search(query, k=5)

        if not results:
             return f"No results found for '{query}'."

        formatted_results = []
        for doc in results:
            meta = doc.get("metadata", {})
            filename = meta.get("filename", "unknown")
            content = doc.get("content", "")[:500] # Truncate for token limit
            formatted_results.append(f"File: {filename}\nSnippet:\n{content}\n...")

        return "\n\n".join(formatted_results)

    except Exception as e:
        return f"Error during RAG search: {str(e)}"
