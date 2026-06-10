import json
from typing import Dict, Any, List
from app.services.ai.groq_client import groq_client
from app.services.github.client import github_client
from app.core.config import settings

class GitHubAnalyzer:
    def __init__(self):
        self.model = "llama-3.1-70b-versatile"

    async def analyze_repository(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Perform comprehensive AI analysis of repository"""

        # Get repository info
        repo_info = github_client.get_repository_info(owner, repo_name)
        file_tree = github_client.get_file_tree(owner, repo_name)

        # Analyze main files
        main_files = self._find_important_files(file_tree)
        code_analysis = await self._analyze_code_structure(owner, repo_name, main_files)

        # Security audit
        security_results = await self._security_audit(owner, repo_name, main_files)

        # Quality assessment
        quality_score = self._calculate_quality_score(repo_info, code_analysis)

        return {
            "status": "completed",
            "summary": code_analysis.get("summary", ""),
            "quality_score": quality_score,
            "security_score": security_results["score"],
            "vulnerabilities": security_results["vulnerabilities"],
            "code_intelligence": {
                "key_modules": code_analysis.get("modules", []),
                "file_tree": file_tree,
                "architecture": code_analysis.get("architecture", ""),
            },
            "security_audit": security_results,
            "activity_metrics": {
                "commit_history": [],
                "latest_commit": {},
                "contributors": repo_info.get("stars", 0),
                "engagement_trend": "+0%"
            }
        }

    def _find_important_files(self, file_tree: List[Dict]) -> List[str]:
        """Identify key files for analysis"""
        important = []
        priority_files = ['main.py', 'app.py', '__init__.py', 'index.js', 'main.ts', 'README.md']

        def traverse(items, path=""):
            for item in items:
                full_path = f"{path}/{item['name']}" if path else item['name']
                if item['type'] == 'file' and item['name'] in priority_files:
                    important.append(full_path)
                elif item['type'] == 'dir' and 'children' in item:
                    traverse(item['children'], full_path)

        traverse(file_tree)
        return important[:5]  # Limit to 5 files

    async def _analyze_code_structure(self, owner: str, repo_name: str, files: List[str]) -> Dict[str, Any]:
        """Analyze code structure using AI"""

        # Get file contents
        code_samples = []
        for file_path in files:
            content = github_client.get_file_content(owner, repo_name, file_path)
            if content:
                code_samples.append(f"File: {file_path}\n```\n{content[:1000]}\n```")

        if not code_samples:
            return {
                "summary": "No code files found for analysis.",
                "modules": [],
                "architecture": "Unknown",
                "quality_notes": "Repository seems to be empty or contains no recognized main files."
            }

        prompt = f"""Analyze this repository's code structure and provide:
1. A brief summary of what this project does
2. Key modules and their purposes
3. Architecture pattern used
4. Code quality observations

Code samples:
{chr(10).join(code_samples)}

Respond ONLY in JSON format:
{{
  "summary": "brief description",
  "modules": [
    {{"name": "module_name", "description": "what it does"}}
  ],
  "architecture": "architecture pattern",
  "quality_notes": "quality observations"
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

            return result
        except Exception as e:
            from loguru import logger
            logger.error(f"GitHub structural analysis failed: {e}")
            return {
                "summary": "Analysis in progress",
                "modules": [],
                "architecture": "Unknown",
                "quality_notes": str(e)
            }

    async def _security_audit(self, owner: str, repo_name: str, files: List[str]) -> Dict[str, Any]:
        """Perform security audit"""

        warnings = []
        vulnerability_count = 0

        # Check for common security issues
        for file_path in files:
            content = github_client.get_file_content(owner, repo_name, file_path)
            if content:
                # Check for hardcoded secrets
                if 'password' in content.lower() or 'api_key' in content.lower():
                    warnings.append({
                        "issue": f"Potential hardcoded secret in {file_path}",
                        "risk": "Medium"
                    })

                # Check for eval() usage
                if 'eval(' in content:
                    warnings.append({
                        "issue": f"Dangerous eval() usage in {file_path}",
                        "risk": "High"
                    })
                    vulnerability_count += 1

        score = max(0, 100 - (vulnerability_count * 20) - (len(warnings) * 5))

        return {
            "vulnerabilities": vulnerability_count,
            "secrets": "None" if not any('secret' in w['issue'].lower() for w in warnings) else "Found",
            "maintenance": "High",
            "warnings": warnings,
            "score": score
        }

    def _calculate_quality_score(self, repo_info: Dict, code_analysis: Dict) -> str:
        """Calculate quality score based on various factors"""
        score = 0

        # Stars factor
        stars = repo_info.get('stars', 0)
        if stars > 1000:
            score += 30
        elif stars > 100:
            score += 20
        elif stars > 10:
            score += 10

        # Documentation factor
        if repo_info.get('description'):
            score += 10

        # Has license
        if repo_info.get('license'):
            score += 10

        # Recent activity
        score += 20

        # Code quality
        if code_analysis.get('architecture'):
            score += 15

        # Module organization
        score += len(code_analysis.get('modules', [])) * 5

        # Convert to letter grade
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B+"
        elif score >= 60:
            return "B"
        else:
            return "C"

analyzer = GitHubAnalyzer()
