# E2E Test Plan: Code Dashboard

**Feature:** Code Dashboard & IDE
**Location:** `frontend/src/app/(dashboard)/code`
**Backend:** `backend/app/api/v1/*`

## Overview
This test plan covers the end-to-end verification of the Code Dashboard, focusing on critical developer workflows: code execution, AI assistance, terminal integration, git operations, and debugging.

---

## 1. Code Execution Flow

**Objective:** Verify that users can execute code and view output (stdout/stderr) correctly.

### Components
- **UI:** Run Button (`Play` icon) in Header
- **API:** `POST /api/v1/code/execute-direct`
- **Backend:** `CodeSandbox` service

### Test Case 1.1: Successful Execution (Python)
- **Pre-conditions:**
  - Backend is running.
  - User has opened a Python file (e.g., `hello.py`).
  - File content: `print("Hello World")`.
- **Test Steps:**
  1. Click the "Run" button in the top toolbar.
  2. Observe the notification toast.
  3. Observe the bottom "Terminal" panel.
- **Expected Results:**
  - Notification "Running hello.py..." appears.
  - Terminal panel opens/focuses.
  - Terminal displays:
    - `[Running hello.py]`
    - `[Language: python]`
    - `[Output]`
    - `Hello World`
    - `✓ Execution completed successfully`
  - Notification "Code executed successfully" appears.

### Test Case 1.2: Execution with Stdin Input
- **Pre-conditions:**
  - File content uses input: `name = input("Name: "); print(f"Hello {name}")`.
- **Test Steps:**
  1. Click "Run".
  2. "Provide Input" modal appears.
  3. Enter "Alice" in the textarea.
  4. Click "Run with Input".
- **Expected Results:**
  - Modal closes.
  - Terminal displays output containing `Hello Alice`.
  - Input provided is listed in execution details.

### Test Case 1.3: Execution Error (Syntax)
- **Pre-conditions:**
  - File content has syntax error: `print("Missing paren"`.
- **Test Steps:**
  1. Click "Run".
- **Expected Results:**
  - Terminal displays `[Error]`.
  - Python SyntaxError trace is shown in red.
  - Footer shows `✗ Execution failed`.
  - Error notification appears.

### Edge Cases
- **Network Failure:** Backend down. Expect "Failed to execute code" notification and error in terminal.
- **Timeout:** Infinite loop code `while True: pass`. Expect backend to kill process after 30s (default timeout) and return timeout error.

---

## 2. AI Assistance Flow

**Objective:** Verify AI code analysis, refactoring, and chat capabilities.

### Components
- **UI:** AI Refine Panel (`Sparkles` icon)
- **API:** `POST /api/v1/code/ai-assist`, `POST /api/v1/code/ai-chat`
- **Backend:** `GroqClient` (Llama 3.3)

### Test Case 2.1: Optimize Code
- **Pre-conditions:**
  - Active file selected with unoptimized code (e.g., O(n^2) sort).
  - AI Refine Panel is open.
- **Test Steps:**
  1. Click "Optimize performance" in Quick Actions.
  2. Wait for "AI is thinking..." indicator.
- **Expected Results:**
  - Chat adds user message "Optimize this code".
  - Assistant responds with structured analysis (Performance Analysis, Optimization Strategy, Optimized Code).
  - Assistant asks "Would you like me to apply these changes?".

### Test Case 2.2: Apply AI Suggestions
- **Pre-conditions:**
  - AI has just generated optimized code (from TC 2.1).
- **Test Steps:**
  1. Type "apply" in the chat input.
  2. Press Enter.
- **Expected Results:**
  - Editor content updates with the optimized code.
  - Assistant confirms "✅ Applied the suggested code changes".
  - Notification "Code changes applied" appears.

### Edge Cases
- **Empty File:** Clicking actions with no file open. Expect "Please open a file first" message.
- **API Failure:** Groq API unavailable. Expect "AI service unavailable" error message in chat.

---

## 3. Terminal Flow

**Objective:** Verify real-time WebSocket terminal communication.

### Components
- **UI:** Terminal Component (`BottomPanel`)
- **API:** `WS /ws/terminal/{project_id}`
- **Backend:** `TerminalSession` (PTY/asyncio)

### Test Case 3.1: Shell Interaction
- **Pre-conditions:**
  - Project ID `default-project`.
  - Backend running.
- **Test Steps:**
  1. Open "Terminal" tab in bottom panel.
  2. Type `echo "test terminal"` and press Enter.
  3. Type `pwd` and press Enter.
- **Expected Results:**
  - Terminal displays echoed text `test terminal`.
  - `pwd` command returns current working directory of backend process.
  - UI handles ANSI color codes correctly if present.

### Edge Cases
- **Connection Loss:** Kill backend while terminal open. Expect "WebSocket disconnected" or reconnection attempt.
- **Resize:** Resize browser window. Verify `__resize__` message sent to backend (if implemented) or layout adjusts without breaking.

---

## 4. Git Operations Flow

**Objective:** Verify source control operations (Status, Stage, Commit).

### Components
- **UI:** Git Sidebar (`GitSidebar.tsx`)
- **API:** `/api/v1/git/*`
- **Backend:** `GitRepository` service

### Test Case 4.1: View Status & Stage Files
- **Pre-conditions:**
  - Git repository initialized.
  - One file modified (`M`), one new file (`U`).
- **Test Steps:**
  1. Open "Source Control" sidebar.
  2. Click "Refresh" icon.
  3. Click "+" icon next to the modified file.
- **Expected Results:**
  - "Changes" list shows 2 files.
  - After clicking "+", modified file moves to "Staged Changes" section.
  - "Commit Staged" button becomes enabled.

### Test Case 4.2: Commit Changes
- **Pre-conditions:**
  - Files are staged (from TC 4.1).
- **Test Steps:**
  1. Enter message "Update feature" in text area.
  2. Click "Commit Staged".
- **Expected Results:**
  - "Staged Changes" list clears.
  - "History" section updates with new commit at top.
  - Commit author and hash are displayed.

### Edge Cases
- **No Repo:** Project not initialized. Expect "Initialize Repository" button.
- **Empty Commit:** Trying to commit without message or staged files. Button should be disabled.

---

## 5. Debugging Flow

**Objective:** Verify debug session control (Start, Step, Stop).

### Components
- **UI:** Debug Toolbar & Sidebar
- **API:** `/api/v1/debug/*`
- **Backend:** `DebugAdapter`

### Test Case 5.1: Start Debug Session
- **Pre-conditions:**
  - Python file open.
- **Test Steps:**
  1. Click "Debug" icon in sidebar to open Debug view.
  2. Click "Play" (Start Debugging) button in Debug Toolbar.
- **Expected Results:**
  - Toolbar changes to show Pause/Step/Stop controls.
  - Debug console/sidebar shows session active.
  - Variables panel populates (if implementation supports immediate variable fetch).

### Test Case 5.2: Step Over
- **Pre-conditions:**
  - Debug session running.
- **Test Steps:**
  1. Click "Step Over" (Arrow icon).
- **Expected Results:**
  - Execution advances one line.
  - Variables panel updates with new state.

### Edge Cases
- **Invalid Config:** Starting debug on empty file. Expect error toast.
- **Session Zombie:** Closing browser tab while debugging. Backend should cleanup session (timeout/disconnect).
