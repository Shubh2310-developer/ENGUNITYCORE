"""
Research Workspace API Router
==============================
Endpoints:
  GET  /api/v1/research/workspace/sources
  GET  /api/v1/research/workspace/clusters
  GET  /api/v1/research/workspace/graph-nodes
  POST /api/v1/research/workspace/tool-invoke

All endpoints require a valid JWT (same pattern as existing research.py).
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.v1.auth import get_current_user
from app.schemas.workspace_schemas import (
    ToolInvokeRequest,
    ToolInvokeResponse,
    WorkspaceClustersResponse,
    WorkspaceGraphNodesResponse,
    WorkspaceSourcesResponse,
)
from app.services import research_workspace_service as svc

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


# ─── Data Endpoints ───────────────────────────────────────────────────────────

@router.get("/workspace/sources", response_model=WorkspaceSourcesResponse)
async def get_workspace_sources(
    project_id: str | None = None,
    current_user=Depends(get_current_user),
):
    """Return the sources list for the Research Workspace."""
    sources = await svc.get_sources(str(current_user.id), project_id)
    return WorkspaceSourcesResponse(sources=sources, project_id=project_id)


@router.get("/workspace/clusters", response_model=WorkspaceClustersResponse)
async def get_workspace_clusters(
    project_id: str | None = None,
    current_user=Depends(get_current_user),
):
    """Return research cluster progress data."""
    clusters = await svc.get_clusters(str(current_user.id), project_id)
    return WorkspaceClustersResponse(clusters=clusters, project_id=project_id)


@router.get("/workspace/graph-nodes", response_model=WorkspaceGraphNodesResponse)
async def get_workspace_graph_nodes(
    project_id: str | None = None,
    current_user=Depends(get_current_user),
):
    """Return the knowledge graph nodes."""
    nodes = await svc.get_graph_nodes(str(current_user.id), project_id)
    return WorkspaceGraphNodesResponse(nodes=nodes, project_id=project_id)


# ─── Tool Invoke Endpoint ─────────────────────────────────────────────────────

@router.post("/workspace/tool-invoke", response_model=ToolInvokeResponse)
@limiter.limit("20/minute")
async def invoke_workspace_tool(
    request: Request,
    body: ToolInvokeRequest,
    current_user=Depends(get_current_user),
):
    """
    Invoke an AI intelligence tool against the provided research context.

    Tool keys:
      gap | comparator | assumption | strength | question |
      argument | resolver | coherence | challenger
    """
    try:
        response = await svc.invoke_tool(
            tool=body.tool,
            context=body.context,
            sources=body.sources,
        )
        return response
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Tool invocation failed: {exc}")
