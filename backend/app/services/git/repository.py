import os
import shutil
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

class GitCommit(BaseModel):
    hexsha: str
    message: str
    author: str
    date: datetime

class GitStatus(BaseModel):
    active_branch: str
    is_dirty: bool
    changed_files: List[str]
    untracked_files: List[str]

class GitRepository:
    """
    Git repository manager using local file system + git CLI or python-git.
    Using simplified mock/shell implementation for robustness in this environment.
    """

    def __init__(self, root_path: str):
        self.root_path = root_path

    def _run_git(self, args: List[str]) -> str:
        import subprocess

        try:
            result = subprocess.run(
                ['git'] + args,
                cwd=self.root_path,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            raise Exception(f"Git command failed: {e.stderr}")

    def init(self):
        if not os.path.exists(os.path.join(self.root_path, '.git')):
            self._run_git(['init'])
            # Config for the repo
            self._run_git(['config', 'user.email', 'user@engunity.com'])
            self._run_git(['config', 'user.name', 'Engunity User'])

    def get_status(self) -> GitStatus:
        if not os.path.exists(os.path.join(self.root_path, '.git')):
            return GitStatus(
                active_branch="none",
                is_dirty=False,
                changed_files=[],
                untracked_files=[]
            )

        # Get branch
        try:
            branch = self._run_git(['branch', '--show-current'])
        except:
            branch = "main" # Fallback

        # Get status
        status_out = self._run_git(['status', '--porcelain'])

        changed = []
        untracked = []

        for line in status_out.split('\n'):
            if not line: continue
            code = line[:2]
            file = line[3:]

            if '??' in code:
                untracked.append(file)
            else:
                changed.append(file)

        return GitStatus(
            active_branch=branch or "HEAD",
            is_dirty=len(changed) > 0 or len(untracked) > 0,
            changed_files=changed,
            untracked_files=untracked
        )

    def add(self, files: List[str] = ['.']):
        self._run_git(['add'] + files)

    def commit(self, message: str):
        self._run_git(['commit', '-m', message])

    def get_log(self, limit: int = 10) -> List[GitCommit]:
        if not os.path.exists(os.path.join(self.root_path, '.git')):
            return []

        try:
            # format: hash|author|date|message
            log_fmt = "%H|%an|%aI|%s"
            out = self._run_git(['log', f'-n{limit}', f'--format={log_fmt}'])

            commits = []
            for line in out.split('\n'):
                if not line: continue
                parts = line.split('|', 3)
                if len(parts) < 4: continue

                commits.append(GitCommit(
                    hexsha=parts[0],
                    author=parts[1],
                    date=datetime.fromisoformat(parts[2]),
                    message=parts[3]
                ))
            return commits
        except:
            return []

class GitService:
    def get_repo(self, project_id: str, user_id: str) -> GitRepository:
        # In a real app, resolve path from project DB
        # For this prototype, we'll use a fixed path structure
        # Assuming projects are at /tmp/engunity_projects/{user_id}/{project_id}
        # OR using the path from CodeProject model if we have access

        base_path = f"/tmp/engunity_projects/{project_id}"
        os.makedirs(base_path, exist_ok=True)
        return GitRepository(base_path)

git_service = GitService()
