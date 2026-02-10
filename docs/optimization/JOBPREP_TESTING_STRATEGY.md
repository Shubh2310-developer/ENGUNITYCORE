NOw# SaaS JobPrep: Comprehensive Feature Testing Master Plan (V2.0)

## 1. Introduction
This document provides a granular, feature-by-feature testing protocol for the Engunity JobPrep SaaS module. It maps every user interface element, backend service, and AI interaction to specific testing procedures to ensure a "production-ready" experience.

---

## 2. Feature Tab: Hub (The Command Center)
The Hub provides a 360-degree view of the user's career preparation status.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **Hero Section (Placement Mode)** | Toggle 'Placement Mode' in the Hub header. | UI transitions to a dark/strict theme; Header displays a countdown timer; 'Start Session' button changes behavior to 'Start Evaluation'. |
| **Readiness Score Card** | Check the 'Ready Score' value against the Readiness Tracker tab. | Score matches the backend `overall_readiness_score` exactly. |
| **Dynamic Stats (Skills/Roles/Sims)** | Add a new Skill or Role in their respective tabs, then return to Hub. | Counters increment immediately (Real-time state sync via `useJobPrepStore`). |
| **Intelligence/Evidence/Simulation Previews** | Verify Radar chart and Sparklines rendering. | Radar chart correctly reflects top 5 skill levels; Sparklines show the last 5 simulation scores accurately. |

---

## 3. Feature Tab: Role Intelligence (Market Positioning)
AI-powered analysis of career paths and requirements.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **Role CRUD** | Add, edit, and delete a target role (e.g., "AI Engineer"). | Role appears/disappears from list; Database `job_prep_target_roles` updates correctly. |
| **AI Market Intelligence** | Click 'Get AI Intelligence' on a newly added role. | System calls `/roles/{id}/analyze`; UI displays Market Outlook, Salary Range, and Preparation Focus. |
| **Interview Roadmap** | Verify 'typical_interview_rounds' section. | List displays logical progression (e.g., Recruiter Screen -> Technical -> System Design). |
| **Primary Role Selection** | Mark a role as 'Primary'. | Readiness score calculations in the Tracker tab switch focus to this role's requirements. |

---

## 4. Feature Tab: Skill Matrix (The Competency Map)
Granular tracking of technical and soft skills.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **Skill Level Tracking** | Use the level selector to change a skill from level 2 to 4. | UI updates visually; Backend `current_level` updates; Readiness score recalculates. |
| **Evidence Management** | Click 'Manage Evidence' -> 'Add Artifact'. | Artifact (Project/Cert) links to the skill; `evidence_count` increments; Evidence appears in the 'Existing Artifacts' list. |
| **Category Filtering** | Group skills by category (Frontend, ML, etc.). | Matrix re-organizes correctly without losing state. |
| **Skill Deletion Safety** | Delete a skill with existing evidence. | System prompts for confirmation; Evidence is either archived or deleted based on policy. |

---

## 5. Feature Tab: Practice Arena (Skill Sharpening)
Conceptual and technical drills with immediate AI feedback.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **Challenge Library** | Select 'Concept Stress Test' or 'Technical Problem'. | Correct challenge list loads; Metadata (Difficulty/Time) is displayed accurately. |
| **Answer Submission** | Provide a detailed answer to a "Explain-Why" drill. | AI evaluates the response; Score (0-100) and specific suggestions are returned. |
| **Progress Persistence** | Complete a drill and refresh the page. | The attempt is logged in `job_prep_practice_sessions`; The score contributes to the Readiness Tracker. |

---

## 6. Feature Tab: Interview Simulator (High-Stakes)
The core realistic simulation engine.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **Setup Configuration** | Choose 'Senior' difficulty for a 'Backend' role. | Question generated is contextually appropriate for senior-level backend engineering. |
| **Active Session (strict)** | Enter 'Placement Mode' and start a simulation. | No hints are available; User cannot pause the session; Timer is strictly enforced. |
| **Feedback Loop** | Submit answer and view 'Performance Report'. | Report includes: Technical Accuracy, Communication Clarity, and a 'Hiring Decision' (Hire/No-Hire). |
| **Transcript Storage** | Check MongoDB after simulation. | Full text of question and response is stored for future review. |

