from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Engunity AI"
    API_V1_STR: str = "/api/v1"
    # SECRET_KEY is required - will raise error if not set in .env
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    AUTH_LOGIN_RATE_LIMIT: str = "30/minute"

    # Database - required, will raise error if not set in .env
    DATABASE_URL: str

    # Supabase Specific
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None
    SUPABASE_AUTH_CALLBACK_URL: Optional[str] = None

    # AI Services
    GROQ_API_KEY: Optional[str] = None
    GROQ_API_KEYS: Optional[str] = None # Comma-separated list for rotation
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    PHI2_LOCAL_PATH: Optional[str] = None

    # GitHub Integration
    GITHUB_TOKEN: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # MongoDB
    MONGODB_URL: Optional[str] = None
    MONGODB_DB_NAME: str = "engunity"

    # AI Services Control (for dev mode with --reload)
    ENABLE_AI: bool = True  # Set to False to disable AI and speed up dev restart
    ENABLE_TURBO_QUANT_CHAT: bool = False

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

settings = Settings()
