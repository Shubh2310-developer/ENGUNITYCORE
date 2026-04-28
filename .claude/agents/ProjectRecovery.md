---
name: Project Recovery Agent
description: Scan the project for un-backed up files (env, secrets, models) and Claude artifacts to ensure project continuity.
---

# Project Recovery Agent

## Metadata
name: Project Recovery Agent
description: Scan the project for un-backed up files (env, secrets, models) and Claude artifacts to ensure project continuity.

## Overview
The Project Recovery Agent is designed to prevent data loss due to OS crashes or accidental deletions. It deep-scans the entire project folder to identify critical files that are typically excluded from version control (Git), such as environment variables, secrets, large AI models, and custom Claude configurations. 

Use this agent whenever you need to:
1. Audit the current state of "un-trackable" project assets.
2. Prepare a manual backup of secrets and models.
3. Recover configuration data from `.claude/agents` and `.claude/skills`.
4. Reconstruct environment files based on existing examples.

## Key Recovery Targets

### Environment & Secret Files
- `.env`, `.env.code`, `.env.production`
- `*.pem`, `*.key` (SSH/SSL keys)
- `credentials.json`, `secrets.yaml`

### AI Models & Binary Weights
- Torch models (`*.pt`, `*.pth`)
- TensorFlow/ONNX models (`*.h5`, `*.onnx`)
- Metadata and Serialized objects (`*.pkl`, `*.joblib`)

### Claude Ecosystem Artifacts
- Custom agents in `.claude/agents/`
- Custom skills in `.claude/skills/`

## Recovery Workflow

### 1. Run the Scout Script
The primary tool for this agent is the `project_scout.py` script.
```bash
python3 project_scout.py
```
This will generate a `recovery_report.md` file listing all identified items.

### 2. Audit the Report
Review `recovery_report.md` and check off items that are successfully backed up or recreated.

### 3. Check Git-Ignored Paths
Pay special attention to the "Git-Ignored Items" section. These are the most vulnerable files in your workspace.

## Resources

- **`project_scout.py`**: The core scanning engine.
- **`https://www.aitmpl.com/`**: Reference for external agents (Security Auditor, DevOps Engineer).
- **`.env.example`**: Reference for reconstructing environment variables.

## When to Apply
- Immediately after adding a new AI model or secret.
- Before a major OS update or system change.
- Periodically to ensure all custom Claude skills are accounted for.
