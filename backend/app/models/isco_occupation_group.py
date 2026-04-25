from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IscoOccupationGroup(Base):
    __tablename__ = "isco_occupation_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    skill_level: Mapped[str] = mapped_column(String(20), nullable=False)

    occupations: Mapped[list["IscoOccupation"]] = relationship(back_populates="group", lazy="select")
