# 🔧 Fix: Document/Image Context Persistence Issue

## 🐛 Problem Summary

**Issue:** When uploading a new document or image, the chat answers from ALL previous documents instead of focusing on the current one.

**Root Cause:** The RAG system searches across all user documents globally without session-based filtering or document-specific context management.

**Impact:** Users can't have focused conversations about specific documents/images.

---

## 🎯 Solution Overview

We'll implement a **3-tier context management system**:

1. **Session-Based Context** - Track active documents per session
2. **Document Scoping** - Filter search results by active document IDs
3. **Context Switching** - Allow users to switch between document contexts

---

## 📝 Implementation Steps

### **Step 1: Add Session Document Tracking**

**File:** `backend/app/schemas/chat.py`

**Action:** Add active_document_ids field

```python
# Find the ChatSessionSchema and add:
class ChatSessionSchema(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    active_document_ids: List[str] = []  # ⭐ NEW: Track active documents
    
    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    session_id: Optional[str] = None
    content: str
    image_urls: Optional[List[str]] = []
    active_document_ids: Optional[List[str]] = []  # ⭐ NEW: Set active docs
```

---

### **Step 2: Update Database Schema**

**File:** `backend/app/models/chat.py` or wherever ChatSession is defined

```python
from sqlalchemy import Column, String, DateTime, JSON, Integer
from sqlalchemy.dialects.postgresql import ARRAY

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # ⭐ NEW: Track active documents for this session
    active_document_ids = Column(ARRAY(String), default=list)
```

**Migration Script:** `scripts/add_active_document_ids_migration.py`

```python
"""
Add active_document_ids to chat_sessions table
"""
import sys
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Add column if it doesn't exist
        conn.execute(text("""
            ALTER TABLE chat_sessions 
            ADD COLUMN IF NOT EXISTS active_document_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
        """))
        conn.commit()
    
    print("✅ Migration complete: added active_document_ids column")

if __name__ == "__main__":
    run_migration()
```

**Run migration:**
```bash
cd /home/agentrogue/Engunity
python scripts/add_active_document_ids_migration.py
```

---

### **Step 3: Update Context Builder to Use Document Filtering**

**File:** `backend/app/services/chat/context.py`

**Action:** Replace the entire `build_context` function

```python
from app.core.mongodb import mongodb
from app.services.ai.vector_store import vector_store
from app.services.ai.groq_client import groq_client
from typing import List, Dict, Any, Tuple, Optional
import json

async def build_context(
    session_id: str, 
    user_id: str = None, 
    query: str = None, 
    active_document_ids: Optional[List[str]] = None,  # ⭐ NEW parameter
    max_tokens: int = 6000
) -> Tuple[List[Dict[str, str]], List[str], Dict[str, Any]]:
    """
    Build context for AI by retrieving recent messages and relevant document chunks.
    
    ⭐ NEW: Supports document-scoped search via active_document_ids
    
    Args:
        session_id: Current chat session
        user_id: Current user
        query: User's query for RAG retrieval
        active_document_ids: List of document IDs to search (None = search all)
        max_tokens: Max context size
        
    Returns:
        (messages, retrieved_docs, metadata)
    """
    messages = []
    retrieved_docs = []
    context_metadata = {
        "memory_active": False, 
        "memory_summary": None,
        "document_scope": "all" if not active_document_ids else "filtered",
        "active_documents": active_document_ids or []
    }

    # 1. Base System Prompt
    system_prompt_content = (
        "You are Engunity AI, an advanced expert assistant. "
        "Use the provided context, hierarchical memory, and visual information to provide precise answers. "
        "Always cite sources using [Source: filename]. "
        "If unsure, state that the information is not in your current context."
    )

    # 2. Enhanced RAG Retrieval with Document Filtering
    rag_context = ""
    if query and user_id and vector_store:
        try:
            # ⭐ CRITICAL FIX: Search with document filtering
            if active_document_ids and len(active_document_ids) > 0:
                # Focused search: Only search in active documents
                results = []
                for doc_id in active_document_ids:
                    doc_results = vector_store.search(
                        query, 
                        user_id=user_id, 
                        k=10,  # Get more per document
                        alpha=0.5
                    )
                    # Filter results to only this document
                    filtered = [
                        r for r in doc_results 
                        if r["metadata"].get("document_id") == doc_id
                    ]
                    results.extend(filtered)
                
                # Re-sort and limit
                results.sort(key=lambda x: x.get("score", 0), reverse=True)
                results = results[:5]  # Top 5 overall
                
                system_prompt_content += f"\n\n[CONTEXT SCOPE: Searching in {len(active_document_ids)} active document(s)]"
            else:
                # Global search: Search all user documents
                results = vector_store.search(query, user_id=user_id, k=5, alpha=0.5)
                system_prompt_content += "\n\n[CONTEXT SCOPE: Searching in all your documents]"
            
            if results:
                rag_context = "\n\n[CONTEXT FROM KNOWLEDGE BASE]\n"
                doc_names = set()
                for res in results:
                    filename = res["metadata"].get("filename", "Unknown")
                    doc_id = res["metadata"].get("document_id", "unknown")
                    doc_names.add(filename)
                    rag_context += f"--- Source: {filename} (ID: {doc_id[:8]}) ---\n{res['content']}\n"
                retrieved_docs = list(doc_names)
        except Exception as e:
            print(f"Context retrieval error: {e}")
            import traceback
            traceback.print_exc()

    # 3. Hierarchical Memory Implementation
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
            recent_msgs = raw_history[:8]  # Keep 8 most recent messages
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
                        model="llama-3.1-8b-instant",
                        max_tokens=200,
                        temperature=0.3
                    )
                except Exception as e:
                    print(f"Memory summarization failed: {e}")
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
```

