from app.core.mongodb import mongodb
from app.services.ai.vector_store import vector_store
from typing import List, Dict, Any

async def build_context(session_id: str, user_id: str = None, query: str = None, max_tokens: int = 6000):
    """
    Build context for AI by retrieving recent messages from MongoDB
    and relevant document chunks from FAISS (RAG).
    Returns a tuple of (messages, retrieved_docs)
    """
    messages = []
    retrieved_docs = []

    # 1. Add System Prompt for RAG grounding
    system_prompt = {
        "role": "system",
        "content": (
            "You are Engunity AI, a helpful assistant. "
            "Use the provided context from documents to answer the user's question. "
            "If the answer is not in the context, use your general knowledge but mention it. "
            "Always cite the document name when using information from it (e.g., [Source: document.pdf])."
        )
    }

    # 2. Retrieve relevant document chunks if query and user_id are provided
    rag_context = ""
    if query and user_id and vector_store:
        try:
            # Search with session_id to prioritize/filter for session-specific context
            results = vector_store.search(query, user_id=user_id, session_id=session_id, k=5)
            if results:
                rag_context = "\n\nRelevant context from uploaded documents:\n"
                doc_names = set()
                for res in results:
                    filename = res["metadata"].get("filename", "Unknown")
                    doc_names.add(filename)
                    content = res["content"]
                    rag_context += f"--- [Source: {filename}] ---\n{content}\n"

                system_prompt["content"] += rag_context
                retrieved_docs = list(doc_names)
        except Exception as e:
            print(f"RAG search error: {e}")

    messages.append(system_prompt)
    # ... (rest of history fetching)
    if mongodb.db is not None:
        cursor = mongodb.db.chat_messages.find(
            {"session_id": session_id}
        ).sort("timestamp", -1).limit(50)

        history = []
        current_chars = 0
        max_chars = (max_tokens - 1000) * 4

        async for msg in cursor:
            content = msg["content"]
            role = msg["role"]
            msg_chars = len(content) + 20
            if current_chars + msg_chars > max_chars:
                break
            history.append({"role": role, "content": content})
            current_chars += msg_chars

        messages.extend(list(reversed(history)))

    return messages, retrieved_docs
