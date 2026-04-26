from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Settlement(Base):
    __tablename__ = "settlements"

    id: Mapped[int] = mapped_column(primary_key=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    settlement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    country_code: Mapped[str | None] = mapped_column(String(3), nullable=True)
    population: Mapped[float | None] = mapped_column(Float, nullable=True)