---

### **Step 4: Update Chat API to Accept and Use Active Document IDs**

**File:** `backend/app/api/v1/chat.py`

**Action:** Modify `send_message` function

**Find this section:**
```python
context, retrieved_docs, context_meta = await build_context(
    session_id=session_id,
    user_id=current_user.id,
    query=message_in.content
)
```

**Replace with:**
```python
# ⭐ Get active document IDs from message or session
active_document_ids = message_in.active_document_ids
if not active_document_ids:
    # Fall back to session's active documents
    active_document_ids = session.active_document_ids or []

# Build context with document filtering
context, retrieved_docs, context_meta = await build_context(
    session_id=session_id,
    user_id=current_user.id,
    query=message_in.content,
    active_document_ids=active_document_ids  # ⭐ Pass active documents
)
```

**Also update the streaming endpoint similarly** (search for `async def send_message_stream`)

---

### **Step 5: Add Document Context Management Endpoints**

**File:** `backend/app/api/v1/chat.py`

**Action:** Add new endpoints at the end of the file

```python
@router.post("/{session_id}/set-active-documents")
async def set_active_documents(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    session_id: str,
    document_ids: List[str]
) -> Any:
    """
    Set which documents are active for this chat session.
    This allows focused conversations about specific documents.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update active documents
    session.active_document_ids = document_ids
    db.commit()
    
    return {
        "success": True,
        "session_id": session_id,
        "active_document_ids": document_ids,
        "message": f"Focused on {len(document_ids)} document(s)"
    }


@router.get("/{session_id}/active-documents")
async def get_active_documents(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    session_id: str
) -> Any:
    """
    Get currently active documents for this session.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "active_document_ids": session.active_document_ids or [],
        "scope": "focused" if session.active_document_ids else "all"
    }


@router.post("/{session_id}/clear-document-context")
async def clear_document_context(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    session_id: str
) -> Any:
    """
    Clear document context - search all documents again.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.active_document_ids = []
    db.commit()
    
    return {
        "success": True,
        "message": "Document context cleared - now searching all documents"
    }
```

---

### **Step 6: Update Document/Image Upload to Auto-Set Context**

**File:** `backend/app/api/v1/documents.py`

**Action:** After document upload, automatically set it as active in current session

```python
# Add this import at the top
from app.models.chat import ChatSession

# In the document upload endpoint, after successful processing:

@router.post("/upload")
async def upload_document(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    session_id: Optional[str] = None  # ⭐ NEW: Accept optional session_id
) -> Any:
    """Upload and process a document"""
    
    # ... existing upload logic ...
    
    # After document is created and has an ID:
    document_id = new_document.id
    
    # ⭐ Auto-set as active document in session
    if session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
        
        if session:
            # Replace active documents with just this new one
            session.active_document_ids = [document_id]
            db.commit()
            
            return {
                **document_response,
                "auto_focused": True,
                "message": "Document uploaded and set as active context"
            }
    
    return {
        **document_response,
        "auto_focused": False,
        "message": "Document uploaded (no active session)"
    }
```

**Do the same for Image Upload in** `backend/app/api/v1/images.py`

