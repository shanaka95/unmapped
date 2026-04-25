from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import IloSector
from app.schemas.sector import IloSectorResponse

router = APIRouter(prefix="/ilo-sectors", tags=["ILO Sectors"])


@router.get("/", response_model=list[IloSectorResponse])
def list_ilo_sectors(db: Session = Depends(get_db)):
    return db.scalars(select(IloSector).order_by(IloSector.id)).all()
