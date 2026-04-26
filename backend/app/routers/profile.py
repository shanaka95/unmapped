from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_current_user_id, get_db
from app.models.country import Country
from app.models.education_level import EducationLevel
from app.models.language import Language
from app.models.user_profile import UserProfile, UserLanguage
from app.models.work_experience import WorkExperience
from app.schemas.profile import (
    CountryResponse,
    LanguageResponse,
    ProfileResponse,
    ProfileUpdate,
    WorkExperienceCreate,
    WorkExperienceResponse,
)

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _profile_to_response(p: UserProfile) -> ProfileResponse:
    filled = sum(1 for f in [p.date_of_birth, p.country, p.education_level_id, p.languages] if f)
    pct = min(100, int(filled / 4 * 100))
    return ProfileResponse(
        id=p.id,
        user_id=p.user_id,
        date_of_birth=p.date_of_birth,
        country=p.country,
        region=p.region,
        city=p.city,
        latitude=p.latitude,
        longitude=p.longitude,
        settlement_type=p.settlement_type,
        education_level_id=p.education_level_id,
        education_level_name=p.education_level.name if p.education_level else None,
        informal_work=p.informal_work,
        self_taught_skills=p.self_taught_skills,
        monthly_gross_income=p.monthly_gross_income,
        gender=p.gender,
        language_ids=[ul.language_id for ul in p.languages],
        current_step=p.current_step,
        is_complete=p.is_complete,
        completion_pct=pct,
    )


@router.get("/", response_model=ProfileResponse)
def get_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalars().first()

    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return _profile_to_response(profile)


@router.put("/", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalars().first()

    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        db.flush()

    if data.date_of_birth is not None:
        profile.date_of_birth = data.date_of_birth
    if data.country is not None:
        profile.country = data.country
    if data.region is not None:
        profile.region = data.region
    if data.city is not None:
        profile.city = data.city
    if data.latitude is not None:
        profile.latitude = data.latitude
    if data.longitude is not None:
        profile.longitude = data.longitude
    if data.settlement_type is not None:
        profile.settlement_type = data.settlement_type
    if data.education_level_id is not None:
        edu = db.execute(
            select(EducationLevel).where(EducationLevel.id == data.education_level_id)
        ).scalars().first()
        if not edu:
            raise HTTPException(status_code=400, detail="Invalid education_level_id")
        profile.education_level_id = data.education_level_id
    if data.informal_work is not None:
        profile.informal_work = data.informal_work
    if data.self_taught_skills is not None:
        profile.self_taught_skills = data.self_taught_skills
    if data.monthly_gross_income is not None:
        profile.monthly_gross_income = data.monthly_gross_income
    if data.gender is not None:
        profile.gender = data.gender
    if data.language_ids is not None:
        db.execute(
            UserLanguage.__table__.delete().where(UserLanguage.profile_id == profile.id)
        )
        for lang_id in data.language_ids:
            lang = db.execute(
                select(Language).where(Language.id == lang_id)
            ).scalars().first()
            if not lang:
                raise HTTPException(status_code=400, detail=f"Invalid language_id: {lang_id}")
            db.add(UserLanguage(profile_id=profile.id, language_id=lang_id))
    if data.current_step is not None:
        profile.current_step = data.current_step
    if data.is_complete is not None:
        profile.is_complete = data.is_complete

    db.commit()
    db.refresh(profile)

    return _profile_to_response(profile)


@router.get("/countries", response_model=list[CountryResponse])
def list_countries(db: Session = Depends(get_db)):
    rows = db.execute(select(Country).order_by(Country.name)).scalars().all()
    return rows


@router.get("/languages", response_model=list[LanguageResponse])
def list_languages(db: Session = Depends(get_db)):
    rows = db.execute(select(Language).order_by(Language.name)).scalars().all()
    return rows


@router.get("/work-experiences", response_model=list[WorkExperienceResponse])
def list_work_experiences(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalars().first()
    if not profile:
        return []
    experiences = db.execute(
        select(WorkExperience)
        .where(WorkExperience.profile_id == profile.id)
        .order_by(WorkExperience.start_date.desc())
    ).scalars().all()
    return experiences


@router.post("/work-experiences", response_model=WorkExperienceResponse)
def create_work_experience(
    data: WorkExperienceCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalars().first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        db.flush()

    experience = WorkExperience(profile_id=profile.id, **data.model_dump())
    db.add(experience)
    db.commit()
    db.refresh(experience)
    return experience


@router.put("/work-experiences/{experience_id}", response_model=WorkExperienceResponse)
def update_work_experience(
    experience_id: int,
    data: WorkExperienceCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    experience = db.execute(
        select(WorkExperience).where(
            WorkExperience.id == experience_id,
            WorkExperience.profile_id == profile.id,
        )
    ).scalars().first()
    if not experience:
        raise HTTPException(status_code=404, detail="Work experience not found")

    for key, value in data.model_dump().items():
        setattr(experience, key, value)

    db.commit()
    db.refresh(experience)
    return experience


@router.delete("/work-experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_experience(
    experience_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    experience = db.execute(
        select(WorkExperience).where(
            WorkExperience.id == experience_id,
            WorkExperience.profile_id == profile.id,
        )
    ).scalars().first()
    if not experience:
        raise HTTPException(status_code=404, detail="Work experience not found")

    db.delete(experience)
    db.commit()
