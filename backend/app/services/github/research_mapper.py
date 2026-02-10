import json
import os
from typing import Dict, Any, List
from groq import Groq
from app.core.config import settings

class ResearchMapper:
    def __init__(self):
        self._client = None
        self.model = "llama-3.1-70b-versatile"

    @property
    def client(self):
        if self._client is None:
            # Use single key or first from comma-separated list
            api_key = settings.GROQ_API_KEY
            if not api_key and settings.GROQ_API_KEYS:
                api_key = settings.GROQ_API_KEYS.split(',')[0].strip()

            if not api_key:
                raise ValueError("GROQ_API_KEY is not configured in .env")

            self._client = Groq(api_key=api_key)
        return self._client

    async def map_to_papers(self, repo_info: Dict, code_analysis: Dict) -> List[Dict]:
        """Map repository implementation to research papers"""

        prompt = f"""Given this repository:
Name: {repo_info['name']}
Description: {repo_info['description']}
Language: {repo_info['language']}
Topics: {', '.join(repo_info.get('topics', []))}

Key modules: {', '.join([m['name'] for m in code_analysis.get('modules', [])])}

Suggest 3-5 relevant research papers (with arXiv IDs if available) that this implementation might be based on or related to.
Focus on actual scientific or technical papers.

Respond ONLY in JSON format:
{{
  "papers": [
    {{
      "title": "Paper title",
      "arxiv_id": "2301.12345",
      "authors": "Author names",
      "year": 2023,
      "relevance": "Why this paper is relevant to this specific implementation",
      "mappings": [
        {{"file": "model.py", "line": 45, "symbol": "TransformerBlock"}}
      ]
    }}
  ]
}}
"""

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(completion.choices[0].message.content)
            return result.get("papers", [])
        except Exception as e:
            print(f"Error mapping research papers: {e}")
            return []

research_mapper = ResearchMapper()
