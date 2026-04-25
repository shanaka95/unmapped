from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.isco_occupation_group import IscoOccupationGroup
from app.models.occupation import Occupation
from app.models.user import User
from app.schemas.occupation import OccupationCreate, OccupationResponse, OccupationUpdate

router = APIRouter(prefix="/api/occupations", tags=["Occupations"])


@router.get("/", response_model=list[OccupationResponse])
def list_occupations(
    group_id: int | None = None,
    level: int | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Occupation).order_by(Occupation.code)
    if group_id is not None:
        stmt = stmt.where(Occupation.group_id == group_id)
    if level is not None:
        stmt = stmt.where(Occupation.level == level)
    return db.scalars(stmt).all()


@router.get("/{occupation_id}", response_model=OccupationResponse)
def get_occupation(occupation_id: int, db: Session = Depends(get_db)):
    occupation = db.get(Occupation, occupation_id)
    if not occupation:
        raise HTTPException(status_code=404, detail="Occupation not found")
    return occupation


@router.post("/", response_model=OccupationResponse, status_code=status.HTTP_201_CREATED)
def create_occupation(
    body: OccupationCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    group = db.get(IscoOccupationGroup, body.group_id)
    if not group:
        raise HTTPException(status_code=400, detail="Invalid group_id")

    existing = db.scalar(select(Occupation).where(Occupation.code == body.code))
    if existing:
        raise HTTPException(status_code=409, detail="Occupation with this code already exists")

    occupation = Occupation(**body.model_dump())
    db.add(occupation)
    db.commit()
    db.refresh(occupation)
    return occupation


@router.put("/{occupation_id}", response_model=OccupationResponse)
def update_occupation(
    occupation_id: int,
    body: OccupationUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    occupation = db.get(Occupation, occupation_id)
    if not occupation:
        raise HTTPException(status_code=404, detail="Occupation not found")

    if body.group_id is not None:
        group = db.get(IscoOccupationGroup, body.group_id)
        if not group:
            raise HTTPException(status_code=400, detail="Invalid group_id")

    if body.code is not None and body.code != occupation.code:
        existing = db.scalar(select(Occupation).where(Occupation.code == body.code))
        if existing:
            raise HTTPException(status_code=409, detail="Occupation with this code already exists")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(occupation, field, value)

    db.commit()
    db.refresh(occupation)
    return occupation


@router.delete("/{occupation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_occupation(
    occupation_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    occupation = db.get(Occupation, occupation_id)
    if not occupation:
        raise HTTPException(status_code=404, detail="Occupation not found")
    db.delete(occupation)
    db.commit()
