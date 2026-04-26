from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.isced_level import IscedLevel
from app.schemas.education_level import IscedLevelResponse

router = APIRouter(prefix="/api/isced-levels", tags=["ISCED Levels"])


@router.get("/", response_model=list[IscedLevelResponse])
def list_isced_levels(db: Session = Depends(get_db)):
    return db.scalars(select(IscedLevel).order_by(IscedLevel.level)).all()
