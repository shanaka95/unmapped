from functools import lru_cache
from pathlib import Path

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

    cloudflare_account_id: str
    cloudflare_auth_token: str

    openrouter_api_key: str = ""
    embedding_model: str = "qwen/qwen3-embedding-8b"

    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimax.io/anthropic"
    minimax_model: str = "MiniMax-M2.7"

    @property
    def data_dir(self) -> Path:
        return Path(__file__).resolve().parent.parent / "data"

    model_config = {"env_prefix": "UNMAPPED_", "env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
