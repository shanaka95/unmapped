from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.education_level import EducationLevel
from app.models.isced_level import IscedLevel
from app.models.user import User
from app.schemas.education_level import EducationLevelCreate, EducationLevelResponse, EducationLevelUpdate

router = APIRouter(prefix="/api/education-levels", tags=["Education Levels"])


@router.get("/", response_model=list[EducationLevelResponse])
def list_education_levels(db: Session = Depends(get_db)):
    return db.scalars(select(EducationLevel).order_by(EducationLevel.id)).all()


@router.get("/{education_level_id}", response_model=EducationLevelResponse)
def get_education_level(education_level_id: int, db: Session = Depends(get_db)):
    el = db.get(EducationLevel, education_level_id)
    if not el:
        raise HTTPException(status_code=404, detail="Education level not found")
    return el


@router.post("/", response_model=EducationLevelResponse, status_code=status.HTTP_201_CREATED)
def create_education_level(
    body: EducationLevelCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    isced = db.get(IscedLevel, body.isced_level_id)
    if not isced:
        raise HTTPException(status_code=400, detail="Invalid isced_level_id")

    el = EducationLevel(**body.model_dump())
    db.add(el)
    db.commit()
    db.refresh(el)
    return el


@router.put("/{education_level_id}", response_model=EducationLevelResponse)
def update_education_level(
    education_level_id: int,
    body: EducationLevelUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    el = db.get(EducationLevel, education_level_id)
    if not el:
        raise HTTPException(status_code=404, detail="Education level not found")

    if body.isced_level_id is not None:
        isced = db.get(IscedLevel, body.isced_level_id)
        if not isced:
            raise HTTPException(status_code=400, detail="Invalid isced_level_id")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(el, field, value)

    db.commit()
    db.refresh(el)
    return el


@router.delete("/{education_level_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education_level(
    education_level_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    el = db.get(EducationLevel, education_level_id)
    if not el:
        raise HTTPException(status_code=404, detail="Education level not found")
    db.delete(el)
    db.commit()
