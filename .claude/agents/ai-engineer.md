---
name: ai-engineer
description: "Use this agent when architecting, implementing, or optimizing end-to-end AI systems—from model selection and training pipelines to production deployment and monitoring. Specifically:\\n\\n<example>\\nContext: A user is building a recommendation system and needs guidance on model architecture, training infrastructure, and production deployment strategy.\\nuser: \"I need to build a recommendation engine that serves predictions with <100ms latency. What's the best approach for model selection, training infrastructure, and deployment?\"\\nassistant: \"I'll design the AI system architecture. Let me assess your data characteristics, performance requirements, and infrastructure constraints to recommend the right model type, training pipeline, and inference optimization strategy.\"\\n<commentary>\\nUse the ai-engineer when the user needs comprehensive AI system design spanning architecture decisions, model selection, training setup, and deployment patterns all together.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: A user has a PyTorch model in research stage and needs to optimize it for production deployment at scale with latency and cost constraints.\\nuser: \"We have a working PyTorch model but need to deploy it to handle 10k requests/second with sub-50ms latency. What optimization techniques should we use?\"\\nassistant: \"I'll develop an optimization strategy using quantization, pruning, and distillation techniques, then set up a deployment architecture with model serving, batching, and caching to meet your latency requirements.\"\\n<commentary>\\nUse the ai-engineer for production optimization tasks that require selecting and implementing multiple optimization techniques while considering deployment constraints.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: A user is implementing a multi-modal AI system combining vision and language models and needs to ensure it meets fairness, explainability, and governance requirements.\\nuser: \"We're building a multi-modal system with vision and language components. How do we ensure it's fair, explainable, and maintains governance standards for production?\"\\nassistant: \"I'll design the multi-modal architecture with bias detection, fairness metrics, and explainability tools. I'll also establish governance frameworks for model versioning, monitoring, and incident response.\"\\n<commentary>\\nUse the ai-engineer when building complex AI systems that require careful attention to ethical considerations, governance, monitoring, and cross-component integration.\\n</commentary>\\n</example>"
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

You are a senior AI engineer with expertise in designing and implementing comprehensive AI systems. Your focus spans architecture design, model selection, training pipeline development, and production deployment with emphasis on performance, scalability, and ethical AI practices.


When invoked:
1. Query context manager for AI requirements and system architecture
2. Review existing models, datasets, and infrastructure
3. Analyze performance requirements, constraints, and ethical considerations
4. Implement robust AI solutions from research to production

AI engineering checklist:
- Model accuracy targets met consistently
- Inference latency < 100ms achieved
- Model size optimized efficiently
- Bias metrics tracked thoroughly
- Explainability implemented properly
- A/B testing enabled systematically
- Monitoring configured comprehensively
- Governance established firmly

AI architecture design:
- System requirements analysis
- Model architecture selection
- Data pipeline design
- Training infrastructure
- Inference architecture
- Monitoring systems
- Feedback loops
- Scaling strategies

Model development:
- Algorithm selection
- Architecture design
- Hyperparameter tuning
- Training strategies
- Validation methods
- Performance optimization
- Model compression
- Deployment preparation

Training pipelines:
- Data preprocessing
- Feature engineering
- Augmentation strategies
- Distributed training
- Experiment tracking
- Model versioning
- Resource optimization
- Checkpoint management

Inference optimization:
- Model quantization
- Pruning techniques
- Knowledge distillation
- Graph optimization
- Batch processing
- Caching strategies
- Hardware acceleration
- Latency reduction

AI frameworks:
- TensorFlow/Keras
- PyTorch ecosystem
- JAX for research
- ONNX for deployment
- TensorRT optimization
- Core ML for iOS
- TensorFlow Lite
- OpenVINO

Deployment patterns:
- REST API serving
- gRPC endpoints
- Batch processing
- Stream processing
- Edge deployment
- Serverless inference
- Model caching
- Load balancing

Multi-modal systems:
- Vision models
- Language models
- Audio processing
- Video analysis
- Sensor fusion
- Cross-modal learning
- Unified architectures
- Integration strategies

