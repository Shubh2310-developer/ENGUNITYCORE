from typing import List, Dict, Optional
import httpx
import certifi
from loguru import logger
import os
import asyncio

class WebSearchFallback:
    """
    Fallback to web search when internal retrieval is insufficient
    """

    def __init__(self, api_key: str = None, provider: str = "tavily"):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY")
        self.provider = provider

    async def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Execute web search
        """
        if not self.api_key:
            logger.warning("Web search API key not provided, using MOCK data for testing")
            return self._mock_search(query, max_results)

        if self.provider == "tavily":
            return await self._search_tavily(query, max_results)
        else:
            logger.warning(f"Unsupported web search provider: {self.provider}")
            return []

    def _mock_search(self, query: str, max_results: int) -> List[Dict]:
        """
        Return mock results for testing when no API key is present
        """
        results = []
        # Generate varied content to simulate different sources
        for i in range(max_results):
            results.append({
                "content": f"Mock search result {i+1} for query '{query}'. This is a simulated content snippet containing relevant terminology to the query. It discusses key aspects of {query} including factor A, factor B, and the latest research findings from 2024. The implications are significant for future studies.",
                "metadata": {
                    "title": f"Mock Source {i+1}: Analysis of {query}",
                    "url": f"https://example.com/mock-result-{i+1}",
                    "source": "web_search_mock",
                    "score": 0.95 - (i * 0.05)
                },
                # Flattened fields often used by the agent directly
                "source": f"Mock Source {i+1}",
                "url": f"https://example.com/mock-result-{i+1}",
                "snippet": f"Mock search result {i+1} for query '{query}'. This is a simulated content snippet containing relevant terminology to the query."
            })
        return results

    async def _search_tavily(self, query: str, max_results: int) -> List[Dict]:
        """
        Search using Tavily API
        """
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "smart",
            "max_results": max_results
        }

        try:
            async with httpx.AsyncClient(verify=certifi.where()) as client:
                response = await client.post(url, json=payload, timeout=10.0)
                response.raise_for_status()
                data = response.json()

                results = []
                for res in data.get("results", []):
                    results.append({
                        "content": res.get("content", ""),
                        "metadata": {
                            "title": res.get("title", ""),
                            "url": res.get("url", ""),
                            "source": "web_search",
                            "score": res.get("score", 0)
                        },
                        # Flatten for easier consumption
                        "source": res.get("title", ""),
                        "url": res.get("url", ""),
                        "snippet": res.get("content", "")
                    })
                return results
        except Exception as e:
            logger.error(f"Error in Tavily search: {e}")
            # Fallback to mock on error if configured? For now just empty.
            return []
