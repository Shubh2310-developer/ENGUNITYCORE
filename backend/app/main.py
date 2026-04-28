from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import traceback

from app.core.config import settings
from app.core.mongodb import connect_to_mongo, close_mongo_connection
from app.core.rate_limit import limiter
from app.core.logging_config import setup_logging
from app.core.socket_manager import sio_app
from app.core.cache_middleware import ResponseCacheMiddleware
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.code import router as code_router
from app.api.v1.research import router as research_router
from app.api.v1.analytics_complete import router as analytics_router
from app.api.v1.documents import router as documents_router
from app.api.v1.githubrepos import router as github_router
from app.api.v1.decisions import router as decisions_router
from app.api.v1.omni_rag import router as omni_rag_router
from app.api.v1.images import router as images_router
from app.api.v1.memory import router as memory_router
from app.api.v1.terminal import router as terminal_router
from app.api.v1.debug import router as debug_router
from app.api.v1.git import router as git_router
from app.api.v1.testing import router as testing_router
from app.api.v1.jobprep import router as jobprep_router
from app.api.v1.agent_tools import router as agent_tools_router
from app.api.v1.coding_team import router as coding_team_router
from app.api.v1.wellbeing import router as wellbeing_router

ALLOWED_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
}


def _cors_error_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    # Initialize Centralized Logging
    setup_logging()
    
    # Background warmup for AI services (non-blocking)
    import asyncio
    from app.core.service_registry import services
    
    async def warmup_ai_services():
        """Background task to warm up AI services after server starts"""
        await asyncio.sleep(1)  # Reduced delay for faster warmup
        
        # Parallel loading of AI services for faster startup
        try:
            await asyncio.gather(
                asyncio.to_thread(lambda: services.get_vector_store() if services.is_ai_enabled() else None),
                asyncio.to_thread(lambda: services.get_reranker() if services.is_ai_enabled() else None),
                asyncio.to_thread(lambda: services.get_classifier() if services.is_ai_enabled() else None),
                return_exceptions=True
            )
            logger.info("✅ AI services warmed up in parallel")
        except Exception as e:
            logger.error(f"⚠️  AI warmup error (non-critical): {e}")
    
    # Start warmup in background (non-blocking)
    asyncio.create_task(warmup_ai_services())
    
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Add Rate Limiter state and handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount Socket.IO FIRST, before CORS middleware
# Socket.IO handles its own CORS and is isolated as a sub-application
app.mount("/socket.io", sio_app)

# Add exception handlers for CORS on errors
@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Add CORS headers to Starlette HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_error_headers(request),
    )

@app.exception_handler(FastAPIHTTPException)
async def fastapi_http_exception_handler(request: Request, exc: FastAPIHTTPException):
    """Add CORS headers to FastAPI HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_error_headers(request),
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and add CORS headers"""
    # Log the error
    print(f"Unhandled exception: {exc}")
    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_error_headers(request),
    )

# Add GZip Compression Middleware (compress responses > 1KB)
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add Response Caching Middleware
app.add_middleware(ResponseCacheMiddleware, ttl=300)

# Add CORS middleware last so it's outermost and can attach headers
# to both success and error responses in local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(code_router, prefix=f"{settings.API_V1_STR}/code", tags=["code"])
app.include_router(research_router, prefix=f"{settings.API_V1_STR}/research", tags=["research"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(documents_router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(github_router, prefix=f"{settings.API_V1_STR}/githubrepos", tags=["githubrepos"])
app.include_router(decisions_router, prefix=f"{settings.API_V1_STR}/decisions", tags=["decisions"])
app.include_router(omni_rag_router, prefix=f"{settings.API_V1_STR}/omni-rag", tags=["omni-rag"])
app.include_router(images_router, prefix=f"{settings.API_V1_STR}/images", tags=["images"])
app.include_router(memory_router, prefix=f"{settings.API_V1_STR}/memory", tags=["memory"])
app.include_router(terminal_router, prefix="/ws/terminal", tags=["terminal"])
app.include_router(debug_router, prefix=f"{settings.API_V1_STR}/debug", tags=["debug"])
app.include_router(git_router, prefix=f"{settings.API_V1_STR}/git", tags=["git"])
app.include_router(testing_router, prefix=f"{settings.API_V1_STR}/testing", tags=["testing"])
app.include_router(jobprep_router, prefix=f"{settings.API_V1_STR}/jobprep", tags=["jobprep"])
app.include_router(agent_tools_router, prefix=f"{settings.API_V1_STR}/agent-tools", tags=["agent-tools"])
app.include_router(coding_team_router, prefix=f"{settings.API_V1_STR}/coding-team", tags=["coding-team"])
app.include_router(wellbeing_router, prefix=f"{settings.API_V1_STR}/wellbeing", tags=["wellbeing"])
