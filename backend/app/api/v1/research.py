from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.schemas.research_agent import ResearchRequest, ResearchReport, ResearchStreamEvent
from app.agents.research_agent import get_research_agent
from app.core.service_registry import services
from app.api.v1.auth import get_current_user
from app.services import research_workspace_service as workspace_svc
import json
from datetime import datetime
from loguru import logger
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# SSE response headers that prevent intermediate proxy / nginx buffering
_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",     # Disable nginx buffering for SSE
    "Connection": "keep-alive",
}


@router.post("/deep-research", response_model=ResearchReport)
@limiter.limit("5/minute")
async def deep_research(
    request: Request,
    research_request: ResearchRequest,
    current_user=Depends(get_current_user),
):
    """Execute deep research on a topic (blocking, non-streaming)."""
    omni_rag = services.get_omni_rag()
    agent = get_research_agent(omni_rag)

    try:
        report = await agent.research(
            request=research_request,
            user_id=str(current_user.id),
        )
        return report
    except Exception as e:
        logger.exception("Blocking research endpoint error")
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@router.post("/deep-research/stream")
@limiter.limit("5/minute")
async def stream_deep_research(
    request: Request,
    research_request: ResearchRequest,
    current_user=Depends(get_current_user),
):
    """Stream deep research progress in real-time via Server-Sent Events."""
    omni_rag = services.get_omni_rag()
    agent = get_research_agent(omni_rag)

    async def event_generator():
        try:
            async for event in agent.stream_research(
                request=research_request,
                user_id=str(current_user.id),
            ):
                yield f"data: {event.model_dump_json()}\n\n"

                # Persist workspace data on completion so that subsequent
                # GET /workspace/sources|clusters|graph-nodes return real data.
                if event.event_type == "complete":
                    report = event.data.get("report")
                    if report is not None:
                        await workspace_svc.save_workspace_from_report(
                            user_id=str(current_user.id),
                            report=report,
                        )
        except Exception as e:
            logger.exception("Streaming research endpoint error")
            # Emit a well-formed terminal error event so the frontend parser
            # can always deserialise a valid ResearchStreamEvent.
            error_payload = {
                "event_type": "error",
                "data": {"message": str(e), "phase": "error"},
                "timestamp": datetime.utcnow().isoformat(),
                "progress_percent": 0.0,
            }
            yield f"data: {json.dumps(error_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )
