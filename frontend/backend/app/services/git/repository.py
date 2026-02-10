import os
from typing import List, Dict, Optional, Any
from git import Repo, Actor
from datetime import datetime

class GitService:
    def __init__(self):
        pass

    def _get_repo_path(self, project_id: str) -> str:
        # In a real implementation, this would map project_id to a physical path
        # For this MVP, we'll use a temporary directory or a mapped volume
        # Assuming projects are stored in /tmp/projects/{project_id} for now
        # or mapped from the CodeProject database entry
        return f"/tmp/projects/{project_id}"

    def init_repo(self, project_id: str) -> Dict[str, Any]:
        path = self._get_repo_path(project_id)
        if not os.path.exists(path):
            os.makedirs(path)

        repo = Repo.init(path)
        return {"status": "initialized", "path": path}

    def get_status(self, project_id: str) -> Dict[str, Any]:
        path = self._get_repo_path(project_id)
        if not os.path.exists(path):
            return {"error": "Repository not found"}

        try:
            repo = Repo(path)
            return {
                "active_branch": repo.active_branch.name,
                "is_dirty": repo.is_dirty(),
                "untracked_files": repo.untracked_files,
                "changed_files": [item.a_path for item in repo.index.diff(None)]
            }
        except Exception as e:
            return {"error": str(e)}

    def commit(self, project_id: str, message: str, author_name: str, author_email: str, files: List[str] = None) -> Dict[str, Any]:
        path = self._get_repo_path(project_id)
        try:
            repo = Repo(path)

            # If files provided, stage specific files, else stage all
            if files:
                repo.index.add(files)
            else:
                repo.git.add(A=True)

            author = Actor(author_name, author_email)
            commit = repo.index.commit(message, author=author)

            return {
                "hexsha": commit.hexsha,
                "message": commit.message,
                "author": commit.author.name,
                "committed_date": commit.committed_datetime.isoformat()
            }
        except Exception as e:
            raise Exception(f"Commit failed: {str(e)}")

    def get_history(self, project_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        path = self._get_repo_path(project_id)
        try:
            repo = Repo(path)
            commits = list(repo.iter_commits(max_count=limit))
            return [{
                "hexsha": c.hexsha,
                "message": c.message,
                "author": c.author.name,
                "date": c.committed_datetime.isoformat()
            } for c in commits]
        except Exception:
            return []

git_service = GitService()
