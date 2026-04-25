from fastapi import FastAPI

from app.config import settings
from app.routers import health


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    app.include_router(health.router)

    return app


app = create_app()
