from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Engunity AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YC2RymwNNsvEVLtKfBnnSsNag1IrQFjQnHKOsF0V4WAC4pbdFLdQjn8aohGCfWfBqu7ey5EvT9V5X2Anuj/Z5A=="
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    # Supabase Specific
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None

    # AI Services
    GROQ_API_KEY: Optional[str] = None
    PHI2_LOCAL_PATH: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
