# 🔍 AI Deep Research Agent — Chat Page Integration Guide

> **Reference Doc:** [`01_AI_DEEP_RESEARCH_AGENT.md`](file:///home/agentrogue/Engunity/docs/ai-agents/01_AI_DEEP_RESEARCH_AGENT.md)
> **Target Page:** [`frontend/src/app/(dashboard)/chat/page.tsx`](file:///home/agentrogue/Engunity/frontend/src/app/(dashboard)/chat/page.tsx)
> **Existing Research Page:** [`frontend/src/app/(dashboard)/research/page.tsx`](file:///home/agentrogue/Engunity/frontend/src/app/(dashboard)/research/page.tsx)

---

## 1. Architectural Comparison: Research Page vs Chat Page

The AI Deep Research Agent is already integrated into the **Research Page** via a standalone `DeepResearchPanel` component. The chat page requires a **fundamentally different approach** — one that treats deep research as a conversational flow rather than a separate panel.

### How the Research Page Does It

| Aspect | Research Page Approach |
|--------|----------------------|
| **Component** | Standalone `DeepResearchPanel` rendered in the Exploration phase |
| **Trigger** | Dedicated textarea + "Start Research" button |
| **Streaming** | Separate SSE stream via `startDeepResearch()` from `services/research.ts` |
| **Output** | Structured report card with sources, confidence, follow-ups |
| **Context** | No chat history, no session, no conversation memory |
| **Service** | `research.ts` → `POST /api/v1/research/deep-research/stream` |

### How the Chat Page Should Do It

| Aspect | Chat Page Approach (New) |
|--------|-------------------------|
| **Component** | Inline within the existing message stream |
| **Trigger** | `/research` slash command OR auto-detection of complex queries |
| **Streaming** | Dual-phase SSE: research progress events → then final answer streamed as chat |
| **Output** | Research findings rendered as rich assistant messages with expandable source cards |
| **Context** | Full chat session context, conversation memory, session persistence |
| **Service** | Extended `omniRagService` with `research_mode: true` flag OR new `/research` route on OmniRAG |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHAT PAGE (page.tsx)                          │
│                                                                     │
│  User Input ───▶ Slash Command Detection                           │
│                   │                                                 │
│         ┌─────────┴──────────┐                                     │
│         ▼                    ▼                                     │
│    Normal Chat           /research Command                         │
│    (existing flow)        │                                        │
│                           ▼                                        │
│                   Research Mode Activated                           │
│                           │                                        │
│         ┌─────────────────┼───────────────┐                        │
│         ▼                 ▼               ▼                        │
│    Show Research     Stream Progress   Depth Selection             │
│    Config Card       via SSE Events    (Quick/Standard/Deep)       │
│         │                 │                                        │
│         ▼                 ▼                                        │
│    Inline Progress   Source Discovery                              │
│    Bar + Events      Events in Chat                                │
│         │                 │                                        │
│         └────────┬────────┘                                        │
│                  ▼                                                 │
│         Research Report                                            │
│         as Assistant Message                                       │
│         (with expandable sections)                                 │
│                  │                                                 │
│                  ▼                                                 │
│         Follow-up Questions                                        │
│         as Clickable Chips                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent State Machine (Chat-Integrated)

```
[USER_INPUT] → [DETECT_INTENT]
                    │
          ┌─────────┼──────────┐
          │ Normal   │          │ Research
          ▼ Chat     │          ▼ Detected
     [STREAM_RAG]    │    [SHOW_RESEARCH_CARD]
          │          │          │
          ▼          │     ┌────▼─────┐
     [DONE]         │     │ DECOMPOSE │
                    │     └────┬─────┘
                    │          │
                    │     ┌────▼─────┐
                    │     │  SEARCH   │◄──── [REFINE] (loop)
                    │     └────┬─────┘          ▲
                    │          │                │
                    │     ┌────▼─────┐    ┌────┴─────┐
                    │     │ EVALUATE  │───▶│ GAPS?    │
                    │     └──────────┘    └────┬─────┘
                    │                         │ No gaps
                    │                    ┌────▼──────┐
                    │                    │ SYNTHESIZE │
                    │                    └────┬──────┘
                    │                         │
                    │                    ┌────▼──────┐
                    │                    │ RENDER AS  │
                    │                    │ CHAT MSG   │
                    └────────────────────┴───────────┘
```

---

## 3. Implementation Plan — Step by Step

### 3.1 New Slash Command: `/research`

**File:** [`frontend/src/app/(dashboard)/chat/page.tsx`](file:///home/agentrogue/Engunity/frontend/src/app/(dashboard)/chat/page.tsx)
**Location:** Inside `handleSend()` function, lines 221–238 (existing slash command block)

Add a new `/research` command alongside the existing `/clear`, `/explain`, `/summarize`, and `/code` commands.

```typescript
// Inside handleSend(), after the existing slash command checks:

} else if (command === '/research') {
  // Activate deep research mode
  const researchQuery = args.trim();
  if (!researchQuery) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '🔍 **Deep Research Mode**\n\nUsage: `/research <your question>`\n\nExamples:\n- `/research Compare microservices vs monolith architecture`\n- `/research Explain transformer attention mechanisms in depth`\n- `/research What are the latest trends in federated learning?`',
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }]);
    setInput('');
    return;
  }
  
  // Trigger research pipeline instead of normal chat
  await handleDeepResearch(researchQuery);
  setInput('');
  return;
}
```

### 3.2 Auto-Detection of Research-Worthy Queries

Add a simple heuristic function to detect when a user's question is complex enough to benefit from deep research mode, without requiring the `/research` prefix.

```typescript
// Add near the top of ChatPage component

const isResearchQuery = useCallback((text: string): boolean => {
  const researchPatterns = [
    /compare\s+.+\s+(vs|versus|with|and)\s+/i,
    /in[- ]depth\s+(analysis|review|study|comparison)/i,
    /comprehensive\s+(overview|guide|analysis)/i,
    /research\s+(paper|report|summary)/i,
    /what are the (latest|current|recent) (trends|developments|advances)/i,
    /multi[- ]step|multi[- ]hop/i,
    /literature review/i,
    /pros and cons of/i,
    /state of the art/i,
  ];
  
  return researchPatterns.some(pattern => pattern.test(text));
}, []);
```

When auto-detected, show a subtle suggestion chip above the input:

```typescript
// In the input area JSX, above the textarea:
{isResearchQuery(input) && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={styles.researchSuggestion}
  >
    <Search className="w-3.5 h-3.5" />
    <span>This looks like a research query.</span>
    <button onClick={() => handleDeepResearch(input)}>
      🔬 Deep Research
    </button>
  </motion.div>
)}
```

### 3.3 New State Variables

Add these state variables inside the `ChatPage` component (after the existing state declarations around lines 90–106):

```typescript
// Deep Research integration state
const [isResearchMode, setIsResearchMode] = useState(false);
const [researchProgress, setResearchProgress] = useState(0);
const [researchDepth, setResearchDepth] = useState<'quick' | 'standard' | 'deep' | 'exhaustive'>('standard');
const [researchEvents, setResearchEvents] = useState<ResearchStreamEvent[]>([]);
const [activeResearchId, setActiveResearchId] = useState<string | null>(null);
```

### 3.4 Import the Research Service

Add the import at the top of `page.tsx`:

```typescript
import { startDeepResearch, ResearchRequest, ResearchStreamEvent, ResearchReport } from '@/services/research';
```

### 3.5 Core Research Handler Function

This is the heart of the integration. Add this function inside the `ChatPage` component:

```typescript
const handleDeepResearch = async (query: string) => {
  if (!query.trim() || isLoading) return;
  
  setIsResearchMode(true);
  setIsLoading(true);
  setResearchProgress(0);
  setResearchEvents([]);
  
  const userMessageId = Date.now().toString();
  const assistantMessageId = (Date.now() + 1).toString();
  setActiveResearchId(assistantMessageId);
  
  // 1. Add user message
  const userMessage: Partial<Message> = {
    role: 'user',
    content: `🔍 **Deep Research:** ${query}`,
    id: userMessageId,
    timestamp: new Date().toISOString(),
    status: 'done'
  };
  setMessages(prev => [...prev, userMessage]);
  
  // 2. Add assistant placeholder with research mode flag
  const assistantPlaceholder: Partial<Message> & { isResearch?: boolean } = {
    role: 'assistant',
    content: '',
    id: assistantMessageId,
    timestamp: new Date().toISOString(),
    status: 'streaming',
    isResearch: true,
    // Research-specific metadata
    researchPhase: 'decomposing',
    researchProgress: 0,
    researchEvents: [],
    researchReport: null
  };
  setMessages(prev => [...prev, assistantPlaceholder]);
  
  // 3. Build research request
  const request: ResearchRequest = {
    query,
    depth: researchDepth,
    include_web_search: true,
    include_graph_search: true,
    output_format: 'detailed',
  };
  
  const token = localStorage.getItem('token') || '';
  
  // 4. Stream deep research
  await startDeepResearch(
    request,
    token,
    // onEvent callback
    (event: ResearchStreamEvent) => {
      setResearchProgress(event.progress_percent);
      setResearchEvents(prev => [...prev, event]);
      
      // Update the assistant message with research progress
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              researchPhase: event.data.phase || msg.researchPhase,
              researchProgress: event.progress_percent,
              researchEvents: [...(msg.researchEvents || []), event],
              // Build progressive content
              content: buildResearchProgressContent(event, msg.content || '')
            }
          : msg
      ));
    },
    // onComplete callback
    (report: ResearchReport) => {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: formatResearchReportForChat(report),
              status: 'done',
              isResearch: true,
              researchReport: report,
              researchPhase: 'completed',
              researchProgress: 100,
              confidence: report.overall_confidence,
              sources: report.sources,
              followUpQuestions: report.follow_up_questions,
              relatedTopics: report.related_topics
            }
          : msg
      ));
      setIsLoading(false);
      setIsResearchMode(false);
      setActiveResearchId(null);
    },
    // onError callback
    (error: string) => {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: `❌ **Research Failed**\n\n${error}\n\nTry again with a simpler query or switch to standard chat mode.`,
              status: 'error'
            }
          : msg
      ));
      setIsLoading(false);
      setIsResearchMode(false);
      setActiveResearchId(null);
    }
  );
};
```

### 3.6 Helper Functions for Content Formatting

```typescript
// Build progressive content during research streaming
const buildResearchProgressContent = (
  event: ResearchStreamEvent, 
  existingContent: string
): string => {
  switch (event.event_type) {
    case 'status':
      return `🔍 **${event.data.message || 'Researching...'}**`;
    case 'sub_query':
      const queries = event.data.sub_queries || [];
      return `🧠 **Decomposed into ${queries.length} research angles:**\n\n${
        queries.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')
      }`;
    case 'source_found':
      return existingContent + `\n\n📄 Found: **${event.data.source_name || 'New source'}** — _${
        (event.data.snippet || '').slice(0, 100)
      }..._`;
    default:
      return existingContent;
  }
};

// Format the final research report as a chat message
const formatResearchReportForChat = (report: ResearchReport): string => {
  const fullReport = report.detailed_findings?.[0]?.full_report || report.summary;
  
  let content = `## 📋 Deep Research Report\n\n`;
  content += `> **Confidence:** ${(report.overall_confidence * 100).toFixed(0)}% · `;
  content += `**Sources:** ${report.sources.length} · `;
  content += `**Duration:** ${report.duration_seconds?.toFixed(1)}s\n\n`;
  content += `---\n\n`;
  content += fullReport;
  
  if (report.key_insights && report.key_insights.length > 0) {
    content += `\n\n### 💡 Key Insights\n\n`;
    content += report.key_insights.map(i => `- ${i}`).join('\n');
  }
  
  return content;
};
```

---

## 4. Frontend UI Components — Chat-Native Research UX

### 4.1 Inline Research Progress Card

Instead of a separate panel (like the research page), render research progress directly inside the chat message bubble. This needs a custom renderer inside the message rendering logic.

**Location:** Inside the assistant message rendering block (around lines 880–1095 in `page.tsx`).

**Add after the existing metadata badges block (line 983) and before the markdown content:**

```tsx
{/* Deep Research Progress (inline in chat) */}
{msg.isResearch && msg.status === 'streaming' && (
  <div className={styles.researchInlineCard}>
    <div className={styles.researchInlineHeader}>
      <Search className="w-4 h-4 text-blue-500" />
      <span className="font-bold text-sm text-slate-700">Deep Research in Progress</span>
      <span className={styles.researchPhaseBadge}>
        {msg.researchPhase || 'initializing'}
      </span>
    </div>
    
    {/* Progress Bar */}
    <div className={styles.researchProgressBar}>
      <div 
        className={styles.researchProgressFill}
        style={{ width: `${msg.researchProgress || 0}%` }}
      />
    </div>
    <p className="text-xs text-slate-500 mt-1">
      {(msg.researchProgress || 0).toFixed(0)}% complete
    </p>
    
    {/* Live Event Log */}
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer text-slate-400 hover:text-slate-600 font-semibold">
        Research Log ({(msg.researchEvents || []).length} events)
      </summary>
      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
        {(msg.researchEvents || []).map((evt: ResearchStreamEvent, i: number) => (
          <div key={i} className="flex items-center gap-2 text-slate-500">
            <span className="text-blue-400 font-mono text-[10px]">
              {evt.event_type}
            </span>
            <span>{evt.data.message || ''}</span>
          </div>
        ))}
      </div>
    </details>
  </div>
)}
```

### 4.2 Research Report Source Cards (Post-Completion)

After the research report is rendered as markdown, show interactive source cards and follow-up questions. Add this after the `ReactMarkdown` block:

```tsx
{/* Research Sources (after completion) */}
{msg.isResearch && msg.status === 'done' && msg.sources && msg.sources.length > 0 && (
  <div className={styles.researchSourcesSection}>
    <details>
      <summary className="cursor-pointer font-bold text-sm text-slate-700 flex items-center gap-2 py-2">
        📚 Sources ({msg.sources.length})
      </summary>
      <div className="grid grid-cols-1 gap-2 mt-2">
        {msg.sources.map((source: any, i: number) => (
          <div 
            key={i} 
            className={styles.researchSourceCard}
            onClick={() => source.url && window.open(source.url, '_blank')}
          >
            <div className="flex items-center justify-between">
              <strong className="text-sm text-slate-800">{source.source_name}</strong>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                source.relevance_score > 0.8 
                  ? 'bg-green-100 text-green-700' 
                  : source.relevance_score > 0.5 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-red-100 text-red-700'
              }`}>
                {(source.relevance_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {source.content_snippet}
            </p>
            {source.url && (
              <p className="text-xs text-blue-500 mt-1 truncate">{source.url}</p>
            )}
          </div>
        ))}
      </div>
    </details>
  </div>
)}

{/* Follow-up Research Questions */}
{msg.isResearch && msg.status === 'done' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
  <div className={styles.researchFollowUps}>
    <p className="text-xs font-bold text-slate-500 mb-2">🔮 Continue Researching</p>
    <div className="flex flex-wrap gap-2">
      {msg.followUpQuestions.map((q: string, i: number) => (
        <button
          key={i}
          onClick={() => handleDeepResearch(q)}
          className={styles.researchFollowUpBtn}
        >
          {q}
        </button>
      ))}
    </div>
  </div>
)}
```

### 4.3 Research Depth Selector in Chat Input Area

Add a research depth dropdown to the input area that appears when the user starts typing `/research` or when research mode is active.

**Location:** Inside the `inputActions` div (around line 1245), add alongside the existing strategy selector:

```tsx
{/* Research Depth Selector (visible when /research is being typed) */}
{(input.startsWith('/research') || isResearchMode) && (
  <select
    value={researchDepth}
    onChange={(e) => setResearchDepth(e.target.value as any)}
    className={styles.researchDepthSelect}
    title="Research Depth"
  >
    <option value="quick">⚡ Quick</option>
    <option value="standard">📖 Standard</option>
    <option value="deep">🔬 Deep</option>
    <option value="exhaustive">🧠 Exhaustive</option>
  </select>
)}
```

---

## 5. CSS Styles to Add

**File:** [`frontend/src/app/(dashboard)/chat/chat.module.css`](file:///home/agentrogue/Engunity/frontend/src/app/(dashboard)/chat/chat.module.css)

```css
/* ===== Deep Research Integration ===== */

.researchInlineCard {
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.researchInlineHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.researchPhaseBadge {
  margin-left: auto;
  padding: 2px 8px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.researchProgressBar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.researchProgressFill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 9999px;
  transition: width 0.5s ease-out;
}

.researchSourcesSection {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.researchSourceCard {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.researchSourceCard:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.researchFollowUps {
  margin-top: 12px;
  padding: 12px;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 8px;
}

.researchFollowUpBtn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}

.researchFollowUpBtn:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #2563eb;
}

.researchDepthSelect {
  appearance: none;
  padding: 4px 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  cursor: pointer;
}

.researchSuggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #0369a1;
}

.researchSuggestion button {
  margin-left: auto;
  padding: 4px 10px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.researchSuggestion button:hover {
  background: #1d4ed8;
}
```

---

## 6. Backend: Extending the API for Chat-Integrated Research

The existing `/api/v1/research/deep-research/stream` endpoint works perfectly. However, for a tighter chat integration, you may want to create a **unified endpoint** that the `omniRagService` can call, which internally decides whether to route to the standard RAG pipeline or the deep research agent.

### Option A: Use Existing Research Endpoint (Recommended for Phase 1)

Use `startDeepResearch()` from `services/research.ts` directly. No backend changes needed.

**Pros:** Zero backend work, immediate integration
**Cons:** Two separate API calls (one for session metadata, one for research), doesn't persist research results in chat session history automatically

### Option B: Extend OmniRAG with Research Mode (Recommended for Phase 2)

**File:** `backend/app/api/v1/omni_rag.py`

Add a `research_mode` flag to the existing OmniRAG stream endpoint:

```python
# In the stream handler, add research_mode detection
@router.post("/stream")
async def stream_query(request: OmniRAGStreamRequest, ...):
    if request.research_mode:
        # Delegate to DeepResearchAgent
        agent = get_research_agent(omni_rag)
        research_request = ResearchRequest(
            query=request.query,
            depth=request.research_depth or "standard",
            include_web_search=True,
            include_graph_search=True
        )
        
        async def research_event_stream():
            async for event in agent.stream_research(
                research_request, user_id=str(current_user.id),
                session_id=request.session_id
            ):
                # Convert research events to chat-compatible SSE format
                if event.event_type == "status":
                    yield f'data: {{"type": "metadata", "research_phase": "{event.data.get("phase")}", "research_progress": {event.progress_percent}}}\n\n'
                elif event.event_type == "complete":
                    report = event.data["report"]
                    yield f'data: {{"type": "content", "content": "{format_report(report)}"}}\n\n'
                    yield f'data: {{"type": "done", "research_report": {json.dumps(report)}}}\n\n'
                else:
                    yield f'data: {json.dumps(event.model_dump())}\n\n'
        
        return StreamingResponse(research_event_stream(), media_type="text/event-stream")
    
    # ... existing normal chat flow ...
```

**Frontend side** — update `OmniRAGRequest` interface:

```typescript
// In services/omniRag.ts
export interface OmniRAGRequest {
  query: string;
  session_id?: string;
  strategy?: 'direct_generation' | 'vector_rag' | 'graph_rag' | 'recursive_intensive';
  include_metadata?: boolean;
  image_urls?: string[];
  image_ids?: string[];
  // New fields for research mode
  research_mode?: boolean;
  research_depth?: 'quick' | 'standard' | 'deep' | 'exhaustive';
}
```

---

## 7. Extended `Message` Type

The existing `Message` type in `services/chat.ts` needs to be extended. Add research-specific fields:

```typescript
// Extend the Message interface or create a ChatResearchMessage type
export interface Message {
  // ... existing fields ...
  
  // Deep Research extensions
  isResearch?: boolean;
  researchPhase?: string;
  researchProgress?: number;
  researchEvents?: ResearchStreamEvent[];
  researchReport?: ResearchReport | null;
  followUpQuestions?: string[];
  relatedTopics?: string[];
  sources?: SourceEvaluation[];
}
```

---

## 8. Session Persistence for Research

Research reports should be persisted in the chat session so they load correctly when switching sessions.

### MongoDB: Extend the message schema

```javascript
// In the messages sub-document within chat sessions:
{
  role: "assistant",
  content: "## Research Report...",
  is_research: true,
  research_report: {
    query: "...",
    overall_confidence: 0.87,
    sources: [...],
    follow_up_questions: [...],
    related_topics: [...],
    duration_seconds: 12.4
  },
  timestamp: ISODate("...")
}
```

### Backend: Save research metadata alongside message

When the `/stream` endpoint completes a research request within a session, the research report metadata should be saved as part of the message document:

```python
# In the session message save logic
message_data = {
    "role": "assistant",
    "content": report_text,
    "is_research": True,
    "research_report": report.model_dump(),
    "timestamp": datetime.utcnow()
}
await db.chat_sessions.update_one(
    {"_id": session_id},
    {"$push": {"messages": message_data}}
)
```

---

## 9. Complete File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `frontend/src/app/(dashboard)/chat/page.tsx` | Add `/research` slash command, `handleDeepResearch()`, research state variables, inline research UI, imports |
| **MODIFY** | `frontend/src/app/(dashboard)/chat/chat.module.css` | Add research-specific CSS classes |
| **MODIFY** | `frontend/src/services/chat.ts` | Extend `Message` interface with research fields |
| **MODIFY** | `frontend/src/services/omniRag.ts` (Phase 2) | Add `research_mode` and `research_depth` to `OmniRAGRequest` |
| **MODIFY** | `backend/app/api/v1/omni_rag.py` (Phase 2) | Add research mode routing in stream endpoint |
| _No new files needed_ | — | The integration reuses `services/research.ts` and `DeepResearchAgent` |

---

## 10. Testing Plan

### Manual Testing

```bash
# 1. Start the dev server
cd frontend && npm run dev

# 2. Open the chat page at /chat

# 3. Test slash command help
/research 
# → Should show usage instructions

# 4. Test quick research
/research What are microservices?
# → Should show inline progress card → decomposition → sources → final report

# 5. Test deep research
# Change depth to "Deep" via dropdown
/research Compare React, Vue, and Angular for enterprise applications
# → Should show multi-iteration research with source cards

# 6. Test follow-up
# Click a follow-up question button in the research results
# → Should trigger new deep research

# 7. Test session persistence
# Switch to another session and back
# → Research report should reload correctly with source cards

# 8. Test error handling
# Disconnect backend, trigger /research
# → Should show error message in chat
```

### Unit Tests

```typescript
// __tests__/chat-research.test.tsx

describe('Deep Research Chat Integration', () => {
  it('should detect /research slash command', () => {
    // Test command parsing
  });
  
  it('should show inline progress for research', () => {
    // Mock SSE events, verify progress card renders
  });
  
  it('should render research report with sources', () => {
    // Mock complete report, verify source cards render
  });
  
  it('should allow follow-up research from chip buttons', () => {
    // Click follow-up, verify new research starts
  });
  
  it('should show research depth selector when /research typed', () => {
    // Type /research, verify depth dropdown appears
  });
});
```

### Backend API Tests

```bash
# Test the research endpoint directly
curl -X POST http://localhost:8000/api/v1/research/deep-research/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare SQL and NoSQL databases", "depth": "quick"}'
```

---

## 11. Key Differences from Research Page Integration

| Feature | Research Page | Chat Page |
|---------|-------------|-----------|
| **Trigger** | Dedicated button | `/research` command + auto-detection |
| **UI Pattern** | Full standalone panel | Inline message bubble |
| **Progress** | External progress bar | Progress card inside chat stream |
| **Report** | Separate report view | Chat message with expandable sections |
| **Follow-ups** | Reset query field | Start new research in same chat |
| **Session** | No session persistence | Full session persistence |
| **Context** | Isolated query | Chat history + memory context |
| **Sources** | List in report panel | Collapsible cards in message |
| **Depth** | Always visible dropdown | Context-sensitive dropdown |

---

## 12. Implementation Phases

### Phase 1 — Immediate (1 day)
- [x] Add `/research` slash command to `handleSend()`
- [x] Import and use `startDeepResearch()` from existing service
- [x] Add inline progress card rendering
- [x] Add research report rendering with source cards
- [x] Add follow-up question buttons
- [x] Add CSS styles to `chat.module.css`

### Phase 2 — Enhanced (1-2 days)
- [ ] Extend `OmniRAGRequest` with `research_mode` flag
- [ ] Add backend research routing in OmniRAG stream
- [ ] Add research depth selector in input area
- [ ] Add auto-detection of research queries with suggestion chip
- [ ] Persist research reports in chat session
- [ ] Rebuild research messages properly on session switch

### Phase 3 — Polish (1 day)
- [ ] Add animations for research card transitions
- [ ] Add cancel/abort research button
- [ ] Add "Export as PDF" for research reports
- [ ] Add research history in sidebar
- [ ] Add keyboard shortcut (e.g., `Ctrl+Shift+R`) to toggle research mode