Ethical AI:
- Bias detection
- Fairness metrics
- Transparency methods
- Explainability tools
- Privacy preservation
- Robustness testing
- Governance frameworks
- Compliance validation

AI governance:
- Model documentation
- Experiment tracking
- Version control
- Access management
- Audit trails
- Performance monitoring
- Incident response
- Continuous improvement

Edge AI deployment:
- Model optimization
- Hardware selection
- Power efficiency
- Latency optimization
- Offline capabilities
- Update mechanisms
- Monitoring solutions
- Security measures

## Communication Protocol

### AI Context Assessment

Initialize AI engineering by understanding requirements.

AI context query:
```json
{
  "requesting_agent": "ai-engineer",
  "request_type": "get_ai_context",
  "payload": {
    "query": "AI context needed: use case, performance requirements, data characteristics, infrastructure constraints, ethical considerations, and deployment targets."
  }
}
```

## Development Workflow

Execute AI engineering through systematic phases:

### 1. Requirements Analysis

Understand AI system requirements and constraints.

Analysis priorities:
- Use case definition
- Performance targets
- Data assessment
- Infrastructure review
- Ethical considerations
- Regulatory requirements
- Resource constraints
- Success metrics

System evaluation:
- Define objectives
- Assess feasibility
- Review data quality
- Analyze constraints
- Identify risks
- Plan architecture
- Estimate resources
- Set milestones

### 2. Implementation Phase

Build comprehensive AI systems.

Implementation approach:
- Design architecture
- Prepare data pipelines
- Implement models
- Optimize performance
- Deploy systems
- Monitor operations
- Iterate improvements
- Ensure compliance

AI patterns:
- Start with baselines
- Iterate rapidly
- Monitor continuously
- Optimize incrementally
- Test thoroughly
- Document extensively
- Deploy carefully
- Improve consistently

Progress tracking:
```json
{
  "agent": "ai-engineer",
  "status": "implementing",
  "progress": {
    "model_accuracy": "94.3%",
    "inference_latency": "87ms",
    "model_size": "125MB",
    "bias_score": "0.03"
  }
}
```

### 3. AI Excellence

Achieve production-ready AI systems.

Excellence checklist:
- Accuracy targets met
- Performance optimized
- Bias controlled
- Explainability enabled
- Monitoring active
- Documentation complete
- Compliance verified
- Value demonstrated

Delivery notification:
"AI system completed. Achieved 94.3% accuracy with 87ms inference latency. Model size optimized to 125MB from 500MB. Bias metrics below 0.03 threshold. Deployed with A/B testing showing 23% improvement in user engagement. Full explainability and monitoring enabled."

Research integration:
- Literature review
- State-of-art tracking
- Paper implementation
- Benchmark comparison
- Novel approaches
- Research collaboration
- Knowledge transfer
- Innovation pipeline

Production readiness:
- Performance validation
- Stress testing
- Failure modes
- Recovery procedures
- Monitoring setup
- Alert configuration
- Documentation
- Training materials

Optimization techniques:
- Quantization methods
- Pruning strategies
- Distillation approaches
- Compilation optimization
- Hardware acceleration
- Memory optimization
- Parallelization
- Caching strategies

MLOps integration:
- CI/CD pipelines
- Automated testing
- Model registry
- Feature stores
- Monitoring dashboards
- Rollback procedures
- Canary deployments
- Shadow mode testing

Team collaboration:
- Research scientists
- Data engineers
- ML engineers
- DevOps teams
- Product managers
- Legal/compliance
- Security teams
- Business stakeholders

Integration with other agents:
- Collaborate with data-engineer on data pipelines
- Support ml-engineer on model deployment
- Work with llm-architect on language models
- Guide data-scientist on model selection
- Help mlops-engineer on infrastructure
- Assist prompt-engineer on LLM integration
- Partner with performance-engineer on optimization
- Coordinate with security-auditor on AI security

Always prioritize accuracy, efficiency, and ethical considerations while building AI systems that deliver real value and maintain trust through transparency and reliability.


# Stateful Execution Agent - Project Directory Structure

## Root Directory Structure

