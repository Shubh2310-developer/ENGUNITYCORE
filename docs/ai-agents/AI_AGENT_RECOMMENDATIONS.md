# 🤖 AI Agent Recommendations for Engunity

> **Last Updated:** February 10, 2026  
> **Based on:** Full codebase scan of all files/folders  
> **Platform:** Full-stack AI-powered Engineering Education & Productivity Suite  
> **Stack:** Next.js + FastAPI + MongoDB + Supabase + Blockchain (Solidity/Hardhat)

---

## 📊 Existing Feature Map

| Module | Key Capabilities | Files |
|--------|-----------------|-------|
| **OmniRAG Pipeline** | HyDE, reranking, GraphRAG, recursive reasoning, web search, density control, quality metrics | `backend/app/services/rag/` (17 files) |
| **Multi-Modal Vision** | CLIP embeddings, YOLOv8 object detection, OCR with layout, spatial queries | `backend/app/services/ai/vision_processor.py`, `image_processor.py` |
| **Decision Vault** | Adversarial AI bias detection (12 cognitive bias types), structured decision tracking | `backend/app/services/ai/decision_ai.py` |
| **Code Lab** | Multi-language code execution, terminal WebSocket, code review | `backend/app/services/code_execution/`, `code_executor/` |
| **Job Prep** | Target roles, skill tracking, evidence management, readiness scoring | `backend/app/services/jobprep/`, `schemas/jobprep.py` (352 lines) |
| **Chat** | Streaming LLM with Gemini/Groq, session memory, context-aware | `backend/app/services/chat/`, `api/v1/chat.py` |
| **GitHub Integration** | Repo analysis, OAuth, code insights | `backend/app/services/github/` (6 files) |
| **Analytics** | Usage tracking, dashboards, data visualization | `backend/app/services/analytics/`, `api/v1/analytics_complete.py` (35KB) |
| **Document Processing** | Upload, parsing, chunking, vector indexing | `backend/app/services/document/` |
| **Memory** | Persistent conversation memory, user context | `backend/app/services/memory/` |
| **Blockchain** | Identity, Marketplace, Provenance smart contracts | `blockchain/contracts/` |
| **Agents (stubs)** | `code_review_agent.py`, `planner_agent.py`, `research_agent.py` | `backend/app/agents/` (all empty) |

---

## 🎯 12 Recommended AI Agents

### 🏆 Tier 1 — High Impact, Direct Feature Enhancement

| # | Agent | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 1 | [🔍 AI Deep Research Agent](./01_AI_DEEP_RESEARCH_AGENT.md) | ⭐⭐⭐⭐⭐ | 2-3 days | RAG pipeline ready |
| 2 | [💻 Multimodal Coding Agent Team](./02_MULTIMODAL_CODING_AGENT_TEAM.md) | ⭐⭐⭐⭐⭐ | 3-5 days | Code Lab ready |
| 3 | [🤝 AI Career Consultant Agent](./03_AI_CAREER_CONSULTANT_AGENT.md) | ⭐⭐⭐⭐⭐ | 3-5 days | Job Prep schemas ready |
| 4 | [📊 AI Data Analysis Agent](./04_AI_DATA_ANALYSIS_AGENT.md) | ⭐⭐⭐⭐ | 3-4 days | Analytics ready |

### 🥈 Tier 2 — Strategic New Value

| # | Agent | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 5 | [🧠 AI Mental Wellbeing Agent](./05_AI_MENTAL_WELLBEING_AGENT.md) | ⭐⭐⭐⭐ | 2-3 days | Low effort |
| 6 | [📑 AI Meeting Agent](./06_AI_MEETING_AGENT.md) | ⭐⭐⭐ | 4-6 days | Moderate effort |
| 7 | [🏗️ AI System Architect Agent](./07_AI_SYSTEM_ARCHITECT_AGENT.md) | ⭐⭐⭐⭐ | 5-7 days | Needs KB |
| 8 | [🔬 AI Research Planner & Executor](./08_AI_RESEARCH_PLANNER_EXECUTOR.md) | ⭐⭐⭐⭐ | 5-7 days | Builds on Agent 1 |

