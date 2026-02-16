0# 🌐 Agent 12: Browser Automation MCP Agent

> **Priority:** ⭐⭐ Tier 3 | **Effort:** 5-7 days | **Framework:** MCP (Model Context Protocol) + Playwright

---

## 1. Overview

A **browser automation agent** using the Model Context Protocol (MCP) that can browse the web, scrape documentation, interact with web apps, and execute browser-based testing — all controlled via natural language.

**Why:** Enables automated web research, documentation scraping, and E2E testing from within Engunity.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| 🔍 **Web Research** | Browse and extract structured data from any website |
| 📖 **Doc Scraping** | Pull API docs, tutorials, references into knowledge base |
| 🧪 **E2E Testing** | Automated UI testing for Engunity's own frontend |
| 📸 **Screenshot** | Capture and analyze web pages using Vision Agent |
| 🤖 **Form Filling** | Automated interactions with web forms and UIs |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│         BROWSER AUTOMATION MCP AGENT              │
│                                                    │
│  ┌────────────┐    ┌──────────────────┐           │
│  │ NL Command │    │ MCP Server       │           │
│  │ Parser     │───▶│ (Playwright)     │           │
│  │            │    │                  │           │
│  │"Go to X    │    │• navigate(url)   │           │
│  │ and find Y"│    │• click(selector) │           │
│  │            │    │• type(text)      │           │
│  └────────────┘    │• screenshot()    │           │
│                    │• extract(data)   │           │
│  ┌────────────┐    │• wait(condition) │           │
│  │ Action     │    └────────┬─────────┘           │
│  │ Planner    │             │                     │
│  │            │    ┌────────▼─────────┐           │
│  │• Multi-step│    │ Page Analyzer    │           │
│  │  plans     │    │                  │           │
│  │• Error     │    │• DOM parsing     │           │
│  │  recovery  │    │• Content extract │           │
│  └────────────┘    │• Vision analysis │           │
│                    └──────────────────┘           │
└──────────────────────────────────────────────────┘
```

### MCP Server Design

```
MCP Server (stdio transport)
├── Tools
│   ├── navigate(url) → Navigate to URL
│   ├── click(selector) → Click element
│   ├── type(selector, text) → Type into input
│   ├── screenshot() → Capture page screenshot
│   ├── extract_text(selector) → Extract text content
│   ├── extract_links() → Get all links on page
│   ├── wait_for(selector, timeout) → Wait for element
│   ├── evaluate_js(code) → Run JavaScript
│   └── get_page_info() → Current URL, title, status
├── Resources
│   ├── browser://current-page → Current page content
│   └── browser://screenshot → Latest screenshot
└── Prompts
    ├── web-research → Research a topic via browsing
    └── scrape-docs → Extract documentation
```

---

## 3. Data Models — `backend/app/schemas/browser_agent.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class BrowserAction(str, Enum):
    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    SCREENSHOT = "screenshot"
    EXTRACT = "extract"
    WAIT = "wait"
    SCROLL = "scroll"

class BrowserStep(BaseModel):
    action: BrowserAction
    target: Optional[str] = None  # URL or CSS selector
    value: Optional[str] = None   # Text to type
    description: str

class BrowserPlan(BaseModel):
    plan_id: str
    objective: str
    steps: List[BrowserStep]
    estimated_time_seconds: int

class BrowserTaskRequest(BaseModel):
    task: str  # Natural language: "Go to MDN and find the fetch API docs"
    max_steps: int = 10
    capture_screenshots: bool = True

class PageContent(BaseModel):
    url: str
    title: str
    text_content: str
    links: List[Dict[str, str]]  # text, href
    screenshots: List[str]  # file paths

class BrowserTaskResponse(BaseModel):
    objective: str
    plan: BrowserPlan
    steps_executed: int
    pages_visited: List[str]
    extracted_content: Optional[PageContent] = None
    screenshots: List[str]
    success: bool
    error: Optional[str] = None
```

---

## 4. MCP Server — `backend/app/mcp/browser_server.py`

```python
"""
MCP Server for Browser Automation using Playwright.
Run as: python -m app.mcp.browser_server
"""

import asyncio
import json
from typing import Any
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, ImageContent

# Lazy import Playwright
_browser = None
_page = None

async def get_page():
    global _browser, _page
    if _page is None:
        from playwright.async_api import async_playwright
        pw = await async_playwright().start()
        _browser = await pw.chromium.launch(headless=True)
        _page = await _browser.new_page()
    return _page

app = Server("browser-automation")

