from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.code import CodeProject, CodeFile
from app.services.testing.runner import test_runner, TestSuiteResult

router = APIRouter()

class RunTestsRequest(BaseModel):
    project_id: str
    language: str

@router.post("/run", response_model=TestSuiteResult)
async def run_tests(
    request: RunTestsRequest,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user) # Optional for now to ease testing
) -> Any:
    """
    Run tests for a specific project.
    """
    # Verify project exists (skip user check for prototype flexibility if needed,
    # but strictly we should check project.user_id == current_user.id)
    project = db.query(CodeProject).filter(CodeProject.id == request.project_id).first()
    if not project:
        # Fallback for "default-project" used in frontend mocks
        if request.project_id == "default-project":
            # Just create a dummy file list for demonstration if real DB project missing
            pass
        else:
            raise HTTPException(status_code=404, detail="Code project not found")

    # Get all files for the project
    files = []
    if project:
        db_files = db.query(CodeFile).filter(CodeFile.project_id == request.project_id, CodeFile.type == "file").all()
        files = [{'path': f.path or f.name, 'content': f.content or ''} for f in db_files]

    # If no files found (or dummy project), try to fetch from request or mock
    # For a real implementation, we strictly use DB.
    # Here, if files list is empty, the runner will just setup an empty dir and probably fail or do nothing.

    try:
        result = await test_runner.run_tests(
            project_id=request.project_id,
            files=files,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
