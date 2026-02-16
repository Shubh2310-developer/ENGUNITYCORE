# 📊 Agent 04: AI Data Analysis Agent

> **Priority:** ⭐⭐⭐⭐ Tier 1 | **Effort:** 3-4 days | **Framework:** Google ADK

---

## 1. Overview

A **conversational data analysis agent** that turns natural language queries into insights from your analytics data. "Ask your data" interface with auto-generated charts.

**Why:** You have `analytics_complete.py` (35KB), charts components (9 files), and MongoDB — but users can't query data conversationally.

### Existing Infrastructure

| Component | File |
|-----------|------|
| Analytics API | `backend/app/api/v1/analytics_complete.py` (35KB) |
| Analytics Service | `backend/app/services/analytics/` (3 files) |
| Charts UI | `frontend/src/components/charts/` (9 files) |
| MongoDB | `backend/app/core/mongodb.py` |
| Analytics Schemas | `backend/app/schemas/analytics.py` (8KB) |

---

## 2. Architecture

```
┌──────────────────────────────────────────────┐
│          DATA ANALYSIS AGENT                  │
│                                                │
│  User: "Show me my most active coding days"   │
│              │                                 │
│     ┌────────▼────────┐                        │
│     │ NL-to-Query     │ Gemini/Groq LLM       │
│     │ Translator      │                        │
│     └────────┬────────┘                        │
│              │ Generated MongoDB query         │
│     ┌────────▼────────┐                        │
│     │ Query Executor  │ Sandboxed execution    │
│     │ + Validator     │ with safety checks     │
│     └────────┬────────┘                        │
│              │ Raw data                        │
│     ┌────────▼────────┐                        │
│     │ Insight Engine  │ Trend detection,       │
│     │                 │ anomaly alerts,        │
│     │                 │ predictions            │
│     └────────┬────────┘                        │
│              │                                 │
│     ┌────────▼────────┐                        │
│     │ Chart Generator │ Auto-select chart type │
│     │                 │ Line/Bar/Pie/Heatmap   │
│     └────────┬────────┘                        │
│              │                                 │
│     ┌────────▼────────┐                        │
│     │ Natural Language│ Plain English summary  │
│     │ Response        │ with embedded chart    │
│     └─────────────────┘                        │
└──────────────────────────────────────────────┘
```

---

## 3. Data Models — `backend/app/schemas/data_analysis_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AnalysisType(str, Enum):
    TREND = "trend"
    COMPARISON = "comparison"
    DISTRIBUTION = "distribution"
    ANOMALY = "anomaly"
    PREDICTION = "prediction"
    SUMMARY = "summary"

class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    SCATTER = "scatter"
    HEATMAP = "heatmap"
    AREA = "area"

class DataAnalysisRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=1000)
    time_range: Optional[str] = "30d"  # 7d, 30d, 90d, 1y, all
    data_source: str = "analytics"  # analytics, chat, code, documents

class DataInsight(BaseModel):
    insight_type: str  # "trend", "anomaly", "peak", "correlation"
    title: str
    description: str
    confidence: float = Field(ge=0, le=1)
    data_points: Optional[List[Dict[str, Any]]] = None

class ChartConfig(BaseModel):
    chart_type: ChartType
    title: str
    x_label: str
    y_label: str
    data: List[Dict[str, Any]]
    colors: Optional[List[str]] = None

class DataAnalysisResponse(BaseModel):
    query: str
    analysis_type: AnalysisType
    summary: str  # Plain English answer
    insights: List[DataInsight]
    chart: Optional[ChartConfig] = None
    raw_data: Optional[List[Dict[str, Any]]] = None
    suggested_queries: List[str]
    processing_time: float
```

---

## 4. Backend — `backend/app/agents/data_analysis_agent.py`

```python
import json, time
from typing import Dict, Any, List, Optional
from loguru import logger
from app.services.ai.groq_client import groq_client
from app.core.mongodb import get_database

