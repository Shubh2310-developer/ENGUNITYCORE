from typing import Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
import os
import uuid
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.code import CodeProject, CodeFile
from app.schemas.code import (
    CodeProject as CodeProjectSchema, 
    CodeProjectCreate, 
    CodeProjectUpdate,
    CodeFile as CodeFileSchema,
    CodeFileCreate,
    CodeFileUpdate
)
from app.services.storage.supabase import storage_service
from app.services.ai.dependencies import get_vector_store
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[CodeProjectSchema])
def get_code_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve code projects for the current user.
    """
    projects = db.query(CodeProject).filter(CodeProject.user_id == current_user.id).all()
    return projects

@router.post("/", response_model=CodeProjectSchema)
async def create_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_in: CodeProjectCreate,
) -> Any:
    """
    Create a new code project.
    """
    db_obj = CodeProject(
        **project_in.model_dump(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/{project_id}/upload", response_model=CodeProjectSchema)
async def upload_project_files(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file: UploadFile = File(...),
) -> Any:
    """
    Upload project files (e.g., zip, source files) to Supabase Storage.
    Also indexes file content in FAISS for code search/RAG.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")

    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_id}{extension}"

    # Read file content
    content = await file.read()

    # 1. Upload to Supabase Storage
    try:
        storage_path = f"{current_user.id}/projects/{project_id}/{safe_filename}"
        await storage_service.upload_file(
            bucket="code",
            path=storage_path,
            file_content=content,
            content_type=file.content_type
        )
        project.storage_path = storage_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud storage error: {str(e)}")

    # 2. Index in FAISS for RAG
    try:
        # For simplicity, we assume text extraction or use a library for source code
        text_content = content.decode('utf-8', errors='ignore')
        if len(text_content.strip()) > 0:
            vs = get_vector_store()
            vs.add_texts(
                texts=[text_content],
                metadatas=[{
                    "project_id": project_id,
                    "user_id": current_user.id,
                    "filename": file.filename,
                    "type": "code_source"
                }]
            )
    except Exception as e:
        print(f"FAISS indexing error: {e}")

    db.add(project)
    db.commit()
    db.refresh(project)

    return project

@router.get("/{project_id}", response_model=CodeProjectSchema)
def get_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
) -> Any:
    """
    Get a specific code project by ID.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    return project

@router.patch("/{project_id}", response_model=CodeProjectSchema)
def update_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    project_in: CodeProjectUpdate,
) -> Any:
    """
    Update code project metadata.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", response_model=CodeProjectSchema)
