from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.schemas.research_agent import ResearchRequest, ResearchReport, ResearchStreamEvent
from app.agents.research_agent import get_research_agent
from app.core.service_registry import services
from app.api.v1.auth import get_current_user
import json
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/deep-research", response_model=ResearchReport)
@limiter.limit("5/minute")
async def deep_research(
    request: Request,
    research_request: ResearchRequest,
    current_user = Depends(get_current_user)
):
    """Execute deep research on a topic (blocking)"""
    omni_rag = services.get_omni_rag()
    agent = get_research_agent(omni_rag)
    
    try:
        report = await agent.research(
            request=research_request,
            user_id=str(current_user.id)
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")

@router.post("/deep-research/stream")
@limiter.limit("5/minute")
async def stream_deep_research(
    request: Request,
    research_request: ResearchRequest,
    current_user = Depends(get_current_user)
):
    """Stream deep research progress in real-time"""
    omni_rag = services.get_omni_rag()
    agent = get_research_agent(omni_rag)
    
    async def event_generator():
        try:
            async for event in agent.stream_research(
                request=research_request,
                user_id=str(current_user.id)
            ):
                yield f"data: {event.model_dump_json()}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'event_type': 'error', 'data': {'message': str(e)}})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
