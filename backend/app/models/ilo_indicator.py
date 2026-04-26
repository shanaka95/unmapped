"""ILO indicator value model — stores data from all 8 ILO/WB indicator files."""

import enum

from sqlalchemy import Index, Integer, String, Float, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class IndicatorType(enum.Enum):
    INDICATOR_02 = "indicator_02"
    INDICATOR_04 = "indicator_04"
    INDICATOR_10 = "indicator_10"
    INDICATOR_11 = "indicator_11"
    INDICATOR_12 = "indicator_12"
    INDICATOR_13 = "indicator_13"
    INDICATOR_14 = "indicator_14"
    INDICATOR_15 = "indicator_15"


class IloIndicatorValue(Base):
    __tablename__ = "ilo_indicator_values"

    id: Mapped[int] = mapped_column(primary_key=True)
    indicator_type: Mapped[IndicatorType] = mapped_column(
        SQLEnum(IndicatorType), nullable=False, index=True
    )
    ref_area_label: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sex_label: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    classif1_label: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    classif2_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    time: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    obs_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("ix_ilo_values_country_year", "ref_area_label", "time"),
        Index(
            "ix_ilo_values_indicator_country_year",
            "indicator_type",
            "ref_area_label",
            "time",
        ),
    )
