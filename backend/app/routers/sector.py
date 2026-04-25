from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import IloSector, Sector
from app.models.user import User
from app.schemas.sector import SectorCreate, SectorResponse, SectorUpdate
from app.services.ai import classify_ilo_sector

router = APIRouter(prefix="/api/sectors", tags=["Sectors"])


@router.get("/", response_model=list[SectorResponse])
def list_sectors(db: Session = Depends(get_db)):
    sectors = db.scalars(select(Sector).order_by(Sector.id)).all()
    return sectors


@router.get("/{sector_id}", response_model=SectorResponse)
def get_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = db.get(Sector, sector_id)
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return sector


@router.post("/", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(
    body: SectorCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    ilo = db.get(IloSector, body.ilo_sector_id)
    if not ilo:
        raise HTTPException(status_code=400, detail="Invalid ilo_sector_id")

    sector = Sector(
        title=body.title,
        description=body.description,
        ilo_sector_id=body.ilo_sector_id,
    )
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


@router.put("/{sector_id}", response_model=SectorResponse)
def update_sector(
    sector_id: int,
    body: SectorUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    sector = db.get(Sector, sector_id)
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")

    if body.ilo_sector_id is not None:
        ilo = db.get(IloSector, body.ilo_sector_id)
        if not ilo:
            raise HTTPException(status_code=400, detail="Invalid ilo_sector_id")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(sector, field, value)

    db.commit()
    db.refresh(sector)
    return sector


@router.delete("/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    sector = db.get(Sector, sector_id)
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    db.delete(sector)
    db.commit()


class ClassifyRequest(BaseModel):
    title: str
    description: str | None = None


class ClassifyResponse(BaseModel):
    ilo_sector_id: int
    ilo_sector_name: str


@router.post("/classify", response_model=ClassifyResponse)
def classify_sector(
    body: ClassifyRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    ilo_sectors = [
        {"id": s.id, "name": s.name}
        for s in db.scalars(select(IloSector).order_by(IloSector.id)).all()
    ]

    result = classify_ilo_sector(body.title, body.description, ilo_sectors)
    if result is None:
        raise HTTPException(
            status_code=422,
            detail="Could not classify the sector. Please select manually.",
        )

    matched = next(s for s in ilo_sectors if s["id"] == result)
    return ClassifyResponse(ilo_sector_id=result, ilo_sector_name=matched["name"])
