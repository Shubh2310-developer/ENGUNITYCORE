from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Engunity AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your_secret_key_here" # Change this in .env file
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/database"

    # Supabase Specific
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None

    # AI Services
    GROQ_API_KEY: Optional[str] = None
    GROQ_API_KEYS: Optional[str] = None # Comma-separated list for rotation
    PHI2_LOCAL_PATH: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # MongoDB
    MONGODB_URL: Optional[str] = None
    MONGODB_DB_NAME: str = "engunity"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
