# QA Test Report: Category 13 — Job Preparation & Career Services

## 1. Overview
The Job Preparation & Career Services module manages candidates' profiles, target roles, skill directories, project showcases, and simulated interviews (including AI feedback, mock evaluations, and readiness forecasting).

This report documents the unit and integration test coverage implemented to validate the career path alignment system, simulation feedback loops, and profile management boundaries.

---

## 2. Test Architecture & Coverage

The test suite is defined in `backend/tests/test_jobprep.py`. It uses a decoupled SQLite-in-memory configuration for complete isolation, setting up and tearing down the following tables to mimic a clean environment per test run:
1. `JobPrepProfile`
2. `JobPrepTargetRole`
3. `JobPrepSkill`
4. `JobPrepSkillEvidence`
5. `JobPrepProject`
6. `JobPrepInterviewSimulation`
7. `JobPrepPracticeSession`
8. `JobPrepReadinessAssessment`

### Tested Endpoints & Scenarios

| Test Case | Method & Endpoint | Validated Logic | Status |
|---|---|---|---|
| **Profile Lifecycle** | `GET /api/v1/jobprep/profile` <br> `POST /api/v1/jobprep/profile` <br> `PATCH /api/v1/jobprep/profile` | Checks profile creation, updates, and constraints prohibiting duplicate profiles. | **PASSED** |
| **Roles Management** | `POST /api/v1/jobprep/roles` <br> `GET /api/v1/jobprep/roles` <br> `PATCH /api/v1/jobprep/roles/{id}` <br> `DELETE /api/v1/jobprep/roles/{id}` | Tests adding, updating, retrieving, and deleting primary and secondary target roles. | **PASSED** |
| **Skills & Evidence** | `POST /api/v1/jobprep/skills` <br> `POST /api/v1/jobprep/skills/{id}/evidence` <br> `DELETE /api/v1/jobprep/evidence/{id}` | Tests skill profile setup and the ability to append proof of competence (projects, links, certificates). | **PASSED** |
| **Projects Management** | `POST /api/v1/jobprep/projects` <br> `DELETE /api/v1/jobprep/projects/{id}` | Assesses showcase project creation, details mapping, and featured flags. | **PASSED** |
| **AI Project Analysis** | `POST /api/v1/jobprep/projects/{id}/analyze` | Mocks the Groq API completion to return simulated complexity, innovation, and relevance scores. | **PASSED** |
| **Interview Simulation** | `GET /api/v1/jobprep/simulations/question` <br> `POST /api/v1/jobprep/simulations/{id}/evaluate` | Mocks conversational interview loop questions and processes detailed AI candidate response feedback. | **PASSED** |
| **Readiness Forecasts** | `GET /api/v1/jobprep/analysis/readiness-forecast` <br> `GET /api/v1/jobprep/analysis/gaps` | Validates time-to-ready forecasting, skill gap extraction, and historical scores list. | **PASSED** |

---

## 3. Mocking Strategy
To avoid external dependencies and API costs during test execution, the Groq Llama client is mocked using `unittest.mock.AsyncMock`. The mocked completion returns structured JSON representing:
- Project analysis metrics (`complexity_score`, `talking_points`, `suggestions`).
- Generative interview questions containing dynamic context derived from target roles.
- Textual and score-based interview evaluation feedback.
- Gap analysis and career trajectory forecasts.

---

## 4. Key Findings & Recommendations
- **JSON Compatibility:** Schema validation with SQLite handles `JSON` column types gracefully. However, standard production PostgreSQL contains specific JSONB optimization filters that should be verified on staging.
- **Pydantic Warnings:** Previously had high density of Pydantic V1 class-based config deprecation warnings. All have been migrated to Pydantic V2 `ConfigDict` style across all schema files. Zero Pydantic deprecation warnings remain.
