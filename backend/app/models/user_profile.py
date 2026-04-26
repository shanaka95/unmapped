import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth: Mapped[datetime.date | None] = mapped_column(nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    settlement_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    education_level_id: Mapped[int | None] = mapped_column(ForeignKey("education_levels.id"), nullable=True)
    informal_work: Mapped[str | None] = mapped_column(Text, nullable=True)
    self_taught_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_step: Mapped[int] = mapped_column(Integer, default=1)
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    education_level: Mapped["EducationLevel | None"] = relationship(lazy="joined")
    user: Mapped["User"] = relationship()
    languages: Mapped[list["UserLanguage"]] = relationship(
        back_populates="profile", lazy="joined", cascade="all, delete-orphan"
    )
    work_experiences: Mapped[list["WorkExperience"]] = relationship(
        back_populates="profile", lazy="select", cascade="all, delete-orphan"
    )


class UserLanguage(Base):
    __tablename__ = "user_languages"
    __table_args__ = (UniqueConstraint("profile_id", "language_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"), nullable=False)

    profile: Mapped["UserProfile"] = relationship(back_populates="languages")
    language: Mapped["Language"] = relationship(lazy="joined")
