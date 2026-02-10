# Detailed Project File Structure

```text
Engunity/
├── ai-core/
│   ├── embeddings/
│   │   ├── cache.py
│   │   ├── generator.py
│   │   └── __init__.py
│   ├── evaluation/
│   │   ├── accuracy.py
│   │   ├── hallucination.py
│   │   ├── latency.py
│   │   └── __init__.py
│   ├── llm/
│   │   ├── prompts/
│   │   │   └── __init__.py
│   │   ├── templates/
│   │   │   └── __init__.py
│   │   ├── response_validators.py
│   │   └── __init__.py
│   ├── pipelines/
│   │   ├── chat_pipeline.py
│   │   ├── document_pipeline.py
│   │   ├── research_pipeline.py
│   │   └── __init__.py
│   ├── rag/
│   │   ├── faiss_store/
│   │   │   └── __init__.py
│   │   ├── chunking.py
│   │   ├── reranker.py
│   │   ├── retriever.py
│   │   └── __init__.py
│   └── __init__.py
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── code_review_agent.py
│   │   │   ├── planner_agent.py
│   │   │   ├── research_agent.py
│   │   │   └── __init__.py
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── analytics.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── chat.py
│   │   │   │   ├── code.py
│   │   │   │   ├── documents.py
│   │   │   │   ├── research.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   ├── rate_limit.py
│   │   │   ├── security.py
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── cache.py
│   │   │   │   ├── groq_client.py
│   │   │   │   ├── phi2_local.py
│   │   │   │   ├── router.py
│   │   │   │   └── __init__.py
│   │   │   ├── billing/
│   │   │   │   └── __init__.py
│   │   │   ├── code_execution/
│   │   │   │   └── __init__.py
│   │   │   ├── document/
│   │   │   │   ├── service.py
│   │   │   │   └── __init__.py
│   │   │   ├── storage/
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── utils/
│   │   │   └── __init__.py
│   │   ├── workers/
│   │   │   └── __init__.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── blockchain/
│   ├── contracts/
│   │   ├── Identity.sol
│   │   ├── Marketplace.sol
│   │   └── Provenance.sol
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
├── docs/
│   ├── architecture/
│   │   ├── auth_integration.md
│   │   ├── dashboard_research.md
│   │   ├── overview.md
│   │   └── rag_research.md
│   ├── cheat sheets/
│   │   └── All_cheat_sheet.pdf
│   ├── papers/
│   │   ├── 2506.00054v1.pdf
│   │   ├── 2507.18910v1.pdf
│   │   ├── 2510.04905v1.pdf
│   │   ├── applsci-15-04234-v2.pdf
│   │   ├── Implementation_of_Retrieval-Augmented_Generation_R.pdf
│   │   ├── Untitled 1.odt
│   │   └── Untitled 2.odt
│   ├── ai-design.md
│   ├── api.md
│   ├── architecture.md
│   ├── onboarding.md
│   ├── scaling.md
│   └── security.md
├── frontend/
│   ├── public/
│   │   ├── AICODEANDCHAT.jpeg
│   │   ├── BENTO.jpeg
│   │   ├── ClincialCodeAsistant.jpeg
│   │   ├── DocumentRAG.jpeg
│   │   ├── HERO.jpeg
│   │   ├── Hero1.jpeg
│   │   └── Logo1.jpg
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reset-password/
│   │   │   │       └── page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── chat/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── code/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── documents/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notebook/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── research/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── api/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   ├── editors/
│   │   │   ├── illustrations/
│   │   │   │   └── index.tsx
│   │   │   ├── shared/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── constants.ts
│   │   │   └── permissions.ts
│   │   ├── services/
│   │   ├── stores/
│   │   └── styles/
│   ├── next-env.d.ts
│   ├── next.config.mjs
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package-lock.json
│   └── package.json
├── infra/
│   ├── ci/
│   │   └── github-actions.yml
│   ├── monitoring/
│   │   ├── grafana/
│   │   └── prometheus.yml
│   └── nginx/
├── scripts/
│   ├── deploy/
│   ├── dev/
│   ├── maintenance/
│   └── setup/
├── docker-compose.yml
├── .env.example
├── Makefile
├── Readme.md
└── Filestructure.md
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
