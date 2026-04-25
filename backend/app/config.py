from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Unmapped API"
    debug: bool = False
    database_url: str = "sqlite:///./unmapped.db"

    secret_key: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    resend_api_key: str
    mail_from: str = "noreply@unmapped.vitaz.dev"
    mail_from_name: str = "Unmapped"

    frontend_url: str = "http://localhost:5173"

    model_config = {"env_prefix": "UNMAPPED_", "env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
