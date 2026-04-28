# Graph Report - backend  (2026-04-15)

## Corpus Check
- 178 files · ~77,134 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1626 nodes · 4803 edges · 75 communities detected
- Extraction: 41% EXTRACTED · 59% INFERRED · 0% AMBIGUOUS · INFERRED: 2830 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Get Code Cluster|Get Code Cluster]]
- [[_COMMUNITY_Research Get Cluster|Research Get Cluster]]
- [[_COMMUNITY_Get Delete Cluster|Get Delete Cluster]]
- [[_COMMUNITY_Code Project Cluster|Code Project Cluster]]
- [[_COMMUNITY_Return Run Cluster|Return Run Cluster]]
- [[_COMMUNITY_Image Chat Cluster|Image Chat Cluster]]
- [[_COMMUNITY_Dataset Analysis Cluster|Dataset Analysis Cluster]]
- [[_COMMUNITY_User Run Cluster|User Run Cluster]]
- [[_COMMUNITY_Decision Export Cluster|Decision Export Cluster]]
- [[_COMMUNITY_Repository Github Cluster|Repository Github Cluster]]
- [[_COMMUNITY_Document Get Cluster|Document Get Cluster]]
- [[_COMMUNITY_Session Start Cluster|Session Start Cluster]]
- [[_COMMUNITY_User Decision Cluster|User Decision Cluster]]
- [[_COMMUNITY_Dataset Stack Cluster|Dataset Stack Cluster]]
- [[_COMMUNITY_Cache Redis Cluster|Cache Redis Cluster]]
- [[_COMMUNITY_Text Vision Cluster|Text Vision Cluster]]
- [[_COMMUNITY_Sandbox Content Cluster|Sandbox Content Cluster]]
- [[_COMMUNITY_Emit Event Cluster|Emit Event Cluster]]
- [[_COMMUNITY_Code Flow Cluster|Code Flow Cluster]]
- [[_COMMUNITY_Performance Monitor Cluster|Performance Monitor Cluster]]
- [[_COMMUNITY_Password Token Cluster|Password Token Cluster]]
- [[_COMMUNITY_Quality Get Cluster|Quality Get Cluster]]
- [[_COMMUNITY_Language Llm Cluster|Language Llm Cluster]]
- [[_COMMUNITY_Perf Baseline Cluster|Perf Baseline Cluster]]
- [[_COMMUNITY_Load Doanalytics Cluster|Load Doanalytics Cluster]]
- [[_COMMUNITY_Injection Login Cluster|Injection Login Cluster]]
- [[_COMMUNITY_Answer Get Cluster|Answer Get Cluster]]
- [[_COMMUNITY_Login Register Cluster|Login Register Cluster]]
- [[_COMMUNITY_Query Cache Cluster|Query Cache Cluster]]
- [[_COMMUNITY_Text Ocr Cluster|Text Ocr Cluster]]
- [[_COMMUNITY_Two Sum Cluster|Two Sum Cluster]]
- [[_COMMUNITY_Document Documentservice Cluster|Document Documentservice Cluster]]
- [[_COMMUNITY_Two Solution Cluster|Two Solution Cluster]]
- [[_COMMUNITY_Config Basesettings Cluster|Config Basesettings Cluster]]
- [[_COMMUNITY_Check Users Cluster|Check Users Cluster]]
- [[_COMMUNITY_Migration Fix Cluster|Migration Fix Cluster]]
- [[_COMMUNITY_General Cluster|General Cluster]]
- [[_COMMUNITY_General Cluster 2|General Cluster 2]]
- [[_COMMUNITY_General Cluster 3|General Cluster 3]]
- [[_COMMUNITY_General Cluster 4|General Cluster 4]]
- [[_COMMUNITY_Code Execute Cluster|Code Execute Cluster]]
- [[_COMMUNITY_Simulates Running Cluster|Simulates Running Cluster]]
- [[_COMMUNITY_General Cluster 5|General Cluster 5]]
- [[_COMMUNITY_General Cluster 6|General Cluster 6]]
- [[_COMMUNITY_General Cluster 7|General Cluster 7]]
- [[_COMMUNITY_Render Structured Cluster|Render Structured Cluster]]
- [[_COMMUNITY_Lazy Load Cluster|Lazy Load Cluster]]
- [[_COMMUNITY_Log Events Cluster|Log Events Cluster]]
- [[_COMMUNITY_General Cluster 8|General Cluster 8]]
- [[_COMMUNITY_Phi2 Local Cluster|Phi2 Local Cluster]]
- [[_COMMUNITY_General Cluster 9|General Cluster 9]]
- [[_COMMUNITY_General Cluster 10|General Cluster 10]]
- [[_COMMUNITY_General Cluster 11|General Cluster 11]]
- [[_COMMUNITY_General Cluster 12|General Cluster 12]]
- [[_COMMUNITY_General Cluster 13|General Cluster 13]]
- [[_COMMUNITY_General Cluster 14|General Cluster 14]]
- [[_COMMUNITY_General Cluster 15|General Cluster 15]]
- [[_COMMUNITY_General Cluster 16|General Cluster 16]]
- [[_COMMUNITY_General Cluster 17|General Cluster 17]]
- [[_COMMUNITY_Logging Cluster|Logging Cluster]]
- [[_COMMUNITY_Rate Limit Cluster|Rate Limit Cluster]]
- [[_COMMUNITY_General Cluster 18|General Cluster 18]]
- [[_COMMUNITY_General Cluster 19|General Cluster 19]]
- [[_COMMUNITY_Planner Agent Cluster|Planner Agent Cluster]]
- [[_COMMUNITY_General Cluster 20|General Cluster 20]]
- [[_COMMUNITY_Code Review Cluster|Code Review Cluster]]
- [[_COMMUNITY_General Cluster 21|General Cluster 21]]
- [[_COMMUNITY_General Cluster 22|General Cluster 22]]
- [[_COMMUNITY_General Cluster 23|General Cluster 23]]
- [[_COMMUNITY_General Cluster 24|General Cluster 24]]
- [[_COMMUNITY_General Cluster 25|General Cluster 25]]
- [[_COMMUNITY_General Cluster 26|General Cluster 26]]
- [[_COMMUNITY_General Cluster 27|General Cluster 27]]
- [[_COMMUNITY_Celery Cluster|Celery Cluster]]
- [[_COMMUNITY_General Cluster 28|General Cluster 28]]

