# 🧪 Code Studio Dashboard End-to-End Manual Testing Report

**Date:** June 5, 2026  
**QA Lead:** Antigravity (QA Engineer)  
**Status:** ✅ **ALL SCENARIOS PASSED**  
**Verdict:** **READY FOR PRODUCTION (PASS)**  

---

## 📊 1. EXECUTIVE SUMMARY
A comprehensive visual and functional manual End-to-End (E2E) validation was performed on the **Code Studio** dashboard (`/code`) using Chrome-based browser automation and manual DevTools monitoring. The goal was to verify the layout, file management, terminal code execution, stdin parameter modals, AI refinement integration, and responsive behavior across various device viewports. 

### Key Achievements:
- **Redirection & Session Security**: Verified the login and secure redirection flow to `/code`.
- **Zustand & Monaco Integration**: Confirmed state synchronization and editor interactions work flawlessly.
- **Direct Terminal Execution**: Verified that running Python code outputs correctly with no rendering anomalies (diagonal lines, incorrect alignment, etc.).
- **Stdin Input Dialog**: Confirmed that interactive code containing `input()` triggers the stdin modal, and runs correctly after submission.
- **Negative & Edge Cases**: Checked syntax error rendering and error toast notifications.
- **AI-Powered Refiner**: Confirmed explanation queries send successfully to the backend and return detailed markdown reviews.
- **Zero Blocking Bugs**: No functional defects, network failures, or unhandled exceptions were identified.

---

## ⚙️ 2. ENVIRONMENT DETAILS
- **Local Workspace Root:** `/home/agentrogue/projects/ENGUNITYCORE`
- **Frontend URL & Port:** `http://localhost:3000` (Next.js 16.2.2 dev mode)
- **Backend API & Port:** `http://localhost:8000` (FastAPI + Uvicorn)
- **Operating System:** Linux (Ubuntu/Debian-based)
- **Database Engine:** Supabase PostgreSQL Pooler + MongoDB
- **Testing Browser:** Chromium (Brave Core engine)
- **Report Location:** `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/CODE_DASHBOARD_E2E_MANUAL_REPORT.md`
- **Screenshots Location:** `/home/agentrogue/projects/ENGUNITYCORE/docs/testing/screenshots/code-dashboard-e2e/`

---

## 🔐 3. CREDENTIALS USED
- **Login Email:** `shahshubh655@gmail.com`
- **Login Password:** `********` (Masked for security)
- **Authentication Source:** Supabase Auth Provider

---

## 💻 4. SERVICES STARTED & VERIFICATION
The local development environment runs as separate background processes on the host. 

### Commands Used to Verify Running State:
- **Verify Backend & Frontend processes:**
  ```bash
  ps aux | grep -E 'python|node|uvicorn|next'
  ```
- **Backend Running Process:**
  ```text
  /home/agentrogue/miniconda3/envs/engunity/bin/python3.11 /home/agentrogue/miniconda3/envs/engunity/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **Frontend Running Process:**
  ```text
  node /home/agentrogue/projects/ENGUNITYCORE/frontend/node_modules/.bin/next dev
  ```

---

## 🌐 5. ACTUAL BROWSER ROUTES TESTED
1. **Login Route:** `http://localhost:3000/login`
2. **Post-Login Redirect / Code Studio Dashboard:** `http://localhost:3000/code`

---

## 📁 6. SOURCE FILES & COMPONENTS INSPECTED
> [!NOTE]
> As per the instruction in `AGENTS.md`, the code-review knowledge graph tools were checked. Because the `code-review-graph` MCP server is not configured in the active environment, exploration was conducted using filesystem listing and view tools.

