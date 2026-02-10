# Code Lab Enhancement - Implementation Quick Start

> **Start implementing improvements TODAY!** This guide shows you exactly what to do.

---

## 🚀 Start Here: 5-Minute Quick Wins

These improvements can be implemented in **5 minutes each** with minimal risk:

### 1. Enable Multi-cursor Editing ⚡

**File**: `frontend/src/components/code-lab/CodeEditor.tsx`

**Change**:
```typescript
// Find the options prop in <Editor> component
options={{
  // ... existing options
  multiCursorModifier: 'ctrlCmd',  // ADD THIS
  multiCursorMergeOverlapping: true // ADD THIS
}}
```

**Result**: 
- `Cmd+D` to select next occurrence
- `Cmd+Shift+L` to select all occurrences
- `Cmd+Click` to add cursor at position

---

### 2. Enable Code Folding ⚡

**File**: `frontend/src/components/code-lab/CodeEditor.tsx`

**Change**:
```typescript
options={{
  // ... existing options
  folding: true,                    // ADD THIS
  foldingStrategy: 'indentation',   // ADD THIS
  showFoldingControls: 'always'     // ADD THIS
}}
```

**Result**: Collapsible code sections with arrows in gutter

---

### 3. Enable Minimap ⚡

**File**: `frontend/src/components/code-lab/CodeEditor.tsx`

**Change**:
```typescript
options={{
  minimap: {
    enabled: true,              // CHANGE from false
    maxColumn: 120,
    renderCharacters: true,
    showSlider: 'mouseover'
  }
}}
```

**Result**: Code overview map on right side of editor

---

### 4. Enable Find & Replace ⚡

**File**: `frontend/src/components/code-lab/CodeEditor.tsx`

**Change**:
```typescript
options={{
  // ... existing options
  find: {
    autoFindInSelection: 'always',
    seedSearchStringFromSelection: 'always'
  }
}}
```

**Result**: 
- `Cmd+F` opens find widget
- `Cmd+H` opens find & replace
- Already built into Monaco!

---

## 🎯 Week 1 Implementation: Real-time Terminal

**Effort**: 3-5 days  
**Impact**: HIGH  
**Files to modify**: 3 backend, 2 frontend

### Backend Changes

#### 1. Install dependencies
```bash
cd backend
pip install python-socketio aiofiles
```

#### 2. Create WebSocket handler
**File**: `backend/app/api/v1/terminal_ws.py` (NEW FILE)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import pty
import os

router = APIRouter()

@router.websocket("/ws/terminal/{project_id}")
async def terminal_endpoint(websocket: WebSocket, project_id: str):
    await websocket.accept()
    
    # Create pseudo-terminal
    master, slave = pty.openpty()
    
    # Start shell
    process = await asyncio.create_subprocess_exec(
        '/bin/bash',
        stdin=slave,
        stdout=slave,
        stderr=slave
    )
    
    async def read_output():
        while True:
            data = os.read(master, 4096)
            if data:
                await websocket.send_bytes(data)
    
    async def read_input():
        try:
            while True:
                message = await websocket.receive()
                if 'bytes' in message:
                    os.write(master, message['bytes'])
                elif 'text' in message:
                    os.write(master, message['text'].encode())
        except WebSocketDisconnect:
            pass
    
    await asyncio.gather(read_output(), read_input())
    
    # Cleanup
    process.terminate()
    os.close(master)
    os.close(slave)
```

#### 3. Register WebSocket route
**File**: `backend/app/main.py`

```python
# Add import
from app.api.v1 import terminal_ws

