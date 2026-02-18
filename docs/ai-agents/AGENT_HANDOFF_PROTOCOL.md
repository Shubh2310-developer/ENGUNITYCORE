# Agent Handoff Protocol & State Management

This document defines the rules of engagement, message schemas, and shared state management for the `CodeDashboardSquad` AI team.

## 1. Communication Protocol

Agents communicate via structured JSON messages. This ensures clarity, traceability, and ease of parsing for the orchestration layer.

### Message Schema

Every communication between agents must adhere to the following JSON schema:

```json
{
  "message_id": "uuid-v4-string",
  "timestamp": "ISO-8601-timestamp",
  "from": "agent-id (e.g., agent-lead)",
  "to": "agent-id (e.g., agent-coder)",
  "type": "COMMAND | RESPONSE | UPDATE | ERROR",
  "action": "specific_action_name (e.g., implement_function, review_screenshot)",
  "payload": {
    // Dynamic content based on action
    "instructions": "...",
    "code_snippet": "...",
    "file_paths": ["..."],
    "constraints": "..."
  },
  "context": {
    // Relevant context references
    "ticket_id": "T-123",
    "priority": "high"
  }
}
```

### Message Types

*   **COMMAND**: Direct instruction to perform a task. Expects a `RESPONSE`.
*   **RESPONSE**: The result of a command. Contains `status` (success/failure) and `data`.
*   **UPDATE**: Asynchronous status update (e.g., "Tests running...").
*   **ERROR**: Critical failure requiring intervention.

---

## 2. Shared Session State

To maintain continuity and context across the team, a `SessionState` object is maintained globally for the lifecycle of the user request. All agents have read access; write access is managed via state-update actions.

### State Structure

```json
{
  "session_id": "sess-unique-id",
  "user_goal": "The original high-level request from the user",
  "status": "PLANNING | IMPLEMENTING | REVIEWING | COMPLETED | FAILED",

  "plan": {
    "current_step_index": 0,
    "steps": [
      {
        "id": 1,
        "description": "Analyze requirements",
        "assigned_to": "agent-lead",
        "status": "completed"
      },
      {
        "id": 2,
        "description": "Scaffold UI components",
        "assigned_to": "agent-coder",
        "status": "pending"
      }
    ]
  },

  "environment": {
    "open_files": [
      "/path/to/file1.ts",
      "/path/to/file2.css"
    ],
    "terminal_history": [
      {
        "command": "npm run test",
        "output_summary": "3 failed tests",
        "timestamp": "..."
      }
    ],
    "active_branch": "feature/dashboard-v2"
  },

  "artifacts": {
    "screenshots": ["/path/to/screen1.png"],
    "diffs": ["/path/to/patch.diff"]
  },

  "memory_scratchpad": "Shared notes area for agents to leave hints or warnings for others (e.g., 'Don't touch the auth middleware, it's fragile')."
}
```

## 3. Workflow & Rules of Engagement

### Phase 1: Planning (Team Lead)
1.  **Lead** receives user request.
2.  **Lead** initializes `SessionState` with `user_goal`.
3.  **Lead** populates the `plan` in `SessionState`.
4.  **Lead** sends a **COMMAND** to the first agent (usually `Code Implementer`).

### Phase 2: Execution (Code Implementer)
1.  **Coder** receives **COMMAND**.
2.  **Coder** reads `SessionState` to understand context (open files, branch).
3.  **Coder** performs actions (edit files, run terminal).
4.  **Coder** updates `environment` in `SessionState` (e.g., adds modified files to `open_files`).
5.  **Coder** sends **RESPONSE** back to **Lead** upon completion.

### Phase 3: Review (UI/UX Reviewer)
1.  **Lead** determines if visual review is needed.
2.  **Lead** sends **COMMAND** to **UI/UX Reviewer** with path to screenshot or URL.
3.  **Reviewer** analyzes visual output.
4.  **Reviewer** sends **RESPONSE** with feedback (PASS/FAIL + notes).

### Handoff Rules
1.  **Atomic Handoffs**: Agents must complete their atomic task before handing control back to the Lead.
2.  **State Consistency**: Before handing off, an agent must ensure the `SessionState` accurately reflects the system's reality (e.g., if a file was deleted, remove it from `open_files`).
3.  **Error Escalation**: If `Code Implementer` cannot fix a bug after 3 attempts, it must send an **ERROR** to `Team Lead` to request strategy adjustment.