class DataAnalysisAgent:
    # Collections the agent can query
    ALLOWED_COLLECTIONS = [
        "analytics_events", "chat_sessions", "code_executions",
        "documents", "user_activity", "research_queries"
    ]

    async def analyze(self, query: str, user_id: str, time_range: str = "30d") -> Dict:
        start = time.time()
        
        # Step 1: Translate NL to MongoDB query
        mongo_query = await self._nl_to_query(query, time_range)
        
        # Step 2: Execute safely
        data = await self._execute_query(mongo_query, user_id)
        
        # Step 3: Generate insights
        insights = await self._generate_insights(query, data)
        
        # Step 4: Auto-select and configure chart
        chart = await self._generate_chart_config(query, data)
        
        # Step 5: Natural language summary
        summary = await self._summarize(query, data, insights)
        
        return {
            "query": query,
            "summary": summary,
            "insights": insights,
            "chart": chart,
            "raw_data": data[:100],
            "suggested_queries": await self._suggest_follow_ups(query),
            "processing_time": time.time() - start
        }

    async def _nl_to_query(self, query: str, time_range: str) -> Dict:
        prompt = f"""Translate this natural language query to a MongoDB aggregation pipeline.
Query: "{query}"
Time range: {time_range}
Available collections: {self.ALLOWED_COLLECTIONS}

Return JSON: {{"collection": "name", "pipeline": [...]}}
Return ONLY valid JSON. Use $match, $group, $sort, $project, $limit stages."""

        response = await groq_client.get_completion([
            {"role": "system", "content": "MongoDB expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        start = response.find('{')
        end = response.rfind('}') + 1
        return json.loads(response[start:end])

    async def _execute_query(self, mongo_query: Dict, user_id: str) -> List:
        """Safely execute MongoDB aggregation with user scoping"""
        db = get_database()
        collection_name = mongo_query.get("collection", "analytics_events")
        
        if collection_name not in self.ALLOWED_COLLECTIONS:
            return []
        
        pipeline = mongo_query.get("pipeline", [])
        # Force user scoping for security
        pipeline.insert(0, {"$match": {"user_id": user_id}})
        # Limit results
        pipeline.append({"$limit": 1000})
        
        try:
            collection = db[collection_name]
            results = await collection.aggregate(pipeline).to_list(1000)
            return [{k: v for k, v in doc.items() if k != '_id'} for doc in results]
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return []

    async def _generate_insights(self, query: str, data: List) -> List:
        if not data:
            return [{"insight_type": "info", "title": "No Data", 
                     "description": "No data found for this query", "confidence": 0}]
        
        prompt = f"""Analyze this data and extract insights.
Query: {query}
Data (first 20 rows): {json.dumps(data[:20], default=str)}

Return JSON array of insights: [{{"insight_type": "trend|anomaly|peak|correlation",
"title": "...", "description": "...", "confidence": 0.0-1.0}}]"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Data analyst. Return only valid JSON array."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('['):response.rfind(']')+1])

    async def _generate_chart_config(self, query: str, data: List) -> Optional[Dict]:
        if not data or len(data) < 2:
            return None
        
        prompt = f"""What's the best chart type for this query and data?
Query: {query}
Data sample: {json.dumps(data[:5], default=str)}

Return JSON: {{"chart_type": "line|bar|pie|scatter|heatmap|area",
"title": "...", "x_label": "...", "y_label": "...",
"data": [{{"x": "...", "y": 0}}]}}"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Data visualization expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def _summarize(self, query: str, data: List, insights: List) -> str:
        prompt = f"""Summarize this data analysis in plain English (2-3 sentences).
Query: {query}  |  Data points: {len(data)}
Insights: {json.dumps(insights[:3], default=str)}"""
        return await groq_client.get_completion([{"role": "user", "content": prompt}])

    async def _suggest_follow_ups(self, query: str) -> List[str]:
        prompt = f"""Suggest 3 follow-up data analysis questions based on: {query}
Return JSON array: ["q1", "q2", "q3"]"""
        response = await groq_client.get_completion([{"role": "user", "content": prompt}])
        return json.loads(response[response.find('['):response.rfind(']')+1])

data_analysis_agent = DataAnalysisAgent()
```

### API — `backend/app/api/v1/analytics_complete.py` addition

```python
@router.post("/ask")
async def ask_data(request: DataAnalysisRequest, current_user = Depends(get_current_user)):
    return await data_analysis_agent.analyze(request.query, str(current_user.id), request.time_range)
```

---

## 5. Frontend — `frontend/src/components/charts/DataAnalysisChat.tsx`

```tsx
'use client';
import React, { useState } from 'react';

export default function DataAnalysisChat() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const askData = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/analytics/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ query, time_range: '30d' }),
    });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div>
      <h2>📊 Ask Your Data</h2>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g., Show my coding activity this week" />
      <button onClick={askData} disabled={loading}>{loading ? 'Analyzing...' : 'Ask'}</button>
      {result && (
        <div>
          <p><strong>Summary:</strong> {result.summary}</p>
          {result.chart && <div>{/* Render chart using existing chart components */}</div>}
          <h4>Insights</h4>
          {result.insights?.map((i: any, idx: number) => (
            <div key={idx}><strong>{i.title}</strong>: {i.description}</div>
          ))}
          <h4>Try next:</h4>
          {result.suggested_queries?.map((q: string, i: number) => (
            <button key={i} onClick={() => setQuery(q)}>{q}</button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/data_analysis_agent.py` |
| **NEW** | `backend/app/agents/data_analysis_agent.py` |
| **MODIFY** | `backend/app/api/v1/analytics_complete.py` — add `/ask` |
| **NEW** | `frontend/src/components/charts/DataAnalysisChat.tsx` |
| **MODIFY** | `frontend/src/app/(dashboard)/analytics/page.tsx` |
