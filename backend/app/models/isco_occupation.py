from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IscoOccupation(Base):
    __tablename__ = "isco_occupations"

    id: Mapped[int] = mapped_column(primary_key=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    code: Mapped[str] = mapped_column(String(4), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    definition: Mapped[str | None] = mapped_column(Text, nullable=True)
    tasks_include: Mapped[str | None] = mapped_column(Text, nullable=True)
    included_occupations: Mapped[str | None] = mapped_column(Text, nullable=True)
    excluded_occupations: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("isco_occupation_groups.id"), nullable=True)

    group: Mapped["IscoOccupationGroup"] = relationship(lazy="joined")