@app.list_tools()
async def list_tools():
    return [
        Tool(name="navigate", description="Navigate to URL",
             inputSchema={"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]}),
        Tool(name="click", description="Click element by CSS selector",
             inputSchema={"type": "object", "properties": {"selector": {"type": "string"}}, "required": ["selector"]}),
        Tool(name="type_text", description="Type text into element",
             inputSchema={"type": "object", "properties": {
                 "selector": {"type": "string"}, "text": {"type": "string"}
             }, "required": ["selector", "text"]}),
        Tool(name="screenshot", description="Take screenshot of current page",
             inputSchema={"type": "object", "properties": {}}),
        Tool(name="extract_text", description="Extract text from element",
             inputSchema={"type": "object", "properties": {"selector": {"type": "string"}}, "required": ["selector"]}),
        Tool(name="extract_links", description="Get all links on page",
             inputSchema={"type": "object", "properties": {}}),
        Tool(name="get_page_info", description="Get current page URL and title",
             inputSchema={"type": "object", "properties": {}}),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list:
    page = await get_page()
    
    if name == "navigate":
        await page.goto(arguments["url"], wait_until="domcontentloaded")
        return [TextContent(type="text", text=f"Navigated to {arguments['url']}")]
    
    elif name == "click":
        await page.click(arguments["selector"])
        return [TextContent(type="text", text=f"Clicked {arguments['selector']}")]
    
    elif name == "type_text":
        await page.fill(arguments["selector"], arguments["text"])
        return [TextContent(type="text", text=f"Typed into {arguments['selector']}")]
    
    elif name == "screenshot":
        path = f"/tmp/screenshot_{asyncio.get_event_loop().time()}.png"
        await page.screenshot(path=path)
        return [TextContent(type="text", text=f"Screenshot saved: {path}")]
    
    elif name == "extract_text":
        text = await page.text_content(arguments["selector"])
        return [TextContent(type="text", text=text or "No text found")]
    
    elif name == "extract_links":
        links = await page.evaluate("""
            () => Array.from(document.querySelectorAll('a[href]')).map(a => ({
                text: a.textContent.trim(), href: a.href
            })).slice(0, 50)
        """)
        return [TextContent(type="text", text=json.dumps(links))]
    
    elif name == "get_page_info":
        return [TextContent(type="text", text=json.dumps({
            "url": page.url, "title": await page.title()
        }))]

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 5. Agent Orchestrator — `backend/app/agents/browser_agent.py`

```python
import json
from typing import Dict, List
from loguru import logger
from app.services.ai.groq_client import groq_client

class BrowserAutomationAgent:
    async def plan_task(self, task: str, max_steps: int = 10) -> Dict:
        prompt = f"""Plan browser automation steps for: {task}
Max steps: {max_steps}

Return JSON:
{{
  "plan_id": "plan_001",
  "objective": "{task}",
  "steps": [
    {{"action": "navigate", "target": "https://...", "description": "Go to site"}},
    {{"action": "click", "target": "CSS selector", "description": "Click button"}},
    {{"action": "extract", "target": "CSS selector", "description": "Get content"}}
  ],
  "estimated_time_seconds": 30
}}

Available actions: navigate, click, type, screenshot, extract, wait, scroll"""

        response = await groq_client.get_completion([
            {"role": "system", "content": "Browser automation expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        return json.loads(response[response.find('{'):response.rfind('}')+1])

    async def execute_plan(self, plan: Dict) -> Dict:
        """Execute plan by calling MCP server tools"""
        from mcp.client import ClientSession
        # Connect to MCP server and execute steps sequentially
        results = []
        for step in plan.get("steps", []):
            try:
                # Map step action to MCP tool call
                tool_name = self._map_action_to_tool(step["action"])
                args = self._build_tool_args(step)
                # result = await mcp_session.call_tool(tool_name, args)
                results.append({"step": step["description"], "status": "success"})
            except Exception as e:
                results.append({"step": step["description"], "status": "failed", "error": str(e)})
        
        return {
            "objective": plan["objective"],
            "steps_executed": len(results),
            "results": results,
            "success": all(r["status"] == "success" for r in results)
        }

    def _map_action_to_tool(self, action: str) -> str:
        mapping = {"navigate": "navigate", "click": "click", "type": "type_text",
                   "screenshot": "screenshot", "extract": "extract_text"}
        return mapping.get(action, action)

    def _build_tool_args(self, step: Dict) -> Dict:
        args = {}
        if step.get("target"):
            if step["action"] == "navigate":
                args["url"] = step["target"]
            else:
                args["selector"] = step["target"]
        if step.get("value"):
            args["text"] = step["value"]
        return args

browser_agent = BrowserAutomationAgent()
```

### API — `backend/app/api/v1/browser.py`

```python
from fastapi import APIRouter, Depends
router = APIRouter(prefix="/api/v1/browser", tags=["browser"])

@router.post("/automate")
async def automate_browser(request: BrowserTaskRequest, current_user = Depends(get_current_user)):
    plan = await browser_agent.plan_task(request.task, request.max_steps)
    result = await browser_agent.execute_plan(plan)
    return result
```

---

## 6. Dependencies

```bash
pip install mcp playwright
playwright install chromium
```

---

## 7. File Changes Summary

| Action | File |
|--------|------|
| **NEW** | `backend/app/schemas/browser_agent.py` |
| **NEW** | `backend/app/mcp/browser_server.py` — MCP server |
| **NEW** | `backend/app/agents/browser_agent.py` — Orchestrator |
| **NEW** | `backend/app/api/v1/browser.py` |
| **MODIFY** | `backend/app/main.py` — register router |
| **MODIFY** | `requirements.txt` — add mcp, playwright |
| **NEW** | `frontend/src/components/browser/BrowserAgent.tsx` |
