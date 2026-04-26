from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies import get_admin_user, get_db
from app.models.occupation import Occupation
from app.models.sector import Sector
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def get_admin_stats(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total_users = db.execute(select(func.count()).select_from(User)).scalar()
    verified_users = db.execute(
        select(func.count()).select_from(User).where(User.is_verified == True)
    ).scalar()

    total_sectors = db.execute(select(func.count()).select_from(Sector)).scalar()
    total_occupations = db.execute(select(func.count()).select_from(Occupation)).scalar()

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "total_sectors": total_sectors,
        "total_occupations": total_occupations,
        "admin": UserResponse.model_validate(_admin).model_dump(),
    }


@router.get("/users", response_model=list[UserResponse])
def list_users(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    users = db.execute(select(User).order_by(User.id)).scalars().all()
    return [UserResponse.model_validate(u) for u in users]
