import os
import glob
import shutil
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
from loguru import logger
from app.core.config import settings

class FileSystemService:
    """
    Secure file system operations for AI agents.
    Enforces sandbox boundaries to prevent unauthorized access.
    """

    def __init__(self, root_dir: str = "."):
        # Resolve to absolute path
        self.root_dir = Path(root_dir).resolve()

    def _validate_path(self, path: str) -> Path:
        """
        Validate that path is within the sandbox root directory.
        Prevents path traversal attacks.
        """
        # Handle absolute paths by making them relative to root if possible,
        # or reject if they point outside
        target_path = Path(path)

        if target_path.is_absolute():
            # If it's absolute, check if it starts with root_dir
            try:
                rel_path = target_path.relative_to(self.root_dir)
                final_path = self.root_dir / rel_path
            except ValueError:
                # If path is absolute but not in root_dir, treat as relative to root_dir
                # This handles cases where agent thinks it's at / but is actually at root_dir
                # Strip leading slashes to make it relative
                clean_path = str(path).lstrip('/')
                final_path = (self.root_dir / clean_path).resolve()
        else:
            final_path = (self.root_dir / path).resolve()

        # Security check: Ensure the resolved path starts with the root directory
        if not str(final_path).startswith(str(self.root_dir)):
            logger.warning(f"Security: Blocked path traversal attempt: {path} -> {final_path}")
            raise ValueError(f"Access denied: Path '{path}' is outside the project root")

        return final_path

    async def read_file(self, path: str) -> str:
        """Read content from a file"""
        try:
            file_path = self._validate_path(path)

            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {path}")

            if not file_path.is_file():
                raise ValueError(f"Not a file: {path}")

            # Run file I/O in thread pool to avoid blocking async loop
            return await asyncio.to_thread(file_path.read_text, encoding='utf-8')

        except Exception as e:
            logger.error(f"Error reading file {path}: {str(e)}")
            raise

    async def write_file(self, path: str, content: str, dry_run: bool = False) -> bool:
        """Write content to a file"""
        try:
            file_path = self._validate_path(path)

            # Dry run check
            if dry_run:
                logger.info(f"Dry run: Would write to {file_path}")
                return True

            # Create parent directories if they don't exist
            if not file_path.parent.exists():
                file_path.parent.mkdir(parents=True, exist_ok=True)

            # Run file I/O in thread pool
            await asyncio.to_thread(file_path.write_text, content, encoding='utf-8')
            return True

        except Exception as e:
            logger.error(f"Error writing file {path}: {str(e)}")
            raise

    async def list_files(self, path: str = ".", depth: int = 2) -> List[Dict[str, Any]]:
        """List files in directory with recursion depth limit"""
        try:
            dir_path = self._validate_path(path)

            if not dir_path.exists():
                raise FileNotFoundError(f"Directory not found: {path}")

            if not dir_path.is_dir():
                raise ValueError(f"Not a directory: {path}")

            def _scan_dir(current_path: Path, current_depth: int) -> List[Dict[str, Any]]:
                if current_depth > depth:
                    return []

                result = []
                try:
                    # Sort for consistent output
                    items = sorted(list(current_path.iterdir()))

                    for item in items:
                        # Skip hidden files/dirs (optional, but good for noise reduction)
                        if item.name.startswith('.') and item.name != '.env':
                            continue

                        # Skip __pycache__ and node_modules
                        if item.name in ['__pycache__', 'node_modules', 'venv', '.git']:
                            continue

                        entry = {
                            "name": item.name,
                            "path": str(item.relative_to(self.root_dir)),
                            "type": "directory" if item.is_dir() else "file"
                        }

                        if item.is_dir():
                            entry["children"] = _scan_dir(item, current_depth + 1)
                        else:
                            entry["size"] = item.stat().st_size

                        result.append(entry)
                except PermissionError:
                    pass # Skip directories we can't read

                return result

            return await asyncio.to_thread(_scan_dir, dir_path, 1)

        except Exception as e:
            logger.error(f"Error listing files in {path}: {str(e)}")
            raise

    async def execute_command(self, command: str, cwd: Optional[str] = None, timeout: int = 30, dry_run: bool = False) -> Dict[str, Any]:
        """Execute a shell command within the sandbox environment"""
        import time

        # Determine working directory
        work_dir = self.root_dir
        if cwd:
            try:
                work_dir = self._validate_path(cwd)
            except Exception:
                # Fallback to root if cwd is invalid
                pass

        # Dry run check
        if dry_run:
            logger.info(f"Dry run: Would execute '{command}' in {work_dir}")
            return {
                "success": True,
                "stdout": f"[Dry Run] Would execute: {command}\nWorking Directory: {work_dir}",
                "stderr": "",
                "exit_code": 0,
                "execution_time": 0
            }

        # Validate command safety (basic check)
        blocked_commands = ['rm -rf /', ':(){ :|:& };:', 'mkfs', 'dd if=/dev/zero']
        for blocked in blocked_commands:
            if blocked in command:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": "Command blocked for security reasons",
                    "exit_code": -1,
                    "execution_time": 0
                }

        start_time = time.time()

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(work_dir)
            )

            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
                exit_code = process.returncode
            except asyncio.TimeoutError:
                process.kill()
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Command execution timed out after {timeout}s",
                    "exit_code": -1,
                    "execution_time": timeout
                }

            execution_time = time.time() - start_time

            return {
                "success": exit_code == 0,
                "stdout": stdout.decode('utf-8', errors='replace'),
                "stderr": stderr.decode('utf-8', errors='replace'),
                "exit_code": exit_code,
                "execution_time": round(execution_time, 3)
            }

        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "exit_code": -1,
                "execution_time": 0
            }

# Global instance pointing to project root
# In a real multi-tenant app, this would be instantiated per-request with the project path
file_system = FileSystemService(root_dir=".")
