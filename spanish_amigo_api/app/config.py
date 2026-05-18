from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    """
    This class automatically reads variables from a .env file and validates them.
    If a variable is missing or of the wrong type, Python will catch it immediately
    before the app even starts, ensuring production safety.
    """
    # Application Config
    ENV: str = "development"
    
    # Secrets (FastAPI will validate that these are loaded as strings)
    DATABASE_URL: str = ""
    GEMINI_API_KEY: str = ""
    
    # Instructs Pydantic to read directly from a ".env" file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # If there are extra variables in .env, ignore them
    )

# lru_cache makes sure we only read the .env file ONCE.
# Whenever we call get_settings(), it returns the already loaded keys instantly from memory!
@lru_cache
def get_settings() -> Settings:
    return Settings()
