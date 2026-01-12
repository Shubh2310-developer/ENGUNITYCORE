from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.mongodb import connect_to_mongo, close_mongo_connection
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.code import router as code_router
from app.api.v1.research import router as research_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.documents import router as documents_router
from app.api.v1.githubrepos import router as github_router
from app.api.v1.decisions import router as decisions_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
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