async def delete_code_project(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
) -> Any:
    """
    Delete a code project from Postgres and Supabase Storage.
    """
    project = db.query(CodeProject).filter(CodeProject.id == project_id, CodeProject.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")

    # Delete from Supabase Storage (would need to list and delete all files in project folder)
    if project.storage_path:
        try:
            await storage_service.delete_file("code", project.storage_path)
        except Exception:
            pass

    db.delete(project)
    db.commit()
    return project

# ==================== File Management Endpoints ====================

@router.get("/{project_id}/files", response_model=List[CodeFileSchema])
def get_project_files(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
) -> Any:
    """
    Get all files for a code project (returns tree structure).
    """
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id, 
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    return files

@router.post("/{project_id}/files", response_model=CodeFileSchema)
def create_project_file(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_in: CodeFileCreate,
) -> Any:
    """
    Create a new file in the project.
    """
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    db_file = CodeFile(
        **file_in.model_dump(),
        project_id=project_id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.get("/{project_id}/files/{file_id}", response_model=CodeFileSchema)
def get_project_file(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_id: str,
) -> Any:
    """
    Get a specific file by ID.
    """
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    file = db.query(CodeFile).filter(
        CodeFile.id == file_id,
        CodeFile.project_id == project_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file

@router.patch("/{project_id}/files/{file_id}", response_model=CodeFileSchema)
def update_project_file(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_id: str,
    file_in: CodeFileUpdate,
) -> Any:
    """
    Update a file's content or metadata.
    """
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    file = db.query(CodeFile).filter(
        CodeFile.id == file_id,
        CodeFile.project_id == project_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    update_data = file_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(file, field, value)
    
    db.add(file)
    db.commit()
    db.refresh(file)
    return file

@router.delete("/{project_id}/files/{file_id}", response_model=CodeFileSchema)
def delete_project_file(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_id: str,
) -> Any:
    """
    Delete a file from the project.
    """
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    file = db.query(CodeFile).filter(
        CodeFile.id == file_id,
        CodeFile.project_id == project_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    db.delete(file)
    db.commit()
    return file

# ==================== AI-Powered Features ====================

@router.post("/{project_id}/ai/analyze")
async def analyze_code_with_ai(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_id: Optional[str] = None,
) -> Any:
    """
    Analyze code using AI (code review, suggestions, bug detection).
    """
    from app.services.ai.groq_client import groq_client
    
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    # Get file content
    if file_id:
        file = db.query(CodeFile).filter(
            CodeFile.id == file_id,
            CodeFile.project_id == project_id
        ).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        code_content = file.content or ""
        language = file.language or project.language or "unknown"
    else:
        # Analyze entire project
        files = db.query(CodeFile).filter(
            CodeFile.project_id == project_id,
            CodeFile.type == "file"
        ).all()
        code_content = "\n\n".join([f"// File: {f.path}\n{f.content}" for f in files if f.content])
        language = project.language or "unknown"
    
    # Use AI to analyze
    prompt = f"""You are an expert code reviewer. Analyze the following {language} code and provide:
1. Code quality assessment (1-10)
2. Potential bugs or issues
3. Performance improvements
4. Best practice recommendations
5. Security concerns

Code:
```{language}
{code_content[:4000]}  # Limit to avoid token limits
```

Provide a structured analysis in JSON format."""

    try:
        analysis = await groq_client.get_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3
        )
        
        return {
            "analysis": analysis,
            "language": language,
            "lines_analyzed": len(code_content.split("\n")),
            "project_id": project_id,
            "file_id": file_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/{project_id}/ai/suggest")
async def get_code_suggestions(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_id: str,
    cursor_position: dict,
    context: str,
) -> Any:
    """
    Get AI-powered code completion suggestions.
    """
    from app.services.ai.groq_client import groq_client
    
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    file = db.query(CodeFile).filter(
        CodeFile.id == file_id,
        CodeFile.project_id == project_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    prompt = f"""Complete the following {file.language or 'code'} based on context:

Context:
{context}

Provide 3 completion suggestions. Return only the code completions, no explanations."""

    try:
        suggestions = await groq_client.get_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.5
        )
        
        return {
            "suggestions": suggestions,
            "file_id": file_id,
            "language": file.language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestions failed: {str(e)}")

@router.post("/{project_id}/search")
async def search_code(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    query: str,
) -> Any:
    """
    Semantic code search using FAISS vector store.
    """
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    # Search using FAISS
    try:
        vs = get_vector_store()
        results = vs.similarity_search(
            query=query,
            k=5,
            filter={"project_id": project_id}
        )
        
        return {
            "query": query,
            "results": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": getattr(doc, "score", None)
                }
                for doc in results
            ]
        }
    except Exception as e:
        return {
            "query": query,
            "results": [],
            "error": str(e)
        }

# ==================== Code Execution Endpoint ====================

@router.post("/{project_id}/execute")
async def execute_code(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: str,
    file_id: str,
    language: Optional[str] = None,
    stdin_data: Optional[str] = None,
) -> Any:
    """
    Execute code from a file in a secure sandbox.
    """
    from app.services.code_execution.sandbox import code_sandbox
    
    project = db.query(CodeProject).filter(
        CodeProject.id == project_id,
        CodeProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Code project not found")
    
    file = db.query(CodeFile).filter(
        CodeFile.id == file_id,
        CodeFile.project_id == project_id
    ).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.content:
        raise HTTPException(status_code=400, detail="File has no content to execute")
    
    # Determine language
    exec_language = language or file.language or project.language or 'python'
    
    # Execute in sandbox
    try:
        result = await code_sandbox.execute_code(
            code=file.content,
            language=exec_language,
            timeout=30,
            stdin_data=stdin_data
        )
        
        return {
            "project_id": project_id,
            "file_id": file_id,
            "file_name": file.name,
            "language": exec_language,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

# ==================== Direct Code Execution (No Auth Required for Testing) ====================

from pydantic import BaseModel

class CodeExecutionRequest(BaseModel):
    code: str
    language: str = "python"
    filename: str = "code"
    stdin_data: Optional[str] = None

@router.post("/execute-direct")
async def execute_code_direct(
    request: CodeExecutionRequest
) -> Any:
    """
    Execute code directly without authentication (for testing).
    This is a convenience endpoint for the Code Lab UI.
    """
    from app.services.code_execution.sandbox import code_sandbox
    
    try:
        result = await code_sandbox.execute_code(
            code=request.code,
            language=request.language,
            timeout=30,
            stdin_data=request.stdin_data
        )
        
        return {
            **result,
            "filename": request.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

# Also support JSON body
@router.post("/execute-direct-json")
async def execute_code_direct_json(
    request: dict
) -> Any:
    """
    Execute code directly with JSON body (no auth required for testing).
    """
    from app.services.code_execution.sandbox import code_sandbox
    
    code = request.get('code', '')
    language = request.get('language', 'python')
    filename = request.get('filename', 'code')
    
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    
    try:
        result = await code_sandbox.execute_code(
            code=code,
            language=language,
            timeout=30
        )
        
        return {
            **result,
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

# ==================== AI Refine Panel Endpoints ====================

class AIAssistRequest(BaseModel):
    code: str
    language: str
    action: str  # optimize, security, refactor, explain
    filename: str

class AIChatRequest(BaseModel):
    message: str
    code: str
    language: str
    filename: str
    conversation_history: List[dict] = []

class AIInlineCompletionRequest(BaseModel):
    before: str
    after: str
    language: str
    position: dict

@router.post("/ai-assist")
async def ai_assist_code(
    request: AIAssistRequest
) -> Any:
    """
    AI assistance for code optimization, security, refactoring, and explanation.
    No authentication required for Code Lab testing.
    """
    from app.services.ai.groq_client import groq_client
    
    action_prompts = {
        "optimize": f"""You are an expert performance optimizer. Analyze this {request.language} code and provide a structured response.

### 1. Performance Analysis
Identify bottlenecks, time/space complexity issues, and inefficient patterns.

### 2. Optimization Strategy
Explain how the code can be made faster or more memory-efficient.

### 3. Optimized Code
Provide the complete, optimized version of the code in a single markdown code block.

### 4. Expected Gains
Briefly describe the performance improvements.

Code ({request.filename}):
```{request.language}
{request.code[:3000]}
```""",

        "security": f"""You are a senior security engineer. Conduct a security audit of this {request.language} code.

### 1. Vulnerability Assessment
List any security risks (injection, sensitive data exposure, etc.) with severity levels (Low/Medium/High/Critical).

### 2. Best Practices
Identify where the code deviates from industry security standards.

### 3. Recommended Fixes
Provide specific code changes or architectural adjustments to mitigate risks.

### 4. Security Score
Provide a security score from 1-10.

Code ({request.filename}):
```{request.language}
{request.code[:3000]}
```""",

        "refactor": f"""You are a principal software architect. Refactor this {request.language} code for production quality.

### 1. Architectural Review
Critique the current structure, naming conventions, and adherence to SOLID/DRY principles.

### 2. Refactoring Plan
List the specific structural changes made.

### 3. Refactored Code
Provide the complete, refactored version of the code in a single markdown code block. Use clear naming and include concise docstrings/comments.

### 4. Implementation Notes
Explain any design patterns or advanced features used.

Code ({request.filename}):
```{request.language}
{request.code[:3000]}
```""",

        "explain": f"""You are a senior technical lead. Explain this {request.language} code for a new team member.

### 1. High-Level Summary
What is the primary purpose of this code?

### 2. Logic Breakdown
Walk through the execution flow step-by-step.

### 3. Key Concepts
Explain any complex algorithms, libraries, or patterns used.

### 4. Edge Cases & Reliability
Mention how the code handles errors or unusual inputs.

### 5. Suggested Next Steps
How could a developer further improve or extend this code?

Code ({request.filename}):
```{request.language}
{request.code[:3000]}
```"""
    }
    
    prompt = action_prompts.get(request.action)
    if not prompt:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")
    
    try:
        response = await groq_client.get_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3 if request.action in ["optimize", "security"] else 0.5
        )
        
        # Extract improved code if optimization or refactoring
        improved_code = None
        if request.action in ["optimize", "refactor"]:
            # Try to extract code block from response
            import re
            code_blocks = re.findall(r'```[\w]*\n(.*?)\n```', response, re.DOTALL)
            if code_blocks:
                improved_code = code_blocks[0]
        
        return {
            "action": request.action,
            "response": response,
            "improved_code": improved_code,
            "language": request.language,
            "filename": request.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI assistance failed: {str(e)}")

@router.post("/ai-chat")
async def ai_chat_code(
    request: AIChatRequest
) -> Any:
    """
    Interactive AI chat for code assistance.
    No authentication required for Code Lab testing.
    """
    from app.services.ai.groq_client import groq_client
    
    # Build conversation context
    messages = []
    
    # System message
    system_msg = f"""You are an expert programming assistant helping with {request.language} code.
The current file is: {request.filename}

Code context:
```{request.language}
{request.code[:2000]}
```

Provide helpful, accurate, and concise answers. Use code examples when appropriate."""
    
    messages.append({"role": "system", "content": system_msg})
    
    # Add conversation history (last 10 messages)
    for msg in request.conversation_history[-10:]:
        if msg.get('role') in ['user', 'assistant']:
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
    
    # Add current message
    messages.append({"role": "user", "content": request.message})
    
    try:
        response = await groq_client.get_completion(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000
        )
        
        return {
            "response": response,
            "language": request.language,
            "filename": request.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@router.post("/ai-inline-complete")
async def ai_inline_complete(
    request: AIInlineCompletionRequest
) -> Any:
    """
    Generate AI inline completions (GitHub Copilot style).
    No authentication required for Code Lab testing.
    """
    from app.services.ai.groq_client import groq_client

    prompt = f"""You are an expert code completion AI. Given the code context, generate the most likely continuation.

Rules:
1. Generate only the next 1-3 lines of code
2. Match the existing code style and indentation
3. Do not include explanations
4. Return only raw code
5. Do not repeat the code from the context

Language: {request.language}
Context Before Cursor:
```{request.language}
{request.before}
```

Context After Cursor:
```{request.language}
{request.after}
```

Complete the code at the cursor position:"""

    try:
        completion = await groq_client.get_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=100
        )

        # Parse and clean completion
        # Remove any markdown code blocks if present
        if "```" in completion:
            import re
            code_blocks = re.findall(r'```[\w]*\n(.*?)\n```', completion, re.DOTALL)
            if code_blocks:
                completion = code_blocks[0]
            else:
                completion = completion.replace("```", "")

        lines = completion.strip().split('\n')

        return {
            "completions": lines[:3],  # Return top 3 lines/completions
            "language": request.language
        }
    except Exception as e:
        # Log error but return empty completions to avoid breaking UI
        print(f"Inline completion error: {e}")
        return {"completions": []}

@router.post("/ai-complete")
async def ai_code_completion(
    code_context: str,
    language: str,
    cursor_line: int,
    cursor_column: int
) -> Any:
    """
    AI-powered code completion.
    """
    from app.services.ai.groq_client import groq_client
    
    prompt = f"""Complete the following {language} code at cursor position (line {cursor_line}):

```{language}
{code_context}
```

Provide 3 most likely completions. Return only the code suggestions, no explanations."""
    
    try:
        response = await groq_client.get_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=200
        )
        
        # Parse suggestions
        suggestions = response.split('\n')[:3]
        
        return {
            "suggestions": suggestions,
            "language": language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code completion failed: {str(e)}")
