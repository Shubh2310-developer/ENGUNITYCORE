# Code Page Architecture

This document maps all files connected from the frontend to the backend for the Code Page (`/code`).

## Frontend Structure

### Page Entry Point
- **`frontend/src/app/(dashboard)/code/page.tsx`**
  - **Description**: The main entry point for the Code Lab IDE. It initializes the layout, handles global keyboard shortcuts, and orchestrates the primary UI panels (File Explorer, Editor, Terminal, AI Refine).

### State Management & API Logic
- **`frontend/src/stores/codeStore.ts`**
  - **Description**: A Zustand store that acts as the central brain for the IDE. It manages the file system state, active files, terminal sessions, debug sessions, and git status. It also contains the API client logic for communicating with the backend endpoints.

### UI Components (`frontend/src/components/code-lab/`)
These components are directly used by `page.tsx` or `codeStore.ts`.

- **`FileExplorer.tsx`**: Displays the project file tree and handles file operations (create, delete, rename).
- **`CodeEditor.tsx`**: The main code editing surface (likely using Monaco Editor or similar).
- **`Terminal.tsx` / `TerminalInstance.tsx`**: Renders the xterm.js terminal interface and handles WebSocket connections for shell execution.
- **`DebugSidebar.tsx`**: UI for managing breakpoints, variables, and call stacks.
- **`DebugToolbar.tsx`**: Controls for stepping through code (continue, step over, stop).
- **`GitSidebar.tsx`**: Interface for version control (staging files, committing changes).
- **`TeamChat.tsx`**: Chat interface for collaborating with AI agents (Coding Team).
- **`AIRefinePanel.tsx`**: Side panel for AI-powered code analysis, refactoring, and suggestions.
- **`TestRunner.tsx`**: UI for discovering and running unit tests.
- **`GlobalSearch.tsx`**: Search interface for finding text across the codebase.
- **`EditorTabs.tsx`**: Manages open file tabs.
- **`Breadcrumbs.tsx`**: Navigation path display.
- **`BottomPanel.tsx`**: Container for Terminal, Debug Console, and Output panels.
- **`StatusBar.tsx`**: Footer displaying cursor position, language, etc.
- **`NotificationOverlay.tsx`**: Toast notifications system.
- **`CommandPalette.tsx`**: Quick action launcher (Cmd+P).
- **`PreviewPanel.tsx`**: Live preview for web projects.

---

## Backend Structure

### Main Application
- **`backend/app/main.py`**
  - **Description**: The FastAPI application entry point. It registers the routers for `code`, `debug`, `git`, `terminal`, and `coding-team`.

### API Routes & Controllers (`backend/app/api/v1/`)

#### 1. Code Management (`/api/v1/code`)
- **`code.py`**
  - **Description**: Handles core IDE functionality.
  - **Connected Endpoints**:
    - `POST /execute-direct`: Direct code execution (used by Run button).
    - `POST /execute`: Authenticated execution.
    - `GET /projects`: List user projects.
    - `POST /{project_id}/files`: File CRUD operations.
    - `POST /{project_id}/ai/analyze`: AI code review.
    - `POST /{project_id}/ai/suggest`: Code completion.
    - `POST /ai-assist`: AI refactoring and optimization.
    - `POST /ai-chat`: Code-aware chat.

#### 2. Debugger (`/api/v1/debug`)
- **`debug.py`**
  - **Description**: Manages debugging sessions and state.
  - **Connected Endpoints**:
    - `POST /start`: Initialize a debug session.
    - `POST /{id}/breakpoint`: Set/toggle breakpoints.
    - `POST /{id}/step`: Step over code.
    - `POST /{id}/continue`: Resume execution.
    - `GET /{id}/variables`: Retrieve current variable state.
    - `POST /{id}/stop`: Terminate session.

#### 3. Terminal (`/ws/terminal`)
- **`terminal.py`**
  - **Description**: Manages WebSocket connections for real-time shell access.
  - **Connected Endpoints**:
    - `WS /ws/terminal/{project_id}`: WebSocket endpoint connecting the frontend xterm.js to a backend PTY (pseudo-terminal).

#### 4. Version Control (`/api/v1/git`)
- **`git.py`**
  - **Description**: minimal Git wrapper for the UI.
  - **Connected Endpoints**:
    - `POST /{project_id}/init`: Initialize repo.
    - `GET /{project_id}/status`: Get changed/staged files.
    - `GET /{project_id}/log`: Get commit history.
    - `POST /{project_id}/commit`: Commit changes.

#### 5. Coding Team Agents (`/api/v1/coding-team`)
- **`coding_team.py`**
  - **Description**: Orchestrator for multi-agent coding tasks.
  - **Connected Endpoints**:
    - `POST /run`: Triggers the LangGraph workflow/agent team to solve a complex task.

---

## Summary of Data Flow

1.  **User Interface**: User interacts with `page.tsx` components.
2.  **State Logic**: `codeStore.ts` updates local state and triggers API calls.
3.  **API Gateway**: `main.py` routes requests to specific modules in `api/v1/`.
4.  **Core Logic**: 
    - `code.py` handles file I/O and AI calls.
    - `debug.py` and `terminal.py` handle runtime environments.
    - `git.py` handles version control.
