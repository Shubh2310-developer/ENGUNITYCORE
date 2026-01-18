from typing import List, Dict, Optional
import httpx
import certifi
from loguru import logger
import os

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
            logger.warning("Web search API key not provided, skipping web search")
            return []

        if self.provider == "tavily":
            return await self._search_tavily(query, max_results)
        else:
            logger.warning(f"Unsupported web search provider: {self.provider}")
            return []

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
                        }
                    })
                return results
        except Exception as e:
            logger.error(f"Error in Tavily search: {e}")
            return []