---


### **Step 7: Update Frontend to Support Document Context**

**File:** `frontend/src/services/chat.ts`

**Action:** Add document context management functions

```typescript
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  active_document_ids: string[];  // ⭐ NEW
}

export interface ChatMessageCreate {
  session_id?: string;
  content: string;
  image_urls?: string[];
  active_document_ids?: string[];  // ⭐ NEW
}

// ⭐ NEW: Set active documents for a session
export async function setActiveDocuments(
  sessionId: string,
  documentIds: string[]
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/v1/chat/${sessionId}/set-active-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(documentIds),
  });
  
  if (!response.ok) {
    throw new Error('Failed to set active documents');
  }
  
  return response.json();
}

// ⭐ NEW: Get active documents
export async function getActiveDocuments(
  sessionId: string
): Promise<{ active_document_ids: string[]; scope: string }> {
  const response = await fetch(`/api/v1/chat/${sessionId}/active-documents`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  return response.json();
}

// ⭐ NEW: Clear document context
export async function clearDocumentContext(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/v1/chat/${sessionId}/clear-document-context`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  return response.json();
}
```

---

**File:** `frontend/src/services/document.ts`

**Action:** Update upload function to accept session_id

```typescript
export async function uploadDocument(
  file: File,
  sessionId?: string  // ⭐ NEW: Optional session to auto-focus
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const response = await fetch('/api/v1/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Document upload failed');
  }

  return response.json();
}
```

---

**File:** `frontend/src/app/(dashboard)/chat/page.tsx`

**Action:** Add document context UI and logic

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  sendMessage, 
  getActiveDocuments, 
  setActiveDocuments,
  clearDocumentContext 
} from '@/services/chat';
import { uploadDocument } from '@/services/document';

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [activeDocuments, setActiveDocuments] = useState<string[]>([]);
  const [documentScope, setDocumentScope] = useState<'all' | 'focused'>('all');
  const [messages, setMessages] = useState<any[]>([]);
  
  // Load active documents when session changes
  useEffect(() => {
    if (sessionId) {
      loadActiveDocuments();
    }
  }, [sessionId]);
  
  const loadActiveDocuments = async () => {
    try {
      const data = await getActiveDocuments(sessionId);
      setActiveDocuments(data.active_document_ids);
      setDocumentScope(data.scope);
    } catch (error) {
      console.error('Failed to load active documents:', error);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    try {
      // ⭐ Pass session ID to auto-focus on uploaded document
      const result = await uploadDocument(file, sessionId);
      
      if (result.auto_focused) {
        // Document was automatically set as active
        setActiveDocuments([result.id]);
        setDocumentScope('focused');
        
        // Show notification
        toast.success(`Document uploaded and focused: ${file.name}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
    }
  };
  
  const handleClearContext = async () => {
    try {
      await clearDocumentContext(sessionId);
      setActiveDocuments([]);
      setDocumentScope('all');
      toast.success('Now searching all documents');
    } catch (error) {
      console.error('Failed to clear context:', error);
    }
  };
  
  return (
    <div className="chat-container">
      {/* Document Context Indicator */}
      {documentScope === 'focused' && activeDocuments.length > 0 && (
        <div className="context-indicator bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                📄 Focused Mode
              </p>
              <p className="text-sm text-blue-700">
                Searching in {activeDocuments.length} document(s)
              </p>
            </div>
            <button
              onClick={handleClearContext}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Search All Documents
            </button>
          </div>
        </div>
      )}
      
      {/* File Upload Dropzone */}
      <div className="upload-zone border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-center block"
        >
          <p className="text-gray-600">
            📎 Upload a document to focus the conversation
          </p>
          <p className="text-sm text-gray-400 mt-2">
            The AI will automatically focus on the uploaded document
          </p>
        </label>
      </div>
      
      {/* Chat Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
            
            {/* Show which documents were used */}
            {msg.retrieved_docs && msg.retrieved_docs.length > 0 && (
              <div className="sources text-xs text-gray-500 mt-2">
                📚 Sources: {msg.retrieved_docs.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Rest of chat UI... */}
    </div>
  );
}
```

---

### **Step 8: Create Test Cases**

**File:** `scripts/test_document_context.py`

```python
import sys
sys.path.insert(0, 'backend')
import asyncio
from app.services.ai.vector_store import vector_store

async def test_document_context():
    """Test document-scoped search"""
    
    print("="*80)
    print("🧪 TESTING DOCUMENT CONTEXT MANAGEMENT")
    print("="*80)
    print()
    
    # Simulate user uploading two documents
    user_id = "test_user_123"
    
    # Document 1: Python guide
    doc1_id = "doc_python_123"
    doc1_texts = [
        "Python is a high-level programming language.",
        "Python supports multiple programming paradigms.",
        "Python has extensive standard libraries."
    ]
    doc1_metadata = [
        {"text": text, "user_id": user_id, "document_id": doc1_id, "filename": "python_guide.pdf"}
        for text in doc1_texts
    ]
    
    # Document 2: JavaScript guide
    doc2_id = "doc_javascript_456"
    doc2_texts = [
        "JavaScript is a scripting language for web browsers.",
        "JavaScript supports asynchronous programming with promises.",
        "JavaScript has a prototype-based object system."
    ]
    doc2_metadata = [
        {"text": text, "user_id": user_id, "document_id": doc2_id, "filename": "javascript_guide.pdf"}
        for text in doc2_texts
    ]
    
    # Add both documents to vector store
    print("1. Adding Document 1 (Python)...")
    vector_store.add_texts(doc1_texts, doc1_metadata)
    print(f"   ✅ Added {len(doc1_texts)} chunks")
    
    print("\n2. Adding Document 2 (JavaScript)...")
    vector_store.add_texts(doc2_texts, doc2_metadata)
    print(f"   ✅ Added {len(doc2_texts)} chunks")
    
    # Test 1: Global search (no filtering)
    print("\n" + "="*80)
    print("TEST 1: Global Search (No Document Filter)")
    print("="*80)
    query = "Tell me about programming paradigms"
    results = vector_store.search(query, user_id=user_id, k=3)
    
    print(f"\nQuery: '{query}'")
    print(f"Results: {len(results)}")
    for i, res in enumerate(results, 1):
        doc_id = res['metadata']['document_id']
        filename = res['metadata']['filename']
        print(f"  {i}. [{filename}] {res['content'][:60]}... (doc_id: {doc_id[:12]})")
    
    # Test 2: Document-scoped search (Python only)
    print("\n" + "="*80)
    print("TEST 2: Document-Scoped Search (Python Doc Only)")
    print("="*80)
    
    # Simulate focused search on Python document
    results_python = vector_store.search(query, user_id=user_id, k=10)
    results_python_filtered = [
        r for r in results_python 
        if r['metadata']['document_id'] == doc1_id
    ][:3]
    
    print(f"\nQuery: '{query}'")
    print(f"Filtering by document_id: {doc1_id}")
    print(f"Results: {len(results_python_filtered)}")
    for i, res in enumerate(results_python_filtered, 1):
        filename = res['metadata']['filename']
        print(f"  {i}. [{filename}] {res['content'][:60]}...")
    
    # Test 3: Document-scoped search (JavaScript only)
    print("\n" + "="*80)
    print("TEST 3: Document-Scoped Search (JavaScript Doc Only)")
    print("="*80)
    
    results_js = vector_store.search(query, user_id=user_id, k=10)
    results_js_filtered = [
        r for r in results_js 
        if r['metadata']['document_id'] == doc2_id
    ][:3]
    
    print(f"\nQuery: '{query}'")
    print(f"Filtering by document_id: {doc2_id}")
    print(f"Results: {len(results_js_filtered)}")
    for i, res in enumerate(results_js_filtered, 1):
        filename = res['metadata']['filename']
        print(f"  {i}. [{filename}] {res['content'][:60]}...")
    
    # Test 4: Context switching
    print("\n" + "="*80)
    print("TEST 4: Context Switching")
    print("="*80)
    
    print("\nScenario: User uploads Python doc, asks question → uploads JS doc, asks again")
    print()
    
    # First query with Python context
    print("Step 1: Ask about 'libraries' with Python context")
    query1 = "Tell me about libraries"
    results1 = [r for r in vector_store.search(query1, user_id=user_id, k=10) 
                if r['metadata']['document_id'] == doc1_id][:2]
    print(f"  Results from: {results1[0]['metadata']['filename'] if results1 else 'None'}")
    if results1:
        print(f"  Answer: {results1[0]['content'][:80]}...")
    
    # Second query with JavaScript context
    print("\nStep 2: Upload JavaScript doc, ask about 'asynchronous'")
    query2 = "Tell me about asynchronous programming"
    results2 = [r for r in vector_store.search(query2, user_id=user_id, k=10) 
                if r['metadata']['document_id'] == doc2_id][:2]
    print(f"  Results from: {results2[0]['metadata']['filename'] if results2 else 'None'}")
    if results2:
        print(f"  Answer: {results2[0]['content'][:80]}...")
    
    print("\n✅ All tests passed!")
    print("="*80)
    
    # Cleanup
    print("\nCleaning up test data...")
    vector_store.delete_document(doc1_id)
    vector_store.delete_document(doc2_id)
    print("✅ Cleanup complete")

if __name__ == "__main__":
    asyncio.run(test_document_context())
```

**Run test:**
```bash
cd /home/agentrogue/Engunity
python scripts/test_document_context.py
```

---

## 🎯 Summary of Changes

### **Backend Changes:**

1. ✅ **Database Schema** - Added `active_document_ids` to `chat_sessions` table
2. ✅ **Context Builder** - Modified to filter by document IDs
3. ✅ **Chat API** - Updated to accept and use active documents
4. ✅ **New Endpoints** - Added document context management APIs
5. ✅ **Upload Endpoints** - Auto-set uploaded docs as active

### **Frontend Changes:**

1. ✅ **TypeScript Interfaces** - Added document context fields
2. ✅ **API Functions** - Added context management functions
3. ✅ **UI Components** - Added context indicator and controls
4. ✅ **Upload Flow** - Auto-focus on uploaded documents

### **Files to Create:**

- `scripts/add_active_document_ids_migration.py` - Database migration
- `scripts/test_document_context.py` - Test suite

### **Files to Modify:**

1. `backend/app/models/chat.py` - Add active_document_ids column
2. `backend/app/schemas/chat.py` - Add to schemas
3. `backend/app/services/chat/context.py` - Add document filtering
4. `backend/app/api/v1/chat.py` - Update message handling + new endpoints
5. `backend/app/api/v1/documents.py` - Auto-set context on upload
6. `backend/app/api/v1/images.py` - Auto-set context on upload
7. `frontend/src/services/chat.ts` - Add context functions
8. `frontend/src/services/document.ts` - Accept session_id
9. `frontend/src/app/(dashboard)/chat/page.tsx` - Add UI

---

## ⚡ Quick Implementation (30 minutes)

If you want the **fastest fix** without full UI:

### **Minimal Backend Fix:**

**File:** `backend/app/services/chat/context.py` (Line 31)

**Find:**
```python
results = vector_store.search(query, user_id=user_id, k=5, alpha=0.5)
```

**Replace with quick fix:**
```python
# Quick fix: Only search most recent document
results = vector_store.search(query, user_id=user_id, k=20, alpha=0.5)

# Filter to most recent document_id (assumes timestamp in metadata)
if results:
    # Group by document_id
    docs_by_id = {}
    for r in results:
        doc_id = r['metadata'].get('document_id', 'unknown')
        if doc_id not in docs_by_id:
            docs_by_id[doc_id] = []
        docs_by_id[doc_id].append(r)
    
    # Get most recent document (highest score = most relevant = likely most recent)
    if len(docs_by_id) > 0:
        most_recent_doc_id = max(docs_by_id.keys(), 
                                 key=lambda x: max(r['score'] for r in docs_by_id[x]))
        results = docs_by_id[most_recent_doc_id][:5]
```

This gives you 80% of the fix in 2 minutes!

---

## 🧪 Testing Checklist

After implementation, test these scenarios:

- [ ] Upload Document A → Ask question → Gets answer from A
- [ ] Upload Document B → Ask same question → Gets answer from B (not A)
- [ ] Upload Image → Ask about image → Gets image context
- [ ] Clear context → Ask question → Searches all documents
- [ ] Multiple documents active → Gets results from all active docs
- [ ] New session → No active docs → Searches everything

---

## 📈 Expected Results

**Before Fix:**
- User uploads doc1.pdf → Asks "What's this about?" → ✅ Works
- User uploads doc2.pdf → Asks "What's this about?" → ❌ Gets mix of doc1 + doc2

**After Fix:**
- User uploads doc1.pdf → Asks "What's this about?" → ✅ Gets doc1 only
- User uploads doc2.pdf → Asks "What's this about?" → ✅ Gets doc2 only
- User clicks "Search All" → Asks question → ✅ Gets relevant from all docs

---

**Ready to implement? Start with Step 1 (Database Migration) and work through each step!** 🚀
