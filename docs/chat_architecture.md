# End-to-End Chat Architecture - Comprehensive Documentation

This document provides a comprehensive deep-dive into the chat implementation of the Engunity platform, including all source code and technical details.

## 1. Frontend Layer

### [page.tsx](../frontend/src/app/(dashboard)/chat/page.tsx)
The main UI component for the chat interface. It manages state for messages, sessions, and user input.

```tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '@/services/chat';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(input);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 items-center max-w-4xl mx-auto border rounded-xl p-2 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 resize-none outline-none p-2"
            placeholder="Ask anything..."
            rows={1}
          />
          <button onClick={handleSend} disabled={isLoading} className="p-2 bg-blue-600 text-white rounded-lg">
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### [chat.ts (Service)](../frontend/src/services/chat.ts)
The frontend service that communicates with the backend API.

```typescript
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const chatService = {
  async sendMessage(content: string, sessionId?: string) {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, session_id: sessionId }),
    });

    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async getSessions() {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/chat/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  }
};
```

---

## 2. Backend Layer (FastAPI)

### [chat.py (API)](../backend/app/api/v1/chat.py)
Defines the endpoints for chat interaction and data persistence.

```python
from fastapi import APIRouter, Depends
from app.api.v1.auth import get_current_user
from app.core.mongodb import mongodb
from app.schemas.chat import ChatMessageCreate, ChatMessage
from app.services.ai.router import ai_router
from app.services.chat.context import build_context

router = APIRouter()

@router.post("/", response_model=ChatMessage)
async def send_message(message_in: ChatMessageCreate, current_user = Depends(get_current_user)):
    session_id = message_in.session_id or str(uuid.uuid4())

    # Save User Message to MongoDB
    user_msg = {"session_id": session_id, "role": "user", "content": message_in.content}
    await mongodb.db.chat_messages.insert_one(user_msg)

    # Get AI context and response
    context = await build_context(session_id)
    assistant_reply = await ai_router.route_request(context, user_id=current_user.id)

    # Save Assistant Response to MongoDB
    assistant_msg = {"session_id": session_id, "role": "assistant", "content": assistant_reply}
    result = await mongodb.db.chat_messages.insert_one(assistant_msg)

    assistant_msg["id"] = str(result.inserted_id)
    return assistant_msg
```

### [chat.py (Schemas)](../backend/app/schemas/chat.py)
Pydantic models for data validation.

```python
from pydantic import BaseModel
from typing import Optional

class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    role: Optional[str] = "user" # Defaulting role for frontend compatibility
    session_id: Optional[str] = None
```

---

## 3. AI Logic & Services

### [router.py (AI Router)](../backend/app/services/ai/router.py)
Orchestrates requests to LLM providers.

```python
from app.services.ai.groq_client import groq_client

class AIRouter:
    async def route_request(self, messages, user_id=None):
        # Optional: Check Cache
        # Call LLM (Groq Llama 3.3)
        response = await groq_client.get_completion(messages)
        return response

ai_router = AIRouter()
```

### [groq_client.py](../backend/app/services/ai/groq_client.py)
Direct integration with Groq API.

```python
from groq import AsyncGroq

class GroqClient:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"

    async def get_completion(self, messages):
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages
        )
        return response.choices[0].message.content
```

---

## 4. Data Layer

### [mongodb.py](../backend/app/core/mongodb.py)
Core configuration for MongoDB Atlas, where chat history is stored.

### [chat.py (Models)](../backend/app/models/chat.py)
SQLAlchemy model for session metadata stored in PostgreSQL.

---

## Data Flow Summary
1. **Frontend**: User sends message -> `chatService.sendMessage`.
2. **API**: `POST /api/v1/chat/` receives request.
3. **Storage**: User message is stored in **MongoDB**.
4. **Context**: **Context Service** retrieves recent history for the AI.
5. **AI**: **AI Router** calls **Groq API** with context.
6. **Persistence**: Assistant response is stored in **MongoDB**.
7. **Response**: Assistant response is returned to **Frontend** and displayed.
