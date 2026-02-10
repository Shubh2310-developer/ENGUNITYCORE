from github import Github, GithubException
from typing import Optional, Dict, Any, List
from app.core.config import settings

class GitHubClient:
    def __init__(self, access_token: Optional[str] = None):
        """Initialize GitHub client with personal access token"""
        token = access_token or settings.GITHUB_TOKEN
        self.client = Github(token) if token else Github()

    def get_repository_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Fetch repository information from GitHub API"""
        try:
            repo = self.client.get_repo(f"{owner}/{repo_name}")

            return {
                "name": repo.name,
                "owner": owner,
                "description": repo.description or "",
                "language": repo.language or "Unknown",
                "lang_color": self._get_language_color(repo.language),
                "stars": repo.stargazers_count,
                "forks": repo.forks_count,
                "visibility": "Private" if repo.private else "Public",
                "last_updated": repo.updated_at.isoformat(),
                "repository_url": repo.html_url,
                "default_branch": repo.default_branch,
                "topics": repo.get_topics(),
                "license": repo.license.name if repo.license else None,
            }
        except GithubException as e:
            raise Exception(f"GitHub API error: {e.data.get('message', str(e))}")

    def get_file_tree(self, owner: str, repo_name: str, path: str = "", depth: int = 0, max_depth: int = 2) -> List[Dict[str, Any]]:
        """Fetch file tree from GitHub API recursively up to max_depth"""
        if depth > max_depth:
            return []

        try:
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            contents = repo.get_contents(path)

            tree = []
            for content in contents:
                item = {
                    "name": content.name,
                    "path": content.path,
                    "type": content.type,
                }
                if content.type == "dir" and depth < max_depth:
                    # Recursive call for subdirectories
                    item["children"] = self.get_file_tree(owner, repo_name, content.path, depth + 1, max_depth)
                elif content.type == "dir":
                    item["children"] = []
                tree.append(item)
            return tree
        except GithubException:
            return []

    def get_file_content(self, owner: str, repo_name: str, file_path: str) -> Optional[str]:
        """Fetch file content from GitHub API"""
        try:
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            content = repo.get_contents(file_path)
            if isinstance(content, list):
                return None
            return content.decoded_content.decode("utf-8")
        except:
            return None

    def get_recent_commits(self, owner: str, repo_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent commits from GitHub API"""
        try:
            repo = self.client.get_repo(f"{owner}/{repo_name}")
            commits = repo.get_commits()[:limit]

            return [
                {
                    "sha": commit.sha,
                    "message": commit.commit.message,
                    "author": commit.commit.author.name,
                    "date": commit.commit.author.date.isoformat(),
                    "url": commit.html_url
                }
                for commit in commits
            ]
        except GithubException:
            return []

    def get_user_repositories(self) -> List[Dict[str, Any]]:
        """Fetch all repositories for the authenticated user"""
        try:
            repos = self.client.get_user().get_repos()
            return [
                {
                    "name": repo.name,
                    "owner": repo.owner.login,
                    "description": repo.description or "",
                    "language": repo.language or "Unknown",
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "visibility": "Private" if repo.private else "Public",
                    "repository_url": repo.html_url,
                }
                for repo in repos
            ]
        except Exception as e:
            print(f"Error fetching user repositories: {str(e)}")
            return []

    def _get_language_color(self, language: Optional[str]) -> str:
        """Return color code for programming language"""
        colors = {
            "Python": "#3572A5",
            "JavaScript": "#f1e05a",
            "TypeScript": "#2b7489",
            "Java": "#b07219",
            "Go": "#00ADD8",
            "Rust": "#dea584",
            "C++": "#f34b7d",
            "C": "#555555",
            "Ruby": "#701516",
            "PHP": "#4F5D95",
        }
        return colors.get(language or "Unknown", "#808080")

github_client = GitHubClient()
