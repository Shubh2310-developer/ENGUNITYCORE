import ast
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def scan_local_workspace(directory_path: str) -> Dict[str, Any]:
    """
    Recursively scans the local workspace directory, counting files, lines of code,
    AST classes/functions, and extracting library import patterns.
    """
    stats = {
        "files_scanned": 0,
        "total_lines": 0,
        "num_classes": 0,
        "num_functions": 0,
        "imports": set()
    }
    
    # Target only specific file extensions
    target_extensions = (".py", ".ts", ".tsx", ".js")
    ignore_dirs = {"node_modules", ".git", ".next", "dist", "__pycache__", "build", ".tempmediaStorage"}

    if not os.path.exists(directory_path):
        logger.warning("Directory path %s does not exist for scanning", directory_path)
        return stats

    for root, dirs, files in os.walk(directory_path):
        # Prune search tree inline
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            if file.endswith(target_extensions):
                file_path = os.path.join(root, file)
                stats["files_scanned"] += 1
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                        stats["total_lines"] += len(lines)
                        content = "".join(lines)
                        
                    # Use Python's AST parser to inspect backend Python structures
                    if file.endswith(".py") and content.strip():
                        try:
                            tree = ast.parse(content)
                            for node in ast.walk(tree):
                                if isinstance(node, ast.ClassDef):
                                    stats["num_classes"] += 1
                                elif isinstance(node, ast.FunctionDef):
                                    stats["num_functions"] += 1
                                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                                    for name in node.names:
                                        stats["imports"].add(name.name.split('.')[0])
                        except Exception:
                            # Skip AST parse failures on malformed python code
                            pass
                except Exception as exc:
                    logger.warning("Failed to scan file %s: %s", file_path, exc)
                    
    stats["imports"] = sorted(list(stats["imports"]))
    return stats
