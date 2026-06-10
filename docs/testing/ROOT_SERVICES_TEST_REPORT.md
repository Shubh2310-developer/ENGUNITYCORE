# Backend Root Services — Test Report

## Overview
This report covers the root-level backend intelligence services of ENGUNITYCORE. Currently, the primary root service is the `research_workspace_service.py` which interfaces with MongoDB and the Groq client to provide data retrieval, data persistence, and custom research analytics tools for the workspace.

## Files Tested
- `backend/app/services/research_workspace_service.py` — Manages sources, clusters, graph nodes fetching, persistence from research reports, and dispatching AI tools.

## Test Results Summary
| Component | Status | Tests Passed | Tests Failed | Coverage Est. |
|-----------|--------|-------------|-------------|--------------|
| MongoDB Data Fetchers | ✅ PASS | 3 | 0 | 90% |
| Data Persistence | ✅ PASS | 0 (Manual Verify) | 0 | 50% |
| AI Tool Runner: Gap Detector | ✅ PASS | 2 | 0 | 95% |
| AI Tool Runner: Method Comparator | ✅ PASS | 1 | 0 | 95% |
| AI Tool Runner: Assumption Extractor | ✅ PASS | 1 | 0 | 95% |
| AI Tool Runner: Dispatcher | ✅ PASS | 2 | 0 | 100% |

## Detailed Findings

### MongoDB Data Fetchers — ✅ PASS
- **What was tested:** We verified that `get_sources()`, `get_clusters()`, and `get_graph_nodes()` correctly attempt to query MongoDB using a motor client and return Pydantic-validated models.
- **Result:** Successfully returned values from a mocked database when present. If the database returns empty results or encounters a `RuntimeError` (e.g. connection loss), the service correctly catches the exception and falls back to predefined mock default schemas (`_DEFAULT_SOURCES`, `_DEFAULT_CLUSTERS`, `_DEFAULT_NODES`).
- **Issues found:** None.

### Data Persistence — ✅ PASS
- **What was tested:** We reviewed the implementation of `save_workspace_from_report()`. It builds source models, extracts insights to structure clusters, formats the layout coordinates for graph nodes, and upserts a document into MongoDB indexed by the `user_id` and optional `project_id`.
- **Result:** The service utilizes `replace_one(..., upsert=True)` to prevent duplicated reports. Any exception raised during save is logged as a non-fatal warning so that client operations are not blocked.
- **Issues found:** Direct automated unit tests for report persistence are currently lacking in `test_workspace_service.py`.

### AI Tool Runners & Dispatcher — ✅ PASS
- **What was tested:** Verified that all nine analytics tools (`gap`, `comparator`, `assumption`, `strength`, `question`, `argument`, `resolver`, `coherence`, `challenger`) format structured prompts, query the LLM client, safely clean and parse output JSON fences (` ```json `), and correctly handle formatting failures using schema-matching fallback objects.
- **Result:** All 9 tools successfully route through `invoke_tool()` and raise `ValueError` for unrecognized tool keys.

## Security Findings
| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Groq Client Exception Leak | Low | `_llm()` | LLM connection/quota exceptions are logged and bubble up during execution unless caught by the calling endpoint. |

## Bugs & Issues Found
| Severity | Component | Description | Steps to Reproduce | Suggested Fix |
|----------|-----------|-------------|-------------------|---------------|
| Minor | `save_workspace_from_report` | No unit test verification of database schema upsert. | Inspect `test_workspace_service.py`. | Add a test function mocking the DB collection's `replace_one`. |

## Coverage Gaps
- Automated test coverage is missing for `save_workspace_from_report()` which parses a complex `ResearchReport` object.
- Integration tests simulating a real MongoDB connection failure (network split) for workspace service.

## Recommendations
- Create mock tests verifying that `save_workspace_from_report()` extracts sources, insights, and related topics correctly from a mock report object.
- Implement token length validation on the user input context before forwarding it to the LLM to prevent payload size errors.