## God Nodes (most connected - your core abstractions)
1. `User` - 133 edges
2. `JobPrepService` - 69 edges
3. `OmniRAGPipeline` - 62 edges
4. `QueryComplexityClassifier` - 49 edges
5. `FlashRankReranker` - 48 edges
6. `ToolInvokeResponse` - 45 edges
7. `WebSearchFallback` - 44 edges
8. `KnowledgeGraph` - 39 edges
9. `CodeProject` - 39 edges
10. `CodeFile` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Research Service Failure Finding` --conceptually_related_to--> `DeepResearchAgent`  [INFERRED]
  backend/FULL_TEST_REPORT.txt → backend/app/agents/deep_research_agent.py
- `Implements the Recursive Language Model paradigm.     Offloads context to a REPL` --uses--> `SecureSandbox`  [INFERRED]
  backend/app/services/rag/recursive_agent.py → backend/app/services/code_executor/sandbox.py
- `Evaluate if retrieved docs are relevant to the query         Returns: 'CORRECT',` --uses--> `WebSearchFallback`  [INFERRED]
  backend/app/services/rag/evaluator.py → backend/app/services/rag/web_search.py
- `Evaluate and optionally correct retrieval with web search` --uses--> `WebSearchFallback`  [INFERRED]
  backend/app/services/rag/evaluator.py → backend/app/services/rag/web_search.py
- `Critique a generated response based on provided documents` --uses--> `WebSearchFallback`  [INFERRED]
  backend/app/services/rag/evaluator.py → backend/app/services/rag/web_search.py

## Hyperedges (group relationships)
- **Coding Team Hierarchical Roles** — readme_team_lead_orchestrator, readme_coder_worker, readme_reviewer_quality_control [EXTRACTED 1.00]

## Communities

### Community 0 - "Get Code Cluster"
Cohesion: 0.01
Nodes (156): read_file_content(), clean_dataset(), execute_query(), get_dataset_data(), get_dataset_insights(), get_dataset_statistics(), perform_clustering(), train_classification_model() (+148 more)

### Community 1 - "Research Get Cluster"
Cohesion: 0.04
Nodes (109): AnswerComplexity, Maps to existing complexity classifier, QueryComplexityClassifier, Classifies queries into complexity levels:     - SIMPLE: General knowledge, no r, DeepResearchAgent, get_research_agent(), Question:     What is the most complicated code you have written independently, ResearchDepth Configuration Matrix (+101 more)

### Community 2 - "Get Delete Cluster"
Cohesion: 0.03
Nodes (80): create_chart(), delete_analysis(), delete_analysis_session(), delete_chart(), delete_dataset(), export_dataset(), get_analysis(), get_analysis_session() (+72 more)

### Community 3 - "Code Project Cluster"
Cohesion: 0.05
Nodes (97): get_analytics_dashboard(), Retrieve analytics dashboard for the current user.     Aggregates data from Post, Base, ai_inline_complete(), AIAssistRequest, AIChatRequest, AIInlineCompletionRequest, CodeExecutionRequest (+89 more)

### Community 4 - "Return Run Cluster"
Cohesion: 0.09
Nodes (75): get_clusters(), get_graph_nodes(), get_sources(), invoke_tool(), _llm(), _parse_json_safe(), Research Workspace Intelligence Service ========================================, Fetch research clusters from MongoDB; fall back to defaults. (+67 more)

### Community 5 - "Image Chat Cluster"
Cohesion: 0.07
Nodes (53): ChatMessage, ChatMessageBase, ChatMessageCreate, ChatSession, ChatSessionBase, ChatSessionCreate, Config, create_chat_session() (+45 more)

### Community 6 - "Dataset Analysis Cluster"
Cohesion: 0.38
Nodes (61): Analysis, AnalysisCreate, AnalysisSession, AnalysisSessionCreate, AnalysisSessionUpdate, AnalysisType, AnalysisUpdate, AnalyticsAnalysis (+53 more)

### Community 7 - "User Run Cluster"
Cohesion: 0.05
Nodes (30): get_model_device(), optimize_sentence_transformer_loading(), optimize_torch_for_cpu(), Model Loading Optimization Utilities Reduces model loading time with CPU-specifi, Configure PyTorch for optimal CPU performance.     Call this before loading any, Get optimal device for model inference.     Explicitly returns 'cpu' for consist, Set environment variables for faster sentence-transformers loading.     Call thi, Run Node.js tests (assuming Jest or similar) (+22 more)

### Community 8 - "Decision Export Cluster"
Cohesion: 0.08
Nodes (38): DecisionAIService, DecisionAnalysisError, Service for adversarial AI review of decisions.     Challenges assumptions, dete, Analyze a decision and return AI flags., AIFlagSchema, Config, ConstraintSchema, Decision (+30 more)

### Community 9 - "Repository Github Cluster"
Cohesion: 0.11
Nodes (41): GitHubClient, Fetch file content from GitHub API, Initialize GitHub client with personal access token, Fetch all repositories for the authenticated user, GitHubBulkAnalyze, GitHubRepository, GitHubRepositoryBase, GitHubRepositoryCreate (+33 more)

### Community 10 - "Document Get Cluster"
Cohesion: 0.13
Nodes (35): Config, Document, DocumentBase, DocumentCreate, DocumentLink, DocumentLinkBase, DocumentLinkCreate, DocumentUpdate (+27 more)

### Community 11 - "Session Start Cluster"
Cohesion: 0.06
Nodes (25): Breakpoint, DebugAdapter, DebugSession, PythonDebugger, Debug Adapter Protocol implementation using Bdb for Python., Start a new debug session, Execute code with debugger, StackFrame (+17 more)

### Community 12 - "User Decision Cluster"
Cohesion: 0.09
Nodes (26): AuthenticatedUser, _build_authenticated_user(), _ensure_supabase_configured(), get_current_user(), login_access_token(), Ensure Supabase-authenticated user exists in the postgres `users` table.     Ret, Async wrapper for postgres user upsert., OAuth2 compatible token login, get an access token for future requests (+18 more)

### Community 13 - "Dataset Stack Cluster"
Cohesion: 0.07
Nodes (38): Comprehensive E2E Suite (Report B), Defensive LLM Parsing Design Rationale, KnowledgeGraph Backend Traversal, OmniRAGPipeline Backend, Parallelism-over-Serialization Design Rationale, Five-Phase Iterative Research Pipeline, WebSearchFallback Backend, Health and Cache Verification Procedure (+30 more)

### Community 14 - "Cache Redis Cluster"
Cohesion: 0.07
Nodes (24): BaseHTTPMiddleware, Response Caching Middleware for FastAPI Caches GET requests using Redis with con, Middleware to cache GET responses in Redis.     Improves performance for repeate, Cleanup Redis connection, Initialize Redis connection lazily, Check if request should be cached, Generate unique cache key from request, Handle request with caching (+16 more)

### Community 15 - "Text Vision Cluster"
Cohesion: 0.09
Nodes (18): get_vision_processor(), ImageProcessorService, MultiModalVisionProcessor, Get semantic image embedding using CLIP, Complete multi-modal vision processing (ChatGPT/Gemini level)          Component, Extract text with precise layout information         Enables spatial queries lik, Classify text position: 'top-left', 'center', etc., Classify text as heading, normal, or small (+10 more)

### Community 16 - "Sandbox Content Cluster"
Cohesion: 0.13
Nodes (22): CommandExecuteRequest, CommandExecuteResponse, execute_shell_command(), FileOperationResponse, FileReadRequest, FileTreeRequest, FileWriteRequest, list_files() (+14 more)

### Community 17 - "Emit Event Cluster"
Cohesion: 0.08
Nodes (19): migrate(), main(), test_jwt_decode(), test_mongodb(), test_postgres(), analysis_update(), connect(), join_repo() (+11 more)

### Community 18 - "Code Flow Cluster"
Cohesion: 0.07
Nodes (26): Test the Git log flow.     Endpoint: GET /api/v1/git/{project_id}/log, Test the Debug flow: Start and Stop a session.     Endpoints: POST /api/v1/debug, Test advanced debugging: breakpoints and variables.     Endpoints: /{session_id}, Test a full authenticated journey:     1. Register/Login     2. Create Project, Test the Terminal WebSocket flow.     Endpoint: /ws/terminal/{project_id}, Test code execution with stdin input., Test semantic code search by mocking the vector store.     Endpoint: POST /api/v, Test the lifecycle of a code file (create, update, fetch).     Ensures that file (+18 more)

### Community 19 - "Performance Monitor Cluster"
Cohesion: 0.12
Nodes (12): _check_resource_budgets(), get_all_stats(), p50_ms(), p95_ms(), p99_ms(), PerformanceMonitorMiddleware, Performance Monitor Middleware =============================== Pure-ASGI middlew, Snapshot RAM + CPU and emit warnings if budgets exceeded. (+4 more)

### Community 20 - "Password Token Cluster"
Cohesion: 0.17
Nodes (8): About, create_access_token(), get_password_hash(), _truncate_password(), verify_password(), bcrypt silently truncates at 72 bytes — ensure consistency, TestJWTTokens, TestPasswordHashing

### Community 21 - "Quality Get Cluster"
Cohesion: 0.12
Nodes (11): get_quality_logger(), QualityLogger, QualityMetrics, Quality Metrics and Logging Part 11 of Text Quality Upgrade Plan, Get summary statistics for recent generations., Comprehensive quality tracking for text generation., Dedicated logger for quality tracking with structured output., Analyze quality trends from log file. (+3 more)

### Community 22 - "Language Llm Cluster"
Cohesion: 0.14
Nodes (10): get_language_optimizer(), LanguageOptimizer, Language Optimizer - Kill LLM-ish Phrases Part 8 of Text Quality Upgrade Plan, Score how natural (non-AI) the text sounds.                  Returns:, Detects and removes AI-specific language patterns.     Makes text sound natural,, Remove LLM-ish phrases from text.         This is aggressive - use carefully., Generate specific guidance for removing LLM language., Check if text uses declarative statements vs exploratory language. (+2 more)

### Community 23 - "Perf Baseline Cluster"
Cohesion: 0.21
Nodes (8): build_headers(), find_server_pid(), main(), MemorySampler, percentile(), probe_endpoint(), Fire one request and return timing + status info., system_snapshot()

### Community 24 - "Load Doanalytics Cluster"
Cohesion: 0.38
Nodes (7): doAnalytics(), doDecisions(), doGithubrepos(), doHealth(), headers(), record(), setup()

### Community 25 - "Injection Login Cluster"
Cohesion: 0.2
Nodes (3): Test all auth endpoints against injection attacks, TestInputValidation, TestSecurityHeaders

### Community 26 - "Answer Get Cluster"
Cohesion: 0.22
Nodes (7): AnswerFormatter, AnswerSchema, get_schema_prompt(), Answer Schema Enforcement Ensures consistent, high-quality output structure Part, Get the appropriate schema prompt for complexity level, Universal answer structure enforced on all responses.     This is the internal c, Converts schema to user-facing markdown

### Community 27 - "Login Register Cluster"
Cohesion: 0.22
Nodes (2): TestLoginEndpoint, TestRegisterEndpoint

### Community 28 - "Query Cache Cluster"
Cohesion: 0.29
Nodes (7): cache_query(), get_redis(), invalidate_cache_pattern(), Query Result Caching Decorator Caches expensive database query results in Redis, Get or create Redis client, Decorator to cache database query results in Redis          Args:         ttl: T, Invalidate all cache keys matching a pattern          Args:         pattern: Red

### Community 29 - "Text Ocr Cluster"
Cohesion: 0.33
Nodes (3): OCRClient, Dedicated OCR client using EasyOCR.     Optimized for extracting text (especiall, Extracts text from a base64 encoded image or image bytes.

### Community 30 - "Two Sum Cluster"
Cohesion: 0.47
Nodes (4): main(), Returns the indices of the two numbers in the list that add up to the target sum, two_sum(), twoSum()

### Community 31 - "Document Documentservice Cluster"
Cohesion: 0.4
Nodes (1): DocumentService

### Community 32 - "Two Solution Cluster"
Cohesion: 0.67
Nodes (3): main(), Returns the indices of the two numbers in the array that add up to the target., two_sum()

### Community 33 - "Config Basesettings Cluster"
Cohesion: 0.67
Nodes (2): BaseSettings, Settings

### Community 34 - "Check Users Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Migration Fix Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "General Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "General Cluster 2"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "General Cluster 3"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "General Cluster 4"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Code Execute Cluster"
Cohesion: 1.0
Nodes (1): Execute code in a sandboxed environment.                  Args:             code

### Community 41 - "Simulates Running Cluster"
Cohesion: 1.0
Nodes (1): Simulates running an example script for a repository.         Returns a list of

### Community 42 - "General Cluster 5"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "General Cluster 6"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "General Cluster 7"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Render Structured Cluster"
Cohesion: 1.0
Nodes (1): Render the structured answer as markdown.         Adapts formatting based on com

### Community 46 - "Lazy Load Cluster"
Cohesion: 1.0
Nodes (1): Lazy load semantic splitter only when needed

### Community 47 - "Log Events Cluster"
Cohesion: 1.0
Nodes (1): Log AI events (prompts, responses, tool calls, agent traces) to MongoDB.

### Community 48 - "General Cluster 8"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Phi2 Local Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "General Cluster 9"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "General Cluster 10"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "General Cluster 11"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "General Cluster 12"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "General Cluster 13"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "General Cluster 14"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "General Cluster 15"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "General Cluster 16"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "General Cluster 17"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Logging Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Rate Limit Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "General Cluster 18"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "General Cluster 19"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Planner Agent Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "General Cluster 20"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Code Review Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "General Cluster 21"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "General Cluster 22"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "General Cluster 23"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "General Cluster 24"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "General Cluster 25"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "General Cluster 26"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "General Cluster 27"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Celery Cluster"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "General Cluster 28"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **272 isolated node(s):** `Monitor health endpoint`, `Get health status indicator`, `Fire one request and return timing + status info.`, `Returns the indices of the two numbers in the list that add up to the target sum`, `Returns the indices of the two numbers in the array that add up to the target.` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Check Users Cluster`** (1 nodes): `check_users.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Migration Fix Cluster`** (1 nodes): `migration_fix_columns.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 2`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 3`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 4`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Code Execute Cluster`** (1 nodes): `Execute code in a sandboxed environment.                  Args:             code`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Simulates Running Cluster`** (1 nodes): `Simulates running an example script for a repository.         Returns a list of`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 5`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 6`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 7`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Render Structured Cluster`** (1 nodes): `Render the structured answer as markdown.         Adapts formatting based on com`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lazy Load Cluster`** (1 nodes): `Lazy load semantic splitter only when needed`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Log Events Cluster`** (1 nodes): `Log AI events (prompts, responses, tool calls, agent traces) to MongoDB.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 8`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phi2 Local Cluster`** (1 nodes): `phi2_local.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 9`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 10`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 11`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 12`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 13`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 14`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 15`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 16`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 17`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logging Cluster`** (1 nodes): `logging.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rate Limit Cluster`** (1 nodes): `rate_limit.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 18`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 19`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Planner Agent Cluster`** (1 nodes): `planner_agent.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 20`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Code Review Cluster`** (1 nodes): `code_review_agent.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 21`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 22`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 23`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 24`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 25`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 26`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 27`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Celery Cluster`** (1 nodes): `celery_app.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `General Cluster 28`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Code Project Cluster` to `Get Code Cluster`, `Image Chat Cluster`, `Dataset Analysis Cluster`, `Decision Export Cluster`, `Repository Github Cluster`, `Document Get Cluster`, `Session Start Cluster`, `User Decision Cluster`, `Sandbox Content Cluster`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `OmniRAGPipeline` connect `Research Get Cluster` to `Get Code Cluster`, `Document Get Cluster`, `Image Chat Cluster`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `DeepResearchAgent` connect `Research Get Cluster` to `Get Code Cluster`, `Dataset Stack Cluster`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 130 inferred relationships involving `str` (e.g. with `.get_redis_stats()` and `probe_endpoint()`) actually correct?**
  _`str` has 130 INFERRED edges - model-reasoned connections that need verification._
- **Are the 129 inferred relationships involving `User` (e.g. with `Base` and `Retrieve documents for the current user.`) actually correct?**
  _`User` has 129 INFERRED edges - model-reasoned connections that need verification._
- **Are the 41 inferred relationships involving `JobPrepService` (e.g. with `JobPrepProfile` and `JobPrepTargetRole`) actually correct?**
  _`JobPrepService` has 41 INFERRED edges - model-reasoned connections that need verification._
- **Are the 51 inferred relationships involving `OmniRAGPipeline` (e.g. with `HyDEEngine` and `FlashRankReranker`) actually correct?**
  _`OmniRAGPipeline` has 51 INFERRED edges - model-reasoned connections that need verification._