from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

_settings = get_settings()

connect_args = {}
if _settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(_settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
