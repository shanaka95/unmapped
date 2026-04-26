from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db
from app.models.country import Country
from app.models.language import Language
from app.models.association import language_country
from app.schemas.country import CountryResponse, CountryWithLanguagesResponse, LanguageBrief

router = APIRouter(prefix="/api/countries", tags=["Countries"])


@router.get("/", response_model=list[CountryResponse])
def list_countries(db: Session = Depends(get_db)):
    return db.scalars(select(Country).order_by(Country.name)).all()


@router.get("/{country_id}", response_model=CountryWithLanguagesResponse)
def get_country(country_id: int, db: Session = Depends(get_db)):
    country = db.scalars(
        select(Country)
        .options(joinedload(Country.languages))
        .where(Country.id == country_id)
    ).unique().first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country


@router.get("/{country_id}/languages", response_model=list[LanguageBrief])
def get_country_languages(country_id: int, db: Session = Depends(get_db)):
    country = db.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country.languages


@router.post("/{country_id}/languages", response_model=LanguageBrief, status_code=201)
def add_language_to_country(country_id: int, language_id: int, db: Session = Depends(get_db)):
    country = db.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    language = db.get(Language, language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Check if mapping already exists
    existing = db.execute(
        select(language_country).where(
            language_country.c.language_id == language_id,
            language_country.c.country_id == country_id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Language already linked to this country")

    db.execute(
        language_country.insert().values(language_id=language_id, country_id=country_id)
    )
    db.commit()
    return language


@router.delete("/{country_id}/languages/{language_id}", status_code=204)
def remove_language_from_country(country_id: int, language_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        language_country.delete().where(
            language_country.c.language_id == language_id,
            language_country.c.country_id == country_id
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Language-country link not found")
    db.commit()
