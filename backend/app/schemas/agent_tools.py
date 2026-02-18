from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

class FileReadRequest(BaseModel):
    path: str = Field(..., description="Path to the file to read, relative to project root")
    project_id: Optional[str] = Field(None, description="Project ID context")

class FileWriteRequest(BaseModel):
    path: str = Field(..., description="Path to the file to write, relative to project root")
    content: str = Field(..., description="Content to write to the file")
    project_id: Optional[str] = Field(None, description="Project ID context")
    dry_run: bool = Field(False, description="If true, simulates the write operation without changing the file")

class FileTreeRequest(BaseModel):
    path: Optional[str] = Field(".", description="Directory to list, relative to project root")
    depth: int = Field(2, description="Depth of the tree to return")
    project_id: Optional[str] = Field(None, description="Project ID context")

class CommandExecuteRequest(BaseModel):
    command: str = Field(..., description="Shell command to execute")
    cwd: Optional[str] = Field(None, description="Working directory for execution")
    timeout: int = Field(30, description="Execution timeout in seconds")
    project_id: Optional[str] = Field(None, description="Project ID context")
    dry_run: bool = Field(False, description="If true, returns the command that would be executed without running it")

class FileOperationResponse(BaseModel):
    success: bool
    data: Optional[Union[str, Dict[str, Any], List[Any]]] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CommandExecuteResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