---

## 7. Feature Tab: Project Proof (Evidence & Analysis)
Deep-dive analysis of projects to generate interview talking points.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **GitHub Integration** | Provide a valid GitHub URL for import. | System fetches repo details; AI generates Complexity, Innovation, and Value scores. |
| **Talking Points Generation** | Run AI analysis on a manual project entry. | List of "Talking Points" is generated (e.g., "Discuss how you optimized the database layer"). |
| **Tech Stack Validation** | Enter a tech stack as a comma-separated list. | System parses and displays them as individual searchable badges. |

---

## 8. Feature Tab: Readiness Tracker (The Truth Metric)
Visual representation of job readiness.

| Sub-Feature | Testing Procedure | Success Criteria |
| :--- | :--- | :--- |
| **Overall Readiness Score** | Observe the gauge after completing various activities. | Score moves dynamically based on the weighted algorithm (Sims: 40%, Skills: 30%, Projects: 20%, Practice: 10%). |
| **Skill Gap Alerts** | Add a role that requires "Kubernetes" when the user has level 0. | A 'MISSING' alert appears in the Skill Gaps sidebar immediately. |
| **Performance Trajectory** | Compare 'Last Week' vs 'Current' readiness in the Line Chart. | Graph correctly plots historical data from `job_prep_readiness_assessments`. |
| **AI Roadmap** | Verify the 'Personalized AI Roadmap' card. | Card suggests the *most impactful* missing skill to master next. |

---

## 9. System-Wide & Performance Testing
- **State Synchronization**: Verify changes in any tab reflect in the Header and Hub without a page reload (Zustand/React state).
- **AI Latency Tolerance**: Ensure UI shows "Thinking..." states during long-running AI analysis (Role/Project/Simulation).
- **Export Integrity**: Export the entire profile as PDF/Markdown. | Document contains all current Skills, Projects, and Simulation history.
- **Mobile Responsiveness**: Test all tabs on mobile viewports. | Cards stack correctly; Charts scale without overflow; Navigation is accessible.

---

## 10. Technical API & Data Mapping (For Backend/Integration Testing)
This section maps UI actions to specific backend endpoints and expected data mutations.

| UI Action | Backend Endpoint | Method | Key Data Fields |
| :--- | :--- | :--- | :--- |
| **Import GitHub Repo** | `/api/v1/jobprep/projects/import-github` | POST | `owner`, `repo_name` |
| **Analyze Project** | `/api/v1/jobprep/projects/{id}/analyze` | POST | `complexity_score`, `talking_points` |
| **Get Interview Question**| `/api/v1/jobprep/simulations/question` | GET | `role_id`, `difficulty` |
| **Evaluate Response** | `/api/v1/jobprep/simulations/{id}/evaluate` | POST | `question`, `user_response` |
| **Update Skill Level** | `/api/v1/jobprep/skills/{id}` | PATCH | `current_level` |
| **Recalculate Readiness**| Triggered by Simulation/Practice | Internal | `overall_readiness_score` |

---

## 11. Edge Case & Error Resilience Matrix

### 11.1. AI Service Interruptions
- **Scenario**: Groq API returns a 503 or 429 error during an interview.
- **Expected Behavior**: UI displays a retry button; The user's response is cached in local storage so it isn't lost; The simulation state remains "active" but pending.

### 11.2. Empty State Handling
- **Scenario**: New user with zero skills, roles, or projects.
- **Expected Behavior**: Hub displays "Start Your Career Prep" onboarding; All charts show "No data available" or illustrative placeholders; Readiness score is 0%.

### 11.3. Concurrency Check
- **Scenario**: User opens the "Interview Simulator" in two different browser tabs.
- **Expected Behavior**: The system should either sync the timer between tabs or restrict the user to one active simulation at a time to prevent score manipulation.

---

