from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.country import router as country_router
from app.routers.education_level import router as education_level_router
from app.routers.ilo_sector import router as ilo_sector_router
from app.routers.isced_level import router as isced_level_router
from app.routers.language import router as language_router
from app.routers.occupation import router as occupation_router
from app.routers.occupation_group import router as occupation_group_router
from app.routers.profile import router as profile_router
from app.routers.sector import router as sector_router
from app.routers.settlement import router as settlement_router
from app.routers.career_match import router as career_match_router
from app.routers.labor_market import router as labor_market_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_url,
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["POST", "GET", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(health.router)
    app.include_router(auth_router)
    app.include_router(admin_router)
    app.include_router(country_router)
    app.include_router(education_level_router)
    app.include_router(ilo_sector_router)
    app.include_router(isced_level_router)
    app.include_router(language_router)
    app.include_router(occupation_router)
    app.include_router(occupation_group_router)
    app.include_router(profile_router)
    app.include_router(sector_router)
    app.include_router(settlement_router)
    app.include_router(career_match_router)
    app.include_router(labor_market_router)

    return app


app = create_app()
