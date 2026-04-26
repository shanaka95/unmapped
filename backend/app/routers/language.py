from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db
from app.models.language import Language
from app.schemas.language import LanguageResponse, LanguageWithCountriesResponse

router = APIRouter(prefix="/api/languages", tags=["Languages"])


@router.get("/", response_model=list[LanguageResponse])
def list_languages(search: str | None = None, db: Session = Depends(get_db)):
    query = select(Language).order_by(Language.name)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Language.name.ilike(search_filter),
                Language.code.ilike(search_filter)
            )
        )
    return db.scalars(query).all()


@router.get("/{language_id}", response_model=LanguageWithCountriesResponse)
def get_language(language_id: int, db: Session = Depends(get_db)):
    language = db.scalars(
        select(Language)
        .options(joinedload(Language.countries))
        .where(Language.id == language_id)
    ).unique().first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language
