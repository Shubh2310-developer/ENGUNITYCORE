import subprocess
import tempfile
import shutil
import os
from pathlib import Path
from app.services.storage.supabase import storage_service

class RepoCloner:
    async def clone_and_store(self, repo_url: str, repo_id: str) -> str:
        """Clone repository and upload to Supabase"""

        # Ensure we have a valid URL
        if not repo_url:
            raise ValueError("Repository URL is required")

        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                # Clone repository (depth 1 for speed and space efficiency)
                subprocess.run(
                    ["git", "clone", "--depth", "1", repo_url, tmpdir],
                    check=True,
                    capture_output=True,
                    text=True
                )

                # Create tar archive
                archive_base = f"/tmp/{repo_id}"
                archive_path = shutil.make_archive(archive_base, 'gztar', tmpdir)

                # Upload to Supabase
                with open(archive_path, 'rb') as f:
                    file_content = f.read()
                    await storage_service.upload_file(
                        bucket="repositories",
                        path=f"{repo_id}/source.tar.gz",
                        file_content=file_content,
                        content_type="application/gzip"
                    )

                # Clean up the temporary archive file
                if os.path.exists(archive_path):
                    os.remove(archive_path)

                return f"{repo_id}/source.tar.gz"
            except subprocess.CalledProcessError as e:
                print(f"Git clone failed: {e.stderr}")
                raise Exception(f"Failed to clone repository: {e.stderr}")
            except Exception as e:
                print(f"Error in clone_and_store: {e}")
                raise e

cloner = RepoCloner()
