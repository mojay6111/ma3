from pydantic_settings import BaseSettings
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[3] / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str
    AT_API_KEY: str
    AT_USERNAME: str = "sandbox"
    AT_SENDER_ID: str = "MA3"
    SECRET_KEY: str = "dev_secret"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = str(ENV_FILE)
        extra = "ignore"

settings = Settings()
