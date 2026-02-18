from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.agent_tools import (
    FileReadRequest, FileWriteRequest, FileTreeRequest, CommandExecuteRequest,
    FileOperationResponse, CommandExecuteResponse
)
from app.services.code_execution.file_system import FileSystemService
from loguru import logger

router = APIRouter()

# Instantiate file system service (singleton for now, could be per-request)
fs = FileSystemService()

@router.post("/read", response_model=FileOperationResponse)
async def read_file_content(
    request: FileReadRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Read content from a file within the project sandbox.
    """
    try:
        content = await fs.read_file(request.path)
        return {
            "success": True,
            "data": content,
            "metadata": {"size": len(content)}
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {request.path}")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"File read error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/write", response_model=FileOperationResponse)
async def write_file_content(
    request: FileWriteRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Write content to a file within the project sandbox.
    """
    try:
        success = await fs.write_file(request.path, request.content, request.dry_run)
        return {
            "success": success,
            "metadata": {"size": len(request.content), "dry_run": request.dry_run}
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"File write error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tree", response_model=FileOperationResponse)
async def list_files(
    request: FileTreeRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    List files in a directory within the project sandbox.
    """
    try:
        files = await fs.list_files(request.path, request.depth)
        return {
            "success": True,
            "data": files,
            "metadata": {"count": len(files)}
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Directory not found: {request.path}")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"File listing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exec", response_model=CommandExecuteResponse)
async def execute_shell_command(
    request: CommandExecuteRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Execute a shell command within the project sandbox.
    """
    # Security check: Only allow admin or specifically permitted users
    # For now, we allow all authenticated users but log heavily
    logger.warning(f"User {current_user.email} executing command: {request.command}")

    try:
        result = await fs.execute_command(
            command=request.command,
            cwd=request.cwd,
            timeout=request.timeout,
            dry_run=request.dry_run
        )
        return result
    except Exception as e:
        logger.error(f"Command execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