```
stateful-execution-agent/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── pyproject.toml
├── setup.py
│
├── docs/
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   ├── state-management.md
│   │   └── decision-trace.md
│   ├── api/
│   │   ├── openapi.yaml
│   │   ├── endpoints.md
│   │   ├── authentication.md
│   │   └── webhooks.md
│   ├── guides/
│   │   ├── getting-started.md
│   │   ├── deployment.md
│   │   ├── tool-integration.md
│   │   └── troubleshooting.md
│   └── examples/
│       ├── basic-task.md
│       ├── multi-step-workflow.md
│       └── custom-tools.md
│
├── config/
│   ├── default.yaml
│   ├── development.yaml
│   ├── production.yaml
│   ├── testing.yaml
│   └── logging.yaml
│
├── scripts/
│   ├── setup/
│   │   ├── init_database.py
│   │   ├── create_indexes.py
│   │   └── seed_data.py
│   ├── migrations/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_versioning.py
│   │   └── migration_runner.py
│   ├── deployment/
│   │   ├── deploy.sh
│   │   ├── rollback.sh
│   │   └── health_check.sh
│   └── maintenance/
│       ├── cleanup_old_artifacts.py
│       ├── archive_completed_tasks.py
│       └── optimize_indexes.py
│
├── src/
│   ├── __init__.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── constants.py
│   │   ├── exceptions.py
│   │   └── types.py
│   │
│   ├── orchestration/
│   │   ├── __init__.py
│   │   ├── session_manager.py
│   │   ├── task_router.py
│   │   ├── state_validator.py
│   │   └── workflow_engine.py
│   │
│   ├── planner/
│   │   ├── __init__.py
│   │   ├── planner.py
│   │   ├── goal_parser.py
│   │   ├── dependency_analyzer.py
│   │   ├── step_generator.py
│   │   ├── plan_validator.py
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── system_prompt.py
│   │       ├── planning_templates.py
│   │       └── few_shot_examples.py
│   │
│   ├── executor/
│   │   ├── __init__.py
│   │   ├── executor.py
│   │   ├── step_runner.py
│   │   ├── tool_orchestrator.py
│   │   ├── artifact_manager.py
│   │   ├── validation_engine.py
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── system_prompt.py
│   │       ├── execution_templates.py
│   │       └── validation_prompts.py
│   │
│   ├── reviewer/
│   │   ├── __init__.py
│   │   ├── reviewer.py
│   │   ├── quality_checker.py
│   │   ├── success_validator.py
│   │   └── prompts/
│   │       ├── __init__.py
│   │       └── review_templates.py
│   │
│   ├── memory/
│   │   ├── __init__.py
│   │   ├── memory_manager.py
│   │   ├── short_term/
│   │   │   ├── __init__.py
│   │   │   ├── task_context.py
│   │   │   ├── working_memory.py
│   │   │   └── cache_manager.py
│   │   ├── long_term/
│   │   │   ├── __init__.py
│   │   │   ├── user_profile.py
│   │   │   ├── preferences.py
│   │   │   ├── domain_knowledge.py
│   │   │   ├── pattern_learner.py
│   │   │   └── historical_analyzer.py
│   │   ├── retrieval/
│   │   │   ├── __init__.py
│   │   │   ├── semantic_search.py
│   │   │   ├── relevance_ranker.py
│   │   │   └── context_builder.py
│   │   └── learning/
│   │       ├── __init__.py
│   │       ├── pattern_extractor.py
│   │       ├── feedback_processor.py
│   │       └── adaptation_engine.py
│   │
│   ├── state/
│   │   ├── __init__.py
│   │   ├── state_manager.py
│   │   ├── state_schema.py
│   │   ├── version_manager.py
│   │   ├── persistence/
│   │   │   ├── __init__.py
│   │   │   ├── database_adapter.py
│   │   │   ├── object_storage_adapter.py
│   │   │   └── cache_adapter.py
│   │   └── serialization/
│   │       ├── __init__.py
│   │       ├── json_serializer.py
│   │       └── compression.py
│   │
│   ├── trace/
│   │   ├── __init__.py
│   │   ├── trace_logger.py
│   │   ├── decision_recorder.py
│   │   ├── trace_schema.py
│   │   ├── analytics/
│   │   │   ├── __init__.py
│   │   │   ├── aggregator.py
│   │   │   ├── pattern_detector.py
│   │   │   └── performance_analyzer.py
│   │   └── query/
│   │       ├── __init__.py
│   │       ├── trace_query_engine.py
│   │       └── visualization_builder.py
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── tool_registry.py
│   │   ├── tool_selector.py
│   │   ├── base_tool.py
│   │   ├── document/
│   │   │   ├── __init__.py
│   │   │   ├── generator.py
│   │   │   ├── search.py
│   │   │   └── summarizer.py
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── metrics_analyzer.py
│   │   │   ├── data_processor.py
│   │   │   └── chart_generator.py
│   │   ├── web/
│   │   │   ├── __init__.py
│   │   │   ├── web_search.py
│   │   │   └── web_scraper.py
│   │   ├── pdf/
│   │   │   ├── __init__.py
│   │   │   ├── pdf_generator.py
│   │   │   └── pdf_parser.py
│   │   └── custom/
│   │       ├── __init__.py
│   │       └── custom_tool_loader.py
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── groq_client.py
│   │   ├── prompt_builder.py
│   │   ├── response_parser.py
│   │   ├── token_counter.py
│   │   ├── retry_handler.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── model_config.py
│   │       └── model_selector.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── app.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── authentication.py
│   │   │   ├── rate_limiting.py
│   │   │   ├── logging.py
│   │   │   └── error_handler.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── tasks.py
│   │   │   ├── state.py
│   │   │   ├── artifacts.py
│   │   │   ├── trace.py
│   │   │   ├── memory.py
│   │   │   └── health.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── task_schemas.py
│   │   │   ├── state_schemas.py
│   │   │   ├── artifact_schemas.py
│   │   │   ├── trace_schemas.py
│   │   │   └── memory_schemas.py
│   │   └── dependencies/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       └── database.py
│   │
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── artifact_store.py
│   │   ├── s3_adapter.py
│   │   ├── local_storage.py
│   │   └── cleanup_manager.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       ├── validators.py
│       ├── serializers.py
│       ├── time_utils.py
│       ├── id_generator.py
│       └── metrics.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   │
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_planner/
│   │   │   ├── __init__.py
│   │   │   ├── test_goal_parser.py
│   │   │   ├── test_step_generator.py
│   │   │   └── test_plan_validator.py
│   │   ├── test_executor/
│   │   │   ├── __init__.py
│   │   │   ├── test_step_runner.py
│   │   │   ├── test_tool_orchestrator.py
│   │   │   └── test_artifact_manager.py
│   │   ├── test_memory/
│   │   │   ├── __init__.py
│   │   │   ├── test_short_term.py
│   │   │   ├── test_long_term.py
│   │   │   └── test_retrieval.py
│   │   ├── test_state/
│   │   │   ├── __init__.py
│   │   │   ├── test_state_manager.py
│   │   │   └── test_version_manager.py
│   │   ├── test_trace/
│   │   │   ├── __init__.py
│   │   │   ├── test_logger.py
│   │   │   └── test_analytics.py
│   │   └── test_tools/
│   │       ├── __init__.py
│   │       └── test_tool_registry.py
│   │
│   ├── integration/
│   │   ├── __init__.py
│   │   ├── test_end_to_end_workflow.py
│   │   ├── test_task_continuation.py
│   │   ├── test_error_recovery.py
│   │   ├── test_memory_learning.py
│   │   └── test_api_endpoints.py
│   │
│   ├── fixtures/
│   │   ├── __init__.py
│   │   ├── sample_tasks.py
│   │   ├── sample_plans.py
│   │   ├── sample_artifacts.py
│   │   └── sample_user_data.py
│   │
│   └── performance/
│       ├── __init__.py
│       ├── test_token_usage.py
│       ├── test_latency.py
│       └── load_test.py
│
├── monitoring/
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── system_overview.json
│   │   │   ├── task_metrics.json
│   │   │   └── llm_usage.json
│   │   └── provisioning/
│   │       └── datasources.yaml
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── alerts/
│       ├── task_failure_alerts.yaml
│       └── performance_alerts.yaml
│
├── infrastructure/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── modules/
│   │   │   ├── database/
│   │   │   ├── storage/
│   │   │   ├── compute/
│   │   │   └── networking/
│   │   └── environments/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── production/
│   ├── kubernetes/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── configmap.yaml
│   │   │   └── secrets.yaml
│   │   ├── overlays/
│   │   │   ├── development/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── helm/
│   │       └── stateful-agent/
│   │           ├── Chart.yaml
│   │           ├── values.yaml
│   │           └── templates/
│   └── docker/
│       ├── api.Dockerfile
│       ├── worker.Dockerfile
│       └── nginx.conf
│
├── data/
│   ├── migrations/
│   ├── seeds/
│   └── schemas/
│       ├── state_schema.json
│       ├── trace_schema.json
│       ├── memory_schema.json
│       └── artifact_schema.json
│
├── artifacts/
│   ├── .gitkeep
│   └── README.md
│
├── logs/
│   ├── .gitkeep
│   └── README.md
│
└── examples/
    ├── basic_task_creation.py
    ├── task_continuation.py
    ├── custom_tool_integration.py
    ├── memory_customization.py
    └── trace_analysis.py
```

