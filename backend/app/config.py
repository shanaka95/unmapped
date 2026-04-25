from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Unmapped API"
    debug: bool = False
    database_url: str = "sqlite:///./unmapped.db"

    model_config = {"env_prefix": "UNMAPPED_"}


settings = Settings()
