from app.core.mongodb import mongodb
from app.services.ai.vector_store import vector_store
from app.services.ai.groq_client import groq_client
from typing import List, Dict, Any, Tuple
import json

async def build_context(session_id: str, user_id: str = None, query: str = None, max_tokens: int = 6000) -> Tuple[List[Dict[str, str]], List[str], Dict[str, Any]]:
    """
    Build context for AI by retrieving recent messages, relevant document chunks,
    and utilizing hierarchical memory (summarization of older context).
    Returns (messages, retrieved_docs, metadata)
    """
    messages = []
    retrieved_docs = []
    context_metadata = {"memory_active": False, "memory_summary": None}

    # 1. Base System Prompt
    system_prompt_content = (
        "You are Engunity AI, an advanced expert assistant. "
        "Use the provided context, hierarchical memory, and visual information to provide precise answers. "
        "Always cite sources using [Source: filename]. "
        "If unsure, state that the information is not in your current context."
    )

    # 2. Hybrid Search (Dense + Sparse) & Multi-Query results would normally be here,
    # but the pipeline handles the complex RAG flow. This function serves as the
    # default context builder for simpler paths or history retrieval.
    rag_context = ""
    if query and user_id and vector_store:
        try:
            # Enhanced search with hybrid logic
            # Pass session_id to filter documents to only this chat session
            results = vector_store.search(query, user_id=user_id, session_id=session_id, k=5, alpha=0.5)
            if results:
                rag_context = "\n\n[CONTEXT FROM KNOWLEDGE BASE]\n"
                doc_names = set()
                for res in results:
                    filename = res["metadata"].get("filename", "Unknown")
                    doc_names.add(filename)
                    rag_context += f"--- Source: {filename} ---\n{res['content']}\n"
                retrieved_docs = list(doc_names)
        except Exception as e:
            print(f"Context retrieval error: {e}")

    # 3. Hierarchical Memory Implementation
    # We fetch more history than needed, summarize the tail, and keep the head (recent) intact.
    history_messages = []
    memory_summary = ""

    if mongodb.db is not None:
        # Fetch last 30 messages
        cursor = mongodb.db.chat_messages.find({"session_id": session_id}).sort("timestamp", -1).limit(30)
        raw_history = []
        async for msg in cursor:
            raw_history.append(msg)

        if len(raw_history) > 10:
            # We have enough history to justify hierarchical memory
            recent_msgs = raw_history[:8] # Keep 8 most recent messages
            older_msgs = raw_history[8:]  # Summarize the rest

            # Generate summary for older messages (Hierarchical Memory)
            if older_msgs:
                older_text = "\n".join([f"{m['role']}: {m['content']}" for m in reversed(older_msgs)])
                try:
                    summary_prompt = [
                        {"role": "system", "content": "Summarize the following chat history into a concise paragraph focusing on key facts and user preferences revealed."},
                        {"role": "user", "content": older_text}
                    ]
                    memory_summary = await groq_client.get_completion(
                        summary_prompt,
                        model="llama-3.1-8b-instant", # Fast model for summarization
                        max_tokens=200,
                        temperature=0.3
                    )
                except Exception as e:
                    print(f"Memory summarization failed: {e}")
                    # Fallback: just use a subset without summary
                    recent_msgs = raw_history[:15]

            # Process recent messages
            for msg in reversed(recent_msgs):
                content = msg["content"]
                image_urls = msg.get("image_urls", [])
                if image_urls:
                    img_refs = "\n".join([f"[Referenced Image: {url}]" for url in image_urls])
                    content = f"{img_refs}\n{content}"
                history_messages.append({"role": msg["role"], "content": content})
        else:
            # Small history, just take it all
            for msg in reversed(raw_history):
                history_messages.append({"role": msg["role"], "content": msg["content"]})

    # 4. Context Packing & Assembly
    final_system_content = system_prompt_content
    if memory_summary:
        final_system_content += f"\n\n[HIERARCHICAL MEMORY (PREVIOUS CONTEXT)]\n{memory_summary}"
    if rag_context:
        final_system_content += rag_context

    messages.append({"role": "system", "content": final_system_content})
    messages.extend(history_messages)

    if memory_summary:
        context_metadata["memory_active"] = True
        context_metadata["memory_summary"] = memory_summary

    return messages, retrieved_docs, context_metadata
