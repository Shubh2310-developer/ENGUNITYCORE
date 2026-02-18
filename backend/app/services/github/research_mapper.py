from typing import Dict, Any, List
from app.services.ai.groq_client import groq_client
from app.core.config import settings

class ResearchMapper:
    def __init__(self):
        self.model = "llama-3.1-70b-versatile"

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
            response = await groq_client.get_completion(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                model=self.model
            )

            # Clean potential markdown formatting
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = json.loads(response)

            return result.get("papers", [])
        except Exception as e:
            print(f"Error mapping research papers: {e}")
            return []

research_mapper = ResearchMapper()