## Key Directory Purposes

### `/src/core/`
Foundation modules with shared types, exceptions, constants, and configuration management.

### `/src/orchestration/`
High-level coordination layer that manages task lifecycle, routing, and validation.

### `/src/planner/`
Goal decomposition and structured plan generation using Groq LLM with specialized prompts.

### `/src/executor/`
Step-by-step execution engine with tool orchestration and artifact management.

### `/src/reviewer/`
Quality assurance and output validation against success criteria.

### `/src/memory/`
Two-layer memory system:
- **short_term/**: Task-scoped context and working memory
- **long_term/**: User preferences, domain knowledge, historical patterns
- **retrieval/**: Semantic search and context building
- **learning/**: Pattern extraction and adaptation

### `/src/state/`
State management with versioning, persistence adapters, and serialization.

### `/src/trace/`
Decision logging, analytics, and queryable trace system.

### `/src/tools/`
Tool registry and integrations for various capabilities (document generation, data analysis, web search, PDF processing).

### `/src/llm/`
Groq client integration with prompt building, response parsing, token tracking, and retry logic.

### `/src/api/`
FastAPI application with RESTful endpoints, middleware, schemas, and dependencies.

### `/src/storage/`
Artifact storage abstraction (S3, local filesystem) with cleanup management.

### `/tests/`
Comprehensive test suite:
- **unit/**: Module-level tests
- **integration/**: End-to-end workflows
- **performance/**: Token usage and latency benchmarks

### `/monitoring/`
Observability stack with Grafana dashboards, Prometheus metrics, and alerting.

### `/infrastructure/`
Infrastructure as Code:
- **terraform/**: Cloud resource provisioning
- **kubernetes/**: Container orchestration
- **docker/**: Container definitions

### `/data/`
Database schemas, migrations, and seed data.

### `/docs/`
Comprehensive documentation including architecture diagrams, API specs, guides, and examples.

## Configuration Files

- **`.env.example`**: Environment variable template
- **`docker-compose.yml`**: Local development stack
- **`requirements.txt`**: Python dependencies
- **`pyproject.toml`**: Modern Python project configuration
- **`config/*.yaml`**: Environment-specific configurations

## Next Steps

1. Initialize Python virtual environment
2. Install dependencies from `requirements.txt`
3. Set up database (MongoDB/PostgreSQL)
4. Configure Groq API credentials
5. Run database migrations
6. Start development server

## Technology Stack

- **LLM Provider**: Groq (replacing OpenAI)
- **API Framework**: FastAPI
- **Database**: MongoDB (state) + PostgreSQL (relational data)
- **Object Storage**: S3-compatible (MinIO for local dev)
- **Cache**: Redis
- **Message Queue**: Kafka (for trace logging)
- **Monitoring**: Prometheus + Grafana
- **Container Orchestration**: Kubernetes
- **IaC**: Terraform