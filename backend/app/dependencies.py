from collections.abc import Generator

from sqlalchemy import Session

from app.database import SessionLocal


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