# Add route
app.include_router(terminal_ws.router, prefix="/api/v1/terminal", tags=["terminal"])
```

### Frontend Changes

#### 4. Create WebSocket service
**File**: `frontend/src/services/terminal-ws.ts` (NEW FILE)

```typescript
export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private term: any;
  
  constructor(terminal: any) {
    this.term = terminal;
  }
  
  connect(projectId: string) {
    const wsUrl = `ws://localhost:8000/api/v1/terminal/ws/terminal/${projectId}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onmessage = (event) => {
      this.term.write(event.data);
    };
    
    this.term.onData((data: string) => {
      this.ws?.send(data);
    });
  }
  
  disconnect() {
    this.ws?.close();
  }
}
```

#### 5. Update Terminal component
**File**: `frontend/src/components/code-lab/Terminal.tsx`

```typescript
import { TerminalWebSocket } from '@/services/terminal-ws';

export const Terminal = () => {
  const wsRef = useRef<TerminalWebSocket | null>(null);
  
  useEffect(() => {
    if (!terminalRef.current) return;
    
    const term = new XTerm({...});
    term.open(terminalRef.current);
    
    // Connect WebSocket for real-time execution
    wsRef.current = new TerminalWebSocket(term);
    wsRef.current.connect('default-project'); // Use actual project ID
    
    return () => {
      wsRef.current?.disconnect();
      term.dispose();
    };
  }, []);
  
  return <div ref={terminalRef} className="h-full" />;
};
```

### Testing

```bash
# Start backend
cd backend && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Open Code Lab
# Type commands in terminal
# Should see real-time output!
```

---

## 📅 Week 2 Implementation: Multi-Terminal Support

**Effort**: 2-3 days  
**Impact**: MEDIUM

### Changes Required

#### 1. Update Zustand store
**File**: `frontend/src/stores/codeStore.ts`

```typescript
interface CodeState {
  // Add terminal state
  terminals: Terminal[];
  activeTerminalId: string | null;
  
  // Add actions
  addTerminal: () => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
}

// Implementation
addTerminal: () => {
  const newTerminal = {
    id: crypto.randomUUID(),
    name: `Terminal ${get().terminals.length + 1}`,
    type: 'bash'
  };
  set(state => ({
    terminals: [...state.terminals, newTerminal],
    activeTerminalId: newTerminal.id
  }));
},
```

#### 2. Update BottomPanel component
**File**: `frontend/src/components/code-lab/BottomPanel.tsx`

```typescript
export const BottomPanel = () => {
  const { terminals, activeTerminalId, addTerminal, removeTerminal } = useCodeStore();
  
  return (
    <div className="h-64 flex flex-col">
      {/* Terminal tabs */}
      <div className="flex border-b">
        {terminals.map(term => (
          <button
            key={term.id}
            className={activeTerminalId === term.id ? 'active' : ''}
            onClick={() => setActiveTerminal(term.id)}
          >
            {term.name}
            <X onClick={() => removeTerminal(term.id)} />
          </button>
        ))}
        <button onClick={addTerminal}>+</button>
      </div>
      
      {/* Terminal content */}
      <div className="flex-1">
        {terminals.map(term => (
          <div
            key={term.id}
            className={activeTerminalId === term.id ? 'block' : 'hidden'}
          >
            <Terminal terminalId={term.id} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔧 Complete Implementation Checklist

### Phase 1: Foundation (Weeks 1-4)

- [ ] **Week 1**: Real-time terminal execution
  - [ ] Backend WebSocket handler
  - [ ] Frontend WebSocket service
  - [ ] Terminal component update
  - [ ] Testing

- [ ] **Week 2**: Multi-terminal support
  - [ ] Store updates
  - [ ] UI components (tabs)
  - [ ] Terminal instance management
  - [ ] Testing

- [ ] **Week 3**: Enhanced editor features
  - [ ] Enable multi-cursor
  - [ ] Enable code folding
  - [ ] Enable minimap
  - [ ] Configure find & replace
  - [ ] Testing

- [ ] **Week 4**: Terminal splitting
  - [ ] Split view UI
  - [ ] Layout management
  - [ ] Resize handles
  - [ ] Testing

### Phase 2: Critical Features (Months 2-3)

- [ ] **Weeks 5-6**: Basic debugger
  - [ ] Breakpoint UI
  - [ ] Debug adapter setup
  - [ ] Python debugger integration
  - [ ] Testing

- [ ] **Weeks 7-8**: Git integration
  - [ ] Git status API
  - [ ] Commit UI
  - [ ] Diff viewer
  - [ ] Testing

- [ ] **Weeks 9-10**: AI inline completions
  - [ ] Completion provider
  - [ ] Backend AI endpoint
  - [ ] Debouncing & optimization
  - [ ] Testing

- [ ] **Weeks 11-12**: Extended languages
  - [ ] C++ execution
  - [ ] Java execution
  - [ ] Go execution
  - [ ] Testing

---

## 📊 Progress Tracking

Use this table to track your progress:

| Feature | Status | Started | Completed | Notes |
|---------|--------|---------|-----------|-------|
| Multi-cursor | 🔵 Todo | - | - | Easy win |
| Code folding | 🔵 Todo | - | - | Easy win |
| Minimap | 🔵 Todo | - | - | Easy win |
| Find & Replace | 🔵 Todo | - | - | Easy win |
| Real-time Terminal | 🔵 Todo | - | - | Week 1 |
| Multi-terminal | 🔵 Todo | - | - | Week 2 |
| Debugger | 🔵 Todo | - | - | Weeks 5-6 |
| Git Integration | 🔵 Todo | - | - | Weeks 7-8 |
| AI Completions | 🔵 Todo | - | - | Weeks 9-10 |

**Legend**: 🔵 Todo | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## 🆘 Troubleshooting

### Terminal WebSocket not connecting

**Problem**: WebSocket connection fails

**Solution**:
```python
# Check CORS settings in backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Monaco features not working

**Problem**: Multi-cursor or code folding not working

**Solution**:
1. Check Monaco version: `npm list monaco-editor`
2. Ensure options are in correct location
3. Clear browser cache
4. Check browser console for errors

### Terminal not displaying output

**Problem**: Commands run but no output shown

**Solution**:
```typescript
// Ensure terminal is properly initialized
const term = new XTerm({
  convertEol: true,  // ADD THIS
  cursorBlink: true,
  ...
});
```

---

## 📚 Additional Resources

- **Main Document**: `CODE_LAB_COMPREHENSIVE_ENHANCEMENT_GUIDE.md` (3264 lines)
- **Quick Guide**: `README_ENHANCEMENT_GUIDE.md`
- **Architecture**: `CODE_LAB_COMPLETE_ARCHITECTURE.md`
- **Monaco Docs**: https://microsoft.github.io/monaco-editor/
- **XTerm Docs**: https://xtermjs.org/
- **FastAPI WebSocket**: https://fastapi.tiangolo.com/advanced/websockets/

---

**Ready to start?** Pick a quick win and implement it now! 🚀

**Questions?** Review the comprehensive guide or ask the team.

**Last Updated**: February 2026