## 12. Regression Testing (Known Issues Fixes)
- [ ] **Evidence 422 Fix**: Verify that adding evidence with special characters in the title no longer triggers a validation error.
- [ ] **Chart Overflow**: Ensure that if a user has 50+ skills, the Radar chart only shows the top 5 to prevent visual clutter and performance lag.
- [ ] **Session Expiry**: Verify that if a user's JWT expires during a 1-hour "Placement Mode" session, they are prompted to re-authenticate without losing their current answer.

---

## 13. User Acceptance Testing (UAT) Checklist
Final verification from a user's perspective before production release.

- [ ] **Onboarding Flow**: Can a new user go from landing to their first mock interview in under 3 minutes?
- [ ] **Value Realization**: Does the "Personalized AI Roadmap" provide actionable advice that feels relevant to the user's target role?
- [ ] **Placement Mode UX**: Does the pressure (timer/strictness) feel realistic without being frustrating?
- [ ] **Chart Readability**: Are the Radar and Line charts intuitive? Do they correctly communicate "Improvement" vs "Gaps"?
- [ ] **Feedback Tone**: Is the AI interviewer feedback professional, constructive, and free of toxic/irrelevant content?

---

## 14. UI/UX Consistency & Accessibility (a11y)
Ensuring a seamless experience for all users across all devices.

### 14.1. Visual Regression
- [ ] **Theme Consistency**: Verify that `jobprep-theme` colors (Blue/Slate) are applied consistently across all tabs.
- [ ] **Placement Mode Contrast**: Ensure the dark theme used in Placement Mode meets WCAG AA standards for contrast (especially text on red/dark backgrounds).
- [ ] **Loading States**: Every async action (Import, Analyze, Evaluate) must display a skeleton screen or a non-blocking spinner.

### 14.2. Accessibility Matrix
| Element | Requirement | Testing Method |
| :--- | :--- | :--- |
| **Tab Navigation** | Keyboard focusable (Tab key). | Manual keyboard traversal. |
| **Action Buttons** | Meaningful `aria-label` (e.g., "Add Skill"). | Screen reader (NVDA/VoiceOver). |
| **Form Inputs** | Associated labels for every input field. | Wave/Axe DevTools scan. |
| **AI Output** | Dynamic updates announced to screen readers. | Verify `aria-live` regions for feedback updates. |

---

## 15. Negative Testing Matrix (The "Break-the-App" Suite)
Testing the system's resilience against intentional or accidental misuse.

| Scenario | Intentional Input | Expected Failure Mode |
| :--- | :--- | :--- |
| **Malformed JSON Attack**| Send corrupted JSON to `/profile`. | Backend returns `422 Unprocessable Entity`; UI shows "Invalid input". |
| **Token Exhaustion** | Rapid-fire clicks on "Analyze with AI". | Client-side debouncing prevents multiple calls; Backend returns `429 Too Many Requests`. |
| **Session Hijacking** | Attempt to access `/roles` with an expired JWT. | System returns `401 Unauthorized`; User is redirected to login immediately. |
| **Data Type Mismatch** | Send a string where an integer is expected (e.g., level: "expert"). | Pydantic validation catches error; returns specific error message. |
| **Special Char Bomb** | Input emoji/ASCII-art into "Interview Response". | System sanitizes input; AI processes as literal text or rejects if non-meaningful. |

---

## 16. Deployment & Smoke Test Protocol (Post-Release)
The "5-Minute Smoke Test" to be performed after every deployment to Production.

1. **Login & Hub**: Verify the Readiness Score gauge renders.
2. **Skill Matrix**: Add a dummy skill "Test Skill", verify it appears.
3. **Role Intelligence**: Click 'Refresh AI Analysis' on a primary role; ensure no 500 errors.
4. **Simulator**: Generate one question and submit "This is a test answer." Verify evaluation returns.
5. **Clean Up**: Delete the "Test Skill" and verify state clears.

---
*Created by: Engunity Full-Stack Development & QA Team*
*Last Revision: 2026-02-09*
*Document Status: APPROVED FOR PRODUCTION*


