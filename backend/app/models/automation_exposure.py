"""Model for automation exposure data from ILO."""
import datetime

from sqlalchemy import Float, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AutomationExposure(Base):
    __tablename__ = "automation_exposure"

    id: Mapped[int] = mapped_column(primary_key=True)
    isco_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    occupation_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mean: Mapped[float] = mapped_column(Float, nullable=False)
    sd: Mapped[float | None] = mapped_column(Float, nullable=True)
    gradient: Mapped[str | None] = mapped_column(String(50), nullable=True)

    __table_args__ = (
        Index("ix_automation_exposure_isco", "isco_code", unique=True),
    )