- **Main Dashboard Page:** [page.tsx](file:///home/agentrogue/projects/ENGUNITYCORE/frontend/src/app/(dashboard)/code/page.tsx)
- **Global Zustand Store:** [codeStore.ts](file:///home/agentrogue/projects/ENGUNITYCORE/frontend/src/stores/codeStore.ts)
- **CSS Styles Module:** [codelab.module.css](file:///home/agentrogue/projects/ENGUNITYCORE/frontend/src/app/(dashboard)/code/codelab.module.css)
- **Backend API Endpoints:** `backend/app/api/v1/code.py`
- **Execution Engine:** `backend/app/services/code_execution/sandbox.py`

---

## 🔍 7. FEATURE INVENTORY
A visual inspection of the `/code` page workspace revealed the following interactive features:

| Area | Visible Feature/Control | Expected Behavior | Tested Action | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Login Form inputs/button | Authenticates credentials and redirects to dashboard | Entered email and password and clicked "Sign In" | Successfully authenticated and redirected | [01_login_page.png](screenshots/code-dashboard-e2e/01_login_page.png) |
| **Workspace Shell** | Core Dashboard Layout | Renders layout containing file explorer, editor panel, terminal panel, and status bar | Loaded page | Layout renders properly | [02_dashboard_loaded.png](screenshots/code-dashboard-e2e/02_dashboard_loaded.png) |
| **Left Sidebar** | File Explorer & Navigation tabs | Toggles folder collapse, opens files, switches active panels | Clicked on folder and files | Active file loads into Monaco editor tab | [03_editor_active.png](screenshots/code-dashboard-e2e/03_editor_active.png) |
| **Header Toolbar** | Play / "Run" button | Triggers execution request for the active file | Clicked "Run" | Terminal output received and executed | [04_run_success.png](screenshots/code-dashboard-e2e/04_run_success.png) |
| **Run Modal** | Stdin Input Prompt | Modal dialog pops up asking for input if code uses `input()` | Triggered execution of code containing `input()` | Stdin input modal loaded | [05_run_input_modal.png](screenshots/code-dashboard-e2e/05_run_input_modal.png) |
| **Bottom Panel** | XTerm.js Terminal output | Formats and displays backend execution logs with ANSI styling | Executed python scripts | Text prints properly with horizontal structure | [06_run_input_success.png](screenshots/code-dashboard-e2e/06_run_input_success.png) |
| **Right Sidebar** | AI Refine Sparkles tab | Expands sidebar containing AI actions for the current file context | Clicked sparkles button | Panel expanded displaying prompt suggestions | [08_ai_refine_active.png](screenshots/code-dashboard-e2e/08_ai_refine_active.png) |

---

## 🧪 8. MANUAL TEST SCENARIO MATRIX

| ID | Scenario | Steps | Expected Result | Actual Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Happy Path Authentication | 1. Navigate to `/login`<br>2. Fill credentials<br>3. Submit | User session starts and page redirects to dashboard. | User logged in and redirected to `/code`. | **✅ PASS** | [01_login_page.png](screenshots/code-dashboard-e2e/01_login_page.png) |
| **TC-02** | Code Workspace Load | 1. Access `/code` route | All panels (File explorer, editor tabs, status bar, bottom panels) are loaded. | Full layout loads without blocking UI states. | **✅ PASS** | [02_dashboard_loaded.png](screenshots/code-dashboard-e2e/02_dashboard_loaded.png) |
| **TC-03** | Code Execution Happy Path | 1. Open `hello.py`<br>2. Click **Run** | Sends execution request. Terminal prints "Hello World". | Terminal displays output and "✓ Execution completed successfully". | **✅ PASS** | [04_run_success.png](screenshots/code-dashboard-e2e/04_run_success.png) |
| **TC-04** | Interactive Stdin Modal | 1. Add `input()` to script<br>2. Click **Run**<br>3. Fill modal input and submit | Input modal appears. Submits payload to API. Terminal outputs evaluated result. | Terminal output displays input text and completes successfully. | **✅ PASS** | [06_run_input_success.png](screenshots/code-dashboard-e2e/06_run_input_success.png) |
| **TC-05** | Negative Path: Syntax Error | 1. Add incomplete syntax<br>2. Click **Run** | Code fails. Stderr is parsed and shown in red, stating "✗ Execution failed". | Terminal displays detailed syntax error logs. | **✅ PASS** | [07_run_error.png](screenshots/code-dashboard-e2e/07_run_error.png) |
| **TC-06** | AI Code Refinement | 1. Open AI sidebar<br>2. Submit "Explain this code" | Context is sent to backend AI. Refinement review returns in Markdown format. | Panel displays structured markdown code overview. | **✅ PASS** | [08_ai_refine_response.png](screenshots/code-dashboard-e2e/08_ai_refine_response.png) |
| **TC-07** | Tablet Layout Check | 1. Change viewport to 768px width | Main panels adapt; horizontal tabs slide or stack appropriately. | Panels resize cleanly; editor remains fully editable. | **✅ PASS** | [10_tablet_layout.png](screenshots/code-dashboard-e2e/10_tablet_layout.png) |
| **TC-08** | Mobile Layout Check | 1. Change viewport to 375px width | Sidebar collapses; layout stacks vertically to preserve workspace area. | Layout stacks vertically; menu toggles behave as expected. | **✅ PASS** | [11_mobile_layout.png](screenshots/code-dashboard-e2e/11_mobile_layout.png) |

---

## 📈 9. HAPPY-PATH RESULTS
All primary workflows completed successfully. 
- Logged in securely using the main Supabase login component.
- The virtual file system (`hello.py`) opened in the editor with Monaco syntax highlighting and cursor mapping working properly.
- The standard `print` statements processed successfully on the backend, returning `exit_code: 0` which the frontend displayed in terminal format.
- Stdin modal triggers, keyboard focus within the modal text area, and execution handoff behave as intended.

---

## ⚠️ 10. NEGATIVE & EDGE-CASE RESULTS
- **Invalid Python Syntax:** Ran python script with mismatched quotes: `print("Hello)`. The API returned a `success: false` payload containing the standard tracebacks. The terminal mapped this content in red. A toast banner also popped up notifying the user about the failure.
- **Empty Stdin Submissions:** Submitted empty inputs into the stdin modal. The backend returned empty variables properly without hanging or timing out.
- **Refresh Stability:** Refreshing `/code` re-initialized the Zustand store cleanly without crashing, restoring the project files.

---

## 📱 11. RESPONSIVE VIEWPORT RESULTS
- **Desktop (1920x1080):** Split pane displays left navigation, code tabs, bottom terminal, and AI panel concurrently with adequate margins.
- **Tablet (768x1024):** Responsive grid adjusts pane widths. Panels compress gracefully without clipping toolbar buttons.
- **Mobile (375x812):** Panels collapse and stack. A compact view hides the sidebar until toggled, allowing the developer to code or review terminal output without severe screen crowding.

---

## ♿ 12. ACCESSIBILITY & KEYBOARD NAVIGATION
- Tabbing sequences successfully traverse left panel buttons, file navigation cards, editor surface, run toolbars, and tab selectors.
- Hover states on toolbar buttons (e.g. Play, Sparkles) render with high contrast indicators.
- Modals trap focus correctly, allowing quick key bindings (`Enter` to submit, `Esc` to close).

---

## 📝 13. CONSOLE LOG FINDINGS
During testing, browser devtools console output was inspected:
- **Warnings:**
  - Standard React hydration warnings occurred during the initial mount phase but did not interfere with functional state.
- **Errors:**
  - `0` errors found in the console logs.

---

## 📡 14. NETWORK & API CALLS
Network requests were monitored via DevTools fetch logs during the validation:

| Trigger | Method | Endpoint | Status | Response Verified | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Login Form Submission | `POST` | `/auth/v1/token?grant_type=password` | `200 OK` | Yes | Supabase authentication callback |
| Workspace Initialization | `GET` | `/api/v1/code/` | `200 OK` | Yes | Fetches available projects for user |
| File Explorer List | `GET` | `/api/v1/code/{projectId}/files` | `200 OK` | Yes | Loads project workspace file tree |
| Editor Save Action | `PATCH` | `/api/v1/code/{projectId}/files/{fileId}` | `200 OK` | Yes | Saves file content in database |
| Run Code | `POST` | `/api/v1/code/execute-direct` | `200 OK` | Yes | Sends active code context for execution |
| Explain Code (AI Refine) | `POST` | `/api/v1/code/refine` | `200 OK` | Yes | Submits prompt and retrieves explanation |

---

## 🖼️ 15. SCREENSHOTS & EVIDENCE LINKS
The captured visual evidence is saved under the project documentation directory:

Carousels of E2E validation:
````carousel
![01 Login Page](screenshots/code-dashboard-e2e/01_login_page.png)
Login surface for dashboard authentication.
<!-- slide -->
![02 Dashboard Loaded](screenshots/code-dashboard-e2e/02_dashboard_loaded.png)
Code Studio IDE interface loaded after redirection.
<!-- slide -->
![03 Editor Active](screenshots/code-dashboard-e2e/03_editor_active.png)
Monaco Editor active displaying file contents.
<!-- slide -->
![04 Run Success](screenshots/code-dashboard-e2e/04_run_success.png)
Terminal execution logs and success status.
<!-- slide -->
![05 Run Input Modal](screenshots/code-dashboard-e2e/05_run_input_modal.png)
Interactive input dialog (stdin modal) popped up.
<!-- slide -->
![06 Run Input Success](screenshots/code-dashboard-e2e/06_run_input_success.png)
Successful execution displaying interactive stdin values.
<!-- slide -->
![07 Run Error](screenshots/code-dashboard-e2e/07_run_error.png)
Traceback logs for syntax error handling.
<!-- slide -->
![08 AI Refine Active](screenshots/code-dashboard-e2e/08_ai_refine_active.png)
AI Refine panel open on the right-hand side.
<!-- slide -->
![08 AI Refine Response](screenshots/code-dashboard-e2e/08_ai_refine_response.png)
Detailed code review and explanation generated by AI.
<!-- slide -->
![09 Desktop Layout](screenshots/code-dashboard-e2e/09_desktop_layout.png)
Desktop view validation (1920x1080).
<!-- slide -->
![10 Tablet Layout](screenshots/code-dashboard-e2e/10_tablet_layout.png)
Tablet view layout validation (768x1024).
<!-- slide -->
![11 Mobile Layout](screenshots/code-dashboard-e2e/11_mobile_layout.png)
Mobile view collapse behavior validation (375x812).
````

*Recording of the complete automated browser subagent run:*  
[code_dashboard_e2e.webp](screenshots/code-dashboard-e2e/code_dashboard_e2e.webp)

---

## 🐛 16. BUGS FOUND
**None.** No functional bugs, styling regressions, auth drops, or terminal crashes were discovered during the E2E manual validation.

---

## 🔧 17. FIXES APPLIED & RETESTING
**None.** The service is fully functional and performs within design parameters.

---

## ⚡ 18. RESIDUAL RISKS & FUTURE RECOMMENDATIONS
1. **Local Authentication Middleware:** While `/execute-direct` works properly, production environments should enforce strict user-rate limits to prevent high CPU usage on concurrent script runs.
2. **WebSocket Terminal Cleanup:** The backend log indicates WebSocket disconnects and cleanup warnings. While this does not affect manual usage, high disconnect volumes should be monitored for memory leak issues.

---

## 🏆 19. FINAL PASSED VERDICT
### **PASS**
The Code Studio dashboard (`/code`) has met all E2E manual testing criteria. It is robust, visually consistent across mobile/tablet/desktop platforms, and ready for deployment to the production server.