### 🥉 Tier 3 — Advanced & Experimental

| # | Agent | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 9 | [🧬 AI Self-Evolving Agent](./09_AI_SELF_EVOLVING_AGENT.md) | ⭐⭐⭐⭐⭐ | 7-10 days | Needs feedback loop |
| 10 | [📀 Agentic RAG with Reasoning](./10_AGENTIC_RAG_WITH_REASONING.md) | ⭐⭐⭐⭐ | 4-6 days | Components exist |
| 11 | [👨‍🏫 AI Teaching Agent Team](./11_AI_TEACHING_AGENT_TEAM.md) | ⭐⭐⭐⭐⭐ | 7-10 days | Flagship feature |
| 12 | [🌐 Browser Automation MCP Agent](./12_BROWSER_AUTOMATION_MCP_AGENT.md) | ⭐⭐⭐ | 5-7 days | Needs infra |

---

## 🗺️ Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  🎯 DO FIRST      │  📋 PLAN NEXT     │
    │                   │                   │
    │  1. Deep Research │  8. Research      │
    │  2. Coding Team   │     Planner       │
    │  3. Consultant    │  11. Teaching     │
    │  4. Data Analysis │      Team         │
    │                   │                   │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT│                 │                   │ EFFORT
    │  ✅ QUICK WINS    │  🔬 EXPERIMENT    │
    │                   │                   │
    │  5. Wellbeing     │  9. Self-Evolving │
    │  10. Agentic RAG  │  12. Browser MCP  │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

---

## 🔧 Framework Recommendations

| Framework | Best For | Why |
|-----------|----------|-----|
| **Google ADK** | Agents 1, 3, 4, 8 | Native Gemini integration (already using `gemini_client.py`) |
| **LangGraph** | Agents 2, 10, 11 | Complex multi-step workflows with state machines |
| **CrewAI** | Agent 11 (Teaching Team) | Multi-agent team orchestration |
| **OpenAI Agents SDK** | Agents 5, 6 | Simple single-agent tasks with structured outputs |

> **Recommended starting framework:** Google ADK — you already have Gemini integrated.

---

## 🚫 Agents NOT Recommended

| Agent | Reason |
|-------|--------|
| 🎵 Music Generator | No audio infrastructure |
| 😂 Meme Generator | Off-brand for professional education |
| 🎙️ Blog to Podcast | No audio pipeline |
| ❤️‍🩹 Breakup Recovery | Completely off-domain |
| 🏚️ Home Renovation | No relevance |
| 🎬 Movie Production | No media infrastructure |
| ♜ Chess/Tic-Tac-Toe | Don't align with education mission |
| 🏠 Real Estate | Off-domain |

---

## 📁 Documentation Structure

```
docs/ai-agents/
├── AI_AGENT_RECOMMENDATIONS.md     ← You are here
├── 01_AI_DEEP_RESEARCH_AGENT.md
├── 02_MULTIMODAL_CODING_AGENT_TEAM.md
├── 03_AI_CAREER_CONSULTANT_AGENT.md
├── 04_AI_DATA_ANALYSIS_AGENT.md
├── 05_AI_MENTAL_WELLBEING_AGENT.md
├── 06_AI_MEETING_AGENT.md
├── 07_AI_SYSTEM_ARCHITECT_AGENT.md
├── 08_AI_RESEARCH_PLANNER_EXECUTOR.md
├── 09_AI_SELF_EVOLVING_AGENT.md
├── 10_AGENTIC_RAG_WITH_REASONING.md
├── 11_AI_TEACHING_AGENT_TEAM.md
└── 12_BROWSER_AUTOMATION_MCP_AGENT.md
```

---

**Maintained By:** Engunity Engineering Team  
**Status:** ✅ Complete
