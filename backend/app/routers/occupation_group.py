from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.isco_occupation_group import IscoOccupationGroup
from app.schemas.occupation import OccupationGroupResponse

router = APIRouter(prefix="/api/occupation-groups", tags=["Occupation Groups"])


@router.get("/", response_model=list[OccupationGroupResponse])
def list_occupation_groups(db: Session = Depends(get_db)):
    return db.scalars(select(IscoOccupationGroup).order_by(IscoOccupationGroup.id)).all()
